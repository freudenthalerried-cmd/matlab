#!/usr/bin/env node
/**
 * Die Suchvolumen-Messung des Messmonats auswerten — Prüfung B, Gate 15.
 *
 *   node bin/suchvolumen.mjs [messung.json]
 *
 * Ohne Argument läuft die fiktive Beispielmessung — als Probelauf, wie bei
 * Import und Auswertung. Die Regeln stehen in `suchauswertung.js` und sind
 * vorab festgelegt (Gate 17); dieses Werkzeug trägt nur vor, es entscheidet
 * nichts selbst. Die leere Messliste zum Ausfüllen liegt in
 * `data/messliste.json`, die Werkzeugwahl in
 * `docs/baustoff-shop/werkzeugwahl-suchvolumen.md`.
 */

import { readFileSync } from 'node:fs';
import {
  pruefeMessung,
  werteSuchmessungAus,
  CLUSTER_MINDESTVOLUMEN,
} from '../src/suchauswertung.js';

const datei = process.argv[2] ?? new URL('../beispiel/messung-beispiel.json', import.meta.url);
let daten;
try {
  daten = JSON.parse(readFileSync(datei, 'utf8'));
} catch (fehler) {
  console.error(`Messdatei nicht lesbar: ${datei}`);
  console.error(`  ${fehler.message}`);
  console.error('Erwartet wird eine JSON-Datei nach dem Muster von data/messliste.json.');
  process.exit(1);
}

const pct = (n) => (n * 100).toFixed(0) + ' %';

console.log(`\nMessdatei: ${datei}`);
if (daten._hinweis) console.log(`Hinweis: ${daten._hinweis}\n`);

const pruefung = pruefeMessung(daten);
if (!pruefung.vollstaendig) {
  console.log('Messung unvollständig:');
  for (const f of pruefung.fehlend) console.log(`  · ${f}`);
  console.log('\nGewertet wird trotzdem — fehlende Werte zählen nicht mit.');
}

const ergebnis = werteSuchmessungAus(daten);

console.log('Cluster:');
for (const c of ergebnis.cluster) {
  const stand = c.bestanden
    ? '✓'
    : c.genugVolumen
      ? '✗ (Wettbewerb)'
      : '✗ (Volumen)';
  console.log(
    `  ${stand} ${c.name} [Gruppe ${c.gruppe}] — ${c.summe} Suchen/Monat, ` +
      `${pct(c.anteilHoch)} des Volumens auf hart umkämpften Begriffen (Schwelle je Cluster: ${CLUSTER_MINDESTVOLUMEN})`,
  );
}

console.log(`\nPrüfung B: ${ergebnis.pruefungB ? 'BESTANDEN' : 'NICHT BESTANDEN'}`);
console.log(`  bestandene Cluster: ${ergebnis.bestandene}, kumuliert: ${ergebnis.kumuliert} Suchen/Monat`);
console.log(`  radonspezifische Seite bestanden (Gruppe A oder B): ${ergebnis.radonseite ? 'ja' : 'NEIN'}`);
if (!ergebnis.pruefungB) {
  console.log('  es fehlt:');
  for (const f of ergebnis.fehlend) console.log(`    · ${f}`);
}

console.log('\nDie Regeln stehen vorab fest (Gate 17). Dieses Werkzeug trägt vor, es entscheidet nicht.');
