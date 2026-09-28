#!/usr/bin/env node
/**
 * Der Zettel für den Auftraggeber — sieben Angaben, keine davon kostet etwas.
 *
 *   npm run zettel
 *
 * **Der Anlass, 10. September 2026.** `npm run punkte` führt 25 offene Punkte,
 * und kein einziger liegt bei mir. Fünf stehen unter „Liegt vor, fehlt nur in
 * der Datei" — mit der Bankverbindung sind es sieben Angaben, die nichts
 * kosten, keine Freigabe brauchen und keinen Dritten.
 *
 * Sie verteilen sich über vier Werkzeugausgaben. Wer sie liefern soll, müsste
 * alle vier lesen und die Felder daraus heraussuchen.
 *
 * > **Eine Zulieferung, die man sich zusammensuchen muss, wird nicht
 * > geliefert.**
 *
 * **Was dieses Werkzeug nicht tut:** schreiben. Es füllt nichts aus und
 * verschickt nichts — es legt die sieben Zeilen nebeneinander, jede mit ihrer
 * Form, ihrer Fundstelle und dem Satz, was sie freigibt.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ZULIEFERUNGEN, ZIELDATEI, formangaben, geliefert, zettelbefund } from '../src/zettel.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));

/*
 * **Die andere Richtung.** Gesucht wird, was leer ist und nichts kostet — die
 * Felder mit einer Form in `betreiberform.js` und die beiden Bankfelder. Was
 * Geld kostet (Zahlungsanbieter, Rechtstexte) gehört nicht auf diesen Zettel:
 * Er ist die Liste der Dinge, die eine Minute dauern.
 */
const kostenlosLeer = ZULIEFERUNGEN
  .map((z) => z.feld)
  .filter((feld) => !geliefert(betreiber[feld]));

const b = zettelbefund(betreiber, kostenlosLeer);

const offen = ZULIEFERUNGEN.filter((z) => !geliefert(betreiber[z.feld]));

console.log(`\nZulieferungen ohne Ausgabe — ${offen.length} von ${b.zeilen} offen`);
console.log(`Einzutragen in ${ZIELDATEI}. Keine davon kostet Geld, keine braucht einen Dritten.\n`);

for (const z of offen) {
  const form = formangaben(z.feld);
  console.log(`  ${z.bezeichnung}`);
  console.log(`      Feld       "${z.feld}": ""`);
  console.log(`      Form       ${form?.beispiel ?? z.beispielRoh ?? '—'}`
    + `${form?.geprueft ? '  (wird nachgerechnet)' : ''}`);
  console.log(`      Grundlage  ${z.rechtsgrund}`);
  umbrich(z.loest, 66).forEach((zeile, i) => {
    console.log(`      ${i === 0 ? 'Wofür     ' : '          '} ${zeile}`);
  });
  console.log('');
}

if (offen.length === 0) {
  console.log('  Alle sieben stehen in der Datei. Der Zettel ist leer.\n');
}

if (!b.sauber) {
  console.log('Der Zettel deckt sich nicht mit der Betreiberdatei:\n');
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('\nEin Zettel, der etwas anderes sagt als die Datei, kostet mehr Zeit als er spart.');
  process.exit(1);
}

console.log('Eine Zulieferung, die man sich zusammensuchen muss, wird nicht geliefert.');

/** Bricht einen Satz auf Zeilen, damit er im Terminal lesbar bleibt. */
function umbrich(text, breite) {
  const zeilen = [];
  let zeile = '';
  for (const wort of String(text ?? '').split(/\s+/)) {
    if (zeile && (zeile + wort).length > breite) { zeilen.push(zeile.trimEnd()); zeile = ''; }
    zeile += `${wort} `;
  }
  if (zeile.trim()) zeilen.push(zeile.trimEnd());
  return zeilen;
}
