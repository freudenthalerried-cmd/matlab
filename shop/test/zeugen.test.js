import test from 'node:test';
import assert from 'node:assert/strict';

import { KEINE_ZEUGEN, alsDatei, befehlFuer, mitZeuge, zeugeAus } from '../src/zeugen.js';

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

test('der Frischewächter ist kein Zeuge', () => {
  /*
   * **Der Fund vom 13. September 2026.** Drei Gegenproben desselben Tages
   * meldeten „nach dem Zurücksetzen nicht wieder grün — die Probe hat etwas
   * hinterlassen", und keine davon hatte etwas hinterlassen.
   *
   * `erzeugnisfrische.test.js` prüft, ob die gebauten Erzeugnisse jünger sind
   * als ihre Quellen. Eine Mutation an einer Quelldatei des Bündels macht ihn
   * **durch ihre bloße Existenz** rot — und das Zurücksetzen macht ihn nicht
   * wieder grün: Die Datei ist danach wieder jünger als der letzte Bau.
   *
   * > **Ein Wächter über die Frische der Erzeugnisse kann kein Zeuge einer
   * > Mutation sein.** Er wird von jeder rot, und nach dem Zurücksetzen bleibt
   * > er es, bis jemand neu baut.
   */
  const tap = [
    'not ok 1 - der Bestand steht',
    '  ---',
    "  location: '/home/user/matlab/shop/test/erzeugnisfrische.test.js:42:1'",
    '  ...',
    'not ok 2 - die Nebenfrage wiegt wie der Titel',
    '  ---',
    "  location: '/home/user/matlab/shop/test/shopkern.test.js:288:1'",
    '  ...',
  ].join('\n');
  assert.deepEqual(zeugeAus(tap), ['shop/test/shopkern.test.js'],
    'der Frischewächter steht wieder in der Zeugenliste');

  // Bleibt nichts übrig, gibt es keinen Zeugen — und die ganze Reihe läuft.
  // Das ist der sichere Ausgang: ein falscher Alarm, kein falsches Grün.
  const nurFrische = [
    'not ok 1 - der Bestand steht',
    '  ---',
    "  location: '/home/user/matlab/shop/test/erzeugnisfrische.test.js:42:1'",
    '  ...',
  ].join('\n');
  assert.deepEqual(zeugeAus(nurFrische), []);
  assert.deepEqual(befehlFuer({ id: 'x', pruefer: 'test' }, { x: [] }), 'npm test');

  assert.ok(KEINE_ZEUGEN.includes('shop/test/erzeugnisfrische.test.js'));
  assert.equal(KEINE_ZEUGEN.length, 1,
    'eine zweite Datei ohne Zeugenkraft — dann gehört ihr Grund danebengeschrieben');
});
