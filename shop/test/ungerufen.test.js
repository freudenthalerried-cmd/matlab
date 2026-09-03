/**
 * Das Register der ungerufenen Ausfuhren.
 *
 * **Der Anlass, 3. September 2026.** An einem Tag zweimal dasselbe:
 * `erzeugeAngebot` (seit 31.08., mit Bindefrist und § 11-Pflichtangaben) und
 * `pruefeAnfrageAufGeheimnis` (die zweite Reihe gegen Einkaufszahlen im
 * Kundentext) waren gebaut, geprüft — und außerhalb der Tests von niemandem
 * gerufen. Beide Male hat es ein Mensch beim Hinsehen gefunden.
 *
 * > **Geprüft ist nicht dasselbe wie angeschlossen**, und der Unterschied
 * > fällt niemandem auf, weil beide Male grün danebensteht.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ohneKommentare } from '../src/entkommentieren.js';
import {
  UNGERUFEN, GRUND_MINDESTLAENGE, ungerufeneAusfuehrungen, pruefeUngerufen,
} from '../src/ungerufen.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));

const grund = 'x'.repeat(GRUND_MINDESTLAENGE);
const eintrag = (modul, funktionen) => Object.freeze({ modul, funktionen, warum: grund });

test('eine Ausfuhr, die niemand ruft, wird gefunden', () => {
  const gefunden = ungerufeneAusfuehrungen([
    { name: 'src/a.js', text: 'export function alleine() { return 1; }\nexport function gerufen() {}' },
    { name: 'bin/b.mjs', text: 'gerufen();' },
  ]);
  assert.deepEqual(gefunden, [{ modul: 'src/a.js', funktion: 'alleine' }]);
});

/**
 * Die Eigenschaft, an der diese Messung hängt: Ein Kommentar ist kein Aufruf.
 * Ohne sie hätte der Satz „gerufen hat `erzeugeAngebot` niemand" die Funktion
 * als gerufen gemeldet — ein Register, das sich an seiner eigenen Begründung
 * sattsieht. Der Prüfer liest deshalb `ohneKommentare()`.
 */
test('ein Name im Kommentar ist kein Aufruf', () => {
  const roh = '/** Gerufen hat sonderweg() niemand. */\nexport function sonderweg() {}';
  const mitKommentar = ungerufeneAusfuehrungen([{ name: 'src/a.js', text: roh }]);
  assert.deepEqual(mitKommentar, [], 'ohne Entkommentieren zählt der Kommentar als Aufruf');

  const ohne = ungerufeneAusfuehrungen([{ name: 'src/a.js', text: ohneKommentare(roh).text }]);
  assert.deepEqual(ohne, [{ modul: 'src/a.js', funktion: 'sonderweg' }]);
});

test('Import- und Exportlisten sind keine Aufrufe', () => {
  const gefunden = ungerufeneAusfuehrungen([
    { name: 'src/a.js', text: 'export function still() {}' },
    { name: 'bin/b.mjs', text: "import {\n  still,\n} from '../src/a.js';" },
  ]);
  assert.deepEqual(gefunden, [{ modul: 'src/a.js', funktion: 'still' }]);
});

test('nur src/ wird gemessen, nicht die Werkzeuge selbst', () => {
  const gefunden = ungerufeneAusfuehrungen([
    { name: 'bin/b.mjs', text: 'export function nurImWerkzeug() {}' },
  ]);
  assert.deepEqual(gefunden, []);
});

test('eine ungerufene Ausfuhr ohne Registereintrag fällt auf', () => {
  const e = pruefeUngerufen([{ modul: 'src/a.js', funktion: 'neu' }], []);
  assert.equal(e.sauber, false);
  assert.deepEqual(e.meldungen.map((m) => m.regel), ['ohne-grund']);
  assert.match(e.meldungen[0].text, /src\/a\.js#neu/);
});

/**
 * Die Richtung, die man vergisst: Der Eintrag bleibt stehen, die Funktion ist
 * längst angeschlossen — und das Register führt eine Entschuldigung für einen
 * Zustand, den es nicht mehr gibt. Beim ersten Lauf dieses Prüfers ist genau
 * das eingetreten (`kostenbild.js#gebuehrenanteil`).
 */
test('ein Grund für einen Zustand, den es nicht mehr gibt, fällt auf', () => {
  const e = pruefeUngerufen([], [eintrag('src/a.js', ['inzwischenGerufen'])]);
  assert.equal(e.sauber, false);
  assert.deepEqual(e.meldungen.map((m) => m.regel), ['grund-ohne-fall']);
});

test('ein zu kurzer Grund ist keiner', () => {
  const e = pruefeUngerufen(
    [{ modul: 'src/a.js', funktion: 'x' }],
    [Object.freeze({ modul: 'src/a.js', funktionen: ['x'], warum: 'weil halt' })],
  );
  assert.deepEqual(e.meldungen.map((m) => m.regel), ['grund-zu-kurz']);
});

test('dieselbe Funktion zweimal geführt fällt auf', () => {
  const e = pruefeUngerufen(
    [{ modul: 'src/a.js', funktion: 'x' }],
    [eintrag('src/a.js', ['x']), eintrag('src/a.js', ['x'])],
  );
  assert.ok(e.meldungen.some((m) => m.regel === 'doppelt-gefuehrt'), JSON.stringify(e.meldungen));
});

test('der Bestand steht: jede ungerufene Ausfuhr nennt ihren Grund', () => {
  const dateien = [
    ...readdirSync(join(SHOP, 'src')).filter((f) => f.endsWith('.js'))
      .map((f) => ({ name: `src/${f}`, datei: join(SHOP, 'src', f) })),
    ...readdirSync(join(SHOP, 'bin')).filter((f) => f.endsWith('.mjs'))
      .map((f) => ({ name: `bin/${f}`, datei: join(SHOP, 'bin', f) })),
    { name: 'shop-ui.js', datei: join(SHOP, 'shop-ui.js') },
  ].map(({ name, datei }) => ({ name, text: ohneKommentare(readFileSync(datei, 'utf8')).text }));

  const e = pruefeUngerufen(ungerufeneAusfuehrungen(dateien), UNGERUFEN);
  assert.deepEqual(e.meldungen, [], e.meldungen.map((m) => m.text).join('\n'));
  // Ein Register, das leer läuft, hätte nichts mehr zu sagen — dann wäre nicht
  // alles angeschlossen, sondern die Messung tot.
  assert.ok(e.gefunden >= 5, `nur ${e.gefunden} gefunden — misst dieser Prüfer noch?`);
});

test('jeder Registereintrag nennt ein Modul, das es gibt, und einen echten Grund', () => {
  assert.ok(UNGERUFEN.length >= 10, 'das Register ist zu kurz');
  const vorhanden = new Set(readdirSync(join(SHOP, 'src')).map((f) => `src/${f}`));
  for (const u of UNGERUFEN) {
    assert.ok(vorhanden.has(u.modul), `${u.modul} gibt es nicht mehr`);
    assert.ok(u.funktionen.length > 0, `${u.modul}: Eintrag ohne Funktion`);
    assert.ok(u.warum.length >= GRUND_MINDESTLAENGE, `${u.modul}: Grund zu kurz`);
  }
});
