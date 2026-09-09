#!/usr/bin/env node
/**
 * Welche Uhr liest, wer ein Datum schreibt?
 *
 *   npm run pruefe-zeit
 *
 * **Der Anlass, 9. September 2026.** `src/ablage.js` beschreibt `zeitpunkt`
 * als „Ausstellungsdatum; zeitgerechte Eintragung in der Zeitfolge" mit § 11
 * UStG und § 131 Abs 1 Z 2 BAO darüber — und gefüllt wurde es aus UTC, während
 * die Journaldatei daneben mit der ungesetzten Zeitzone des Hosts gewählt
 * wurde. Zwei Uhren in einem Eintrag, und keine davon die österreichische.
 *
 * Geprüft wird nicht, ob ein Datum stimmt — das kann von hier aus niemand
 * sehen. Geprüft wird, **aus welcher Uhr es kommt**, und ob jemand das
 * entschieden hat. Ein Uhrgriff ohne Eintrag ist ein unentschiedener Fall.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { UHRSTELLEN, zeitbefund } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const dateien = [];
for (const ordner of ['src', 'bin']) {
  for (const name of readdirSync(join(SHOP, ordner)).sort()) {
    if (!/\.(js|mjs)$/.test(name)) continue;
    dateien.push({ pfad: `${ordner}/${name}`, text: readFileSync(join(SHOP, ordner, name), 'utf8') });
  }
}
const php = join(SHOP, 'bestellung.php');
if (!existsSync(php)) {
  console.error('Abbruch: bestellung.php fehlt — das Empfangsskript schreibt jeden Journaleintrag.');
  console.error('Ohne es prüfte dieser Lauf die halbe Kette und meldete Grün.');
  process.exit(2);
}
dateien.push({ pfad: 'bestellung.php', text: readFileSync(php, 'utf8') });

const b = zeitbefund(dateien, UHRSTELLEN);

// Gezählt wird das Angesehene, nicht das Gefundene.
console.log(`\nUhrenabgleich — ${b.geprueft} Quelldateien, ${b.eintraege} Stellen, die ein Datum`);
console.log(`erzeugen; davon ${b.belegdateien} mit Belegwirkung\n`);

if (b.sauber) {
  console.log('Jede Stelle, die von sich aus auf die Uhr sieht, steht im Register —');
  console.log('mit der Uhr, die sie führen soll, und mit dem Grund dafür.');
  console.log('Ein Betrieb hat einen Kalender, keine zwei.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
