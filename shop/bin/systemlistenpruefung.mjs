#!/usr/bin/env node
/**
 * Halten die Stücklisten, was sie über sich selbst sagen?
 *
 *   npm run pruefe-systemlisten
 *
 * **Der Anlass, 5. September 2026.** `kellerwand-perimeter` versprach im
 * Vorspann „fünf davon aus unserem Sortiment" und schrieb zwanzig Zeilen
 * weiter „Drei der sieben Positionen führen wir nicht". Fünf und vier — und
 * die fünfte war ausgerechnet die Position, die die Tabelle als „nicht im
 * Sortiment" kennzeichnet und die zugleich unter „wird oft vergessen" steht.
 *
 * Geprüft wird nur, was die Seite **über sich selbst** sagt. Ob die Liste
 * fachlich vollständig ist, entscheidet kein Prüfer.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { liesSystemliste, systemlistenbefund } from '../src/systemlisten.js';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, '..');
const ordner = process.argv[2] ? process.argv[2] : join(wurzel, 'inhalte', 'system');

if (!existsSync(ordner)) {
  console.error(`Abbruch: ${ordner} fehlt.`);
  process.exit(2);
}

const katalog = JSON.parse(readFileSync(join(wurzel, 'data', 'katalog-baustoff.json'), 'utf8'));
const katalogSkus = new Set(katalog.artikel.map((a) => a.sku));

const listen = readdirSync(ordner)
  .filter((d) => d.endsWith('.md'))
  .sort()
  .map((d) => ({ name: d, gelesen: liesSystemliste(readFileSync(join(ordner, d), 'utf8')) }));

const b = systemlistenbefund(listen, katalogSkus);

console.log(`Systemlisten: ${b.listen} Listen mit ${b.positionen} Positionen`);
console.log(`${b.nichtGefuehrt} davon ausdrücklich nicht im Sortiment und trotzdem aufgeführt.\n`);

for (const l of listen) {
  const g = l.gelesen;
  console.log(`  ${g.positionen - g.ohneSortiment} von ${g.positionen} lieferbar, `
    + `${g.skus.length} Artikel — ${l.name}`);
}

if (!b.sauber) {
  console.error(`\n${b.meldungen.length} Meldung(en):\n`);
  for (const m of b.meldungen) console.error(`  ✗ ${m.text}  (${m.regel})`);
  console.error('\nEine Stückliste, die über sich selbst falsch rechnet, ist die eine Sorte');
  console.error('Text, bei der ein Fehler direkt auf der Baustelle ankommt.');
  process.exit(1);
}

console.log('\nJede Liste sagt richtig, wie viele Positionen sie führt und wie viele davon');
console.log('nicht aus dem Sortiment kommen. Was fehlt, steht drauf — das ist der Zweck.');
process.exit(0);
