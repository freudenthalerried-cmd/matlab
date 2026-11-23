'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../scanner/checks');
const { isPrivate } = require('../scanner/netguard');
const { normalizeTarget, registrableDomain } = require('../scanner');

const byId = (list, id) => list.find((x) => x.id === id);
const NOW = Date.parse('2026-11-23T12:00:00Z');

test('SSRF-Schutz: private Adressen blockiert, öffentliche erlaubt', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', 'kein-ip']) {
    assert.equal(isPrivate(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '1.1.1.1', '2a00:1450:4001:80b::200e']) assert.equal(isPrivate(ip), false, ip);
});

test('Eingabe wird normalisiert, IPs und Ports abgelehnt', () => {
  assert.equal(normalizeTarget('Meine-Firma.at/kontakt').host, 'meine-firma.at');
  assert.equal(normalizeTarget('https://www.firma.co.at').domain, 'firma.co.at');
  assert.equal(registrableDomain('shop.firma.at'), 'firma.at');
  assert.throws(() => normalizeTarget('127.0.0.1'), /IP-Adresse/);
  assert.throws(() => normalizeTarget('firma.at:8080'), /Portnummer/);
  assert.throws(() => normalizeTarget('localhost'), /gültigen/);
  assert.throws(() => normalizeTarget(''), /Website-Adresse/);
});

test('TLS: gültiges Zertifikat und Weiterleitung = grün', () => {
  const res = C.checkTls({
    https: { status: 200, finalUrl: 'https://a.at/', tls: { authorized: true, protocol: 'TLSv1.3', validTo: 'Feb 1 00:00:00 2027 GMT', issuer: "Let's Encrypt" } },
    http: { status: 200, finalUrl: 'https://a.at/' },
    now: NOW,
  });
  assert.ok(res.every((x) => x.status === 'pass'), JSON.stringify(res));
});

test('TLS: abgelaufen, falscher Name, keine Weiterleitung = rot', () => {
  const res = C.checkTls({
    https: { status: 200, finalUrl: 'https://a.at/', tls: { authorized: false, authError: 'CERT_HAS_EXPIRED', protocol: 'TLSv1', validTo: 'Nov 1 00:00:00 2026 GMT' } },
    http: { status: 200, finalUrl: 'http://a.at/' },
    now: NOW,
  });
  assert.equal(byId(res, 'cert').status, 'fail');
  assert.match(byId(res, 'cert').detail, /abgelaufen/);
  assert.equal(byId(res, 'cert_expiry').status, 'fail');
  assert.equal(byId(res, 'redirect').status, 'fail');
  assert.equal(byId(res, 'tls_version').status, 'fail');
});

test('Header: fehlende Schutz-Header, Versionsleck, altes PHP', () => {
  const res = C.checkHeaders({ server: 'Apache/2.4.41 (Ubuntu)', 'x-powered-by': 'PHP/7.4.33', 'set-cookie': ['PHPSESSID=abc; path=/'] }, { isHttps: true, now: NOW });
  assert.equal(byId(res, 'csp').status, 'warn');
  assert.equal(byId(res, 'clickjacking').status, 'warn');
  assert.equal(byId(res, 'server_leak').status, 'warn');
  assert.equal(byId(res, 'php').status, 'fail');
  assert.equal(byId(res, 'cookies').status, 'warn');
  assert.equal(C.checkHsts({}).status, 'fail');
  assert.equal(C.checkHsts({ 'strict-transport-security': 'max-age=300' }).status, 'warn');
});

test('Header: sauber konfiguriert = grün', () => {
  const res = C.checkHeaders({
    'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=()',
    server: 'nginx', 'set-cookie': 'sid=1; Secure; HttpOnly; SameSite=Lax',
  }, { isHttps: true, now: NOW });
  assert.ok(res.every((x) => x.status === 'pass'), JSON.stringify(res.filter((x) => x.status !== 'pass')));
  assert.equal(C.checkHsts({ 'strict-transport-security': 'max-age=31536000' }).status, 'pass');
});

test('PHP-Lebenszyklus', () => {
  assert.equal(C.phpStatus('8.1', NOW).status, 'fail');
  assert.equal(C.phpStatus('8.2', NOW).status, 'warn');
  assert.equal(C.phpStatus('8.3', NOW).status, 'pass');
  assert.equal(C.phpStatus('5.6', NOW).status, 'fail');
});

const WP_HTML = `<html><head><meta name="generator" content="WordPress 6.1.1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
<script src="/wp-includes/js/jquery/jquery.min.js?ver=1.12.4"></script>
<link rel="stylesheet" href="/wp-content/plugins/contact-form-7/style.css">
<script src="/wp-content/plugins/elementor/x.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XYZ"></script>
<script src="http://cdn.example.com/lib.js"></script></head>
<body><iframe src="https://www.youtube.com/embed/abc"></iframe></body></html>`;

test('Software: altes WordPress, jQuery, Plugins erkannt', () => {
  const res = C.checkSoftware(WP_HTML, { latestWp: '6.8.3' });
  assert.match(byId(res, 'cms').title, /WordPress/);
  assert.equal(byId(res, 'wp_version').status, 'fail');
  assert.equal(byId(res, 'generator').status, 'warn');
  assert.equal(byId(res, 'jquery').status, 'warn');
  assert.match(byId(res, 'plugins').detail, /contact-form-7, elementor/);
  assert.equal(C.checkSoftware('<meta name="generator" content="WordPress 6.8.1"><link href="/wp-content/x">', { latestWp: '6.8.3' }).find((x) => x.id === 'wp_version').status, 'warn');
});

test('Datenschutz: Google Fonts, Tracker ohne Banner, Embeds, fehlendes Impressum', () => {
  const res = C.checkPrivacy(WP_HTML);
  assert.equal(byId(res, 'gfonts').status, 'fail');
  assert.equal(byId(res, 'tracking').status, 'fail');
  assert.equal(byId(res, 'embeds').status, 'warn');
  assert.equal(byId(res, 'impressum').status, 'warn');
  const ok = C.checkPrivacy('<a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><script src="https://consent.cookiebot.com/uc.js"></script><script src="https://www.googletagmanager.com/gtm.js?id=GTM-ABCD"></script>');
  assert.equal(byId(ok, 'gfonts').status, 'pass');
  assert.equal(byId(ok, 'tracking').status, 'info');
  assert.equal(byId(ok, 'impressum').status, 'pass');
});

test('Mixed Content', () => {
  assert.equal(C.checkMixedContent(WP_HTML).status, 'fail');
  assert.equal(C.checkMixedContent('<img src="http://x.at/a.png"><a href="http://x.at">x</a>').status, 'warn');
  assert.equal(C.checkMixedContent('<a href="http://x.at">Link</a>').status, 'pass');
});

test('E-Mail: SPF und DMARC', () => {
  const ok = C.checkMail({ spf: { records: ['v=spf1 include:_spf.google.com -all'] }, dmarc: { records: ['v=DMARC1; p=reject; rua=mailto:x@a.at'] } });
  assert.deepEqual(ok.map((x) => x.status), ['pass', 'pass']);
  const bad = C.checkMail({ spf: { records: [] }, dmarc: { records: [] } });
  assert.deepEqual(bad.map((x) => x.status), ['fail', 'fail']);
  const weak = C.checkMail({ spf: { records: ['v=spf1 +all'] }, dmarc: { records: ['v=DMARC1; p=none'] } });
  assert.deepEqual(weak.map((x) => x.status), ['fail', 'warn']);
  assert.equal(C.checkMail({ spf: { records: ['v=spf1 a', 'v=spf1 mx'] }, dmarc: { error: 'ETIMEOUT' } })[0].status, 'fail');
});

test('Bewertung: Noten und Deckel bei fehlendem HTTPS', () => {
  assert.deepEqual(C.score([{ id: 'x', status: 'pass', sev: 3 }]), { score: 100, grade: 'A' });
  assert.equal(C.score([{ id: 'https', status: 'fail', sev: 3 }]).grade, 'F');
  assert.equal(C.score([{ id: 'cert', status: 'fail', sev: 3 }]).grade, 'D');
  assert.equal(C.score([{ id: 'a', status: 'warn', sev: 2 }, { id: 'b', status: 'warn', sev: 2 }]).score, 94);
});
