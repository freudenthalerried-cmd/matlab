/**
 * Beantwortet die eigene Suche, wofür die Anzeige bezahlt?
 *
 * **Der Anlass, 6. September 2026.** Am 1. September ist ein Keyword aus der
 * Kampagne entfernt worden, mit einer Begründung, die seither als Kommentar
 * dasteht:
 *
 * > *„Auf ein Wort zu bieten, das die eigene Suche nicht beantwortet, ist ein
 * > bezahlter Klick auf eine leere Trefferliste."*
 *
 * Ein Satz, ein Fall, kein Prüfer. Genau die Gestalt, die dieser Bestand am
 * 6. September schon zweimal gefunden hat — und beide Male war die Regel dann
 * verletzt. **Hier nicht:** Gemessen über die 30 geführten Keywords gegen den
 * Index, den der Besucher im Browser bekommt, findet **jedes** etwas.
 *
 * > **Gefundene Fehler: keine. Das ist das Ergebnis — und der Grund, die
 * > Messung einzubauen, statt sie einmal gemacht zu haben.**
 *
 * ## Zwei Fragen, nicht eine
 *
 * 1. **Findet die Suche überhaupt etwas?** Nichts zu finden ist die leere
 *    Trefferliste aus dem Kommentar. Das ist die harte Regel.
 * 2. **Ist ein Artikel darunter?** Drei der dreißig führen heute nur auf eine
 *    Gruppen- oder Wissensseite: „Putzgrund Fassade", „WDVS System kaufen",
 *    „Kaminsystem einzügig". Das ist **keine** harte Regel: Für eine
 *    Systemfrage ist die Gruppenseite die richtige Antwort, und der Klick aus
 *    der Anzeige landet ohnehin dort. Es wird gezählt und genannt, nicht
 *    abgewiesen.
 *
 * ## Warum gegen `shop.js` und nicht gegen den Katalog
 *
 * Der erste Messversuch baute den Index nur aus `artikel` und
 * `suchwoerter` — ohne die 24 Inhaltsseiten. Er meldete drei Keywords ohne
 * jeden Treffer und hätte fast dazu geführt, eine Suche zu „reparieren", die
 * nicht kaputt ist.
 *
 * > **Ein Prüfer, der einen anderen Index befragt als der Kunde, misst einen
 * > anderen Shop.**
 *
 * Gemessen wird deshalb an `window.__SHOP__` aus dem gebauten `shop.js` —
 * denselben Daten, die im Browser des Besuchers liegen.
 */

/**
 * @param {object} eingabe
 * @param {string[]} eingabe.keywords
 * @param {(frage: string) => {art: string, titel: string}[]} eingabe.finde
 * @param {number} [eingabe.mindestens] ab wie vielen Keywords die Aussage trägt
 */
export function suchdeckungsbefund({ keywords, finde, mindestens = 10 }) {
  const meldungen = [];
  const ohneArtikel = [];
  let mitArtikel = 0;

  for (const kw of keywords) {
    const treffer = finde(kw) ?? [];
    if (treffer.length === 0) {
      meldungen.push({
        regel: 'keyword-ohne-treffer',
        keyword: kw,
        text: `„${kw}" findet in der eigenen Suche nichts — ein bezahlter Klick auf eine `
          + 'leere Trefferliste',
      });
      continue;
    }
    if (treffer.some((t) => t.art === 'artikel')) { mitArtikel += 1; continue; }
    ohneArtikel.push({ keyword: kw, treffer: treffer.map((t) => `${t.art}:${t.titel}`) });
  }

  if (keywords.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-keywords',
      keyword: null,
      text: `nur ${keywords.length} Keywords geprüft, erwartet mindestens ${mindestens}`,
    });
  }

  return {
    geprueft: keywords.length,
    mitArtikel,
    ohneArtikel,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
