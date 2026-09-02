#!/usr/bin/env node
/**
 * Die Leitzahlen der Akte prüfen.
 *
 *   npm run pruefe-leitzahlen
 *
 * Antwort auf die Frage, die der Befund vom 1. September gestellt hat:
 * **Welche Zahl steht in mehr als einem Dokument — und rechnet sie irgendwer
 * nach?** Der nötige Monatsumsatz stand vier Tage lang mit der Kartenzahl da,
 * obwohl Gate 21 den Zahlweg längst entschieden hatte, und nach der
 * Berichtigung noch an achtundzwanzig weiteren Stellen.
 *
 * Geprüft wird nicht auf Gleichheit — eine abgelöste Zahl darf stehen, wenn
 * ihre **Bedingung in Sichtweite** steht. Dieselbe Regel wie im
 * Widerrufsregister, aus demselben Grund: Ein Prüfer, der jede historische
 * Angabe meldet, wird abgeschaltet.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { LEITZAHLEN, pruefeLeitzahlen } from '../src/leitzahlen.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const ziel = JSON.parse(readFileSync(join(SHOP, 'data', 'zielgroessen.json'), 'utf8'));

/**
 * Was nicht aus den Zielgrößen folgt.
 *
 * Die Zahl der Begriffe steht in der **erzeugten** Messliste und wird hier
 * nicht ein zweites Mal aus `keywords.csv` zusammengezählt — `messliste.mjs`
 * fasst Phrase und Exakt zu einem Begriff zusammen, und eine zweite
 * Zusammenfassung wäre ein zweiter Stand.
 */
const messliste = join(SHOP, 'ausgabe', 'messliste-baustoff.json');
if (!existsSync(messliste)) {
  console.error('Abbruch: ausgabe/messliste-baustoff.json fehlt — zuerst `npm run messliste`.');
  console.error('Ohne sie ist eine Leitzahl ungemessen, und der Lauf sähe trotzdem grün aus.');
  process.exit(2);
}
const umfeld = {
  keywordAnzahl: JSON.parse(readFileSync(messliste, 'utf8'))
    .gruppen.reduce((n, g) => n + g.keywords.length, 0),
};

/**
 * Wo gesucht wird. Die Akte und die Shoptexte — nicht der Quelltext: Dort
 * stehen dieselben Zahlen als Testfälle und Registereinträge, und ein Prüfer,
 * der seine eigene Prüftabelle meldet, hat sich selbst gefunden.
 */
const BESTAENDE = [
  { ordner: [REPO, 'docs', 'baustoff-shop'], endungen: ['.md', '.html'], was: 'Akte' },
  { ordner: [SHOP, 'inhalte'], endungen: ['.md'], was: 'Shoptexte' },
];

const dateien = [];
const sammle = (teile, endungen, was) => {
  for (const e of readdirSync(join(...teile), { withFileTypes: true })) {
    const pfad = [...teile, e.name];
    if (e.isDirectory()) { sammle(pfad, endungen, was); continue; }
    if (endungen.some((x) => e.name.endsWith(x))) dateien.push({ pfad: join(...pfad), was });
  }
};
for (const b of BESTAENDE) sammle(b.ordner, b.endungen, b.was);

const befunde = dateien.map((d) =>
  pruefeLeitzahlen(readFileSync(d.pfad, 'utf8'), relative(REPO, d.pfad), ziel, LEITZAHLEN, umfeld));

const fundstellen = befunde.reduce((n, b) => n + b.gefunden.length, 0);
const meldungen = befunde.flatMap((b) => b.meldungen);
const gedeckt = befunde.reduce((n, b) => n + b.gefunden.filter((f) => f.gedeckt || f.aktuell).length, 0);

console.log(`Leitzahlen — ${LEITZAHLEN.length} im Register, ${dateien.length} Dateien durchsucht`);
console.log(`${fundstellen} Fundstellen, davon ${gedeckt} gültig oder mit Bedingung in Sichtweite.\n`);

for (const lz of LEITZAHLEN) {
  const wert = lz.jetzt(ziel, umfeld);
  const n = befunde.reduce((s, b) => s + b.gefunden.filter((f) => f.leitzahl === lz.id).length, 0);
  console.log(`  ${lz.name}: gültig ${wert} — ${n} Fundstellen in der Akte`);
  console.log(`      ${lz.traegt}`);
}
console.log('');

if (meldungen.length === 0) {
  console.log('Keine Meldung. Jede abgelöste Leitzahl trägt ihre Bedingung.');
  console.log('Eine Zahl, die in acht Dokumenten steht, wird in keinem gepflegt —');
  console.log('deshalb steht sie hier einmal und wird dort gemessen.');
} else {
  console.log(`${meldungen.length} Meldung(en) — hier steht eine abgelöste Zahl ohne ihre Bedingung:\n`);
  for (const m of meldungen) {
    console.log(`  ✗ ${m.datei}:${m.zeile} [${m.leitzahl}]`);
    console.log(`      ${m.text}`);
    console.log(`      … ${m.inhalt}`);
  }
  console.log('');
  console.log('Zwei richtige Auswege: die Zahl nachziehen, oder ihre Bedingung danebenschreiben');
  console.log('(„45.356 € bei Kartenzahlung"). Den Registereintrag zu löschen ist der falsche.');
  process.exitCode = 1;
}
