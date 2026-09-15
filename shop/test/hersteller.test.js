/**
 * Die eine Markenliste — und die zwei Regeln, die sie die eine bleiben lassen.
 *
 * **Der Anlass, 15. September 2026.** `markenlistenbefund` steht seit dem
 * 8. September im Bestand und hat seither jeden Lauf grün beendet: Es gibt
 * genau eine Liste, und die eine Ausnahme zeigt auf eine Datei, die es gibt.
 * Damit waren `zweite-markenliste` und `ausnahme-ohne-datei` beides Regeln,
 * die nie gefeuert haben — niemand hätte gemerkt, wenn sie falsch gebaut
 * wären. Die Funktion nimmt Dateien, Namen, den Kommentarfilter **und** die
 * Ausnahmen als Beiwert; gemessen wird deshalb an erfundenem Quelltext und
 * nicht am Bestand, dessen grüner Fall schon anderswo geprüft ist.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HERSTELLER, NICHT_DURCHSUCHT, marke, markenlistenbefund, ohneKommentarzeilen,
} from '../src/hersteller.js';

const NAMEN = ['Capatect', 'Baumit', 'Austrotherm'];
const regeln = (dateien, ausnahmen) => markenlistenbefund(
  dateien, NAMEN, ohneKommentarzeilen, ausnahmen,
).meldungen.map((m) => m.regel);

test('eine Datei mit zwei Marken nebeneinander ist eine zweite Liste', () => {
  const eine = [{ datei: 'src/gebinde.js', quelle: "const g = { 'Capatect': 25 };" }];
  assert.deepEqual(regeln(eine, []), [],
    'eine einzelne Marke ist ein Sonderfall, keine Liste');

  const zwei = [{ datei: 'bin/anzeigen.mjs', quelle: "const M = ['Capatect', 'Baumit'];" }];
  assert.deepEqual(regeln(zwei, []), ['zweite-markenliste'],
    'zwei Marken nebeneinander sind eine Liste, und die zweite pflegt niemand');
});

test('ein Fließtext über Marken ist keine Liste — die Kommentarzeilen zählen nicht mit', () => {
  const nurProsa = [{
    datei: 'src/systemtreue.js',
    quelle: '// Capatect und Baumit sind zwei Systeme, die man nicht mischt.\nconst x = 1;\n',
  }];
  assert.deepEqual(regeln(nurProsa, []), [],
    'sonst meldete jedes Modul, das über die Liste schreibt, eine zweite');
});

test('eine Ausnahme nimmt ihre Datei aus der Suche — und nur die', () => {
  const dateien = [
    { datei: 'src/gegenprobenregister.js', quelle: "['Capatect', 'Baumit']" },
    { datei: 'bin/anzeigen.mjs', quelle: "['Capatect', 'Baumit']" },
  ];
  const ausnahme = [{ datei: 'src/gegenprobenregister.js', warum: 'x'.repeat(120) }];
  assert.deepEqual(regeln(dateien, ausnahme), ['zweite-markenliste'],
    'die befreite Datei schweigt, die daneben nicht');
});

test('eine Ausnahme ohne Datei ist ein Befund — die andere Richtung', () => {
  const dateien = [{ datei: 'src/gebinde.js', quelle: 'const x = 1;' }];
  const tot = [{ datei: 'src/laengst-geloescht.js', warum: 'x'.repeat(120) }];
  assert.deepEqual(regeln(dateien, tot), ['ausnahme-ohne-datei'],
    'eine Befreiung, die auf nichts mehr zeigt, befreit beim nächsten Namen das Falsche');
});

test('die Ausnahme dieses Hauses nennt eine Datei und einen Grund, der trägt', () => {
  assert.ok(NICHT_DURCHSUCHT.length >= 1, 'eine leere Liste prüft nichts');
  for (const a of NICHT_DURCHSUCHT) {
    assert.ok(a.datei, 'eine Ausnahme ohne Datei befreit alles oder nichts');
    assert.ok(a.warum.length >= 80, `${a.datei}: der Grund ist zu knapp, um in einem Jahr zu tragen`);
  }
});

test('marke liest den Hersteller aus der Bezeichnung', () => {
  assert.ok(Object.keys(HERSTELLER).length >= 5,
    `nur ${Object.keys(HERSTELLER).length} Marken — die Messung sagt dann wenig`);
  const [erste] = Object.keys(HERSTELLER);
  assert.equal(marke(`${erste} Klebespachtel 25 kg`), erste);
  assert.equal(marke('Sack Zement 25 kg'), null, 'ohne Marke gibt es keine zu nennen');
});
