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

/**
 * Das Ende einer Zeichenkette, die bei `start` mit ihrem Anführungszeichen
 * beginnt — Rückstriche übersprungen. -1, wenn sie nicht geschlossen wird.
 */
export function endeDerZeichenkette(text, start) {
  const anfuehrung = text[start];
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === '\\') { i++; continue; }
    if (text[i] === anfuehrung) return i;
  }
  return -1;
}

/**
 * Steht das `/` bei `start` am Anfang eines Muster-Literals — oder ist es eine
 * Division?
 *
 * Zu unterscheiden sind die beiden nur am Zeichen davor: Nach einem Wert
 * (`a / b`, `zahl) / 2`) teilt es, nach einem Operator oder einer öffnenden
 * Klammer beginnt es ein Muster. Diese Liste ist die übliche Heuristik; sie
 * deckt jede Schreibweise ab, die im Testbestand vorkommt.
 */
export function istMusteranfang(text, start) {
  let i = start - 1;
  while (i >= 0 && /\s/.test(text[i])) i--;
  if (i < 0) return true;
  // Der Pfeil ist der häufigste Fall im Bestand: `(m) => /muster/.test(m)`.
  // Ein einzelnes `>` ist dagegen ein Vergleich, hinter dem geteilt wird.
  if (text[i] === '>' && text[i - 1] === '=') return true;
  if ('(,=:[!&|?+-*%^~{};'.includes(text[i])) return true;
  return /\b(return|typeof|case|in|of|do|else|yield|await|new|delete|void|instanceof)$/
    .test(text.slice(0, i + 1));
}

/**
 * Das Ende eines Muster-Literals, das bei `start` beginnt. Zeichenklassen
 * zählen mit: In `[^/]` schließt der Schrägstrich das Muster nicht.
 */
export function endeDesMusters(text, start) {
  let inKlasse = false;
  for (let i = start + 1; i < text.length; i++) {
    const z = text[i];
    if (z === '\\') { i++; continue; }
    if (z === '\n') return -1;
    if (inKlasse) { if (z === ']') inKlasse = false; continue; }
    if (z === '[') { inKlasse = true; continue; }
    if (z === '/') return i;
  }
  return -1;
}

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
  let tiefe = 0;
  for (let i = start; i < text.length; i++) {
    const zeichen = text[i];

    if (zeichen === '/' && text[i + 1] === '/') {
      const ende = text.indexOf('\n', i);
      if (ende === -1) return -1;
      i = ende;
      continue;
    }
    if (zeichen === '/' && text[i + 1] === '*') {
      const ende = text.indexOf('*/', i + 2);
      if (ende === -1) return -1;
      i = ende + 1;
      continue;
    }
    if (zeichen === "'" || zeichen === '"' || zeichen === '`') {
      const ende = endeDerZeichenkette(text, i);
      if (ende === -1) return -1;
      i = ende;
      continue;
    }
    if (zeichen === '/' && istMusteranfang(text, i)) {
      const ende = endeDesMusters(text, i);
      if (ende === -1) return -1;
      i = ende;
      continue;
    }

    if (zeichen === auf) tiefe++;
    else if (zeichen === zu) {
      tiefe--;
      if (tiefe === 0) return i;
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
 * Zeichenketten durch Leerzeichen ersetzen — Länge und Zeilen bleiben gleich.
 *
 * **Der Anlass, 14. September 2026.** `test/allaussage.test.js` prüft einen
 * Leser, der Testrümpfe liest, und führt dafür Rümpfe als **Zeichenketten**
 * mit: `'for (const f of FELDER) { assert.ok(f); }'`. Der Prüfer der Tests
 * las sie als Schleifen und meldete zwei hohle Testfälle, die keine sind.
 *
 * > **Ein Prüfer, der in Anführungszeichen hineinliest, prüft eine Zeile, die
 * > nie läuft** — und dieselbe Lehre steht seit dem 11. September in seinem
 * > eigenen Kopf, nur für einen anderen Fall.
 *
 * Ersetzt wird zeichenweise, damit jede Fundstelle danach an derselben Stelle
 * steht wie vorher: Die Regeln daneben rechnen mit Positionen im Rumpf.
 */
export function ohneZeichenketten(quelle) {
  const text = String(quelle ?? '');
  let aus = '';
  for (let i = 0; i < text.length;) {
    const z = text[i];
    if (z === "'" || z === '"' || z === '`') {
      const ende = endeDerZeichenkette(text, i);
      const bis = ende === -1 ? text.length - 1 : ende;
      aus += z + ' '.repeat(bis - i - 1) + (ende === -1 ? '' : text[bis]);
      i = bis + 1;
      continue;
    }
    if (z === '/' && istMusteranfang(text, i)) {
      const ende = endeDesMusters(text, i);
      const bis = ende === -1 ? text.length - 1 : ende;
      aus += ' '.repeat(bis - i + 1);
      i = bis + 1;
      continue;
    }
    aus += z;
    i += 1;
  }
  return aus;
}
