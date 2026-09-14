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
