#!/usr/bin/env node
/**
 * Erzeugt die Dateien, die im Wurzelverzeichnis der Website liegen müssen.
 *
 *   node bin/veroeffentlichung.mjs [--schreiben]
 *
 * Ohne `--schreiben` wird nur berichtet — wie beim Preislisten-Import, und aus
 * demselben Grund: Was ins Wurzelverzeichnis geht, ist nach außen sichtbar.
 * Der Feed wird zusätzlich auf Vollständigkeit geprüft; solange Platzhalter
 * im Katalog stehen, bleibt er leer, und das wird gesagt statt verschwiegen.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { robotsTxt, llmsTxt, katalogFeed } from '../src/maschinenlesbar.js';
import { ladeKatalog } from '../src/warenkorb.js';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, '..');
const schreiben = process.argv.includes('--schreiben');
const ziel = join(wurzel, 'veroeffentlichung');

const daten = {
  lieferanten: JSON.parse(readFileSync(join(wurzel, 'data', 'lieferanten.json'), 'utf8')),
  artikel: JSON.parse(readFileSync(join(wurzel, 'data', 'artikel.json'), 'utf8')),
};
const katalog = ladeKatalog(daten, 0.35);

// Firmendaten und Liefergebiet liegen noch nicht vor. Sie werden als Lücke
// ausgewiesen, nicht erfunden — dieselbe Regel wie im Impressum-Gerüst.
const LUECKEN = [];
const firmenname = process.env.SHOP_NAME ?? null;
const bezirke = (process.env.SHOP_BEZIRKE ?? '').split(',').map((b) => b.trim()).filter(Boolean);
if (!firmenname) LUECKEN.push('Firmenname (SHOP_NAME) — die Entität braucht überall dieselbe Schreibweise');
if (bezirke.length === 0) LUECKEN.push('Liefergebiet (SHOP_BEZIRKE) — als Bezirksliste, nicht als Satz');

const robots = robotsTxt({ suche: true, training: false });
const llms = llmsTxt({
  name: firmenname ?? '[[ FIRMENNAME — FEHLT ]]',
  beschreibung: 'Baustoffe für Handwerksbetriebe, Lieferung regional.',
  liefergebiet: { land: 'AT', bezirke },
  hinweise: ['Alle Preise verstehen sich netto für Unternehmer.'],
  seiten: [],
});
const feed = katalogFeed(katalog.artikel, { liefergebiet: { land: 'AT', bezirke } });

console.log(`\nKatalog: ${katalog.artikel.length} Artikel`);
console.log(`Feed:    ${feed.anzahl} veröffentlichbar, ${feed.zurueckgehalten.length} zurückgehalten`);
if (feed.zurueckgehalten.length) {
  const gruende = new Set(feed.zurueckgehalten.flatMap((z) => z.gruende));
  for (const g of gruende) console.log(`  · ${g}`);
}
if (LUECKEN.length) {
  console.log('\nEs fehlen Angaben, die nicht erfunden werden:');
  for (const l of LUECKEN) console.log(`  · ${l}`);
}

if (!schreiben) {
  console.log('\nProbelauf. Zum Schreiben mit --schreiben aufrufen.');
  process.exit(0);
}
if (LUECKEN.length) {
  console.error('\nAbbruch: Es wird nichts veröffentlicht, solange Pflichtangaben fehlen.');
  process.exit(1);
}

mkdirSync(ziel, { recursive: true });
writeFileSync(join(ziel, 'robots.txt'), robots);
writeFileSync(join(ziel, 'llms.txt'), llms);
writeFileSync(join(ziel, 'feed.jsonl'), feed.zeilen.map((z) => JSON.stringify(z)).join('\n') + '\n');
console.log(`\nGeschrieben nach ${ziel}: robots.txt, llms.txt, feed.jsonl (${feed.anzahl} Zeilen)`);
