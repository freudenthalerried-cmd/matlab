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

import { mengenschritt, einheitenbefund, STUECKEINHEITEN } from '../src/gebinde.js';
import { pruefeGebindeGegenBelege } from '../src/gebindebeleg.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const QUELLE = process.env.KATALOG_QUELLE || join(SHOP, '..', 'preise', 'poschacher-positionen.csv');

if (!existsSync(QUELLE)) {
  console.error('preise/poschacher-positionen.csv fehlt — sie liegt außerhalb des Verzeichnisses.');
  console.error('Ohne sie ist hier nichts zu messen, und ein grüner Lauf über nichts wäre eine Lüge.');
  process.exit(2);
}

const artikel = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')).artikel;

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

/*
 * **Die Einheitenliste gegen den Katalog — 5. September 2026.**
 *
 * `STUECKEINHEITEN` in `gebinde.js` führte `PAK`, `KAR` und `ROL`, die im
 * Katalog nicht vorkommen, und kannte `KRT`, `DOS` und `RLL` nicht, die
 * vorkommen. Folgenlos war das nur, weil `preisJeKilo` außerdem ein Kilogramm
 * im Namen braucht und keiner der sechs Artikel eines trägt.
 *
 * Dreißig Zeilen unter dieser Liste steht seit dem 30. August die Lehre aus
 * genau diesem Fehler, gezogen an `GEBINDELESER`: *„Wer eine Einheit ergänzt,
 * ergänzt sie jetzt hier, und beide Seiten wissen davon."* Die Menge daneben
 * blieb, wie sie war — **eine Lehre, die neben der Stelle gezogen wird, an der
 * sie noch einmal gebraucht wird.**
 */
const eb = einheitenbefund(artikel);
console.log(`  Einheiten im Katalog            ${eb.einheiten}, `
  + `${STUECKEINHEITEN.size} davon Stückeinheiten, ${eb.mitWort} mit lesbarem Wort`);
if (!eb.sauber) {
  console.log('\n  ✗ Die Einheitenliste passt nicht zum Katalog:');
  for (const m of eb.meldungen) console.log(`      ${m.text}  (${m.regel})`);
  console.log('\nEine Einheit, die keiner führt, prüft nichts; eine, die keine Liste kennt,');
  console.log('fällt still aus jeder Umrechnung. Beides sieht im Lauf gleich aus: grün.');
  process.exit(1);
}

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
