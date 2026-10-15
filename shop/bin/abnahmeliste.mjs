#!/usr/bin/env node
/**
 * Was nach dem Hochladen im Browser nachzusehen ist.
 *
 *   npm run abnahme
 *
 * **Der Anlass, 6. September 2026.** Der Rolloutplan geht vom Hochladen
 * unmittelbar zur Search Console. Dazwischen fehlt die Frage, ob der Server
 * überhaupt herausgibt, was im Ordner liegt — und seit der Fehlerseite hängt
 * daran eine Zeile in `.htaccess`, deren Wirkung von hier aus nicht messbar
 * ist.
 *
 * Dieses Werkzeug **prüft nichts im Netz**. Es erzeugt die Liste, die jemand
 * mit Netz abarbeitet, und misst an ihr das, was hier messbar ist: dass jeder
 * Punkt auf eine Datei zeigt, die es gibt, und auf einen Text, der darin
 * steht.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { abnahmeplan, abnahmebefund, FEHLERPROBE } from '../src/abnahme.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');
const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
const BASIS = String(betreiber.domain ?? '').replace(/\/+$/, '');
const MARKE = String(betreiber.marke ?? betreiber.firma ?? '');

if (!existsSync(SITE)) {
  console.error('ausgabe/site liegt nicht vor — erst `npm run website`.');
  console.error('Eine Abnahmeliste ohne Erzeugnis wäre eine Liste über nichts.');
  process.exit(2);
}

const ausgabe = {};
const gehe = (ordner) => {
  for (const e of readdirSync(ordner, { withFileTypes: true })) {
    const voll = join(ordner, e.name);
    if (e.isDirectory()) { gehe(voll); continue; }
    if (statSync(voll).isFile()) ausgabe[relative(SITE, voll)] = readFileSync(voll, 'utf8');
  }
};
gehe(SITE);

const punkte = abnahmeplan({ ausgabe, marke: MARKE });
const b = abnahmebefund({ punkte, ausgabe });

console.log(`\nAbnahme nach dem Hochladen — ${punkte.length} Punkte, `
  + `abgeleitet aus ${Object.keys(ausgabe).length} Dateien im Ausgabeordner\n`);
console.log(`Ziel: ${BASIS || '[[ Domain fehlt in data/betreiber.json ]]'}\n`);

for (const [i, p] of punkte.entries()) {
  console.log(`  ${String(i + 1).padStart(2)}. ${BASIS}${p.pfad}`);
  console.log(`      muss enthalten: „${p.erwartet.slice(0, 72)}"`);
  console.log(`      ${p.warum}`);
  console.log('');
}

console.log(`Der Pfad „${FEHLERPROBE}" ist absichtlich erfunden: Er soll die Fehlerseite`);
console.log('auslösen. Kommt dort die Seite des Hosters, ist die `.htaccess` nicht wirksam.\n');

if (!b.sauber) {
  for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log(`\n${b.meldungen.length} Meldung(en) — die Liste fragt nach etwas, das im Ordner nicht steht.`);
  process.exit(1);
}

console.log('Jeder Punkt zeigt auf eine Datei, die es gibt, und auf einen Text, der darin steht.');
console.log('Was hier nicht geht, ist die eine Frage, um die es geht: ob der Server sie');
console.log('unter dieser Adresse herausgibt. Genau dafür ist diese Liste da.');
process.exit(0);
