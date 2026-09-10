#!/usr/bin/env node
/**
 * Ein Archiv aus dem gebauten Ordner — das, was hochgeladen wird.
 *
 *   npm run paket
 *
 * **Der Anlass, 8. September 2026.** Der oberste offene Punkt lautet seit
 * Wochen „`ausgabe/site/` auf bauversand.com hochladen"; hochladen kann nur
 * der Auftraggeber. Übergeben wurden ihm dafür **87 Dateien in fünf Ordnern**.
 *
 * > **Ein Ergebnis, das nur als Ordnerbaum vorliegt, ist noch nicht übergeben.**
 *
 * Dieses Werkzeug schreibt ein ZIP ohne Kompression und ohne fremde
 * Bibliothek, legt die **Abnahmeliste** als Textdatei dazu und ein
 * Inhaltsverzeichnis mit Prüfsummen. Wer das Archiv auspackt, hat den ganzen
 * Shop und die acht Punkte, an denen sich nach dem Hochladen zeigt, ob er
 * wirklich ausgeliefert wird.
 *
 * **Was es nicht tut:** hochladen. Für bauversand.com ist der Netzausgang
 * dieser Umgebung gesperrt, und ein Upload wäre ohnehin eine Handlung nach
 * außen.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { abnahmebefund, abnahmeplan } from '../src/abnahme.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';
import { baueZip } from '../src/paket.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');
const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
const BASIS = String(betreiber.domain ?? '').replace(/\/+$/, '');
const MARKE = String(betreiber.marke ?? betreiber.firma ?? '');

{
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}

if (!existsSync(SITE)) {
  console.error('Abbruch: ausgabe/site liegt nicht vor — erst `npm run website`.');
  process.exit(2);
}

const dateien = [];
const gehe = (ordner) => {
  for (const e of readdirSync(ordner, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const voll = join(ordner, e.name);
    if (e.isDirectory()) { gehe(voll); continue; }
    if (statSync(voll).isFile()) dateien.push(relative(SITE, voll).split('\\').join('/'));
  }
};
gehe(SITE);

if (!dateien.length) {
  console.error('Abbruch: ausgabe/site ist leer — ein Archiv über nichts ist kein Archiv.');
  process.exit(2);
}

const inhalte = new Map(dateien.map((d) => [d, readFileSync(join(SITE, d))]));

/*
 * **Die Abnahmeliste gehört ins Archiv, nicht daneben.** Sie wird aus
 * denselben Dateien abgeleitet, die gerade eingepackt werden — eine Liste, die
 * neben dem Paket liegt, beschreibt beim zweiten Hochladen ein anderes.
 */
const alsText = Object.fromEntries(dateien.map((d) => [d, inhalte.get(d).toString('utf8')]));
const punkte = abnahmeplan({ ausgabe: alsText, marke: MARKE });

/*
 * **Der erste Anlauf filterte die Eingabe** auf Textendungen — und die Liste
 * im Archiv hatte **sechs** Punkte, während `npm run abnahme` acht nennt. Eine
 * gefilterte Eingabe erzeugt still eine kürzere Liste, und die kürzere sah
 * genauso vollständig aus. Gelesen wird jetzt derselbe Ordner wie dort, und
 * der Befund des Moduls entscheidet, ob die Liste taugt.
 */
const plan = abnahmebefund({ punkte, ausgabe: alsText });
if (!plan.sauber) {
  console.error('Abbruch: die Abnahmeliste für das Archiv trägt nicht.');
  for (const m of plan.meldungen) console.error(`  ✗ ${m.text}`);
  console.error('Ein Paket mit einer halben Abnahmeliste ist schlechter als keines:');
  console.error('Wer sie abhakt, hält den Shop für geprüft.');
  process.exit(1);
}
const abnahme = [
  `Abnahme nach dem Hochladen — ${punkte.length} Punkte`,
  `Ziel: ${BASIS || '[[ Domain fehlt in data/betreiber.json ]]'}`,
  '',
  'Jeden Punkt im Browser aufrufen und nachsehen, ob der genannte Text darin steht.',
  'Schlaegt einer fehl, ist die Datei nicht ausgeliefert oder falsch ausgeliefert.',
  '',
  ...punkte.flatMap((p, i) => [
    `${String(i + 1).padStart(2)}. ${BASIS}${p.pfad}`,
    `    muss enthalten: ${p.erwartet}`,
    `    ${p.warum}`,
    '',
  ]),
].join('\n');

const summe = (b) => createHash('sha256').update(b).digest('hex');
const verzeichnis = [
  `Inhalt des Archivs — ${dateien.length} Dateien aus ausgabe/site/`,
  'Spalten: SHA-256, Groesse in Bytes, Pfad',
  '',
  ...dateien.map((d) => `${summe(inhalte.get(d))}  ${String(inhalte.get(d).length).padStart(8)}  ${d}`),
].join('\n');

const stand = new Date();
const name = `bauversand-${stand.toISOString().slice(0, 10)}.zip`;
const ziel = join(SHOP, 'ausgabe', name);

const archiv = baueZip([
  ...dateien.map((d) => ({ name: `site/${d}`, inhalt: inhalte.get(d) })),
  { name: 'ABNAHME.txt', inhalt: Buffer.from(`${abnahme}\n`, 'utf8') },
  { name: 'INHALT.txt', inhalt: Buffer.from(`${verzeichnis}\n`, 'utf8') },
], stand);

mkdirSync(dirname(ziel), { recursive: true });
writeFileSync(ziel, archiv);

console.log(`\nPaket geschrieben: ausgabe/${name}`);
console.log(`  ${dateien.length} Dateien aus ausgabe/site/, dazu ABNAHME.txt und INHALT.txt`);
console.log(`  ${(archiv.length / 1024 / 1024).toFixed(2)} MB, ungepackt gespeichert`);
console.log(`  SHA-256 des Archivs: ${summe(archiv)}`);
console.log('');
console.log('Hochgeladen wird der **Inhalt** von site/ in das Webverzeichnis — nicht der');
console.log('Ordner site/ selbst, sonst liegt der Shop unter /site/ statt unter /.');
console.log('Danach die acht Punkte aus ABNAHME.txt im Browser durchgehen.');
