#!/usr/bin/env node
/**
 * Hält die Filter- und Sortierfähigkeiten des Kerns gegen die Oberfläche.
 *
 *   npm run pruefe-filter
 *
 * Gemessen wird nichts am Aussehen und nichts am Gefallen, sondern genau eine
 * Frage: **Kommt beim Kunden an, was der Kern kann?** Der Grund steht im Kopf
 * von `src/filterangebot.js` — eine Preisspanne lag wochenlang fertig im Kern,
 * mit eigener Wertermittlung und einem Platz im Zustand der Oberfläche, und
 * kein Bedienelement setzte sie.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { SORTIERUNGEN } from '../src/shopkern.js';
import { ANGEBOT, filterangebotbefund } from '../src/filterangebot.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const kernPfad = join(SHOP, 'src', 'shopkern.js');
const uiPfad = join(SHOP, 'shop-ui.js');

const e = filterangebotbefund({
  shopkern: readFileSync(kernPfad, 'utf8'),
  oberflaeche: readFileSync(uiPfad, 'utf8'),
  sortierungen: SORTIERUNGEN.map((s) => s.id),
  angebot: ANGEBOT,
});

console.log(`\nFilterangebot — ${e.gemessen} Fähigkeiten gegen ${relative(SHOP, uiPfad)}`);
if (e.felder) console.log(`  Der Kern wertet aus: ${e.felder.join(', ')}`);
console.log(`  Sortierungen: ${SORTIERUNGEN.map((s) => s.id).join(', ')}\n`);

for (const eintrag of ANGEBOT) {
  const wie = eintrag.bedienelement ? `„${eintrag.bedienelement}"` : 'nicht angeboten, mit Grund';
  console.log(`  · ${eintrag.feld.padEnd(14)} ${wie}`);
}
console.log('');

if (e.sauber) {
  console.log(`Alle ${e.gemessen} Fähigkeiten kommen in der Leiste an.`);
  console.log('Ein Filter, den der Kern kann und die Oberfläche nicht anbietet, ist kein Filter.');
  process.exit(0);
}

console.log(`${e.probleme.length} Meldung(en):\n`);
for (const p of e.probleme) {
  console.log(`  ✗ ${p.feld ?? ''}  [${p.art}]`);
  console.log(`      ${p.satz}`);
}
console.log('\nZwei richtige Auswege: das Bedienelement bauen, oder in src/filterangebot.js');
console.log('einen Grund eintragen, warum es nicht gebaut wird. Der Eintrag zu löschen wäre');
console.log('der falsche — dann prüft niemand mehr, ob die Fähigkeit beim Kunden ankommt.');
process.exit(1);
