'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ampel-data-'));
process.env.BRAND = 'TestAmpel';
const { server } = require('../server');

let base;
test.before(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('Startseite: Platzhalter ersetzt, Sicherheits-Header gesetzt', async () => {
  const res = await fetch(`${base}/`);
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /TestAmpel/);
  assert.doesNotMatch(html, /\{\{BRAND\}\}/);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal((await fetch(`${base}/impressum`)).status, 200);
  assert.equal((await fetch(`${base}/gibts-nicht`)).status, 404);
});

test('Path-Traversal wird verhindert', async () => {
  const res = await fetch(`${base}/..%2fserver.js`);
  assert.notEqual(res.status, 200);
});

test('Scan ohne Einverständnis wird abgelehnt', async () => {
  const res = await post('/api/scan', { url: 'example.at' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /bestätigen/);
});

test('Scan auf IP-Adresse wird abgelehnt', async () => {
  const res = await post('/api/scan', { url: '127.0.0.1', consent: true });
  assert.equal(res.status, 400);
});

test('Lead: Validierung, Speicherung, Honeypot', async () => {
  assert.equal((await post('/api/lead', { name: 'A', email: 'kaputt', privacy: true })).status, 400);
  assert.equal((await post('/api/lead', { name: 'A', email: 'a@b.at' })).status, 400);
  const ok = await post('/api/lead', { name: 'Max Muster', email: 'max@firma.at', website: 'firma.at', package: 'fix', privacy: true });
  assert.equal(ok.status, 200);
  assert.equal((await post('/api/lead', { name: 'Bot', email: 'b@b.at', privacy: true, hp: 'x' })).status, 200);
  await new Promise((r) => setTimeout(r, 50));
  const lines = fs.readFileSync(path.join(process.env.DATA_DIR, 'leads.jsonl'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).package, 'fix');
});
