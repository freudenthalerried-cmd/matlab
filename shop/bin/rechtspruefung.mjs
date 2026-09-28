#!/usr/bin/env node
/**
 * Worauf beruft sich dieser Bestand — und steht es an einer Stelle?
 *
 *   npm run pruefe-recht
 *
 * **Der Anlass, 9. September 2026, nachts.** Die Runde davor hat gemessen,
 * dass das Rechtsinformationssystem des Bundes aus dieser Umgebung gesperrt
 * ist. Daraus folgt ein Satz, der vorher nirgends stand: **Keine einzige
 * Paragraphenangabe dieses Bestands ist am Volltext belegt.**
 *
 * Dieser Prüfer belegt nichts — er kann es nicht. Er hält die Fundstellen des
 * Bestands gegen ein Register, in beide Richtungen, und verlangt zu jeder eine
 * ausgeschriebene Behauptung. Damit wird aus verstreuten Paragraphen eine
 * Liste, die ein Rechtstexteanbieter abhaken kann.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { RECHTSGRUENDE, WIRKUNG, rechtsbefund } from '../src/rechtsgrund.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const dateien = [];
const sammle = (ordner, endungen) => {
  for (const name of readdirSync(ordner).sort()) {
    const voll = join(ordner, name);
    if (statSync(voll).isDirectory()) { sammle(voll, endungen); continue; }
    if (!endungen.some((e) => name.endsWith(e))) continue;
    dateien.push({ pfad: relative(SHOP, voll), text: readFileSync(voll, 'utf8') });
  }
};
sammle(join(SHOP, 'src'), ['.js']);
sammle(join(SHOP, 'bin'), ['.mjs']);
sammle(join(SHOP, 'inhalte'), ['.md']);

if (dateien.length < 50) {
  console.error(`Abbruch: nur ${dateien.length} Quelldateien gelesen — das ist zu wenig.`);
  console.error('Ein Prüfer über einen halben Bestand meldet Grün für die andere Hälfte.');
  process.exit(2);
}

const b = rechtsbefund(dateien, RECHTSGRUENDE);

// Gezählt wird das Angesehene, nicht das Gefundene.
console.log(`\nRechtsgründe — ${b.fundstellen} Fundstellen, ${b.nennungen} Nennungen in `
  + `${dateien.length} Dateien;\n${b.belegt} davon am Gesetzestext belegt\n`);

if (!b.sauber) {
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log(`\n${b.meldungen.length} Meldung(en).`);
  process.exit(1);
}

const nachWirkung = new Map();
for (const e of RECHTSGRUENDE) {
  if (!nachWirkung.has(e.wirkung)) nachWirkung.set(e.wirkung, []);
  nachWirkung.get(e.wirkung).push(e.zitat);
}
for (const [art, erklaerung] of Object.entries(WIRKUNG)) {
  const liste = nachWirkung.get(art) ?? [];
  if (liste.length) console.log(`  ${art.padEnd(13)} ${liste.length}  — ${erklaerung}`);
}

console.log('\nJede Fundstelle nennt ihr Gesetz und steht mit ihrer Behauptung im Register.');
if (b.belegt === 0) {
  console.log('\nKeine ist am Volltext geprüft: Das Rechtsinformationssystem des Bundes ist');
  console.log('aus dieser Umgebung gesperrt (npm run pruefe-grenzen). Sie stehen als');
  console.log('Fachwissen da, nicht als Zitat — und diese Liste sagt es, statt es zu verbergen.');
}
process.exit(0);
