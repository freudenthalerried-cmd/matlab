import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pruefer = fileURLToPath(new URL('../bin/testpruefung.mjs', import.meta.url));
const probeOrdner = fileURLToPath(new URL('./probe', import.meta.url));

test('der Prüfer findet in der Probedatei jedes Muster und schweigt beim sauberen Fall', () => {
  const lauf = spawnSync(process.execPath, [pruefer, probeOrdner], { encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.ok(lauf.stdout.includes('6 Testfälle geprüft, 4 mit Verdacht'), lauf.stdout);
  assert.ok(lauf.stdout.includes('behauptet nichts — kein einziges assert'), 'Muster 1 wird gefunden');
  assert.ok(lauf.stdout.includes('stehen in einem if'), 'Muster 2 wird gefunden');
  assert.ok(lauf.stdout.includes('Schleife über `liste`'), 'Muster 3 wird gefunden');
  assert.ok(lauf.stdout.includes('Schleife über `leereListe`'), 'die fremde Längenzusicherung schirmt nicht mehr ab');
  assert.ok(!lauf.stdout.includes('begruendet abgelehnt'), 'die begründete Ablehnung bleibt stumm');
  assert.ok(!lauf.stdout.includes('sauber:'), 'der saubere Fall löst keinen Verdacht aus');
});

test('ein unlesbarer Testordner gibt eine Meldung, keinen Stacktrace', () => {
  const lauf = spawnSync(process.execPath, [pruefer, '/gibt/es/nicht'], { encoding: 'utf8' });
  assert.equal(lauf.status, 2, 'unlesbarer Ordner beendet mit Exit 2');
  assert.ok(lauf.stderr.includes('Testordner nicht lesbar'), 'die Meldung benennt das Problem');
  assert.ok(!lauf.stderr.includes('at '), 'kein Stacktrace in der Meldung');
});
