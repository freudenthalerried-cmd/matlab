/**
 * Darf der Bestellweg eingeschaltet werden — und was muss dann mit ihm kippen?
 *
 * **Gate 26 vom 4. September** hat den Weg entschieden: ein eigenes
 * Empfangsskript auf dem Hosting des Auftraggebers. Gebaut ist es seither.
 * Eingeschaltet ist es nicht, und das ist keine Vorsicht, sondern eine
 * Reihenfolge:
 *
 * > **Die Datenschutzseite sagt heute „wird nicht an den Server übertragen",
 * > und das stimmt.** Die Zusage ist gemessen (`npm run pruefe-datenschutz`,
 * > seit dem 2. September). Ein Bau, der den Bestellweg einschaltet und die
 * > Zusage stehen lässt, erzeugt auf einer Rechtsseite eine geprüfte
 * > Unwahrheit — und Art. 13 DSGVO verlangt die Beschreibung **vor** der
 * > ersten Übertragung, nicht danach.
 *
 * Deshalb entscheidet **eine** Stelle über beides. Wer den Weg einschaltet,
 * schaltet den Satz mit um; wer den Satz stehen lässt, bekommt den Weg nicht.
 * Zwei Schalter für dieselbe Sache wären genau die Sorte Drift, die dieser
 * Bestand sonst überall aufspürt.
 *
 * Die Voraussetzungen selbst stehen in `src/bestellweg.js`
 * (`VORAUSSETZUNGEN`) — hier wird nur gemessen, ob sie erfüllt sind.
 */

/**
 * **Ohne Import auf `bestellweg.js`** — und das ist Absicht. `rechtstexte.js`
 * braucht von hier nur `warenkorbZusage`, und `rechtstexte.js` geht ins
 * Browserbündel. Ein Import zöge `bestellweg.js` und über dessen
 * Kommentarauslese auch `entkommentieren.js` mit — Bauwerkzeug im Download
 * jedes Besuchers.
 *
 * Die Voraussetzungen kommen deshalb als Wert herein. Wer prüft, bringt das
 * Register mit; wer nur den Satz braucht, bekommt ihn ohne.
 */

/** Der Name des Empfangsskripts, wie es in `ausgabe/site/` landet. */
export const EMPFANGSSKRIPT = 'bestellung.php';

/** Die Datei, die dem Skript den Empfänger nennt. Ohne sie antwortet es 503. */
export const KONFIGURATIONSDATEI = 'bestellung-konfiguration.php';

/**
 * Ist der Bestellweg einschaltbar?
 *
 * @param {object} betreiber  der Inhalt von `data/betreiber.json`
 * @returns {{aktiv: boolean, fehlend: {id: string, feld: string, warum: string}[]}}
 */
export function bestellwegAktiv(betreiber, voraussetzungen) {
  const fehlend = [];
  for (const v of voraussetzungen) {
    const feld = v.feld.replace(/^betreiber\./, '');
    const wert = betreiber[feld];
    if (typeof wert !== 'string' || wert.trim() === '') fehlend.push(v);
  }
  return { aktiv: fehlend.length === 0, fehlend };
}

/**
 * Der Satz der Datenschutzseite über den Warenkorb — abhängig vom selben
 * Schalter.
 *
 * **Beide Fassungen sind messbar**, und das ist ihr Zweck: Die eine behauptet,
 * dass nichts hinausgeht; die andere benennt, was hinausgeht und wohin.
 * `npm run pruefe-datenschutz` misst jeweils die geltende.
 */
export function warenkorbZusage(aktiv, korbschluessel) {
  if (!aktiv) {
    return `Der Warenkorb liegt in localStorage des Besuchers (Schlüssel ${korbschluessel}) `
      + 'und wird nicht an den Server übertragen. '
      + 'Er verlässt das Gerät erst, wenn der Besucher den Anfragetext selbst kopiert und versendet.';
  }
  return `Der Warenkorb liegt in localStorage des Besuchers (Schlüssel ${korbschluessel}) `
    + 'und bleibt dort, solange nichts abgeschickt wird. '
    + `Wer die Bestellung abschickt, überträgt sie an ${EMPFANGSSKRIPT} auf demselben Server — `
    + 'mit Firma, E-Mail-Adresse, Bezirk der Baustelle und der Positionsliste. '
    + 'Ein Dritter ist daran nicht beteiligt.';
}

/** Die Datei mit dem einzigen Absendeweg. Sie geht nur mit eingeschaltetem Weg ins Bündel. */
export const ABSENDEDATEI = 'shop-bestellen.js';

/**
 * Der Quelltext, den der Browser des Kunden bekommt.
 *
 * **Der Anlass, 4. September 2026, abends.** `npm run startklar` entscheidet
 * seinen ersten Punkt — „Der Kunde kann eine Bestellung abschicken" — am
 * Quelltext der Oberfläche. Es las `shop-ui.js`, und der Kommentar daneben
 * sagte: „Ob diese Seite eine Bestellung abschicken kann, steht in **ihr** und
 * nicht in einer Datei daneben."
 *
 * Seit dem Nachmittag steht das Absenden in einer Datei daneben — mit gutem
 * Grund: Ein schlafendes `fetch(` im Bündel machte die Datenschutzzusage von
 * einer Tatsache zu einer Behauptung über den Kontrollfluss.
 *
 * > **Vier Runden Bestellweg, und die Bereitschaftsliste sagte weiterhin, es
 * > gebe keinen** — auch mit vollständig beantworteter Betreiberdatei.
 *
 * Diese Funktion setzt zusammen, was ausgeliefert wird. Sie steht hier, weil
 * hier der Schalter steht; `bin/website.mjs` und `bin/startklar.mjs` rufen
 * beide sie, statt die Regel je einmal nachzubauen.
 *
 * @param {(datei: string) => string} lies  liest eine Datei des Shopordners
 * @param {boolean} aktiv                   ob der Bestellweg eingeschaltet ist
 */
export function oberflaeche(lies, aktiv) {
  const grund = lies('shop-ui.js');
  return aktiv ? `${grund}\n${lies(ABSENDEDATEI)}` : grund;
}

/**
 * Was der Bau tun muss, damit beide Hälften zusammenbleiben.
 *
 * Der Rückgabewert ist absichtlich eine **Liste von Sätzen** und keine
 * Ansammlung von Schaltern: Er geht so in den Baubericht, und ein Bau, der
 * den Bestellweg still einschaltet, wäre der teuerste von allen.
 */
export function baubefund(betreiber, korbschluessel, voraussetzungen) {
  const { aktiv, fehlend } = bestellwegAktiv(betreiber, voraussetzungen);
  const saetze = aktiv
    ? [
      `Bestellweg eingeschaltet — ${EMPFANGSSKRIPT} wird mitgeliefert.`,
      'Die Datenschutzseite benennt die Übertragung.',
    ]
    : [
      `Bestellweg aus — ${EMPFANGSSKRIPT} wird nicht mitgeliefert.`,
      ...fehlend.map((v) => `  es fehlt ${v.feld}: ${v.warum}`),
    ];
  return { aktiv, fehlend, saetze, zusage: warenkorbZusage(aktiv, korbschluessel) };
}
