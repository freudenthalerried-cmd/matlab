import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { createEngine } from "./public/engine.js";

const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.MODEL || "claude-opus-5-5";
const engine = createEngine(new Anthropic(), MODEL);

const app = express();
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

app.get("/api/ping", (req, res) => res.json({ ok: true }));
app.post("/api/check", async (req, res, next) => {
  try { res.json({ claims: await engine.check(req.body?.text, req.body?.context) }); } catch (e) { next(e); }
});
app.post("/api/verify", async (req, res, next) => {
  try { res.json(await engine.verify(req.body?.claim)); } catch (e) { next(e); }
});
app.post("/api/detail", async (req, res, next) => {
  try { res.json(await engine.detail(req.body?.claim)); } catch (e) { next(e); }
});

app.use((err, req, res, next) => {
  if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Zu viele Anfragen, kurz warten." });
  if (err instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "API-Schlüssel fehlt oder ist ungültig." });
  if (err instanceof Anthropic.APIError) return res.status(502).json({ error: "Claude ist gerade nicht erreichbar." });
  if (err.message === "refused") return res.status(422).json({ error: "Diese Aussage wurde nicht geprüft." });
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Unbekannter Fehler." });
});

app.listen(PORT, () => console.log(`Fakten-Checker läuft auf http://localhost:${PORT} (Modell ${MODEL})`));
