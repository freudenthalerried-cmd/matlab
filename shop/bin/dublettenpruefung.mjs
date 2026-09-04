#!/usr/bin/env node
/**
 * Wie unterscheidbar sind die 46 Artikelseiten?
 *
 *   npm run pruefe-dubletten
 *
 * Die Regeln stehen in `src/seitenaehnlichkeit.js`; hier steht nur, welcher
 * Text gemessen wird. Getrennt aus demselben Grund wie bei der Belegprüfung:
 * Sonst stellt ein Prüfer sein eigenes Prüfobjekt her.
 *
 * **Gemessen wird der eigene Teil einer Seite.** Kopf, Fuß, Skript, Zeichnung
 * und der Querverweisblock (`<section class="querverweise">`) fallen heraus —
 * sie stehen auf jeder Seite gleich und sind Navigation, kein Inhalt.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { seitenbefund, eigenerText, DUBLETTENGRENZE } from '../src/seitenaehnlichkeit.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const WURZEL = dirname(dirname(fileURLToPath(import.meta.url)));
const ORDNER = join(WURZEL, 'ausgabe', 'site', 'artikel');

/**
 * **Vorhanden ist nicht dasselbe wie aktuell.** Ergänzt am 4. September: Die
 * Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, stand seit dem
 * 29. August in zwei von neun Werkzeugen, die eines lesen. Die anderen sieben
 * fragten nur, ob es da ist. Das Register dazu steht in
 * `src/erzeugnisstand.js`; der Text ist dort **eine** Fassung für alle.
 */
{
  const stand = frischebefund(WURZEL, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}


if (!existsSync(ORDNER)) {
  console.error(`Abbruch: ${ORDNER} fehlt — zuerst npm run website.`);
  console.error('Eine Messung ohne gebaute Seiten misst nichts und meldet Grün.');
  process.exit(2);
}

const dateien = readdirSync(ORDNER).filter((f) => f.endsWith('.html')).sort();
const seiten = dateien.map((f) => ({
  id: f.replace(/\.html$/, ''),
  text: eigenerText(readFileSync(join(ORDNER, f), 'utf8')),
}));

const e = seitenbefund(seiten, DUBLETTENGRENZE);

console.log(`\nDublettenprüfung: ${e.seiten} Artikelseiten, ${e.paare} Paare\n`);
console.log(`  Ähnlichste zwei      ${e.hoechste.wert.toFixed(2)}  (${e.hoechste.a} / ${e.hoechste.b})`);
console.log(`  Median über alle     ${e.median.toFixed(2)}`);
console.log(`  Auf jeder Seite      ${e.gemeinsameWorte} von ${e.mittlereLaenge.toFixed(0)} Wörtern `
  + `(${(e.gemeinsamerAnteil * 100).toFixed(0)} %)`);
console.log(`  Kürzeste Seite       ${e.kuerzeste}`);

if (e.dubletten.length) {
  console.log(`\n  ✗ ${e.dubletten.length} Paar(e) ab ${DUBLETTENGRENZE} — praktisch dieselbe Seite:`);
  for (const d of e.dubletten.slice(0, 10)) {
    console.log(`      ${d.wert.toFixed(3)}  ${d.a} / ${d.b}`);
  }
  console.log('\nZwei Seiten, die sich in einer Handvoll Zeichen unterscheiden, sind für');
  console.log('eine Suchmaschine keine zwei Antworten. Der Shop lebt davon, gefunden zu');
  console.log('werden — das ist kein Schönheitsfehler.');
  process.exit(1);
}

console.log(`\nKein Paar erreicht ${DUBLETTENGRENZE}. Der gemeinsame Anteil ist damit nicht klein —`);
console.log('er ist die Grenze dessen, was aus fünfzehn Lieferantenrechnungen zu holen ist.');
console.log('Was ihn wirklich senkt, steht als offener Punkt: die Artikelliste aus dem');
console.log('Kundenkonto, mit Hersteller, EAN und Bild je Artikel.');
process.exit(0);
