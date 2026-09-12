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
  /* ---------------------------------------------------------------- *
   * Nachgetragen am 10. September, eine Runde später
   *
   * Die erste Fassung dieses Registers deckte vier Regeln ab. Der eigene
   * Schlusssatz nannte die Lücke: `PREISAUSSAGEN` und `VORRATSWORTE` fehlten.
   * Beim Nachtragen ist etwas Unangenehmeres herausgekommen — **die beiden
   * Regeln, die ich am selben Vormittag geschrieben habe, fallen durch
   * denselben Test.** `MEHRLIEFERUNG` fing 0 von 5 Umschreibungen,
   * `GRENZAUSSAGEN` 1 von 5.
   *
   * > **Die Falle am Vormittag beschrieben, am Nachmittag hineingetappt.**
   *
   * Das ist kein Zufall und keine Nachlässigkeit, sondern die Bauart: Wer ein
   * Muster gegen gefundene Sätze schreibt, schreibt es gegen gefundene Sätze.
   * Dagegen hilft keine Sorgfalt, sondern nur eine zweite Messung.
   * ---------------------------------------------------------------- */
  Object.freeze({
    id: 'preisgleichheit',
    aussage: 'behauptet, der Kunde zahle dasselbe wie der Baumeister',
    register: 'PREISAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Was ein Baumeister im Einkauf zahlt, zahlen Sie auch.', gefangen: true,
        woher: 'Startseite, Fund vom 5. September — der Anlass des vierten Musters' }),
      Object.freeze({ text: 'Sie kaufen zu denselben Konditionen wie ein Baumeister.', gefangen: true,
        woher: 'am 10.09. aufgenommen — die Wendung, die ein Anzeigentext als Nächstes wählt' }),
      Object.freeze({ text: 'Baumeisterkonditionen für jeden.', gefangen: true, woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Wir geben unseren Einkauf eins zu eins weiter.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Bei uns zahlen Sie nicht mehr als der Handwerker.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Handelsübliche Aufschläge entfallen bei uns.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'vorrat-in-der-anzeige',
    aussage: 'behauptet in einem Anzeigentext Ware, die hier liegt',
    register: 'VORRATSWORTE',
    saetze: Object.freeze([
      Object.freeze({ text: 'XPS und EPS ab Lager', gefangen: true, woher: 'Anzeigenüberschrift vom 31. August' }),
      Object.freeze({ text: 'Sofort mitnehmen', gefangen: true, woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Heute noch abholbar', gefangen: true, woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Alles da', gefangen: true, woher: 'am 10.09. aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'mehrlieferung',
    aussage: 'behauptet mehrere Lieferungen, wo der Katalog einen Lieferanten führt',
    register: 'MEHRLIEFERUNG',
    saetze: Object.freeze([
      Object.freeze({ text: 'Teillieferungen je Lieferant sind der Regelfall.', gefangen: true,
        woher: 'AGB Punkt 4, Fund vom 10. September vormittags' }),
      Object.freeze({ text: 'Ihre Bestellung wird auf zwei Fuhren aufgeteilt.', gefangen: true,
        woher: 'am 10.09. nachmittags aufgenommen — das Muster vom Vormittag fing sie nicht' }),
      Object.freeze({ text: 'Die Ware kommt in Etappen.', gefangen: true, woher: 'am 10.09. nachmittags aufgenommen' }),
      Object.freeze({ text: 'Wir liefern in Teilmengen.', gefangen: true, woher: 'am 10.09. nachmittags aufgenommen' }),
      Object.freeze({ text: 'Jeder Lieferant schickt seine eigene Fuhre.', gefangen: true,
        woher: 'am 10.09. nachmittags aufgenommen' }),
      /*
       * **Offen, mit Grund.** Die Wissensseite zur Lagerung rät: *„Drei
       * Anlieferungen sind allerdings teurer als eine."* Das ist richtig und
       * das Gegenteil einer Zusage — es beschreibt, was der **Kunde** täte,
       * nicht was der Shop tut. Der Unterschied liegt am Subjekt, und das
       * sieht ein Muster nicht.
       */
      Object.freeze({ text: 'Eine Bestellung, mehrere Anlieferungen.', gefangen: false,
        warum: '„Anlieferungen" steht auch in der richtigen Auskunft der Lagerungsseite, die vom '
          + 'Bestellverhalten des Kunden handelt — der Unterschied liegt am Subjekt' }),
    ]),
  }),
  Object.freeze({
    id: 'untergrenze',
    aussage: 'nennt eine andere Bestelluntergrenze als die hinterlegte',
    register: 'GRENZAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Unter etwa 400 Euro netto Warenwert lohnt eine Lieferung nicht.', gefangen: true,
        woher: 'Wissensseite, Fund vom 10. September früh' }),
      Object.freeze({ text: 'Wir liefern erst ab 400 Euro netto Warenwert.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Bestellungen unter 400 Euro nehmen wir nicht an.', gefangen: true,
        woher: 'am 10.09. nachmittags aufgenommen' }),
      Object.freeze({ text: 'Die Untergrenze liegt bei 400 Euro netto.', gefangen: true,
        woher: 'am 10.09. nachmittags aufgenommen' }),
      Object.freeze({ text: 'Ab einem Bestellwert von 400 Euro netto liefern wir.', gefangen: true,
        woher: 'am 10.09. nachmittags aufgenommen' }),
      Object.freeze({ text: 'Kleinstmengen unter 400 Euro sind nicht möglich.', gefangen: true,
        woher: 'am 10.09. nachmittags aufgenommen' }),
    ]),
  }),
  Object.freeze({
    id: 'abholung',
    aussage: 'sagt eine Abholung zu, die der Lieferant nicht bestätigt hat',
    register: 'ZUSAGE',
    saetze: Object.freeze([
      Object.freeze({ text: 'Abholung ist möglich: Lager Mauthausen.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Wer selbst abholt, zahlt keine Fracht.', gefangen: true, woher: 'Erstfassung' }),
      Object.freeze({ text: 'Sie können die Ware bei uns abholen.', gefangen: true,
        woher: 'am 10.09. aufgenommen — die Formulierung, die ein Shoptext zuerst wählt' }),
      Object.freeze({ text: 'Selbstabholer sparen die Frachtpauschale.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Abholung nach Vereinbarung.', gefangen: true, woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Gerne stellen wir Ihre Bestellung zur Abholung bereit.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Ware kann am Lager übernommen werden.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Auf Wunsch holen Sie selbst ab.', gefangen: true, woher: 'am 10.09. aufgenommen' }),
      /*
       * **Offen, mit Grund — und ausdrücklich richtig so.** Das bloße Wort
       * steht in der AGB in einem Berichtigungsvermerk: *„Bis zum
       * 6. September nahm dieser Punkt die Grenze für Selbstabholer
       * ausdrücklich zurück."* Das ist die Rücknahme der Zusage und nicht
       * sie selbst.
       */
      Object.freeze({ text: 'Die Grenze für Selbstabholer wurde zurückgenommen.', gefangen: false,
        warum: 'das bloße Wort ohne versprechendes Verb — es steht in der AGB in einem '
          + 'Berichtigungsvermerk, der die Zusage gerade zurücknimmt' }),
    ]),
  }),
  Object.freeze({
    id: 'unabhaengige-pruefer',
    aussage: 'behauptet Prüfprogramme, die den geprüften Text nicht kennen',
    register: 'BETRIEBSAUSSAGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Prüfprogramme, die unabhängig vom Text entstehen und ihn nicht kennen.',
        gefangen: true, woher: 'Redaktionsprinzipien, Fund vom 10. September abends' }),
      Object.freeze({ text: 'Unsere Prüfer sind unabhängig vom Text.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      Object.freeze({ text: 'Die Programme kennen den Text nicht.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      /*
       * **Offen, mit Grund.** „Unabhängig" ist an anderen Stellen die
       * richtige Auskunft: unabhängig vom Hersteller, unabhängig vom
       * Lieferanten. Getroffen wird die Unabhängigkeit **vom Text**, und wer
       * sie anders umschreibt („die Regeln entstehen ohne Ansehen der Seite"),
       * kommt durch.
       */
      Object.freeze({ text: 'Die Regeln entstehen ohne Ansehen der Seite.', gefangen: false,
        warum: 'die Behauptung ohne die Wörter, an denen sie hängt — ein Muster darauf träfe '
          + 'jede richtige Aussage über Unabhängigkeit vom Hersteller oder Lieferanten' }),
    ]),
  }),
  Object.freeze({
    id: 'kennwertuebernahme',
    aussage: 'behauptet, Kennwerte würden aus dem Merkblatt übernommen',
    register: 'UEBERNAHMEBEHAUPTUNGEN',
    saetze: Object.freeze([
      Object.freeze({ text: 'Technische Kennwerte werden aus dem Datenblatt des Herstellers übernommen und verlinkt.',
        gefangen: true, woher: 'Redaktionsprinzipien, Fund vom 10. September nachmittags' }),
      Object.freeze({ text: 'Wir verlinken sie und geben die Kennwerte wieder.', gefangen: true,
        woher: 'gruppen/wdvs.md, vom Prüfer beim ersten Lauf gefunden' }),
      Object.freeze({ text: 'Die Kennwerte sind dem Merkblatt entnommen.', gefangen: true,
        woher: 'am 10.09. aufgenommen' }),
      /*
       * **Offen, mit Grund.** Ohne das Wort „Kennwerte" hängt die Behauptung
       * an nichts Fassbarem — „die Angaben stammen aus dem Merkblatt" könnte
       * ebenso die Merkblattadresse meinen wie einen Zahlenwert.
       */
      Object.freeze({ text: 'Die Angaben stammen aus dem Merkblatt des Herstellers.', gefangen: false,
        warum: 'ohne das Wort „Kennwerte" ist nicht zu unterscheiden, ob ein Zahlenwert oder '
          + 'die Fundstelle gemeint ist — beides steht in diesem Bestand nebeneinander' }),
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

/* ------------------------------------------------------------------ *
 * Eine Ebene höher: Welche Regeln gibt es überhaupt?
 *
 * **Der Fund vom 10. September, nachmittags.** Die erste Fassung dieses
 * Registers deckte vier Regeln ab und meldete grün. Sie kannte
 * `PREISAUSSAGEN`, `VORRATSWORTE`, `MEHRLIEFERUNG` und `GRENZAUSSAGEN` nicht
 * — zwei davon waren am selben Vormittag entstanden.
 *
 * > **Ein Register über die Reichweite, das nicht jede Regel kennt, hat die
 * > Lücke, die es misst — eine Ebene höher.**
 *
 * Dagegen hilft kein Vorsatz, sondern eine Aufzählung, die sich selbst
 * fortschreibt: `musterausfuhren()` findet die Musterausfuhren der Module,
 * die die vier Kundentext-Werkzeuge laden. Was sie findet und was hier steht,
 * wird gegeneinander gehalten — in beide Richtungen. Eine neue Regel, die
 * niemand einordnet, ist ein Befund; ein Eintrag, dessen Ausfuhr es nicht
 * mehr gibt, auch.
 * ------------------------------------------------------------------ */

/**
 * Jede Musterausfuhr, die die Kundentext-Werkzeuge erreichen — mit der
 * Angabe, ob sie eine **Behauptungsregel** ist.
 *
 * Nicht jedes Muster ist eine: Die meisten lesen eine Form (ein Datum, eine
 * Summenzeile, einen Krümelpfad) statt eine Behauptung zu verbieten. Die
 * bekommen `behauptung: false` und einen Grund — und genau der unterscheidet
 * eine Entscheidung von einem Versehen.
 */
export const REGELQUELLEN = Object.freeze([
  Object.freeze({ modul: 'aussagen', ausfuhr: 'PREISAUSSAGEN', behauptung: true, umschrieben: 'preisgleichheit' }),
  Object.freeze({ modul: 'inhaltspruefung', ausfuhr: 'BETRIEBSAUSSAGEN', behauptung: true, umschrieben: 'vorrat' }),
  Object.freeze({ modul: 'inhaltspruefung', ausfuhr: 'GRENZWOERTER', behauptung: true, umschrieben: 'erfolgszusage' }),
  Object.freeze({ modul: 'interna', ausfuhr: 'INTERNA', behauptung: true, umschrieben: 'eigene-marge' }),
  Object.freeze({ modul: 'untergrenze', ausfuhr: 'GRENZAUSSAGEN', behauptung: true, umschrieben: 'untergrenze' }),
  Object.freeze({ modul: 'lieferungen', ausfuhr: 'MEHRLIEFERUNG', behauptung: true, umschrieben: 'mehrlieferung' }),
  Object.freeze({
    modul: 'lieferungen', ausfuhr: 'BEHAUPTUNG', behauptung: false,
    warum: 'die erste Fassung derselben Regel, vom 6. September. Sie kennt eine Formulierung, '
      + 'und genau das war der Anlass dieses Registers; gemessen wird jetzt `MEHRLIEFERUNG`, '
      + 'die sie enthält.',
  }),
  Object.freeze({
    modul: 'lieferungen', ausfuhr: 'SATZBEDINGUNG', behauptung: false,
    warum: 'kein Verbot, sondern seine Ausnahme — sie deckt einen Satz, statt ihn zu melden. '
      + 'Ihre Reichweite wird über `MEHRLIEFERUNG` mitgemessen: Eine Bedingung, die zu weit '
      + 'reicht, macht dort einen gefangenen Satz frei.',
  }),
  Object.freeze({
    modul: 'lieferungen', ausfuhr: 'FLAECHENBEDINGUNG', behauptung: false,
    warum: 'dasselbe eine Ebene höher — die Deckung der Fläche statt des Satzes.',
  }),
  Object.freeze({
    modul: 'inhaltspruefung', ausfuhr: 'ZEITZUSAGE', behauptung: false,
    warum: 'liest eine Form, keine Behauptung: jede Zeitangabe mit Einheit. Was daraus ein '
      + 'Befund wird, entscheidet `erfundeneZeitangaben` gegen die zugesagte Antwortzeit.',
  }),
  Object.freeze({
    modul: 'aussagen', ausfuhr: 'VORRATSWORTE', behauptung: true, umschrieben: 'vorrat-in-der-anzeige',
  }),
  Object.freeze({
    modul: 'bestellweg', ausfuhr: 'ABSENDEWEGE', behauptung: false,
    warum: 'sucht im Quelltext nach Wegen, die etwas absenden — eine Eigenschaft des Programms, '
      + 'keine Aussage an den Kunden.',
  }),
  Object.freeze({
    modul: 'systemtreue', ausfuhr: 'SCHICHTEN', behauptung: false,
    warum: 'ordnet Artikel den Schichten eines Systems zu. Es verbietet keine Formulierung, '
      + 'sondern misst eine Zusammenstellung gegen den Katalog.',
  }),
  Object.freeze({
    modul: 'sperrguteinstufung', ausfuhr: 'LIEFERAUSSAGE', behauptung: false,
    warum: 'findet den Satz über die Sperrguteinstufung, um seine Zahlen gegen ihre Quelle zu '
      + 'halten — geprüft wird die Herkunft der Zahl, nicht der Wortlaut der Aussage.',
  }),
  Object.freeze({
    modul: 'shopkern', ausfuhr: 'ABSICHTSWOERTER', behauptung: false,
    warum: 'keine Regel über Kundentext, sondern über die Suche: Wörter, die eine Absicht '
      + 'benennen statt eines Artikels („kaufen", „günstig"). Sie verbieten nichts, sie '
      + 'werden aus der Suchfrage genommen, damit „xps kaufen" den Artikel findet.',
  }),
  // **Geschlossen am 10. September, abends.** Stand hier eine Runde lang als
  // offene Zeile — und war der Beweis, dass eine aufgeschriebene Lücke
  // wiedergefunden wird: Der Prüfer hat sie beim nächsten Lauf selbst genannt.
  Object.freeze({ modul: 'abholung', ausfuhr: 'ZUSAGE', behauptung: true, umschrieben: 'abholung' }),
  // **Nachgezogen am 10. September, abends** — vom Prüfer selbst gemeldet:
  // Die beiden Runden davor haben Muster gebaut und nicht eingeordnet.
  Object.freeze({
    modul: 'merkblattverweis', ausfuhr: 'UEBERNAHMEBEHAUPTUNGEN',
    behauptung: true, umschrieben: 'kennwertuebernahme',
  }),
  Object.freeze({
    modul: 'merkblattverweis', ausfuhr: 'KENNWERT', behauptung: false,
    warum: 'liest eine Form, keine Behauptung: eine Zahl mit Einheit hinter einem Kennwertwort. '
      + 'Sie entscheidet, ob eine Übernahmebehauptung überhaupt gemeldet werden darf — ihre '
      + 'Reichweite wird über `UEBERNAHMEBEHAUPTUNGEN` mitgemessen.',
  }),
  Object.freeze({
    modul: 'normstelle', ausfuhr: 'NORMBEZUG', behauptung: false,
    warum: 'findet die Nennung einer Norm, um ihre Ausgabe danebenzuhalten. Verboten ist keine '
      + 'Formulierung; gemessen wird, ob die Ausgabe am Namen steht.',
  }),
  Object.freeze({
    modul: 'normstelle', ausfuhr: 'AUSGABE', behauptung: false,
    warum: 'die Form einer Ausgabeangabe (`Ausgabe 2009-09-01` oder `:2009`) — die Gegenprobe '
      + 'zur Nennung, keine eigene Regel.',
  }),
  Object.freeze({
    modul: 'vorteilsangabe', ausfuhr: 'AUSKUENFTE', behauptung: false,
    warum: 'kein Verbot, sondern das Gegenteil: die drei Auskünfte, von denen **eine** auf jeder '
      + 'Artikelkarte stehen muss — der Abstand zur Liste, „Beipack" oder „Listenpreis nicht '
      + 'bekannt". Gemessen wird das Fehlen aller drei, nicht eine Formulierung.',
  }),
  Object.freeze({
    modul: 'normstelle', ausfuhr: 'REIHE', behauptung: false,
    warum: 'die Ausnahme statt des Verbots: Eine Normenreihe hat keine Ausgabe, und dieses '
      + 'Muster hält sie von der Meldung frei.',
  }),
  Object.freeze({
    modul: 'abholung', ausfuhr: 'VERNEINT', behauptung: false,
    warum: 'kein Verbot, sondern seine Ausnahme: die Verneinung links vom Verb, die eine '
      + 'richtige Auskunft vor der Meldung schützt. Ihre Reichweite wird über `ZUSAGE` '
      + 'mitgemessen — eine Ausnahme, die zu weit reicht, macht dort einen gefangenen Satz frei.',
  }),
  // **Nachgetragen am 11. September 2026.** Diese drei standen seit dem 25.
  // August (`QUELLENSTEMPEL`) und dem 10. September (die beiden aus der
  // Absage) im Bestand und in keiner Einordnung — `pruefe-umschreibung` war
  // seither rot, und kein Commit hat das aufgehalten.
  Object.freeze({
    modul: 'quellenstempel', ausfuhr: 'QUELLENSTEMPEL', behauptung: false,
    warum: 'liest eine Form, die dieses Haus selbst schreibt: den Quellenstempel am Fuß einer '
      + 'Angabe, mit `^` verankert. Verboten ist keine Formulierung — gemessen wird, ob die '
      + 'Standform (einer, viele, ohne) zu dem passt, was tatsächlich dahintersteht. Eine '
      + 'Umschreibung gibt es nicht, weil kein Mensch diesen Satz formuliert.',
  }),
  Object.freeze({
    modul: 'absage', ausfuhr: 'ABSAGEGRUENDE', behauptung: false,
    warum: 'übersetzt statt zu verbieten: Jedes Muster liest eine Meldung der eigenen Prüfer — '
      + 'Text, den dieses Haus schreibt und nicht ein Kunde. Dass eine umformulierte Meldung '
      + 'durchfiele, fängt der Abgleich in `gruendeAusQuellen`: Er liest die Gründe aus dem '
      + 'Quelltext und meldet jeden ohne Satz, statt ihn wegzulassen.',
  }),
  Object.freeze({
    modul: 'absage', ausfuhr: 'NICHT_FUER_DEN_KUNDEN', behauptung: false,
    warum: 'die Ausnahme zur Zeile darüber: Meldungen, die eine Rechnung aufhalten und nie an '
      + 'einen Besteller gehen. Auch sie lesen eigenen Text. Eine Ausnahme, die zu weit reicht, '
      + 'zeigt sich dort, wo sie wirkt — in den Gründen ohne Satz, die `absagegruende` meldet.',
  }),
]);

/**
 * Muster, die keine Behauptungsregel sind und **auch nicht einzeln geführt**
 * werden müssen: Sie lesen eine Form.
 *
 * Getrennt von `REGELQUELLEN`, weil die Liste sonst aus Formmustern bestünde
 * und die Behauptungsregeln darin untergingen. Was hier steht, ist gesehen
 * und eingeordnet worden — nur nicht einzeln begründet.
 */
export const FORMMUSTER = Object.freeze([
  /*
   * **`bankverbindung.AT_IBAN` kam am 12. September 2026 dazu** — nicht weil
   * das Muster neu wäre, sondern weil `bin/vorgang.mjs` seither `BANKFELDER`
   * liest und damit das Modul in die Reichweite der Kundentext-Werkzeuge
   * gerät. Genau dafür gibt es diese Liste: Ein Muster, das die Werkzeuge
   * erreichen und das niemand eingeordnet hat, ist eine offene Frage.
   *
   * Eine Behauptung über den Shop ist es nicht — es liest die **Form** einer
   * österreichischen IBAN (zwei Buchstaben, achtzehn Ziffern) und sagt über
   * keinen Text dieses Hauses etwas aus.
   */
  'bankverbindung.AT_IBAN',
  'abgrenzung.ABGRENZUNGSMUSTER', 'belegpruefung.SUMMENZEILE', 'geschaeftszeit.KALENDERRUF',
  'geschaeftszeit.ROHGRIFF', 'krume.KRUMENMUSTER', 'merkblattverweis.MERKBLATT',
  'sitemapstand.DATUM', 'sperrguteinstufung.EINSTUFUNGSBLOCK', 'sperrguteinstufung.FLAECHENMUSTER',
  'sperrguteinstufung.HERKUNFTSMUSTER', 'systemlisten.EINGESCHRAENKT', 'systemlisten.NICHT_GEFUEHRT',
]);

/**
 * Hält die gefundenen Musterausfuhren gegen die Aufzählung — in beide
 * Richtungen.
 *
 * @param {string[]} gefunden `modul.AUSFUHR`, wie sie im Quelltext stehen.
 */
export function quellenbefund(gefunden, register = REGELQUELLEN, form = FORMMUSTER) {
  const meldungen = [];
  const gefuehrt = new Set([...register.map((r) => `${r.modul}.${r.ausfuhr}`), ...form]);
  const vorhanden = new Set(gefunden);

  for (const name of gefunden) {
    if (!gefuehrt.has(name)) {
      meldungen.push({
        regel: 'regel-nicht-eingeordnet',
        wo: name,
        text: `${name} ist ein Muster, das die Kundentext-Werkzeuge erreichen, und steht in `
          + 'keiner der beiden Listen — es sagt niemand, ob es eine Behauptungsregel ist',
      });
    }
  }
  for (const name of gefuehrt) {
    if (!vorhanden.has(name)) {
      meldungen.push({
        regel: 'eintrag-ohne-regel',
        wo: name,
        text: `${name} steht in der Aufzählung, wird von den Kundentext-Werkzeugen aber nicht `
          + 'mehr erreicht — umbenannt, entfernt oder abgehängt',
      });
    }
  }
  for (const r of register) {
    if (!r.behauptung && (r.warum ?? '').length < 30) {
      meldungen.push({
        regel: 'ohne-grund',
        wo: `${r.modul}.${r.ausfuhr}`,
        text: `${r.modul}.${r.ausfuhr} ist als „keine Behauptungsregel" geführt, ohne dass ein `
          + 'Grund dabeisteht',
      });
    }
    if (r.behauptung && !r.umschrieben && (r.warum ?? '').length < 30) {
      meldungen.push({
        regel: 'ohne-umschreibung',
        wo: `${r.modul}.${r.ausfuhr}`,
        text: `${r.modul}.${r.ausfuhr} ist eine Behauptungsregel ohne Umschreibungen und ohne `
          + 'Grund — ihre Reichweite ist ungemessen',
      });
    }
  }
  return {
    gefunden: gefunden.length,
    behauptungsregeln: register.filter((r) => r.behauptung).length,
    offen: register.filter((r) => r.behauptung && !r.umschrieben).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
