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
import { nurText } from '../src/format.js';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { LEITZAHLEN, pruefeLeitzahlen, quellbefund, QUELLAUSNAHMEN } from '../src/leitzahlen.js';
import { rolloutplan } from '../src/rollout.js';

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
/**
 * Die Länge der Kette bis zur Entscheidung — aus demselben Rechenweg wie
 * `npm run rollout`, mit denselben Hauptfallwerten. Kein Nachbau: Wer sie hier
 * zweitrechnete, hätte zwei Ketten und prüfte die falsche.
 */
const planTage = rolloutplan({ tagesbudget: 9.99, klickpreis: 1.5, quote: 0.01, frist: 90 }).gesamt;

const umfeld = {
  keywordAnzahl: JSON.parse(readFileSync(messliste, 'utf8'))
    .gruppen.reduce((n, g) => n + g.keywords.length, 0),
  planTage,
};

/**
 * Wo gesucht wird.
 *
 * **Erweitert am 5. September 2026 um den Quelltext.** Bis dahin stand hier:
 * *„nicht der Quelltext: Dort stehen dieselben Zahlen als Testfälle und
 * Registereinträge, und ein Prüfer, der seine eigene Prüftabelle meldet, hat
 * sich selbst gefunden."*
 *
 * Der Grund stimmt für `src/leitzahlen.js` und `src/gegenprobenregister.js`.
 * Für die übrigen 250 Dateien stimmt er nicht — und dort ist der Schaden
 * größer als in der Akte:
 *
 * > **In einem Dokument steht eine abgelöste Zahl falsch da. Im Quelltext
 * > rechnet sie.**
 *
 * So ist die Schwelle „33 von 33" entstanden (`dreiunddreissig-von-
 * zweiunddreissig.md`): Das Register kannte die 32 und wusste, wann die 33
 * abgelöst wurde — es hat nur nie dort gesucht, wo sie stand. Was eine
 * abgelöste Zahl nennen darf, steht mit Grund in `QUELLAUSNAHMEN`, je Datei
 * **und** je Leitzahl.
 */
/*
 * **Und die gebaute Seite — seit dem 5. September, abends.**
 *
 * Die fünf Bestände oben decken alles ab, was **geschrieben** ist. Sie decken
 * nicht, was beim Bauen **entsteht**: Die Startseite zeigt „39 von 46" und
 * „26,7 % im Median", die Lieferseite „75,50 €", die Kennzahlenseite ihre
 * Schwellen. Keine dieser Zahlen steht als Zahl in einer Quelldatei — sie
 * werden gerechnet, und eine gerechnete Zahl kann von einer Leitzahl
 * abweichen, ohne dass irgendwo ein Literal danebensteht.
 *
 * > **Der Bestand, der nur die Quellen liest, findet jede abgeschriebene Zahl
 * > und keine gerechnete.**
 *
 * Gemessen beim Aufnehmen: **null Meldungen über 83 Ausgabedateien.** Das ist
 * kein Grund, es zu lassen — es ist der Grund, es festzuhalten. Ein Bestand,
 * der heute leer ist, ist die billigste Prüfung, die es gibt, und die einzige,
 * die den Fall bemerkt, wenn er eintritt.
 *
 * Gelesen wird der **Text**, nicht das Markup: In `26,7&nbsp;%` steht die Zahl
 * nicht neben ihrem Zeichen, und ein Muster über rohes HTML fände sie nicht —
 * dieselbe Falle wie beim Herkunftsmuster.
 */
const BESTAENDE = [
  { ordner: [REPO, 'docs', 'baustoff-shop'], endungen: ['.md', '.html'], was: 'Akte' },
  { ordner: [SHOP, 'inhalte'], endungen: ['.md'], was: 'Shoptexte' },
  { ordner: [SHOP, 'src'], endungen: ['.js'], was: 'Quelltext' },
  { ordner: [SHOP, 'bin'], endungen: ['.mjs'], was: 'Quelltext' },
  { ordner: [SHOP, 'test'], endungen: ['.js'], was: 'Quelltext' },
  { ordner: [SHOP, 'ausgabe', 'site'], endungen: ['.html', '.txt'], was: 'gebaute Seite' },
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

const befunde = dateien.map((d) => pruefeLeitzahlen(
  // Bei einer gebauten Seite der Text, sonst die Datei: In `26,7&nbsp;%`
  // steht die Zahl nicht neben ihrem Zeichen.
  d.was === 'gebaute Seite' ? nurText(readFileSync(d.pfad, 'utf8')) : readFileSync(d.pfad, 'utf8'),
  relative(REPO, d.pfad), ziel, LEITZAHLEN, umfeld));

const fundstellen = befunde.reduce((n, b) => n + b.gefunden.length, 0);
/**
 * **Die Ausnahmen des Quelltexts — seit dem 5. September.**
 *
 * Drei Stellen dürfen eine abgelöste Zahl nennen, weil sie ihr Gegenstand
 * ist: die Mutation, die sie zurückschreibt, und zwei Proben des Registers
 * selbst. Der Befund hält das Verzeichnis in beide Richtungen — eine
 * Ausnahme ohne Fall ist eine Erlaubnis für etwas, das niemand mehr tut.
 */
const quelle = quellbefund(befunde.flatMap((b) => b.meldungen));
const meldungen = quelle.gemeldet;
const gedeckt = befunde.reduce((n, b) => n + b.gefunden.filter((f) => f.gedeckt || f.aktuell).length, 0);

console.log(`Leitzahlen — ${LEITZAHLEN.length} im Register, ${dateien.length} Dateien durchsucht`);
console.log(`${fundstellen} Fundstellen, davon ${gedeckt} gültig oder mit Bedingung in Sichtweite.`);
console.log(`${QUELLAUSNAHMEN.length} Ausnahmen im Quelltext, ${quelle.ausgenommen} Meldung(en) davon gedeckt.\n`);

for (const lz of LEITZAHLEN) {
  const wert = lz.jetzt(ziel, umfeld);
  const n = befunde.reduce((s, b) => s + b.gefunden.filter((f) => f.leitzahl === lz.id).length, 0);
  // **Berichtigt am 5. September.** Hier stand "in der Akte", und seit
  // demselben Tag wird auch der Quelltext durchsucht. Ein Pruefer, der ueber
  // 609 Dateien urteilt und "in der Akte" darunterschreibt, benennt seinen
  // eigenen Umfang falsch.
  console.log(`  ${lz.name}: gültig ${wert} — ${n} Fundstellen in Akte, Quelltext und gebauter Seite`);
  console.log(`      ${lz.traegt}`);
}
console.log('');

if (quelle.formfehler.length) {
  console.log(`${quelle.formfehler.length} Meldung(en) über das Ausnahmeverzeichnis selbst:\n`);
  for (const f of quelle.formfehler) console.log(`  ✗ ${f.text}  (${f.regel})`);
  console.log('');
}

if (meldungen.length === 0 && quelle.formfehler.length === 0) {
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
