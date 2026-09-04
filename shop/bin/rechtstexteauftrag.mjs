#!/usr/bin/env node
/**
 * Der fertige Auftrag an den Rechtstexteanbieter.
 *
 *   npm run rechtstexte-auftrag
 *
 * Die Regeln stehen in `src/rechtstexteauftrag.js`; hier steht nur, woraus der
 * Brief gemacht wird. **Versendet wird nichts** — das Beauftragen löst eine
 * Ausgabe aus und bleibt Sache des Auftraggebers.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  PFLICHTTEXTE, AGB_GLIEDERUNG, DATENSCHUTZ_GLIEDERUNG, WEBSITE_VERARBEITUNG,
  B2B_ABGRENZUNG, IMPRESSUMSFELDER,
} from '../src/rechtstexte.js';
import { DATENFLUESSE } from '../src/abgleich.js';
import { erzeugeRechtstexteauftrag } from '../src/rechtstexteauftrag.js';

const WURZEL = dirname(dirname(fileURLToPath(import.meta.url)));
const betreiber = JSON.parse(readFileSync(join(WURZEL, 'data', 'betreiber.json'), 'utf8'));

const offen = IMPRESSUMSFELDER
  .filter((f) => typeof betreiber[f.feld] !== 'string' || betreiber[f.feld].trim() === '')
  .map((f) => f.bezeichnung);

const e = erzeugeRechtstexteauftrag({
  betreiber,
  pflichttexte: PFLICHTTEXTE,
  agbGliederung: AGB_GLIEDERUNG,
  datenschutzGliederung: DATENSCHUTZ_GLIEDERUNG,
  websiteVerarbeitung: WEBSITE_VERARBEITUNG,
  b2b: B2B_ABGRENZUNG,
  datenfluesse: DATENFLUESSE,
  offeneImpressumsfelder: offen,
});

console.log(`\n${'—'.repeat(76)}`);
console.log(e.text);
console.log(`${'—'.repeat(76)}\n`);

console.log(`Stufe 1 (ab dem ersten Besuch): ${e.stufe1.join(', ')}`);
console.log(`Stufe 2 (ab der ersten Bestellung): ${e.stufe2.join(', ')}`);
console.log(`${e.zeilen.length} Zeilen aus sechs Registern — kein Satz davon ist ein Rechtstext.`);

if (!e.versandfaehig) {
  console.log('\nNicht versandfähig:');
  for (const g of e.gruende) console.log(`  · ${g}`);
  console.log('\nEin Brief ohne Rückantwortadresse ist eine Frage ohne Empfänger für die Antwort.');
  process.exit(1);
}

console.log('\nVersendet wird hier nichts. Ein Auftrag löst eine Ausgabe aus, und die entscheidet');
console.log('der Auftraggeber.');
process.exit(0);
