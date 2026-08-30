#!/usr/bin/env node
/**
 * Preisliste eines Lieferanten einlesen.
 *
 *   node bin/import.mjs <lieferantId> <datei.csv> [--schreiben]
 *
 * Ohne --schreiben wird nur geprüft und berichtet. Das ist Absicht: Eine
 * Preisliste, die den Katalog beim ersten Aufruf überschreibt, ist eine
 * Fehlerquelle mit Ansage.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { importierePreisliste, vergleiche } from '../src/import.js';

const [, , lieferantId, datei, ...rest] = process.argv;
const schreiben = rest.includes('--schreiben');

if (!lieferantId || !datei) {
  console.error('Aufruf: node bin/import.mjs <lieferantId> <datei.csv> [--schreiben]');
  process.exit(2);
}

const pfad = (p) => new URL(p, import.meta.url);
const lieferantenDatei = pfad('../data/lieferanten.json');
const artikelDatei = pfad('../data/artikel.json');

const lieferantenDaten = JSON.parse(readFileSync(lieferantenDatei, 'utf8'));
const artikelDaten = JSON.parse(readFileSync(artikelDatei, 'utf8'));

const lieferant = lieferantenDaten.lieferanten.find((l) => l.id === lieferantId);
if (!lieferant) {
  console.error(`Unbekannter Lieferant: ${lieferantId}`);
  console.error('Bekannt sind: ' + lieferantenDaten.lieferanten.map((l) => l.id).join(', '));
  process.exit(2);
}

let inhalt;
try {
  inhalt = readFileSync(datei, 'utf8');
} catch (fehler) {
  console.error(`Preisliste nicht lesbar: ${datei}`);
  console.error(`  ${fehler.message}`);
  process.exit(2);
}

const { artikel, fehler, warnungen } = importierePreisliste(inhalt, lieferant);

const eur = (n) => n.toFixed(2).replace('.', ',') + ' €';
const pct = (n) => (n >= 0 ? '+' : '') + (n * 100).toFixed(1).replace('.', ',') + ' %';

console.log(`\nPreisliste ${datei}`);
console.log(`Lieferant: ${lieferant.name} (${lieferant.id})`);
console.log(`Gelesen: ${artikel.length} Artikel, ${fehler.length} Fehler, ${warnungen.length} Warnungen\n`);

if (fehler.length > 0) {
  console.log('Fehler — diese Zeilen wurden nicht übernommen:');
  for (const f of fehler) console.log('  ✗ ' + f);
  console.log('');
}

if (warnungen.length > 0) {
  console.log('Warnungen:');
  for (const w of warnungen) console.log('  ! ' + w);
  console.log('');
}

const bisher = artikelDaten.artikel.filter((a) => a.lieferantId === lieferantId);
const diff = vergleiche(bisher, artikel);

if (diff.neuzugaenge.length) console.log('Neu:      ' + diff.neuzugaenge.join(', '));
if (diff.entfallen.length) console.log('Entfällt: ' + diff.entfallen.join(', '));
for (const p of diff.preisaenderungen) {
  console.log(`Preis:    ${p.sku}  ${eur(p.vorher)} → ${eur(p.nachher)}  ${pct(p.veraenderung)}`);
}
if (!diff.neuzugaenge.length && !diff.entfallen.length && !diff.preisaenderungen.length) {
  console.log('Keine Änderung gegenüber dem bisherigen Katalog.');
}

const bestaetigt = artikel.filter((a) => a.ekQuelle === 'bestaetigt').length;
console.log(`\nMit bestätigtem Einkaufspreis: ${bestaetigt} von ${artikel.length}`);

if (fehler.length > 0) {
  console.log('\nEs wird nichts geschrieben, solange Fehler offen sind.');
  process.exit(1);
}

if (!schreiben) {
  console.log('\nProbelauf. Zum Übernehmen mit --schreiben aufrufen.');
  process.exit(0);
}

// Beispieldateien enthalten erfundene Einkaufspreise. Würden sie geschrieben,
// stünde ekQuelle auf "bestaetigt" und die Sperre in bestellung.js fiele weg —
// der Shop hielte erfundene Konditionen für echte. Deshalb hier ein Riegel.
// Geprüft wird der aufgelöste Pfad, nicht das Argument: ein relativer Name aus
// beispiel/ heraus trüge das Verzeichnis sonst nicht im Text.
if (/muster|beispiel|demo/i.test(resolve(datei))) {
  console.error('\nAbbruch: Diese Datei ist als Muster gekennzeichnet.');
  console.error('Muster enthalten erfundene Preise und dürfen nicht als bestätigt in den Katalog.');
  console.error('Echte Preislisten außerhalb von beispiel/ ablegen.');
  process.exit(3);
}

/**
 * **Das Schreiben ist seit dem 30.08. gesperrt.** Drei Gründe, und der
 * dritte allein genügt:
 *
 * 1. **Ziel ist eine tote Datei.** `data/artikel.json` trägt neun
 *    Platzhalterartikel des abgelösten Radon-Modells — Drainagerohr,
 *    Warengruppe „Drainage", die dieser Shop ausdrücklich nicht führt. Der
 *    Shop liest sie nicht; er liest `data/katalog-baustoff.json`. Ein
 *    Import hierher hätte ordentlich berichtet und nichts bewirkt.
 * 2. **Falsche Marge in der Warnschwelle.** Der Aufruf ließ die Zielmarge
 *    offen, und der Vorgabewert war der des alten Modells (35 % statt 25 %).
 *    Der Verkaufspreis wird nicht gespeichert, also waren die Warnungen
 *    falsch, nicht die Preise. Behoben.
 * 3. **Einkaufspreise in eine öffentliche Datei.** Der erzeugte Datensatz
 *    trägt `ekNetto` und `uvpNetto`. `data/` ist versioniert und öffentlich;
 *    die Konditionen gehören nach `preise/`, das `.gitignore` deckt. Genau
 *    dafür wurde `bin/katalog-aus-rechnungen.mjs` am 22.08. gebaut.
 *
 * Der **Probelauf bleibt** — eine Liste durchrechnen und die Befunde lesen
 * ist genau das, was am Tag der Lieferantenliste zuerst gebraucht wird.
 */
if (schreiben) {
  console.error('\nAbbruch: Dieses Werkzeug schreibt nicht mehr.');
  console.error('  · Ziel wäre data/artikel.json — der Platzhalterbestand des abgelösten Modells.');
  console.error('  · Der Shop liest data/katalog-baustoff.json.');
  console.error('  · Der Datensatz trüge Einkaufspreise in ein öffentliches Verzeichnis.');
  console.error('\nDer Weg in den Katalog führt über bin/katalog-aus-rechnungen.mjs (npm run katalog):');
  console.error('  data/katalog-baustoff.json  öffentlich, ohne Preise');
  console.error('  preise/baustoff-preise.json lokal, gitignoriert');
  console.error('\nDieser Probelauf hat die Liste geprüft — die Befunde oben gelten.');
  process.exit(3);
}


