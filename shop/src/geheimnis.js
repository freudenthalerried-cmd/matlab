/**
 * Was ein Leser des öffentlichen Verzeichnisses ausrechnen kann.
 *
 * Die Einkaufskonditionen liegen in `preise/`, und `.gitignore` deckt den
 * Ordner. Der Kommentar dort nennt den Grund: *„Die Rabattsätze, die ein
 * Lieferant einem Baumeister einräumt, sind dessen Geschäftsgeheimnis und
 * zugleich die Verhandlungsposition des Auftraggebers."*
 *
 * **Die Regel schützt die Datei. Sie schützt nicht die Angabe.**
 *
 * Im Verzeichnis stehen die Verkaufspreise (die gehören dorthin, es ist ein
 * Shop) und die Zielmarge (die steht in einem Dutzend Dokumenten). Aus
 * beidem folgt der Einkaufspreis in einem Schritt:
 *
 *     Einkauf = Verkauf × (1 − Marge)
 *
 * Dieses Modul rechnet nach, wie weit das trägt. Es liest dafür **nicht**
 * die vertrauliche Datei — es rechnet aus dem, was jeder sehen kann, und
 * vergleicht nur dann, wenn die Datei örtlich vorhanden ist. Ein Prüfer,
 * der zum Prüfen das Geheimnis braucht, ist als Prüfer eines öffentlichen
 * Verzeichnisses wertlos.
 */

/** Rekonstruktion aus einem veröffentlichten Verkaufspreis und der Marge. */
export function rekonstruiereEinkauf(vkNetto, marge) {
  if (!(vkNetto > 0)) throw new Error('Verkaufspreis muss positiv sein');
  if (!(marge > 0 && marge < 1)) throw new Error('Marge muss zwischen 0 und 1 liegen');
  return Math.round(vkNetto * (1 - marge) * 100) / 100;
}

/**
 * Vergleicht Rekonstruktion und Wirklichkeit — je Artikel.
 *
 * `getroffen` heißt: auf den Cent. Nicht „ungefähr". Ein Lieferant, der die
 * eigene Kalkulation auf zwei Nachkommastellen im Netz findet, liest keine
 * Schätzung, sondern seine eigene Rechnung.
 *
 * @param {Array<{sku: string, vkNetto: number, ekNetto: number}>} artikel
 * @param {number} marge
 * @param {number} toleranzEuro
 */
export function rekonstruierbarkeit(artikel, marge, toleranzEuro = 0.01) {
  const zeilen = artikel
    .filter((a) => a.vkNetto > 0 && a.ekNetto > 0)
    .map((a) => {
      const rekonstruiert = rekonstruiereEinkauf(a.vkNetto, marge);
      const abweichung = Math.round(Math.abs(rekonstruiert - a.ekNetto) * 100) / 100;
      return { sku: a.sku, vkNetto: a.vkNetto, ekNetto: a.ekNetto, rekonstruiert, abweichung,
        getroffen: abweichung <= toleranzEuro + 1e-9 };
    });

  const getroffen = zeilen.filter((z) => z.getroffen);
  return {
    geprueft: zeilen.length,
    getroffen: getroffen.length,
    verfehlt: zeilen.filter((z) => !z.getroffen),
    anteil: zeilen.length ? getroffen.length / zeilen.length : 0,
    zeilen,
  };
}

/**
 * Muster, die einen **unmittelbaren** Abfluss anzeigen — nicht die Rechnung,
 * sondern die Angabe selbst in einer Datei, die mitgeliefert wird.
 *
 * Bewusst grob, wie alle Prüfer dieses Vorhabens: Was er meldet, ist ein
 * Verdacht. Ein Feldname allein ist keiner — `einkaufNetto` steht
 * berechtigterweise im Rechenkern, der damit rechnet. Gemeldet wird erst der
 * Feldname **mit einer Zahl daneben**, denn dann ist es ein Wert und keine
 * Rechengröße.
 */
// Das `(?<![.\w])` davor ist kein Feinschliff: Ohne es traf die Regel die
// Zeile `t.warenwertNetto / t.einkaufNetto : 1;` — der Doppelpunkt kam aus
// einem Bedingungsausdruck, nicht aus einer Zuweisung. Ein Prüfer, der
// Rechenschritte für Werte hält, meldet den Rechenkern und nicht das Leck.
export const ABFLUSSMUSTER = Object.freeze([
  { name: 'Einkaufspreis mit Wert', muster: /(?<![.\w])"?(ekNetto|einkaufNetto|einkaufspreis)"?\s*[:=]\s*-?\d/i },
  { name: 'Händlerrabatt mit Wert', muster: /(?<![.\w])"?(haendlerrabattAufUvp|haendlerrabatt|rabattsatz)"?\s*[:=]\s*-?[\d.]/i },
  { name: 'Skontobasis mit Wert', muster: /(?<![.\w])"?(skontobasis|skontofaehig)"?\s*[:=]\s*-?\d/i },
]);

/** Sucht die Abflussmuster in einem Text und meldet Zeile und Fundstelle. */
export function findeAbfluss(text, name = '') {
  const treffer = [];
  text.split(/\r?\n/).forEach((zeile, i) => {
    for (const m of ABFLUSSMUSTER) {
      if (m.muster.test(zeile)) {
        treffer.push({ name, zeile: i + 1, art: m.name, auszug: zeile.trim().slice(0, 90) });
      }
    }
  });
  return treffer;
}
