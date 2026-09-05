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
