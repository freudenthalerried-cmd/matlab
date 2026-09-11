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
import {
  ABLAGEORT, belegordner, durchschriftenbefund, istBeleg, istJournal, ortsbefund,
} from '../src/ablageort.js';
import { ausJournal } from '../src/speicher.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const getrackt = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n').filter(Boolean);

/**
 * Auch die ungetrackten Journale finden — sie sind der Fall vor dem Schaden.
 *
 * **Und seit dem 11. September die Durchschriften.** Neben dem Journal liegt
 * je Geschäftsjahr der Beleg selbst, und er trägt dieselben Daten im Klartext:
 * Name, Anschrift, Betrag. Eine Sperre, die nur die eine der beiden Dateiarten
 * kennt, deckt die Hälfte.
 */
const journaldateien = [];
const belegdateien = [];
const gehe = (ordner) => {
  for (const name of readdirSync(ordner)) {
    if (name === 'node_modules' || name === '.git') continue;
    const voll = join(ordner, name);
    if (statSync(voll).isDirectory()) gehe(voll);
    else if (istJournal(name)) journaldateien.push(relative(REPO, voll));
    else if (istBeleg(name)) belegdateien.push(relative(REPO, voll));
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

const ort = ortsbefund({ gitignore, getrackt, journaldateien, belegdateien });

/**
 * **Das Journal gegen die Durchschriften — in beide Richtungen.**
 *
 * Bis zum 11. September schrieb `--ablegen` eine Zeile und druckte den Beleg
 * auf den Bildschirm; nach dem Schließen des Fensters gab es das Papier nicht
 * mehr. § 132 BAO verlangt die Belege sieben Jahre, § 11 Abs 2 UStG vom
 * Aussteller eine Durchschrift jeder Rechnung.
 *
 * Gelesen wird nur, was in der Ablage liegt, und **ausgegeben wird nichts
 * daraus** — Belegnummern und Dateinamen, keine Inhalte. Ein Prüfer, der
 * Kundendaten in sein Protokoll schreibt, verlegt sie an einen dritten Ort.
 */
const durchschriften = [];
for (const journalpfad of journaldateien) {
  const jahr = Number(journalpfad.match(/journal-(\d{4})\.jsonl$/)?.[1]);
  const ordner = join(REPO, dirname(journalpfad), belegordner(jahr));
  // **Gelesen wird der Inhalt, nicht nur der Name — 12. September 2026.**
  // Die Zahlen der Journalzeile stehen ein zweites Mal auf dem Papier; nur so
  // fällt eine nachträglich geänderte Zeile auf. Ausgegeben wird davon
  // nichts: Ein Prüfer, der Kundendaten in sein Protokoll schreibt, verlegt
  // sie an einen dritten Ort.
  const dateien = existsSync(ordner)
    ? readdirSync(ordner).filter(istBeleg).map((name) => {
      const voll = join(ordner, name);
      return { name, zeichen: statSync(voll).size, text: readFileSync(voll, 'utf8') };
    })
    : [];
  const ablage = ausJournal(readFileSync(join(REPO, journalpfad), 'utf8'));
  const befund = durchschriftenbefund({ eintraege: ablage.eintraege, dateien });
  durchschriften.push({ journalpfad, ...befund });
}

const meldungen = [...ort.meldungen, ...durchschriften.flatMap((d) => d.meldungen)];
const geprueft = ort.geprueft;

console.log(`Ablageort — ${geprueft} getrackte Dateien angesehen, `
  + `${journaldateien.length} Journaldateien und ${belegdateien.length} Durchschriften gefunden\n`);
for (const d of durchschriften) {
  console.log(`  ${d.journalpfad}: ${d.geprueft} Eintrag/Datei abgeglichen`);
}
if (durchschriften.length) console.log('');
console.log(`  ${gitignoreDateien.length} .gitignore gelesen: `
  + `${gitignoreDateien.map((d) => relative(REPO, d)).join(', ')}\n`);

if (meldungen.length === 0) {
  console.log(`Keine Meldung. ${ABLAGEORT}/ ist gesperrt, kein Journal und keine`);
  console.log('Durchschrift liegt woanders, und zu jeder Journalzeile gibt es den Beleg.');
  console.log('Eine Sperre, die erst nach dem ersten Datensatz kommt, kommt zu spät.');
  process.exit(0);
}

for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${meldungen.length} Meldung(en).`);
process.exit(1);
