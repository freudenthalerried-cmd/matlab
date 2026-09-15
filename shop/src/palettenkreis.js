/**
 * Was eine Palette wirklich kostet — Pfand ist keine Ausgabe.
 *
 * **Der Befund, 4. September 2026.** In `data/lieferanten.json` steht seit dem
 * 27. August eine Rechnung, die den Mindestbestellwert und Gate 20 mitträgt:
 *
 * > „Auf dem Beleg über 1.934 € netto: 6 Paletten (132,00) minus eine Rückgabe
 * > (−20,00) plus Folierung (6,50) = **118,50 nicht gerechnete Nebenkosten** —
 * > mehr als die Frachtpauschale selbst."
 *
 * Die Zahlen stimmen alle, und die Rechnung trotzdem nicht: Sie verbucht den
 * **Pfandbetrag** als Kosten. Die eine abgezogene Rückgabe stammt aus einer
 * früheren Lieferung; die sechs Paletten dieser Lieferung kommen erst später
 * zurück — und dann mit 20,00 € je Stück.
 *
 * > **Pfand ist keine Ausgabe, sondern eine Auslage.** Was kostet, ist die
 * > Differenz und die Fahrt, die es zurückbringt.
 *
 * Über die fünfzehn Rechnungen von April bis August lässt sich der Kreis
 * schließen, und er geht auf:
 *
 * | | Paletten | Betrag |
 * |---|---|---|
 * | hinaus (je 22,00 €) | 9 | 198,00 € |
 * | zurück (je 20,00 €) | 8 | −160,00 € |
 * | **offen** | **1** | **38,00 €** |
 *
 * Acht von neun Paletten sind zurückgegangen. Was hängen bleibt, sind **2,00 €
 * je Palette** — und die Rückführungsfahrt: Am 27. Juli steht neben der
 * Rückgabe von sieben Paletten eine **Frachtpauschale Retour zu 80,26 €**.
 *
 *     7 × 2,00 € + 80,26 € = 94,26 €  →  13,47 € je Palette
 *
 * Das ist die belastbare Zahl, und sie liegt zwischen den beiden falschen:
 * deutlich über den 2,00 € reiner Pfanddifferenz und weit unter den 22,00 €,
 * die die alte Rechnung unterstellt.
 *
 * ## Warum die Richtung diesmal ungewöhnlich ist
 *
 * Fast jeder Befund dieses Vorhabens ging in die **optimistische** Richtung —
 * eine Angabe sah besser aus, als sie war. Dieser geht in die andere: Die
 * Nebenkosten standen zu hoch, und der Mindestbestellwert ruht damit auf einer
 * zu pessimistischen Grundlage. Auch das ist ein Fehler, nur ein
 * ungefährlicherer: Er kostet Umsatz statt Marge.
 *
 * **Geändert wird deshalb nichts an der Grenze.** 250 € stehen als vorsichtige
 * Zahl, und vorsichtig bleibt vorsichtig; was fehlt, ist die Palettenzahl je
 * Lieferung, und die ist ein offener Punkt. Berichtigt wird die **Begründung**
 * — eine Grenze, die mit einer falschen Rechnung begründet ist, hält keiner
 * Nachfrage stand.
 */

/**
 * Die Palettenbewegungen aus den eigenen Rechnungen.
 *
 * Von Hand geführt und maschinell geprüft: `test/palettenkreis.test.js` rechnet
 * sie aus `preise/poschacher-positionen.csv` nach.
 */
export const PALETTENBEWEGUNGEN = Object.freeze([
  Object.freeze({ rechnung: '262021644', datum: '2026-06-25', paletten: 6, betrag: 132.0, art: 'hinaus' }),
  Object.freeze({ rechnung: '262021644', datum: '2026-06-25', paletten: -1, betrag: -20.0, art: 'zurueck' }),
  Object.freeze({ rechnung: '262027463', datum: '2026-07-27', paletten: 3, betrag: 66.0, art: 'hinaus' }),
  Object.freeze({ rechnung: '262027464', datum: '2026-07-27', paletten: -7, betrag: -140.0, art: 'zurueck' }),
]);

/** Die Fahrt, die die Paletten zurückbringt — einmal belegt. */
export const RUECKFAHRT = Object.freeze({
  rechnung: '262027464',
  frachtNetto: 80.26,
  paletten: 7,
  warum: 'Am 27. Juli steht neben der Rückgabe von sieben Paletten eine Frachtpauschale '
    + '„Mauthausen Baustelle" zu 80,26 € — der Satz, den `lieferanten.json` als Retourfahrt '
    + 'führt. Eine Beobachtung; ob jede Rückführung eine eigene Fahrt kostet oder ob sie '
    + 'meistens bei der nächsten Lieferung mitgeht, sagt dieser eine Beleg nicht.',
});

/**
 * Der geschlossene Kreis.
 *
 * `jePaletteMitFahrt` ist die Zahl, die in eine Kalkulation gehört — nicht der
 * Pfandbetrag und nicht die bloße Differenz.
 */
export function palettenkreis(bewegungen = PALETTENBEWEGUNGEN, rueckfahrt = RUECKFAHRT) {
  if (!Array.isArray(bewegungen) || bewegungen.length === 0) {
    throw new Error('Ohne Bewegung ist kein Kreis zu schließen — ein leerer Befund ist kein grüner.');
  }
  const hinaus = bewegungen.filter((b) => b.paletten > 0);
  const zurueck = bewegungen.filter((b) => b.paletten < 0);
  const anzahlHinaus = hinaus.reduce((n, b) => n + b.paletten, 0);
  const anzahlZurueck = -zurueck.reduce((n, b) => n + b.paletten, 0);
  const betragHinaus = Math.round(hinaus.reduce((n, b) => n + b.betrag, 0) * 100) / 100;
  const betragZurueck = Math.round(-zurueck.reduce((n, b) => n + b.betrag, 0) * 100) / 100;

  const jeHinaus = anzahlHinaus ? betragHinaus / anzahlHinaus : 0;
  const jeZurueck = anzahlZurueck ? betragZurueck / anzahlZurueck : 0;
  const differenzJePalette = Math.round((jeHinaus - jeZurueck) * 100) / 100;
  const fahrtJePalette = rueckfahrt && rueckfahrt.paletten
    ? rueckfahrt.frachtNetto / rueckfahrt.paletten : 0;

  return {
    anzahlHinaus,
    anzahlZurueck,
    offen: anzahlHinaus - anzahlZurueck,
    betragOffen: Math.round((betragHinaus - betragZurueck) * 100) / 100,
    jeHinaus: Math.round(jeHinaus * 100) / 100,
    jeZurueck: Math.round(jeZurueck * 100) / 100,
    differenzJePalette,
    // Pfand ist eine Auslage, die Fahrt ist es nicht. Deshalb steht beides
    // getrennt da und die Summe daneben — wer nur eine der drei Zahlen nennt,
    // nennt die falsche.
    fahrtJePalette: Math.round(fahrtJePalette * 100) / 100,
    jePaletteMitFahrt: Math.round((differenzJePalette + fahrtJePalette) * 100) / 100,
  };
}
