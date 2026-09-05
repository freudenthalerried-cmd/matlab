#!/usr/bin/env node
/**
 * Lässt sich jede Quelldatei einlesen?
 *
 *   npm run pruefe-lesbar
 *
 * **Der Anlass, 5. September 2026.** `bin/shopprobe.mjs` und
 * `bin/oberflaechenprobe.mjs` trugen seit dem Vortag je eine geschweifte
 * Klammer zu viel. Fünfzehn Stunden lang, elf Gesamtläufe, jeder grün — die
 * beiden Dateien fahren zusammen 64 Browserszenarien und ließen sich nicht
 * einmal einlesen.
 *
 * Geprüft wird mit dem Übersetzer selbst (`node --check`, `php -l`) und nicht
 * mit einem nachgebauten Leser: Was der Übersetzer nicht annimmt, ist kaputt,
 * und was er annimmt, ist einlesbar. Eine zweite Meinung darüber wäre eine
 * zweite Fehlerquelle.
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, relative } from 'node:path';

import { QUELLORDNER, ENDUNGEN, lesbarkeitsbefund } from '../src/lesbarkeit.js';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = process.argv[2] ? process.argv[2] : join(hier, '..');

const dateienIn = (ordner) => (existsSync(ordner) && statSync(ordner).isDirectory()
  ? readdirSync(ordner).map((d) => join(ordner, d)).filter((p) => statSync(p).isFile())
  : []);

const gesammelt = [
  ...dateienIn(wurzel),
  ...QUELLORDNER.flatMap((o) => dateienIn(join(wurzel, o))),
].filter((p) => ENDUNGEN[extname(p)]).sort();

const ergebnisse = gesammelt.map((pfad) => {
  const werkzeug = ENDUNGEN[extname(pfad)];
  try {
    if (werkzeug === 'node') execFileSync(process.execPath, ['--check', pfad], { stdio: 'pipe' });
    else execFileSync('php', ['-l', pfad], { stdio: 'pipe' });
    return { datei: relative(wurzel, pfad), ok: true };
  } catch (fehler) {
    const roh = `${fehler.stderr ?? ''}${fehler.stdout ?? ''}`.trim();
    return { datei: relative(wurzel, pfad), ok: false, meldung: roh || String(fehler.message) };
  }
});

const b = lesbarkeitsbefund(ergebnisse);
const nachEndung = {};
for (const e of ergebnisse) {
  const k = extname(e.datei);
  nachEndung[k] = (nachEndung[k] ?? 0) + 1;
}

console.log(`Lesbarkeit: ${b.dateien} Quelldateien mit dem Übersetzer eingelesen`);
console.log(Object.entries(nachEndung).map(([k, n]) => `${n}× ${k}`).join(', '));

if (!b.sauber) {
  console.error(`\n${b.meldungen.length} Datei(en) sind kein Werkzeug, sondern Text:\n`);
  for (const m of b.meldungen) console.error(`  ✗ ${m.text}  (${m.regel})`);
  console.error('\nEine Datei, die sich nicht einlesen lässt, ist auch nicht geprüft —');
  console.error('und in einem Lauf, der sie nicht aufruft, fällt es nie auf.');
  process.exit(1);
}

console.log('\nJede Quelldatei lässt sich einlesen — auch die, die im Regellauf nicht');
console.log('ausgeführt werden. Drei Sekunden gegen fünfzehn Stunden.');
process.exit(0);
