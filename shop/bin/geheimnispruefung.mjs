#!/usr/bin/env node
/**
 * Was steht im öffentlichen Verzeichnis, und was lässt sich daraus ausrechnen?
 *
 *   node bin/geheimnispruefung.mjs
 *
 * Zwei Durchgänge:
 *
 *   1. **Abfluss.** Steht eine Einkaufsangabe wörtlich in einer Datei, die
 *      mitgeliefert wird? Das prüft der Lauf immer.
 *   2. **Rekonstruktion.** Wie viele Einkaufspreise lassen sich aus den
 *      veröffentlichten Verkaufspreisen und der bekannten Zielmarge
 *      zurückrechnen? Das prüft der Lauf nur, wenn die vertrauliche Datei
 *      örtlich vorhanden ist — die Gegenprobe braucht sie, der Befund nicht.
 *
 * Der zweite Durchgang ist der eigentliche Grund für dieses Werkzeug.
 * `.gitignore` schützt eine Datei; er schützt keine Angabe, die sich aus
 * zwei veröffentlichten Zahlen ergibt.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { rekonstruierbarkeit, findeAbfluss } from '../src/geheimnis.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(wurzel, '..');

/* ------------------------------------------------------------------ *
 * 1. Abfluss — nur in Dateien, die git tatsächlich mitliefert
 * ------------------------------------------------------------------ */

const nurText = (p) => /\.(js|mjs|json|md|html|csv|txt|py)$/i.test(p);

function verfolgteDateien() {
  const lauf = spawnSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });
  if (lauf.status === 0) return lauf.stdout.split('\n').filter(Boolean).filter(nurText);
  // Ohne git: der ganze Baum ohne die ignorierten Ordner. Schlechter, aber
  // besser als schweigen — und der Lauf sagt, dass er schlechter ist.
  const aus = [];
  const geh = (ordner) => {
    for (const eintrag of readdirSync(ordner)) {
      if (['node_modules', '.git', 'preise', 'veroeffentlichung'].includes(eintrag)) continue;
      const voll = join(ordner, eintrag);
      if (statSync(voll).isDirectory()) geh(voll);
      else if (nurText(voll)) aus.push(relative(repo, voll));
    }
  };
  geh(repo);
  return aus;
}

const mitGit = spawnSync('git', ['-C', repo, 'rev-parse'], { encoding: 'utf8' }).status === 0;
// Testdaten und Beispieldateien tragen **erfundene** Zahlen — sie sind der
// Zweck dieser Dateien. Sie mitzumelden erzeugte Dutzende Treffer, die alle
// harmlos sind, und ein Prüfer, der Dutzende harmlose Treffer meldet, wird
// abgeschaltet. Ausgeschlossen wird deshalb, aber sichtbar: Der Lauf sagt,
// wie viele Dateien er nicht angesehen hat und warum.
const ERFUNDEN = /(^|\/)(test|beispiel)\//;
const alle = verfolgteDateien();
const dateien = alle.filter((d) => !ERFUNDEN.test(d));
const uebergangen = alle.length - dateien.length;
const abfluss = [];
for (const d of dateien) {
  const voll = join(repo, d);
  if (!existsSync(voll)) continue;
  abfluss.push(...findeAbfluss(readFileSync(voll, 'utf8'), d));
}

console.log(`\nDurchgang 1 — Abfluss in ${dateien.length} mitgelieferten Dateien${mitGit ? '' : ' (ohne git ermittelt)'}`);
console.log(`  ${uebergangen} Dateien unter test/ und beispiel/ übergangen — dort stehen erfundene Zahlen.`);
if (abfluss.length === 0) {
  console.log('  Keine Einkaufsangabe steht wörtlich in einer mitgelieferten Datei.');
} else {
  for (const t of abfluss) console.log(`  ${t.name}:${t.zeile}  ${t.art}\n    ${t.auszug}`);
}

/* ------------------------------------------------------------------ *
 * 2. Rekonstruktion — die Rechnung, die jeder anstellen kann
 * ------------------------------------------------------------------ */

const preisDatei = join(repo, 'preise', 'baustoff-preise.json');
console.log(`\nDurchgang 2 — Rekonstruktion aus Verkaufspreis und Zielmarge (${(ZIELMARGE * 100).toFixed(0)} %)`);

if (!existsSync(preisDatei)) {
  console.log('  Die vertrauliche Preisdatei liegt hier nicht — die Gegenprobe entfällt.');
  console.log('  Das ist kein Freispruch: Der Befund hängt an der Rechnung, nicht an der Datei.');
} else {
  const lies = (...t) => JSON.parse(readFileSync(join(...t), 'utf8'));
  const katalog = ladeBaustoffkatalog(
    lies(wurzel, 'data', 'katalog-baustoff.json'),
    lies(preisDatei),
    lies(wurzel, 'data', 'lieferanten.json'),
    ZIELMARGE,
  );
  const artikel = katalog.artikel
    .filter((a) => a.vkNetto > 0 && a.ekNetto > 0)
    .map((a) => ({ sku: a.sku, vkNetto: a.vkNetto, ekNetto: a.ekNetto }));
  const e = rekonstruierbarkeit(artikel, ZIELMARGE);

  console.log(`  ${e.getroffen} von ${e.geprueft} Einkaufspreisen auf den Cent rekonstruierbar `
    + `(${(e.anteil * 100).toFixed(0)} %).`);
  if (e.verfehlt.length) {
    console.log(`  ${e.verfehlt.length} weichen ab — durchweg Artikel am Listendeckel (Gate 22),`);
    console.log('  bei denen der Verkaufspreis gekappt wurde und die Rückrechnung zu tief greift:');
    for (const z of e.verfehlt) {
      console.log(`    ${z.sku}: rekonstruiert ${z.rekonstruiert.toFixed(2)} statt ${z.ekNetto.toFixed(2)} `
        + `(${z.abweichung.toFixed(2)} daneben)`);
    }
    console.log('  Ausgerechnet die Kappung ist damit das Einzige, was etwas verbirgt.');
  }
}

console.log('\nEine Regel, die eine Datei ausschließt, schützt keine Angabe,');
console.log('die sich aus zwei veröffentlichten Zahlen ergibt.');
console.log('Bewertung und Handlungsmöglichkeiten: docs/baustoff-shop/rekonstruierbare-einkaufspreise.md\n');
