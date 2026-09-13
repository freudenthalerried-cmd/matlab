import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { FELD, MINDESTGRUND, VORBEHALTE, vorbehaltsbefund } from '../src/vorbehalt.js';
import { ohneKommentare } from '../src/entkommentieren.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const quelle = (datei, text) => ({ datei, text });
const mitFeld = (was = 'irgendetwas') => `export const X = { stand: '2026-01-01',\n  vorbehalt:\n    '${was}',\n};\n`;

const register = [
  { id: 'a', quelle: 'src/a.js', kern: 'unbestätigt', stehtIn: ['seite.html'] },
];

test('steht der Kern in der genannten Ausgabe, meldet der Befund nichts', () => {
  const b = vorbehaltsbefund({
    quellen: [quelle('src/a.js', mitFeld())],
    ausgabe: { 'seite.html': 'Das ist unbestätigt.' },
    register,
  });
  assert.equal(b.sauber, true);
});

test('fehlt der Kern in der Ausgabe, ist das der Fund — der Fall vom 5. September', () => {
  const b = vorbehaltsbefund({
    quellen: [quelle('src/a.js', mitFeld())],
    ausgabe: { 'seite.html': 'Wir liefern in fünf Bezirke.' },
    register,
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nicht-in-der-ausgabe']);
});

test('eine Ausgabedatei, die es nicht gibt, ist kein stilles Bestehen', () => {
  const b = vorbehaltsbefund({
    quellen: [quelle('src/a.js', mitFeld())],
    ausgabe: {},
    register,
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['ausgabe-fehlt']);
});

test('ein Vorbehalt ohne Ausgabe braucht einen tragfähigen Grund', () => {
  const knapp = [{ id: 'b', quelle: 'src/b.js', kern: 'x', stehtIn: [], warumOhneAusgabe: 'zu kurz' }];
  const b = vorbehaltsbefund({ quellen: [quelle('src/b.js', mitFeld())], ausgabe: {}, register: knapp });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['ohne-leser-und-ohne-grund']);

  const lang = [{ ...knapp[0], warumOhneAusgabe: 'x'.repeat(MINDESTGRUND) }];
  assert.equal(vorbehaltsbefund({ quellen: [quelle('src/b.js', mitFeld())], ausgabe: {}, register: lang }).sauber, true);
});

/**
 * **Die Gegenrichtung.** Ein Register, das nur seine eigenen Einträge prüft,
 * ist eine Liste und keine Messung.
 */
test('ein Vorbehalt im Bestand, der in keinem Eintrag steht, wird gemeldet', () => {
  const b = vorbehaltsbefund({
    quellen: [quelle('src/a.js', mitFeld()), quelle('src/neu.js', mitFeld('etwas Neues'))],
    ausgabe: { 'seite.html': 'unbestätigt' },
    register,
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['vorbehalt-ohne-eintrag']);
});

test('ein Eintrag, dessen Feld verschwunden ist, wird gemeldet', () => {
  const b = vorbehaltsbefund({
    quellen: [quelle('src/a.js', 'export const X = { stand: 1 };')],
    ausgabe: { 'seite.html': 'unbestätigt' },
    register,
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['feld-verschwunden']);
});

test('ein Eintrag ohne Quelldatei wird gemeldet', () => {
  const b = vorbehaltsbefund({ quellen: [], ausgabe: {}, register });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['quelle-gibt-es-nicht']);
});

/**
 * **Der erste Lauf fand die Prüfdatei selbst** — die Fundstelle war die
 * Meldung, die den Fund beschreibt. Gesucht wird deshalb nach einem Feld am
 * Zeilenanfang und nicht nach einem Wort irgendwo im Text.
 */
test('ein Wort mitten im Satz ist kein Feld', () => {
  assert.equal(FELD.test('text: `trägt ein Feld „vorbehalt:" und steht nirgends`'), false);
  assert.equal(FELD.test('  vorbehalt:\n    \'etwas\','), true);
  assert.equal(FELD.test('const eigentumsvorbehalt: 1'), false);
});

test('das echte Register steht gegen den echten Bestand', () => {
  const quellen = readdirSync(join(SHOP, 'src'))
    .filter((d) => d.endsWith('.js'))
    .map((d) => quelle(`src/${d}`, ohneKommentare(readFileSync(join(SHOP, 'src', d), 'utf8')).text));
  assert.ok(quellen.length >= 40, `nur ${quellen.length} Quelldateien gefunden`);
  assert.ok(VORBEHALTE.length >= 2, 'ein leeres Register bestünde stumm');
  const mitVorbehalt = quellen.filter((q) => FELD.test(q.text)).map((q) => q.datei);
  assert.deepEqual(mitVorbehalt.sort(), VORBEHALTE.map((e) => e.quelle).sort());
});
