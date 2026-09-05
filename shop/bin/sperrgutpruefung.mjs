#!/usr/bin/env node
/**
 * Stimmt die Sperrguteinstufung mit dem überein, was der Katalog weiß?
 *
 *   npm run pruefe-sperrgut
 *
 * **Der Anlass, 5. September 2026.** Auf der Seite des PVC-Kanalbogens stehen
 * „Gewicht 0,285 kg je Stück, aus dem Lieferschein" und „Palettierte Ware. Sie
 * wird mit dem Kran entladen" übereinander — seit es die Seite gibt, und
 * niemand hat die beiden je nebeneinandergehalten.
 *
 * Die Einstufung stammt aus der **Warengruppe**: Dämmung, Kamin, Kanal und
 * Mauerwerk gelten als Sperrgut. Alle 46 tragen `sperrgutQuelle:
 * "eingeschaetzt"`; belegt ist keine einzige. Sie entscheidet 7,50 € je
 * Position auf der Rechnung des Kunden.
 *
 * Dieser Prüfer stuft **nichts um**. Er hält die Einstufung gegen die
 * Tatsachen, die der Katalog hat, und verlangt für jeden Widerspruch einen
 * Grund.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import {
  einstufungsbefund, flaechenbefund, HINGENOMMEN, HANDGEWICHT_KG, SPERRGUT_GRUPPEN, OHNE_HERKUNFT,
  GEMEINSAMER_GRUND,
} from '../src/sperrguteinstufung.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const wurzel = dirname(dirname(fileURLToPath(import.meta.url)));
const datei = process.argv[2] ? process.argv[2] : join(wurzel, 'data', 'katalog-baustoff.json');
const katalog = JSON.parse(readFileSync(datei, 'utf8'));

const b = einstufungsbefund(katalog.artikel ?? []);

/**
 * **Und die gebauten Flächen — seit dem 5. September, morgens.**
 *
 * Die Artikelseite nennt die Herkunft der Einstufung seit dem Vortag,
 * `llms.txt` und das Kassenbündel nannten sie nicht. Wer nur die eine Fläche
 * bessert, hat den Satz gesagt und die Auskunft nicht geändert.
 *
 * Dieselbe Weigerung wie überall: Gegen ein veraltetes Erzeugnis wird nicht
 * geprüft — sonst meldet dieser Lauf die Fläche von gestern grün.
 */
const stand = frischebefund(wurzel, 'ausgabe/site');
if (!stand.frisch) {
  for (const zeile of abbruchtext(stand)) console.error(zeile);
  process.exit(2);
}
/**
 * **Gesucht, nicht aufgezählt — seit dem 5. September, abends.**
 *
 * Hier stand ein `lies(datei)` über ein Verzeichnis von **zwei** Namen, und
 * der Bericht meldete darüber „Gebaute Flächen mit dem Wort 2". Gemessen sind
 * es 32. Die Sammlung geht deshalb über den ganzen Ausgabeordner; welche
 * davon das Wort trägt, entscheidet der Inhalt.
 *
 * `ausgabe/website.html` bleibt draußen: Die Einzeldatei enthält alle Seiten
 * noch einmal, und eine Fundstelle doppelt zu zählen macht keine Prüfung
 * besser. Was in ihr steht, steht in `ausgabe/site/`.
 */
const sammle = () => {
  const wurzelordner = join(wurzel, 'ausgabe', 'site');
  const aus = [];
  const geh = (ordner) => {
    if (!existsSync(ordner)) return;
    for (const eintrag of readdirSync(ordner)) {
      const voll = join(ordner, eintrag);
      if (statSync(voll).isDirectory()) { geh(voll); continue; }
      if (!/\.(html|js|txt|csv|json)$/i.test(voll)) continue;
      aus.push({ datei: `site/${relative(wurzelordner, voll)}`, inhalt: readFileSync(voll, 'utf8') });
    }
  };
  geh(wurzelordner);
  return aus;
};
const f = flaechenbefund(sammle);

console.log(`Sperrguteinstufung: ${b.artikel} Artikel, ${b.mitGewicht} mit belegtem Gewicht`);
console.log(`Geschätzt aus der Warengruppe (${SPERRGUT_GRUPPEN.join(', ')}); `
  + `Handgrenze ${HANDGEWICHT_KG} kg.\n`);

console.log(`  Ohne belegte Einstufung   ${b.unbelegt} von ${b.artikel}`);
// `b.gedeckt` und nicht `HINGENOMMEN.length`: Die erste Zahl ist gemessen, die
// zweite ist die Länge des Verzeichnisses. Bei einem ungedeckten Widerspruch
// stünde dort dieselbe Zahl — eine Angabe, die nie widerspricht.
console.log(`  Widersprüche zum Gewicht  ${b.widersprueche}, davon ${b.gedeckt} mit Grund`);

// Der Fall je Zeile, der gemeinsame Grund einmal darunter. Viermal derselbe
// Absatz wäre eine Ausgabe, die niemand liest — und ungelesen ist ungeprüft.
//
// **Seit dem 5. September ist einer nicht gemeinsam.** Der Eimer Fugenmasse
// hat seinen eigenen Grund; ihn unter denselben Absatz zu stellen hieße, vier
// Kanalpositionen als Begründung für einen Kamineimer auszugeben. Gedruckt
// wird deshalb, wer den gemeinsamen Grund trägt — und wer einen eigenen hat.
if (HINGENOMMEN.length) {
  const gemeinsam = HINGENOMMEN.filter((h) => h.warum.includes(GEMEINSAMER_GRUND));
  const eigen = HINGENOMMEN.filter((h) => !h.warum.includes(GEMEINSAMER_GRUND));

  console.log('\n  Hingenommen, mit Grund:\n');
  const umbruch = (t) => t.replace(/(.{78}\s)/g, '$1\n    ');
  if (gemeinsam.length) {
    for (const h of gemeinsam) console.log(`    · ${h.sku}  ${h.kurz ?? ''}`);
    console.log(`\n    ${umbruch(GEMEINSAMER_GRUND)}`);
  }
  for (const h of eigen) {
    console.log(`\n    · ${h.sku}  ${h.kurz ?? ''}`);
    console.log(`\n    ${umbruch(h.warum)}`);
  }
}

// Die Zahl ist gemessen, nicht eingetragen: Bis zum 5. September stand hier
// die Länge eines Verzeichnisses von zwei Namen.
console.log(`  Gebaute Flächen mit dem Wort   ${f.flaechen}, davon ${f.mitHerkunft} mit Herkunftsangabe`);
if (f.hingenommen) {
  console.log(`  Ohne Herkunft, mit Grund       ${f.hingenommen}`);
  for (const o of OHNE_HERKUNFT) console.log(`    · ${o.datei}`);
}

if (!b.sauber || !f.sauber) {
  console.error(`\n${b.meldungen.length + f.meldungen.length} Befund(e):\n`);
  for (const m of [...b.meldungen, ...f.meldungen]) console.error(`  ✗ ${m.text}  (${m.regel})`);
  console.error('\nEine Einstufung, die Geld kostet, gehört belegt oder begründet —');
  console.error('und wo sie dem Kunden gesagt wird, gehört ihre Herkunft dazu.');
  process.exit(1);
}

console.log('\nJeder Widerspruch zwischen Gewicht und Einstufung trägt seinen Grund.');
console.log('Belegt ist keine einzige Einstufung — das entscheidet die Palettenfrage');
console.log('an den Lieferanten, nicht dieses Werkzeug.');
process.exit(0);
