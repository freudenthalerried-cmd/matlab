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
