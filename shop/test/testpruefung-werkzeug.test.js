import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pruefer = fileURLToPath(new URL('../bin/testpruefung.mjs', import.meta.url));
const probeOrdner = fileURLToPath(new URL('./probe', import.meta.url));

test('der Prüfer findet in der Probedatei jedes Muster und schweigt beim sauberen Fall', () => {
  const lauf = spawnSync(process.execPath, [pruefer, probeOrdner], { encoding: 'utf8' });
  // **Seit dem 1. September Rückgabewert 1.** Bis dahin endete dieser Prüfer
  // immer mit 0, auch mit Funden — er stand damit in jeder Prüferschleife auf
  // „OK", ganz gleich was er meldete. Ein Verdacht, den niemand ansieht, ist
  // ein grünes Licht. Der Selbstnachweis mit `--probe` bleibt grün, dieser
  // Lauf über einen Ordner nicht.
  assert.equal(lauf.status, 1, lauf.stderr);
  const bericht = spawnSync(process.execPath, [pruefer, probeOrdner, '--bericht'], { encoding: 'utf8' });
  assert.equal(bericht.status, 0, 'mit --bericht bleibt der alte Weg offen');
  assert.ok(lauf.stdout.includes('9 Testfälle geprüft, 6 mit Verdacht'), lauf.stdout);
  assert.ok(lauf.stdout.includes('behauptet nichts — kein einziges assert'), 'Muster 1 wird gefunden');
  assert.ok(lauf.stdout.includes('stehen in einem if'), 'Muster 2 wird gefunden');
  assert.ok(lauf.stdout.includes('Schleife über `liste`'), 'Muster 3 wird gefunden');
  assert.ok(lauf.stdout.includes('Schleife über `leereListe`'), 'die fremde Längenzusicherung schirmt nicht mehr ab');
  assert.ok(lauf.stdout.includes('geschweifte Klammer in einer Zeichenkette'),
    'ein hohler Fall mit `{` im Text wird gefunden statt übersprungen');
  assert.ok(lauf.stdout.includes('Muster mit Anführungszeichen'),
    'ein hohler Fall hinter einem Muster-Literal wird gefunden statt übersprungen');
  assert.ok(!lauf.stdout.includes('nicht lesbar'),
    'keiner der Probefälle ist unlesbar — sonst prüft der Prüfer sie gar nicht');
  assert.ok(!lauf.stdout.includes('begruendet abgelehnt'), 'die begründete Ablehnung bleibt stumm');
  assert.ok(!lauf.stdout.includes('sauber:'), 'der saubere Fall löst keinen Verdacht aus');
  assert.ok(!lauf.stdout.includes('mit Optionsobjekt'),
    'test(name, options, fn) ist eine gültige Schreibweise — ihr Rumpf ist die Funktion, nicht das Optionsobjekt');
});

test('ein unlesbarer Testordner gibt eine Meldung, keinen Stacktrace', () => {
  const lauf = spawnSync(process.execPath, [pruefer, '/gibt/es/nicht'], { encoding: 'utf8' });
  assert.equal(lauf.status, 2, 'unlesbarer Ordner beendet mit Exit 2');
  assert.ok(lauf.stderr.includes('Testordner nicht lesbar'), 'die Meldung benennt das Problem');
  assert.ok(!lauf.stderr.includes('at '), 'kein Stacktrace in der Meldung');
});
