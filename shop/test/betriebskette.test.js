/**
 * Wie weit reicht der Betrieb?
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg vom Klick bis zum Angebot
 * ist gebaut und in einem Befehl belegt. Danach hört er auf — und nirgends
 * stand, wo genau.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHRITTE, kettenbefund } from '../src/betriebskette.js';

test('jeder Schritt nennt ein Gate, und jede Lücke ihren Grund', () => {
  assert.ok(SCHRITTE.length >= 8, `nur ${SCHRITTE.length} Schritte — die Kette ist zu kurz gefasst`);
  assert.deepEqual(kettenbefund().meldungen, []);
});

test('ein Schritt ohne Werkzeug und ohne Grund ist der Fund', () => {
  const b = kettenbefund([{ id: 'x', was: 'X', werkzeug: null, gate: 'Gate 1' }]);
  assert.equal(b.meldungen[0].regel, 'ohne-werkzeug-ohne-grund');
});

test('ein Schritt mit Werkzeug darf nicht begründen, warum keines da ist', () => {
  // Dieselbe Regel wie im Register der ungerufenen Ausfuhren: Eine Begründung
  // für einen Zustand, den es nicht mehr gibt, ist schlimmer als keine.
  const b = kettenbefund([{
    id: 'x', was: 'X', werkzeug: 'npm run x', gate: 'Gate 1',
    warumOhneWerkzeug: 'Ein Grund, der hier nichts mehr zu suchen hat, weil das Werkzeug da ist.',
  }]);
  assert.equal(b.meldungen[0].regel, 'grund-ohne-fall');
});

test('ein Schritt ohne Gate wird gemeldet', () => {
  const b = kettenbefund([{ id: 'x', was: 'X', werkzeug: 'npm run x' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'ohne-gate'), JSON.stringify(b.meldungen));
});

test('erreicht zählt den Zusammenhang, nicht die Werkzeuge', () => {
  /**
   * **Der eigentliche Ertrag der Liste.** Fünf Schritte haben ein Werkzeug,
   * und die Kette reicht trotzdem nur bis zum vierten: Die Aufbewahrung ist
   * gebaut und liegt jenseits der Lücke.
   *
   * > **Eine Zählung ohne diese Unterscheidung meldete „fünf von neun" und
   * > verspräche mehr, als zusammenhängt.**
   */
  const b = kettenbefund([
    { id: 'a', was: 'A', werkzeug: 'npm run a', gate: 'G' },
    { id: 'b', was: 'B', werkzeug: null, gate: 'G', warumOhneWerkzeug: 'Ein tragfähiger Grund, der lang genug ist, um durch die Prüfung zu kommen.' },
    { id: 'c', was: 'C', werkzeug: 'npm run c', gate: 'G' },
  ]);
  assert.equal(b.mitWerkzeug, 2);
  assert.equal(b.erreicht, 1, 'die Kette hört an der ersten Lücke auf');
  assert.equal(b.ersteLuecke.id, 'b');
});

test('ohne Lücke reicht die Kette bis zum Ende', () => {
  const b = kettenbefund([{ id: 'a', was: 'A', werkzeug: 'npm run a', gate: 'G' }]);
  assert.equal(b.erreicht, 1);
  assert.equal(b.ersteLuecke, null);
});

test('der Bestand hört bei der Zahlung auf', () => {
  // Nicht als Zusicherung über die Zukunft, sondern als Marke: Wird die Lücke
  // geschlossen, muss dieser Fall nachgezogen werden — und dann steht in der
  // Änderung, dass sich der Betrieb verlängert hat.
  const b = kettenbefund();
  assert.equal(b.ersteLuecke.id, 'zahlung');
  assert.equal(b.erreicht, 4);
});
