#!/usr/bin/env node
/**
 * Stimmt die Sperrguteinstufung mit dem überein, was der Katalog weiß?
 *
 *   npm run pruefe-sperrgut
 *
 * **Der Anlass, 5. September 2026.** Auf der Seite des PVC-Kanalbogens stehen
 * „Gewicht 0,285 kg je Stück, aus dem Lieferschein" und „Palettierte Ware. Sie
 * wird mit dem Kran entladen" übereinander — seit es die Seite gibt, und
 * niemand hat die beiden je nebeneinandergehalten.
 *
 * Die Einstufung stammt aus der **Warengruppe**: Dämmung, Kamin, Kanal und
 * Mauerwerk gelten als Sperrgut. Alle 46 tragen `sperrgutQuelle:
 * "eingeschaetzt"`; belegt ist keine einzige. Sie entscheidet 7,50 € je
 * Position auf der Rechnung des Kunden.
 *
 * Dieser Prüfer stuft **nichts um**. Er hält die Einstufung gegen die
 * Tatsachen, die der Katalog hat, und verlangt für jeden Widerspruch einen
 * Grund.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  einstufungsbefund, HINGENOMMEN, HANDGEWICHT_KG, SPERRGUT_GRUPPEN, GEMEINSAMER_GRUND,
} from '../src/sperrguteinstufung.js';

const wurzel = dirname(dirname(fileURLToPath(import.meta.url)));
const datei = process.argv[2] ? process.argv[2] : join(wurzel, 'data', 'katalog-baustoff.json');
const katalog = JSON.parse(readFileSync(datei, 'utf8'));

const b = einstufungsbefund(katalog.artikel ?? []);

console.log(`Sperrguteinstufung: ${b.artikel} Artikel, ${b.mitGewicht} mit belegtem Gewicht`);
console.log(`Geschätzt aus der Warengruppe (${SPERRGUT_GRUPPEN.join(', ')}); `
  + `Handgrenze ${HANDGEWICHT_KG} kg.\n`);

console.log(`  Ohne belegte Einstufung   ${b.unbelegt} von ${b.artikel}`);
console.log(`  Widersprüche zum Gewicht  ${b.widersprueche}, davon ${HINGENOMMEN.length} mit Grund`);

// Der Fall je Zeile, der gemeinsame Grund einmal darunter. Viermal derselbe
// Absatz wäre eine Ausgabe, die niemand liest — und ungelesen ist ungeprüft.
if (HINGENOMMEN.length) {
  console.log('\n  Hingenommen, mit Grund:\n');
  for (const h of HINGENOMMEN) console.log(`    · ${h.sku}  ${h.kurz ?? ''}`);
  console.log(`\n    ${GEMEINSAMER_GRUND.replace(/(.{78}\s)/g, '$1\n    ')}`);
}

if (!b.sauber) {
  console.error(`\n${b.meldungen.length} Einstufung(en) ohne Grund:\n`);
  for (const m of b.meldungen) console.error(`  ✗ ${m.text}  (${m.regel})`);
  console.error('\nEine Einstufung, die Geld kostet, gehört belegt oder begründet.');
  process.exit(1);
}

console.log('\nJeder Widerspruch zwischen Gewicht und Einstufung trägt seinen Grund.');
console.log('Belegt ist keine einzige Einstufung — das entscheidet die Palettenfrage');
console.log('an den Lieferanten, nicht dieses Werkzeug.');
process.exit(0);
