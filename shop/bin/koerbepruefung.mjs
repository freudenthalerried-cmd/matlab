#!/usr/bin/env node
/**
 * Tragen die Referenzwarenkörbe die Bestellung, die eine Suche auslöst?
 *
 *   npm run pruefe-koerbe
 *
 * **Der Anlass, 6. September 2026.** Über `WARENKOERBE` steht seit dem
 * 1. September: *„Wer je Artikel bietet, bietet auf den Ein-Sack-Kunden …
 * Gerechnet wird deshalb auf die Bestellung, die eine Suche tatsächlich
 * auslöst."* Gezählt gegen die eigenen Systemlisten lagen im Korb der Gruppe
 * „Dämmung" **eine von vier** geführten Positionen.
 *
 * > **Die Regel stand über der Liste, und die Liste hielt sie nicht.**
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { WARENKOERBE } from './kampagne.mjs';
import { korbbefund } from '../src/warenkorbdeckung.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ORDNER = join(SHOP, 'inhalte', 'system');

const systemlisten = {};
for (const datei of readdirSync(ORDNER).filter((d) => d.endsWith('.md'))) {
  const text = readFileSync(join(ORDNER, datei), 'utf8');
  const gruppe = /^gruppe:\s*(.+)$/m.exec(text)?.[1]?.trim();
  if (gruppe) systemlisten[gruppe] = text;
}

const b = korbbefund({ koerbe: WARENKOERBE, systemlisten });

console.log(`\nReferenzwarenkörbe — ${b.uebersicht.length} Systemlisten gegen ihre Körbe\n`);
console.log('  Gruppe      Positionen  geführt  im Korb  mit Grund');
for (const u of b.uebersicht) {
  console.log(`  ${u.gruppe.padEnd(12)}${String(u.positionen).padStart(6)}`
    + `${String(u.gefuehrt).padStart(9)}${String(u.imKorb).padStart(9)}${String(u.mitGrund).padStart(11)}`);
}
console.log('');

if (b.sauber) {
  console.log('Jede geführte Position liegt im Korb — oder sagt, warum nicht.');
  console.log('Der Deckungsbeitrag des Korbs trägt das Gebot: Ein zu kleiner Korb ergibt');
  console.log('ein zu kleines Gebot, und verlorene Auktionen fallen in keiner Abrechnung auf.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
