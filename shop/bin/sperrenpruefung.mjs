#!/usr/bin/env node
/**
 * Zeigt irgendeine Probe, dass die Sperren auch wieder aufmachen?
 *
 *   npm run pruefe-sperren
 *
 * **Der Anlass, 5. September 2026.** `darfBestaetigtWerden` hat sechs
 * Sperrgründe und hatte sechs Proben — jede prüfte, dass **ihr** Grund kommt.
 * Keine zeigte je, dass die Sperre bei vollständiger Lage aufgeht.
 *
 * > **Eine Sperre, von der niemand gezeigt hat, dass sie aufmacht, könnte
 * > jeden Auftrag abweisen, ohne dass eine Probe es merkt.**
 *
 * Die Liste kommt aus den Quelldateien und nicht aus einem Register: Dieses
 * Haus nennt jede Sperre `darfXWerden`, und diese Benennung ist das Register.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { sperrenDerDatei, sperrenbefund, SICHTWEITE } from '../src/sperren.js';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, '..');
// Beide Ordner lassen sich übergeben — sonst wäre nicht nachweisbar, dass der
// Prüfer die Fälle findet, die er zu finden behauptet.
const quellordner = process.argv[2] ? process.argv[2] : join(wurzel, 'src');
const testordner = process.argv[3] ? process.argv[3] : join(wurzel, 'test');

const jsDateien = (ordner) => readdirSync(ordner).filter((d) => d.endsWith('.js')).sort();

const sperren = jsDateien(quellordner).flatMap(
  (d) => sperrenDerDatei(`src/${d}`, readFileSync(join(quellordner, d), 'utf8')),
);
const zeilen = jsDateien(testordner).flatMap(
  (d) => readFileSync(join(testordner, d), 'utf8').split('\n'),
);

const befund = sperrenbefund(sperren, zeilen);

console.log(`Sperrenabgleich: ${befund.sperren} Sperren gegen ${zeilen.length} Testzeilen`);
console.log(`Sichtweite ${SICHTWEITE} Zeilen zwischen Aufruf und Zusicherung.\n`);

for (const s of sperren) {
  const offen = befund.meldungen.find((m) => m.text.startsWith(`${s.name} `)
    || m.text.startsWith(`${s.name}:`));
  console.log(`  ${offen ? '✗' : '✓'} ${s.name}  (${s.datei}, Urteil: ${s.feld ?? '—'})`);
  if (offen) console.log(`      ${offen.text.replace(/^\S+ /, '')}`);
}

if (!befund.sauber) {
  console.error(`\n${befund.meldungen.length} Sperre(n) ohne Nachweis, dass sie aufmachen.`);
  console.error('Eine Sperre, die nie aufgeht, weist jeden Auftrag ab — und keine Probe merkt es.');
  console.error('Wer begründet darauf verzichtet, trägt sie in OHNE_GRUENEN_FALL ein.');
  process.exit(1);
}

console.log(`\n${befund.nachgewiesen} von ${befund.sperren} Sperren zeigen ihren grünen Fall.`);
if (befund.begruendet) console.log(`${befund.begruendet} weitere mit begründetem Verzicht.`);
console.log('Wer eine Sperre baut, schuldet beide Richtungen: dass sie hält und dass sie nachgibt.');
process.exit(0);
