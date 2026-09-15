/**
 * Eine Testdatei in ihre Testfälle zerlegen — Titel und Rumpf.
 *
 * **Hierher gezogen am 14. September 2026.** Diese Zerlegung stand in
 * `bin/testpruefung.mjs`, und sie ist zweimal berichtigt worden: am
 * 28. August, weil sie `test(name, options, fn)` für einen Rumpf ohne
 * Zusicherungen hielt, und am 11. September, weil `\btest\(` auch auf
 * `muster.test(` traf und einen Methodenaufruf für einen Testfall nahm.
 *
 * > **Eine Zerlegung, die zweimal berichtigt wurde, darf es nicht zweimal
 * > geben.**
 *
 * Der zweite Prüfer über dieselben Dateien — `pruefe-allaussagen` — braucht
 * genau diese Lesart. Eine eigene zu schreiben hiesse, beide Berichtigungen
 * noch einmal zu verdienen.
 */

import { stuecke } from './quelltext.js';




/**
 * Die passende schließende Klammer — **ohne** Klammern in Zeichenketten,
 * Muster-Literalen und Kommentaren mitzuzählen.
 *
 * **Der Anlass, 3. September 2026.** `test/geheimnis.test.js` hat neun
 * Testfälle; dieser Prüfer sah acht. Einer davon zeigt einer Prüfregel eine
 * Codezeile als Text:
 *
 *     assert.deepEqual(findeAbfluss('export function artikelEinkauf(a, l) {'), []);
 *
 * Die geschweifte Klammer steht in Anführungszeichen und schließt nie. Diese
 * Zählung lief davon bis zum Dateiende, fand keine Balance, gab -1 zurück —
 * und die Schleife darüber übersprang den Testfall mit `continue`. Still.
 *
 * > **Ein Prüfer, der eine Stelle nicht lesen kann, muss das sagen. Wer sie
 * > überspringt, prüft weniger, als er meldet — und meldet es nicht.**
 *
 * Deshalb zwei Änderungen an einer Stelle: Diese Zählung kennt jetzt
 * Zeichenketten und Kommentare, und ein Testfall, der sich trotzdem nicht
 * abgrenzen lässt, wird gemeldet statt übersprungen.
 *
 * Muster-Literale gehören dazu: Der erste Anlauf kannte nur Zeichenketten und
 * machte acht weitere Fälle unlesbar — `/role="img" aria-label="[^"]+"/` trägt
 * fünf Anführungszeichen, und beim fünften lief die Zeichenkettenerkennung in
 * den Rest der Datei. **Ein Prüfer, der eine Schreibweise nicht kennt, meldet
 * nicht zu wenig, sondern das Falsche** — dieselbe Lehre wie beim
 * Optionsobjekt am 28.08., einen Stock tiefer.
 */
export function bisSchliessend(text, start, auf = '{', zu = '}') {
  // **Gelesen mit `src/quelltext.js` seit dem 14. September 2026,
  // nachmittags.** Hier stand der dritte Gang durch eine Quelle in diesem
  // Haus — Kommentare, Zeichenketten und Muster überspringen —, und er hatte
  // dieselben Sonderfälle noch einmal selbst zu kennen.
  let tiefe = 0;
  for (const st of stuecke(String(text))) {
    if (st.von + st.roh.length <= start) continue;
    if (st.art !== 'code') continue;
    for (let k = 0; k < st.roh.length; k++) {
      const stelle = st.von + k;
      if (stelle < start) continue;
      const zeichen = st.roh[k];
      if (zeichen === auf) tiefe++;
      else if (zeichen === zu) {
        tiefe--;
        if (tiefe === 0) return stelle;
      }
    }
  }
  return -1;
}

/** Zerlegt eine Testdatei in ihre einzelnen Testfälle. */
export function zerlege(quelle) {
  const faelle = [];
  // **Berichtigt am 11. September 2026.** Hier stand `\btest\(`. Eine
  // Wortgrenze steht auch zwischen dem Punkt und dem Namen, und damit las
  // dieser Prüfer `muster.test(`…`)` als Testfall — samt allem, was im
  // Schablonentext stand. In `betriebskette.test.js` fiel das auf: Der
  // vermeintliche Fall hatte keinen Rumpf und meldete sich als unlesbar.
  //
  // > **Ein Prüfer, der einen Methodenaufruf für eine Erklärung hält, prüft
  // > eine Zeile, die es nicht gibt** — und verdeckt damit die, die es gibt.
  const muster = /(?<![.\w$])test\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,/g;

  for (const treffer of quelle.matchAll(muster)) {
    const titel = treffer[2];
    // `node:test` erlaubt drei Formen: test(name, fn), test(name, options, fn)
    // und test(name, options). Die zweite hat dieser Prüfer bis zum 28.08.
    // falsch gelesen: Er nahm die **erste** geschweifte Klammer nach dem Namen
    // als Rumpf — und das ist bei `test('…', { skip: … }, () => { … })` das
    // Optionsobjekt. Zwei Testfälle in `baustoffkatalog.test.js` galten
    // deshalb als „behauptet nichts", obwohl sie zusammen zwölf
    // Zusicherungen tragen.
    //
    // > **Ein Prüfer, der eine gültige Schreibweise nicht kennt, meldet
    // > nicht zu wenig, sondern das Falsche** — und wer den Fehlalarm
    // > abhakt, hakt beim nächsten Mal auch den echten Treffer ab.
    let stelle = treffer.index + treffer[0].length;
    const versatz = quelle.slice(stelle).search(/\S/);
    if (versatz !== -1 && quelle[stelle + versatz] === '{') {
      const optionenZu = bisSchliessend(quelle, stelle + versatz);
      if (optionenZu === -1) continue;
      stelle = optionenZu + 1;
    }
    const zeile = quelle.slice(0, treffer.index).split('\n').length;
    const klammerAuf = quelle.indexOf('{', stelle);
    // Kein Rumpf zu finden ist kein Grund zu schweigen — siehe
    // `bisSchliessend`. Der Fall zählt mit und trägt seinen Grund.
    if (klammerAuf === -1) {
      faelle.push({ titel, rumpf: '', zeile, unlesbar: 'kein Rumpf nach dem Namen gefunden' });
      continue;
    }
    const klammerZu = bisSchliessend(quelle, klammerAuf);
    if (klammerZu === -1) {
      faelle.push({
        titel, rumpf: '', zeile,
        unlesbar: 'die geschweifte Klammer des Rumpfes schließt nicht',
      });
      continue;
    }

    faelle.push({
      titel,
      rumpf: quelle.slice(klammerAuf + 1, klammerZu),
      zeile,
    });
  }
  return faelle;
}

/**
 * Alles zu Leerzeichen, **was nicht läuft** — Länge und Zeilen bleiben gleich.
 *
 * **Der Anlass, 14. September 2026.** `test/allaussage.test.js` prüft einen
 * Leser, der Testrümpfe liest, und führt dafür Rümpfe als **Zeichenketten**
 * mit: `'for (const f of FELDER) { assert.ok(f); }'`. Der Prüfer der Tests
 * las sie als Schleifen und meldete zwei hohle Testfälle, die keine sind.
 *
 * > **Ein Prüfer, der in Anführungszeichen hineinliest, prüft eine Zeile, die
 * > nie läuft.**
 *
 * **Und derselbe Satz gilt für Kommentare — nachmittags nachgetragen.** Die
 * Fassung von damals hieß `ohneZeichenketten` und tat trotzdem mehr: Sie
 * löschte auch Blockkommentare, aber **aus Versehen.** Ihr Musterleser hielt
 * das `/` in `/* -----` für den Anfang eines regulären Ausdrucks — nach einem
 * Zeilenumbruch beginnt dort einer — und blankte bis zum nächsten `/`.
 *
 * > **Ein Werkzeug, das aus einem Irrtum heraus das Richtige tut, tut es beim
 * > nächsten Umbau nicht mehr.** Beim Umstellen auf den gemeinsamen Leser
 * > fiel es weg, und vier Schleifen in Kommentaren standen als Verdacht da.
 *
 * Jetzt steht es im Namen und im Vertrag: Zeichenketten, reguläre Ausdrücke
 * und Kommentare werden zu Leerzeichen. Ersetzt wird zeichenweise, damit jede
 * Fundstelle danach an derselben Stelle steht wie vorher — die Regeln daneben
 * rechnen mit Positionen im Rumpf.
 */
export function nurCode(quelle) {
  let aus = '';
  for (const st of stuecke(String(quelle ?? ''))) {
    if (st.art === 'kette') {
      // Die Begrenzer bleiben stehen: Eine Zeile, die vorher eine
      // Zeichenkette **hatte**, soll danach noch erkennbar eine haben.
      const erstes = st.roh[0];
      const letztes = st.roh.length > 1 ? st.roh[st.roh.length - 1] : '';
      aus += erstes + ' '.repeat(Math.max(0, st.roh.length - 1 - letztes.length)) + letztes;
      continue;
    }
    if (st.art === 'muster') { aus += ' '.repeat(st.roh.length); continue; }
    if (st.art === 'block' || st.art === 'zeile') {
      // Die Zeilenumbrüche bleiben, damit Zeilennummern weiter stimmen.
      aus += st.roh.replace(/[^\n]/g, ' ');
      continue;
    }
    aus += st.roh;
  }
  return aus;
}
