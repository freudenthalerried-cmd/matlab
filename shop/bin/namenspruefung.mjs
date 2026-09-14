#!/usr/bin/env node
/**
 * Ein Name, zwei Module?
 *
 *   npm run pruefe-namen
 *
 * Warum es diese Messung gibt und was sie ausdrücklich nicht zählt, steht im
 * Kopf von `src/namensregister.js` — dort einmal.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { namensbefund, NAME_GEPRUEFT, NAMEN_HOECHSTENS } from '../src/namensregister.js';
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

const b = namensbefund(quellen);

console.log(`\nNamensabgleich — ${b.namen} exportierte Namen in ${quellen.size} Modulen\n`);
console.log(`  in mehr als einem Modul  ${String(b.offen.length).padStart(3)}   (Schranke ${NAMEN_HOECHSTENS})`);
console.log(`  begründet                ${String(NAME_GEPRUEFT.length).padStart(3)}`);

for (const { name, module } of b.offen) {
  console.log(`\n    ${name}  [${module.length}]`);
  for (const m of module) console.log(`         ${m}`);
}

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Derselbe Name für einen anderen Vertrag ist schlimmer als zwei Fassungen.');
  process.exit(1);
}

console.log('');
console.log(`Namensabgleich: ${b.offen.length} ungeführt, ${NAME_GEPRUEFT.length} mit Grund`);
console.log('Ein exportierter Name ist ein Versprechen nach außen — zwei davon sind eines zu viel.');
process.exit(0);
