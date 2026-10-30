import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { WebSocket, WebSocketServer } from "ws";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createEngine, MODES } from "./public/engine.js";

const PORT = Number(process.env.PORT) || 3000;
const MODE = process.env.MODE || "spar";
const DG_KEY = process.env.DEEPGRAM_API_KEY || "";
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
// Ohne Lizenzpflicht läuft der Server als privater Server für eine Person
const REQUIRE_LICENSE = process.env.REQUIRE_LICENSE === "true";
const DATA_DIR = process.env.DATA_DIR || "data";
// Nur für Tests überschreibbar
const DG_URL = process.env.DEEPGRAM_URL || "wss://api.deepgram.com/v1/listen";
const STRIPE_URL = process.env.STRIPE_URL || "https://api.stripe.com/v1/";
const PLANS = JSON.parse(fs.readFileSync(new URL("./plans.json", import.meta.url), "utf8"));

// ---------- Lizenzen und Verbrauch (JSON-Datei, für den Start ausreichend) ----------
const LIC_FILE = path.join(DATA_DIR, "licenses.json");
fs.mkdirSync(DATA_DIR, { recursive: true });
let licenses = {};
try { licenses = JSON.parse(fs.readFileSync(LIC_FILE, "utf8")); } catch {}
let saveTimer = null;
function saveLicenses() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFileSync(LIC_FILE + ".tmp", JSON.stringify(licenses, null, 1));
    fs.renameSync(LIC_FILE + ".tmp", LIC_FILE);
  }, 500);
}
const month = () => new Date().toISOString().slice(0, 7);
const planOf = lic => PLANS.find(p => p.id === lic.plan) || PLANS[0];
function usageOf(lic) {
  const m = month();
  lic.usage ||= {};
  return (lic.usage[m] ||= { usd: 0, dgSec: 0 });
}
function newLicense(plan, extra = {}) {
  const key = "FC-" + randomBytes(12).toString("base64url").toUpperCase().replace(/[-_]/g, "X");
  licenses[key] = { plan, created: new Date().toISOString(), ...extra };
  saveLicenses();
  return key;
}
function quotaLeft(lic) {
  const u = usageOf(lic), p = planOf(lic);
  return { usd: p.usdLimit - u.usd, sec: p.hours * 3600 - u.dgSec };
}

// ---------- Stripe (nur REST, kein SDK nötig) ----------
async function stripe(pathname) {
  const r = await fetch(STRIPE_URL + pathname, { headers: { Authorization: "Bearer " + STRIPE_KEY } });
  if (!r.ok) throw Object.assign(new Error("Stripe: " + r.status), { status: 502 });
  return r.json();
}
// Abo-Status höchstens alle 6 Stunden bei Stripe nachfragen
async function subscriptionActive(lic) {
  if (!lic.subscription || !STRIPE_KEY) return true;
  if (lic.subCheckedAt && Date.now() - lic.subCheckedAt < 6 * 3600e3) return lic.subActive;
  const sub = await stripe("subscriptions/" + lic.subscription);
  lic.subActive = ["active", "trialing"].includes(sub.status);
  lic.subCheckedAt = Date.now(); saveLicenses();
  return lic.subActive;
}

async function licenseFor(key) {
  if (!REQUIRE_LICENSE) return null;
  const lic = licenses[key || ""];
  if (!lic) throw Object.assign(new Error("Bitte gültigen Lizenzschlüssel eingeben."), { status: 401 });
  if (!(await subscriptionActive(lic))) throw Object.assign(new Error("Dein Abo ist nicht aktiv."), { status: 402 });
  return lic;
}
function requireQuota(lic, kind) {
  if (!lic) return;
  const left = quotaLeft(lic);
  if (kind === "claude" && left.usd <= 0) throw Object.assign(new Error("Monatskontingent für Prüfungen aufgebraucht."), { status: 402 });
  if (kind === "audio" && left.sec <= 0) throw Object.assign(new Error("Monatskontingent für Mitschrift aufgebraucht."), { status: 402 });
}

// ---------- Claude: eine Engine, Verbrauch wird der aktuellen Lizenz zugerechnet ----------
const current = new AsyncLocalStorage();
let totalUsd = 0;
const engine = createEngine(new Anthropic(), MODE, {
  onUsage: ({ usd }) => {
    totalUsd += usd;
    const lic = current.getStore();
    if (lic) { usageOf(lic).usd += usd; saveLicenses(); }
  },
});

// Einfache Bremse gegen Missbrauch: höchstens 40 Prüfanfragen pro Minute und Lizenz bzw. Adresse
const hits = new Map();
function rateLimit(id) {
  const now = Date.now(), list = (hits.get(id) || []).filter(t => now - t < 60e3);
  list.push(now); hits.set(id, list);
  if (list.length > 40) throw Object.assign(new Error("Zu viele Anfragen, kurz warten."), { status: 429 });
}

const app = express();
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.get("/api/ping", (req, res) => res.json({
  ok: true, hosted: true, license: REQUIRE_LICENSE, deepgram: !!DG_KEY, mode: MODE, modeLabel: MODES[MODE]?.label || MODE,
  plans: PLANS.filter(p => !p.hidden).map(({ id, name, price, hours, url }) => ({ id, name, price, hours, url })),
}));

// Prüf-Endpunkte: Lizenz prüfen, Kontingent prüfen, Verbrauch zurechnen
const run = fn => async (req, res, next) => {
  try {
    const lic = await licenseFor(req.get("x-license"));
    rateLimit(req.get("x-license") || req.ip);
    requireQuota(lic, "claude");
    res.json(await current.run(lic, () => fn(req.body || {})));
  } catch (e) { next(e); }
};
app.post("/api/check", run(async b => ({ claims: await engine.check(b.text, b.context) })));
app.post("/api/verify", run(b => engine.verify(b.claim)));
app.post("/api/coach", run(b => engine.coach(b.text, b.me)));
app.post("/api/detail", run(b => engine.detail(b.claim)));

app.get("/api/usage", async (req, res, next) => {
  try {
    const lic = await licenseFor(req.get("x-license"));
    if (!lic) return res.json({ personal: true, usd: totalUsd });
    const u = usageOf(lic), p = planOf(lic);
    res.json({ plan: p.name, month: month(), usd: u.usd, usdLimit: p.usdLimit, minutes: Math.round(u.dgSec / 60), minutesLimit: p.hours * 60 });
  } catch (e) { next(e); }
});

// Nach dem Kauf: Stripe leitet auf /?session_id=… zurück, die Seite holt hier ihren Lizenzschlüssel
app.get("/api/license/claim", async (req, res, next) => {
  try {
    const id = String(req.query.session_id || "");
    if (!STRIPE_KEY || !/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ error: "Ungültige Kaufbestätigung." });
    const existing = Object.entries(licenses).find(([, l]) => l.session === id);
    if (existing) return res.json({ key: existing[0] });
    const s = await stripe("checkout/sessions/" + id);
    if (s.status !== "complete" || !["paid", "no_payment_required"].includes(s.payment_status)) {
      return res.status(402).json({ error: "Zahlung ist noch nicht abgeschlossen." });
    }
    const plan = PLANS.find(p => p.paymentLinkId && p.paymentLinkId === s.payment_link) || PLANS[0];
    const key = newLicense(plan.id, { session: id, subscription: s.subscription || null, email: s.customer_details?.email || null });
    res.json({ key });
  } catch (e) { next(e); }
});

// Lizenzen von Hand anlegen, z. B. für Tester oder Barverkauf
app.post("/api/admin/license", (req, res) => {
  if (!ADMIN_TOKEN || req.get("authorization") !== "Bearer " + ADMIN_TOKEN) return res.status(403).json({ error: "Kein Zugriff." });
  const plan = PLANS.find(p => p.id === req.body?.plan) ? req.body.plan : "test";
  res.json({ key: newLicense(plan, { email: req.body?.email || null }) });
});

app.use((err, req, res, next) => {
  if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Zu viele Anfragen, kurz warten." });
  if (err instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "API-Schlüssel fehlt oder ist ungültig." });
  if (err instanceof Anthropic.APIError) return res.status(502).json({ error: "Claude ist gerade nicht erreichbar." });
  if (err.message === "refused") return res.status(422).json({ error: "Diese Aussage wurde nicht geprüft." });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Unbekannter Fehler." });
});

const server = app.listen(PORT, () => console.log(`Fakten-Checker läuft auf http://localhost:${PORT} (${MODES[MODE]?.label || MODE}, Lizenzpflicht: ${REQUIRE_LICENSE ? "ja" : "nein"})`));

// ---------- Mitschrift: WebSocket-Weiterleitung zu Deepgram, Schlüssel bleibt am Server ----------
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", async (req, socket, head) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname !== "/api/listen" || !DG_KEY) return socket.destroy();
  let lic = null;
  try { lic = await licenseFor(url.searchParams.get("license")); requireQuota(lic, "audio"); }
  catch (e) { socket.write(`HTTP/1.1 ${e.status || 401} Unauthorized\r\n\r\n`); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, client => listen(client, url.searchParams, lic));
});
function listen(client, params, lic) {
  const q = new URLSearchParams();
  for (const k of ["model", "language", "smart_format", "punctuate", "interim_results", "diarize", "endpointing", "utterance_end_ms", "vad_events"]) {
    if (params.has(k)) q.set(k, params.get(k));
  }
  const upstream = new WebSocket(DG_URL + "?" + q, { headers: { Authorization: "Token " + DG_KEY } });
  const queue = [];
  let lastAudio = 0;
  // Gezählt wird die Zeit, in der tatsächlich Audio fließt (Pausen über 5 s zählen nicht)
  const meter = setInterval(() => {
    if (!lic || Date.now() - lastAudio > 5000) return;
    usageOf(lic).dgSec += 5; saveLicenses();
    if (quotaLeft(lic).sec <= 0) { client.close(4402, "Kontingent aufgebraucht"); }
  }, 5000);
  upstream.on("open", () => { queue.splice(0).forEach(([d, bin]) => upstream.send(d, { binary: bin })); });
  upstream.on("message", (data, isBinary) => { if (client.readyState === 1) client.send(data, { binary: isBinary }); });
  upstream.on("close", (code, reason) => { clearInterval(meter); if (client.readyState === 1) client.close(code === 1005 ? 1000 : code, reason); });
  upstream.on("error", () => { clearInterval(meter); if (client.readyState === 1) client.close(1011, "Deepgram nicht erreichbar"); });
  client.on("message", (data, isBinary) => {
    if (isBinary) lastAudio = Date.now();
    if (upstream.readyState === 1) upstream.send(data, { binary: isBinary });
    else if (upstream.readyState === 0) queue.push([data, isBinary]);
  });
  client.on("close", () => { clearInterval(meter); try { upstream.close(); } catch {} });
}
