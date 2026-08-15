/**
 * Baut aus Daten und Rechenkern eine einzelne, in sich geschlossene HTML-Datei.
 *
 * Der Rechenkern wird nicht nachgebaut, sondern eingebettet — damit im Shop
 * dieselbe Logik läuft, die die Tests prüfen. Eine zweite Preisrechnung im
 * Frontend wäre die sicherste Art, unbemerkt falsche Preise anzuzeigen.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const lies = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

const daten = {
  lieferanten: JSON.parse(lies('./data/lieferanten.json')),
  artikel: JSON.parse(lies('./data/artikel.json')),
};

// Module zu einem Inline-Skript verbinden: Import-Zeile entfernen, Exporte entkleiden.
const entkleide = (quelle) =>
  quelle
    .replace(/^import[^;]+;\s*$/gm, '')
    .replace(/^export (const|function) /gm, '$1 ');

const kern = [entkleide(lies('./src/preis.js')), entkleide(lies('./src/warenkorb.js'))].join('\n');

const html = lies('./demo-template.html')
  .replace('/*__KERN__*/', kern)
  .replace('/*__DATEN__*/', JSON.stringify(daten));

writeFileSync(new URL('./demo.html', import.meta.url), html);
console.log('demo.html geschrieben — ' + daten.artikel.artikel.length + ' Artikel, ' + daten.lieferanten.lieferanten.length + ' Lieferanten');
