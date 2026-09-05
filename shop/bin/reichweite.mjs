#!/usr/bin/env node
/**
 * Welche Dateien liest kein Prüfer?
 *
 *   npm run reichweite
 *
 * **Der Anlass, 5. September 2026.** Neun Runden an einem Tag trugen denselben
 * Befund in verschiedenen Kleidern: *nicht ein fehlender Prüfer, sondern ein
 * Prüfer, dessen Reichweite kleiner ist als die Reichweite der Regel, die er
 * prüft.* Die Runde davor hat die Frage gestellt und offen gelassen, wie man
 * sie beantwortet — mit dem ausdrücklichen Zusatz, dass ein handgeführtes
 * Register die falsche Antwort wäre.
 *
 * > **Eine Reichweite, die man aufschreibt, ist eine Absicht. Eine, die man
 * > misst, ist ein Befund.**
 *
 * Dieses Werkzeug misst. Es startet jeden Prüfer aus `src/pruefregister.js`
 * mit `werkzeug/spur.cjs` davor, das jede gelesene Datei protokolliert, und
 * hält die Vereinigungsmenge gegen das, was `git ls-files` führt.
 *
 * ## Was es nicht sagt
 *
 * Dass eine Datei **gelesen** wurde, heißt nicht, dass sie **geprüft** wurde:
 * `pruefe-lesbar` reicht jede Quelldatei durch den Übersetzer und sagt damit
 * nichts über ihren Inhalt. Umgekehrt ist eine Datei, die **kein** Prüfer
 * öffnet, mit Sicherheit ungeprüft — und das ist die Richtung, in der die
 * Aussage trägt. Eine untere Schranke, kein Zeugnis.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { PRUEFER } from '../src/pruefregister.js';
// Kein eigenes `mkdtempSync`: Zwölf Werkzeuge taten das, und acht räumten
// nicht auf. Die Regel steht seit dem 4. September in `src/wegwerf.js`.
import { wegwerfordner } from '../src/wegwerf.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const SPUR = join(SHOP, 'werkzeug', 'spur.cjs');

if (!existsSync(SPUR)) {
  console.error(`Abbruch: ${relative(REPO, SPUR)} fehlt — ohne die Spur gibt es nichts zu messen.`);
  process.exit(2);
}

/** Was das Verzeichnis führt — ohne das, was ohnehin nicht geprüft wird. */
const OHNE = [
  { muster: /^shop\/node_modules\//, warum: 'fremder Code' },
  { muster: /^shop\/ausgabe\//, warum: 'Erzeugnis, kein Bestand' },
  { muster: /\.(png|jpg|jpeg|gif|webp|ico|svg|pdf|woff2?)$/i, warum: 'Bild oder Schrift' },
  { muster: /^\.gitignore$|^\.gitattributes$/, warum: 'Verzeichnisregel' },
];

const alle = spawnSync('git', ['-C', REPO, 'ls-files'], { encoding: 'utf8' });
if (alle.status !== 0) {
  console.error('Abbruch: `git ls-files` läuft nicht — ohne die Dateiliste misst dieser Lauf nichts.');
  process.exit(2);
}
const gefuehrt = alle.stdout.split('\n').filter(Boolean)
  .filter((d) => !OHNE.some((o) => o.muster.test(d)));

const ordner = wegwerfordner('reichweite-');
const gelesen = new Set();
const jePruefer = [];

for (const p of PRUEFER) {
  const datei = join(ordner, `${p.name}.txt`);
  writeFileSync(datei, '');
  const lauf = spawnSync(
    process.execPath,
    ['--require', SPUR, join(SHOP, 'bin', p.werkzeug), ...(p.argumente ?? [])],
    { cwd: SHOP, encoding: 'utf8', env: { ...process.env, SPUR_DATEI: datei }, timeout: 300000 },
  );
  const pfade = existsSync(datei)
    ? readFileSync(datei, 'utf8').split('\n').filter(Boolean)
      .map((x) => relative(REPO, resolve(x)))
      .filter((x) => !x.startsWith('..') && !x.includes('node_modules'))
    : [];
  for (const x of pfade) gelesen.add(x);
  jePruefer.push({ name: p.name, dateien: new Set(pfade), ausgang: lauf.status });
  try { unlinkSync(datei); } catch { /* der Ordner geht ohnehin weg */ }
}

const ungelesen = gefuehrt.filter((d) => !gelesen.has(d));

console.log(`\nReichweite — ${PRUEFER.length} Prüfer, ${gefuehrt.length} geführte Dateien\n`);
console.log(`  Von mindestens einem Prüfer gelesen  ${gefuehrt.length - ungelesen.length}`);
console.log(`  Von keinem                           ${ungelesen.length}`);
console.log('\n  Die weiteste Reichweite:');
for (const p of [...jePruefer].sort((a, b) => b.dateien.size - a.dateien.size).slice(0, 5)) {
  console.log(`    ${String(p.dateien.size).padStart(4)}  ${p.name}`);
}
console.log(`\n  Ausgenommen: ${OHNE.map((o) => o.warum).join(', ')}`);

if (ungelesen.length) {
  console.log(`\n  Diese ${ungelesen.length} Dateien öffnet kein Prüfer:\n`);
  for (const d of ungelesen) console.log(`    ${d}`);
}

console.log('\nGelesen ist nicht geprüft: `pruefe-lesbar` reicht jede Quelldatei durch den');
console.log('Übersetzer und sagt nichts über ihren Inhalt. Ungelesen ist dagegen sicher');
console.log('ungeprüft — die Zahl oben ist eine untere Schranke, kein Zeugnis.');
