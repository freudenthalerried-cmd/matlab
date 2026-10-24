import test from 'node:test';
import assert from 'node:assert/strict';

import { laufzahl, nachPrueferGruppiert, vorlaufEntfaellt } from '../src/gegenprobenplan.js';
import { GEGENPROBEN } from '../src/gegenprobenregister.js';

const probe = (id, pruefer) => ({ id, pruefer });

test('Gruppiert wird nach Prüfer, ohne die Reihenfolge darin zu ändern', () => {
  const roh = [probe('a', 'test'), probe('b', 'kampagne'), probe('c', 'test'), probe('d', 'kampagne')];
  assert.deepEqual(nachPrueferGruppiert(roh).map((p) => p.id), ['a', 'c', 'b', 'd']);

  // Die Gruppen erscheinen in der Reihenfolge, in der ihr Prüfer zuerst
  // vorkommt — nicht alphabetisch: Eine Umbenennung würde sonst zwei Berichte
  // unvergleichbar machen.
  assert.equal(nachPrueferGruppiert(roh)[0].pruefer, 'test');
});

test('Der Vorlauf entfällt nur nach einer geschlagenen Probe am selben Prüfer', () => {
  const jetzt = probe('b', 'test');
  assert.equal(vorlaufEntfaellt({ pruefer: 'test', urteil: 'geschlagen' }, jetzt), true);
  assert.equal(vorlaufEntfaellt({ pruefer: 'kampagne', urteil: 'geschlagen' }, jetzt), false);
  assert.equal(vorlaufEntfaellt({ pruefer: 'test', urteil: 'nicht sauber' }, jetzt), false);
  assert.equal(vorlaufEntfaellt({ pruefer: 'test', urteil: 'schlägt nicht an' }, jetzt), false);
  assert.equal(vorlaufEntfaellt(null, jetzt), false);
});

test('Die Gruppierung spart Läufe, und zwar gezählt', () => {
  const roh = [probe('a', 'test'), probe('b', 'kampagne'), probe('c', 'test')];
  assert.equal(laufzahl(roh), 9, 'ohne Nachbarschaft kostet jede Probe drei Läufe');
  assert.equal(laufzahl(nachPrueferGruppiert(roh)), 8);

  // Am echten Register: Die Ersparnis ist der Grund für diese Runde.
  assert.ok(GEGENPROBEN.length >= 50, `nur ${GEGENPROBEN.length} Proben — die Messung sagt nichts`);
  const gruppiert = laufzahl(nachPrueferGruppiert(GEGENPROBEN));
  assert.ok(gruppiert < GEGENPROBEN.length * 3, 'die Gruppierung spart keinen einzigen Lauf');
  assert.ok(gruppiert <= laufzahl(GEGENPROBEN), 'gruppiert darf nie teurer sein als in Registerfolge');
});

test('Eine leere Liste kostet nichts und wirft nicht', () => {
  assert.deepEqual(nachPrueferGruppiert([]), []);
  assert.equal(laufzahl([]), 0);
});
