/**
 * Wie ein Werkzeug abbricht — ein Satzbau, ein Ende.
 *
 * Fünf Funktionen namens `abbruch` standen in drei Verträgen. Zwei der drei
 * Unterschiede waren Zufall, einer war echt: die Endziffer. Diese Tests halten
 * den echten fest und die beiden anderen zusammen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { abbruchmelder, ABBRUCH_PRUEFER, ABBRUCH_WERKZEUG } from '../src/werkzeugabbruch.js';

const probe = (code) => {
  const zeilen = [];
  let beendet = null;
  const melde = abbruchmelder(code, {
    schreibe: (z) => zeilen.push(z),
    beende: (c) => { beendet = c; },
  });
  return { zeilen, melde, ende: () => beendet };
};

test('Der Vorspann kommt vom Melder, nicht vom Aufrufer', () => {
  const p = probe(ABBRUCH_PRUEFER);
  p.melde('Kein Apache vorhanden.');
  assert.equal(p.zeilen.length, 1, JSON.stringify(p.zeilen));
  assert.equal(p.zeilen[0], '\nAbbruch: Kein Apache vorhanden.');
  assert.equal(p.ende(), 2);
});

test('Nachsätze folgen, leere nicht', () => {
  const p = probe(ABBRUCH_WERKZEUG);
  p.melde('Kein Journal.', 'Ein Vermerk ohne Akte ist ein Zettel.', '', null);
  assert.equal(p.zeilen.length, 2, JSON.stringify(p.zeilen));
  assert.equal(p.zeilen[1], 'Ein Vermerk ohne Akte ist ein Zettel.');
  assert.equal(p.ende(), 1);
});

/*
 * `src/prueferurteil.js` liest die Endziffer: 0 = ohne Treffer, 1 = mit
 * Treffern. Ein Prüfer, der mit 1 abbricht, meldet einen Befund, den er nie
 * erhoben hat.
 */
test('Prüfer und Werkzeug brechen mit verschiedenen Ziffern ab', () => {
  assert.equal(ABBRUCH_PRUEFER, 2, 'ein Prüfer bräche mit einer Ziffer ab, die sein Urteil trägt');
  assert.equal(ABBRUCH_WERKZEUG, 1);
  assert.notEqual(ABBRUCH_PRUEFER, ABBRUCH_WERKZEUG);
});

test('Eine Endziffer, die nichts meldet, wird zurückgewiesen', () => {
  const schlecht = [0, -1, 1.5, null, undefined, 'zwei'];
  assert.ok(schlecht.length >= 4, 'die Schleife prüft zu wenig');
  for (const code of schlecht) {
    assert.throws(() => abbruchmelder(code), /Endziffer/, `${code} ging durch`);
  }
});

test('Jedes Werkzeug nennt seine Endziffer beim Namen', async () => {
  const { readFileSync } = await import('node:fs');
  const dateien = [
    'bin/bestellprobe.mjs', 'bin/paketpruefung.mjs', 'bin/kopfzeilenpruefung.mjs',
    'bin/vermerk.mjs', 'bin/vorgang.mjs',
  ];
  assert.equal(dateien.length, 5, 'die fünf Stellen von damals sind nicht mehr fünf');
  for (const datei of dateien) {
    const text = readFileSync(new URL(`../${datei}`, import.meta.url), 'utf8');
    assert.match(text, /abbruchmelder\((ABBRUCH_PRUEFER|ABBRUCH_WERKZEUG)\)/,
      `${datei} baut seinen Abbruch wieder selbst`);
    assert.ok(!/process\.exit\(1\);\s*\n\};/.test(text), `${datei} trägt noch eine eigene Endziffer`);
  }
});
