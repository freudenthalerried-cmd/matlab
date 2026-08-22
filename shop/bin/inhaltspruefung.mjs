#!/usr/bin/env node
/**
 * Inhalte gegen die vorab festgelegten Prüfregeln durchsehen.
 *
 *   node bin/inhaltspruefung.mjs [ordner]
 *
 * Vierter Durchgang der Prüfkette aus `inhalte-und-pruefteam.md` —
 * maschinell, grob und nur unterstützend. Was er meldet, ist ein Verdacht,
 * kein Urteil; die Faktenprüfung gegen die Quelle bleibt Handarbeit.
 * Ohne Argument prüft er die Probedatei, damit nachweisbar bleibt, dass er
 * die Muster findet, die er zu finden behauptet.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pruefeInhalt } from '../src/inhaltspruefung.js';

const hier = dirname(fileURLToPath(import.meta.url));
const ordner = process.argv[2] ?? join(hier, '..', 'inhalte', 'probe');

let dateien;
try {
  dateien = readdirSync(ordner)
    .filter((d) => d.endsWith('.md'))
    .filter((d) => statSync(join(ordner, d)).isFile())
    .sort();
} catch (fehler) {
  console.error(`Inhaltsordner nicht lesbar: ${ordner}`);
  console.error(`  ${fehler.message}`);
  process.exit(2);
}

let absaetzeGesamt = 0;
let trefferGesamt = 0;

for (const datei of dateien) {
  const ergebnis = pruefeInhalt(readFileSync(join(ordner, datei), 'utf8'), datei);
  absaetzeGesamt += ergebnis.absaetze;
  if (ergebnis.sauber) continue;
  trefferGesamt += ergebnis.treffer.length;
  console.log(`\n${datei}`);
  for (const t of ergebnis.treffer) {
    console.log(`  Zeile ${t.zeile}: ${t.auszug}…`);
    for (const v of t.verdacht) console.log(`    → ${v}`);
  }
}

console.log(`\n${dateien.length} Dateien, ${absaetzeGesamt} Absätze geprüft, ${trefferGesamt} mit Verdacht.`);
console.log('Jeder Treffer ist anzusehen, nicht automatisch zu beheben.');
console.log('Die Faktenprüfung gegen die Quelle ersetzt dieses Werkzeug nicht.');
process.exit(0);
