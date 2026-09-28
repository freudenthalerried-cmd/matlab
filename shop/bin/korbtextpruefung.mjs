#!/usr/bin/env node
/**
 * Nennt der Referenzwarenkorb die Artikel, die er zusammenrechnet?
 *
 *   npm run pruefe-korbtext
 *
 * **Der Anlass, 8. September 2026.** Der Korb der Gruppe Mauerwerk trug
 * „128 Planziegel" — geführt ist ein **Hochlochziegel**. Das Wort war zwölf
 * Zeilen weiter oben schon als Keyword zurückgenommen worden.
 *
 * > **Das Wort wurde an einer Stelle zurückgenommen und blieb an der, die
 * > rechnet.**
 *
 * Der Korbtext geht nach außen: Er beschreibt den Warenkorb, aus dem das
 * Höchstgebot gerechnet wird, und lautete wörtlich „128 Planziegel
 * Planziegel".
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { korbtextbefund } from '../src/korbtext.js';
import { wortstaemme } from '../src/shopkern.js';
import { WARENKOERBE, warenkorbText } from './kampagne.mjs';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const katalog = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8'));

const b = korbtextbefund({
  koerbe: WARENKOERBE,
  bezeichnungJeSku: new Map(katalog.artikel.map((a) => [a.sku, a.bezeichnung])),
  staemme: wortstaemme,
  text: warenkorbText,
});

console.log(`\nKorbtexte — ${b.koerbe} Referenzwarenkörbe, ${b.positionen} Positionen\n`);
for (const [gruppe, korb] of Object.entries(WARENKOERBE)) {
  console.log(`  ${gruppe.padEnd(11)} „${warenkorbText(korb)}"`);
}
console.log('');

if (b.sauber) {
  console.log('Jeder Klartext nennt den Artikel, für den er steht — oder sagt, warum nicht.');
  console.log('Der Korbtext geht nach außen und beschreibt zugleich die Rechnung, aus der');
  console.log('das Höchstgebot entsteht. Ein falsches Bauteil darin ist beides falsch.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
