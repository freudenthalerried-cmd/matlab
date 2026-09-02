#!/usr/bin/env node
/**
 * Was kostet der Weg, den der Betreiber geht?
 *
 *   npm run aufwand
 *
 * **Die Gegenrichtung zur Wegprobe.** Die Besucherstrecke ist gemessen: fünf
 * Schritte vom Anzeigenklick bis zum fertigen Anfragetext. Was danach kommt,
 * macht ein Mensch — elf Schritte in `auftragslauf.js`, jeder mit einer
 * Minutenangabe für den Fall, dass die Fähigkeit dahinter fehlt.
 *
 * Die Zahlen gab es seit Wochen. **Gegen die Zielgröße gehalten hat sie
 * niemand.** `aufwandProMonat()` stand in der Liste der dreißig Funktionen, die
 * außerhalb der Tests kein Aufrufer kennt.
 *
 * Und es ist die Zahl, an der hängt, ob dieser Betrieb neben dem Baugeschäft
 * läuft oder es ersetzt. Der Auftrag sagt: nebenbei.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { WELT_HEUTE, WELT_AUSGEBAUT, SCHRITTE, trockenlauf, aufwandProMonat, engpaesse } from '../src/auftragslauf.js';
import { noetigerUmsatz } from '../src/kostenbild.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ziel = JSON.parse(readFileSync(join(SHOP, 'data', 'zielgroessen.json'), 'utf8'));

/**
 * Wie viel Handarbeit im Monat noch „nebenbei" heißt.
 *
 * **Gesetzt, nicht gemessen.** Zwanzig Stunden sind rund ein halber Arbeitstag
 * je Woche. Der Auftraggeber führt eine Bau GmbH; der Shop soll neben ihr
 * laufen. Die Zahl steht hier, damit sie widersprochen werden kann — eine
 * Grenze, die niemand aufschreibt, wird im Betrieb stillschweigend
 * überschritten.
 */
export const GRENZE_STUNDEN_JE_MONAT = 20;

/** Ab wann eine Fähigkeit sich lohnt: was sie im Monat an Stunden spart. */
const stundenJeMonat = (minuten, bestellungen) => Math.round((minuten * bestellungen / 60) * 10) / 10;

const umsatz = noetigerUmsatz(ziel, ziel.zahlweg);
if (!umsatz.tragfaehig) {
  console.error(`Die Zielgrößen tragen sich nicht: ${umsatz.grund}`);
  process.exit(2);
}
const bestellungen = umsatz.bestellungen;

// Die drei Lagen, die zählen: heute, nach den Freigaben des Auftraggebers,
// voll ausgebaut. Die mittlere ist die wichtigste — sie ist der Zustand am
// ersten Betriebstag.
const nachFreigabe = { ...WELT_HEUTE, zahlungsanbieter: true, betreiberdaten: true, echteKonditionen: true };
const lagen = [
  { name: 'heute', welt: WELT_HEUTE, was: 'nichts freigegeben, nichts angebunden' },
  { name: 'nach den Freigaben', welt: nachFreigabe, was: 'Zahlungsanbieter, Firmendaten und echte Konditionen liegen vor' },
  { name: 'voll ausgebaut', welt: WELT_AUSGEBAUT, was: 'alle sechs Fähigkeiten angebunden' },
];

console.log(`Aufwand des Betreibers bei ${bestellungen} Bestellungen im Monat`);
console.log(`(die Zielgröße aus zielgroessen.json, Zahlweg ${ziel.zahlweg})\n`);

const zeilen = lagen.map((l) => ({ ...l, ...aufwandProMonat(l.welt, bestellungen) }));
for (const z of zeilen) {
  const marke = z.blockaden.length ? '✗' : z.stundenProMonat > GRENZE_STUNDEN_JE_MONAT ? '✗' : '✓';
  console.log(`  ${marke} ${z.name}`);
  console.log(`      ${z.was}`);
  console.log(`      ${z.minutenJeBestellung} Minuten je Bestellung · ${z.stundenProMonat} Stunden im Monat`);
  if (z.blockaden.length) {
    console.log(`      blockiert: ${z.blockaden.join(', ')} — es läuft gar nichts`);
  }
}

console.log(`\nGrenze: ${GRENZE_STUNDEN_JE_MONAT} Stunden im Monat (gesetzt — rund ein halber Arbeitstag je Woche).\n`);

console.log('Was jede fehlende Fähigkeit kostet:\n');
console.log('  Fähigkeit                    min/Bestellung   h/Monat   sperrt');
for (const e of engpaesse()) {
  console.log(`  ${e.faehigkeit.padEnd(28)} ${String(e.zusatzminuten).padStart(10)}   `
    + `${String(stundenJeMonat(e.zusatzminuten, bestellungen)).padStart(7)}   `
    + `${e.blockiert.length ? e.blockiert.join(', ') : '—'}`);
}

// Ab welcher Bestellzahl reißt die Grenze? Linear in den Bestellungen, also
// direkt auflösbar — kein Suchen.
const betrieb = zeilen.find((z) => z.name === 'nach den Freigaben');
const kipppunkt = betrieb.minutenJeBestellung > 0
  ? Math.floor((GRENZE_STUNDEN_JE_MONAT * 60) / betrieb.minutenJeBestellung)
  : Infinity;

console.log('');
if (betrieb.stundenProMonat <= GRENZE_STUNDEN_JE_MONAT) {
  console.log(`Am ersten Betriebstag: ${betrieb.stundenProMonat} Stunden im Monat — das geht nebenbei.`);
  console.log(`Ab ${kipppunkt} Bestellungen im Monat nicht mehr; das ist `
    + `${(kipppunkt / bestellungen).toFixed(1)}× die Zielgröße.`);
} else {
  console.log(`Am ersten Betriebstag: ${betrieb.stundenProMonat} Stunden im Monat — das geht nicht nebenbei.`);
  console.log(`Die Grenze reißt schon bei ${kipppunkt} Bestellungen.`);
}

const groesster = engpaesse().reduce((a, b) => (b.zusatzminuten > a.zusatzminuten ? b : a));
console.log(`\nDer größte Einzelposten ist ${groesster.faehigkeit}: `
  + `${stundenJeMonat(groesster.zusatzminuten, bestellungen)} Stunden im Monat.`);
console.log('Das ist Gate 6 in Stunden statt in Worten — ohne strukturierte Produktdaten');
console.log('ist die Handarbeit nicht der Preis des Anfangs, sondern der des Betriebs.');

console.log('');
console.log('Was diese Rechnung nicht kann:');
console.log('  · Die Minutenangaben je Schritt sind gesetzt, nicht gestoppt. Sie stehen');
console.log('    einzeln in auftragslauf.js und lassen sich am ersten Betriebstag ersetzen.');
console.log('  · Sie rechnet den Regelfall. Eine Rückfrage, eine Retoure, ein falsch');
console.log(`    geliefertes Gebinde kommen obendrauf — ${SCHRITTE.length} Schritte sind der glatte Weg.`);
console.log('  · Sie sagt nichts über die Zeit vor der ersten Bestellung: Katalogpflege,');
console.log('    Inhalte, Anzeigen. Die trägt heute dieses Verzeichnis.');

if (betrieb.blockaden.length || betrieb.stundenProMonat > GRENZE_STUNDEN_JE_MONAT) {
  process.exitCode = 1;
}
