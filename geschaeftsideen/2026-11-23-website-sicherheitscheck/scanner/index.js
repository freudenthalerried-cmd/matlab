'use strict';
const dns = require('node:dns');
const net = require('node:net');
const { fetchFollow } = require('./fetch');
const C = require('./checks');

class ScanError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const SECOND_LEVEL = new Set(['co', 'or', 'gv', 'ac', 'com', 'net', 'org', 'gov', 'edu']);

// firma.at aus www.firma.at bzw. shop.firma.co.at → firma.co.at
function registrableDomain(host) {
  const p = host.split('.');
  if (p.length <= 2) return host;
  const n = p.length;
  if (p[n - 1].length === 2 && SECOND_LEVEL.has(p[n - 2])) return p.slice(-3).join('.');
  return p.slice(-2).join('.');
}

function normalizeTarget(input, { allowAnyPort = false } = {}) {
  let s = String(input || '').trim();
  if (!s) throw new ScanError('Bitte geben Sie eine Website-Adresse ein.');
  if (s.length > 253) throw new ScanError('Die Adresse ist zu lang.');
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try { u = new URL(s); } catch { throw new ScanError('Das sieht nicht nach einer gültigen Website-Adresse aus.'); }
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (net.isIP(host.replace(/^\[|\]$/g, ''))) throw new ScanError('Bitte geben Sie einen Domainnamen ein (z. B. meine-firma.at), keine IP-Adresse.');
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(host)) {
    throw new ScanError('Das sieht nicht nach einer gültigen Website-Adresse aus.');
  }
  if (u.port && !allowAnyPort) throw new ScanError('Bitte geben Sie die Adresse ohne Portnummer ein.');
  return { host, port: u.port ? `:${u.port}` : '', domain: registrableDomain(host) };
}

const settle = (p) => p.then((value) => ({ value }), (error) => ({ error }));

async function txt(resolver, name) {
  try {
    const recs = await resolver.resolveTxt(name);
    return { records: recs.map((chunks) => chunks.join('')) };
  } catch (e) {
    if (e.code === 'ENODATA' || e.code === 'ENOTFOUND' || e.code === 'NXDOMAIN') return { records: [] };
    return { error: e.code || 'DNS_ERROR' };
  }
}

let wpCache = { at: 0, v: null };
async function latestWordPress(o) {
  if (Date.now() - wpCache.at < 6 * 3600e3 && wpCache.v) return wpCache.v;
  try {
    const res = await fetch('https://api.wordpress.org/core/version-check/1.7/', { signal: AbortSignal.timeout(5000) });
    const j = await res.json();
    const v = j.offers && j.offers[0] && j.offers[0].current;
    if (v) wpCache = { at: Date.now(), v };
    return v || null;
  } catch {
    return wpCache.v;
  }
}

async function safeBrowsing(url, key) {
  if (!key) return null;
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        client: { clientId: 'webampel', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'], threatEntryTypes: ['URL'], threatEntries: [{ url }],
        },
      }),
    });
    if (!res.ok) return { error: res.status };
    const j = await res.json();
    return { matches: Array.isArray(j.matches) && j.matches.length > 0 };
  } catch {
    return { error: 'NETWORK' };
  }
}

const UNREACHABLE = {
  ENOTFOUND: 'Diese Domain existiert nicht oder hat keinen Webserver.',
  EAI_AGAIN: 'Diese Domain konnte nicht aufgelöst werden. Bitte später erneut versuchen.',
  BLOCKED_PRIVATE: 'Diese Adresse zeigt auf ein internes Netzwerk und kann nicht geprüft werden.',
  TIMEOUT: 'Die Website hat nicht rechtzeitig geantwortet.',
  ECONNREFUSED: 'Die Website hat die Verbindung abgelehnt.',
  TOO_MANY_REDIRECTS: 'Die Website leitet endlos weiter.',
  BAD_PORT: 'Die Website leitet auf einen ungewöhnlichen Port weiter – das prüfen wir nur im Detailbericht.',
};

// Pro-Prüfungen: nur nach Domain-Verifizierung bzw. im bezahlten Bericht.
const LOCKED = [
  'Plugins & Themes auf bekannte Sicherheitslücken (CVE-Datenbank)',
  'Öffentlich erreichbare Backups, .git- und .env-Dateien',
  'Offene Ports und Dienste (FTP, Datenbank, SSH)',
  'Schutz des Admin-Logins gegen Passwort-Raten',
  'Alte Verschlüsselungsverfahren (TLS 1.0/1.1) am Server',
  'Persönliche Experten-Prüfung als Video',
];

async function scan(input, opts = {}) {
  const o = {
    timeout: 8000, maxBytes: 1_500_000, maxRedirects: 5,
    allowPrivate: false, allowAnyPort: false,
    resolver: dns.promises, latestWp: latestWordPress, safeBrowsingKey: null,
    now: Date.now(), ...opts,
  };
  const t = normalizeTarget(input, o);
  const started = Date.now();

  // o.ports nur für Tests (getrennte lokale Ports für HTTP und HTTPS)
  const sp = o.ports ? `:${o.ports.https}` : t.port;
  const pp = o.ports ? `:${o.ports.http}` : t.port;
  const [httpsR, httpR, spf, dmarc, latestWp] = await Promise.all([
    settle(fetchFollow(`https://${t.host}${sp}/`, o)),
    settle(fetchFollow(`http://${t.host}${pp}/`, o)),
    txt(o.resolver, t.domain),
    txt(o.resolver, `_dmarc.${t.domain}`),
    o.latestWp(o),
  ]);

  if (httpsR.error && httpR.error) {
    const code = httpsR.error.code === 'ECONNREFUSED' ? (httpR.error.code || 'ECONNREFUSED') : (httpsR.error.code || httpR.error.code);
    throw new ScanError(UNREACHABLE[code] || 'Die Website ist nicht erreichbar.', 422);
  }

  const https = httpsR.value || null;
  const http = httpR.value || null;
  const main = https && https.status < 500 ? https : (http || https);
  const isHttps = new URL(main.finalUrl).protocol === 'https:';
  const html = /html|xml|text\/plain/i.test(main.headers['content-type'] || 'text/html') ? main.body : '';

  const results = [
    ...C.checkTls({ https, http, now: o.now }),
    ...(isHttps ? [C.checkHsts(main.headers), C.checkMixedContent(html)] : []),
    ...C.checkHeaders(main.headers, { isHttps, now: o.now }),
    ...C.checkSoftware(html, { latestWp }),
    ...C.checkMail({ spf, dmarc }),
    ...C.checkPrivacy(html),
    ...C.checkReputation(await safeBrowsing(main.finalUrl, o.safeBrowsingKey)),
  ];
  if (main.status >= 400) {
    results.push({ id: 'status', cat: 'headers', title: `Server antwortete mit Status ${main.status}`, status: 'info', sev: 1, detail: 'Die Startseite lieferte einen Fehlercode (evtl. Bot-Schutz). Einige Prüfungen sind dadurch unvollständig.', fix: '' });
  }

  const categories = Object.entries(C.CATS)
    .map(([id, title]) => ({ id, title, results: results.filter((x) => x.cat === id) }))
    .filter((c) => c.results.length);
  const count = (s) => results.filter((x) => x.status === s).length;

  return {
    target: t.host,
    finalUrl: main.finalUrl,
    scannedAt: new Date(o.now).toISOString(),
    durationMs: Date.now() - started,
    ...C.score(results),
    summary: { pass: count('pass'), warn: count('warn'), fail: count('fail'), info: count('info') },
    categories,
    locked: o.safeBrowsingKey ? LOCKED : [...LOCKED, 'Malware- und Blacklist-Prüfung'],
  };
}

module.exports = { scan, ScanError, normalizeTarget, registrableDomain };
