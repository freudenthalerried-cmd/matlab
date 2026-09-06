/**
 * Erreicht ein Vorbehalt aus dem Rechenkern je einen Leser?
 *
 * **Der Anlass, 5. September 2026, nachts.** `LIEFERGEBIET` trägt seit dem
 * 26. August ein Feld:
 *
 * ```js
 * vorbehalt:
 *   'Das tatsächliche Liefergebiet des Lieferanten ist unbekannt — aus fünfzehn '
 *   + 'Rechnungen nicht ableitbar, weil die Frachtpauschale nicht nach Entfernung '
 *   + 'staffelt. … bis dahin gilt diese Liste als die engere der beiden.'
 * ```
 *
 * Gemessen an der Ausgabe desselben Tages: **81 von 81 gebauten Seiten** nennen
 * das Liefergebiet, `llms.txt` nennt es zweimal, `areaServed` trägt es in den
 * strukturierten Daten. Der Vorbehalt stand in **keiner** davon — nur im
 * Bündel `shop.js`, als Quelltext, den niemand liest.
 *
 * > **Ein Vorbehalt, der im Rechenkern steht und die Ausgabe nie erreicht, ist
 * > eine Notiz an sich selbst.**
 *
 * `src/gebiet.js` löst denselben Fall seit dem 16. August ausdrücklich —
 * *„Stand und Quelle der Liste — wandert in jede Auskunft"*, und die Auskunft
 * trägt ihn tatsächlich. Zwei Vorbehalte im selben Bestand, einer mitgeführt,
 * einer nicht, und keine Prüfung, die den Unterschied bemerkt.
 *
 * ## Was hier geprüft wird
 *
 * In beide Richtungen, wie bei jedem Register dieses Bestands:
 *
 * 1. **Jedes Feld `vorbehalt:` in `src/` steht im Register.** Wer einen neuen
 *    schreibt und ihn nirgends hinträgt, wird gefragt.
 * 2. **Jeder Eintrag nennt entweder Ausgabedateien, in denen sein Kern
 *    vorkommt, oder einen tragfähigen Grund, warum keine.** Ein Vorbehalt
 *    ohne Leser und ohne Grund ist der Fund.
 *
 * **Was hier nicht geprüft wird:** ob der Vorbehalt gut formuliert ist oder an
 * der richtigen Stelle steht. Gemessen wird sein **Kern** — eine kurze
 * Zeichenkette, die in der Ausgabe vorkommen muss. Das ist grob und in der
 * tragenden Richtung sicher: Kommt der Kern nicht vor, kommt der Vorbehalt
 * nicht vor.
 *
 * ## Der erste Lauf fand diese Datei
 *
 * Gesucht wurde zuerst nach dem Wort `vorbehalt:` irgendwo im entkommentierten
 * Quelltext. Gemeldet wurde daraufhin `src/vorbehalt.js` selbst — die
 * Fundstelle war die **Meldung**, die den Fund beschreibt:
 *
 * ```js
 * text: `${q.datei} trägt ein Feld „vorbehalt:" und steht in keinem Eintrag`
 * ```
 *
 * > **Ein Prüfer, der ein Wort sucht, findet den Satz, in dem er das Wort
 * > erklärt.** Dieselbe Familie wie das Flächenregister, das sich selbst
 * > mitzählte, und wie das Leserregister, das sein eigenes Wort fand.
 *
 * Gesucht wird deshalb nach einem **Feld** und nicht nach einem Wort: am
 * Zeilenanfang, wie eine Eigenschaft in einem Objektliteral dasteht. Das ist
 * eine Annahme über die Schreibweise dieses Bestands und keine über
 * JavaScript — sie steht hier, damit sie jemand widerlegen kann.
 */

/** Wie lang eine Begründung mindestens sein muss, um eine zu sein. */
export const MINDESTGRUND = 60;

/**
 * Woran ein Vorbehaltsfeld erkannt wird: am **Zeilenanfang**, wie eine
 * Eigenschaft in einem Objektliteral dasteht. Ohne `m` und ohne Zeilenanfang
 * meldete der Prüfer beim ersten Lauf seine eigene Fehlermeldung.
 */
export const FELD = /^\s*vorbehalt\s*:/m;

/**
 * Die Vorbehalte des Bestands und wohin sie gehören.
 *
 * `feld` ist der Ausdruck, unter dem der Vorbehalt im Rechenkern steht —
 * gesucht wird er in der genannten Datei. `kern` ist das Stück, das in der
 * Ausgabe stehen muss.
 */
export const VORBEHALTE = Object.freeze([
  Object.freeze({
    id: 'liefergebiet',
    quelle: 'src/liefergebiet.js',
    was: 'Das Gebiet des Lieferanten ist unbekannt; unsere Liste gilt als die engere der beiden.',
    kern: 'nicht bestätigt',
    stehtIn: Object.freeze(['lieferung.html', 'llms.txt']),
  }),
  Object.freeze({
    id: 'bezirksliste-radon',
    quelle: 'src/gebiet.js',
    was: 'Die Bezirksliste des Radonvorsorgegebiets stammt aus Sekundärquellen.',
    kern: 'Sekundärquellen',
    stehtIn: Object.freeze([]),
    warumOhneAusgabe:
      'Er gehört zum Radonmodell, das nach Gate 12 gleichrangig im Bestand liegt und heute '
      + 'nichts baut: `vorsorgeauskunft` ruft außerhalb der Tests niemand. Der Vorbehalt ist '
      + 'trotzdem richtig verdrahtet — `GEBIETSSTAND` wandert nach dem Kopfkommentar der Datei '
      + 'in jede Auskunft, und ein Testfall hält das fest. Er hat keine Ausgabe, weil es keine '
      + 'Auskunft gibt, nicht weil er vergessen wurde.',
  }),
]);

/**
 * Der Befund.
 *
 * @param {object} eingabe
 * @param {{datei: string, text: string}[]} eingabe.quellen  die Dateien aus `src/`
 * @param {Record<string, string>} eingabe.ausgabe  Dateiname → Text der Ausgabe
 * @param {readonly object[]} [eingabe.register]
 */
export function vorbehaltsbefund({ quellen, ausgabe, register = VORBEHALTE }) {
  const meldungen = [];
  const gefuehrt = new Map(register.map((e) => [e.quelle, e]));

  for (const e of register) {
    const quelle = quellen.find((q) => q.datei === e.quelle);
    if (!quelle) {
      meldungen.push({
        regel: 'quelle-gibt-es-nicht',
        text: `${e.id}: ${e.quelle} steht im Register und liegt nicht (mehr) im Bestand`,
      });
      continue;
    }
    if (!FELD.test(quelle.text)) {
      meldungen.push({
        regel: 'feld-verschwunden',
        text: `${e.id}: ${e.quelle} trägt kein Feld „vorbehalt:" mehr — Eintrag oder Datei nachziehen`,
      });
    }
    const orte = e.stehtIn ?? [];
    if (orte.length === 0) {
      if (!e.warumOhneAusgabe || e.warumOhneAusgabe.length < MINDESTGRUND) {
        meldungen.push({
          regel: 'ohne-leser-und-ohne-grund',
          text: `${e.id}: nennt keine Ausgabedatei und keinen tragfähigen Grund, warum keine`,
        });
      }
      continue;
    }
    for (const ort of orte) {
      const text = ausgabe[ort];
      if (text === undefined) {
        meldungen.push({
          regel: 'ausgabe-fehlt',
          text: `${e.id}: ${ort} ist nicht gebaut — der Vorbehalt ist dort nicht nachweisbar`,
        });
        continue;
      }
      if (!text.includes(e.kern)) {
        meldungen.push({
          regel: 'nicht-in-der-ausgabe',
          text: `${e.id}: „${e.kern}" steht nicht in ${ort}`,
        });
      }
    }
  }

  // **Die Gegenrichtung.** Ein Register, das nur seine eigenen Einträge prüft,
  // ist eine Liste und keine Messung — dieselbe Lehre wie beim Leserregister
  // am 4. September.
  for (const q of quellen) {
    if (!FELD.test(q.text)) continue;
    if (gefuehrt.has(q.datei)) continue;
    meldungen.push({
      regel: 'vorbehalt-ohne-eintrag',
      text: `${q.datei} trägt ein Feld „vorbehalt:" und steht in keinem Eintrag`,
    });
  }

  return {
    geprueft: quellen.length,
    eintraege: register.length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
