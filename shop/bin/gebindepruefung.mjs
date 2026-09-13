#!/usr/bin/env node
/**
 * Der gelesene Gebindeschritt gegen die fakturierten Mengen.
 *
 *   npm run pruefe-gebinde
 *
 * Die Regeln stehen in `src/gebindebeleg.js`; hier steht nur, woraus gemessen
 * wird. Der Gebindeschritt wird **aus dem Artikelnamen gelesen** und trägt
 * fünf Rechnungen — er gehört gegen etwas gehalten, das nicht dieselbe
 * Zeichenkette ist.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { mengenschritt } from '../src/gebinde.js';
import { pruefeGebindeGegenBelege } from '../src/gebindebeleg.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const QUELLE = process.env.KATALOG_QUELLE || join(SHOP, '..', 'preise', 'poschacher-positionen.csv');

const artikel = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')).artikel;

/**
 * **Zwei Prüfungen hatten hier eine Grundlage zu viel — 12. September 2026.**
 *
 * Dieses Werkzeug maß zweierlei: den gelesenen Gebindeschritt gegen die
 * **fakturierten Mengen** (dafür braucht es die Positionsliste des
 * Lieferanten) und die **Einheitenliste gegen den Katalog** (dafür braucht es
 * nur `data/katalog-baustoff.json`). Seit dem Verlust von
 * `preise/poschacher-positionen.csv` brach es ganz oben ab — und nahm die
 * zweite Prüfung mit, die von der verlorenen Datei nichts wissen will.
 *
 * > **Eine fehlende Grundlage legt die Prüfung still, die auf ihr steht —
 * > nicht die daneben.**
 *
 * Die Einheitenprüfung ist deshalb ein eigenes Werkzeug geworden:
 * `npm run pruefe-einheiten`. Hier bleibt, was ohne die Positionsliste
 * wirklich nicht zu messen ist.
 */
if (!existsSync(QUELLE)) {
  console.error('preise/poschacher-positionen.csv fehlt — sie liegt außerhalb des Verzeichnisses.');
  console.error('Ohne sie ist hier nichts zu messen, und ein grüner Lauf über nichts wäre eine');
  console.error('Lüge. Die Einheitenliste prüft seit dem 12.09. `npm run pruefe-einheiten`.');
  process.exit(2);
}


const zeilen = readFileSync(QUELLE, 'utf8').trim().split('\n');
const kopf = zeilen[0].split(';');
const feld = (f, name) => f[kopf.indexOf(name)];
const positionen = zeilen.slice(1).map((z) => {
  const f = z.split(';');
  return {
    artikelnummer: feld(f, 'ArtNr'),
    menge: Number(feld(f, 'Menge')),
    belegart: feld(f, 'Belegart'),
  };
});

const e = pruefeGebindeGegenBelege(artikel, positionen, mengenschritt);

console.log(`\nGebindeprüfung: ${e.geprueft} Artikel mit Gebindeschritt gegen ${positionen.length} Positionen\n`);
console.log(`  Artikel mit Rechnungsposition   ${e.artikelMitPositionen}`);
console.log(`  davon mit Schritt aus dem Namen ${e.geprueft}`);
console.log(`  ohne Schritt im Namen           ${e.ohneSchritt.length}`);
console.log(`  Gutschriften (negative Mengen)  ${e.gutschriften}`);
if (e.ohneArtikel) console.log(`  Positionen ohne Artikel im Katalog ${e.ohneArtikel}`);

if (e.abweichungen.length) {
  console.log('\n  ✗ Der gelesene Schritt passt nicht zu dem, was fakturiert wurde:');
  for (const a of e.abweichungen) {
    console.log(`      ${a.sku}  ${a.bezeichnung.slice(0, 44)}`);
    console.log(`          Schritt ${a.schritt} · Mengen ${a.mengen.join(', ')}`);
  }
  console.log('\nEntweder ist der Name falsch gelesen, oder der Lieferant gibt lose ab.');
  console.log('Beides ändert, was ein Kunde bestellen kann — und beides ist nachzusehen,');
  console.log('bevor die Kasse weiter auf ganze Gebinde aufrundet.');
  process.exit(1);
}

console.log('\nJede fakturierte Menge ist ein Vielfaches des gelesenen Schritts.');
console.log(`Die andere Richtung bleibt offen: Für die ${e.ohneSchritt.length} Artikel ohne Schritt im Namen`);
console.log('geben die Rechnungen nichts her — ein größter gemeinsamer Teiler über eine');
console.log('einzige Beobachtung ist die Menge, die jemand einmal gekauft hat. Die');
console.log('Verpackungseinheit steht in der Artikelliste des Lieferanten (offener Punkt).');
process.exit(0);
