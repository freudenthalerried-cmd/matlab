/**
 * Wonach die Kranentladung verrechnet wird — und wonach der Shop sie rechnet.
 *
 * **Der Befund, 4. September 2026.** Die Frachtzeile des Shops lautet:
 *
 * > „Pauschale plus 3× Kranentladung"
 *
 * Gezählt werden dafür die **Sperrgut-Positionen** eines Warenkorbs
 * (`positionen.filter((p) => p.sperrgut).length` in `preis.js` und
 * `shopkern.js`). Der Lieferant fakturiert die Position aber als
 * **„Kranentladung pro Hub"**, und ein Hub ist das Anheben einer **Palette**,
 * nicht einer Artikelzeile.
 *
 * Zwei Lieferungen aus den eigenen Rechnungen zeigen den Unterschied:
 *
 * | Rechnung | Hübe | Paletten (geliefert / gutgeschrieben) | Sperrgut-Positionen | Modell rechnet | fakturiert |
 * |---|---|---|---|---|---|
 * | 262021644 | 5 | 7 / 1 | 4 | 30,00 € | 37,50 € |
 * | 262027463 | 3 | 3 / 0 | 6 | 45,00 € | 22,50 € |
 *
 * > **Das Modell liegt auf beiden belegten Lieferungen daneben, und zwar in
 * > entgegengesetzte Richtungen.** Einmal 7,50 € zu wenig, einmal 22,50 € zu
 * > viel. Ein Fehler, der sich im Mittel aufhebt, ist keiner, der sich aufhebt
 * > — er trifft jede einzelne Lieferung.
 *
 * ## Was sicher ist und was nicht
 *
 * **Sicher:** Ein Hub ist keine Artikelzeile. Rechnung 262027463 trägt sechs
 * Sperrgut-Positionen und **drei** Hübe — das schließt die Zählung je Position
 * aus, ohne dass man wissen muss, wonach sonst gezählt wird.
 *
 * **Nicht sicher:** wonach dann. Die Palettenzeilen sind mehrdeutig. Auf
 * 262021644 stehen sechs Paletten ÖBB, eine gutgeschriebene ÖBB-Palette (eine
 * Rückgabe) und eine Einwegpalette — je nach Lesart drei verschiedene Zahlen,
 * und keine davon ist die 5 der Hübe. Auf 262027463 gehen drei Paletten und
 * drei Hübe genau auf.
 *
 * > **Zwei Beobachtungen, von denen eine mehrdeutig ist, ergeben keine Regel.**
 * > Sie ergeben eine widerlegte Regel — und das ist mehr, als vorher dastand.
 *
 * ## Warum hier trotzdem nichts umgestellt wird
 *
 * Die Palettenzahl je Lieferung ist ein **offener Punkt**: Sie hängt an Gewicht
 * und Packmaß, und der Katalog führt Gewicht für 7 von 46 Artikeln. Aus zwei
 * Beobachtungen eine Regel zu machen, ist derselbe Schluss, der bei den
 * Paletten schon einmal abgelehnt wurde.
 *
 * Auch eine Vereinfachung auf „eine Kranentladung je Lieferung" wäre falsch:
 * Sie unterschriebe beide Belege (37,50 € und 22,50 € gegen 7,50 €).
 *
 * **Die Zählung je Position bleibt also stehen — aber sie ist ab heute als
 * unbelegte Annahme ausgewiesen und nicht als Rechnung.** Was fehlt, steht in
 * der Frage an den Lieferanten, und die hat jetzt einen Betrag daneben.
 */

/**
 * Die belegten Lieferungen mit Kranentladung.
 *
 * Von Hand geführt und maschinell geprüft: `test/huebe.test.js` rechnet sie
 * aus `preise/poschacher-positionen.csv` nach. Ein Eintrag, der von der
 * Rechnung abweicht, fällt auf — sonst wäre dieses Register die dritte
 * Zahlenquelle und die einzige ungeprüfte.
 */
export const HUBBELEGE = Object.freeze([
  Object.freeze({
    rechnung: '262021644',
    huebe: 5,
    palettenGeliefert: 7,
    palettenGutgeschrieben: 1,
    sperrgutPositionen: 4,
    warum: 'Sechs Paletten ÖBB, eine davon gutgeschrieben (Rückgabe), dazu eine '
      + 'Einwegpalette — je nach Lesart sechs, sieben oder fünf. Fünf Hübe. Vier '
      + 'Sperrgut-Positionen. Der Beleg widerlegt die Zählung je Position und trägt selbst '
      + 'keine eindeutige Palettenzahl; er steht hier als Beobachtung, nicht als Beweis.',
  }),
  Object.freeze({
    rechnung: '262027463',
    huebe: 3,
    palettenGeliefert: 3,
    palettenGutgeschrieben: 0,
    sperrgutPositionen: 6,
    warum: 'Drei Paletten, drei Hübe, keine Rückgabe — der eindeutige Beleg. Sechs '
      + 'Sperrgut-Positionen teilen sich drei Hübe; damit ist die Zählung je Position '
      + 'widerlegt, ohne dass man wissen muss, wonach sonst gezählt wird.',
  }),
]);

/** Was der Lieferant je Hub verrechnet — dieselbe Zahl wie in `lieferanten.json`. */
export const JE_HUB_NETTO = 7.5;

/**
 * Was das Modell auf einer belegten Lieferung gerechnet hätte.
 *
 * @param {{huebe: number, sperrgutPositionen: number}} beleg
 * @param {number} [jeHub]
 */
export function abweichung(beleg, jeHub = JE_HUB_NETTO) {
  const fakturiert = beleg.huebe * jeHub;
  const gerechnet = beleg.sperrgutPositionen * jeHub;
  return {
    rechnung: beleg.rechnung,
    fakturiert,
    gerechnet,
    differenz: Math.round((gerechnet - fakturiert) * 100) / 100,
    richtung: gerechnet > fakturiert ? 'zu viel' : gerechnet < fakturiert ? 'zu wenig' : 'genau',
  };
}

/**
 * Der Befund über alle belegten Lieferungen.
 *
 * `groesstesZuViel` und `groesstesZuWenig` sind die Zahlen, die in die Frage an
 * den Lieferanten gehören: Sie beziffern, was die offene Palettenfrage wert
 * ist. Ein Mittelwert stünde hier nicht — er verspräche, dass sich die Fehler
 * ausgleichen, und das tun sie nur in der Summe und nie in einer Lieferung.
 */
export function hubbefund(belege = HUBBELEGE, jeHub = JE_HUB_NETTO) {
  if (!Array.isArray(belege) || belege.length === 0) {
    throw new Error('Ohne belegte Lieferung ist hier nichts zu messen — ein leerer Befund ist kein grüner.');
  }
  const einzeln = belege.map((b) => abweichung(b, jeHub));
  const zuViel = einzeln.filter((a) => a.differenz > 0).map((a) => a.differenz);
  const zuWenig = einzeln.filter((a) => a.differenz < 0).map((a) => -a.differenz);
  return {
    einzeln,
    belege: belege.length,
    trifft: einzeln.filter((a) => a.differenz === 0).length,
    groesstesZuViel: zuViel.length ? Math.max(...zuViel) : 0,
    groesstesZuWenig: zuWenig.length ? Math.max(...zuWenig) : 0,
    // Nicht als Beleg für eine Palettenregel — die gibt es nicht —, sondern als
    // die zwei Zahlen, die ein späterer Lauf gegen die Auskunft des Lieferanten
    // halten kann, ohne die Rechnungen noch einmal auszulesen.
    huebeGegenPaletten: belege.map((b) => b.huebe - b.palettenGeliefert),
    huebeGegenPositionen: belege.map((b) => b.huebe - b.sperrgutPositionen),
  };
}
