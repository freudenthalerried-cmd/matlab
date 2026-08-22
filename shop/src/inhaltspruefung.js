/**
 * Prüft Inhalte auf die Regeln, die vor dem ersten Text feststanden.
 *
 * Grundlage ist `inhalte-und-pruefteam.md`: Eine widerlegte Angabe ist
 * teurer als Schweigen. Wer massenhaft Inhalte erzeugt und dabei einen
 * Fehler einbaut, hat nicht neunundneunzig gute Seiten, sondern eine
 * Quelle, der nicht mehr geglaubt wird.
 *
 * Der Prüfer ist bewusst grob — wie sein Vorbild `bin/testpruefung.mjs`.
 * Er versteht keinen Fachtext, er sucht Muster. Was er meldet, ist ein
 * **Verdacht, kein Urteil**; jeder Treffer gehört angesehen. Ein Prüfer,
 * der Urteile fällt, wird ruhiggestellt statt befolgt.
 *
 * Wo ein Treffer begründet abgelehnt wird, steht im Text die Zeile
 * `<!-- pruefung: begruendet — Grund -->`. Der Prüfer schweigt dann für
 * diesen Absatz. Eine Ausnahme, die man aufschreiben muss, wird seltener
 * aus Bequemlichkeit gemacht als eine, die man wegkonfiguriert.
 */

/** Zahlen mit Maßeinheit — sie sind Behauptungen und brauchen eine Quelle. */
const ZAHL_MIT_EINHEIT = /\d+(?:[.,]\d+)?\s*(?:€|EUR|m²|m³|mm|cm|kg|g\/m²|l|%|Bq\/m³|°C|min|h|Std|Jahre?|Monate?)/gi;

/** Belegformen, die als Quelle gelten. */
const QUELLE = /\[[^\]]*\]\([^)]+\)|Quelle:|laut\s+\p{Lu}|Stand:|siehe\s+\p{Lu}|ÖNORM\s+[A-Z]|DIN\s*(?:EN\s*)?\d|EN\s*\d/u;

/**
 * Normbezüge ohne Nummer sind wertlos — Normen ändern sich.
 *
 * Die Wortgrenze ist hier von Hand gesetzt statt über `\b`: JavaScripts `\b`
 * beruht auf ASCII-Wortzeichen, und „Ö" gehört nicht dazu. `\bÖNORM` trifft
 * deshalb **nie** — der Prüfer hätte genau die Regel verschwiegen, für die er
 * gebaut wurde. Gefunden beim ersten Probelauf.
 */
const NORM_OHNE_NUMMER = /(?<![\p{L}\d])(?:ÖNORM|DIN|EN|OIB[- ]Richtlinie)(?![\p{L}\d])(?!\s*(?:[A-Z]\s*)?\d)/gu;

/**
 * Wörter, die eine Grenze verletzen. Nicht der Wahrheit wegen, sondern der
 * Zulässigkeit: Gesundheitsaussagen, Rechtsauskünfte und Erfolgszusagen
 * gehören einem Baustoffhändler nicht.
 */
export const GRENZWOERTER = Object.freeze([
  { wort: /\bgesundheitlich|\bGesundheit\b|\bkrebs/i, grenze: 'Gesundheitsaussage' },
  { wort: /\bheilt\b|\bschützt vor Krankheit/i, grenze: 'Gesundheitsaussage' },
  { wort: /\brechtssicher\b|\brechtlich unbedenklich\b|\bwir beraten Sie rechtlich/i, grenze: 'Rechtsauskunft' },
  { wort: /\bgarantiert\b|\bwir garantieren\b|\bzugesichert\b/i, grenze: 'Erfolgszusage' },
  { wort: /\bdauerhaft trocken\b|\bfür immer\b/i, grenze: 'Erfolgszusage' },
]);

/** Ein Preis ohne Stand und ohne netto/brutto ist in vier Wochen falsch. */
const PREIS = /\d+(?:[.,]\d+)?\s*(?:€|EUR)/i;
const PREIS_EINORDNUNG = /\bnetto\b|\bbrutto\b|\bexkl\.|\binkl\./i;
const STAND = /Stand:|Preisstand|Stand\s+\d/i;

/** Zerlegt einen Text in Absätze mit Zeilennummer. */
export function inAbsaetze(text) {
  const absaetze = [];
  let zeile = 1;
  for (const stueck of text.split(/\n\s*\n/)) {
    if (stueck.trim()) absaetze.push({ text: stueck, zeile });
    zeile += stueck.split('\n').length + 1;
  }
  return absaetze;
}

/** Prüft einen einzelnen Absatz auf die vorab festgelegten Regeln. */
export function pruefeAbsatz(absatz) {
  const verdacht = [];
  const t = absatz.text;

  if (/<!--\s*pruefung:\s*begruendet/i.test(t)) return verdacht;
  // Überschriften und Codeblöcke tragen keine Behauptungen.
  if (/^\s*#{1,6}\s/.test(t) || /^\s*```/.test(t)) return verdacht;

  const zahlen = [...t.matchAll(ZAHL_MIT_EINHEIT)].map((m) => m[0]);
  if (zahlen.length > 0 && !QUELLE.test(t)) {
    verdacht.push(`Zahl ohne Quelle: ${zahlen.slice(0, 3).join(', ')} — jede Zahl braucht Herkunft und Stand`);
  }

  for (const treffer of t.matchAll(NORM_OHNE_NUMMER)) {
    verdacht.push(`„${treffer[0]}" ohne Nummer — Normen ändern sich, die Fundstelle gehört dazu`);
  }

  for (const { wort, grenze } of GRENZWOERTER) {
    const treffer = t.match(wort);
    if (treffer) verdacht.push(`${grenze}: „${treffer[0]}" — diese Aussage steht einem Baustoffhändler nicht zu`);
  }

  if (PREIS.test(t)) {
    if (!PREIS_EINORDNUNG.test(t)) verdacht.push('Preis ohne netto/brutto — der Unterschied sind 20 %');
    if (!STAND.test(t)) verdacht.push('Preis ohne Stand — er ist in vier Wochen falsch');
  }

  // Blockzitate brauchen eine Quelle, sonst sind sie fremder Text ohne Beleg.
  if (/^\s*>/m.test(t) && !QUELLE.test(t)) {
    verdacht.push('Zitat ohne Quellenangabe — Urheberrecht verlangt die Fundstelle');
  }

  return verdacht;
}

/** Prüft einen ganzen Text und liefert die Verdachtsfälle je Absatz. */
export function pruefeInhalt(text, name = '') {
  const absaetze = inAbsaetze(text);
  const treffer = absaetze
    .map((a) => ({ zeile: a.zeile, auszug: a.text.slice(0, 60).replace(/\s+/g, ' '), verdacht: pruefeAbsatz(a) }))
    .filter((a) => a.verdacht.length > 0);
  return {
    name,
    absaetze: absaetze.length,
    treffer,
    sauber: treffer.length === 0,
  };
}
