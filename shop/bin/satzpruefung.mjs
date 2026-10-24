#!/usr/bin/env node
/**
 * Steht ein Satz in mehr als einer Quelldatei?
 *
 *   npm run pruefe-saetze
 *
 * **Der Anlass, 14. September 2026.** Ein Satz steht in diesem Bestand seit dem
 * 8. September und ist seither vier Runden lang durch Zufall wiedergefunden
 * worden — am 8., 11., 13. und 14.:
 *
 * > **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**
 *
 * Für **Zahlen** gibt es das Zwillingsregister seit dem 11. September. Für
 * **Sätze** gab es keines — und Sätze sind der häufigere Fall: Eine Zahl wird
 * abgeschrieben, weil sie kurz ist; ein Absatz wird kopiert, weil er stimmt.
 *
 * Das Register steht in `src/zwillingssaetze.js`.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { satzbefund, WIEDERHOLUNG_GEPRUEFT, WIEDERHOLUNGEN_HOECHSTENS } from '../src/zwillingssaetze.js';
import { zuWenigQuellen } from '../src/prueferurteil.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

function dateien(ordner, aus = []) {
  for (const name of readdirSync(ordner).sort()) {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) continue;
    if (/\.(js|mjs)$/.test(name)) aus.push(pfad);
  }
  return aus;
}

const quellen = new Map();
for (const ordner of ['src', 'bin']) {
  for (const pfad of dateien(join(SHOP, ordner))) {
    quellen.set(relative(SHOP, pfad), readFileSync(pfad, 'utf8'));
  }
}

if (quellen.size < 80) {
  console.error(zuWenigQuellen(quellen.size));
  process.exit(2);
}

const b = satzbefund(quellen);

console.log(`\nZwillingssätze — ${b.saetze} Sätze ab acht Wörtern in ${quellen.size} Quelldateien\n`);
console.log(`  Leitfragen (Modul + Prüfer) ${String(b.leitfragen.length).padStart(4)}`);
console.log(`  begründete Wiederholungen   ${String(WIEDERHOLUNG_GEPRUEFT.length).padStart(4)}`);
console.log(`  in mehr als einer Datei     ${String(b.mehrfach.length).padStart(4)}`
  + `   (Schranke ${WIEDERHOLUNGEN_HOECHSTENS})`);

if (b.mehrfach.length) {
  console.log('\n  Die häufigsten:\n');
  for (const m of b.mehrfach.slice(0, 8)) {
    console.log(`    [${m.dateien.length}] ${m.satz.length > 88 ? `${m.satz.slice(0, 87)}…` : m.satz}`);
    console.log(`         ${m.dateien.join(', ')}`);
  }
}

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Ein Absatz wird kopiert, weil er stimmt — und bleibt stehen, wenn er es nicht mehr tut.');
  process.exit(1);
}

console.log('');
console.log(`Satzabgleich: ${b.mehrfach.length} Wiederholungen unter der Schranke, `
  + `${WIEDERHOLUNG_GEPRUEFT.length} mit Grund geführt`);
console.log('Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.');
process.exit(0);
