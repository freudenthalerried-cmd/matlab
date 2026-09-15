#!/usr/bin/env node
/**
 * Hält die Lieferantenanfrage gegen die offenen Punkte — und druckt sie.
 *
 * Drei Fragen:
 *
 * 1. **Bleibt ein Punkt der Gruppe „Anfrage an Dritte" ungefragt?** Das ist
 *    die Richtung, die zählt: Ein Punkt ohne Frage bleibt nach dem Gespräch
 *    offen, und niemand merkt es, weil das Gespräch stattgefunden hat.
 * 2. **Steht eine Frage im Brief, die keinen offenen Punkt mehr schließt?**
 *    Jede zusätzliche Frage senkt die Antwortwahrscheinlichkeit aller
 *    übrigen — eine überflüssige kostet die Antwort auf eine nötige.
 * 3. **Darf der Brief überhaupt hinaus?** Ohne Rückantwortadresse ist er eine
 *    Frage ohne Empfänger für die Antwort.
 *
 * Die offenen Punkte kommen aus `offenepunkte.mjs` selbst, nicht aus einer
 * zweiten Zusammenstellung. Ein erster Anlauf an anderer Stelle hat genau das
 * getan und meldete 2 statt 15.
 *
 * **Dieses Werkzeug versendet nichts.** Es druckt einen Text, den der
 * Auftraggeber versenden kann.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gruppen } from './offenepunkte.mjs';
import {
  FRAGEN, punkteOhneFrage, fragenOhnePunkt, erzeugeLieferantenanfrage,
  selbstzaehlungsbefund,
  deckungsbefund,
  nachfragesatz,
} from '../src/lieferantenanfrage.js';
import { HERSTELLER } from '../src/hersteller.js';
import { liesSystemliste } from '../src/systemlisten.js';
import { SYSTEM_UNBEKANNT } from '../src/systemtreue.js';
import { lueckensatz, sortimentsluecken } from '../src/sortimentsluecke.js';

const hier = dirname(fileURLToPath(import.meta.url));
const lies = (...p) => JSON.parse(readFileSync(join(hier, '..', ...p), 'utf8'));

const betreiber = lies('data', 'betreiber.json');
const lieferanten = lies('data', 'lieferanten.json').lieferanten;
// Der Lieferant, aus dessen Rechnungen der Katalog stammt — nicht der erste
// der Liste: Die drei Radon-Lieferanten davor sind Platzhalter.
const lieferant = lieferanten.find((l) => l.konditionenStand === 'bestaetigt');

const anfragePunkte = gruppen.find((g) => g.id === 'anfrage')?.punkte ?? [];
const ungefragt = punkteOhneFrage(anfragePunkte);
const ueberfluessig = fragenOhnePunkt(anfragePunkte);

if (!lieferant) {
  console.error('Abbruch: kein Lieferant mit bestätigten Konditionen — an wen ginge die Anfrage?');
  process.exit(2);
}
if (anfragePunkte.length === 0) {
  console.error('Abbruch: keine offenen Punkte der Gruppe „Anfrage" — dann prüft dieser Lauf nichts.');
  process.exit(2);
}

// **Die Lücken aus den eigenen Systemlisten — 8. September 2026.** Die einzige
// offene Weisung des Auftraggebers heißt „Sortiment auf mindestens 100
// Artikel". Der Brief bat um die Artikelliste und nannte nicht, was konkret
// fehlt, obwohl der Bestand es weiß: Sieben Positionen der vier Systemlisten
// tragen „(nicht im Sortiment)", zwei davon sind eigenes Gewerk.
const systemordner = join(hier, '..', 'inhalte', 'system');
const systemlisten = readdirSync(systemordner).filter((n) => n.endsWith('.md')).sort()
  .map((datei) => {
    const text = readFileSync(join(systemordner, datei), 'utf8');
    return {
      name: datei.replace(/\.md$/, ''),
      titel: (/^titel:\s*(.+)$/m.exec(text)?.[1] ?? datei).replace(/\s+—\s+die Liste.*$/, ''),
      gelesen: liesSystemliste(text),
    };
  });
const luecken = sortimentsluecken(systemlisten);

// **Nennt der Brief, was seine Antwort schließt? — 8. September, abends.**
// Die Frage nach der Artikelliste schließt seit heute sieben offene Punkte
// und nannte nur drei. Der Lieferant schickt, wonach er gefragt wird.
const katalogArtikel = lies('data', 'katalog-baustoff.json').artikel;
const zuNennen = [
  {
    id: 'systemzugehoerigkeit',
    nennt: SYSTEM_UNBEKANNT.map((u) => u.sku),
  },
  {
    id: 'merkblattadressen',
    nennt: Object.entries(HERSTELLER).filter(([, h]) => h.url === null).map(([k]) => k),
  },
];

const brief = erzeugeLieferantenanfrage({
  betreiber,
  lieferant,
  zusatz: [
    lueckensatz(luecken.luecken),
    nachfragesatz({
      ohneSystem: SYSTEM_UNBEKANNT.filter((u) => katalogArtikel.some((a) => a.sku === u.sku)),
      ohneAdresse: zuNennen[1].nennt,
    }),
  ].filter(Boolean).join(' '),
});

console.log(`Lieferantenanfrage — ${FRAGEN.length} Fragen für ${anfragePunkte.length} offene Punkte`);
console.log(`Empfänger: ${lieferant.name}\n`);

for (const f of FRAGEN) {
  console.log(`  ${f.titel} → schließt ${f.schliesst.length}: ${f.schliesst.join(', ')}`);
}

// **Der Brief zählt sich selbst — geprüft seit dem 8. September.** Er sagte
// zweimal „vier Auskünfte" und stellte sechs Fragen. Die Lehre stand da
// bereits, zwanzig Zeilen weiter unten an einer Konsolenzeile; angewandt war
// sie dort, wo sie auffiel, und nicht dort, wo sie zählt.
const selbst = selbstzaehlungsbefund(brief.text, FRAGEN.length);

const befunde = [
  ...ungefragt.map((id) => `${id}: offener Punkt, den keine Frage schließt`),
  ...ueberfluessig.map((id) => `${id}: Frage im Brief, die keinen offenen Punkt mehr schließt`),
  ...selbst.meldungen.map((m) => `${m.text} [${m.regel}]`),
  ...luecken.meldungen.map((m) => `${m.text} [${m.regel}]`),
  ...deckungsbefund(brief.text, zuNennen).meldungen.map((m) => `${m.text} [${m.regel}]`),
];

console.log(`\n--- Der Brief (${brief.zeilen.length} Zeilen) ---\n`);
console.log(brief.text);

if (!brief.versandfaehig) {
  console.log('NICHT VERSANDFÄHIG:');
  for (const g of brief.gruende) console.log(`  · ${g}`);
  console.log('\nBeide Angaben stehen in `npm run offenepunkte` unter „Liegt vor, fehlt nur in');
  // Die Zahl kommt aus der Liste, nicht aus dem Satz. Sie stand hier als
  // „acht" — und war am 3. September neun, an dem Tag, an dem die Palettenfrage
  // dazukam. Ein Satz, der eine Menge behauptet, gehört an die Menge gehängt.
  console.log(`der Datei". Der billigste offene Punkt sperrt das Gespräch, das ${anfragePunkte.length} schließt.`);
}

if (befunde.length > 0) {
  console.log(`\n${befunde.length} Meldung(en):\n`);
  for (const b of befunde) console.log(`  ✗ ${b}`);
  process.exit(1);
}

console.log('\nJeder offene Punkt der Gruppe „Anfrage" wird von einer Frage geschlossen.');
console.log('Versendet wird hier nichts — das bleibt Sache des Auftraggebers.');
process.exit(0);
