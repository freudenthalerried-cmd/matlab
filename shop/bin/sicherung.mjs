#!/usr/bin/env node
/**
 * Alle vertraulichen Dateien sichern, bevor jemand daran arbeitet.
 *
 *   npm run sicherung
 *
 * **Warum von Hand und nicht nur automatisch.** `src/sicherung.js` legt bei
 * jedem Werkzeuglauf eine Kopie an — aber nur für die Dateien, die ein
 * Werkzeug schreibt. Unter `preise/` liegt mehr: die Positionstabelle aus den
 * Rechnungen, das Konditionenblatt, die abgetippten Seiten. Sie werden von
 * Hand gepflegt oder von `werkzeuge/gewichte.py` erzeugt, und für sie gibt es
 * kein `git`, das sie zurückholt.
 *
 * > **Eine Datei, die sich aus ihrer Quelle neu erzeugen lässt, kann man
 * > verlieren. Eine gepflegte Datei nicht.**
 *
 * Der Aufruf gehört an den Anfang jedes Tages, an dem neue Angaben des
 * Auftraggebers eintreffen — vor dem ersten Werkzeug, nicht nach dem ersten
 * Schreck.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { BEREICHE, sichere, staende, SICHERUNGSTIEFE } from '../src/sicherung.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const REPO = join(HIER, '..', '..');

/*
 * **Ein Ordner war zu wenig — 12. September 2026.**
 *
 * Hier stand `SICHERUNG_ORDNER || preise`. Seit dem 11. September liegt neben
 * `preise/` die **Vorgangsakte**: Journal, Durchschriften, Buchhaltungsauszüge
 * — und die ist weder erzeugt noch gepflegt, sondern aufgezeichnet. Ein Preis
 * lässt sich nachrechnen; eine gezogene Rechnungsnummer nicht.
 *
 * Die Bereiche stehen mit ihrem Grund in `src/sicherung.js`. `SICHERUNG_ORDNER`
 * bleibt als einzelner Ordner für Proben.
 */
const bereiche = process.env.SICHERUNG_ORDNER
  ? [{ ordner: process.env.SICHERUNG_ORDNER, was: 'Probe', absolut: true }]
  : BEREICHE.map((b) => ({ ...b, pfad: join(REPO, b.ordner) }));

/** Alle Dateien eines Bereichs — auch die in Unterordnern, ohne die Kopien. */
const sammle = (ordner) => {
  const gefunden = [];
  const gehe = (wo) => {
    for (const eintrag of readdirSync(wo, { withFileTypes: true })) {
      if (eintrag.name === '.sicherung') continue;
      const voll = join(wo, eintrag.name);
      if (eintrag.isDirectory()) { gehe(voll); continue; }
      gefunden.push(voll);
    }
  };
  gehe(ordner);
  return gefunden.sort();
};

let gesichertGesamt = 0;
let angesehen = 0;
let fehlende = 0;

for (const bereich of bereiche) {
  const pfad = bereich.absolut ? bereich.ordner : bereich.pfad;
  if (!existsSync(pfad)) {
    /*
     * **Ein fehlender Bereich ist kein Fehler und kein Grund zu schweigen.**
     * Vor dem ersten Geschäftsfall gibt es `ablage/` nicht; auf einem Rechner
     * ohne Konditionen fehlt `preise/`. Beides steht hier mit Namen, damit
     * niemand eine Sicherung für vollständig hält, die einen Bereich gar
     * nicht gesehen hat.
     */
    console.log(`\n${bereich.was}: ${relative(REPO, pfad)} gibt es hier nicht — nichts gesichert.`);
    fehlende += 1;
    continue;
  }

  const dateien = sammle(pfad).filter((d) => statSync(d).isFile());
  if (!dateien.length) {
    console.log(`\n${bereich.was}: ${relative(REPO, pfad)} ist leer — nichts gesichert.`);
    fehlende += 1;
    continue;
  }

  console.log(`\n${bereich.was}: ${dateien.length} Datei(en) aus ${relative(REPO, pfad)}\n`);
  for (const datei of dateien) {
    angesehen += 1;
    const kopie = sichere(datei);
    if (!kopie) continue;
    gesichertGesamt += 1;
    console.log(`  ${relative(pfad, datei).padEnd(40)} ${String(staende(datei).length).padStart(2)} Stand(e)`);
  }
}

if (!angesehen) {
  console.error('\nAbbruch: Kein Bereich hat eine Datei hergegeben.');
  console.error('Eine Sicherung von nichts sieht aus wie eine Sicherung.');
  process.exit(2);
}

console.log(`\n${gesichertGesamt} von ${angesehen} Datei(en) gesichert, `
  + `${bereiche.length - fehlende} von ${bereiche.length} Bereich(en) vorhanden.`);
console.log(`Je Datei werden ${SICHERUNGSTIEFE} Stände aufgehoben, der älteste fällt.`);
console.log('Die Kopien liegen neben dem Original, im selben gesperrten Bereich.');
console.log('Das schützt gegen Überschreiben und versehentliches Löschen — nicht gegen');
console.log('den Verlust des Rechners. Der Ort außerhalb ist Sache des Auftraggebers.');
