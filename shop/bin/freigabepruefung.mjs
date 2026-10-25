#!/usr/bin/env node
/**
 * Darf diese Ausgabe hinaus? — die Sperre vor dem Hochladen.
 *
 *   npm run freigabe
 *
 * Der Anlass und die vier Fragen stehen im Kopf von `src/freigabe.js`. Kurz:
 * Das Gate vor jedem Commit fragt, ob der Bestand in sich stimmt; diese
 * Prüfung fragt, ob das Gebaute vor einem fremden Menschen bestehen kann.
 *
 * Dieses Werkzeug **sammelt** nur — Dateien, Commitzeiten, Interna, Lücken —
 * und reicht die Befunde an `freigabebefund()` weiter. Geurteilt wird dort,
 * weil eine Regel, die in einem Skript steht, niemand einzeln auslösen kann.
 *
 * Gerufen wird es von `.github/workflows/veroeffentlichen.yml`, bevor eine
 * Datei den Rechner verlässt. Mit `--ohne-impressum` lässt sich die vierte
 * Frage übergehen; der Lauf sagt dann laut, was er durchgelassen hat.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { pruefeSeiten, BUENDELAUSNAHME } from '../src/interna.js';
import { freigabebefund } from '../src/freigabe.js';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const SITE = join(SHOP, 'ausgabe', 'site');
const ohneImpressum = process.argv.includes('--ohne-impressum');

/**
 ***Vorhanden ist nicht dasselbe wie aktuell.** Warum diese Weigerung hier
 * steht und was sie prüft, steht in `src/erzeugnisstand.js` — dort einmal
 * für alle Werkzeuge, die ein Erzeugnis lesen.
 *
 * Frage 2 weiter unten stellt dieselbe Frage noch einmal und bekommt eine
 * andere Antwort: Sie vergleicht **Commit**zeiten und gilt damit auch im
 * fremden Klon, wo jede Datei die Zeit des Auscheckens trägt. Diese hier
 * vergleicht Dateizeiten und gilt nur auf diesem Rechner — dafür sieht sie
 * den Bau, der noch gar nicht gelaufen ist. Zwei Fragen, zwei Wächter.
 */
{
  const stand = frischebefund(SHOP, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}

/** Jede Datei des Verzeichnisses, flach gelesen. */
function alleDateien(ordner) {
  const raus = [];
  for (const e of readdirSync(ordner, { withFileTypes: true })) {
    const p = join(ordner, e.name);
    if (e.isDirectory()) raus.push(...alleDateien(p));
    else if (e.isFile()) raus.push(p);
  }
  return raus;
}

const git = (...args) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8' }).trim();

console.log('\nFreigabepruefung — darf ausgabe/site hinaus?\n');

/* --- 1. Was liegt da? -------------------------------------------------- */
if (!existsSync(SITE)) {
  console.error('Abbruch: ausgabe/site gibt es nicht. Zuerst `npm run website`.');
  process.exit(2);
}
const dateien = alleDateien(SITE);
const seiten = dateien.filter((d) => d.endsWith('.html'));
console.log(`  Dateien            ${String(dateien.length).padStart(4)}  (${seiten.length} Seiten)`);

/* --- 2. Commitzeiten statt Dateizeiten --------------------------------- */
const QUELLEN = ['shop/src', 'shop/bin', 'shop/data', 'shop/inhalte'];
const stand = (pfad) => Number(git('log', '-1', '--format=%ct', '--', pfad) || 0);
const quelleStand = Math.max(...QUELLEN.map(stand));
const ausgabeStand = stand('shop/ausgabe/site');
const tag = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ') : '—');
console.log(`  Quelle zuletzt     ${tag(quelleStand)}`);
console.log(`  Ausgabe zuletzt    ${tag(ausgabeStand)}`);

/* --- 3. Interna über jede Datei --------------------------------------- */
const lesbar = dateien.filter((d) => statSync(d).size < 4 * 1024 * 1024);
const proben = lesbar.map((d) => {
  const kennung = relative(SITE, d);
  const ist = kennung === 'shop.js';
  return {
    kennung,
    html: readFileSync(d, 'utf8'),
    ausnahme: ist ? BUENDELAUSNAHME.ausnahme : undefined,
    nur: ist ? [...BUENDELAUSNAHME.nur] : undefined,
  };
});
const innen = pruefeSeiten(proben);
console.log(`  Interna geprüft    ${String(proben.length).padStart(4)} Dateien, `
  + `${innen.meldungen.length} Fund(e), ${innen.ausnahmen.length} begründete Ausnahme(n)`);

/* --- 4. Sichtbare Lücken der Rechtsseiten ----------------------------- */
const LUECKE = /<mark class="luecke">([^<]*)<\/mark>/g;
const luecken = [];
for (const d of lesbar.filter((x) => x.endsWith('.html'))) {
  for (const t of readFileSync(d, 'utf8').matchAll(LUECKE)) {
    luecken.push({ seite: relative(SITE, d), was: t[1] });
  }
}
console.log(`  Sichtbare Lücken   ${String(luecken.length).padStart(4)}`);

const e = freigabebefund({
  seiten: seiten.length,
  quelleStand,
  ausgabeStand,
  internafunde: innen.meldungen,
  luecken,
  ohneImpressum,
});

if (e.durchgelassen) {
  console.log(`\n  ⚠ --ohne-impressum: ${e.durchgelassen} Lücke(n) ausdrücklich durchgelassen.`);
  console.log('    Was jetzt hinausgeht, ist eine Vorschau und kein Shop.');
}

console.log('');
if (e.sauber) {
  console.log(`Alle ${e.geprueft} Fragen beantwortet — diese Ausgabe darf hinaus.`);
  console.log('Geprüft ist, was sie zeigt — nicht, ob der Empfänger sie annimmt.');
  process.exit(0);
}

console.log(`${e.meldungen.length} Meldung(en):\n`);
for (const m of e.meldungen) {
  console.log(`  ✗ [${m.regel}]`);
  console.log(`      ${m.satz}`);
}
console.log('\nNichts hochgeladen. Eine Seite, die draußen steht, nimmt man nicht zurück —');
console.log('die Suchmaschine hat sie dann schon gelesen.');
process.exit(1);
