/**
 * Was eine Seite ausdrücklich **nicht** führt — und was daraus für die
 * Anzeigen folgt.
 *
 * **Der Anlass, 6. September 2026.** `bin/kampagne.mjs` bietet in der
 * Anzeigengruppe „Dämmung" auf `EPS Fassadenplatten` und `Fassadendämmung EPS`,
 * bis zu **5,91 € je Klick**. Die eigene Landeseite sagt im zweiten Satz:
 *
 * > *„Die Fassadendämmplatte in Flächenstärke führen wir nicht — die
 * > geführten EPS-Stärken gleichen aus, sie dämmen die Fläche nicht."*
 *
 * Die geführten Stärken sind 2, 3 und 5 cm. Eine WDVS-Dämmung beginnt bei
 * acht.
 *
 * ## Die Regel gab es schon, als Kommentar
 *
 * Dieselbe Datei hat am 1. September ein Keyword **entfernt**, mit genau
 * dieser Begründung:
 *
 * > *„‚Kaminkopf Regenhaube' ist am 01.09. entfallen. Der Shop führt die
 * > Kaminkopfverkleidung ausdrücklich nicht … Auf ein Wort zu bieten, das die
 * > eigene Suche nicht beantwortet, ist ein bezahlter Klick auf eine leere
 * > Trefferliste."*
 *
 * > **Eine Regel, die einmal von Hand angewandt und nie aufgeschrieben wurde,
 * > gilt für den einen Fall, an dem jemand hingesehen hat.**
 *
 * ## Warum die vorhandene Deckungsprüfung es nicht fand
 *
 * `ungedeckteWoerter` fragt, ob die Wörter des Keywords **auf der Seite
 * stehen**. „Fassadendämmung" steht dort — im Satz, der sie verneint, und in
 * der Begriffstabelle darunter.
 *
 * > **Der Prüfer fragt, ob das Wort auf der Seite steht. Er fragt nicht, in
 * > welchem Satz.**
 *
 * ## Was diese Regel kann und was nicht
 *
 * Sie liest die Abgrenzungssätze der Landeseite und leitet daraus Wortstämme
 * ab. Ein Keyword, das einen solchen Stamm enthält, wird zurückgehalten.
 *
 * **Sie fängt nicht alles.** Aus „Fassadendämmplatte führen wir nicht" folgt
 * der Stamm `fassadendä` — er trifft „Fassadendämmung EPS" und **nicht**
 * „EPS Fassadenplatten", obwohl dasselbe Bauteil gemeint ist. Das zweite Wort
 * ist von Hand entfernt worden, und diese Grenze steht hier, damit niemand die
 * Regel für vollständig hält.
 */

/** Woran ein Abgrenzungssatz erkannt wird. Absichtlich eng. */
export const ABGRENZUNGSMUSTER =
  /\bführen wir (?:derzeit |hier |aktuell )?(?:nicht|keine[nrs]?\b)/i;

/** Wie viele Zeichen eines Wortes den Stamm bilden. */
export const STAMMLAENGE = 10;

/** Wörter, die in jedem Satz vorkommen und nichts abgrenzen. */
const FUELLWOERTER = new Set([
  'die', 'der', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
  'und', 'oder', 'nicht', 'kein', 'keine', 'keinen', 'wir', 'sie', 'ist', 'sind',
  'wird', 'werden', 'führen', 'derzeit', 'aktuell', 'hier', 'für', 'von', 'mit',
  'auf', 'aus', 'als', 'auch', 'aber', 'dass', 'was', 'wie', 'bei', 'zum', 'zur',
  'sich', 'nur', 'noch', 'schon', 'im', 'in', 'an', 'am', 'es', 'zu', 'so',
]);

/** Vergleichsform: klein, ohne Umlaute-Sonderfälle, nur Buchstaben. */
export const stamm = (wort) => String(wort ?? '')
  .toLowerCase()
  .replace(/[^a-zäöüß]/g, '')
  .slice(0, STAMMLAENGE);

/** Die Sätze eines Textes — grob am Punkt getrennt, das genügt hier. */
export const saetze = (text) => String(text ?? '')
  .split(/(?<=[.!?])\s+|\n+|—/)
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Die Wortstämme, die eine Seite ausdrücklich nicht führt.
 *
 * @param {string} seitentext  Fließtext der Landeseite
 * @returns {{stamm: string, wort: string, satz: string}[]}
 */
export function abgegrenzteStaemme(seitentext) {
  const gefunden = new Map();
  for (const satz of saetze(seitentext)) {
    if (!ABGRENZUNGSMUSTER.test(satz)) continue;
    for (const roh of satz.split(/[^A-Za-zÄÖÜäöüß]+/)) {
      const klein = roh.toLowerCase();
      if (klein.length < 6 || FUELLWOERTER.has(klein)) continue;
      const s = stamm(roh);
      if (s.length < 6 || gefunden.has(s)) continue;
      gefunden.set(s, { stamm: s, wort: roh, satz: satz.slice(0, 140) });
    }
  }
  return [...gefunden.values()];
}

/**
 * Bietet ein Keyword auf etwas, das die eigene Landeseite verneint?
 *
 * @param {string} keyword
 * @param {string} seitentext
 * @returns {{stamm: string, wort: string, satz: string}|null}
 */
export function abgegrenztesKeyword(keyword, seitentext) {
  const k = String(keyword ?? '').toLowerCase();
  for (const eintrag of abgegrenzteStaemme(seitentext)) {
    // Der Stamm muss im Keyword **zusammenhängend** vorkommen; ein Keyword
    // ist kurz, und ein Teilstring ist hier die tragfähigere Prüfung als eine
    // Wortgrenze (Komposita).
    if (k.replace(/[^a-zäöüß]/g, '').includes(eintrag.stamm)) return eintrag;
  }
  return null;
}
