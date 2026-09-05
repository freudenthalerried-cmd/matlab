#!/usr/bin/env node
/**
 * Alle vertraulichen Dateien sichern, bevor jemand daran arbeitet.
 *
 *   npm run sicherung
 *
 * **Warum von Hand und nicht nur automatisch.** `src/sicherung.js` legt bei
 * jedem Werkzeuglauf eine Kopie an — aber nur für die Dateien, die ein
 * Werkzeug schreibt. Unter `preise/` liegt mehr: die Positionstabelle aus den
 * Rechnungen, das Konditionenblatt, die abgetippten Seiten. Sie werden von
 * Hand gepflegt oder von `werkzeuge/gewichte.py` erzeugt, und für sie gibt es
 * kein `git`, das sie zurückholt.
 *
 * > **Eine Datei, die sich aus ihrer Quelle neu erzeugen lässt, kann man
 * > verlieren. Eine gepflegte Datei nicht.**
 *
 * Der Aufruf gehört an den Anfang jedes Tages, an dem neue Angaben des
 * Auftraggebers eintreffen — vor dem ersten Werkzeug, nicht nach dem ersten
 * Schreck.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { sichere, staende, SICHERUNGSTIEFE } from '../src/sicherung.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const REPO = join(HIER, '..', '..');
const ORDNER = process.env.SICHERUNG_ORDNER || join(REPO, 'preise');

if (!existsSync(ORDNER)) {
  console.error(`Nichts zu sichern: ${ORDNER} gibt es nicht.`);
  console.error('Auf diesem Rechner liegen keine vertraulichen Dateien.');
  process.exit(0);
}

const dateien = readdirSync(ORDNER)
  .filter((d) => d !== '.sicherung')
  .map((d) => join(ORDNER, d))
  .filter((p) => statSync(p).isFile())
  .sort();

if (dateien.length === 0) {
  console.error(`\nAbbruch: ${ORDNER} ist leer.`);
  console.error('Eine Sicherung von nichts sieht aus wie eine Sicherung.');
  process.exit(2);
}

console.log(`\nSicherung: ${dateien.length} Datei(en) aus ${relative(REPO, ORDNER)}\n`);
let gesichert = 0;
for (const datei of dateien) {
  const kopie = sichere(datei);
  if (!kopie) continue;
  gesichert++;
  const wieviele = staende(datei).length;
  console.log(`  ${relative(ORDNER, datei).padEnd(34)} ${String(wieviele).padStart(2)} Stand(e)`);
}
console.log(`\n${gesichert} gesichert nach ${relative(REPO, join(ORDNER, '.sicherung'))}`);
console.log(`Je Datei werden ${SICHERUNGSTIEFE} Stände aufgehoben, der älteste fällt.`);
console.log('Der Ordner ist von .gitignore gedeckt — die Kopien bleiben lokal.');
