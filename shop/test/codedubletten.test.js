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
  GESTALT_GEPRUEFT, GESTALTEN_HOECHSTENS, FESTE_WOERTER,
  rumpfVon, rumpfstellen, codedublettenbefund, gerippeVon,
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

/*
 * ## Der zweite Vergleich: die Gestalt
 *
 * **Der offene Punkt vom 14. September, mittags.** „Zwei Funktionen, die
 * dasselbe tun und sich in einem Variablennamen unterscheiden, sind für sie
 * verschieden." Diese Tests halten den zweiten Durchgang.
 */

test('Gleiche Gestalt trotz anderer Bezeichner', () => {
  const eins = gerippeVon('const a = ANNAHMEN.find((x) => x.id === id); return a;');
  const zwei = gerippeVon('const z = ZAHLWEGE.find((w) => w.id === id); return z;');
  assert.equal(eins, zwei, `${eins}\n${zwei}`);
  assert.ok(eins.includes('#1'), 'es wurde gar nichts nummeriert');
});

test('Eigenschaften hinter dem Punkt bleiben stehen', () => {
  const eins = gerippeVon('return a.sku + b.gruppe;');
  const zwei = gerippeVon('return x.gruppe + y.sku;');
  assert.notEqual(eins, zwei, 'zwei verschiedene Felder gelten als dieselbe Gestalt');
  assert.ok(eins.includes('.sku'), `der Feldname fehlt: ${eins}`);
});

/*
 * Im Zeichenkettenteil steht Text, in `${…}` steht **Code**. Ohne diese
 * Unterscheidung wären die beiden Abbruchmelder verschieden gewesen — und
 * genau sie zu finden war der Anlass.
 */
test('Im Inneren von ${} wird nummeriert, im Text daneben nicht', () => {
  const eins = gerippeVon('console.error(`Abbruch: ${satz}`);');
  const zwei = gerippeVon('console.error(`Abbruch: ${text}`);');
  assert.equal(eins, zwei, `${eins}\n${zwei}`);
  assert.ok(eins.includes('Abbruch: '), `der Text wurde mitnummeriert: ${eins}`);
  const drei = gerippeVon("console.error('Abbruch: eins');");
  const vier = gerippeVon("console.error('Abbruch: zwei');");
  assert.notEqual(drei, vier, 'zwei verschiedene Meldungen gelten als dieselbe Gestalt');
});

test('Feste Wörter werden nicht nummeriert', () => {
  assert.ok(FESTE_WOERTER.length >= 20, `nur ${FESTE_WOERTER.length} feste Wörter`);
  for (const wort of ['const', 'return', 'console', 'process', 'Error', 'Number']) {
    assert.ok(FESTE_WOERTER.includes(wort), `${wort} fehlt unter den festen Wörtern`);
    assert.ok(gerippeVon(`${wort};`).startsWith(wort), `${wort} wurde nummeriert`);
  }
});

test('Zeichengleiches meldet der zweite Durchgang nicht noch einmal', () => {
  const rumpf = 'return eins + zwei + drei + vier + fuenf + sechs + sieben + acht + neun;';
  assert.ok(rumpf.length >= MINDESTLAENGE, 'die Probe ist kürzer als die Grenze');
  const quellen = new Map([
    ['src/a.js', `export function a() { ${rumpf} }`],
    ['src/b.js', `export function b() { ${rumpf} }`],
  ]);
  const b = codedublettenbefund(quellen, [], null, MINDESTLAENGE, [], null);
  assert.equal(b.offen.length, 1, JSON.stringify(b.offen));
  assert.equal(b.gestalten.length, 0, 'derselbe Fund steht zweimal im Befund');
});

test('Ein Grund gilt bis zu der Länge, für die er geschrieben wurde', () => {
  const kurz = 'return eins + zwei + drei + vier + fuenf + sechs + sieben;';
  const lang = `${kurz.slice(0, -1)} + acht + neun + zehn + elf + zwoelf + dreizehn;`;
  assert.ok(lang.length > kurz.length, 'die lange Probe ist nicht länger');
  const gefuehrt = [{ namen: ['a', 'b'], bisZeichen: kurz.length, warum: 'x'.repeat(90) }];
  const mache = (rumpf) => new Map([
    ['src/a.js', `export function a() { ${rumpf} }`],
    ['src/b.js', `export function b() { ${rumpf.replace(/eins/g, 'Eins')} }`],
  ]);
  const still = codedublettenbefund(mache(kurz), [], null, MINDESTLAENGE, gefuehrt, null);
  assert.deepEqual(still.meldungen, [], JSON.stringify(still.meldungen));
  const laut = codedublettenbefund(mache(lang), [], null, MINDESTLAENGE, gefuehrt, null);
  assert.ok(laut.meldungen.some((m) => m.regel === 'gestalt-groesser-als-begruendet'),
    JSON.stringify(laut.meldungen));
});

test('Jeder Eintrag im Gestaltregister trägt einen Grund', () => {
  assert.ok(GESTALT_GEPRUEFT.length >= 1, 'das Register ist leer — die Schleife prüft nichts');
  for (const g of GESTALT_GEPRUEFT) {
    assert.ok(g.namen.length >= 2, `${g.namen.join(', ')}: eine Gestalt braucht zwei Stellen`);
    assert.ok(g.warum.length >= 80, `${g.namen.join(', ')}: Grund zu dünn`);
    assert.ok(Number.isInteger(g.bisZeichen) && g.bisZeichen > 0, `${g.namen.join(', ')}: keine gemessene Länge`);
  }
  assert.equal(GESTALTEN_HOECHSTENS, 0, 'die Schranke für ungeführte Gestalten ist gelockert');
});

/*
 * Zwei Regeln des Gestaltregisters hatte nach der Runde vom 14. September
 * kein Testfall je feuern sehen — gefunden hat das die Zählung der
 * Regelnamen am selben Abend.
 */
test('Ein Grund für eine Gestalt, die keine mehr ist', () => {
  const quellen = new Map([
    ['src/a.js', 'export function a() { return eins + zwei + drei + vier + fuenf + sechs; }'],
  ]);
  const gefuehrt = [{ namen: ['a', 'b'], bisZeichen: 99, warum: 'x'.repeat(90) }];
  const b = codedublettenbefund(quellen, [], null, MINDESTLAENGE, gefuehrt, null);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-ohne-gestalt'], JSON.stringify(b.meldungen));
});

test('Mehr Gestalten als erlaubt', () => {
  const rumpf = 'return eins + zwei + drei + vier + fuenf + sechs + sieben + acht;';
  assert.ok(rumpf.length >= MINDESTLAENGE, 'die Probe ist kürzer als die Grenze');
  const quellen = new Map([
    ['src/a.js', `export function a() { ${rumpf} }`],
    ['src/b.js', `export function b() { ${rumpf.replace(/eins/g, 'Eins')} }`],
  ]);
  const b = codedublettenbefund(quellen, [], null, MINDESTLAENGE, [], 0);
  assert.equal(b.gestalten.length, 1, JSON.stringify(b.gestalten));
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['mehr-gestalten-als-erlaubt'],
    JSON.stringify(b.meldungen));
});
