/**
 * Wird die Tür, die jemand eingebaut hat, auch benutzt?
 *
 * **Der Anlass, 15. September 2026.** `punktebefund` trug den Beiwert
 * `ohneMessung` in der Kopfzeile und nannte `OHNE_MESSUNG` im Rumpf an vier
 * Stellen weiter. Aufgefallen ist das beim Lesen, nicht beim Messen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MINDESTENS_VORGABEN, beiwertbefund, dateibefund, funktionen, vorgaben,
} from '../src/beiwertnutzung.js';

const regeln = (quelle) => dateibefund('probe.js', quelle).meldungen.map((m) => m.regel);

test('eine Kopfzeile ohne Registervorgabe kostet keine Zerlegung', () => {
  assert.deepEqual(funktionen('export function f(a, b) { return a + b; }'), []);
  assert.deepEqual(regeln('export function f(a, b) { return a + b; }'), []);
});

test('die heile Bauart meldet nichts — der Beiwert wird gezogen', () => {
  const quelle = 'const REG = [1];\nexport function befund(x, register = REG) {\n'
    + '  return x + register.length;\n}\n';
  assert.deepEqual(regeln(quelle), []);
  assert.equal(dateibefund('probe.js', quelle).geprueft, 1);
});

test('ein Rumpf, der das Register trotzdem aus dem Modul liest, ist ein Befund', () => {
  const quelle = 'const REG = [1];\nexport function befund(x, register = REG) {\n'
    + '  return x + REG.length + register.length;\n}\n';
  assert.deepEqual(regeln(quelle), ['beiwert-uebergangen'],
    'von außen ist diese Stelle nicht zu erreichen, von innen sieht sie offen aus');
});

test('ein Beiwert, den der Rumpf nie nennt, ist ein Befund — die andere Richtung', () => {
  const quelle = 'const REG = [1];\nexport function befund(x, register = REG) {\n'
    + '  return x;\n}\n';
  assert.deepEqual(regeln(quelle), ['beiwert-ungenutzt'],
    'ein Beiwert, der nichts ändert, ist eine Zusage, die niemand einlöst');
});

test('eine Pfeilfunktion ohne geschweifte Klammern hat trotzdem einen Rumpf', () => {
  /*
   * `ustText` in `src/shopkern.js` ist am 15. September die einzige Stelle
   * dieser Form. Wer nur Blöcke liest, übersieht sie still — und ein Prüfer,
   * der eine Schreibweise nicht kennt, meldet nicht zu wenig, sondern gar
   * nichts.
   */
  const gut = 'const SATZ = 0.2;\nexport const text = (satz = SATZ) => `${satz}`;\n';
  assert.equal(dateibefund('probe.js', gut).geprueft, 1, 'die Pfeilfunktion wird gelesen');
  assert.deepEqual(regeln(gut), []);

  const schlecht = 'const SATZ = 0.2;\nexport const text = (satz = SATZ) => satz + SATZ;\n';
  assert.deepEqual(regeln(schlecht), ['beiwert-uebergangen']);

  // Wer den Beiwert gar nicht nennt, löst beide Regeln aus — er umgeht die
  // Tür und lässt sie zugleich ungenutzt. Das ist eine Sache und zwei Sätze.
  const beides = 'const SATZ = 0.2;\nexport const text = () => SATZ;\n';
  assert.deepEqual(regeln('const SATZ = 0.2;\nexport const t = (satz = SATZ) => SATZ;\n'),
    ['beiwert-uebergangen', 'beiwert-ungenutzt']);
  assert.deepEqual(regeln(beides), [], 'ohne Vorgabe in der Kopfzeile ist nichts zu messen');
});

test('ein Beispiel im Kommentarkopf ist keine Kopfzeile', () => {
  /*
   * Gelesen wird über `nurCode` — sonst hielte der Kopf von
   * `src/beiwertnutzung.js`, der genau eine solche Zeile zitiert, sich selbst
   * für eine Funktion.
   */
  const quelle = '/**\n * export function befund(register = REG) {\n */\nconst REG = [1];\n';
  assert.deepEqual(funktionen(quelle), []);
});

test('zwei Vorgaben in einer Kopfzeile werden beide gelesen', () => {
  /*
   * **Der Fund vom 15. September, im ersten Lauf dieses Prüfers.** Hier stand
   * ein `/…/g`, den `funktionen()` und `vorgaben()` teilten — die eine rief
   * `.test()`, die andere `matchAll()`, und beide schreiben `lastIndex`. Der
   * Prüfer meldete daraufhin einen Beiwert namens `eter`, die zweite Hälfte
   * von `anbieter`, und zählte 117 statt 168 Vorgaben.
   */
  const kopf = '(kennungen = KENNUNGEN, anbieter = ANBIETER)';
  assert.deepEqual(vorgaben(kopf), [
    { beiwert: 'kennungen', register: 'KENNUNGEN' },
    { beiwert: 'anbieter', register: 'ANBIETER' },
  ], 'ein geteilter globaler Ausdruck setzte die zweite Suche mitten im Wort an');

  // Und zweimal hintereinander dasselbe Ergebnis — genau das ging vorher schief.
  assert.deepEqual(vorgaben(kopf), vorgaben(kopf));
});

test('zu wenige gesehene Vorgaben sind kein grünes Ergebnis', () => {
  const b = beiwertbefund(new Map([['probe.js', 'export function f(a) { return a; }']]));
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['zu-wenig-gesehen'],
    'eine Zerlegung, die nichts mehr findet, meldet grün und misst nichts');
  assert.ok(MINDESTENS_VORGABEN >= 100, `die Untergrenze steht auf ${MINDESTENS_VORGABEN}`);
});
