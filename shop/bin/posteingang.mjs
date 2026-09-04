#!/usr/bin/env node
/**
 * Vom Journal des Shops zum Angebot.
 *
 *   npm run posteingang                       — was liegt da?
 *   npm run posteingang -- --nummer B-2026-0001 --nach ../vorgaenge/0001
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg steht bis zur Zeile im
 * Journal, und `npm run vorgang` beginnt bei zwei Dateien. Dazwischen lag
 * Abtipparbeit — dieselbe, gegen die `npm run anfrage-lesen` am 3. September
 * gebaut wurde, nur eine Stufe später.
 *
 * ## Wo das Journal liegt
 *
 * Auf dem Hosting, in `bestellungen/journal-<jahr>.jsonl` **über** dem
 * Webverzeichnis. Der Betreiber lädt es herunter; dieses Werkzeug erwartet es
 * unter `ablage/posteingang/` — also im gesperrten Bereich, aus demselben
 * Grund wie die Vorgangsablage: Es trägt Namen, Anschriften und Beträge, und
 * dieses Verzeichnis ist öffentlich.
 *
 * ## Was es nicht tut
 *
 * Es rechnet nichts nach und entscheidet nichts. Ob die Positionen stimmen,
 * prüft `leseAnfrage` gegen den Katalog — dort, wo der Beleg entsteht. Eine
 * zweite Nachrechnung hier wären zwei Rechnungen über denselben Warenkorb.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

import { BESTELLFELDER } from '../src/bestellfelder.js';
import { pruefeBestelldaten } from '../src/kunde.js';
import { ABLAGEORT } from '../src/ablageort.js';
import { kundendatei, leseJournal, posteingangsbefund } from '../src/posteingang.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const argumente = process.argv.slice(2);
const wahl = (name, ersatz = null) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 && argumente[i + 1] ? argumente[i + 1] : ersatz;
};

const jahr = Number(wahl('jahr', String(new Date().getFullYear())));
const journal = wahl('journal', join(REPO, ABLAGEORT, 'posteingang', `journal-${jahr}.jsonl`));
const nummer = wahl('nummer');
const nach = wahl('nach');

if (!existsSync(journal)) {
  console.log(`Kein Posteingang unter ${relative(REPO, journal)}.\n`);
  console.log('Das Journal liegt auf dem Hosting, in bestellungen/journal-<jahr>.jsonl über dem');
  console.log('Webverzeichnis. Heruntergeladen gehört es hierher — in den gesperrten Bereich,');
  console.log('weil es Namen, Anschriften und Beträge trägt.');
  process.exit(0);
}

const { zeilen, meldungen } = leseJournal(readFileSync(journal, 'utf8'));
const befund = posteingangsbefund(zeilen, pruefeBestelldaten);
const bereit = befund.filter((b) => b.bereit);

console.log(`Posteingang — ${befund.length} Bestellungen, ${bereit.length} davon angebotsreif\n`);

for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
if (meldungen.length) console.log('');

for (const b of befund) {
  console.log(`  ${b.bereit ? '✓' : '·'} ${b.nummer}  ${b.zeitpunkt ?? ''}  ${b.firma ?? ''} (${b.bezirk ?? '—'})`);
  for (const h of b.hindernisse) console.log(`        ${h}`);
}
console.log('');

// --- Herausschneiden --------------------------------------------------------

if (!nummer) {
  if (bereit.length) {
    console.log('Zum Weiterarbeiten:');
    console.log(`  npm run posteingang -- --nummer ${bereit[0].nummer} --nach ../vorgaenge/${bereit[0].nummer}`);
  }
  process.exit(meldungen.length ? 1 : 0);
}

const gewaehlt = befund.find((b) => b.nummer === nummer);
if (!gewaehlt) {
  console.error(`Abbruch: ${nummer} steht nicht im Journal.`);
  process.exit(1);
}
if (!gewaehlt.bereit) {
  console.error(`Abbruch: Aus ${nummer} wird kein Angebot.`);
  for (const h of gewaehlt.hindernisse) console.error(`  · ${h}`);
  console.error('\nDie fehlenden Angaben stehen im Formular der Kasse. Fehlen sie hier,');
  console.error('ist die Bestellung vor einer Änderung des Formulars eingegangen — oder');
  console.error('jemand hat die Zeile bearbeitet.');
  process.exit(1);
}
if (!nach) {
  console.error('Abbruch: Ohne --nach weiß dieses Werkzeug nicht, wohin.');
  console.error('Erwartet wird ein Ordner außerhalb dieses Verzeichnisses — Kundendaten');
  console.error('sind die des Kunden.');
  process.exit(2);
}

/**
 * **Nicht ins Verzeichnis schreiben.** Dieselbe Regel wie bei der Ablage: Was
 * Namen und Anschriften trägt, gehört nicht in ein öffentliches Repository,
 * und `.gitignore` hilft nur, solange niemand daran vorbeischreibt.
 */
const ziel = resolve(nach);
if ((ziel + '/').startsWith(REPO + '/') && !(ziel + '/').startsWith(join(REPO, ABLAGEORT) + '/')) {
  console.error(`Abbruch: ${ziel} liegt im Verzeichnis.`);
  console.error(`Erlaubt sind Orte außerhalb — oder ${ABLAGEORT}/, das gesperrt ist.`);
  process.exit(2);
}

mkdirSync(ziel, { recursive: true });
writeFileSync(join(ziel, 'anfrage.txt'), `${gewaehlt.eintrag.text}\n`, 'utf8');
writeFileSync(join(ziel, 'kunde.json'),
  `${JSON.stringify(kundendatei(gewaehlt.eintrag, BESTELLFELDER), null, 2)}\n`, 'utf8');

console.log(`Herausgeschnitten nach ${ziel}:`);
console.log('  anfrage.txt   der Text, den die Kasse gebaut hat');
console.log('  kunde.json    die Angaben aus dem Bestellformular');
console.log('\nWeiter mit:');
console.log(`  npm run vorgang -- ${join(ziel, 'anfrage.txt')} \\`);
console.log(`    --kunde ${join(ziel, 'kunde.json')} --nummer ${nummer.replace(/^B-/, '')}`);
console.log('\nDort wird nachgerechnet, geprüft und der Beleg erzeugt. Hier wurde nur');
console.log('herausgeschnitten — nichts entschieden und nichts versendet.');
