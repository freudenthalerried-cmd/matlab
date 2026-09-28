/**
 * Was wir nicht führen — und wofür trotzdem bezahlt wird.
 *
 * **Der Anlass, 6. September 2026.** Der Shop führt seit dem Aufbau des
 * Suchregisters eine Liste dessen, was er **nicht** führt: 24 Wörter, jedes
 * mit einem Grund und einer redaktionellen Antwort. Sie stehen in
 * `data/suchwoerter.json` unter `_nichtAufgenommen`, gehen in `llms.txt`, an
 * den Browser und seit heute auch dann auf die Suchseite, wenn die
 * Trefferliste nicht leer ist.
 *
 * Gegen die Ausschlussliste der Kampagne gehalten:
 *
 * ```
 * Wörter im Register:                        24
 * davon in den Ausschlüssen der Kampagne:     0
 * ```
 *
 * **Keines.** Die Anzeige läuft auf *Phrase* — sie erscheint, sobald die
 * Anfrage den Produktbegriff enthält, und „XPS 80 mm Sockelschiene" enthält
 * ihn. Der Klick wird bezahlt, und am Ende steht ein Satz, der mit *„führen
 * wir nicht"* beginnt.
 *
 * > **Ein Betrieb, der aufschreibt, was er nicht hat, und weiter dafür
 * > bezahlt, hat die Liste für den falschen Leser geschrieben.**
 *
 * Es ist dieselbe Begründung, mit der die Gruppe „Falsche Absicht" ihre
 * Wörter trägt: nicht *„kauft wahrscheinlich nicht"*, sondern **kann hier
 * nicht kaufen, was er sucht.**
 *
 * ## Warum die Liste abgeleitet wird und nicht abgeschrieben
 *
 * Ein zweiter Eintrag desselben Sachverhalts wäre ein zweites Register, das
 * jemand nachführen muss — und dieser Bestand weiß inzwischen, was daraus
 * wird. Die Ausschlüsse entstehen deshalb **aus** dem Register, bei jedem Lauf
 * neu.
 *
 * ## Zwei Wörter bleiben drin, mit Maß
 *
 * Ein Ausschluss, der im eigenen Seitentext gewöhnliches Deutsch ist, trifft
 * die eigene Kundschaft — der Fall vom 6. September früh („vergleich", 39× im
 * eigenen Text, im Satz, der das Verkaufsargument trägt). Gemessen über alle
 * 82 gebauten Seiten:
 *
 * ```
 *  19  gleitmittel    — steht auf der Kanalliste als Position, die anderswo zu besorgen ist
 *  17  abdichtung     — steht auf Perimeter- und Kellerwandseiten, über der gedämmt wird
 *   2  drainage, kaminkopf, diagonalgewebe
 *   1  sockelschiene
 *   0  die übrigen 18
 * ```
 *
 * Die beiden über der Grenze werden **zurückgehalten** und benannt: Wer
 * „Abdichtung" tippt, während er die Kellerwand plant, ist der Leser, für den
 * die Perimeterseite geschrieben ist. Die Entscheidung fällt aus derselben
 * gemessenen Grenze wie beim Ausschlussprüfer und nicht nach Gefühl.
 */

import { EIGENWORTGRENZE, eigenvorkommen } from './ausschluss.js';

/** Thema, unter dem die abgeleiteten Ausschlüsse in der Liste stehen. */
export const THEMA = 'Nicht im Sortiment';

/**
 * Leitet die Ausschlüsse aus dem Register ab.
 *
 * @param {object} eingabe
 * @param {{wort: string, antwort?: string}[]} eingabe.register
 * @param {string} eingabe.seitentext   Fließtext aller gebauten Seiten
 * @param {string[]} [eingabe.keywords] geführte Keywords — ein Ausschluss darf keines treffen
 * @param {number} [eingabe.grenze]
 * @returns {{woerter: string[], zurueckgehalten: {wort: string, vorkommen: number, grund: string}[]}}
 */
export function ausschluesseAusRegister({ register, seitentext, keywords = [], grenze = EIGENWORTGRENZE }) {
  const woerter = [];
  const zurueckgehalten = [];

  for (const eintrag of register ?? []) {
    const wort = String(eintrag?.wort ?? '').trim().toLowerCase();
    if (!wort) continue;

    // Ein Wort, auf das die Kampagne bietet, darf sie nicht zugleich
    // ausschließen. Der Fall ist heute keiner — geprüft wird er trotzdem,
    // weil beide Listen aus derselben Wirklichkeit kommen und sich ändern.
    const imKeyword = keywords.find((k) => new RegExp(`\\b${wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(k));
    if (imKeyword) {
      zurueckgehalten.push({
        wort,
        vorkommen: 0,
        grund: `steht im geführten Keyword „${imKeyword}" — worauf geboten wird, wird nicht ausgeschlossen`,
      });
      continue;
    }

    const vorkommen = eigenvorkommen(wort, seitentext) ?? 0;
    if (vorkommen >= grenze) {
      zurueckgehalten.push({
        wort,
        vorkommen,
        grund: `steht ${vorkommen}× im eigenen Seitentext — der Ausschluss träfe den Leser, `
          + 'für den diese Seiten geschrieben sind',
      });
      continue;
    }

    woerter.push(wort);
  }

  return { woerter, zurueckgehalten };
}

/**
 * Hält Register und Ausschlussliste gegeneinander — **in beide Richtungen**.
 *
 * Vorwärts: Jedes Wort des Registers ist ausgeschlossen oder zurückgehalten
 * mit Grund. Rückwärts: Kein zurückgehaltenes Wort steht zugleich in der
 * Ausschlussliste, und kein abgeleiteter Ausschluss steht ohne Eintrag im
 * Register da.
 *
 * @param {object} eingabe
 * @param {{wort: string}[]} eingabe.register
 * @param {string[]} eingabe.ausgeschlossen
 * @param {{wort: string, grund: string}[]} eingabe.zurueckgehalten
 * @param {number} [eingabe.mindestens] ab wie vielen Registerwörtern die Aussage trägt
 */
export function deckungsbefund({ register, ausgeschlossen, zurueckgehalten, mindestens = 10 }) {
  const meldungen = [];
  const woerter = (register ?? []).map((e) => String(e?.wort ?? '').trim().toLowerCase()).filter(Boolean);
  const aus = new Set((ausgeschlossen ?? []).map((w) => String(w).toLowerCase()));
  const zurueck = new Map((zurueckgehalten ?? []).map((z) => [String(z.wort).toLowerCase(), z]));

  if (woerter.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-register',
      text: `nur ${woerter.length} Wörter im Register — darüber lässt sich nichts aussagen`,
    });
  }

  for (const w of woerter) {
    const z = zurueck.get(w);
    if (aus.has(w) && z) {
      meldungen.push({
        regel: 'zugleich-aus-und-zurueckgehalten',
        wort: w,
        text: `„${w}" ist ausgeschlossen und zugleich als zurückgehalten geführt`,
      });
      continue;
    }
    if (aus.has(w)) continue;
    if (!z) {
      meldungen.push({
        regel: 'registerwort-ohne-ausschluss',
        wort: w,
        text: `„${w}" führen wir nicht und schließen es nicht aus — die Anzeige zahlt für die Absage`,
      });
      continue;
    }
    if (!z.grund || z.grund.length < 30) {
      meldungen.push({
        regel: 'zurueckgehalten-ohne-grund',
        wort: w,
        text: `„${w}" wird zurückgehalten, ohne dass ein Grund dasteht`,
      });
    }
  }

  for (const w of aus) {
    if (!woerter.includes(w)) {
      meldungen.push({
        regel: 'ausschluss-ohne-register',
        wort: w,
        text: `„${w}" steht als abgeleiteter Ausschluss da, aber in keinem Registereintrag`,
      });
    }
  }

  return {
    geprueft: woerter.length,
    ausgeschlossen: woerter.filter((w) => aus.has(w)).length,
    zurueckgehalten: zurueck.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
