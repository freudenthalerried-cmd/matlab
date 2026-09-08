#!/usr/bin/env node
/**
 * Stimmen die Zahlen in den offenen Punkten noch?
 *
 *   npm run pruefe-punkte
 *
 * Die Begründung steht in `src/punktezahlen.js`. Kurz: `src/offenepunkte.js`
 * fragt die Werkzeuge, **welche** Punkte offen sind, und schreibt selbst, was
 * in ihnen steht. Am 8. September hieß ein Punkt „Suchvolumen der 32 Keywords
 * im Liefergebiet messen", während die Messliste seit dem 6. September 29
 * Begriffe führt.
 *
 * Gemessen wird an den Datendateien und an der Messliste — nicht an einer
 * zweiten Liste, die dieselbe Zahl noch einmal behauptet.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';
import { OHNE_WERKZEUG } from '../src/offenepunkte.js';
import { GRENZE_TAGE } from '../src/preisalter.js';
import { punktebefund } from '../src/punktezahlen.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Die Zahl der Begriffe steht in der Messliste, und die schreibt
// `npm run messliste` aus derselben Quelle wie die Anzeigendateien. Ist die
// Kampagne veraltet, ist die Messliste es auch — dann wäre die gemessene Zahl
// die von gestern, und der Prüfer bestätigte eine überholte Aufgabe.
const messlistendatei = join(SHOP, 'ausgabe', 'messliste-baustoff.json');
if (!existsSync(messlistendatei)) {
  console.error(`Abbruch: ${messlistendatei} fehlt — zuerst \`npm run messliste\`.`);
  console.error('Eine Messung ohne Gegenstand meldet Grün und hat nichts geprüft.');
  process.exit(2);
}
const stand = frischebefund(SHOP, 'ausgabe/kampagne');
if (!stand.frisch) {
  for (const zeile of abbruchtext(stand)) console.error(zeile);
  process.exit(2);
}

// Und die Messliste muss jünger sein als die Kampagne, aus der sie kommt.
// Sonst stünde eine frisch gebaute Anzeigenliste neben einer Zahl von gestern
// — genau der Fall, gegen den dieser Prüfer gebaut ist, eine Ebene tiefer.
if (statSync(messlistendatei).mtimeMs < statSync(join(SHOP, 'ausgabe', 'kampagne')).mtimeMs) {
  console.error('Abbruch: ausgabe/messliste-baustoff.json ist älter als ausgabe/kampagne'
    + ' — zuerst `npm run messliste`.');
  console.error('Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.');
  process.exit(2);
}

const katalog = lies(join(SHOP, 'data', 'katalog-baustoff.json'));
const betreiber = lies(join(SHOP, 'data', 'betreiber.json'));
const messliste = lies(messlistendatei);

const messwerte = {
  artikel: katalog.artikel.length,
  mitGewicht: katalog.artikel.filter((a) => a.gewichtKg != null).length,
  mindestbestellwert: betreiber.mindestbestellwertNetto,
  grenzeTage: GRENZE_TAGE,
  begriffe: messliste.gruppen.reduce((n, g) => n + g.keywords.length, 0),
};

// Der Punkt ist das, was der Auftraggeber liest: Titel, Grund und
// Lösungssatz. Kommentare im Quelltext gehören nicht dazu — sie stehen nicht
// in der Liste, die er bekommt.
const punkte = OHNE_WERKZEUG.map((p) => ({
  id: p.id,
  text: [p.titel, p.warumKeinWerkzeug, p.loest].filter(Boolean).join(' '),
}));

const { geprueft, meldungen } = punktebefund({
  punkte,
  messwerte,
  gibtEs: (pfad) => existsSync(join(REPO, pfad)),
  // Hier liegt die ganze Liste vor, also gilt auch die zweite Richtung: Ein
  // Freibrief, zu dem keine Zahl mehr steht, ist ein Fund.
  vollstaendig: true,
});

console.log(`Offene Punkte — ${geprueft} lebende Zahlen in ${punkte.length} von Hand geführten Punkten\n`);

if (meldungen.length === 0) {
  console.log('Keine Meldung. Keine Zahl der Liste ist älter als der Bestand,');
  console.log('und kein Satz behauptet eine Messung, deren Grundlage fehlt.');
  process.exit(0);
}

for (const m of meldungen) {
  console.log(`  ✗ ${m.text}`);
  console.log(`      [${m.regel}]`);
}

console.log(`\n${meldungen.length} Meldung(en).`);
console.log('„zahl-veraltet" heißt: die Zahl nachziehen. „zahl-ohne-eintrag" heißt:');
console.log('messen oder in OHNE_MESSUNG begründen — das Muster zu löschen wäre der');
console.log('falsche Ausweg, dann prüft niemand mehr diese Zahl.');
process.exit(1);
