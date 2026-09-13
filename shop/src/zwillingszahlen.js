/**
 * Zahlen, die es nur einmal geben darf — und wo sie trotzdem stehen.
 *
 * **Der Anlass, 11. September 2026.** Drei Tage hintereinander ist dieselbe
 * Bauart aufgefallen, jedes Mal durch Zufall und jedes Mal an einer Zahl, an
 * der Geld hängt:
 *
 * | Tag | Zahl | wo sie zweimal stand |
 * |---|---|---|
 * | 10.09. | Bindefrist 14 Tage | Beleg und Artikelseite (ein Stand je Ware) |
 * | 11.09. | Kaufquote 0,02 | Annahmenregister und Gebotsrechnung |
 * | 11.09. | Zielmarge 0,25 | Katalog und Annahmenregister |
 * | 11.09. | Umsatzsteuer 0,20 | **vier** Fassungen, drei davon gebunden |
 *
 * Jedes Mal stand die Gleichheit in einem **Satz** — *„deckungsgleich mit
 * ZIELMARGE"*, *„DIESELBE GRÖSSE wie die Kaufquote der Kampagne"* — und nicht
 * in einem Aufruf.
 *
 * > **Drei Funde durch Zufall sind kein Grund zu glauben, es seien die
 * > letzten.**
 *
 * ## Was dieses Register nicht ist
 *
 * Es ist **keine Jagd auf doppelte Literale**. Der Bestand ist voll von
 * Zahlen, die zufällig gleich sind: `fixEuro: 0.25` ist die Kartengebühr von
 * 25 Cent und hat mit der Zielmarge nichts zu tun — `bin/geheimnispruefung.mjs`
 * trägt diese Falle seit dem 5. September ausgeschrieben im Kopf, weil sie
 * schon einmal zugeschnappt ist.
 *
 * Geführt werden deshalb nur Zahlen, die **eine Heimat** haben: eine Ausfuhr,
 * die sie erklärt. Jedes weitere Vorkommen desselben Literals im Quelltext
 * muss entweder diese Heimat lesen — dann steht dort kein Literal mehr — oder
 * hier mit Grund stehen.
 *
 * Und in der Gegenrichtung: Eine Ausnahme, deren Vorkommen verschwunden ist,
 * wird gemeldet. Ein Verzeichnis, das Gründe für Zustände führt, die es nicht
 * mehr gibt, wächst und sagt immer weniger.
 */

/**
 * Kommentare heraus, bevor gesucht wird.
 *
 * Ohne diesen Schritt fände der Prüfer jede Zahl, über die irgendwo ein Satz
 * geschrieben steht — und dieser Bestand schreibt viele Sätze über seine
 * Zahlen. Gemessen wird der Code, nicht die Begründung.
 */
export function ohneKommentare(quelltext) {
  return String(quelltext ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * Dateien, die über den Bestand **reden**, statt mit ihm zu rechnen.
 *
 * Beide zitieren Quelltext und beschreiben Befunde — in Zeichenketten, nicht
 * in Kommentaren, also kommen sie durch `ohneKommentare` unbeschadet hindurch.
 * Sie hier auszunehmen ist dieselbe Lehre wie beim Gate-Prüfer, der über sich
 * selbst gestolpert ist, weil er seine Fundstelle wörtlich mitführte:
 *
 * > **Ein Verzeichnis, das Quelltext zitiert, ist Quelltext.**
 *
 * `zwillingszahlen.js` steht dabei aus einem besonderen Grund in seiner
 * eigenen Liste: Es trägt jede geführte Zahl im Feld `literal` und meldete
 * sich beim ersten Lauf dreimal selbst.
 */
const REDEN_UEBER_DEN_BESTAND = Object.freeze([
  'src/zwillingszahlen.js',
  'src/gegenprobenregister.js',
]);

/** Die Zahlen mit einer Heimat. */
export const ZWILLINGE = Object.freeze([
  Object.freeze({
    id: 'umsatzsteuer',
    literal: '0.20',
    heimat: 'src/preis.js',
    name: 'UST_SATZ',
    was: 'der österreichische Normalsteuersatz, mit dem jeder Kundenpreis brutto wird',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'src/kontrolle.js',
        warum: 'Die Belegkontrolle führt bewusst eine eigene Zahl, damit sie nicht dasselbe '
          + 'liest wie das Geprüfte — eine Kontrolle, die den Prüfling importiert, prüft sich '
          + 'selbst. Am 30.08. geprüft und stehen gelassen; `test/kontrolle.test.js` liest den '
          + 'Quelltext dieser Datei und hält ihr Literal gegen `preis.js`.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'zielmarge',
    literal: '0.25',
    heimat: 'src/baustoffkatalog.js',
    name: 'ZIELMARGE',
    was: 'die Weisung des Auftraggebers vom 25.08.: 25 % Marge vom Verkauf, nicht Zuschlag',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'src/zahlung.js',
        warum: 'Dreimal `fixEuro: 0.25` — die **Kartengebühr von 25 Cent**, ein Betrag in Euro '
          + 'und kein Anteil. Genau diese Verwechslung hat am 5. September den Geheimnisprüfer '
          + 'in die Irre geführt; sie steht dort im Kopf ausgeschrieben.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'kaufquote',
    literal: '0.02',
    heimat: 'src/empfindlichkeit.js',
    name: 'ANNAHMEN.umsatzProSession',
    was: 'die Quote, mit der jedes Höchstgebot je Klick multipliziert wird',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'bin/rollout.mjs',
        warum: 'Eine **Szenarienliste** `[0.02, 0.01, 0.005]`: Der Plan rechnet den Versuch für '
          + 'drei Quoten durch, und der Basisfall ist eine davon. Die Liste ist der Zweck der '
          + 'Annahme und nicht ihre Kopie — sie fiele mit einem Verweis auf die Heimat sogar '
          + 'schwerer zu lesen.',
      }),
      Object.freeze({
        datei: 'bin/werbeprobe.mjs',
        warum: 'Zwei Szenarienlisten aus demselben Grund wie im Rollout — die Probe rechnet, ab '
          + 'wie vielen Klicks ohne Bestellung sich welche Quote ausschließen lässt.',
      }),
    ]),
  }),
]);

/**
 * Hält jede geführte Zahl gegen den Quelltext.
 *
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 */
export function zwillingsbefund(quellen, eintraege = ZWILLINGE) {
  const meldungen = [];
  const melde = (regel, wo, text) => meldungen.push({ regel, wo, text });
  let gesucht = 0;

  for (const e of eintraege) {
    const erlaubt = new Set([e.heimat, ...REDEN_UEBER_DEN_BESTAND, ...e.ausnahmen.map((a) => a.datei)]);
    const gefunden = new Set();
    let inHeimat = false;

    for (const [pfad, text] of quellen) {
      // Eine Zahl mit Nachkommastellen soll nicht in `0.255` oder `10.20`
      // treffen: Vor dem Literal darf keine Ziffer und kein Punkt stehen,
      // danach keine Ziffer.
      const muster = new RegExp(`(^|[^0-9.])${e.literal.replace('.', '\\.')}([^0-9]|$)`);
      if (!muster.test(ohneKommentare(text))) continue;
      gesucht += 1;
      if (pfad === e.heimat) { inHeimat = true; continue; }
      gefunden.add(pfad);
      if (erlaubt.has(pfad)) continue;
      melde('zahl-zweimal', `${pfad} · ${e.id}`,
        `${pfad} trägt ${e.literal} als eigenes Literal — ${e.was}. Die Heimat ist `
        + `${e.name} in ${e.heimat}; wer sie liest, hat keine zweite Zahl`);
    }

    if (!inHeimat) {
      melde('heimat-ohne-zahl', e.id,
        `${e.heimat} trägt ${e.literal} nicht mehr — dann ist entweder die Zahl eine andere `
        + 'oder dieser Eintrag beschreibt etwas, das es nicht gibt');
    }
    for (const a of e.ausnahmen) {
      if (!gefunden.has(a.datei)) {
        melde('ausnahme-ohne-fund', `${a.datei} · ${e.id}`,
          `${a.datei} steht als begründete Ausnahme für ${e.literal} und trägt die Zahl nicht `
          + 'mehr — ein Grund für einen Zustand, den es nicht mehr gibt');
      }
      if (!a.warum || a.warum.length < 40) {
        melde('ausnahme-ohne-grund', `${a.datei} · ${e.id}`,
          `${a.datei} steht als Ausnahme ohne belastbaren Grund`);
      }
    }
  }

  return { eintraege: eintraege.length, gesucht, meldungen, sauber: meldungen.length === 0 };
}
