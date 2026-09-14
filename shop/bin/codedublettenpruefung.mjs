#!/usr/bin/env node
/**
 * Steht derselbe Rumpf an zwei Stellen?
 *
 *   npm run pruefe-codedubletten
 *
 * Warum es diese Suche gibt, was sie liest und was sie ausdrücklich nicht
 * liest, steht im Kopf von `src/codedubletten.js` — dort einmal.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import {
  codedublettenbefund, DUBLETTE_GEPRUEFT, DUBLETTEN_HOECHSTENS, MINDESTLAENGE,
  GESTALT_GEPRUEFT, GESTALTEN_HOECHSTENS,
} from '../src/codedubletten.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const quellen = new Map();
for (const ordner of ['src', 'bin']) {
  for (const name of readdirSync(join(SHOP, ordner)).sort()) {
    if (!/\.(js|mjs)$/.test(name)) continue;
    const pfad = join(SHOP, ordner, name);
    quellen.set(relative(SHOP, pfad), readFileSync(pfad, 'utf8'));
  }
}

if (quellen.size < 80) {
  console.error(`Abbruch: nur ${quellen.size} Quelldateien gelesen — die Messung sagt dann nichts.`);
  process.exit(2);
}

const b = codedublettenbefund(quellen);

console.log(`\nCodedubletten — ${b.gelesen} Rümpfe in ${quellen.size} Quelldateien, `
  + `gezählt ab ${MINDESTLAENGE} Zeichen\n`);
console.log(`  begründete Dubletten   ${String(DUBLETTE_GEPRUEFT.length).padStart(3)}`);
console.log(`  ungeführt              ${String(b.offen.length).padStart(3)}   (Schranke ${DUBLETTEN_HOECHSTENS})`);
console.log(`  begründete Gestalten   ${String(GESTALT_GEPRUEFT.length).padStart(3)}`);
console.log(`  ungeführt              ${String(b.gestalten.length).padStart(3)}   (Schranke ${GESTALTEN_HOECHSTENS})`);

for (const stellen of b.offen) {
  console.log(`\n    [${stellen.length}] zeichengleich, ${stellen[0].art}, ${stellen[0].code.length} Zeichen`);
  for (const s of stellen) console.log(`         ${s.pfad}:${s.name}`);
}
for (const stellen of b.gestalten) {
  console.log(`\n    [${stellen.length}] gestaltgleich, ${stellen[0].art}, ${stellen[0].code.length} Zeichen`);
  for (const s of stellen) console.log(`         ${s.pfad}:${s.name}`);
}

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Zwei Kopien sind zwei Gelegenheiten, dieselbe Frage unterschiedlich zu beantworten.');
  process.exit(1);
}

console.log('');
console.log(`Codedublettenabgleich: ${b.offen.length + b.gestalten.length} ungeführt, `
  + `${DUBLETTE_GEPRUEFT.length + GESTALT_GEPRUEFT.length} mit Grund`);
console.log('Wer eine Funktion kopiert, kopiert die Zeile darüber mit — und irgendwann nur eine von beiden.');
process.exit(0);
