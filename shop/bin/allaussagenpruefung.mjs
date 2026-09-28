#!/usr/bin/env node
/**
 * Sagt ein Testname alle und prüft der Rumpf eine?
 *
 *   npm run pruefe-allaussagen
 *
 * **Der Anlass, 14. September 2026.** Am Vortag ist dieselbe Bauart dreimal
 * aufgefallen, jedes Mal durch Zufall: „der Hubsatz steht **nur an einer
 * Stelle**" zählte zwei von drei; „jede Beschreibung sagt etwas **Eigenes**"
 * hiess in Wahrheit „steht in keinem Nachbarfeld"; und „**eindeutig**" hiess
 * „der Leser findet eine Zahl" und nicht „der Name trägt eine".
 *
 * > **Dreimal an einem Tag hat eine Zusicherung etwas anderes zugesichert, als
 * > ihr Name sagt.**
 *
 * Das Register steht in `src/allaussage.js`. Es misst den einen Sonderfall,
 * der maschinell geht: den Allquantor.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { zerlege } from '../src/testzerlegung.js';
import { allaussagebefund, ALLAUSSAGEN_GEPRUEFT } from '../src/allaussage.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const TEST = join(SHOP, 'test');

const faelle = [];
for (const name of readdirSync(TEST).sort()) {
  if (!name.endsWith('.test.js')) continue;
  for (const f of zerlege(readFileSync(join(TEST, name), 'utf8'))) {
    faelle.push({ ...f, datei: `test/${name}` });
  }
}

if (faelle.length < 500) {
  console.error(`Abbruch: nur ${faelle.length} Testfälle gelesen — die Messung sagt dann nichts.`);
  process.exit(2);
}

const b = allaussagebefund(faelle);

console.log(`\nAllaussagen — ${b.mitQuantor} von ${b.faelle} Testnamen tragen einen Allquantor\n`);
console.log(`  begründete Ausnahmen          ${String(ALLAUSSAGEN_GEPRUEFT.length).padStart(3)}`);
console.log(`  ohne Mengenzusicherung offen  ${String(b.offen.length).padStart(3)}`);

if (b.offen.length) {
  console.log('');
  for (const f of b.offen) console.log(`    ${f.datei}:${f.zeile}  „${f.titel}"`);
}

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Zwei Stichproben sind keine Allaussage — sie sind zwei Stichproben.');
  process.exit(1);
}

console.log('');
console.log(`Allaussagenabgleich: ${b.mitQuantor} Namen mit Allquantor, jeder gedeckt oder begründet`);
console.log('Ein Name, der mehr verspricht als der Rumpf hält, ist die teuerste Sorte Grün.');
process.exit(0);
