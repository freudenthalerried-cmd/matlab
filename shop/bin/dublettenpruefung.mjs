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

import {
  seitenbefund, eigenerText, abschnitte, abschnittsbefund, DUBLETTENGRENZE,
} from '../src/seitenaehnlichkeit.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';
import { beschreibungsbefund } from '../src/maschinenlesbar.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';

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
const roh = dateien.map((f) => readFileSync(join(ORDNER, f), 'utf8'));
const seiten = dateien.map((f, i) => ({
  id: f.replace(/\.html$/, ''),
  text: eigenerText(roh[i]),
}));

const e = seitenbefund(seiten, DUBLETTENGRENZE);

/* ------------------------------------------------------------------ *
 * Und die Beschreibung, die die Maschine liest — 5. September 2026
 *
 * Diese Prüfung hält seit jeher die **sichtbaren** Artikelseiten
 * gegeneinander. Die `description` in der JSON-LD stand außerhalb: 46 Seiten,
 * **neun** Fassungen, und die neun unterschieden sich ausschließlich im Wort
 * hinter „Verkaufseinheit". Name und Warengruppe, ihre einzigen weiteren
 * Bestandteile, stehen als `name` und `category` im selben Datensatz daneben.
 *
 * > **Der Prüfer, der die Seiten gegeneinander hielt, sah die Auskunft nicht
 * > an, für die dieses Vorhaben ausdrücklich optimiert wird.**
 *
 * Geprüft wird nicht, dass sich je zwei unterscheiden — dazu müsste man
 * Eigenschaften erfinden. Geprüft wird, dass jede **etwas Eigenes** sagt.
 * ------------------------------------------------------------------ */
const preisdatei = join(WURZEL, '..', 'preise', 'baustoff-preise.json');
const lies = (...t) => JSON.parse(readFileSync(join(...t), 'utf8'));
const bb = existsSync(preisdatei)
  ? beschreibungsbefund(ladeBaustoffkatalog(
    lies(WURZEL, 'data', 'katalog-baustoff.json'),
    lies(preisdatei),
    lies(WURZEL, 'data', 'lieferanten.json'),
    ZIELMARGE,
  ).artikel)
  : null;

console.log(`\nDublettenprüfung: ${e.seiten} Artikelseiten, ${e.paare} Paare\n`);
console.log(`  Ähnlichste zwei      ${e.hoechste.wert.toFixed(2)}  (${e.hoechste.a} / ${e.hoechste.b})`);
console.log(`  Median über alle     ${e.median.toFixed(2)}`);
console.log(`  Auf jeder Seite      ${e.gemeinsameWorte} von ${e.mittlereLaenge.toFixed(0)} Wörtern `
  + `(${(e.gemeinsamerAnteil * 100).toFixed(0)} %)`);
console.log(`  Kürzeste Seite       ${e.kuerzeste}`);
if (bb) {
  console.log(`  Beschreibungen (JSON-LD) ${bb.verschieden} eigene Beiträge über ${bb.artikel} Artikel`);
} else {
  console.log('  Beschreibungen (JSON-LD) nicht geprüft — die vertrauliche Preisdatei liegt hier nicht');
}

/**
 * **Wo sitzt die Gleichheit? — ergänzt am 5. September.**
 *
 * Bis heute endete dieser Lauf mit dem Satz, was den gemeinsamen Anteil
 * wirklich senke, sei die Artikelliste des Lieferanten. Gemessen war das nie.
 * Nachgezählt liegt der größte Block eigener Text: der Absatz **Lieferung**.
 * Keine Lieferantenliste macht ihn kürzer.
 *
 * Drei Zahlen je Abschnitt, weil keine allein genügt:
 *
 *   **Schnitt**   was auf ausnahmslos jeder Seite steht — streng, ein
 *                 einziger Ausreißer drückt ihn auf null
 *   **Median**    wie gleich zwei beliebige Seiten sind — irreführend, wenn
 *                 die Verteilung zwei Gipfel hat
 *   **Fassungen** wie viele verschiedene Texte es überhaupt gibt — die Zahl,
 *                 nach der jemand handeln kann
 */
const abschnittsteile = abschnittsbefund(roh.map((h) => abschnitte(h)));
console.log('\n  Wo die Gleichheit sitzt:\n');
console.log('    Abschnitt              Schnitt   Median   Fassungen');
for (const a of abschnittsteile) {
  const schnitt = `${a.gemeinsameWorte}/${a.mittlereLaenge.toFixed(0)} (${(a.anteil * 100).toFixed(0)} %)`;
  const fassung = `${a.fassungen}, größte auf ${a.groessteFassung}`;
  console.log(`    ${a.titel.padEnd(22)} ${schnitt.padEnd(15)} ${a.median.toFixed(2).padStart(6)}   ${fassung}`);
  if (!a.aufJederSeite) console.log(`      (nur auf ${a.seiten} von ${seiten.length} Seiten)`);
}

if (bb && !bb.sauber) {
  console.log(`\n  ✗ ${bb.meldungen.length} Befund(e) an den maschinenlesbaren Beschreibungen:`);
  for (const m of bb.meldungen) console.log(`      ${m.text}  (${m.regel})`);
  console.log('\nEine Beschreibung, die nur wiederholt, was daneben als eigenes Feld steht,');
  console.log('ist eine Schablone — und Assistenten zitieren sie als die Auskunft des Shops.');
  process.exit(1);
}

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

console.log(`\nKein Paar erreicht ${DUBLETTENGRENZE}. Der gemeinsame Anteil ist nicht klein —`);

/**
 * **Der Schluss kommt aus der Messung, nicht aus einer Annahme.**
 *
 * Bis zum 5. September stand hier, der Anteil sei „die Grenze dessen, was aus
 * fünfzehn Lieferantenrechnungen zu holen ist", und was ihn senke, sei die
 * Artikelliste des Lieferanten. Beides war nie gemessen und ist falsch: Der
 * größte Block ist eigener Text.
 *
 * > **Ein Befund, der die Ursache beim Dritten sucht, während sie im eigenen
 * > Haus liegt, macht aus einer lösbaren Aufgabe eine blockierte.**
 */
const groesster = abschnittsteile[0];
console.log(`aber er sitzt nicht überall gleich. Der größte Block ist „${groesster.titel}":`);
console.log(`${groesster.gemeinsameWorte} von ${groesster.mittlereLaenge.toFixed(0)} Wörtern stehen `
  + 'auf jeder Seite. Das ist eigener Text; keine');
console.log('Lieferantenliste macht ihn kürzer — nur ein Absatz, der je Artikel etwas');
console.log('anderes sagt. Was die Artikelliste löst, sind die Kennwerte: dort stehen');
const kennwerte = abschnittsteile.find((a) => /kennwert/i.test(a.titel));
if (kennwerte) {
  console.log(`${kennwerte.fassungen} Fassungen auf ${seiten.length} Seiten, die größte auf `
    + `${kennwerte.groessteFassung} — lauter Platzhaltersätze statt Kennwerten.`);
}
process.exit(0);
