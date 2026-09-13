#!/usr/bin/env node
/**
 * Prüft das Crawler-Register und die ausgelieferte robots.txt gegeneinander.
 *
 * Drei Fragen, in dieser Reihenfolge:
 *
 * 1. **Ist das Register in Form?** Jede Kennung mit Grund, bekanntem Zweck,
 *    bekanntem Anbieter, keine doppelt.
 * 2. **Sperrt eine Zeile den Anbieter statt sein Training?** Ein Anbieter, der
 *    Fragen beantwortet, muss eine erlaubte Such- oder Nutzerkennung behalten.
 * 3. **Steht in der gebauten Datei, was das Register sagt** — und nichts
 *    darüber hinaus?
 *
 * Die dritte Frage ist die, an der der Bau schon einmal auseinandergelaufen
 * ist: Bis zum 30. August schrieb `website.mjs` eigene Zeilen, während
 * `veroeffentlichung.mjs` dieselbe Datei aus `robotsTxt()` erzeugte.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { KENNUNGEN, ANBIETER, pruefeCrawler, vergleicheMitDatei } from '../src/crawler.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const hier = dirname(fileURLToPath(import.meta.url));

/**
 * **Vorhanden ist nicht dasselbe wie aktuell.** Ergänzt am 4. September: Die
 * Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, stand seit dem
 * 29. August in zwei von neun Werkzeugen, die eines lesen. Die anderen sieben
 * fragten nur, ob es da ist. Das Register dazu steht in
 * `src/erzeugnisstand.js`; der Text ist dort **eine** Fassung für alle.
 */
{
  const stand = frischebefund(join(hier, '..'), 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}

const datei = join(hier, '..', 'ausgabe', 'site', 'robots.txt');

const befunde = [...pruefeCrawler()];

// Ohne gebaute Datei wird nicht geschwiegen, sondern gesagt, dass eine Hälfte
// der Prüfung ausgefallen ist — sonst sieht ein halber Lauf aus wie ein ganzer.
let dateiGeprueft = false;
if (existsSync(datei)) {
  befunde.push(...vergleicheMitDatei(readFileSync(datei, 'utf8')));
  dateiGeprueft = true;
}

console.log(`Crawler-Register — ${KENNUNGEN.length} Kennungen, ${ANBIETER.length} Anbieter`);
const erlaubt = KENNUNGEN.filter((k) => k.zugang === 'erlaubt');
console.log(`${erlaubt.length} erlaubt, ${KENNUNGEN.length - erlaubt.length} gesperrt.`);
console.log(dateiGeprueft
  ? 'Die gebaute ausgabe/site/robots.txt ist gegengeprüft.'
  : 'OHNE gebaute robots.txt — nur das Register geprüft. `npm run website` fehlt.');

if (befunde.length === 0) {
  console.log('\nKeine Meldung.');
  console.log('Geprüft ist die Absicht und ihre Widerspruchsfreiheit, nicht die Wirkung beim');
  console.log('Anbieter — die steht in dessen Dokumentation und ist von hier aus nicht lesbar.');
  process.exit(dateiGeprueft ? 0 : 2);
}

console.log(`\n${befunde.length} Meldung(en):\n`);
for (const b of befunde) console.log(`  ✗ ${b}`);
process.exit(1);
