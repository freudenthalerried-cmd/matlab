#!/usr/bin/env node
/**
 * Entspricht das Gelieferte dem Bestellten?
 *
 *   node bin/auftragspruefung.mjs
 *
 * Liest die Ergebnisliste aus `master-prompt.md` — dem Auftrag selbst, nicht
 * aus einer Abschrift — und hält sie gegen `data/auftragszuordnung.json`.
 * Jede Anforderung braucht eine Antwort, jede Antwort ihre Belege, und jeder
 * Beleg muss existieren.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ergebnisliste, pruefeErgebnisse } from '../src/auftrag.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(SHOP, '..');

const auftragPfad = join(REPO, 'docs', 'baustoff-shop', 'master-prompt.md');
const zuordnungPfad = join(SHOP, 'data', 'auftragszuordnung.json');
for (const p of [auftragPfad, zuordnungPfad]) {
  if (existsSync(p)) continue;
  console.error(`Abbruch: ${p} fehlt.`);
  process.exit(2);
}

const liste = ergebnisliste(readFileSync(auftragPfad, 'utf8'));
const zuordnung = JSON.parse(readFileSync(zuordnungPfad, 'utf8'));
const e = pruefeErgebnisse(liste, zuordnung, (b) => existsSync(join(REPO, b)));

const zeichen = { erfuellt: '✓', anders: '≈', offen: '✗', 'ohne-zuordnung': '?', 'beleg-fehlt': '!' };

console.log(`\nAuftragsabgleich — ${e.gesamt} Ergebnisse aus master-prompt.md`);
console.log('Gelesen aus dem Auftrag, nicht abgeschrieben. Belege werden auf Existenz geprüft.\n');

for (const b of e.befunde) {
  console.log(`  ${zeichen[b.zustand] ?? '?'} ${String(b.nr).padStart(2)}. ${b.datei ?? b.text.slice(0, 40)}`);
  if (b.begruendung) console.log(`        ${b.begruendung.replace(/\s+/g, ' ').slice(0, 300)}`);
  if (b.belege?.length) console.log(`        Belege: ${b.belege.join(', ')}`);
  for (const f of b.fehlendeBelege ?? []) console.log(`        ✗ Beleg fehlt: ${f}`);
  if (b.zustand === 'ohne-zuordnung') {
    console.log('        ✗ Zu dieser Anforderung sagt die Zuordnung nichts.');
  }
}

console.log(`\n${e.erfuellt} erfüllt, ${e.anders} unter anderem Namen vorhanden, ${e.offen} offen.`);

if (e.sauber) {
  console.log('\nJede Anforderung ist beantwortet und jeder Beleg existiert.');
  console.log('Beantwortet heißt nicht erfüllt: „offen" ist eine gültige Antwort, „vergessen" nicht.');
  process.exit(0);
}
console.log('\nEine Anforderung ohne Antwort ist gefährlicher als eine offene — sie fällt niemandem auf.');
process.exit(1);
