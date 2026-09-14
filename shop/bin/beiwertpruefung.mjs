#!/usr/bin/env node
/**
 * Wird die Tür, die jemand eingebaut hat, auch benutzt?
 *
 *   npm run pruefe-beiwerte
 *
 * Warum es diese Messung gibt — und was sie ausdrücklich nicht zählt — steht
 * im Kopf von `src/beiwertnutzung.js`, dort einmal.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { MINDESTENS_VORGABEN, beiwertbefund } from '../src/beiwertnutzung.js';
import { zuWenigQuellen } from '../src/prueferurteil.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const quellen = new Map();
for (const [ordner, muster] of [['src', /\.js$/], ['bin', /\.mjs$/]]) {
  for (const name of readdirSync(join(SHOP, ordner)).sort()) {
    if (!muster.test(name)) continue;
    const pfad = join(SHOP, ordner, name);
    quellen.set(relative(SHOP, pfad), readFileSync(pfad, 'utf8'));
  }
}

if (quellen.size < 80) {
  console.error(zuWenigQuellen(quellen.size));
  process.exit(2);
}

const b = beiwertbefund(quellen);

console.log(`\nBeiwerte — ${b.geprueft} Registervorgaben in ${b.dateien} Modulen`);
console.log(`Untergrenze ${MINDESTENS_VORGABEN}; gemessen wird die Kopfzeile gegen den Rumpf.\n`);

if (b.meldungen.length) {
  for (const m of b.meldungen) {
    console.log(`  ✗ ${m.text}`);
    console.log(`      [${m.regel}]`);
  }
  console.log(`\n${b.meldungen.length} Meldung(en).`);
  process.exit(1);
}

console.log('Keine Meldung. Jede Registervorgabe wird gezogen, und keine wird umgangen.');
console.log('Eine Tür, die man einbaut und nicht benutzt, ist eine Wand mit Beschlag.');
process.exit(0);
