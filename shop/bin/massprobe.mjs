#!/usr/bin/env node
/**
 * Wie viele Artikelnamen tragen ein eindeutiges Maß?
 *
 *   npm run pruefe-masse
 *
 * **Die Frage stammt aus der Runde vom 13. September**, die beziffert hat,
 * dass 21 von 46 maschinenlesbaren Beschreibungen über die Ware selbst nichts
 * sagen. Der naheliegende Ausweg — die Maße aus den Bezeichnungen lesen —
 * wurde dort ausdrücklich nicht genommen, mit einer Bedingung:
 *
 * > *Wer es dennoch tut, misst zuerst, wie viele der 46 Namen eindeutig sind —
 * > und nicht, wie viele sich irgendwie lesen lassen.*
 *
 * Dieser Lauf ist die Messung. Er baut nichts und ändert nichts; er sagt, was
 * ein Leser über die Namen wert wäre.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { massbefund, masseImNamen } from '../src/bezeichnungsmass.js';
import { beschreibungsbefund } from '../src/maschinenlesbar.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const katalog = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8'));
const artikel = katalog.artikel;

const b = massbefund(artikel);
const nachSku = new Map(artikel.map((a) => [a.sku, a]));

console.log(`\nMaße in den Bezeichnungen — ${b.artikel} Artikelnamen gelesen\n`);
console.log(`  ohne jedes Maß        ${String(b.ohne).padStart(3)}`);
console.log(`  mehrdeutig            ${String(b.mehrdeutig).padStart(3)}`);
console.log(`  eindeutig             ${String(b.eindeutig).padStart(3)}`
  + `   (${(b.anteilEindeutig * 100).toFixed(0)} %)`);

console.log('\n  Eindeutig lesbar:');
for (const sku of b.skus.eindeutig) {
  const a = nachSku.get(sku);
  const [mass] = masseImNamen(a.bezeichnung).masse;
  console.log(`    ${sku}  ${a.bezeichnung}  →  ${mass.zahl} ${mass.einheit}`);
}

/*
 * Und die Zahl, auf die es ankommt: Wie viele Beschreibungen ohne Angabe über
 * die Ware würde ein solcher Leser überhaupt erreichen? Ein Name, dessen Maß
 * die Beschreibung schon nennt, bringt nichts.
 */
const beschreibung = beschreibungsbefund(artikel);
const ohne = new Set(beschreibung.ohneWareneigenschaftSkus);
const gewinn = b.skus.eindeutig.filter((sku) => ohne.has(sku));

console.log(`\n  Beschreibungen ohne Angabe über die Ware   ${beschreibung.ohneWareneigenschaft}`);
console.log(`  davon durch einen Namensleser erreichbar   ${gewinn.length}`);
for (const sku of gewinn) console.log(`    ${sku}  ${nachSku.get(sku).bezeichnung}`);

if (b.meldungen.length) {
  console.log('');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Das Urteil „acht von sechsundvierzig" gilt für den Katalog, an dem es gemessen');
  console.log('wurde. Ein anderer Bestand verlangt eine andere Messung, keine Übernahme.');
  process.exit(1);
}

console.log('');
// **Seit dem 15. September steht der Leser im Bau.** Bis dahin war diese Zahl
// eine Vorhersage — „senkte die 21 um 3" —, jetzt ist sie ein Rest: Was der
// Leser erreichen konnte, hat er erreicht, und `gewinn` sagt, was noch offen
// wäre. Eine Vorhersage, die eingetreten ist, gehört umgeschrieben und nicht
// weiter als Vorhersage geführt.
console.log(`Ein Leser über die Namen ist für ${b.eindeutig} von ${b.artikel} richtig und steht seit dem`);
console.log(`15. September im Bau. Offen sind noch ${gewinn.length} von ${beschreibung.ohneWareneigenschaft}`);
console.log(`Beschreibungen ohne Angabe über die Ware. Die übrigen ${b.mehrdeutig} Namen tragen mehrere`);
console.log('Zahlen ohne Rolle, Typenbezeichnungen, die wie Maße aussehen, oder zwei Zahlen');
console.log('unter einer Einheit. Ein Werkzeug, das in 17 von 100 Fällen recht hat, ist keine');
console.log('Datenquelle — deshalb liest der Bau nur die eindeutigen.');
process.exit(0);
