#!/usr/bin/env node
/**
 * Kommt aus dem Paket wieder heraus, was hineingelegt wurde?
 *
 *   npm run pruefe-paket
 *
 * **Der Anlass, 11. September 2026.** `npm run paket` schreibt das Archiv,
 * das der Auftraggeber hochlädt — 89 Einträge, 3,35 MB, ohne fremde
 * Bibliothek. Geprüft war davon bis heute ein **selbstgebautes Archiv aus
 * zwei Einträgen**: `test/paket.test.js` legt zwei kleine Dateien an, ruft
 * `unzip -t` und ist zufrieden. Die Richtung stimmt, die Größe nicht. Ein
 * handgeschriebenes ZIP kann bei zwei Einträgen tragen und bei 89 brechen —
 * an Versätzen, am Zentralverzeichnis, an Umlauten in Pfaden.
 *
 * > **Das Paket ist das letzte Glied: Alles, was hier gebaut wird, erreicht
 * > die Welt durch diese eine Datei.**
 *
 * Dieser Prüfer misst das **Erzeugnis** und nicht den Bauer:
 *
 *   1. Er ruft `npm run paket` als eigenen Vorgang — geprüft wird die Datei,
 *      die das Werkzeug wirklich schreibt, nicht ein zweiter Nachbau.
 *   2. `unzip -t` ist ein **fremder** Leser. Wer sein eigenes ZIP mit seinem
 *      eigenen Leser prüft, prüft seinen Leser.
 *   3. Ausgepackt wird in einen eigenen Ordner und **Byte für Byte** gegen
 *      `ausgabe/site/` gehalten, in beide Richtungen.
 *   4. `INHALT.txt` wird gegen die ausgepackten Dateien nachgerechnet, in
 *      beide Richtungen.
 *   5. `ABNAHME.txt` gilt gegen die **ausgepackten** Dateien und nicht gegen
 *      den Bau: Was der Auftraggeber nach dem Hochladen abhakt, muss in dem
 *      liegen, was er hochlädt.
 *
 * **Ohne `unzip` läuft er nicht.** Ein grüner Lauf ohne fremden Leser wäre
 * genau die Aussage, die dieser Prüfer nicht machen darf.
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { archivbefund, inhaltsbefund } from '../src/paket.js';
import { wegwerfordner } from '../src/wegwerf.js';
import { abnahmebefund, abnahmeplan } from '../src/abnahme.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

/** Alle Dateien unter einem Ordner, relativ und mit Schrägstrichen. */
function dateienUnter(wurzel) {
  const gefunden = new Map();
  const gehe = (ordner) => {
    for (const e of readdirSync(ordner, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const voll = join(ordner, e.name);
      if (e.isDirectory()) { gehe(voll); continue; }
      if (!statSync(voll).isFile()) continue;
      gefunden.set(relative(wurzel, voll).split('\\').join('/'), readFileSync(voll));
    }
  };
  gehe(wurzel);
  return gefunden;
}

function abbruch(...zeilen) {
  for (const z of zeilen) console.error(z);
  process.exit(2);
}

{
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}
if (!existsSync(SITE)) abbruch('Abbruch: ausgabe/site liegt nicht vor — erst `npm run website`.');

if (spawnSync('which', ['unzip'], { encoding: 'utf8' }).status !== 0) {
  abbruch(
    'Abbruch: `unzip` ist hier nicht vorhanden.',
    'Dieser Prüfer lebt davon, dass ein **fremder** Leser das Archiv öffnet.',
    'Ohne ihn bliebe nur der eigene Nachbau — und ein grüner Lauf darüber wäre',
    'die eine Aussage, die dieses Werkzeug nicht machen darf.',
  );
}

console.log('\nPaketprobe — das Archiv, das hochgeladen wird\n');

/* --- 1. Das Werkzeug selbst laufen lassen -------------------------------- */
const bau = spawnSync('node', [join(SHOP, 'bin', 'paket.mjs')], { encoding: 'utf8', cwd: SHOP });
if (bau.status !== 0) {
  abbruch('Abbruch: `npm run paket` ist gescheitert.', bau.stdout ?? '', bau.stderr ?? '');
}
const geschrieben = /Paket geschrieben: (ausgabe\/\S+\.zip)/.exec(bau.stdout ?? '');
if (!geschrieben) abbruch('Abbruch: das Werkzeug nennt keinen geschriebenen Pfad.', bau.stdout ?? '');
const archiv = join(SHOP, geschrieben[1]);
if (!existsSync(archiv)) abbruch(`Abbruch: ${geschrieben[1]} wurde genannt und liegt nicht vor.`);
const bytes = statSync(archiv).size;
console.log(`  ✓ ${geschrieben[1]} geschrieben, ${(bytes / 1024 / 1024).toFixed(2)} MB`);

let meldungen = [];
let dateienImBau = 0;
/*
 * **Der Ordner räumt sich selbst weg.** Nicht über ein `finally`: Dieser
 * Prüfer endet an fünf Stellen mit `process.exit`, und ein `finally` läuft
 * dabei nicht. `wegwerfordner` hängt sich an `process.on('exit')` — dieselbe
 * Lehre wie am 4. September, als 63 082 Einträge unter /tmp einen Gesamtlauf
 * anhielten.
 */
const ablage = wegwerfordner('paketprobe-');
{
  /* --- 2. Ein fremder Leser --------------------------------------------- */
  const test = spawnSync('unzip', ['-t', archiv], { encoding: 'utf8' });
  if (test.status !== 0 || !/No errors detected/.test(test.stdout ?? '')) {
    meldungen.push({
      regel: 'unzip-weigert-sich',
      text: `unzip -t endet mit Code ${test.status}: ${(test.stdout ?? '').trim().split('\n').pop()}`,
    });
  } else {
    console.log('  ✓ unzip -t: keine Fehler in den Daten');
  }

  /* --- 3. Auspacken und Byte für Byte vergleichen ------------------------ */
  const aus = spawnSync('unzip', ['-q', archiv, '-d', ablage], { encoding: 'utf8' });
  if (aus.status !== 0) {
    abbruch(`Abbruch: das Archiv ließ sich nicht auspacken (Code ${aus.status}).`, aus.stderr ?? '');
  }
  const ausgepackt = dateienUnter(join(ablage, 'site'));
  const gebaut = dateienUnter(SITE);
  if (gebaut.size < 20) {
    abbruch(`Abbruch: nur ${gebaut.size} gebaute Dateien — dieser Abgleich sagt dann nichts.`);
  }
  dateienImBau = gebaut.size;
  const gleichstand = archivbefund(ausgepackt, gebaut);
  meldungen = meldungen.concat(gleichstand.meldungen);
  if (gleichstand.sauber) {
    console.log(`  ✓ ${gebaut.size} Dateien ausgepackt und Byte für Byte gleich, in beide Richtungen`);
  }

  /* --- 4. Das mitgelieferte Inhaltsverzeichnis --------------------------- */
  const summen = new Map();
  const groessen = new Map();
  for (const [name, inhalt] of ausgepackt) {
    summen.set(name, createHash('sha256').update(inhalt).digest('hex'));
    groessen.set(name, inhalt.length);
  }
  const verzeichnis = join(ablage, 'INHALT.txt');
  if (!existsSync(verzeichnis)) {
    meldungen.push({ regel: 'ohne-verzeichnis', text: 'INHALT.txt liegt nicht im Archiv' });
  } else {
    const befund = inhaltsbefund(readFileSync(verzeichnis, 'utf8'), summen, groessen);
    meldungen = meldungen.concat(befund.meldungen);
    if (befund.sauber) {
      console.log(`  ✓ INHALT.txt: ${befund.zeilen} Prüfsummen nachgerechnet, in beide Richtungen`);
    }
  }

  /* --- 5. Die Abnahmeliste gegen das Ausgepackte ------------------------- */
  if (!existsSync(join(ablage, 'ABNAHME.txt'))) {
    meldungen.push({ regel: 'ohne-abnahmeliste', text: 'ABNAHME.txt liegt nicht im Archiv' });
  } else {
    const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
    const alsText = Object.fromEntries([...ausgepackt].map(([n, b]) => [n, b.toString('utf8')]));
    const punkte = abnahmeplan({ ausgabe: alsText, marke: String(betreiber.marke ?? betreiber.firma ?? '') });
    const befund = abnahmebefund({ punkte, ausgabe: alsText });
    meldungen = meldungen.concat(befund.meldungen.map((m) => ({ regel: 'abnahme', text: m.text })));
    // Und die Liste im Archiv muss dieselben Punkte nennen wie die gerade
    // gerechnete — eine Liste, die neben dem Paket entstand, beschreibt beim
    // zweiten Lauf ein anderes.
    const liste = readFileSync(join(ablage, 'ABNAHME.txt'), 'utf8');
    for (const p of punkte) {
      if (!liste.includes(p.erwartet)) {
        meldungen.push({
          regel: 'punkt-nicht-in-der-liste',
          text: `die Abnahmeliste im Archiv nennt „${p.erwartet}" nicht — sie beschreibt ein anderes Paket`,
        });
      }
    }
    if (!meldungen.some((m) => m.regel === 'abnahme' || m.regel === 'punkt-nicht-in-der-liste')) {
      console.log(`  ✓ ABNAHME.txt: ${punkte.length} Punkte, jeder im ausgepackten Bestand belegt`);
    }
  }
}

if (meldungen.length) {
  console.log('');
  for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
  console.log('');
  console.log('Ein Paket, das anders auspackt, als es gepackt wurde, ist der teuerste Fehler');
  console.log('dieser Kette: Geprüft wurde der Bau, hochgeladen wird das Archiv.');
  process.exit(1);
}

console.log('');
console.log(`Paketprobe: ${dateienImBau} Dateien im Archiv gegen den Bau gehalten`);
console.log('Was hineingelegt wurde, kommt wieder heraus — geöffnet von einem fremden Leser.');
process.exit(0);
