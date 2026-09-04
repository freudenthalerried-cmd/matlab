/**
 * Räumt der Wegwerfordner wirklich weg?
 *
 * **Der Anlass, 4. September 2026, Abend.** Ein Gesamtlauf brach ab, weil die
 * Ablage voll war — 63 082 Einträge unter `/tmp`. Zwölf Proben legten sich
 * ein Verzeichnis an und ließen es liegen; `bin/bestellprobe.mjs` baut darin
 * eine vollständige Website.
 *
 * > **Eine Probe, die ihre Spuren behält, wird irgendwann selbst der Fehler.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { wegwerfordner } from '../src/wegwerf.js';

const modul = fileURLToPath(new URL('../src/wegwerf.js', import.meta.url));

test('der Ordner ist da, solange der Prozess läuft', () => {
  const o = wegwerfordner('wegwerfprobe-');
  assert.equal(existsSync(o), true);
  assert.match(o, /wegwerfprobe-/);
});

test('nach dem Ende des Prozesses ist er weg', () => {
  // Gemessen wird an einem **eigenen Prozess**: Im laufenden Testprozess ist
  // der Ordner noch da, und das ist richtig so. Was zählt, ist das Danach.
  const lauf = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import { wegwerfordner } from ${JSON.stringify(modul)};`
    + 'console.log(wegwerfordner("wegwerfprobe-kind-"));'], { encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stderr);
  const ordner = lauf.stdout.trim();
  assert.match(ordner, /wegwerfprobe-kind-/);
  assert.equal(existsSync(ordner), false, `${ordner} ist liegen geblieben`);
});

test('auch bei process.exit wird aufgeräumt', () => {
  // Der eigentliche Grund für `process.on('exit')` statt eines `finally`:
  // Genau so enden die meisten dieser Werkzeuge.
  const lauf = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import { wegwerfordner } from ${JSON.stringify(modul)};`
    + 'console.log(wegwerfordner("wegwerfprobe-exit-")); process.exit(3);'], { encoding: 'utf8' });
  assert.equal(lauf.status, 3);
  assert.equal(existsSync(lauf.stdout.trim()), false, 'bei process.exit liegen geblieben');
});

test('mit WEGWERF_BEHALTEN bleibt er stehen — für die Fehlersuche', () => {
  const lauf = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import { wegwerfordner } from ${JSON.stringify(modul)};`
    + 'console.log(wegwerfordner("wegwerfprobe-bleib-"));'],
  { encoding: 'utf8', env: { ...process.env, WEGWERF_BEHALTEN: '1' } });
  const ordner = lauf.stdout.trim();
  assert.equal(existsSync(ordner), true, 'die Ausnahme greift nicht');
  // Und weil diese Probe selbst keine Spur hinterlassen darf:
  spawnSync('rm', ['-rf', ordner]);
});

test('kein Werkzeug legt sich noch selbst ein Wegwerfverzeichnis an', () => {
  // Zwölf taten es, und acht davon räumten nicht auf. Die Regel steht hier
  // und nicht im Gedächtnis: Wer `mkdtempSync` ruft, umgeht das Aufräumen.
  const wurzel = fileURLToPath(new URL('..', import.meta.url));
  const treffer = [];
  for (const ordner of ['bin', 'test', 'src']) {
    for (const name of readdirSync(new URL(`../${ordner}/`, import.meta.url))) {
      if (!/\.(m?js)$/.test(name) || `${ordner}/${name}` === 'src/wegwerf.js') continue;
      const text = readFileSync(`${wurzel}${ordner}/${name}`, 'utf8');
      if (/\bmkdtempSync\s*\(/.test(text)) treffer.push(`${ordner}/${name}`);
    }
  }
  assert.deepEqual(treffer, [], 'diese Dateien legen selbst an und räumen vielleicht nicht auf');
});
