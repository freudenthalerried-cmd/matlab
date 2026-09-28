#!/usr/bin/env node
/**
 * Was für das Impressum fehlt — und in welcher Form es hineingehört.
 *
 *   npm run impressum
 *
 * **Der Anlass.** Vier Pflichtangaben stehen seit dem 26. August offen, und sie
 * blockieren mehr als das Impressum: das Hochladen der Seite, den Brief an den
 * Rechtstexteanbieter und den an den Lieferanten. `npm run startklar` nennt
 * sie; wie sie auszusehen haben, sagt es nicht.
 *
 * Dieses Werkzeug schreibt den Ausschnitt hin, der in `data/betreiber.json`
 * gehört — mit Beispiel je Feld und mit der Begründung, warum die Form zählt.
 * Eingetragen wird hier nichts: Die Angaben liegen dem Auftraggeber vor, und
 * eine Datei, die ein Werkzeug nebenbei ändert, ist die nächste, bei der
 * niemand mehr weiß, woher ihr Inhalt kommt.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { IMPRESSUMSFELDER } from '../src/rechtstexte.js';
import { FORMREGELN, pruefeBetreiberform } from '../src/betreiberform.js';

const WURZEL = dirname(dirname(fileURLToPath(import.meta.url)));
const betreiber = JSON.parse(readFileSync(join(WURZEL, 'data', 'betreiber.json'), 'utf8'));
const regelZu = new Map(FORMREGELN.map((r) => [r.feld, r]));

const fehlend = IMPRESSUMSFELDER.filter((f) => {
  if (f.wennEingetragen && !betreiber.imFirmenbuch) return false;
  const wert = betreiber[f.feld];
  return typeof wert !== 'string' || wert.trim() === '';
});
const form = pruefeBetreiberform(betreiber);

console.log(`\nImpressum — ${IMPRESSUMSFELDER.length} Pflichtangaben, ${fehlend.length} offen, `
  + `${form.maengel.length} in falscher Form\n`);

if (form.maengel.length) {
  console.log('  Falsche Form — das steht schon da und stimmt nicht:\n');
  for (const m of form.maengel) {
    console.log(`  ✗ ${m.text}`);
    console.log(`      ${regelZu.get(m.feld).warum}\n`);
  }
}

if (fehlend.length === 0 && form.sauber) {
  console.log('Alle Pflichtangaben stehen und haben die richtige Form.');
  console.log('Damit ist der härteste Punkt der Bereitschaftsliste geschlossen.');
  process.exit(0);
}

if (fehlend.length) {
  console.log('  Das gehört in data/betreiber.json:\n');
  for (const f of fehlend) {
    const r = regelZu.get(f.feld);
    console.log(`  "${f.feld}": ""${r ? `   ← ${r.beispiel}` : ''}`);
    console.log(`      ${f.bezeichnung}`);
    if (r) console.log(`      ${r.warum}`);
    console.log('');
  }
}

console.log('Was damit aufgeht:');
console.log('  · Das Hochladen — das Impressum-Gerüst sagt selbst, dass es so nicht online darf.');
console.log('  · Der Auftrag an den Rechtstexteanbieter (npm run rechtstexte-auftrag).');
console.log('  · Der Brief an den Lieferanten (npm run pruefe-anfrage) — er braucht eine');
console.log('    Rückantwortadresse.');
console.log('\nEingetragen wird hier nichts. Die Angaben liegen vor; es fehlt der Eintrag.');
process.exit(1);
