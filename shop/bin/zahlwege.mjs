#!/usr/bin/env node
/**
 * Die Zahlwege gegen ihre Anforderungen — und was sie im Monat kosten.
 *
 *   npm run zahlwege
 *
 * **Der Anlass, 9. September 2026.** `vergleiche()` in `src/zahlung.js` hält
 * jeden Zahlweg gegen vier Anforderungen und rechnet seine Monatskosten. Die
 * Tafel daraus trägt **Gate 21** — die Entscheidung für EPS und Vorkasse,
 * gegen Karte und offene Rechnung. Gerufen hat die Funktion außerhalb ihrer
 * Tests **niemand**: Die Zahlen in den Dokumenten stammen von Hand, und kein
 * Befehl rechnet sie nach.
 *
 * Unsichtbar war das, weil `src/import.js` eine gleichnamige Funktion hat.
 * Der Prüfer der ungerufenen Ausfuhren kannte Funktionen bei ihrem Vornamen.
 *
 * Die Lage kommt aus `data/zielgroessen.json` und `data/lieferanten.json` —
 * **nicht** aus Zahlen in dieser Datei. Ein Werkzeug mit eigenen Annahmen
 * wäre eine zweite Rechnung neben der ersten.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { vergleiche } from '../src/zahlung.js';
import { noetigerUmsatz } from '../src/kostenbild.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const lies = (...p) => JSON.parse(readFileSync(join(SHOP, ...p), 'utf8'));

let ziel;
let lieferanten;
try {
  ziel = lies('data', 'zielgroessen.json');
  lieferanten = lies('data', 'lieferanten.json');
} catch (fehler) {
  console.error(`Abbruch: die Zielgrößen sind nicht lesbar — ${fehler.message}`);
  console.error('Ohne sie hätte dieses Werkzeug eigene Annahmen, und das wäre eine zweite Rechnung.');
  process.exit(2);
}

if (typeof ziel.frachtProBestellungNetto !== 'number') {
  console.error('Abbruch: zielgroessen.json nennt keine Fracht je Bestellung.');
  console.error('Die Zahlungsgebühr rechnet auf den vollen Kundenzahlbetrag, und der');
  console.error('trägt die Fracht mit. Ohne sie wäre jede Zeile hier zu günstig.');
  process.exit(2);
}

const rechnung = noetigerUmsatz(ziel, ziel.zahlweg);
if (!rechnung.tragfaehig) {
  console.error(`Abbruch: ${rechnung.grund}`);
  process.exit(2);
}

const lage = {
  umsatzNetto: rechnung.umsatzNetto,
  bestellungen: rechnung.bestellungen,
  zielgewinn: ziel.zielgewinn,
  frachtProBestellungNetto: ziel.frachtProBestellungNetto,
};

const zeilen = vergleiche(lage);

console.log(`\nZahlwege — ${zeilen.length} geprüft gegen ${zeilen[0].ergebnisse.length} Anforderungen\n`);
console.log(`Grundlage: ${Math.round(lage.umsatzNetto).toLocaleString('de-AT')} € Warenumsatz im Monat, `
  + `${lage.bestellungen} Bestellungen, ${lage.frachtProBestellungNetto.toFixed(2)} € Fracht je Bestellung,`);
console.log(`Zielgewinn ${lage.zielgewinn.toLocaleString('de-AT')} € — alles aus data/zielgroessen.json.\n`);

const eur = (n) => `${n.toFixed(2).replace('.', ',')} €`;
for (const z of zeilen) {
  const anteil = `${(z.anteilAmZielgewinn * 100).toFixed(1).replace('.', ',')} %`;
  console.log(`  ${z.geeignet ? '✓' : '✗'} ${z.name}`);
  console.log(`      ${eur(z.gebuehrProMonat).padStart(11)} im Monat  ·  ${anteil.padStart(6)} des Zielgewinns`);
  for (const v of z.verletzt) console.log(`      — ${v}`);
}

const geeignet = zeilen.filter((z) => z.geeignet);
console.log(`\n${geeignet.length} von ${zeilen.length} Zahlwegen erfüllen alle Anforderungen.`);

/*
 * **Kein Ausgang 1 bei „keiner geeignet".** Diese Tafel ist eine Auskunft,
 * kein Prüfer: Die Anforderungen stammen aus fünf Dokumenten und sind älter
 * als Gate 21, das EPS und Vorkasse **entschieden** hat. Wo sie einander
 * widersprechen, entscheidet das Gate — die Tafel sagt, worin.
 */
const entschieden = zeilen.filter((z) => ['eps', 'vorkasse'].includes(z.zahlweg));
const strittig = entschieden.filter((z) => !z.geeignet);
if (strittig.length) {
  console.log('\nGate 21 hat EPS und Vorkasse ab Start entschieden. Diese Liste ist älter');
  console.log('und widerspricht ihr — bei folgenden Wegen, mit folgendem Grund:');
  for (const z of strittig) console.log(`  ${z.name}: ${z.verletzt.join('; ')}`);
  console.log('Aufgelöst in Gate 32 (gate-register.md): Das Gate gilt, die Liste warnt.');
}
process.exit(0);
