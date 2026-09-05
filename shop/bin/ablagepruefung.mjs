#!/usr/bin/env node
/**
 * Liegt die Ablage an einem Ort, der Kundendaten aushält?
 *
 *   npm run pruefe-ablage
 *
 * **Der Anlass, 4. September 2026.** Die Ablage ist fertig: Nummernkreis nach
 * § 11 UStG, Aufbewahrung nach § 132 BAO, ein Journal aus Zeilen, das nur
 * wächst. Was fehlt, ist die Frage, wo diese Zeilen liegen — und dieses
 * Verzeichnis ist öffentlich.
 *
 * > **Für Einkaufspreise gibt es diese Prüfung seit dem 26. August. Für
 * > Kundendaten gibt es sie nicht, weil es noch keine gibt.**
 *
 * Genau deshalb steht sie hier: Eine Sperre, die erst nach dem ersten
 * Datensatz kommt, kommt zu spät — die Geschichte des Verzeichnisses behält
 * ihn.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { ABLAGEORT, istJournal, ortsbefund } from '../src/ablageort.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const getrackt = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n').filter(Boolean);

/** Auch die ungetrackten Journale finden — sie sind der Fall vor dem Schaden. */
const journaldateien = [];
const gehe = (ordner) => {
  for (const name of readdirSync(ordner)) {
    if (name === 'node_modules' || name === '.git') continue;
    const voll = join(ordner, name);
    if (statSync(voll).isDirectory()) gehe(voll);
    else if (istJournal(name)) journaldateien.push(relative(REPO, voll));
  }
};
gehe(REPO);

/*
 * **Alle `.gitignore`, nicht nur die der Wurzel — 5. September 2026, abends.**
 *
 * Gefunden von `npm run reichweite`: `shop/.gitignore` wird von keinem
 * Prüfer geöffnet. Sie enthält heute eine Zeile (`veroeffentlichung/`) und
 * ist damit belanglos — aber genau hier liegt die Sperre, die verhindert,
 * dass das Journal mit Namen, Anschriften und Beträgen ins öffentliche
 * Verzeichnis wandert.
 *
 * Eine `.gitignore` in einem Unterordner kann eine Regel der Wurzel mit
 * `!muster` **aufheben**. Ein Prüfer, der nur die Wurzel liest, sähe die
 * Aufhebung nicht und meldete die Sperre als bestehend.
 *
 * > **Eine Sperre gegen Kundendaten, geprüft an einer von zwei Dateien, die
 * > sie aufheben können.**
 *
 * Gelesen werden deshalb alle — aneinandergehängt, wie git sie auch
 * anwendet: die spätere gewinnt.
 */
const gitignoreDateien = [];
{
  const suche = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      if (['node_modules', '.git', 'ausgabe'].includes(eintrag.name)) continue;
      const voll = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) { suche(voll); continue; }
      if (eintrag.name === '.gitignore') gitignoreDateien.push(voll);
    }
  };
  suche(REPO);
}
const gitignore = gitignoreDateien.map((d) => readFileSync(d, 'utf8')).join('\n');

const { geprueft, meldungen } = ortsbefund({ gitignore, getrackt, journaldateien });

console.log(`Ablageort — ${geprueft} getrackte Dateien angesehen, `
  + `${journaldateien.length} Journaldateien gefunden\n`);
console.log(`  ${gitignoreDateien.length} .gitignore gelesen: `
  + `${gitignoreDateien.map((d) => relative(REPO, d)).join(', ')}\n`);

if (meldungen.length === 0) {
  console.log(`Keine Meldung. ${ABLAGEORT}/ ist gesperrt, und kein Journal liegt woanders.`);
  console.log('Eine Sperre, die erst nach dem ersten Datensatz kommt, kommt zu spät.');
  process.exit(0);
}

for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${meldungen.length} Meldung(en).`);
process.exit(1);
