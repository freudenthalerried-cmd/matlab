'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { scan, ScanError } = require('./scanner');

const env = process.env;
const CFG = {
  port: Number(env.PORT) || 3000,
  brand: env.BRAND || 'WebAmpel',
  contactEmail: env.CONTACT_EMAIL || 'kontakt@example.at',
  phone: env.PHONE || '',
  trustProxy: env.TRUST_PROXY === '1',
  testMode: env.TEST_MODE === '1', // Testversion: Hinweisbalken + nicht in Google
  // Nur für lokale Tests – in Produktion NIE setzen:
  allowPrivate: env.ALLOW_PRIVATE === '1',
  allowAnyPort: env.ALLOW_ANY_PORT === '1',
  leadWebhook: env.LEAD_WEBHOOK_URL || '',
  safeBrowsingKey: env.GOOGLE_SAFE_BROWSING_KEY || null,
  dataDir: env.DATA_DIR || path.join(__dirname, 'data'),
  scansPerHour: Number(env.SCANS_PER_HOUR) || 10,
  stripe: { roast: env.STRIPE_LINK_ROAST || '', fix: env.STRIPE_LINK_FIX || '', wartung: env.STRIPE_LINK_WARTUNG || '' },
};
const PUBLIC = path.join(__dirname, 'public');
fs.mkdirSync(CFG.dataDir, { recursive: true });

// Eigene Seite muss im eigenen Check grün sein.
const SEC_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
if (CFG.testMode) SEC_HEADERS['X-Robots-Tag'] = 'noindex, nofollow';
const TEST_BANNER = '<div class="test-bar"><div class="wrap"><strong>Testversion</strong> – nicht öffentlich beworben. Prüfungen sind echt, Anfragen werden ggf. nicht dauerhaft gespeichert.</div></div>';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (html) => html
  .replaceAll('{{BRAND}}', esc(CFG.brand))
  .replaceAll('{{CONTACT_EMAIL}}', esc(CFG.contactEmail))
  .replaceAll('{{PHONE}}', esc(CFG.phone || '–'))
  .replaceAll('{{YEAR}}', String(new Date().getFullYear()))
  .replace('<!--TEST_BANNER-->', CFG.testMode ? TEST_BANNER : '');

function send(res, status, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(status, { ...SEC_HEADERS, 'Content-Type': type, ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function clientIp(req) {
  // Letzter Eintrag stammt vom eigenen Proxy (Render/Caddy) – der erste wäre vom Besucher fälschbar.
  if (CFG.trustProxy && req.headers['x-forwarded-for']) return req.headers['x-forwarded-for'].split(',').pop().trim();
  return req.socket.remoteAddress || 'unknown';
}

// Einfaches Rate-Limit im Speicher (reicht für einen Server).
const buckets = new Map();
function limited(key, max, windowMs = 3600e3) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { buckets.set(key, arr); return true; }
  arr.push(now);
  buckets.set(key, arr);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of buckets) if (!arr.some((t) => now - t < 3600e3)) buckets.delete(k);
  for (const [k, v] of cache) if (now - v.at > 600e3) cache.delete(k);
}, 600e3).unref();

function readJson(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new ScanError('Anfrage zu groß.', 413)); req.destroy(); } else chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new ScanError('Ungültige Anfrage.')); }
    });
    req.on('error', reject);
  });
}

const append = (file, obj) => fs.promises.appendFile(path.join(CFG.dataDir, file), `${JSON.stringify(obj)}\n`).catch((e) => console.error('Speichern fehlgeschlagen:', e.message));

const cache = new Map();
let active = 0;

async function handleScan(req, res) {
  const body = await readJson(req);
  if (body.consent !== true) throw new ScanError('Bitte bestätigen Sie, dass Sie diese Website prüfen lassen dürfen.');
  const key = String(body.url || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 600e3) return send(res, 200, hit.result);
  if (limited(`scan:${clientIp(req)}`, CFG.scansPerHour)) throw new ScanError('Zu viele Prüfungen von Ihrer Verbindung. Bitte in einer Stunde erneut versuchen.', 429);
  if (active >= 5) throw new ScanError('Gerade laufen sehr viele Prüfungen. Bitte in einer Minute erneut versuchen.', 503);
  active++;
  try {
    const result = await scan(body.url, { allowPrivate: CFG.allowPrivate, allowAnyPort: CFG.allowAnyPort, safeBrowsingKey: CFG.safeBrowsingKey });
    cache.set(key, { at: Date.now(), result });
    append('scans.jsonl', { at: result.scannedAt, host: result.target, grade: result.grade, score: result.score, fail: result.summary.fail });
    send(res, 200, result);
  } finally {
    active--;
  }
}

const PACKAGES = new Set(['scan', 'roast', 'fix', 'shop', 'wartung', 'notfall', 'sonstiges']);
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

async function handleLead(req, res) {
  const b = await readJson(req, 16384);
  if (b.hp) return send(res, 200, { ok: true }); // Honeypot gegen Spam-Bots
  if (limited(`lead:${clientIp(req)}`, 5)) throw new ScanError('Zu viele Anfragen. Bitte später erneut versuchen.', 429);
  const lead = {
    at: new Date().toISOString(),
    name: clip(b.name, 120),
    company: clip(b.company, 160),
    email: clip(b.email, 200),
    phone: clip(b.phone, 60),
    website: clip(b.website, 253),
    package: PACKAGES.has(b.package) ? b.package : 'sonstiges',
    message: clip(b.message, 3000),
  };
  if (!lead.name) throw new ScanError('Bitte geben Sie Ihren Namen an.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) throw new ScanError('Bitte geben Sie eine gültige E-Mail-Adresse an.');
  if (b.privacy !== true) throw new ScanError('Bitte stimmen Sie der Datenschutzerklärung zu.');
  await append('leads.jsonl', lead);
  console.log(`Neue Anfrage: ${lead.package} – ${lead.website || lead.email}`);
  if (CFG.leadWebhook) {
    fetch(CFG.leadWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead), signal: AbortSignal.timeout(5000) })
      .catch((e) => console.error('Webhook fehlgeschlagen:', e.message));
  }
  send(res, 200, { ok: true });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  if (!path.extname(rel)) rel += '.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Verboten', 'text/plain; charset=utf-8');
  fs.readFile(file, (err, data) => {
    if (err) {
      return fs.readFile(path.join(PUBLIC, '404.html'), 'utf8', (e2, nf) => send(res, 404, e2 ? 'Nicht gefunden' : fill(nf), 'text/html; charset=utf-8'));
    }
    const ext = path.extname(file);
    const type = TYPES[ext] || 'application/octet-stream';
    const body = ext === '.html' ? fill(data.toString('utf8')) : data;
    send(res, 200, req.method === 'HEAD' ? '' : body, type, { 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST' && pathname === '/api/scan') return await handleScan(req, res);
    if (req.method === 'POST' && pathname === '/api/lead') return await handleLead(req, res);
    if (req.method === 'GET' && pathname === '/api/config') return send(res, 200, { brand: CFG.brand, stripe: CFG.stripe });
    if (req.method === 'GET' && pathname === '/healthz') return send(res, 200, { ok: true });
    if (CFG.testMode && pathname === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /\n', 'text/plain; charset=utf-8');
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, pathname);
    send(res, 405, { error: 'Methode nicht erlaubt.' });
  } catch (e) {
    if (e instanceof ScanError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: 'Interner Fehler. Bitte später erneut versuchen.' });
  }
});

if (require.main === module) {
  server.listen(CFG.port, () => console.log(`${CFG.brand} läuft auf http://localhost:${CFG.port}`));
}
module.exports = { server, CFG };
