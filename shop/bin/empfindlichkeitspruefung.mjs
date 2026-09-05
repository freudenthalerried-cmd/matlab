#!/usr/bin/env node
/**
 * Woran das Modell zuerst zerbricht — und wie weit der Werbeweg davon weg ist.
 *
 *   node bin/empfindlichkeitspruefung.mjs
 *
 * `src/empfindlichkeit.js` gibt es seit Phase 3. Es rechnet Elastizitäten und
 * Kipppunkte, ist geprüft — und **kein Werkzeug hat es je aufgerufen.** Eine
 * Empfindlichkeitsrechnung, die niemand liest, ist eine Rechnung, die niemand
 * gemacht hat.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANNAHMEN, sessionbedarf, elastizitaet, kipppunkt } from '../src/empfindlichkeit.js';
import { noetigerUmsatz } from '../src/kostenbild.js';
import { ZIELMARGE } from '../src/baustoffkatalog.js';
import { TAGE_JE_MONAT } from '../src/werbewirkung.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const lage = JSON.parse(readFileSync(join(SHOP, 'data', 'zielgroessen.json'), 'utf8'));

// **Eine Zahl, zwei Dateien.** Der Katalog rechnet jeden Verkaufspreis mit
// ZIELMARGE, die Zielrechnung mit `rohmarge`. Laufen sie auseinander, plant
// das Modell mit einer Marge, die der Shop nicht nimmt.
if (Math.abs(lage.rohmarge - ZIELMARGE) > 1e-9) {
  console.error(`Abbruch: data/zielgroessen.json rechnet mit ${lage.rohmarge}, `
    + `der Katalog mit ZIELMARGE ${ZIELMARGE}.`);
  console.error('Eine Zielrechnung auf einer anderen Marge als der des Katalogs plant einen anderen Shop.');
  process.exit(2);
}

const zahlweg = lage.zahlweg;
const basis = sessionbedarf(lage, zahlweg);
if (basis === null) {
  console.error('Abbruch: Die Ausgangslage trägt das Modell schon nicht — nach Werbung und Gebühren bleibt nichts.');
  process.exit(1);
}

const pct = (n) => `${(n * 100).toFixed(1)} %`;
const eur = (n) => n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

console.log(`\nEmpfindlichkeit des laufenden Modells (Zahlweg: ${zahlweg})`);
console.log(`Zielgewinn ${eur(lage.zielgewinn)} €, Fixkosten ${eur(lage.fixkosten)} €, `
  + `Rohmarge ${pct(lage.rohmarge)}, Werbeanteil ${pct(lage.werbeanteil)}, `
  + `Warenkorb ${eur(lage.warenkorbNetto)} €, Umsatzquote ${pct(lage.umsatzProSession)}.`);
console.log(`\nBesucherbedarf: ${basis} je Monat.\n`);

console.log('Was passiert, wenn eine Annahme um zehn Prozent ins Ungünstige rutscht?\n');
console.log('  Annahme               Elastizität   Besucher danach   Konfidenz');
const zeilen = ANNAHMEN.map((a) => ({ a, e: elastizitaet(lage, a.id, zahlweg) }))
  .sort((x, y) => (y.e.elastizitaet ?? Infinity) - (x.e.elastizitaet ?? Infinity));
for (const { a, e } of zeilen) {
  const el = e.traegtNicht ? 'trägt nicht' : e.elastizitaet.toFixed(2);
  const ses = e.traegtNicht ? '—' : String(e.neueSessions);
  console.log(`  ${a.name.padEnd(20)} ${el.padStart(11)}   ${ses.padStart(15)}   ${a.konfidenz}`);
  if (e.grenzeGerissen) console.log(`      ⚠ ${e.hinweisGrenze}`);
}
console.log('\n  Elastizität 1,0 heißt proportional. Alles darüber verstärkt.');

console.log('\nWo das Modell kippt:\n');
for (const a of ANNAHMEN) {
  const k = kipppunkt(lage, a.id, zahlweg);
  const kippt = k.kippt
    ? `kippt bei ${pct(k.beiAnteil)} schlechter (Wert ${k.wert.toFixed(4)})`
    : `kippt bis ${pct(k.geprueftBis)} schlechter nicht`;
  const grenze = k.grenzeBeiAnteil != null
    ? `; dokumentierte Grenze bei ${pct(k.grenzeBeiAnteil)} schlechter`
    : '';
  console.log(`  ${a.name.padEnd(20)} ${kippt}${grenze}`);
}

// --- Die Brücke zum Werbeweg ------------------------------------------------
//
// Der Besucherbedarf und die Klicks, die das Werbebudget kauft, sind dieselbe
// Größe. Sie standen bisher in zwei Dokumenten nebeneinander, ohne je
// gegeneinander gehalten zu werden.
const ziel = noetigerUmsatz(lage, zahlweg);
const werbebudgetJeMonat = ziel.umsatzNetto * lage.werbeanteil;
// Der Klickpreis, den das Modell sich selbst vorschreibt: Budget durch die
// Besucher, die es braucht. Er ist keine Annahme, sondern eine Folge — und
// deshalb die ehrlichste Probe auf die Plausibilität des Ganzen.
const impliziterKlickpreis = werbebudgetJeMonat / basis;

console.log('\nWas das für den Werbeweg heißt:\n');
console.log(`  Zielumsatz ${eur(ziel.umsatzNetto)} € im Monat, ${ziel.bestellungen} Bestellungen.`);
console.log(`  Bei ${pct(lage.werbeanteil)} Werbeanteil sind das ${eur(werbebudgetJeMonat)} € Werbebudget je Monat`);
console.log(`  — für ${basis} Besucher. Das Modell schreibt sich damit einen Klickpreis von`);
console.log(`  ${eur(impliziterKlickpreis)} € vor. Der Markt liegt bei 0,50–2,50 €.\n`);
console.log(`  Der erste Anlauf ist mit 10 € Tagesbudget geplant, also ${eur(10 * TAGE_JE_MONAT)} € im Monat`);
console.log(`  — ein ${Math.round(werbebudgetJeMonat / (10 * TAGE_JE_MONAT))}-tel davon. Er ist ein Versuch und kein Betrieb:`);
console.log('  Er kann den ersten Verkauf bringen und die Kaufquote messen, die Zielgröße');
console.log('  trägt er nicht.');
console.log('\nDiese Rechnung löst keine Ausgaben aus.');
