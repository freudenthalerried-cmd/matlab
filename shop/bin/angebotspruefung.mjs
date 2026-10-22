#!/usr/bin/env node
/**
 * Was eine Maschine findet, wenn sie heute kommt.
 *
 *   npm run pruefe-angebote
 *
 * Gemessen wird an den **ausgelieferten** Seiten und nicht an der Quelle: Was
 * ein Crawler bekommt, ist das Erzeugnis. Der Grund und die beiden Richtungen
 * stehen im Kopf von `src/angebotsgueltigkeit.js`.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';
import { angebotsbefund, ablaufsatz, VORWARNUNG_TAGE } from '../src/angebotsgueltigkeit.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ordner = join(SHOP, 'ausgabe', 'site', 'artikel');

/*
 * **Gegen das Erzeugnis, nicht gegen das eigene Werkzeug.** Der erste Anlauf
 * fragte `frischebefund(SHOP, 'bin/angebotspruefung.mjs')` — und das ist die
 * falsche Frage: Die Liste nennt, welches Werkzeug welches Erzeugnis **baut**,
 * und dieses hier baut keines, es liest eines. Der Lauf brach mit
 * „Unbekanntes Erzeugnis" ab, und das war richtig so.
 */
const stand = frischebefund(SHOP, 'ausgabe/site');
if (!stand.frisch) {
  for (const zeile of abbruchtext(stand)) console.error(zeile);
  process.exit(2);
}

if (!existsSync(ordner)) {
  console.error('Abbruch: ausgabe/site/artikel fehlt — ohne gebaute Seiten gibt es');
  console.error('nichts zu messen, und nicht messbar ist nicht grün.');
  console.error('Zuerst: npm run build && npm run website');
  process.exit(2);
}

const dateien = readdirSync(ordner).filter((d) => d.endsWith('.html'));
if (!dateien.length) {
  console.error('Abbruch: keine Artikelseite im Ausgabeverzeichnis.');
  process.exit(2);
}

const heute = geschaeftstag();
const e = angebotsbefund(
  dateien.map((d) => ({ name: d, inhalt: readFileSync(join(ordner, d), 'utf8') })),
  heute,
);

console.log(`\nAngebotsgültigkeit am ${heute} — ${e.geprueft} Artikelseiten`);
console.log(`  mit ausgezeichnetem Preis   ${String(e.mitPreis).padStart(3)}`);
console.log(`  davon abgelaufen            ${String(e.abgelaufen).padStart(3)}`);
console.log(`  läuft in ${VORWARNUNG_TAGE} Tagen ab        ${String(e.laeuftBald).padStart(3)}`);
console.log(`  nennt die Grundlage überholt ${String(e.nenntUeberholt).padStart(2)}`);
if (e.naechsterAblauf) console.log(`  nächster Ablauf             ${e.naechsterAblauf}`);
console.log('');

/*
 * **Die Zahl steht hier und ist kein Befund.** Sie wächst, wenn niemand etwas
 * tut, und ein Prüfer, der an der Zeit rot wird, blockiert jeden Commit ohne
 * Zutun — genau der Fehler, den dieser Bestand am 15. Oktober sechsmal
 * gefunden hat. Sie gehört in die Liste der offenen Punkte, wo sie einen
 * Adressaten hat.
 */
if (e.abgelaufen > 0 || e.laeuftBald > 0) {
  console.log('  Was das für die Auffindbarkeit heißt:');
  console.log(`  ${ablaufsatz(e)}`);
  console.log('');
}

if (e.sauber) {
  console.log(`Auszeichnung und Klartext sagen auf allen ${e.mitPreis} Seiten dasselbe.`);
  console.log('Wer die Auszeichnung verlängert, ohne den Satz zu ändern, belügt die Maschine;');
  console.log('wer den Satz entfernt, ohne die Auszeichnung zu ändern, belügt den Menschen.');
  process.exit(0);
}

console.log(`${e.probleme.length} Meldung(en):\n`);
for (const p of e.probleme) {
  console.log(`  ✗ ${p.seite}  [${p.regel}]`);
  console.log(`      ${p.satz}`);
}
console.log('\nBerichtigt wird die Seite, nicht die Frist: Ein längeres priceValidUntil');
console.log('macht aus einem alten Preis keinen neuen, sondern aus einer Auskunft eine');
console.log('Behauptung gegenüber einer Maschine, die sie nicht nachprüfen kann.');
process.exit(1);
