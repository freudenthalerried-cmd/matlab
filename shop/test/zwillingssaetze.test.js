/**
 * Sätze, die in mehr als einer Quelldatei stehen.
 *
 * **Der Anlass, 14. September 2026.** Ein Satz steht in diesem Bestand seit dem
 * 8. September und ist seither vier Runden lang durch Zufall wiedergefunden
 * worden:
 *
 * > **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WIEDERHOLUNG_GEPRUEFT, WIEDERHOLUNGEN_HOECHSTENS, REDEN_UEBER_DEN_BESTAND,
  saetzeDerQuelle, satzbefund,
} from '../src/zwillingssaetze.js';

test('Gelesen werden Kommentare und Zeichenketten, nicht der Code dazwischen', () => {
  const quelle = [
    '/** Ein Satz aus einem Blockkommentar mit deutlich mehr als acht Wörtern. */',
    "const x = dirname(fileURLToPath(import.meta.url));",
    '// Ein Zeilenkommentar, der ebenfalls mehr als acht Wörter trägt und zählt.',
    "const text = 'Eine Meldung, die aus acht oder mehr Wörtern besteht und zählt.';",
  ].join('\n');
  const saetze = [...saetzeDerQuelle(quelle)];
  assert.equal(saetze.length, 3, `gefunden: ${JSON.stringify(saetze)}`);
  assert.ok(saetze.every((s) => !s.includes('dirname')),
    'der Code ist in einen Satz hineingelaufen');
});

/*
 * **Der Fall, an dem der erste Entwurf gescheitert ist.** Er hat die
 * Kommentarzeichen durch Leerzeichen ersetzt und den Rest stehen lassen — und
 * damit lief der letzte Satz eines Blockkommentars in die Codezeile darunter.
 *
 * > **Ein Leser, der den Code wegstreicht, liest immer noch den Code.**
 */
test('Der letzte Satz eines Blockkommentars läuft nicht in den Code darunter', () => {
  const quelle = "/**\n * Ein Absatz mit deutlich mehr als acht Wörtern darin.\n */\n"
    + "const hier = dirname(fileURLToPath(import.meta.url));";
  const saetze = [...saetzeDerQuelle(quelle)];
  assert.deepEqual(saetze, ['Ein Absatz mit deutlich mehr als acht Wörtern darin.']);
});

test('Zu kurze Sätze und Code zählen nicht', () => {
  assert.equal(saetzeDerQuelle('// Zu kurz.').size, 0);
  assert.equal(saetzeDerQuelle('// 1 2 3 4 5 6 7 8 9 10 11 12').size, 0, 'ohne Buchstaben');
  assert.equal(saetzeDerQuelle('// const a = { b: 1 }; und noch ein paar Wörter dazu').size, 0);
  assert.equal(saetzeDerQuelle('').size, 0);
});

test('Ein Satz in zwei Dateien wird gemeldet, einer in einer nicht', () => {
  const satz = 'Ein Satz, der in zwei Dateien steht und acht Wörter hat.';
  const quellen = new Map([
    ['src/a.js', `// ${satz}`],
    ['src/b.js', `// ${satz}`],
    ['src/c.js', '// Ein anderer Satz mit ebenfalls mehr als acht Wörtern darin.'],
  ]);
  const b = satzbefund(quellen, [], null);
  assert.equal(b.mehrfach.length, 1);
  assert.deepEqual(b.mehrfach[0].dateien, ['src/a.js', 'src/b.js']);

  // Mit Grund geführt ist er keine Meldung mehr.
  const gefuehrt = [{
    anfang: 'Ein Satz, der in zwei Dateien steht',
    hoechstens: 2,
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb diesen Satz '
      + 'bis über die achtzig Zeichen hinaus fortsetzt.',
  }];
  assert.equal(satzbefund(quellen, gefuehrt, null).mehrfach.length, 0);
});

test('Ein Grund für zwei Fundstellen ist keiner für sieben', () => {
  const satz = 'Ein Satz, der in drei Dateien steht und acht Wörter hat.';
  const quellen = new Map(['a', 'b', 'c'].map((n) => [`src/${n}.js`, `// ${satz}`]));
  const gefuehrt = [{
    anfang: 'Ein Satz, der in drei Dateien steht',
    hoechstens: 2,
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb diesen Satz '
      + 'bis über die achtzig Zeichen hinaus fortsetzt.',
  }];
  const b = satzbefund(quellen, gefuehrt, null);
  assert.equal(b.meldungen[0].regel, 'mehr-fundstellen-als-begruendet');
});

test('Die Gegenrichtung: ein Grund ohne Satz und ein dünner Grund', () => {
  const gefuehrt = [{
    anfang: 'Ein Satz, den es nicht mehr gibt',
    hoechstens: 2,
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb diesen Satz '
      + 'bis über die achtzig Zeichen hinaus fortsetzt.',
  }];
  const leer = new Map([['src/a.js', '// Irgendein anderer Satz mit mehr als acht Wörtern darin.']]);
  assert.equal(satzbefund(leer, gefuehrt, null).meldungen[0].regel, 'grund-ohne-satz');

  const duenn = satzbefund(leer, [{ anfang: 'Irgendein anderer Satz mit', hoechstens: 2, warum: 'kurz' }], null);
  assert.ok(duenn.meldungen.some((m) => m.regel === 'grund-zu-duenn'));
});

test('Die Sperrklinke meldet in beide Richtungen', () => {
  const satz = 'Ein Satz, der in zwei Dateien steht und acht Wörter hat.';
  const quellen = new Map([['src/a.js', `// ${satz}`], ['src/b.js', `// ${satz}`]]);
  assert.ok(satzbefund(quellen, [], 0).meldungen.some((m) => m.regel === 'mehr-wiederholungen-als-erlaubt'));
  assert.ok(satzbefund(quellen, [], 5).meldungen.some((m) => m.regel === 'sperrklinke-nachziehen'));
});

test('Jede begründete Wiederholung nennt Anfang, Zahl und einen tragfähigen Grund', () => {
  assert.ok(WIEDERHOLUNG_GEPRUEFT.length >= 3,
    `nur ${WIEDERHOLUNG_GEPRUEFT.length} Einträge — ohne Bestand prüft die Schleife nichts`);
  for (const g of WIEDERHOLUNG_GEPRUEFT) {
    assert.ok(g.anfang.length >= 15, `„${g.anfang}": zu kurzer Anfang trifft zu viel`);
    assert.ok(Number.isInteger(g.hoechstens) && g.hoechstens >= 2,
      `„${g.anfang}": ohne Zahl ist ein Grund für zwei auch einer für sieben`);
    assert.ok(g.warum.length >= 80, `„${g.anfang}": Grund zu dünn`);
  }
  assert.ok(REDEN_UEBER_DEN_BESTAND.includes('src/zwillingssaetze.js'),
    'das Register zitiert seine eigenen Einträge und meldet sich sonst selbst');
  assert.ok(WIEDERHOLUNGEN_HOECHSTENS >= 0 && WIEDERHOLUNGEN_HOECHSTENS <= 200,
    `eine Schranke von ${WIEDERHOLUNGEN_HOECHSTENS} misst nicht diesen Bestand`);
});

/*
 * **Die Bauart, gemessen am 14. September 2026.** Von 40 wiederholten Sätzen
 * gehören sieben derselben Form an: Ein Modul und sein Prüfer tragen dieselbe
 * Leitfrage in der ersten Zeile ihres Dateikopfs.
 *
 * > **Zwei Hälften einer Sache dürfen denselben Namen tragen.**
 */
test('Ein Modul und sein Prüfer dürfen dieselbe Leitfrage im Kopf tragen', async () => {
  const { istLeitfrage, satzbefund } = await import('../src/zwillingssaetze.js');
  const frage = 'Steht jede Entscheidung noch im Bestand oder nur im Dokument?';
  const quellen = new Map([
    ['src/a.js', `/**\n * ${frage}\n */\nexport const X = 1;`],
    ['bin/a.mjs', `#!/usr/bin/env node\n/**\n * ${frage}\n */\n`],
  ]);
  assert.equal(istLeitfrage(frage, ['src/a.js', 'bin/a.mjs'], quellen), true);
  assert.equal(satzbefund(quellen, [], null).mehrfach.length, 0, 'die Leitfrage wurde gemeldet');
  assert.equal(satzbefund(quellen, [], null).leitfragen.length, 1);
});

test('Ein Absatz mitten in der Datei ist keine Leitfrage', async () => {
  const { istLeitfrage } = await import('../src/zwillingssaetze.js');
  const satz = 'Ein Absatz, der irgendwo in der Mitte zweimal steht und kopiert ist.';
  const tief = `${'\n'.repeat(40)}// ${satz}`;
  const quellen = new Map([['src/a.js', tief], ['bin/a.mjs', tief]]);
  assert.equal(istLeitfrage(satz, ['src/a.js', 'bin/a.mjs'], quellen), false,
    'ein kopierter Absatz gilt als Leitfrage');

  // Und die engen Bedingungen: drei Dateien, oder beide aus demselben Ordner.
  const kopf = `/**\n * ${satz}\n */`;
  const drei = new Map([['src/a.js', kopf], ['bin/a.mjs', kopf], ['bin/b.mjs', kopf]]);
  assert.equal(istLeitfrage(satz, [...drei.keys()], drei), false, 'drei Dateien');
  const zweiSrc = new Map([['src/a.js', kopf], ['src/b.js', kopf]]);
  assert.equal(istLeitfrage(satz, [...zweiSrc.keys()], zweiSrc), false, 'beide aus src/');
});

/*
 * ## Ein Apostroph in einem Kommentar
 *
 * **14. September 2026, nachts.** Das alte Zeichenkettenmuster erlaubte den
 * Zeilenumbruch — `(?!\1)[\s\S]`. Ein Apostroph in einem Kommentar paarte sich
 * deshalb mit dem nächsten Apostroph im Code, und ab dort las der Leser Code
 * als Text und Text als Zwischenraum, bis zum Dateiende.
 */
test('Ein Apostroph im Kommentar kippt den Leser nicht mehr', () => {
  const quelle = [
    "/* Ein Satz mit Apostroph: der's trägt und acht Wörter hat. */",
    "const a = 'Ein Satz in einer Zeichenkette mit mindestens acht Wörtern.';",
    "const b = 'Ein zweiter Satz in einer Zeichenkette mit acht Wörtern.';",
  ].join('\n');
  const saetze = [...saetzeDerQuelle(quelle)];
  assert.ok(saetze.length >= 2, `nur ${saetze.length} Sätze: ${JSON.stringify(saetze)}`);
  for (const s of saetze) {
    assert.ok(!s.includes('const '), `eine Codezeile ist als Text gelesen worden: ${s}`);
    assert.ok(!s.includes('*/'), `ein Kommentarende steht mitten im Satz: ${s}`);
  }
  assert.ok(saetze.some((s) => s.startsWith('Ein Satz in einer Zeichenkette')),
    `die erste Zeichenkette fehlt: ${JSON.stringify(saetze)}`);
  assert.ok(saetze.some((s) => s.startsWith('Ein zweiter Satz')),
    `die zweite Zeichenkette fehlt: ${JSON.stringify(saetze)}`);
});

/*
 * Und die Gegenrichtung: Ein Schrägstrichliteral **darf** über Zeilen gehen,
 * eine einfach begrenzte Zeichenkette nicht. Wer beides gleich behandelt,
 * verliert entweder die mehrzeiligen Texte oder kippt wieder.
 */
test('Ein Schrägstrichliteral darf über Zeilen gehen', () => {
  const quelle = 'const a = `Ein mehrzeiliger Satz in einem Literal,\nder über zwei Zeilen geht.`;';
  const saetze = [...saetzeDerQuelle(quelle)];
  assert.equal(saetze.length, 1, JSON.stringify(saetze));
  assert.ok(saetze[0].includes('über zwei Zeilen geht'), saetze[0]);
});
