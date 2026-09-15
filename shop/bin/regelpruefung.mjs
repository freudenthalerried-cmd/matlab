#!/usr/bin/env node
/**
 * Wie viele Regeln gibt es — und wie viele hat je jemand feuern sehen?
 *
 *   npm run pruefe-regeln
 *
 * Warum es diese Zählung gibt und was sie nicht zählen kann, steht im Kopf
 * von `src/regelnamen.js` — dort einmal.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import {
  regelbefund, REGEL_GEPRUEFT, GEBAUT_GEPRUEFT, UNGESEHENE_HOECHSTENS,
} from '../src/regelnamen.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const lies = (ordner, muster) => {
  const raus = new Map();
  for (const name of readdirSync(join(SHOP, ordner)).sort()) {
    if (!muster.test(name)) continue;
    const pfad = join(SHOP, ordner, name);
    raus.set(relative(SHOP, pfad), readFileSync(pfad, 'utf8'));
  }
  return raus;
};

const quellen = new Map([...lies('src', /\.js$/), ...lies('bin', /\.mjs$/)]);
const tests = lies('test', /\.test\.js$/);

if (quellen.size < 80 || tests.size < 80) {
  console.error(`Abbruch: ${quellen.size} Quellen und ${tests.size} Testdateien gelesen — `
    + 'die Zählung sagt dann nichts.');
  process.exit(2);
}

const b = regelbefund(quellen, tests);

console.log(`\nRegelnamen — ${b.stellen.length} Stellen, ${b.namen.size} Namen `
  + `in ${quellen.size} Quelldateien, gehalten gegen ${tests.size} Testdateien\n`);
console.log(`  nie gesehen            ${String(b.ungesehen.length).padStart(3)}   (Schranke ${UNGESEHENE_HOECHSTENS})`);
console.log(`  begründet ungesehen    ${String(REGEL_GEPRUEFT.length).padStart(3)}`);
console.log(`  zur Laufzeit gebaut    ${String(b.gebaut.length).padStart(3)}   (begründet ${GEBAUT_GEPRUEFT.length})`);

let letzte = '';
for (const s of b.ungesehen) {
  if (s.pfad !== letzte) { console.log(`\n    ${s.pfad}`); letzte = s.pfad; }
  console.log(`         ${s.regel}  (${s.art})`);
}

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Eine Regel, die nie gefeuert hat, ist kein Prüfsatz, sondern ein Vorsatz.');
  process.exit(1);
}

console.log('');
console.log(`Regelabgleich: ${b.ungesehen.length} von ${b.stellen.length} Stellen ungesehen`);
console.log('Ein Prüfsatz, den niemand hat anschlagen sehen, ist eine Behauptung über sich selbst.');
process.exit(0);
