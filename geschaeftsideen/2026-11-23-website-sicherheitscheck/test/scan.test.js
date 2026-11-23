'use strict';
// Ende-zu-Ende-Test gegen lokale Test-Server (HTTP + HTTPS mit selbst signiertem Zertifikat).
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { scan } = require('../scanner');

let cert;
try {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ampel-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', `${dir}/k.pem`, '-out', `${dir}/c.pem`, '-days', '30', '-subj', '/CN=test.local.at'], { stdio: 'ignore' });
  cert = { key: fs.readFileSync(`${dir}/k.pem`), cert: fs.readFileSync(`${dir}/c.pem`) };
} catch { cert = null; }

const lookup = (host, opts, cb) => cb(null, [{ address: '127.0.0.1', family: 4 }]);
const resolver = {
  resolveTxt: async (name) => {
    if (name === 'local.at') return [['v=spf1 mx -all']];
    const e = new Error('nodata'); e.code = 'ENODATA'; throw e;
  },
};
const PAGE = `<html><head><meta name="generator" content="WordPress 6.2"><link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet"><link rel="stylesheet" href="/wp-content/plugins/woocommerce/a.css"></head><body><a href="/impressum">Impressum</a></body></html>`;

test('kompletter Scan gegen lokale Server', { skip: !cert && 'openssl fehlt' }, async (t) => {
  const tlsSrv = https.createServer(cert, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html', 'X-Powered-By': 'PHP/8.0.30', 'Strict-Transport-Security': 'max-age=31536000' });
    res.end(PAGE);
  });
  await new Promise((r) => tlsSrv.listen(0, '127.0.0.1', r));
  const sPort = tlsSrv.address().port;
  const plain = http.createServer((req, res) => { res.writeHead(301, { Location: `https://test.local.at:${sPort}/` }); res.end(); });
  await new Promise((r) => plain.listen(0, '127.0.0.1', r));
  t.after(() => { tlsSrv.close(); plain.close(); });

  const r = await scan('test.local.at', {
    allowPrivate: true, allowAnyPort: true, lookup, resolver,
    ports: { http: plain.address().port, https: sPort },
    latestWp: async () => '6.8.3', now: Date.parse('2026-11-23T12:00:00Z'),
  });
  const all = Object.fromEntries(r.categories.flatMap((c) => c.results).map((x) => [x.id, x.status]));
  assert.equal(all.https, 'pass');
  assert.equal(all.redirect, 'pass');
  assert.equal(all.cert, 'fail'); // selbst signiert
  assert.equal(all.hsts, 'pass');
  assert.equal(all.php, 'fail');
  assert.equal(all.wp_version, 'fail');
  assert.equal(all.gfonts, 'fail');
  assert.equal(all.spf, 'pass');
  assert.equal(all.dmarc, 'fail');
  assert.equal(all.impressum, 'pass');
  assert.ok(['D', 'F'].includes(r.grade), r.grade);
  assert.ok(r.locked.length >= 6);
});

test('SSRF: Domain, die auf 127.0.0.1 zeigt, wird abgelehnt', async () => {
  await assert.rejects(
    scan('intern.example.at', { lookup, resolver, latestWp: async () => null }),
    /internes Netzwerk/,
  );
});
