#!/usr/bin/env node
/**
 * Eine Artikelliste des Lieferanten in den Baustoffkatalog übernehmen.
 *
 *   node bin/preisliste.mjs <datei.csv> [--schreiben]
 *
 * Ohne `--schreiben` wird nur gelesen und berichtet — dieselbe Regel wie
 * beim Preislisten-Import: Eine Liste, die den Katalog beim ersten Aufruf
 * überschreibt, ist eine Fehlerquelle mit Ansage.
 *
 * **Erwartete Spalten** (Kopfzeile, Trenner `;`, `,` oder Tabulator):
 *
 *   sku;bezeichnung;einheit;ek_netto[;uvp_netto;gruppe;gewicht_kg;sperrgut;stand]
 *
 * `ek_netto` ist der eigene Einkaufspreis, `uvp_netto` der Listenpreis des
 * Lieferanten — aus ihm entsteht die Angabe „x % unter Listenpreis" auf der
 * Artikelseite. Ohne `uvp_netto` ist der Artikel verkäuflich, aber ohne
 * ausgewiesenen Preisvorteil.
 *
 * Die Preise wandern nach `preise/`, das von `.gitignore` gedeckt ist. Der
 * Katalog in `data/` bleibt preisfrei — dieselbe Trennung wie bei den
 * Rechnungen.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { lesePreisliste, fuegeZusammen } from '../src/preisliste.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const REPO = join(WURZEL, '..');

const KATALOG = process.env.PREISLISTE_KATALOG || join(WURZEL, 'data', 'katalog-baustoff.json');
const PREISE = process.env.PREISLISTE_PREISE || join(REPO, 'preise', 'baustoff-preise.json');

const [, , datei, ...rest] = process.argv;
const schreiben = rest.includes('--schreiben');

if (!datei) {
  console.error('Aufruf: node bin/preisliste.mjs <datei.csv> [--schreiben]');
  console.error('Spalten: sku;bezeichnung;einheit;ek_netto[;uvp_netto;gruppe;gewicht_kg;sperrgut;stand]');
  process.exit(2);
}

// Derselbe Riegel wie im Preislisten-Import: Eine als Muster gekennzeichnete
// Datei enthält erfundene Preise und darf nicht als bestätigt in den Katalog.
if (/muster|beispiel|demo|probe/i.test(resolve(datei))) {
  console.error('\nAbbruch: Diese Datei ist als Muster gekennzeichnet.');
  console.error('Muster enthalten erfundene Preise und dürfen nicht als bestätigt in den Katalog.');
  console.error('Echte Listen außerhalb von beispiel/ ablegen.');
  process.exit(3);
}

let inhalt;
try {
  inhalt = readFileSync(datei, 'utf8');
} catch (fehler) {
  console.error(`Artikelliste nicht lesbar: ${datei}`);
  console.error(`  ${fehler.message}`);
  process.exit(2);
}

const bestandKatalog = existsSync(KATALOG) ? JSON.parse(readFileSync(KATALOG, 'utf8')) : { artikel: [] };
const bestandPreise = existsSync(PREISE) ? JSON.parse(readFileSync(PREISE, 'utf8')) : { preise: {} };
const lieferantId = bestandKatalog.lieferantId ?? 'poschacher';
const heute = new Date().toISOString().slice(0, 10);

const gelesen = lesePreisliste(inhalt, { lieferantId, stand: heute });

console.log(`\nArtikelliste: ${datei}`);
if (gelesen.fehler.length) {
  console.error('\nDie Datei ist so nicht verwendbar:');
  for (const f of gelesen.fehler) console.error(`  ✗ ${f}`);
  console.error('\nErwartet: sku;bezeichnung;einheit;ek_netto[;uvp_netto;gruppe;gewicht_kg;sperrgut;stand]');
  process.exit(2);
}

const zusammen = fuegeZusammen(bestandKatalog, bestandPreise, gelesen);

console.log(`Gelesen:      ${gelesen.artikel.length} Artikel mit Preis`);
console.log(`Abgelehnt:    ${gelesen.abgelehnt.length}`);
console.log(`Neu:          ${zusammen.neu.length}`);
console.log(`Ergänzt:      ${zusammen.ergaenzt.length}`);
console.log(`Unverändert:  ${zusammen.unveraendert.length}`);
console.log(`Katalog danach: ${zusammen.artikel.length} Artikel (vorher ${bestandKatalog.artikel?.length ?? 0})`);

if (gelesen.abgelehnt.length) {
  console.log('\nNicht übernommen — und warum:');
  const nachGrund = new Map();
  for (const a of gelesen.abgelehnt) {
    const art = a.grund.replace(/„[^"]*"/g, '…');
    if (!nachGrund.has(art)) nachGrund.set(art, []);
    nachGrund.get(art).push(a);
  }
  for (const [grund, liste] of nachGrund) {
    console.log(`  ${liste.length}× ${grund}`);
    for (const a of liste.slice(0, 5)) console.log(`      ${a.sku}  ${a.bezeichnung.slice(0, 46)}`);
    if (liste.length > 5) console.log(`      … und ${liste.length - 5} weitere`);
  }
  console.log('\nGate 24: Was der Shop nicht rechnen kann, kann er nicht anbieten.');
}

if (zusammen.ergaenzt.length) {
  console.log('\nVorhandene Artikel ergänzt (der Bestand bleibt, es kommt nur hinzu):');
  for (const e of zusammen.ergaenzt.slice(0, 10)) console.log(`  ${e.sku}: ${e.felder.join(', ')}`);
  if (zusammen.ergaenzt.length > 10) console.log(`  … und ${zusammen.ergaenzt.length - 10} weitere`);
}

if (!schreiben) {
  console.log('\nProbelauf. Zum Schreiben mit --schreiben aufrufen.');
  process.exit(0);
}

// Kein Schreiben, das etwas verliert — dieselbe Sperre wie im Katalogerzeuger.
const vorher = new Map((bestandKatalog.artikel ?? []).map((a) => [a.sku, a]));
const nachher = new Map(zusammen.artikel.map((a) => [a.sku, a]));
const verloren = [...vorher.keys()].filter((s) => !nachher.has(s));
if (verloren.length) {
  console.error(`\nAbbruch: ${verloren.length} Artikel des Bestands wären verschwunden.`);
  for (const s of verloren.slice(0, 10)) console.error(`  ${s}`);
  process.exit(2);
}

writeFileSync(KATALOG, JSON.stringify({
  ...bestandKatalog,
  _datenstand: `${bestandKatalog._datenstand ?? ''} Ergänzt am ${heute} aus einer Artikelliste des Lieferanten (${zusammen.neu.length} neue Artikel).`.trim(),
  artikel: zusammen.artikel,
}, null, 2) + '\n', 'utf8');

writeFileSync(PREISE, JSON.stringify({
  ...bestandPreise,
  _quelle: `${bestandPreise._quelle ?? ''} Ergänzt am ${heute} aus einer Artikelliste des Lieferanten.`.trim(),
  preise: zusammen.preise,
}, null, 2) + '\n', 'utf8');

console.log(`\ngeschrieben: ${KATALOG}`);
console.log(`geschrieben: ${PREISE}  (vertraulich, gitignoriert)`);
console.log('\nDanach: npm run website');
