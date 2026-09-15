#!/usr/bin/env node
/**
 * Prüft eine veröffentlichte Beschreibung gegen ihre eigene Marke.
 *
 *   npm run pruefe-marke                 > prüft die Ausgabe des Werkzeugs
 *   npm run pruefe-marke -- <datei>      > prüft eine zurückgelesene Fassung
 *
 * **Warum es zwei Fälle gibt.** Ohne Datei prüft dieses Werkzeug sich selbst:
 * dass `bin/prtext.mjs` eine Marke setzt, die zu seinem Text passt. Das ist
 * die kleinere Auskunft — sie sagt, dass die Marke richtig entsteht, nicht,
 * dass die richtige Fassung draußen steht.
 *
 * Die größere Auskunft braucht eine Datei: die **zurückgelesene**
 * Veröffentlichung. Wer sie hat — der Auftraggeber im Browser, ein späterer
 * Lauf mit Netz, jeder mit einem Zugang zu GitHub — bekommt hier die Antwort,
 * die vorher niemand rechnen konnte: ob der veröffentlichte Text der ist, den
 * das Werkzeug ausgegeben hat.
 *
 * > **Die Quelle wird dafür nicht gebraucht.** Die Fassung prüft sich selbst.
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { markenbefund } from '../src/veroeffentlichung.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const datei = process.argv[2];

let fassung;
let woher;

if (datei) {
  if (!existsSync(datei)) {
    console.error(`Abbruch: ${datei} gibt es nicht.`);
    console.error('Ohne die zurückgelesene Fassung ist hier nichts zu messen, und eine');
    console.error('Auskunft ohne Grundlage wäre geraten.');
    process.exit(2);
  }
  fassung = readFileSync(datei, 'utf8').replace(/\n$/, '');
  woher = relative(SHOP, datei) || datei;
} else {
  const lauf = spawnSync('node', [join(SHOP, 'bin', 'prtext.mjs')], { cwd: SHOP, encoding: 'utf8' });
  if (lauf.status !== 0) {
    console.error('Abbruch: `npm run pr-text` lief nicht — ohne seine Ausgabe ist nichts zu prüfen.');
    process.exit(2);
  }
  fassung = lauf.stdout.replace(/\n$/, '');
  woher = 'die Ausgabe von `npm run pr-text`';
}

const b = markenbefund(fassung);

console.log(`\nMarkenprüfung — ${woher}\n`);

if (b.passt) {
  console.log(`  ✓ ${b.text}`);
  console.log(`      sha256:${b.soll.slice(0, 16)}… über ${b.zeichen} Zeichen`);
  console.log(`      Quelle laut Marke: ${b.quelle}`);
} else {
  console.log(`  ✗ ${b.text}  [${b.regel}]`);
  if (b.soll) {
    console.log(`      Marke sagt : sha256:${b.soll}`);
    console.log(`      gerechnet  : sha256:${b.ist}`);
  }
}

if (!datei) {
  console.log('\nGeprüft wurde die Werkzeugausgabe, nicht die Veröffentlichung.');
  console.log('Für die Veröffentlichung: die Beschreibung von GitHub in eine Datei');
  console.log('sichern und `npm run pruefe-marke -- <datei>` darauf laufen lassen.');
} else {
  console.log('\nGeprüft wurde eine Fassung gegen sich selbst — ohne die Quelle daneben.');
}
console.log('Ein Abgleich, den niemand rechnet, findet nur, was auffällt.');

process.exit(b.passt ? 0 : 1);
