/**
 * Pfand ist keine Ausgabe, sondern eine Auslage.
 *
 * **Der Befund, 4. September 2026.** `lieferanten.json` begründete die
 * Nebenkosten mit „6 Paletten (132,00) minus eine Rückgabe (−20,00) plus
 * Folierung (6,50) = 118,50 nicht gerechnete Nebenkosten". Die Zahlen stimmen
 * alle; die Rechnung nicht — sie verbucht den **Pfandbetrag** als Kosten.
 *
 * > **Was kostet, ist die Differenz und die Fahrt, die es zurückbringt.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PALETTENBEWEGUNGEN, RUECKFAHRT, palettenkreis } from '../src/palettenkreis.js';

const lieferanten = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/lieferanten.json', import.meta.url)), 'utf8',
)).lieferanten;
const poschacher = lieferanten.find((l) => l.id === 'poschacher');

test('die Pfandsätze stehen nur an einer Stelle', () => {
  const e = palettenkreis();
  assert.equal(e.jeHinaus, poschacher.nebenkosten.paletteOebbNetto);
  assert.equal(e.jeZurueck, poschacher.nebenkosten.paletteRueckgabeNetto);
});

test('der Kreis geht auf: acht von neun Paletten sind zurück', () => {
  const e = palettenkreis();
  assert.equal(e.anzahlHinaus, 9);
  assert.equal(e.anzahlZurueck, 8);
  assert.equal(e.offen, 1);
  assert.equal(e.betragOffen, 38);
});

test('was hängen bleibt, ist die Differenz und die Fahrt — nicht das Pfand', () => {
  const e = palettenkreis();
  assert.equal(e.differenzJePalette, 2);
  assert.equal(e.fahrtJePalette, 11.47);
  assert.equal(e.jePaletteMitFahrt, 13.47);
  // Zwischen den beiden falschen Zahlen: über der reinen Differenz, weit unter
  // dem Pfandbetrag, den die alte Begründung unterstellte.
  assert.ok(e.jePaletteMitFahrt > e.differenzJePalette);
  assert.ok(e.jePaletteMitFahrt < e.jeHinaus);
});

test('ohne Rückfahrt bleibt nur die Differenz stehen', () => {
  const e = palettenkreis(PALETTENBEWEGUNGEN, null);
  assert.equal(e.fahrtJePalette, 0);
  assert.equal(e.jePaletteMitFahrt, 2);
});

test('ein leerer Befund ist kein grüner', () => {
  assert.throws(() => palettenkreis([]), /kein grüner/);
});

test('die Rückfahrt nennt ihren Beleg und ihre Grenze', () => {
  assert.ok(RUECKFAHRT.warum.length >= 80, 'ohne belastbaren Grund');
  assert.match(RUECKFAHRT.warum, /eine Beobachtung|Eine Beobachtung/);
  assert.equal(RUECKFAHRT.frachtNetto, 80.26);
});

/**
 * Das Register ist von Hand geführt. Ohne diese Probe wäre es die dritte
 * Zahlenquelle und die einzige ungeprüfte.
 */
test('die Bewegungen stimmen mit den Rechnungen überein', () => {
  const quelle = fileURLToPath(new URL('../../preise/poschacher-positionen.csv', import.meta.url));
  assert.equal(typeof existsSync(quelle), 'boolean');
  if (!existsSync(quelle)) return;

  const zeilen = readFileSync(quelle, 'utf8').trim().split('\n');
  const kopf = zeilen[0].split(';');
  const feld = (f, n) => f[kopf.indexOf(n)];
  const ausDatei = zeilen.slice(1).map((z) => z.split(';'))
    .filter((f) => /^Paletten/i.test(feld(f, 'Bezeichnung')))
    .map((f) => ({
      rechnung: feld(f, 'Rechnung'),
      paletten: Number(feld(f, 'Menge')),
      betrag: Number(feld(f, 'Betrag')),
    }));

  assert.ok(ausDatei.length >= 4, `nur ${ausDatei.length} Palettenzeilen — prüft dieser Fall noch etwas?`);
  assert.equal(PALETTENBEWEGUNGEN.length, ausDatei.length);
  for (const b of PALETTENBEWEGUNGEN) {
    const treffer = ausDatei.filter((x) => x.rechnung === b.rechnung
      && x.paletten === b.paletten && x.betrag === b.betrag);
    assert.equal(treffer.length, 1,
      `${b.rechnung}: ${b.paletten} Paletten zu ${b.betrag} € stehen so nicht in der Datei`);
  }

  // Und die Rückfahrt: dieselbe Rechnung, dieselbe Frachtpauschale.
  const fracht = zeilen.slice(1).map((z) => z.split(';'))
    .filter((f) => feld(f, 'Rechnung') === RUECKFAHRT.rechnung && /Frachtpauschale/i.test(feld(f, 'Bezeichnung')));
  assert.equal(fracht.length, 1);
  assert.equal(Number(feld(fracht[0], 'Betrag')), RUECKFAHRT.frachtNetto);
});
