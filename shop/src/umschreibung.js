/**
 * Wie weit ein Textprüfer reicht — und wo er aufhört.
 *
 * **Der Anlass, 10. September 2026.** Am selben Tag ist aufgefallen, dass
 * `BEHAUPTUNG` in `src/lieferungen.js` genau **eine** Formulierung kennt: die,
 * gegen die sie geschrieben wurde. Vier Tage lang grün, und an sieben Stellen
 * stand dieselbe Behauptung in anderen Worten.
 *
 * > **Ein Prüfer, der aus einem Beispielsatz gebaut wird, erkennt den
 * > Beispielsatz.**
 *
 * Die Frage dahinter ist größer als der eine Prüfer: Dieser Bestand hat
 * **vier** Register aus Textmustern — `BETRIEBSAUSSAGEN` und `GRENZWOERTER`
 * (`inhaltspruefung.js`), `INTERNA` (`interna.js`), `PREISAUSSAGEN` und
 * `VORRATSWORTE` (`aussagen.js`). Alle vier sind **mit Absicht eng**; das
 * steht in ihren eigenen Kommentaren:
 *
 * > *„Ein Prüfer, der bei jedem zweiten Satz anschlägt, wird abgeschaltet
 * > statt befolgt."*
 *
 * Das ist richtig und bleibt so. Ungemessen war bis heute nur, **wie eng**.
 * Ihre grüne Meldung liest sich wie „keine solche Behauptung auf einer
 * Kundenseite" und heißt „keine dieser Formulierungen auf einer Kundenseite".
 * Zwischen beidem lagen am 10. September 19 von 19 Sätzen: Gemessen an
 * Umschreibungen derselben Behauptung fing kein einziges Register auch nur
 * eine davon.
 *
 * ## Was dieses Register ist
 *
 * Zu jeder Regel ein paar Sätze, die **dieselbe Behauptung** in anderen Worten
 * aufstellen — und je Satz die Angabe, ob er heute gefangen wird. Damit wird
 * die Enge zu einer Zahl, die in beide Richtungen geprüft wird:
 *
 * - Ein Satz mit `gefangen: true`, der durchrutscht, heißt: Die Regel ist
 *   enger geworden. Das ist ein Befund — jemand hat ein Muster geschärft und
 *   dabei mehr weggenommen als gedacht.
 * - Ein Satz mit `gefangen: false`, der plötzlich gefangen wird, heißt: Die
 *   Regel ist gewachsen. Auch das ist ein Befund, nur ein guter — der Eintrag
 *   gehört nachgezogen, sonst behauptet das Register eine Lücke, die es nicht
 *   mehr gibt.
 *
 * > **Eine Lücke, die aufgeschrieben ist, ist eine Entscheidung. Eine Lücke,
 * > die niemand kennt, ist ein Versehen.**
 *
 * ## Was es ausdrücklich nicht ist
 *
 * Keine Aufforderung, jede Regel zu verbreitern. Neun der neunzehn Sätze sind
 * am 10. September durch schärfere Muster gefangen worden, weil sie die
 * Behauptung unmissverständlich aufstellen und im ganzen Bestand **keinen
 * einzigen** Fehltreffer erzeugen (gemessen über 106 Kundenflächen). Die
 * übrigen bleiben als offene Lücke stehen, mit dem Grund daneben: Wörter wie
 * „Schimmel" oder „liefern" sind im Baustofftext harmlos, und ein Muster
 * darauf träfe die richtige Auskunft öfter als die falsche.
 */

/**
 * Die Umschreibungen.
 *
 * `gefangen` ist eine **Messung**, keine Absicht: Sie sagt, was am
 * 10. September 2026 der Fall war. Wer eine Regel ändert, ändert hier die Zahl
 * mit — und sieht dabei, was er sonst noch verschoben hat.
 */
export const UMSCHREIBUNGEN = Object.freeze([
  Object.freeze({
    id: 'vorrat',
    aussage: 'behauptet Vorrat — dieser Betrieb führt kein eigenes Warenlager',
    register: 'BETRIEBSAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'XPS und EPS ab Lager.', gefangen: true,
        woher: 'Anzeigenüberschrift vom 31. August — der Anlass des Registers' }),
      Object.freeze({ text: 'Wir haben die gängigen Größen immer da.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Direkt aus unserem Bestand lieferbar.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Kurzfristig verfügbar aus laufender Bevorratung.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Die Ware liegt bei uns bereit.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'raeume',
    aussage: 'behauptet Räume für Kunden — es gibt kein Lager und keine Ausstellung',
    register: 'BETRIEBSAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Besuchen Sie unseren Schauraum.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Besuchen Sie uns in unserem Verkaufsraum.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Kommen Sie bei uns im Geschäft vorbei.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'zweite-hand',
    aussage: 'behauptet eine zweite Hand — die Texte messen Prüfprogramme, kein zweiter Mensch',
    register: 'BETRIEBSAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Jede Seite geht durch eine zweite Hand.', gefangen: true,
        woher: 'Fund vom 7. September — der Anlass des Eintrags' }),
      Object.freeze({ text: 'Jeder Text wird von einem Redakteur geprüft, bevor er erscheint.',
        gefangen: true, woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Vier Augen sehen jede Seite an.', gefangen: true,
        woher: 'am 10.09. aufgenommen — „Vier-Augen-Prinzip" stand schon da, der ausgeschriebene Satz nicht' }),
    ]),
  }),
  Object.freeze({
    id: 'erreichbarkeit',
    aussage: 'behauptet eine Erreichbarkeit, die niemand zugesagt hat',
    register: 'BETRIEBSAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Wir sind rund um die Uhr erreichbar.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Wir sind immer für Sie da.', gefangen: true, woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Sie erreichen uns an sieben Tagen die Woche.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'eigene-leute',
    aussage: 'behauptet eigene Leute oder Fahrzeuge — der Lieferant fährt',
    register: 'BETRIEBSAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Unser eigener Fuhrpark bringt die Ware.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Unser Team liefert und stellt auf.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Wir stellen die Palette selbst zu.', gefangen: true,
        woher: 'am 10.09. aufgenommen — „selbst" ist das Wort, das die Zusage macht' }),
      /*
       * **Offen, mit Grund.** „Wir liefern in fünf Bezirke" ist richtig und
       * steht so auf jeder Seite: Geliefert wird, nur nicht von uns gefahren.
       * Ein Muster auf „wir liefern" träfe die richtige Auskunft öfter als die
       * falsche Zusage.
       */
      Object.freeze({ text: 'Wir liefern Ihnen die Ware auf die Baustelle.', gefangen: false,
        warum: '„liefern" ist die richtige Auskunft — der Shop liefert, er fährt nur nicht selbst. '
          + 'Ein Muster darauf schlüge auf jeder Seite an.' }),
    ]),
  }),
  Object.freeze({
    id: 'erfolgszusage',
    aussage: 'sagt einen Erfolg zu, den ein Baustoffhändler nicht zusagen kann',
    register: 'GRENZWOERTER',
    saetze: Object.freeze([
      Object.freeze({ text: 'Wir garantieren einen dauerhaft trockenen Keller.', gefangen: true,
        woher: 'Erstfassung, steht so in der Probedatei' }),
      Object.freeze({ text: 'Damit bleibt der Keller trocken, versprochen.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Wir sichern Ihnen die Lieferung bis Freitag zu.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Das hält ein Leben lang.', gefangen: true, woher: 'am 10.09. aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'gesundheit',
    aussage: 'behauptet eine Wirkung auf die Gesundheit',
    register: 'GRENZWOERTER',
    saetze: Object.freeze([
      Object.freeze({ text: 'Gesundheitlich unbedenklich.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Der Baustoff ist wohnbiologisch unbedenklich.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      /*
       * **Offen, mit Grund.** „Schimmel" ist im Baustofftext ein
       * bauphysikalisches Wort: „Wo Tauwasser anfällt, entsteht Schimmel" ist
       * die richtige Auskunft und keine Gesundheitsaussage. Dieselbe
       * Überlegung hat „haftet" und „Haftung" aus dem Register gehalten.
       */
      Object.freeze({ text: 'Schützt Ihre Familie vor Schimmel.', gefangen: false,
        warum: '„Schimmel" ist bauphysikalisch und steht in richtigen Auskünften; '
          + 'die Grenze liegt bei „Ihre Familie", und darauf lässt sich kein Muster bauen, '
          + 'das nicht die halbe Wissensseite trifft' }),
    ]),
  }),
  Object.freeze({
    id: 'rechtsauskunft',
    aussage: 'erteilt eine Rechtsauskunft',
    register: 'GRENZWOERTER',
    saetze: Object.freeze([
      Object.freeze({ text: 'Damit sind Sie rechtssicher unterwegs.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Damit sind Sie rechtlich auf der sicheren Seite.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Wir prüfen Ihren Vertrag mit.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'eigene-marge',
    aussage: 'nennt die eigene Spanne oder den Einkaufspreis',
    register: 'INTERNA',
    saetze: Object.freeze([
      Object.freeze({ text: 'Die Rohmarge liegt bei 25 %.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Unsere Kalkulation rechnet mit 25 Prozent Aufschlag.', gefangen: true,
        woher: 'am 10.09. aufgenommen — ausgeschriebenes „Prozent" fehlte' }),
      Object.freeze({ text: 'Der Einkaufspreis liegt bei 12,40 €.', gefangen: true,
        woher: 'am 10.09. aufgenommen — das Wort für die vertraulichste Zahl des Vorhabens '
          + 'stand nicht im Register' }),
      /*
       * **Offen, mit Grund.** Die Wissensseite „Was Baumeisterpreis heißt"
       * erklärt das Geschäftsmodell und muss dafür vom Einkaufspreis sprechen:
       * *„ein Einkaufspreis, den niemand anbietet, nützt niemandem"*. Gemeldet
       * wird deshalb das Wort **mit einer Zahl daneben** und nicht das Wort.
       */
      Object.freeze({ text: 'Ein Einkaufspreis, den niemand anbietet, nützt niemandem.',
        gefangen: false,
        warum: 'die Erklärung des Geschäftsmodells auf der eigenen Wissensseite — '
          + 'gemeldet gehört die Zahl, nicht das Wort' }),
    ]),
  }),
]);

/**
 * Hält das Register gegen die Wirklichkeit — in beide Richtungen.
 *
 * @param {(satz: string) => boolean} faengt Sagt, ob der Bestand diesen Satz
 *   auf einer Kundenfläche melden würde. Hereingereicht und nicht importiert:
 *   Der Aufrufer entscheidet, welche Prüfer zusammen „der Bestand" sind — und
 *   ein Register, das seine Prüfer selbst wählt, prüft seine eigene Auswahl.
 * @param {object[]} register
 */
export function umschreibungsbefund(faengt, register = UMSCHREIBUNGEN) {
  const meldungen = [];
  let gemessen = 0;
  let offen = 0;
  for (const regel of register) {
    for (const satz of regel.saetze) {
      gemessen += 1;
      const tatsaechlich = Boolean(faengt(satz.text));
      if (!satz.gefangen) offen += 1;
      if (tatsaechlich === satz.gefangen) continue;
      meldungen.push({
        regel: satz.gefangen ? 'regel-verengt' : 'eintrag-veraltet',
        wo: regel.id,
        satz: satz.text,
        text: satz.gefangen
          ? `„${satz.text}" wird nicht mehr gefangen — die Regel „${regel.aussage}" ist enger `
            + 'geworden, als das Register sagt'
          : `„${satz.text}" wird jetzt gefangen — die Lücke ist zu, der Eintrag gehört auf `
            + '`gefangen: true` gesetzt',
      });
    }
  }
  return {
    gemessen,
    offen,
    regeln: register.length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/**
 * Ein Register ohne Begründung ist eine Liste.
 *
 * Jede offene Lücke braucht ihren Grund, jede geschlossene ihre Herkunft —
 * sonst weiß der nächste Lauf nicht, ob eine Lücke entschieden oder vergessen
 * ist.
 */
export function registerbefund(register = UMSCHREIBUNGEN) {
  const maengel = [];
  for (const regel of register) {
    if (!regel.id || !regel.aussage || !regel.register) maengel.push(`${regel.id}: Kopf unvollständig`);
    if ((regel.saetze?.length ?? 0) < 2) maengel.push(`${regel.id}: unter zwei Sätzen ist es kein Vergleich`);
    for (const s of regel.saetze ?? []) {
      if (!s.text) maengel.push(`${regel.id}: Satz ohne Text`);
      if (s.gefangen && !s.woher) maengel.push(`${regel.id}: „${s.text}" ohne Herkunft`);
      if (!s.gefangen && (s.warum ?? '').length < 30) {
        maengel.push(`${regel.id}: „${s.text}" ist als Lücke geführt, ohne dass ein Grund dabeisteht`);
      }
    }
  }
  return { sauber: maengel.length === 0, maengel };
}
