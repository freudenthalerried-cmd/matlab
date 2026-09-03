#!/usr/bin/env node
/**
 * Hält die Lieferantenanfrage gegen die offenen Punkte — und druckt sie.
 *
 * Drei Fragen:
 *
 * 1. **Bleibt ein Punkt der Gruppe „Anfrage an Dritte" ungefragt?** Das ist
 *    die Richtung, die zählt: Ein Punkt ohne Frage bleibt nach dem Gespräch
 *    offen, und niemand merkt es, weil das Gespräch stattgefunden hat.
 * 2. **Steht eine Frage im Brief, die keinen offenen Punkt mehr schließt?**
 *    Jede zusätzliche Frage senkt die Antwortwahrscheinlichkeit aller
 *    übrigen — eine überflüssige kostet die Antwort auf eine nötige.
 * 3. **Darf der Brief überhaupt hinaus?** Ohne Rückantwortadresse ist er eine
 *    Frage ohne Empfänger für die Antwort.
 *
 * Die offenen Punkte kommen aus `offenepunkte.mjs` selbst, nicht aus einer
 * zweiten Zusammenstellung. Ein erster Anlauf an anderer Stelle hat genau das
 * getan und meldete 2 statt 15.
 *
 * **Dieses Werkzeug versendet nichts.** Es druckt einen Text, den der
 * Auftraggeber versenden kann.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gruppen } from './offenepunkte.mjs';
import {
  FRAGEN, punkteOhneFrage, fragenOhnePunkt, erzeugeLieferantenanfrage,
} from '../src/lieferantenanfrage.js';

const hier = dirname(fileURLToPath(import.meta.url));
const lies = (...p) => JSON.parse(readFileSync(join(hier, '..', ...p), 'utf8'));

const betreiber = lies('data', 'betreiber.json');
const lieferanten = lies('data', 'lieferanten.json').lieferanten;
// Der Lieferant, aus dessen Rechnungen der Katalog stammt — nicht der erste
// der Liste: Die drei Radon-Lieferanten davor sind Platzhalter.
const lieferant = lieferanten.find((l) => l.konditionenStand === 'bestaetigt');

const anfragePunkte = gruppen.find((g) => g.id === 'anfrage')?.punkte ?? [];
const ungefragt = punkteOhneFrage(anfragePunkte);
const ueberfluessig = fragenOhnePunkt(anfragePunkte);

if (!lieferant) {
  console.error('Abbruch: kein Lieferant mit bestätigten Konditionen — an wen ginge die Anfrage?');
  process.exit(2);
}
if (anfragePunkte.length === 0) {
  console.error('Abbruch: keine offenen Punkte der Gruppe „Anfrage" — dann prüft dieser Lauf nichts.');
  process.exit(2);
}

const brief = erzeugeLieferantenanfrage({ betreiber, lieferant });

console.log(`Lieferantenanfrage — ${FRAGEN.length} Fragen für ${anfragePunkte.length} offene Punkte`);
console.log(`Empfänger: ${lieferant.name}\n`);

for (const f of FRAGEN) {
  console.log(`  ${f.titel} → schließt ${f.schliesst.length}: ${f.schliesst.join(', ')}`);
}

const befunde = [
  ...ungefragt.map((id) => `${id}: offener Punkt, den keine Frage schließt`),
  ...ueberfluessig.map((id) => `${id}: Frage im Brief, die keinen offenen Punkt mehr schließt`),
];

console.log(`\n--- Der Brief (${brief.zeilen.length} Zeilen) ---\n`);
console.log(brief.text);

if (!brief.versandfaehig) {
  console.log('NICHT VERSANDFÄHIG:');
  for (const g of brief.gruende) console.log(`  · ${g}`);
  console.log('\nBeide Angaben stehen in `npm run offenepunkte` unter „Liegt vor, fehlt nur in');
  // Die Zahl kommt aus der Liste, nicht aus dem Satz. Sie stand hier als
  // „acht" — und war am 3. September neun, an dem Tag, an dem die Palettenfrage
  // dazukam. Ein Satz, der eine Menge behauptet, gehört an die Menge gehängt.
  console.log(`der Datei". Der billigste offene Punkt sperrt das Gespräch, das ${anfragePunkte.length} schließt.`);
}

if (befunde.length > 0) {
  console.log(`\n${befunde.length} Meldung(en):\n`);
  for (const b of befunde) console.log(`  ✗ ${b}`);
  process.exit(1);
}

console.log('\nJeder offene Punkt der Gruppe „Anfrage" wird von einer Frage geschlossen.');
console.log('Versendet wird hier nichts — das bleibt Sache des Auftraggebers.');
process.exit(0);
