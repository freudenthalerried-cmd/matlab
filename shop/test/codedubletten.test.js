/**
 * Derselbe Rumpf an zwei Stellen.
 *
 * **Der Anlass, 14. September 2026.** Drei Runden lang hat ein Register für
 * Sätze doppelten Code gefunden — jedes Mal, weil wer eine Funktion kopiert,
 * den Absatz darüber mitkopiert. Diese Suche fragt direkt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KEINE_METHODE, MINDESTLAENGE, DUBLETTE_GEPRUEFT, DUBLETTEN_HOECHSTENS,
  rumpfVon, rumpfstellen, codedublettenbefund,
} from '../src/codedubletten.js';

test('Gelesen werden Funktionen, Pfeilfunktionen und Methoden', () => {
  const quelle = [
    'export function eins(a) { return a + 1; }',
    'const zwei = (a) => { return a + 2; };',
    'const o = {\n  drei(a) { return a + 3; },\n};',
  ].join('\n');
  const stellen = rumpfstellen('src/x.js', quelle);
  assert.deepEqual(stellen.map((s) => `${s.art}:${s.name}`),
    ['funktion:eins', 'pfeil:zwei', 'methode:drei'], JSON.stringify(stellen));
  assert.equal(stellen.length, 3, 'ohne Fundstellen prüft die Allaussage darunter nichts');
  assert.ok(stellen.every((s) => !s.code.includes('\n')), 'der Rumpf trägt noch Umbrüche');
});

/*
 * **Der Fehler des ersten Entwurfs.** `if (…) {` und `for (…) {` sehen aus wie
 * Methoden. Gelesen meldete die Messung siebzehn Fundstellen des
 * Frischeabbruchs — der in siebzehn Werkzeugen gleich aussieht, weil er
 * dasselbe tut.
 *
 * > **Ein Aufruf, der überall gleich aussieht, ist kein kopierter Code,
 * > sondern eine benutzte Funktion.**
 */
test('Kontrollstrukturen sind keine Methoden', () => {
  assert.ok(KEINE_METHODE.includes('if') && KEINE_METHODE.includes('for'),
    'if und for zählen wieder als Methoden');
  assert.ok(KEINE_METHODE.length >= 5, `nur ${KEINE_METHODE.length} Wörter — die Schleife prüft wenig`);
  for (const wort of KEINE_METHODE) {
    const quelle = `function x() {\n  ${wort} (a) {\n    return 1;\n  }\n}`;
    const namen = rumpfstellen('src/x.js', quelle).map((s) => s.name);
    assert.ok(!namen.includes(wort), `${wort} wurde als Methode gelesen`);
  }
});

test('Kommentare zählen nicht zum Rumpf', () => {
  const mit = rumpfVon('function x() { /* ein Kommentar */ return 1; }', 0);
  assert.equal(mit, 'return 1;');
  const zeile = rumpfVon('function x() {\n  // ein Kommentar\n  return 1;\n}', 0);
  assert.equal(zeile, 'return 1;');
  assert.equal(rumpfVon('function x(', 0), null, 'ein Rumpf ohne Klammer gilt als Rumpf');
});

test('Zwei gleiche Rümpfe fallen auf, ein kurzer nicht', () => {
  const lang = 'return a + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14;';
  assert.ok(lang.length >= MINDESTLAENGE, 'die Probe ist kürzer als die Grenze');
  const quellen = new Map([
    ['src/a.js', `function eins(a) { ${lang} }`],
    ['src/b.js', `function zwei(a) { ${lang} }`],
  ]);
  assert.equal(codedublettenbefund(quellen, [], null).offen.length, 1);

  const kurz = new Map([
    ['src/a.js', 'function eins(a) { return a + 1; }'],
    ['src/b.js', 'function zwei(a) { return a + 1; }'],
  ]);
  assert.equal(codedublettenbefund(kurz, [], null).offen.length, 0,
    'ein Rumpf unter der Grenze zählt als Dublette');
});

test('Die Gegenrichtung: ein Grund ohne Dublette und ein dünner Grund', () => {
  const grund = {
    name: 'weg',
    hoechstens: 2,
    warum: 'Ein Grund, der lang genug ist, um als Grund zu gelten, und der deshalb diesen Satz '
      + 'bis über die achtzig Zeichen hinaus fortsetzt.',
  };
  const leer = new Map([['src/a.js', 'function eins(a) { return a; }']]);
  assert.equal(codedublettenbefund(leer, [grund], null).meldungen[0].regel, 'grund-ohne-dublette');

  const lang = 'return a + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14;';
  const drei = new Map(['a', 'b', 'c'].map((n) => [`src/${n}.js`, `function weg(a) { ${lang} }`]));
  assert.equal(codedublettenbefund(drei, [grund], null).meldungen[0].regel, 'mehr-stellen-als-begruendet');

  const duenn = codedublettenbefund(leer, [{ name: 'eins', hoechstens: 2, warum: 'kurz' }], null);
  assert.ok(duenn.meldungen.some((m) => m.regel === 'grund-zu-duenn'));
});

test('Die Sperrklinke meldet in beide Richtungen', () => {
  const lang = 'return a + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14;';
  const quellen = new Map([
    ['src/a.js', `function eins(a) { ${lang} }`],
    ['src/b.js', `function zwei(a) { ${lang} }`],
  ]);
  assert.ok(codedublettenbefund(quellen, [], 0).meldungen.some((m) => m.regel === 'mehr-dubletten-als-erlaubt'));
  assert.ok(codedublettenbefund(quellen, [], 5).meldungen.some((m) => m.regel === 'sperrklinke-nachziehen'));
});

test('Jede begründete Dublette nennt Name, Zahl und einen tragfähigen Grund', () => {
  assert.ok(DUBLETTE_GEPRUEFT.length >= 2,
    `nur ${DUBLETTE_GEPRUEFT.length} Einträge — ohne Bestand prüft die Schleife nichts`);
  for (const g of DUBLETTE_GEPRUEFT) {
    assert.match(g.name, /^[A-Za-z_$][\w$]*$/, `${g.name} ist kein Bezeichner`);
    assert.ok(Number.isInteger(g.hoechstens) && g.hoechstens >= 2, `${g.name}: ohne Zahl`);
    assert.ok(g.warum.length >= 80, `${g.name}: Grund zu dünn`);
  }
  assert.equal(DUBLETTEN_HOECHSTENS, 0,
    'die Schranke steht über null — dann liegt ein Vorrat da, den niemand ansieht');
});
