import test from 'node:test';
import assert from 'node:assert/strict';

import { alsDatei, befehlFuer, mitZeuge, zeugeAus } from '../src/zeugen.js';

const TAP = [
  'TAP version 13',
  'ok 1 - eine Zusicherung, die hält',
  'not ok 2 - die Anschrift steht ein zweites Mal in der Akte',
  '  ---',
  '  duration_ms: 3.1',
  "  location: '/home/user/matlab/shop/test/ablage.test.js:94:1'",
  '  ...',
  'not ok 3 - der Beleg trägt die Nummer nicht',
  '  ---',
  "  location: '/home/user/matlab/shop/test/vorgangwerkzeug.test.js:402:1'",
  '  ...',
].join('\n');

test('Der Zeuge steht in der TAP-Ausgabe — alle roten Dateien, nicht nur die erste', () => {
  assert.deepEqual(zeugeAus(TAP), ['shop/test/ablage.test.js', 'shop/test/vorgangwerkzeug.test.js']);
});

test('Eine grüne Ausgabe hat keinen Zeugen', () => {
  assert.deepEqual(zeugeAus('ok 1 - alles gut\nok 2 - auch das'), []);
  assert.deepEqual(zeugeAus(''), []);
  assert.deepEqual(zeugeAus(null), []);
});

test('Ein „not ok" ohne Fundstelle nennt keine Datei', () => {
  // Der Fall kommt vor: Ein Werkzeug gibt „not ok" in seiner eigenen Ausgabe
  // aus, ohne dass ein Testfall gescheitert wäre.
  assert.deepEqual(zeugeAus('not ok 7 - etwas\n  ---\n  duration_ms: 1\n  ...'), []);
});

test('Der Befehl unterscheidet Zeuge und ganze Reihe', () => {
  const probe = { id: 'x', pruefer: 'test' };
  assert.equal(befehlFuer(probe, {}), 'npm test');
  assert.equal(befehlFuer(probe, { x: ['shop/test/a.test.js'] }), 'node --test shop/test/a.test.js');
  // Ein anderer Prüfer hat nie einen Zeugen — sein Befehl ist sein Name.
  assert.equal(befehlFuer({ id: 'y', pruefer: 'pruefe-belege' }, { y: ['shop/test/a.test.js'] }),
    'npm pruefe-belege');
});

test('Zwei Testproben mit verschiedenen Zeugen teilen keinen Lauf', () => {
  // Das ist der Grund, warum `vorlaufEntfaellt` seit heute den **Befehl**
  // vergleicht und nicht den Prüfernamen.
  const zeugen = { eins: ['shop/test/a.test.js'], zwei: ['shop/test/b.test.js'] };
  assert.notEqual(befehlFuer({ id: 'eins', pruefer: 'test' }, zeugen),
    befehlFuer({ id: 'zwei', pruefer: 'test' }, zeugen));
});

test('Ein leerer Fund löscht den letzten bekannten Zeugen nicht', () => {
  const stand = { x: ['shop/test/a.test.js'] };
  assert.equal(mitZeuge(stand, 'x', []).geaendert, false);
  assert.deepEqual(mitZeuge(stand, 'x', []).stand, stand);
  assert.equal(mitZeuge(stand, 'x', ['shop/test/a.test.js']).geaendert, false);
  const neu = mitZeuge(stand, 'x', ['shop/test/b.test.js']);
  assert.equal(neu.geaendert, true);
  assert.deepEqual(neu.stand.x, ['shop/test/b.test.js']);
});

test('Der Stand steht sortiert in der Datei — ein Abdruck, der sich nicht bewegt', () => {
  const text = alsDatei({ zweitens: ['shop/test/b.test.js'], erstens: ['shop/test/a.test.js'] });
  assert.ok(text.indexOf('erstens') < text.indexOf('zweitens'));
  assert.ok(text.endsWith('\n'));
  assert.deepEqual(JSON.parse(text).erstens, ['shop/test/a.test.js']);
});
