'use strict';
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const zlib = require('node:zlib');
const { isPrivate, makeLookup, blockedError } = require('./netguard');

const UA = 'Mozilla/5.0 (compatible; Seitencheck/1.0)';

// Manche Server senden trotz „identity“ komprimiert – entpacken, mit Größenlimit gegen Zip-Bomben.
function decode(buf, enc, max) {
  const e = String(enc || '').toLowerCase().trim();
  const opt = { finishFlush: zlib.constants.Z_SYNC_FLUSH, maxOutputLength: max };
  try {
    if (e === 'gzip' || e === 'x-gzip') return zlib.gunzipSync(buf, opt);
    if (e === 'deflate') {
      try { return zlib.inflateSync(buf, opt); } catch { return zlib.inflateRawSync(buf, opt); }
    }
    if (e === 'br') return zlib.brotliDecompressSync(buf, { finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH, maxOutputLength: max });
  } catch {
    return Buffer.alloc(0);
  }
  return buf;
}

function err(code) {
  const e = new Error(code);
  e.code = code;
  return e;
}

// Ein einzelner GET-Request ohne Weiterleitung. Liefert Status, Header,
// (gekürzten) HTML-Text und – bei HTTPS – Zertifikatsdaten.
function requestOnce(url, o) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(url); } catch { return reject(err('BAD_URL')); }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return reject(err('BAD_SCHEME'));
    const isHttps = u.protocol === 'https:';
    const port = u.port ? Number(u.port) : (isHttps ? 443 : 80);
    if (!o.allowAnyPort && u.port && port !== 80 && port !== 443) return reject(err('BAD_PORT'));
    const host = u.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && !o.allowPrivate && isPrivate(host)) return reject(blockedError());

    const req = (isHttps ? https : http).request({
      hostname: host,
      port,
      path: u.pathname + u.search,
      method: 'GET',
      agent: false,
      lookup: makeLookup({ allowPrivate: o.allowPrivate, lookup: o.lookup }),
      rejectUnauthorized: false, // Zertifikat wird selbst bewertet, nicht abgebrochen
      servername: net.isIP(host) ? undefined : host,
      ca: o.ca,
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-AT,de;q=0.9,en;q=0.5',
        'Accept-Encoding': 'identity',
      },
    }, (res) => {
      let tls = null;
      if (isHttps && res.socket && typeof res.socket.getPeerCertificate === 'function') {
        const s = res.socket;
        const c = s.getPeerCertificate() || {};
        tls = {
          authorized: s.authorized === true,
          authError: s.authorizationError ? String(s.authorizationError) : null,
          protocol: s.getProtocol(),
          validTo: c.valid_to || null,
          issuer: (c.issuer && (c.issuer.O || c.issuer.CN)) || null,
        };
      }
      const chunks = [];
      let size = 0;
      let cut = false;
      const finish = () => {
        clearTimeout(timer);
        resolve({ url, status: res.statusCode, headers: res.headers, tls, body: decode(Buffer.concat(chunks), res.headers['content-encoding'], o.maxBytes * 4).toString('utf8') });
      };
      res.on('data', (c) => {
        if (cut) return;
        size += c.length;
        if (size > o.maxBytes) {
          cut = true;
          chunks.push(c.subarray(0, c.length - (size - o.maxBytes)));
          res.destroy();
          finish();
        } else chunks.push(c);
      });
      res.on('end', finish);
      res.on('error', (e) => { if (!cut) { clearTimeout(timer); reject(e); } });
    });
    const timer = setTimeout(() => req.destroy(err('TIMEOUT')), o.timeout);
    req.on('error', (e) => { clearTimeout(timer); reject(e); });
    req.end();
  });
}

// Folgt Weiterleitungen (max. o.maxRedirects); jede Station wird neu geprüft.
async function fetchFollow(url, o) {
  const chain = [];
  let cur = url;
  for (let i = 0; i <= o.maxRedirects; i++) {
    const r = await requestOnce(cur, o);
    chain.push({ url: cur, status: r.status });
    const loc = r.headers.location;
    if (r.status >= 300 && r.status < 400 && loc) {
      cur = new URL(loc, cur).href;
      continue;
    }
    return { ...r, finalUrl: cur, chain };
  }
  throw err('TOO_MANY_REDIRECTS');
}

module.exports = { requestOnce, fetchFollow };
