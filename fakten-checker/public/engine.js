// Prüflogik, gemeinsam genutzt vom Node-Server und von der Browser-Version
export const TRUSTED = [
  "statistik.at", "gv.at", "europa.eu", "oecd.org", "who.int", "worldbank.org", "imf.org", "un.org",
  "unhcr.org", "ourworldindata.org", "destatis.de", "bfs.admin.ch", "wifo.ac.at", "ihs.ac.at",
  "oenb.at", "ams.at", "wko.at", "apa.at", "orf.at", "reuters.com", "nature.com", "science.org",
  "nih.gov", "wikipedia.org",
];

export const RULES = `Du bist ein strenger, neutraler Faktenchecker für Gespräche im Alltag. Standardregion ist Österreich, außer die Aussage nennt etwas anderes.
Nutze nur Zahlen aus zuverlässigen Quellen (Statistik Austria, Eurostat, OECD, WHO, Weltbank, Ministerien, peer-reviewte Studien). Nenne Quelle und Datenjahr.
Hängt das Ergebnis von der Definition ab (z. B. Staatsbürgerschaft vs. Migrationshintergrund), erkläre das in "definition" und bewerte "teilweise".
Erfinde keine Zahlen. Bei Unsicherheit: verdict "unklar", confidence "niedrig".
Felder je Aussage: claim (Aussage kurz), verdict ("stimmt"|"teilweise"|"falsch"|"unklar"), number (eine Kernzahl, max. 12 Zeichen, z. B. "≈ 20 %"), fact (ein Satz Deutsch mit der richtigen Zahl), definition (welche Kennzahl genau, max. 1 Satz), source, asOf (Datenstand), confidence ("hoch"|"mittel"|"niedrig"), note (optional, max. 1 Satz),
counter (Gegenargument: 1–2 kurze, sachliche Sätze in einfacher Alltagssprache, die man im Gespräch sofort laut sagen kann, mit konkreter Zahl und Quelle; stimmt die Aussage, stattdessen eine Einordnung, die wichtigen Kontext ergänzt).`;

const clean = (s, max) => String(s ?? "").trim().slice(0, max);
const norm = s => s.toLowerCase().replace(/\s+/g, " ");

function textOf(res) {
  return res.content.filter(b => b.type === "text").map(b => b.text).join("");
}

// Cited URLs first, then search hits, max. 5
function sourcesOf(res) {
  const seen = new Map();
  for (const b of res.content) {
    if (b.type === "text") for (const c of b.citations ?? []) if (c.url) seen.set(c.url, c.title || c.url);
  }
  for (const b of res.content) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r.url && seen.size < 5) seen.set(r.url, r.title || r.url);
    }
  }
  return [...seen].slice(0, 5).map(([url, title]) => ({ url, title }));
}

function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  throw Object.assign(new Error("Antwort war kein gültiges JSON"), { status: 502 });
}

// Modi: welches Modell schnell prüft (Schnellcheck, Sparring) und welches gründlich (Live-Prüfung, Details)
export const MODES = {
  spar:     { label: "Sparmodus",  fast: "claude-haiku-5-5", deep: "claude-sonnet-5-5", verifyUses: 2, coachEvery: 30000, filter: true },
  genau:    { label: "Genau",      fast: "claude-opus-5-5",  deep: "claude-opus-5-5",   verifyUses: 3, coachEvery: 15000, filter: false },
  guenstig: { label: "Am günstigsten", fast: "claude-haiku-5-5", deep: "claude-haiku-5-5", verifyUses: 2, coachEvery: 45000, filter: true },
};
export function modeOf(name) {
  if (MODES[name]) return MODES[name];
  // Ältere Einstellung: ein einzelnes Modell für alles
  if (/^claude-/.test(name || "")) return { label: name, fast: name, deep: name, verifyUses: 3, coachEvery: 15000, filter: false };
  return MODES.spar;
}

// US-Dollar pro Million Token (Preisliste Oktober 2026) und pro Websuche
export const PRICES = {
  "claude-opus-5-5": { in: 4, out: 20 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
};
export const SEARCH_USD = 0.01;
export function costOf(model, usage) {
  const p = PRICES[model] || PRICES["claude-opus-5-5"];
  const searches = usage?.server_tool_use?.web_search_requests || 0;
  return ((usage?.input_tokens || 0) * p.in + (usage?.output_tokens || 0) * p.out) / 1e6 + searches * SEARCH_USD;
}

// Vorfilter für den Sparmodus: nur Abschnitte prüfen, die nach einer Tatsachenbehauptung klingen
const CLAIM_HINTS = /\d|prozent|million|milliard|tausend|hundert|zehn|zwanzig|dreißig|vierzig|fünfzig|hälfte|drittel|viertel|doppelt|dreimal|mehr als|weniger als|höchste|niedrigste|rekord|gestiegen|gesunken|steigt|sinkt|studie|statistik|laut |durchschnitt|jeder|jede |alle |niemand|nie |immer|meiste|größte|kleinste|euro|kosten|steuer|gehalt|lohn|einwohner|ausländer|arbeitslos|inflation|kriminal|weltweit|in österreich|in deutschland/i;
export const looksLikeClaim = text => CLAIM_HINTS.test(text || "");

export function createEngine(client, modeName, { onUsage } = {}) {
  const mode = modeOf(modeName);

  async function ask(model, prompt, { effort, webUses = 0, maxTokens }) {
    // Server-side refusal fallback exists only for these model families
    const fallback = /^claude-(opus|sonnet|fable)/.test(model);
    // Websuche mit dynamischer Filterung gibt es nur für Opus/Sonnet; Haiku nutzt die Basisversion
    const searchType = /^claude-haiku/.test(model) ? "web_search_20250305" : "web_search_20260209";
    const messages = [{ role: "user", content: prompt }];
    const tools = webUses
      ? [{ type: searchType, name: "web_search", max_uses: webUses, allowed_domains: TRUSTED,
           user_location: { type: "approximate", country: "AT" } }]
      : undefined;
    for (let round = 0; round < 4; round++) {
      const res = await client.beta.messages.create({
        model,
        max_tokens: maxTokens,
        output_config: { effort },
        messages,
        ...(tools && { tools }),
        ...(fallback && { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }),
      });
      onUsage?.({ model, usd: costOf(model, res.usage), searches: res.usage?.server_tool_use?.web_search_requests || 0 });
      if (res.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: res.content });
        continue;
      }
      if (res.stop_reason === "refusal") throw Object.assign(new Error("refused"), { status: 422 });
      return res;
    }
    throw new Error("Websuche hat zu lange gedauert");
  }

  // Simple 24h cache: same claim, same answer, no extra cost
  const cache = new Map();
  const DAY = 24 * 60 * 60 * 1000;
  async function cached(key, fn) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.t < DAY) return hit.v;
    const v = await fn();
    cache.set(key, { v, t: Date.now() });
    if (cache.size > 5000) cache.delete(cache.keys().next().value);
    return v;
  }

  // Schnellcheck: findet Behauptungen im Gesprächsausschnitt und bewertet sie aus dem Modellwissen
  async function check(rawText, rawContext) {
    const text = clean(rawText, 4000), context = clean(rawContext, 1500);
    if (!text) throw Object.assign(new Error("Kein Text übergeben."), { status: 400 });
    return cached("c:" + norm(text), async () => {
      const r = await ask(mode.fast, `${RULES}

Unten steht der neueste Ausschnitt eines laufenden Gesprächs (Spracherkennung, kann Fehler enthalten). Finde jede prüfbare Tatsachenbehauptung darin (Zahlen, Statistiken, Fakten). Ignoriere Meinungen, Fragen und Small Talk. Widersprechen sich Personen, prüfe jede Aussage einzeln. Antworte nur mit einem JSON-Array solcher Objekte, [] wenn nichts prüfbar ist.
${context ? `\nVorheriger Kontext (nicht prüfen, nur zum Verständnis):\n${context}\n` : ""}
Neuer Ausschnitt:
${text}`, { effort: "low", maxTokens: 2000 });
      const list = parseJson(textOf(r));
      return Array.isArray(list) ? list.slice(0, 5) : [];
    });
  }

  // Live-Prüfung einer Behauptung mit Websuche in vertrauenswürdigen Quellen
  async function verify(rawClaim) {
    const claim = clean(rawClaim, 500);
    if (!claim) throw Object.assign(new Error("Keine Behauptung übergeben."), { status: 400 });
    return cached("v:" + norm(claim), async () => {
      const r = await ask(mode.deep, `${RULES}

Prüfe diese Aussage mit der Websuche anhand der aktuellsten offiziellen Daten. Antworte zum Schluss nur mit EINEM JSON-Objekt mit den Feldern oben.

Aussage: ${claim}`, { effort: "low", webUses: mode.verifyUses, maxTokens: 4000 });
      return { ...parseJson(textOf(r)), sources: sourcesOf(r) };
    });
  }

  // Ausführliche Recherche auf Wunsch
  async function detail(rawClaim) {
    const claim = clean(rawClaim, 500);
    if (!claim) throw Object.assign(new Error("Keine Behauptung übergeben."), { status: 400 });
    return cached("d:" + norm(claim), async () => {
      const r = await ask(mode.deep, `Du bist ein neutraler Faktenchecker. Recherchiere mit der Websuche und erkläre auf Deutsch, knapp und sachlich, die Faktenlage zu dieser Aussage (Region Österreich, wenn nicht anders genannt):
„${claim}“
Gliedere so, ohne Markdown-Tabellen und ohne #-Überschriften:
Bewertung: ein Satz.
Zahlen: 3–6 Punkte mit "- " (Kennzahl, Wert, Jahr, Quelle), auch Entwicklung über die Zeit und Vergleich mit EU oder Nachbarländern, wenn sinnvoll.
Gegenargumente: 2–3 Punkte, die man im Gespräch sagen kann.
Definitionen und Fallstricke: 1–3 Punkte.
Erfinde nichts und markiere Unsicheres deutlich.`, { effort: "high", webUses: 6, maxTokens: 12000 });
      return { text: textOf(r), sources: sourcesOf(r) };
    });
  }

  // Sparring-Partner: prüft meine eigenen Aussagen und schlägt vor, was ich noch sagen kann
  async function coach(rawText, rawMe) {
    const text = clean(rawText, 5000), me = clean(rawMe, 40);
    if (!text) throw Object.assign(new Error("Kein Text übergeben."), { status: 400 });
    const r = await ask(mode.fast, `Du bist mein persönlicher Sparring-Partner in einem laufenden Gespräch (Standardregion Österreich). Ziel: Ich soll sachlich richtig, kompetent und hilfreich wirken.
${me ? `Ich bin „${me}“ in der Mitschrift.` : "Wer ich in der Mitschrift bin, ist unklar; bezieh dich auf das Gespräch insgesamt."}
Unten steht der neueste Teil der Mitschrift (Spracherkennung, kann Fehler enthalten). Antworte nur mit EINEM JSON-Objekt:
{"check": "Stimmt, was ich zuletzt gesagt habe? Ein Satz, bei Fehlern mit Korrektur und richtiger Zahl; leer, wenn ich nichts Prüfbares gesagt habe",
 "checkVerdict": "stimmt" | "teilweise" | "falsch" | "",
 "add": ["1–3 kurze, nützliche Fakten oder Argumente zum aktuellen Thema, mit Zahl, Quelle und Jahr, die ich jetzt einbringen kann"],
 "say": "ein natürlicher Satz, den ich als Nächstes sagen könnte",
 "ask": "eine kluge Rückfrage an mein Gegenüber"}
Regeln: nur zuverlässige Zahlen (Statistik Austria, Eurostat, OECD, WHO, Ministerien), nichts erfinden, Unsicheres weglassen. Kurz, Alltagssprache, fürs Handy. Bleib sachlich und respektvoll, keine rhetorischen Tricks.

Mitschrift:
${text}`, { effort: "low", maxTokens: 1500 });
    return parseJson(textOf(r));
  }

  return { check, verify, detail, coach, mode };
}
