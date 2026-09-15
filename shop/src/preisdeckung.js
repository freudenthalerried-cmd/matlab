/**
 * Auf welche Preise ein Gebot wirklich ruht.
 *
 * **Der Anlass, 8. September 2026.** `src/preisalter.js` eskaliert einen zu
 * alten Einkaufspreis, sobald ein Gebot darauf ruht — und bestimmt das über
 * die Positionen der **Referenzwarenkörbe** der schaltenden Gruppen. Seine
 * eigene Begründung nennt aber zwei Gründe, warum der Drehstiftdübel damals
 * nicht eskaliert wurde:
 *
 * > *„2,15 € Einkauf für hundert Stück, **in keinem Keyword**, in keinem
 * > Referenzkorb."*
 *
 * Geprüft wurde nur der zweite. Gemessen am 8. September trifft das Keyword
 * **„Fassadendübel"** der schaltenden Gruppe WDVS genau diesen Artikel, und
 * sein Preis ist **104 Tage** alt.
 *
 * > **Die Begründung nannte zwei Gründe; geprüft wurde einer — und der andere
 * > gilt nicht mehr.**
 *
 * Gemessen sind es 14 Artikel, die ein geführtes Keyword einer schaltenden
 * Gruppe trifft und die in keinem Referenzwarenkorb liegen. Einer davon ist
 * über der Grenze. Der Warenkorb ist eben eine Rechengrundlage für das Gebot,
 * kein Verzeichnis dessen, was der Klick zu sehen bekommt:
 *
 * > **Das Gebot ruht auf dem Korb; gekauft wird, was das Wort nennt.**
 *
 * **Gate 29 (8. September):** Ein Keyword, dessen eigene Trefferliste einen
 * Artikel mit überaltertem Einkaufspreis enthält, wird **zurückgestellt** —
 * nicht die Gruppe, nicht die Kampagne. Ein bezahlter Klick auf ein solches
 * Wort kauft Besucher für eine Marge, die niemand bestätigt hat. Sobald der
 * Preis bestätigt ist, kommt das Wort von selbst zurück: Die Liste entsteht
 * bei jedem Lauf neu.
 */

/**
 * Welche Keywords auf einen überalterten Preis zeigen.
 *
 * @param {object} eingabe
 * @param {{Keyword: string, Anzeigengruppe: string}[]} eingabe.keywords
 * @param {(frage: string) => {sku?: string}[]} eingabe.finde  die eigene Suche
 * @param {Map<string, number>} eingabe.alterJeSku  Preisalter in Tagen
 * @param {number} eingabe.grenzeTage
 */
export function preisdeckungsbefund({ keywords, finde, alterJeSku, grenzeTage }) {
  const betroffen = [];
  for (const k of keywords) {
    const alt = [];
    for (const treffer of finde(k.Keyword)) {
      if (!treffer?.sku) continue;
      const tage = alterJeSku.get(treffer.sku);
      if (tage === undefined || tage <= grenzeTage) continue;
      alt.push({ sku: treffer.sku, tage });
    }
    if (alt.length) {
      alt.sort((a, b) => b.tage - a.tage);
      betroffen.push({ ...k, alt });
    }
  }
  return {
    geprueft: keywords.length,
    betroffen,
    sauber: betroffen.length === 0,
  };
}

/**
 * Die Artikelnummern, auf deren Preis ein Gebot ruht — Korb **und** Wort.
 *
 * Die Vereinigung, nicht die Schnittmenge: Ein Artikel trägt das Gebot, wenn
 * er in die Rechnung eingeht (Referenzwarenkorb) **oder** wenn ein bezahltes
 * Wort ihn nennt. Beides sind Wege, auf denen Geld an seinem Preis hängt.
 */
export function gebotstragendeSkus({ korbSkus = [], keywords = [], finde }) {
  const skus = new Set(korbSkus);
  for (const k of keywords) {
    for (const treffer of finde(k.Keyword ?? k)) {
      if (treffer?.sku) skus.add(treffer.sku);
    }
  }
  return skus;
}

/**
 * Steht der Rettungsweg der Preisdatei noch offen?
 *
 * **Der Anlass, 9. September 2026, nachmittags.** Der Behälter wurde neu
 * gestartet. Am 8. September hat genau das die Preisdatei gekostet: Sie steht
 * zu Recht in `.gitignore` — sie trägt die Einkaufskonditionen — und lag damit
 * in **einer** Kopie, in einem Verzeichnis, das jederzeit neu aufgesetzt wird.
 *
 * Zurückgeholt wurde sie damals aus der **gebauten Ausgabe**: `shop.js` trägt
 * die Verkaufspreise, und mit der Zielmarge lässt sich der Einkauf
 * zurückrechnen. Heute nachgeprüft, nicht angenommen — Datei beiseite,
 * `npm run preise-wiederherstellen`, verglichen: **46 von 46 Einkaufspreisen
 * auf den Cent identisch.** Danach das Original byteweise zurückgelegt.
 *
 * > **Der Rettungsweg hängt daran, dass die gebaute Ausgabe versioniert ist —
 * > und gebaute Ausgaben versioniert man normalerweise nicht.**
 *
 * Wer `ausgabe/` eines Tages in `.gitignore` schreibt, tut das Naheliegende
 * und Übliche. Er kappt damit den einzigen Weg zurück, und niemand erführe es
 * bis zum nächsten Verlust — dann ist es zu spät, denn der Weg wird genau in
 * dem Moment gebraucht, in dem er fehlt.
 *
 * Geprüft wird deshalb beides: dass die Datei existiert **und** dass sie
 * versioniert ist. Eine vorhandene, aber ungetrackte Datei ist kein
 * Rettungsweg, sondern dieselbe eine Kopie wie die Preisdatei selbst.
 *
 * @param {(pfad: string) => boolean} gibtEs
 * @param {(pfad: string) => boolean} versioniert
 */
export function rettungswegbefund(gibtEs, versioniert) {
  const meldungen = [];
  for (const pfad of RETTUNGSWEG) {
    if (!gibtEs(pfad)) {
      meldungen.push({
        regel: 'rettungsweg-fehlt',
        pfad,
        text: `${pfad} gibt es nicht — aus ihr rechnet npm run preise-wiederherstellen die `
          + 'Einkaufspreise zurück, wenn die Preisdatei verloren geht',
      });
      continue;
    }
    if (!versioniert(pfad)) {
      meldungen.push({
        regel: 'rettungsweg-nicht-versioniert',
        pfad,
        text: `${pfad} liegt da, ist aber nicht versioniert — beim nächsten Neuaufsetzen des `
          + 'Behälters ist sie weg, und mit ihr der einzige Weg zurück zu den Einkaufspreisen',
      });
    }
  }
  return { geprueft: RETTUNGSWEG.length, meldungen, sauber: meldungen.length === 0 };
}

/**
 * Die Dateien, aus denen sich die Preisdatei zurückrechnen lässt.
 *
 * Nur `shop.js` — sie trägt die Verkaufspreise aller 46 Artikel im
 * Shopdatensatz. Die Artikelseiten tragen dieselben Zahlen, aber einzeln; wer
 * hier eine zweite Datei einträgt, muss `bin/preiswiederherstellung.mjs`
 * mitnehmen, sonst führt das Register etwas, das der Rettungsweg nicht liest.
 */
export const RETTUNGSWEG = Object.freeze(['ausgabe/site/shop.js']);
