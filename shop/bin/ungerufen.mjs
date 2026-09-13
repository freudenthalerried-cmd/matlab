#!/usr/bin/env node
/**
 * Welche Ausfuhr ruft außerhalb der Tests niemand?
 *
 *   npm run pruefe-ungerufen
 *
 * Die Regeln stehen in `src/ungerufen.js`; hier steht nur, welche Dateien
 * gelesen werden. Getrennt aus demselben Grund wie bei der Belegprüfung: Sonst
 * stellt ein Prüfer sein eigenes Prüfobjekt her.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ohneKommentare } from '../src/entkommentieren.js';
import { ungerufeneAusfuehrungen, pruefeUngerufen, UNGERUFEN } from '../src/ungerufen.js';

const WURZEL = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Gelesen wird **ohne Kommentare**. Sonst hätte der Satz „gerufen hat
 * `erzeugeAngebot` niemand" die Funktion als gerufen gemeldet — ein Register,
 * das sich an seiner eigenen Begründung sattsieht.
 *
 * `test/` bleibt draußen, und zwar als ganze Aussage dieses Prüfers: Gesucht
 * wird die Funktion, die **nur** ihre Tests rufen.
 */
const dateien = [
  ...readdirSync(join(WURZEL, 'src')).filter((f) => f.endsWith('.js'))
    .map((f) => ({ name: `src/${f}`, datei: join(WURZEL, 'src', f) })),
  ...readdirSync(join(WURZEL, 'bin')).filter((f) => f.endsWith('.mjs'))
    .map((f) => ({ name: `bin/${f}`, datei: join(WURZEL, 'bin', f) })),
  { name: 'shop-ui.js', datei: join(WURZEL, 'shop-ui.js') },
].map(({ name, datei }) => ({ name, text: ohneKommentare(readFileSync(datei, 'utf8')).text }));

const tatsaechlich = ungerufeneAusfuehrungen(dateien);
const e = pruefeUngerufen(tatsaechlich, UNGERUFEN);

console.log(`\nUngerufene Ausfuhren — ${e.gefunden} gefunden, ${e.gefuehrt} mit Grund geführt\n`);

const nachModul = new Map();
for (const t of tatsaechlich) {
  if (!nachModul.has(t.modul)) nachModul.set(t.modul, []);
  nachModul.get(t.modul).push(t.funktion);
}
for (const [modul, funktionen] of nachModul) {
  const eintrag = UNGERUFEN.find((u) => u.modul === modul);
  console.log(`  ${eintrag ? '·' : '✗'} ${modul.padEnd(26)} ${funktionen.join(', ')}`);
}

if (e.meldungen.length) {
  console.log('');
  for (const m of e.meldungen) console.log(`  ✗ ${m.text} [${m.regel}]`);
  console.log('\nEine Funktion, die nur ihre Tests rufen, ist ein Entwurf und kein');
  console.log('Betriebsmittel. Geprüft ist nicht dasselbe wie angeschlossen.');
  process.exit(1);
}

console.log('\nJede ungerufene Ausfuhr sagt, warum sie es ist — und keine Begründung');
console.log('steht für einen Zustand, den es nicht mehr gibt.');
process.exit(0);
