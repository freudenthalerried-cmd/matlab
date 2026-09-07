#!/usr/bin/env node
/**
 * Trägt jede Zahl auf den Inhaltsseiten eine Fundstelle?
 *
 *   npm run pruefe-zahlen
 *
 * **Der Anlass, 7. September 2026.** `npm run pruefe-quellen` meldet „Aussagen:
 * 9 von 9 belegt" — eine Aussage über das **Register**, nicht über die Seiten.
 * Gemessen wird hier von der anderen Seite: jede Zahl mit Einheit auf den
 * Inhaltsseiten gegen die belegten Aussagen.
 *
 * > **Ein Quellenregister, das nur die eingetragenen Aussagen zählt, ist so
 * > vollständig wie die Eintragung.**
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { zahlenbefund } from '../src/zahlenherkunft.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ORDNER = join(SHOP, 'inhalte');

const dateien = [];
const gehe = (o) => {
  for (const n of readdirSync(o)) {
    const v = join(o, n);
    if (statSync(v).isDirectory()) gehe(v);
    else if (n.endsWith('.md')) dateien.push(v);
  }
};
gehe(ORDNER);

const seiten = dateien.map((d) => ({
  datei: relative(ORDNER, d),
  text: readFileSync(d, 'utf8'),
}));

const { aussagen } = JSON.parse(readFileSync(join(ORDNER, 'quellen.json'), 'utf8'));
const b = zahlenbefund({ seiten, aussagen });

console.log(`\nZahlen der Inhaltsseiten — ${b.seiten} Seiten, ${b.zahlen} Zahlen mit Einheit\n`);
console.log(`  ${b.zahlen - b.meldungen.length} belegt oder begründet, `
  + `${b.ohneFundstelle} Werte ohne Fundstellenpflicht\n`);

if (b.sauber) {
  console.log('Jede Zahl steht in einer belegten Aussage — oder sagt, warum sie keine braucht.');
  console.log('Diese Seiten stehen da, damit ein Handwerker den richtigen Artikel bestellt:');
  console.log('Ein falscher Gefällewert kostet eine Kanalleitung, keine Nachbesserung.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
