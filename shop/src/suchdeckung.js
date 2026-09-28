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
 * Keywords, die zu Recht auf keinen Artikel führen — mit dem Grund.
 *
 * **Der Anlass, 8. September 2026.** Bis heute galt für **jedes** Keyword ohne
 * Artikeltreffer derselbe Freibrief: *„Für eine Systemfrage ist die
 * Gruppenseite die richtige Antwort, und der Klick aus der Anzeige landet
 * ohnehin dort."* Der Satz stimmt — für Systemfragen. Er stand aber über
 * **allen** drei Fällen, und einer davon war keine Systemfrage:
 * **„Putzgrund Fassade"** ist eine Produktsuche, und den Putzgrund gibt es.
 *
 * > **Ein Freibrief für die eine Sorte deckt auch die andere.**
 */
export const SYSTEMFRAGEN = Object.freeze([
  Object.freeze({
    keyword: 'WDVS System kaufen',
    warum: 'Eine Systemfrage: Wer ein WDVS „System" sucht, sucht die Zusammenstellung und '
      + 'nicht einen Sack. Die Gruppenseite führt die Bestandteile und die Stückliste für '
      + '100 m² — das ist die Antwort, und der Klick aus der Anzeige landet ohnehin dort.',
  }),
  Object.freeze({
    keyword: 'Kaminsystem einzügig',
    warum: 'Dieselbe Lage wie beim WDVS: Ein einzügiger Systemkamin ist eine Zusammenstellung '
      + 'aus Fertigfuß, Rohren, Putztür und Zuluftplatte. Die Gruppenseite und die '
      + 'Wissensseite „Welche Teile ein Kaminzug braucht" beantworten die Frage; ein '
      + 'einzelner Artikel wäre die falsche Antwort.',
  }),
]);

/**
 * @param {object} eingabe
 * @param {string[]} eingabe.keywords
 * @param {(frage: string) => {art: string, titel: string}[]} eingabe.finde
 * @param {number} [eingabe.mindestens] ab wie vielen Keywords die Aussage trägt
 * @param {object[]} [eingabe.systemfragen] Keywords, die zu Recht keinen Artikel treffen
 */
export function suchdeckungsbefund({
  keywords, finde, mindestens = 10, systemfragen = SYSTEMFRAGEN,
}) {
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

    /*
     * **Ein Wort mehr, ein Treffer weniger — 8. September 2026.**
     *
     * Die Suche verlangt **alle** Wortstämme. „Putzgrund" findet den Artikel,
     * „Putzgrund Fassade" findet ihn nicht: Ein zusätzliches Wort macht die
     * Liste nicht genauer, sondern leer. Wer mehr tippt, bekommt weniger.
     *
     * Das ist keine Systemfrage und lässt sich auch nicht als eine begründen —
     * deshalb steht diese Regel **vor** dem Register und nicht dahinter.
     */
    if (systemfragen.some((f) => f.keyword === kw)) continue;

    const woerter = kw.split(/\s+/).filter(Boolean);
    let kuerzerMitArtikel = null;
    for (let i = 0; i < woerter.length && woerter.length > 1; i += 1) {
      const kuerzer = woerter.filter((_, n) => n !== i).join(' ');
      if ((finde(kuerzer) ?? []).some((t) => t.art === 'artikel')) {
        kuerzerMitArtikel = kuerzer;
        break;
      }
    }

    meldungen.push(kuerzerMitArtikel ? {
      regel: 'wort-mehr-treffer-weniger',
      keyword: kw,
      text: `„${kw}" findet keinen Artikel, „${kuerzerMitArtikel}" schon — ein zusätzliches `
        + 'Wort macht die Liste nicht genauer, sondern leer',
    } : {
      regel: 'keyword-ohne-artikel-ohne-grund',
      keyword: kw,
      text: `„${kw}" führt auf keinen Artikel, und nichts sagt, warum das in Ordnung ist`,
    });
  }

  for (const f of systemfragen) {
    if (!keywords.includes(f.keyword)) {
      meldungen.push({
        regel: 'grund-ohne-keyword',
        keyword: f.keyword,
        text: `„${f.keyword}" ist als Systemfrage begründet und wird gar nicht mehr geführt`,
      });
    }
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
