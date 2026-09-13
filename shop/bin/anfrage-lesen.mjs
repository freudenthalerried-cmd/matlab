#!/usr/bin/env node
/**
 * Eine eingegangene Anfrage zurücklesen — statt sie abzutippen.
 *
 *   npm run anfrage-lesen -- mail.txt
 *   pbpaste | npm run anfrage-lesen
 *
 * **Der Anlass, 3. September 2026.** Der Anfragebetrieb kostet fünfzehn
 * Minuten je Anfrage; drei davon gehen für „lesen und den Positionen
 * zuordnen" drauf. Das ist die eine Stelle, an der ein Tippfehler falsche Ware
 * auf eine Baustelle bringt — und der Text stammt aus diesem Shop, hat ein
 * geprüftes Format und gehört deshalb gelesen.
 *
 * **Was dieses Werkzeug nicht tut:** raten. Es rechnet den zurückgelesenen
 * Warenkorb nach und hält ihn gegen die Summen im Text. Weichen sie ab, gibt
 * es den Grund aus und endet rot. Ein Leser, der bei Abweichung weitermacht,
 * hat die Autorität einer Maschine und die Verlässlichkeit einer Vermutung.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { leseAnfrage } from '../src/anfragelesen.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';
import { oeffentlicherArtikel, oeffentlicherLieferant } from '../src/shopkern.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (...t) => JSON.parse(readFileSync(join(...t), 'utf8'));
// Dieselbe Schreibweise wie auf der Seite und im Beleg — hiesige Trennzeichen.
const euro = (n) => n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const datei = process.argv[2];
const text = datei ? readFileSync(datei, 'utf8') : readFileSync(0, 'utf8');
if (!text.trim()) {
  console.error('Kein Text. Entweder eine Datei angeben oder den Mailtext hereinleiten.');
  process.exit(2);
}

const betreiber = lies(SHOP, 'data', 'betreiber.json');
const katalog = ladeBaustoffkatalog(
  lies(SHOP, 'data', 'katalog-baustoff.json'),
  lies(REPO, 'preise', 'baustoff-preise.json'),
  lies(SHOP, 'data', 'lieferanten.json'),
);

// Derselbe Zuschnitt wie in der Seite: Der Leser bekommt, was ein Kunde sieht.
const daten = {
  artikel: katalog.artikel.map(oeffentlicherArtikel),
  lieferanten: [...katalog.lieferantenById.values()].map(oeffentlicherLieferant),
  mindestbestellwertNetto: betreiber.mindestbestellwertNetto ?? null,
};

const e = leseAnfrage(text, (zeilen) => kundenWarenkorb(zeilen, daten));

console.log(`\nAnfrage zurückgelesen — ${e.zeilen.length} Position(en)`);
if (e.bezirk) console.log(`Baustelle im Bezirk: ${e.bezirk}`);
console.log('');

for (const z of e.zeilen) {
  const a = daten.artikel.find((x) => x.sku === z.sku);
  console.log(`  ${String(z.menge).replace('.', ',').padStart(6)} × ${z.sku.padEnd(12)}`
    + `${a ? a.bezeichnung.slice(0, 52) : 'UNBEKANNT'}`);
}

for (const m of e.meldungen) console.log(`  · ${m}`);

if (!e.gelesen) {
  console.log(`\n✗ Nicht übernommen.\n  ${e.grund}`);
  console.log('\nEin Leser, der bei Abweichung weitermacht, hat die Autorität einer Maschine');
  console.log('und die Verlässlichkeit einer Vermutung. Diese Anfrage gehört angesehen.');
  process.exit(1);
}

console.log(`\n  Warenwert   ${euro(e.rechnung.warenwertNetto).padStart(10)} €`);
console.log(`  Fracht      ${euro(e.rechnung.frachtNetto).padStart(10)} €`);
console.log(`  Brutto      ${euro(e.rechnung.bruttoGesamt).padStart(10)} €`);
console.log('\n✓ Nachgerechnet: Die Summen im Text stimmen mit dem Warenkorb überein.');
console.log('  Die Positionen oben lassen sich unverändert in ein Angebot übernehmen.');
