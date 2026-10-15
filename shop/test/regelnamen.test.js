/**
 * Wie viele Regeln gibt es — und wie viele hat je jemand feuern sehen?
 *
 * Diese Reihe prüft das Verzeichnis selbst. Sie sieht jede seiner fünf Regeln
 * einmal anschlagen — ein Prüfer, der andere daran misst, ob man sie feuern
 * sah, ist der letzte, der sich davon ausnehmen darf.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  melderNamen, regelstellen, gebauteRegeln, regelbefund,
  REGEL_GEPRUEFT, GEBAUT_GEPRUEFT, ERFUNDEN_GEPRUEFT, UNGESEHENE_HOECHSTENS,
} from '../src/regelnamen.js';

const regelnVon = (b) => b.meldungen.map((m) => m.regel).sort();
const GRUND = 'x'.repeat(90);

test('Alle drei Schreibweisen werden gelesen', () => {
  const quelle = [
    "meldungen.push({ regel: 'eins-als-feld', text: 'a' });",
    "const melde = (regel, text) => meldungen.push({ regel, text });",
    "melde('zwei-vom-melder', 'b');",
    "meldungen.push({ regel: leicht ? 'drei-so' : 'vier-anders', text: 'c' });",
  ].join('\n');
  const stellen = regelstellen('src/x.js', quelle);
  assert.equal(stellen.length, 4, JSON.stringify(stellen));
  assert.deepEqual(stellen.map((s) => `${s.art}:${s.regel}`).sort(),
    ['feld:eins-als-feld', 'melder:zwei-vom-melder', 'wahl:drei-so', 'wahl:vier-anders'].sort());
});

/*
 * `frachtbetrag(regel, …)` in `src/frachtsatz.js` nimmt eine **Frachtregel**
 * entgegen. Ohne die Rumpfprobe zählte dieses Verzeichnis einen Preisrechner
 * als Meldeweg.
 */
test('Ein Melder wird am Rumpf erkannt, nicht am ersten Parameter', () => {
  assert.deepEqual(melderNamen('const melde = (regel, text) => meldungen.push({ regel, text });'),
    ['melde']);
  assert.deepEqual(melderNamen('export function frachtbetrag(regel, { bestellwertNetto } = {}) {\n'
    + "  if (!regel) throw new Error('Frachtbetrag ohne Frachtsatz');\n  return regel.betrag;\n}"),
    [], 'ein Preisrechner gilt als Meldeweg');
  assert.deepEqual(melderNamen('const sag = (regel, text) => meldungen.push({ regel, datei, text });'),
    ['sag'], 'ein Melder heißt in jeder Datei anders — gefunden wird er am Rumpf');
});

test('Derselbe Name zweimal in einer Datei ist eine Stelle', () => {
  const doppelt = "push({ regel: 'derselbe-name', text: 'a' });\npush({ regel: 'derselbe-name', text: 'b' });";
  assert.equal(regelstellen('src/x.js', doppelt).length, 1);
});

test('Ein Regelname, den kein Testfall nennt, fällt auf', () => {
  const quellen = new Map([['src/x.js', "push({ regel: 'nie-gesehen', text: 'a' });"]]);
  const b = regelbefund(quellen, new Map([['test/x.test.js', 'nichts']]), [], 0, [], []);
  assert.deepEqual(b.ungesehen.map((s) => s.regel), ['nie-gesehen']);
  assert.ok(regelnVon(b).includes('mehr-ungesehene-als-erlaubt'), JSON.stringify(b.meldungen));
  const gesehen = regelbefund(quellen, new Map([['test/x.test.js', "m.regel === 'nie-gesehen'"]]), [], 0, [], []);
  assert.deepEqual(gesehen.ungesehen, [], JSON.stringify(gesehen.ungesehen));
  assert.deepEqual(gesehen.meldungen, [], JSON.stringify(gesehen.meldungen));
});

/*
 * Die gefährlichere Hälfte: Ein Testfall behauptet einen Namen, den es nicht
 * mehr gibt. Er ist grün, weil er nichts mehr prüfen kann — ein fehlender
 * Prüfsatz meldet sich, ein toter nicht.
 */
test('Ein Testfall, der einen Namen behauptet, den es nicht gibt', () => {
  const b = regelbefund(new Map([['src/x.js', "push({ regel: 'gibt-es', text: 'a' });"]]),
    new Map([['test/x.test.js', "m.regel === 'gibt-es'\nm.regel === 'gibt-es-nicht-mehr'"]]), [], 0, [], []);
  assert.deepEqual(regelnVon(b), ['regel-behauptet-ohne-stelle'], JSON.stringify(b.meldungen));
  assert.match(b.meldungen[0].text, /gibt-es-nicht-mehr/);
});

test('Ein Grund für eine Regel, die inzwischen gesehen wird', () => {
  const quellen = new Map([['src/x.js', "push({ regel: 'jetzt-gesehen', text: 'a' });"]]);
  const tests = new Map([['test/x.test.js', "m.regel === 'jetzt-gesehen'"]]);
  const gefuehrt = [{ regel: 'jetzt-gesehen', pfad: 'src/x.js', warum: GRUND }];
  assert.deepEqual(regelnVon(regelbefund(quellen, tests, gefuehrt, 0, [], [])), ['grund-ohne-regel']);
  const duenn = [{ regel: 'jetzt-gesehen', pfad: 'src/x.js', warum: 'zu kurz' }];
  assert.deepEqual(regelnVon(regelbefund(quellen, tests, duenn, 0, [], [])),
    ['grund-ohne-regel', 'grund-zu-duenn']);
});

test('Ein Regelname, der erst zur Laufzeit entsteht', () => {
  const quellen = new Map([['src/x.js', 'push({ regel: `ohne-${name}`, text: `a` });']]);
  const leer = new Map([['test/x.test.js', 'nichts']]);
  assert.deepEqual(gebauteRegeln('src/x.js', 'push({ regel: `ohne-${name}` });'),
    [{ pfad: 'src/x.js', roh: 'ohne-${name}' }]);
  assert.deepEqual(regelnVon(regelbefund(quellen, leer, [], null, [], [])), ['gebaute-regel-ungefuehrt']);
  const gefuehrt = [{ roh: 'ohne-${name}', pfad: 'src/x.js', warum: GRUND }];
  assert.deepEqual(regelbefund(quellen, leer, [], null, gefuehrt, []).meldungen, []);
  const woanders = [{ roh: 'ohne-${name}', pfad: 'src/y.js', warum: GRUND }];
  assert.deepEqual(regelnVon(regelbefund(quellen, leer, [], null, woanders, [])),
    ['gebaute-regel-ungefuehrt', 'grund-ohne-gebaute-regel']);
});

test('Die Sperrklinke fällt und steigt nicht', () => {
  const quellen = new Map([['src/x.js', "push({ regel: 'nie-gesehen', text: 'a' });"]]);
  const leer = new Map([['test/x.test.js', 'nichts']]);
  assert.deepEqual(regelnVon(regelbefund(quellen, leer, [], 3, [], [])), ['sperrklinke-nachziehen']);
  assert.deepEqual(regelbefund(quellen, leer, [], 1, [], []).meldungen, []);
});

test('Die Verzeichnisse dieses Hauses tragen Gründe', () => {
  assert.ok(GEBAUT_GEPRUEFT.length >= 2, `nur ${GEBAUT_GEPRUEFT.length} Einträge`);
  for (const g of [...GEBAUT_GEPRUEFT, ...REGEL_GEPRUEFT]) {
    assert.ok(g.warum.length >= 80, `${g.roh ?? g.regel}: Grund zu dünn`);
    assert.ok(g.pfad.startsWith('src/') || g.pfad.startsWith('bin/'), `${g.pfad} ist kein Quellpfad`);
  }
  assert.ok(Number.isInteger(UNGESEHENE_HOECHSTENS) && UNGESEHENE_HOECHSTENS >= 0);
});

/*
 * Eine Reihe, die einen Befund gegen eigene Attrappen fährt, muss Namen
 * erfinden dürfen — diese hier tut es vier Zeilen weiter oben. Geführt wird
 * deshalb die Datei **und die Liste**, und beide Richtungen werden gehalten.
 */
test('Ein erfundener Name mit Grund und einer, den es gar nicht mehr gibt', () => {
  const quellen = new Map([['src/x.js', "push({ regel: 'echte-regel', text: 'a' });"]]);
  const behauptend = new Map([['test/x.test.js', "m.regel === 'echte-regel'\nm.regel === 'attrappe'"]]);
  const gefuehrt = [{ datei: 'test/x.test.js', regeln: ['attrappe'], warum: 'x'.repeat(90) }];
  assert.deepEqual(regelbefund(quellen, behauptend, [], null, [], gefuehrt).meldungen, []);

  const stumm = new Map([['test/x.test.js', "m.regel === 'echte-regel'"]]);
  const b = regelbefund(quellen, stumm, [], null, [], gefuehrt);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['erfundener-name-ohne-fall'],
    JSON.stringify(b.meldungen));
  assert.match(b.meldungen[0].text, /wird dort nicht mehr behauptet/);

  const echt = [{ datei: 'test/x.test.js', regeln: ['echte-regel'], warum: 'x'.repeat(90) }];
  const c = regelbefund(quellen, stumm, [], null, [], echt);
  assert.ok(c.meldungen.some((m) => m.regel === 'erfundener-name-ohne-fall'), JSON.stringify(c.meldungen));
  assert.match(c.meldungen[0].text, /ist ein Regelname geworden/);
});

test('Die erfundenen Namen dieses Hauses stehen mit Datei und Grund', () => {
  assert.ok(ERFUNDEN_GEPRUEFT.length >= 1, 'das Verzeichnis ist leer — die Schleife prüft nichts');
  for (const e of ERFUNDEN_GEPRUEFT) {
    assert.ok(e.datei.startsWith('test/'), `${e.datei} ist keine Testdatei`);
    assert.ok(e.regeln.length >= 1, `${e.datei} führt keine Namen`);
    assert.ok(e.warum.length >= 80, `${e.datei}: Grund zu dünn`);
  }
});
