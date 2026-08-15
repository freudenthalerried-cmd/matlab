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

const kern = [
  entkleide(lies('./src/format.js')),
  entkleide(lies('./src/preis.js')),
  entkleide(lies('./src/warenkorb.js')),
  entkleide(lies('./src/bedarf.js')),
  entkleide(lies('./src/kunde.js')),
  entkleide(lies('./src/messwert.js')),
  entkleide(lies('./src/rechtstexte.js')),
  entkleide(lies('./src/bestellung.js')),
  entkleide(lies('./src/beleg.js')),
  entkleide(lies('./src/auftragslauf.js')),
  entkleide(lies('./src/vies.js')),
  entkleide(lies('./src/ablage.js')),
  entkleide(lies('./src/zahlung.js')),
  entkleide(lies('./src/kostenbild.js')),
].join('\n');

/**
 * Namenskollisionen im Bündel finden.
 *
 * Getrennte Module dürfen denselben Namen tragen; im zusammengefügten Skript
 * ist das ein SyntaxError, und dann läuft die ganze Seite nicht. Genau das ist
 * mit einer Hilfsfunktion namens `EUR` passiert — die Tests blieben grün, weil
 * sie die Module einzeln laden. Der Bauschritt muss es deshalb selbst merken.
 */
function pruefeNamenskollisionen(quelle) {
  const gesehen = new Map();
  const doppelt = [];
  const muster = /^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm;
  for (const treffer of quelle.matchAll(muster)) {
    const name = treffer[1];
    if (gesehen.has(name)) doppelt.push(name);
    else gesehen.set(name, true);
  }
  if (doppelt.length) {
    throw new Error(
      'Doppelt deklariert im Bündel: ' + [...new Set(doppelt)].join(', ') +
        '\nIm Modul harmlos, im zusammengefügten Skript ein SyntaxError.',
    );
  }
}

pruefeNamenskollisionen(kern);

const html = lies('./demo-template.html')
  .replace('/*__KERN__*/', kern)
  .replace('/*__DATEN__*/', JSON.stringify(daten));

writeFileSync(new URL('./demo.html', import.meta.url), html);
console.log('demo.html geschrieben — ' + daten.artikel.artikel.length + ' Artikel, ' + daten.lieferanten.lieferanten.length + ' Lieferanten');
