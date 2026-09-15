#!/usr/bin/env node
/**
 * Erreicht jeder Vorbehalt aus dem Rechenkern einen Leser?
 *
 *   npm run pruefe-vorbehalte
 *
 * **Der Anlass, 5. September 2026, nachts.** `LIEFERGEBIET.vorbehalt` steht
 * seit dem 26. August im Rechenkern und stand in keiner einzigen Ausgabedatei,
 * während 81 von 81 gebauten Seiten das Liefergebiet als feststehende Tatsache
 * nennen. Die Begründung dafür stand die ganze Zeit daneben — im Register der
 * offenen Punkte, Runde um Runde: *„Der Vorbehalt zum Liefergebiet steht in
 * `areaServed` nicht dabei."*
 *
 * > **Ein offener Punkt, der in jedem Rundenbericht steht und in keiner
 * > Prüfung, ist ein Vorsatz.**
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { ohneKommentare } from '../src/entkommentieren.js';
import { VORBEHALTE, vorbehaltsbefund } from '../src/vorbehalt.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

const quellen = readdirSync(join(SHOP, 'src'))
  .filter((d) => d.endsWith('.js'))
  .map((d) => ({
    datei: `src/${d}`,
    // **Ohne Kommentare.** Sonst zählte jeder Kopfkommentar, der das Wort
    // erklärt, als Feld — auch der dieser Prüfung.
    text: ohneKommentare(readFileSync(join(SHOP, 'src', d), 'utf8')).text,
  }));

/** Die Ausgabe, flach nach Dateiname — die Vorbehalte nennen keine Pfade. */
const ausgabe = {};
if (existsSync(SITE)) {
  const gehe = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const voll = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) { gehe(voll); continue; }
      if (statSync(voll).isFile()) ausgabe[eintrag.name] = readFileSync(voll, 'utf8');
    }
  };
  gehe(SITE);
}

const b = vorbehaltsbefund({ quellen, ausgabe });

console.log(`Vorbehalte — ${b.eintraege} im Register, ${b.geprueft} Quelldateien angesehen, `
  + `${Object.keys(ausgabe).length} Ausgabedateien\n`);

for (const e of VORBEHALTE) {
  const orte = (e.stehtIn ?? []).length ? e.stehtIn.join(', ') : 'ohne Ausgabe, mit Grund';
  console.log(`  ${e.id.padEnd(20)} ${orte}`);
}
console.log('');

if (b.sauber) {
  console.log('Jeder Vorbehalt steht dort, wo die Zusage steht — oder sagt, warum nicht.');
  console.log('Ein Vorbehalt, der die Ausgabe nie erreicht, ist eine Notiz an sich selbst.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
