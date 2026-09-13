#!/usr/bin/env node
/**
 * Prüfen die Prüfer das Erzeugnis von heute?
 *
 *   npm run pruefe-erzeugnis
 *
 * **Der Anlass, 4. September 2026.** `npm run alles` meldete 26 von 26 grün,
 * und unmittelbar danach weigerten sich beide Browserproben zu starten: Das
 * Erzeugnis war älter als drei Quelldateien. Die Weigerung gibt es seit dem
 * 29. August — in **zwei** von sieben Werkzeugen, die das Erzeugnis lesen.
 *
 * > **Vorhanden ist nicht dasselbe wie aktuell.** Die anderen fünf fragen, ob
 * > `ausgabe/site` da ist.
 *
 * Dieser Prüfer tut zweierlei, und beides gehört zusammen: Er sagt, ob die
 * Erzeugnisse gerade frisch sind, und er hält das Leserregister gegen den
 * Bestand — wer `ausgabe/` anfasst, steht darin, oder es ist ein Fund.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ohneKommentare } from '../src/entkommentieren.js';
import { ERZEUGNISSE, frischebefund, leserbefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

const dateien = readdirSync(join(SHOP, 'bin'))
  .filter((d) => d.endsWith('.mjs'))
  .map((d) => ({
    name: `bin/${d}`,
    text: ohneKommentare(readFileSync(join(SHOP, 'bin', d), 'utf8')).text,
  }));

const { geprueft, meldungen } = leserbefund(dateien);

console.log(`Erzeugnisstand — ${geprueft} Werkzeuge angesehen, `
  + `${Object.keys(ERZEUGNISSE).length} Erzeugnisse im Register\n`);

const alt = [];
for (const name of Object.keys(ERZEUGNISSE)) {
  const b = frischebefund(SHOP, name);
  const wort = b.fehlt ? 'fehlt' : (b.frisch ? 'frisch' : `älter als ${b.juenger.length} Quelldatei(en)`);
  console.log(`  ${b.frisch ? '✓' : '·'} ${name.padEnd(22)} ${wort}`);
  if (!b.frisch) alt.push(b);
}
console.log('');

/**
 * **Ein veraltetes Erzeugnis ist hier kein Fehler, sondern eine Auskunft.**
 * Dieser Prüfer läuft im Gesamtlauf zwischen anderen; würde er rot, weil
 * gerade nicht gebaut wurde, sagte er etwas über die Reihenfolge der Schritte
 * und nichts über den Bestand. Rot wird er über das **Register** — also
 * darüber, ob ein Leser ohne Weigerung liest.
 */
for (const b of alt) {
  console.log(`  Hinweis: ${b.name} ist nicht auf dem Stand — ${b.baubefehl}.`);
}
if (alt.length) console.log('');

if (meldungen.length === 0) {
  console.log('Jedes Werkzeug, das ausgabe/ liest, weigert sich über einem veralteten Stand.');
  console.log('Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.');
  process.exit(0);
}

for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${meldungen.length} Meldung(en).`);
process.exit(1);
