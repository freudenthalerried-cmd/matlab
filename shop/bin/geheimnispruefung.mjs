#!/usr/bin/env node
/**
 * Was steht im öffentlichen Verzeichnis, und was lässt sich daraus ausrechnen?
 *
 *   node bin/geheimnispruefung.mjs
 *
 * Zwei Durchgänge:
 *
 *   1. **Abfluss.** Steht eine Einkaufsangabe wörtlich in einer Datei, die
 *      mitgeliefert wird? Das prüft der Lauf immer.
 *   2. **Rekonstruktion.** Wie viele Einkaufspreise lassen sich aus den
 *      veröffentlichten Verkaufspreisen und der bekannten Zielmarge
 *      zurückrechnen? Das prüft der Lauf nur, wenn die vertrauliche Datei
 *      örtlich vorhanden ist — die Gegenprobe braucht sie, der Befund nicht.
 *
 * Der zweite Durchgang ist der eigentliche Grund für dieses Werkzeug.
 * `.gitignore` schützt eine Datei; er schützt keine Angabe, die sich aus
 * zwei veröffentlichten Zahlen ergibt.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { rekonstruierbarkeit, findeAbfluss } from '../src/geheimnis.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(wurzel, '..');

/* ------------------------------------------------------------------ *
 * 1. Abfluss — nur in Dateien, die git tatsächlich mitliefert
 * ------------------------------------------------------------------ */

const nurText = (p) => /\.(js|mjs|json|md|html|csv|txt|py)$/i.test(p);

function verfolgteDateien() {
  const lauf = spawnSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' });
  if (lauf.status === 0) return lauf.stdout.split('\n').filter(Boolean).filter(nurText);
  // Ohne git: der ganze Baum ohne die ignorierten Ordner. Schlechter, aber
  // besser als schweigen — und der Lauf sagt, dass er schlechter ist.
  const aus = [];
  const geh = (ordner) => {
    for (const eintrag of readdirSync(ordner)) {
      if (['node_modules', '.git', 'preise', 'veroeffentlichung'].includes(eintrag)) continue;
      const voll = join(ordner, eintrag);
      if (statSync(voll).isDirectory()) geh(voll);
      else if (nurText(voll)) aus.push(relative(repo, voll));
    }
  };
  geh(repo);
  return aus;
}

const mitGit = spawnSync('git', ['-C', repo, 'rev-parse'], { encoding: 'utf8' }).status === 0;
// Testdaten und Beispieldateien tragen **erfundene** Zahlen — sie sind der
// Zweck dieser Dateien. Sie mitzumelden erzeugte Dutzende Treffer, die alle
// harmlos sind, und ein Prüfer, der Dutzende harmlose Treffer meldet, wird
// abgeschaltet. Ausgeschlossen wird deshalb, aber sichtbar: Der Lauf sagt,
// wie viele Dateien er nicht angesehen hat und warum.
const ERFUNDEN = /(^|\/)(test|beispiel)\//;
const alle = verfolgteDateien();
const dateien = alle.filter((d) => !ERFUNDEN.test(d));
const uebergangen = alle.length - dateien.length;
const abfluss = [];
for (const d of dateien) {
  const voll = join(repo, d);
  if (!existsSync(voll)) continue;
  abfluss.push(...findeAbfluss(readFileSync(voll, 'utf8'), d));
}

console.log(`\nDurchgang 1 — Abfluss in ${dateien.length} mitgelieferten Dateien${mitGit ? '' : ' (ohne git ermittelt)'}`);
console.log(`  ${uebergangen} Dateien unter test/ und beispiel/ übergangen — dort stehen erfundene Zahlen.`);
if (abfluss.length === 0) {
  console.log('  Keine Einkaufsangabe steht wörtlich in einer mitgelieferten Datei.');
} else {
  for (const t of abfluss) console.log(`  ${t.name}:${t.zeile}  ${t.art}\n    ${t.auszug}`);
}

/* ------------------------------------------------------------------ *
 * 2. Rekonstruktion — die Rechnung, die jeder anstellen kann
 * ------------------------------------------------------------------ */

const preisDatei = join(repo, 'preise', 'baustoff-preise.json');
console.log(`\nDurchgang 2 — Rekonstruktion aus Verkaufspreis und Zielmarge (${(ZIELMARGE * 100).toFixed(0)} %)`);

if (!existsSync(preisDatei)) {
  console.log('  Die vertrauliche Preisdatei liegt hier nicht — die Gegenprobe entfällt.');
  console.log('  Das ist kein Freispruch: Der Befund hängt an der Rechnung, nicht an der Datei.');
} else {
  const lies = (...t) => JSON.parse(readFileSync(join(...t), 'utf8'));
  const katalog = ladeBaustoffkatalog(
    lies(wurzel, 'data', 'katalog-baustoff.json'),
    lies(preisDatei),
    lies(wurzel, 'data', 'lieferanten.json'),
    ZIELMARGE,
  );
  const artikel = katalog.artikel
    .filter((a) => a.vkNetto > 0 && a.ekNetto > 0)
    .map((a) => ({ sku: a.sku, vkNetto: a.vkNetto, ekNetto: a.ekNetto }));
  const e = rekonstruierbarkeit(artikel, ZIELMARGE);

  console.log(`  ${e.getroffen} von ${e.geprueft} Einkaufspreisen auf den Cent rekonstruierbar `
    + `(${(e.anteil * 100).toFixed(0)} %).`);
  if (e.verfehlt.length) {
    console.log(`  ${e.verfehlt.length} weichen ab — durchweg Artikel am Listendeckel (Gate 22),`);
    console.log('  bei denen der Verkaufspreis gekappt wurde und die Rückrechnung zu tief greift:');
    for (const z of e.verfehlt) {
      console.log(`    ${z.sku}: rekonstruiert ${z.rekonstruiert.toFixed(2)} statt ${z.ekNetto.toFixed(2)} `
        + `(${z.abweichung.toFixed(2)} daneben)`);
    }
    console.log('  Ausgerechnet die Kappung ist damit das Einzige, was etwas verbirgt.');
  }
}

/* ------------------------------------------------------------------ *
 * 3. Der Schlüssel selbst — liefern wir die Zielmarge mit aus?
 * ------------------------------------------------------------------ */

/*
 * Durchgang 2 rechnet vor, dass 44 von 46 Einkaufspreisen aus Verkaufspreis
 * und Zielmarge folgen — und **setzt dabei voraus, dass jemand die Zielmarge
 * kennt**. Bis zum 29. August hat niemand gefragt, ob wir sie ihm geben.
 *
 * Wir gaben sie ihm. `ausgabe/site/shop.js` enthielt den Quelltext der
 * Rechenmodule samt Kommentaren, darunter „40 € Einkauf und 25 % Ziel ergeben
 * 53,333… €". Damit war der offene Punkt „Repository privat schalten"
 * wirkungslos: Die ausgelieferte Seite allein genügte.
 *
 * Dieser Durchgang sieht in den **Ausgabedateien** nach, nicht im
 * Repository — er prüft, was der Besucher lädt.
 */

const AUSGABEN = [
  join(wurzel, 'ausgabe', 'site', 'shop.js'),
  join(wurzel, 'ausgabe', 'website.html'),
  // Das Funktionsmuster wird weitergegeben, und dass seine Preise
  // Platzhalter sind, schützt die Kalkulationsregel nicht.
  join(wurzel, 'demo.html'),
];

/*
 * Die Zielmarge in den Schreibweisen, in denen sie auftauchen kann — aber
 * **nie als nackte Zahl.** Der erste Wurf suchte `0.25` und fand `fixEuro:
 * 0.25`, die Kartengebühr von 25 Cent. Ein Prüfer, der die Kartengebühr für
 * ein Geschäftsgeheimnis hält, wird nach dem zweiten Mal abgeschaltet, und
 * dann meldet er auch den echten Fall nicht mehr. Gesucht wird deshalb die
 * Zahl **in Gesellschaft eines Margenworts** oder das Wort allein.
 */
const nahe = (zahl) => new RegExp(
  `(Marge|Rohmarge|Zielmarge|Aufschlag|Spanne|Ziel)\\W{0,20}${zahl}`
  + `|${zahl}\\W{0,20}(Marge|Rohmarge|Zielmarge|Aufschlag|Spanne|Ziel)`, 'i');

const SCHLUESSEL = [
  { name: `Zielmarge als Zahl neben einem Margenwort (${ZIELMARGE})`, muster: nahe(String(ZIELMARGE)) },
  // Nur **unsere** Zielmarge. Das Funktionsmuster `demo.html` rechnet noch
  // mit 0.35 aus dem abgelösten Radon-Modell und mit Platzhalterpreisen —
  // eine fremde Zahl neben erfundenen Preisen verrät nichts. Ein Prüfer, der
  // sie meldet, meldet Rauschen.
  { name: `Zuweisung der Zielmarge (${ZIELMARGE})`,
    muster: new RegExp(`zielmarge\\s*[=:]\\s*0?${String(ZIELMARGE).replace('0', '')}([^0-9]|$)`, 'i') },
  { name: `Zielmarge in Prozent (${(ZIELMARGE * 100).toFixed(0)} %)`,
    muster: new RegExp(`${(ZIELMARGE * 100).toFixed(0)}\\s?%\\s*(Ziel|Marge|Rohmarge|Aufschlag|Spanne)`, 'i') },
  { name: 'Wort „Zielmarge" im Fließtext', muster: /Zielmarge (ist|beträgt|von)/i },
  { name: 'Rechenbeispiel mit Einkauf und Ziel', muster: /Einkauf und [0-9]+\s?% Ziel/i },
];

console.log('\nDurchgang 3 — steht der Schlüssel in der Ausgabe?');
let schluesselTreffer = 0;
let geprueft = 0;
for (const datei of AUSGABEN) {
  if (!existsSync(datei)) {
    console.log(`  ${relative(repo, datei)} fehlt — nicht gebaut, keine Aussage.`);
    continue;
  }
  geprueft++;
  const inhalt = readFileSync(datei, 'utf8');
  for (const s of SCHLUESSEL) {
    const treffer = inhalt.match(s.muster);
    if (!treffer) continue;
    schluesselTreffer++;
    const stelle = inhalt.slice(Math.max(0, treffer.index - 60), treffer.index + 80).replace(/\s+/g, ' ');
    console.log(`  ✗ ${relative(repo, datei)}: ${s.name}`);
    console.log(`      …${stelle}…`);
  }
}
if (geprueft === 0) {
  console.log('  Keine Ausgabedatei gefunden — zuerst npm run website.');
} else if (schluesselTreffer === 0) {
  console.log(`  ${geprueft} Ausgabedatei(en) geprüft, die Zielmarge steht in keiner.`);
  console.log('  Ohne sie führt Durchgang 2 zu nichts: Die Rechnung braucht beide Zahlen.');
}

console.log('\nEine Regel, die eine Datei ausschließt, schützt keine Angabe,');
console.log('die sich aus zwei veröffentlichten Zahlen ergibt.');
console.log('Bewertung und Handlungsmöglichkeiten: docs/baustoff-shop/rekonstruierbare-einkaufspreise.md\n');

// Durchgang 3 ist der einzige, der ein Urteil fällt: Steht der Schlüssel in
// der Ausgabe, ist das kein Hinweis, sondern ein Fehler.
if (schluesselTreffer) process.exit(1);
