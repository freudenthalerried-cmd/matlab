/**
 * Der Satz, den der Kunde an der Frachtzeile liest.
 *
 * **Warum eine eigene Datei, 5. September 2026.** Der Wortlaut stand zweimal:
 * in `fracht()` in `preis.js` und in `kundenWarenkorb()` in `shopkern.js`,
 * mit dem Kommentar „derselbe Wortlaut wie in preis.js" daneben. Eine Probe
 * hält beide seit dem 2. September gegeneinander.
 *
 * > **Eine Probe, die zwei Fassungen vergleicht, ist besser als nichts und
 * > schlechter als eine Fassung.**
 *
 * Der naheliegende Weg — `shopkern.js` importiert den Satz aus `preis.js` —
 * ist im ersten Anlauf sofort rot geworden, und zwar an der richtigen Stelle:
 * `preis.js` trägt `einkaufspreis`, `artikelEinkauf` und `rohmarge`. Es in
 * das Browserbündel zu ziehen hieße, die Einkaufsrechnung auszuliefern —
 * genau das, wogegen es `shopkern.js` überhaupt gibt.
 *
 * Deshalb dieses Modul: **ein Satz, keine Zahl, kein Wissen.**
 *
 * ## Was der Satz sagt, seit heute
 *
 * Bis zum 5. September las der Kunde „(geschätzt je Sperrgut-Position)". Das
 * bezieht sich auf die **Zahl** der Kranentladungen — der Lieferant
 * verrechnet je Hub, und ein Hub ist eine Palette, keine Artikelzeile
 * (`huebe.js`, 4. September).
 *
 * Dass auch die **Einstufung** eine Schätzung ist — welcher Artikel überhaupt
 * palettiert kommt, folgt aus der Warengruppe, und keine der 46 Einstufungen
 * ist belegt (`sperrguteinstufung.js`, 5. September) —, stand nur auf der
 * Artikelseite.
 *
 * > **Zwei Schätzungen hinter einem Wort sind eine, die niemand sieht.**
 */

/**
 * @param {number} sperrgutPositionen  Zahl der Positionen mit palettierter Ware
 */
export function frachtGrundText(sperrgutPositionen) {
  if (!(sperrgutPositionen > 0)) return 'Pauschale';
  return `Pauschale plus ${sperrgutPositionen}× Kranentladung — Zahl je Sperrgut-Position `
    + 'gerechnet, Einstufung aus der Warengruppe geschätzt';
}

/**
 * Der Satz an der Frachtzeile, wenn die Fracht entfällt.
 *
 * **Warum ohne Zahl, 5. September 2026.** Hier stand in `preis.js`:
 *
 * > `frei Haus ab 1500 € Bestellwert`
 *
 * Und `bestellwertNetto` ist in derselben Funktion definiert als
 * `positionen.reduce((s, p) => s + p.ekNetto * p.menge, 0)` — der **Einkauf**.
 * Der Satz stand auf dem Angebot, mit vierzehn Tagen Bindefrist, neben dem
 * ausgewiesenen Warenwert.
 *
 * Er sagt damit zweierlei, was er nicht sagen soll:
 *
 * 1. **„Bestellwert" heißt für den Kunden etwas anderes als für uns.** Er
 *    liest seinen Rechnungsbetrag; gemeint ist unsere Bestellung beim
 *    Hersteller. Dasselbe Wort, zwei Leser — die Familie, aus der schon der
 *    Frachtgrund oben stammt.
 * 2. **Er ist eine Schranke auf einer geheimen Zahl.** Steht dort 0,00 €, dann
 *    ist unser Einkauf mindestens 1.500 €. Der Warenwert steht daneben. Wer
 *    beides nimmt, hat eine Obergrenze für die Handelsspanne — ohne dass ein
 *    einziger Einkaufspreis im Papier steht.
 *
 * `warenkorb.js` hat denselben Fall beim Mindestbestellwert längst gelöst: Der
 * Fehlbetrag wird über den Hebel in die Währung des Kunden gerechnet, bevor er
 * hinausgeht. Beim Frei-Haus-Satz gibt es nichts umzurechnen — die Tatsache,
 * die den Kunden angeht, ist, dass keine Fracht anfällt.
 *
 * > **Eine Schranke auf einer geheimen Zahl ist eine Aussage über die geheime
 * > Zahl.**
 */
export function frachtfreiText() {
  return 'frei Haus — die Frachtfreigrenze dieses Herstellers ist erreicht';
}
