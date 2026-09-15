#!/usr/bin/env node
/**
 * Was der Besteller liest, wenn die Bestellung nicht durchgeht.
 *
 *   npm run pruefe-abweisungen
 *
 * Warum es diese Messung gibt, steht im Kopf von `src/abweisung.js` — dort
 * einmal.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ABWEISUNGEN, WERKSTATTWOERTER, abweisungsbefund } from '../src/abweisung.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SKRIPT = join(SHOP, 'bestellung.php');

const quelle = readFileSync(SKRIPT, 'utf8');
const b = abweisungsbefund(quelle);

console.log(`\nAbweisungen — ${b.stellen} Stellen im Empfangsskript, `
  + `${b.eintraege} Einträge im Register`);
console.log(`${WERKSTATTWOERTER.length} Werkstattwörter, die in keinem Satz an den `
  + 'Besteller stehen dürfen.\n');

if (b.meldungen.length) {
  for (const m of b.meldungen) {
    console.log(`  ✗ ${m.text}`);
    console.log(`      [${m.regel}]`);
  }
  console.log(`\n${b.meldungen.length} Meldung(en).`);
  process.exit(1);
}

const eigene = ABWEISUNGEN.filter((e) => e.unsereSchuld).length;
console.log(`Keine Meldung. Jede Abweisung nennt den nächsten Schritt, und die ${eigene}, `
  + 'die wir verschulden, sagen es auch.');
console.log('Eine Abweisung, die nur sagt, was schiefging, lässt den Kunden mit seinem Geld');
console.log('in der Hand stehen.');
process.exit(0);
