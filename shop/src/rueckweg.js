/**
 * Wohin ein Kunde geschickt wird, wenn der erste Weg nicht geht.
 *
 * **Der Anlass, 15. September 2026.** Der Auftraggeber hat heute früh gefragt,
 * ob ihn schon eine KI erreichen kann. Beim Nachsehen kam etwas anderes
 * heraus: Die Kasse sagt, wenn keine Mailadresse hinterlegt ist,
 *
 * > *„Eine Mailadresse ist noch nicht hinterlegt. Bitte den Text kopieren und
 * > an die Adresse aus dem Impressum schicken."*
 *
 * Im Impressum steht **auch keine**. Die E-Mail-Adresse ist seit dem
 * 10. September einer der sieben Punkte auf dem Zettel für den Auftraggeber.
 *
 * > **Ein Rückweg, der auf eine leere Stelle zeigt, ist kein Rückweg.**
 *
 * Ein Kunde, der eine fertig gerechnete Positionsliste kopiert und dann
 * nirgends hinschicken kann, hat mehr Zeit verloren als einer, dem man es
 * vorher sagt. Und er sagt es niemandem — abgeschreckte Körbe stehen in keiner
 * Abrechnung.
 *
 * Zwei der drei Stellen habe ich selbst am 14. September geschrieben: „…oder
 * rufen Sie uns an" in zwei Abweisungen des Empfangsskripts. Eine
 * Telefonnummer führt dieser Betrieb heute nirgends.
 *
 * ## Was dieses Modul entscheidet — und was nicht
 *
 * Es entscheidet **nicht**, ob ein Kanal genannt werden soll. Es sagt, welcher
 * Kanal heute wirklich dasteht, und baut daraus den Satz. Beide Richtungen
 * sind Befunde: Ein Satz, der einen leeren Kanal nennt, schickt ins Leere; ein
 * Satz, der einen gefüllten **nicht** nennt, lässt den Kunden im Ungewissen,
 * obwohl die Auskunft danebenliegt.
 */

import { textZeile } from './format.js';

/**
 * Die Kanäle, in der Reihenfolge, in der ein Kunde sie brauchen kann.
 *
 * `feld` ist der Schlüssel in `data/betreiber.json`, `wort` der Name in einer
 * Meldung. Ein **Muster**, an dem der Kanal in einem Satz zu erkennen wäre,
 * steht hier ausdrücklich nicht: Der erste Wurf hatte eines und meldete
 * sofort, der Satz „Die E-Mail-Adresse ist nicht lesbar" nenne unsere Adresse
 * — gemeint ist dort die des Kunden. Wer auf unseren Kanal zeigt, sagt es
 * selbst (`nenntKanal`).
 */
export const KANAELE = Object.freeze([
  Object.freeze({
    feld: 'email',
    wort: 'Mailadresse',
    satz: (wert) => `Bitte schicken Sie uns den Text an ${wert}.`,
  }),
  Object.freeze({
    feld: 'telefon',
    wort: 'Telefonnummer',
    satz: (wert) => `Bitte rufen Sie uns an: ${wert}.`,
  }),
]);

/**
 * Ob ein Feld der Betreiberdatei wirklich etwas trägt.
 *
 * **Nicht `gefuellt`.** Der Name war der erste Wurf, und der Bündelbau hat ihn
 * abgewiesen: `src/beleg.js` führt seit dem 29. August ein eigenes `gefuellt`,
 * und im zusammengefügten Skript wären zwei Deklarationen desselben Namens ein
 * SyntaxError. Im Modul harmlos, im Bündel tödlich — und gefunden vom Bau, ohne
 * dass eine Seite kaputtgegangen wäre.
 */
export const kanalGefuellt = (wert) => typeof wert === 'string' && wert.trim() !== '';

/**
 * Der Satz, der heute stimmt.
 *
 * Ohne jeden Kanal wird **nicht** auf das Impressum verwiesen. Dort steht
 * dasselbe Nichts, und ein zweiter Verweis auf eine leere Stelle ist eine
 * Ausrede mit Fußnote.
 */
export function rueckwegsatz(betreiber = {}, kanaele = KANAELE) {
  for (const k of kanaele) {
    const wert = betreiber?.[k.feld];
    /*
     * **`textZeile` und nicht `trim` — 15. September 2026.** Die Probe in
     * `test/fremdtext.test.js` hat es gefunden: Ein Zeilenumbruch in der
     * eigenen Mailadresse machte aus einem Satz an den Kunden **vier Zeilen**.
     * Dass das Feld uns gehört und `pruefeBetreiberform` es ansieht, ist kein
     * Grund — jeder andere Ausgang dieses Hauses setzt auch die eigenen
     * Angaben durch denselben Filter.
     */
    if (kanalGefuellt(wert)) return { feld: k.feld, text: k.satz(textZeile(wert)) };
  }
  return {
    feld: null,
    text: 'Eine Mailadresse und eine Telefonnummer sind noch nicht hinterlegt — '
      + 'dieser Shop kann Ihre Anfrage deshalb noch nicht entgegennehmen.',
  };
}

/**
 * Hält den gezeigten Rückweg gegen den, der heute stimmt.
 *
 * **Nicht `rueckwegbefund`.** Auch dieser Name war der erste Wurf, und auch er
 * war vergeben: `src/anfragelesen.js` führt seit dem 6. September ein
 * `rueckwegbefund` — den Sweep, der jede Menge schreibt und zurückliest. Zwei
 * `…befund` desselben Namens für zwei verschiedene Verträge sind schlimmer als
 * zwei Fassungen; gefunden hat es `pruefe-ungerufen`, der die **andere**
 * Funktion daraufhin für ungerufen hielt.
 *
 * **Warum kein Mustervergleich über die Prosa.** Der erste Wurf suchte in
 * jedem Satz nach den Wörtern „Mailadresse" und „rufen Sie uns an" und meldete
 * sofort einen Fehltreffer: Der Satz *„Eine Mailadresse ist noch nicht
 * hinterlegt"* **nennt** die Mailadresse und schickt niemanden hin.
 *
 * > **Ein Wort im Satz ist keine Wegbeschreibung.**
 *
 * Geprüft wird deshalb nicht die Formulierung, sondern die Herkunft: Der
 * gezeigte Satz muss der sein, den `rueckwegsatz` aus der Betreiberdatei
 * baut. Dann kann er gar nicht auf eine leere Stelle zeigen — und sobald ein
 * Kanal dazukommt, nennt er ihn von selbst.
 *
 * @param {string} gezeigt  was der Kunde an dieser Stelle liest
 * @param {object} betreiber  der Inhalt von `data/betreiber.json`
 * @param {string} wo  wie die Stelle in der Meldung heißen soll
 */
export function kanalbefund(gezeigt, betreiber = {}, wo = 'ein Satz', kanaele = KANAELE) {
  const meldungen = [];
  const text = String(gezeigt ?? '');
  const soll = rueckwegsatz(betreiber, kanaele);

  if (!text.includes(soll.text)) {
    meldungen.push({
      regel: 'rueckweg-nicht-aus-der-quelle',
      text: `${wo} zeigt einen anderen Rückweg als den, der heute stimmt — erwartet war `
        + `„${soll.text}"`,
    });
  }

  /*
   * **Und der Verweis auf das Impressum.** Er war der Fund dieses Tages: Die
   * Kasse schickte den Kunden dorthin, und dort steht dieselbe Lücke. Gemeldet
   * wird er nur, solange kein Kanal gefüllt ist — sobald einer dasteht, ist
   * der Verweis richtig und nicht mehr die einzige Auskunft.
   */
  if (/Impressum/i.test(text) && soll.feld === null) {
    meldungen.push({
      regel: 'verweis-auf-dieselbe-luecke',
      text: `${wo} schickt den Kunden ins Impressum, und dort steht dieselbe Lücke — `
        + 'ein zweiter Verweis auf eine leere Stelle ist eine Ausrede mit Fußnote',
    });
  }

  return { erwartet: soll.text, kanal: soll.feld, meldungen, sauber: meldungen.length === 0 };
}

/**
 * Dieselbe Frage an die Abweisungen des Empfangsskripts.
 *
 * **Warum ein `nenntKanal` und kein Muster über die Prosa.** Der erste Wurf
 * suchte in jedem Satz nach den Wörtern der Kanäle und meldete sofort: *„Die
 * E-Mail-Adresse ist nicht lesbar"* nenne unsere Adresse — gemeint ist dort
 * die **des Kunden**. Ein Eintrag sagt deshalb selbst, ob er auf unseren Kanal
 * zeigt.
 *
 * Heute tut das keiner: Beide „…oder rufen Sie uns an" sind am 15. September
 * herausgenommen worden, weil es die Nummer nicht gibt. Kommt sie, gehört sie
 * hinein — und dann hält diese Prüfung fest, dass sie auch dasteht.
 *
 * @param {{id: string, nenntKanal?: string}[]} eintraege
 * @param {object} betreiber
 */
export function abweisungskanalbefund(eintraege = [], betreiber = {}, kanaele = KANAELE) {
  const meldungen = [];
  for (const e of eintraege) {
    if (!e.nenntKanal) continue;
    const kanal = kanaele.find((k) => k.feld === e.nenntKanal);
    if (!kanal) {
      meldungen.push({
        regel: 'kanal-gibt-es-nicht',
        text: `Abweisung „${e.id}" nennt den Kanal „${e.nenntKanal}", und den führt KANAELE nicht`,
      });
      continue;
    }
    if (kanalGefuellt(betreiber?.[kanal.feld])) continue;
    meldungen.push({
      regel: 'rueckweg-ins-leere',
      text: `Abweisung „${e.id}" zeigt auf die ${kanal.wort}, und ${kanal.feld} ist in der `
        + 'Betreiberdatei leer — ein Rückweg, der auf eine leere Stelle zeigt, ist kein Rückweg',
    });
  }
  return { gefuehrt: eintraege.filter((e) => e.nenntKanal).length, meldungen, sauber: meldungen.length === 0 };
}
