/**
 * Die unterste Stufe: Lässt sich die Datei überhaupt einlesen?
 *
 * **Der Anlass, 5. September 2026.** `bin/shopprobe.mjs` und
 * `bin/oberflaechenprobe.mjs` trugen seit dem Vortag, 12:21 Uhr, je eine
 * geschweifte Klammer zu viel — aus derselben Runde, die den Frischeschutz
 * eingebaut hat.
 *
 * > **64 Browserszenarien, und die beiden Dateien, die sie fahren, ließen sich
 * > nicht einmal einlesen.** Fünfzehn Stunden, elf Gesamtläufe, jeder grün.
 *
 * `npm run alles` holt die Browserproben nicht ab — sie kosten je einen
 * Chromium-Start. Der einzige Schutz davor, dass sie verrotten, war ein
 * Schalter, den niemand umlegt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';

import { QUELLORDNER, ENDUNGEN, lesbarkeitsbefund } from '../src/lesbarkeit.js';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');

test('ein einziger Fehler macht den Lauf rot und nennt die Datei', () => {
  const b = lesbarkeitsbefund([
    { datei: 'bin/a.mjs', ok: true },
    { datei: 'bin/shopprobe.mjs', ok: false, meldung: "SyntaxError: Unexpected token '}'\nweiterer Text" },
  ], 2);
  assert.equal(b.sauber, false);
  assert.equal(b.kaputt, 1);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nicht-einlesbar']);
  // Nur die erste Zeile: Der Rest ist Stapelabzug und sagt nichts über die Datei.
  assert.equal(b.meldungen[0].text, "bin/shopprobe.mjs: SyntaxError: Unexpected token '}'");
});

test('ein Lauf über zu wenige Dateien ist kein grüner', () => {
  // Dieselbe Regel wie `mindestens` im Prüferregister: Wer über nichts
  // urteilt, urteilt nicht — und meldet trotzdem Grün.
  const b = lesbarkeitsbefund([{ datei: 'src/x.js', ok: true }], 40);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['zu-wenig-gefunden']);
});

test('eine fehlende Meldung wird nicht zu einer leeren Zeile', () => {
  const b = lesbarkeitsbefund([{ datei: 'src/x.js', ok: false }], 1);
  assert.match(b.meldungen[0].text, /lässt sich nicht einlesen/);
});

test('vollständig lesbar heißt grün', () => {
  const b = lesbarkeitsbefund([{ datei: 'a', ok: true }, { datei: 'b', ok: true }], 2);
  assert.equal(b.sauber, true);
  assert.deepEqual(b.meldungen, []);
});

/**
 * Und der Bestand selbst — mit dem Übersetzer, nicht mit einem nachgebauten
 * Leser. Was `node --check` nicht annimmt, ist kaputt.
 */
test('jede Quelldatei dieses Hauses lässt sich einlesen', () => {
  const dateien = [
    ...readdirSync(wurzel).map((d) => join(wurzel, d)),
    ...QUELLORDNER.flatMap((o) => readdirSync(join(wurzel, o)).map((d) => join(wurzel, o, d))),
  ].filter((p) => statSync(p).isFile() && ENDUNGEN[extname(p)] === 'node');

  assert.ok(dateien.length >= 200, `nur ${dateien.length} Dateien gefunden — dann prüft das hier wenig`);
  const kaputt = [];
  for (const pfad of dateien) {
    try {
      execFileSync(process.execPath, ['--check', pfad], { stdio: 'pipe' });
    } catch {
      kaputt.push(pfad.slice(wurzel.length + 1));
    }
  }
  assert.deepEqual(kaputt, [], `nicht einlesbar: ${kaputt.join(', ')}`);
});
