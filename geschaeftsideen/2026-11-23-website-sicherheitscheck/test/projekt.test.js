'use strict';
// Tests für projekt.js: Kundenfall neu → Fix → nachher gegen lokale Server.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const P = require('../projekt');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'projekt-'));
let cert;
try {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', `${tmp}/k.pem`, '-out', `${tmp}/c.pem`, '-days', '30', '-subj', '/CN=demo-test.at', '-addext', 'subjectAltName=DNS:demo-test.at'], { stdio: 'ignore' });
  cert = { key: fs.readFileSync(`${tmp}/k.pem`), cert: fs.readFileSync(`${tmp}/c.pem`) };
} catch { cert = null; }

const BAD = '<html><head><meta name="generator" content="WordPress 5.8.3"><link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet"><script src="/wp-includes/js/jquery/jquery.js?ver=1.12.4"></script><script src="https://www.googletagmanager.com/gtag/js?id=G-X"></script></head><body><a href="/impressum">Impressum</a></body></html>';
const GOOD = '<html><head><link rel="stylesheet" href="/wp-content/themes/x/style.css"><script src="/wp-includes/js/jquery/jquery.min.js?ver=3.7.1"></script></head><body><a href="/impressum">Impressum</a> <a href="/datenschutz">Datenschutz</a></body></html>';
const GOOD_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000', 'X-Frame-Options': 'SAMEORIGIN', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=()', 'Content-Security-Policy': "default-src 'self'",
};

test('scanOptions: lokale Ziele nur mit --demo', () => {
  assert.throws(() => P.scanOptions({ dns: 'x.json' }), /nur zusammen mit --demo/);
  assert.equal(P.scanOptions({}).allowPrivate, undefined);
  const o = P.scanOptions({ demo: true, ports: '8080,8443' });
  assert.equal(o.allowPrivate, true);
  assert.deepEqual(o.ports, { http: 8080, https: 8443 });
  assert.deepEqual(P.parseArgs(['neu', 'Firma X', 'x.at', '--demo', '--ports', '1,2']), { cmd: 'neu', pos: ['Firma X', 'x.at'], flags: { demo: true, ports: '1,2' } });
  assert.equal(P.slugify('Tischlerei Huber GmbH & Söhne'), 'tischlerei-huber-gmbh-sohne');
});

const fake = (results) => ({ categories: [{ id: 'x', title: 'X', results }], scannedAt: '2026-11-23T00:00:00Z' });
const R = (id, status, title = id, detail = '') => ({ id, status, sev: 3, title, detail, fix: '' });

test('vergleich: versteckte Versionen zählen nicht als behoben', () => {
  const v = fake([R('php', 'fail'), R('generator', 'warn'), R('hsts', 'fail'), R('dmarc', 'fail'), R('cert', 'pass')]);
  const n = fake([R('hsts', 'pass'), R('dmarc', 'warn'), R('cert', 'pass'), R('csp', 'warn')]);
  const c = P.vergleich(v, n);
  const st = Object.fromEntries(c.items.map((x) => [x.id, x.state]));
  assert.deepEqual(st, { php: 'verdeckt', generator: 'behoben', hsts: 'behoben', dmarc: 'teilweise' });
  assert.deepEqual(c.neu.map((r) => r.id), ['csp']);
  assert.ok(c.ehrlich.score < 100);
  assert.equal(P.vergleich(v, n, { manuell_erledigt: { php: 'PHP 8.3 umgestellt' } }).items[0].state, 'behoben');
});

test('kalkulation: Zuschläge für Shop, viele Plugins, PHP', () => {
  const k = P.kalkulation(fake([
    R('plugins', 'info', '12 Plugins öffentlich erkennbar', 'Gefunden: woocommerce, elementor'),
    R('php', 'fail'), R('hsts', 'fail'),
  ]));
  assert.equal(k.summe, 990 + 150 + 390 + 190);
});

test('Kundenfall neu → nachher gegen lokale Server', { skip: !cert && 'openssl fehlt' }, async (t) => {
  let fixed = false;
  const tlsSrv = https.createServer(cert, (req, res) => {
    res.writeHead(200, fixed ? { 'Content-Type': 'text/html', ...GOOD_HEADERS } : { 'Content-Type': 'text/html', 'X-Powered-By': 'PHP/7.4.33' });
    res.end(fixed ? GOOD : BAD);
  });
  await new Promise((r) => tlsSrv.listen(0, '127.0.0.1', r));
  const sPort = tlsSrv.address().port;
  const plain = http.createServer((req, res) => {
    if (fixed) { res.writeHead(301, { Location: `https://demo-test.at:${sPort}/` }); res.end(); } else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(BAD); }
  });
  await new Promise((r) => plain.listen(0, '127.0.0.1', r));
  t.after(() => { tlsSrv.close(); plain.close(); });

  const dns = path.join(tmp, 'dns.json');
  fs.writeFileSync(dns, JSON.stringify({}));
  const flags = { demo: true, dns, ca: `${tmp}/c.pem`, ports: `${plain.address().port},${sPort}`, 'wp-latest': '6.8.3' };
  const kundenDir = path.join(tmp, 'kunden');
  const r = await P.neu('Tischlerei Test GmbH', 'demo-test.at', flags, { kundenDir, now: new Date('2026-11-23T10:00:00Z') });
  assert.equal(path.basename(r.dir), '2026-001-tischlerei-test-gmbh');
  for (const f of ['projekt.json', 'scan-vorher.json', 'fixplan.md', 'angebot.md', 'video-skript.md', 'auftrag-checkliste.md', 'notizen.json']) {
    assert.ok(fs.existsSync(path.join(r.dir, f)), f);
  }
  assert.equal(r.scan.grade, 'F');
  const plan = fs.readFileSync(path.join(r.dir, 'fixplan.md'), 'utf8');
  assert.match(plan, /RewriteRule \^ https:\/\//);
  assert.match(plan, /_dmarc\.demo-test\.at/);
  assert.match(plan, /Stefan klickt selbst/);
  assert.match(fs.readFileSync(path.join(r.dir, 'angebot.md'), 'utf8'), /netto/);
  assert.match(fs.readFileSync(path.join(r.dir, 'video-skript.md'), 'utf8'), /\[0:00\]/);

  fixed = true;
  fs.writeFileSync(dns, JSON.stringify({ 'demo-test.at': ['v=spf1 -all'], '_dmarc.demo-test.at': ['v=DMARC1; p=quarantine'] }));
  const n = await P.nachher(r.dir); // Flags aus projekt.json
  assert.ok(n.nachher.score > n.vorher.score + 40, `${n.vorher.score} → ${n.nachher.score}`);
  const st = Object.fromEntries(n.vergleich.items.map((x) => [x.id, x.state]));
  assert.equal(st.php, 'verdeckt');
  assert.equal(st.wp_version, 'verdeckt');
  assert.equal(st.dmarc, 'behoben');
  assert.equal(st.gfonts, 'behoben');
  assert.ok(n.vergleich.ehrlich.score < n.nachher.score);
  const html = fs.readFileSync(path.join(r.dir, 'bericht.html'), 'utf8');
  assert.match(html, /Ehrliche Note/);
  assert.match(fs.readFileSync(path.join(r.dir, 'bericht.md'), 'utf8'), /im Panel zu erledigen/);

  const r2 = await P.neu('Zweiter Kunde', 'demo-test.at', flags, { kundenDir, now: new Date('2026-11-24T10:00:00Z') });
  assert.equal(path.basename(r2.dir), '2026-002-zweiter-kunde');
});
