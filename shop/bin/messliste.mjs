#!/usr/bin/env node
/**
 * Die Messliste für das laufende Modell — erzeugt, nicht geschrieben.
 *
 *   node bin/messliste.mjs [--budget 10] [--klickpreis 1.5] [--quote 0.01]
 *
 * ## Warum es diese Datei gibt
 *
 * `data/messliste.json` trägt die Keywords des **Radonmodells**
 * („radonvorsorge neubau", „önorm s 5280-2"). Es ist nach Gate 12
 * gleichrangig und die Liste ist nicht falsch — aber wer heute misst, misst
 * ein Modell, das keine Kampagne hat, und erfährt nichts über das, für das
 * Werbebudget vorgesehen ist.
 *
 * Diese Liste kommt aus `ausgabe/kampagne/keywords.csv`, also aus den
 * Begriffen, auf die tatsächlich geboten würde. Zwei Listen, die dasselbe
 * meinen, laufen auseinander; erzeugt statt geschrieben, tun sie es nicht.
 *
 * **Der Markt ist das Liefergebiet, nicht Österreich.** Wer österreichweites
 * Volumen misst und in fünf Bezirken wirbt, überschätzt sich um den Faktor
 * der Bevölkerung. Die Ortsangabe steht deshalb in der erzeugten Datei und
 * gehört im Keyword-Planer genau so eingestellt.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIEFERGEBIET } from '../src/liefergebiet.js';
import { abbruchschwelle } from '../src/werbewirkung.js';
import { volumenbedarf, versuchsdauer, KLICKRATE, TAGE_JE_MONAT } from '../src/suchbedarf.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const keywordDatei = join(SHOP, 'ausgabe', 'kampagne', 'keywords.csv');
const ziel = join(SHOP, 'ausgabe', 'messliste-baustoff.json');

const argZahl = (name, vor) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return vor;
  const wert = Number(process.argv[i + 1]);
  if (!Number.isFinite(wert)) {
    console.error(`--${name} braucht eine Zahl, bekommen: ${process.argv[i + 1]}`);
    process.exit(2);
  }
  return wert;
};

if (!existsSync(keywordDatei)) {
  console.error(`Abbruch: ${keywordDatei} fehlt — zuerst \`npm run kampagne\`.`);
  console.error('Eine Messliste aus erfundenen Begriffen misst das falsche Modell.');
  process.exit(2);
}

// Dieselbe Zerlegung wie in der Probe: Eine Artikelbezeichnung mit Beistrich
// zerlegt die naive Variante.
function csvFelder(zeile) {
  const felder = [];
  let feld = '';
  let inAnfuehrung = false;
  for (let i = 0; i < zeile.length; i++) {
    const z = zeile[i];
    if (inAnfuehrung) {
      if (z === '"' && zeile[i + 1] === '"') { feld += '"'; i++; }
      else if (z === '"') inAnfuehrung = false;
      else feld += z;
    } else if (z === '"') inAnfuehrung = true;
    else if (z === ',') { felder.push(feld); feld = ''; }
    else feld += z;
  }
  felder.push(feld);
  return felder;
}

const zeilen = readFileSync(keywordDatei, 'utf8').trim().split('\n').slice(1);
const jeGruppe = new Map();
for (const z of zeilen) {
  const [, gruppe, keyword, , herkunft] = csvFelder(z);
  if (!jeGruppe.has(gruppe)) jeGruppe.set(gruppe, new Map());
  // Phrase und Exakt sind dasselbe Wort — gemessen wird das Wort, nicht die
  // Übereinstimmungsart.
  jeGruppe.get(gruppe).set(keyword.toLowerCase(), { begriff: keyword, herkunft });
}
if (jeGruppe.size === 0) {
  console.error('Abbruch: keywords.csv enthält keine Zeilen.');
  process.exit(2);
}

const tagesbudget = argZahl('budget', 10);
const klickpreis = argZahl('klickpreis', 1.5);
const quote = argZahl('quote', 0.01);
const schwelleKlicks = abbruchschwelle(quote);
const klicksJeMonat = (tagesbudget / klickpreis) * TAGE_JE_MONAT;
const bedarf = volumenbedarf(klicksJeMonat);

const liste = {
  _hinweis: 'Messliste für das laufende Baustoffmodell. Die Begriffe kommen aus '
    + 'ausgabe/kampagne/keywords.csv und sind erzeugt, nicht abgeschrieben — neu erzeugen mit '
    + '`npm run messliste`. Einzutragen ist je Begriff `volumen` (Suchanfragen je Monat) und '
    + 'optional `kd` (Keyword-Difficulty 0–100).',
  _ort: `WICHTIG: Im Keyword-Planer als Ort GENAU das Liefergebiet einstellen — ${
    LIEFERGEBIET.bezirke.map((b) => b.name).join(', ')} (${LIEFERGEBIET.land}). `
    + 'Österreichweites Volumen beantwortet die Frage dieses Modells nicht: Geworben wird in fünf '
    + 'Bezirken, und wer landesweit misst, überschätzt sich um den Faktor der Bevölkerung.',
  _bedarf: `Damit das Tagesbudget von ${tagesbudget} € bei ${klickpreis.toFixed(2)} € Klickpreis `
    + `${Math.round(klicksJeMonat)} Klicks im Monat ergibt, müssen diese Begriffe im Liefergebiet `
    + `zusammen ${bedarf.map((b) => `${Math.ceil(b.noetigesVolumen)} (bei ${(b.klickrate * 100)} % Klickrate)`).join(' bis ')} `
    + 'Suchanfragen je Monat tragen.',
  _klickrate: KLICKRATE._herkunft,
  _abbruchschwelle: `${schwelleKlicks} Klicks ohne Bestellung schließen eine Kaufquote von `
    + `${(quote * 100).toFixed(1)} % mit 95 % Sicherheit aus (siehe wann-kein-verkauf-eine-antwort-ist.md).`,
  markt: { land: LIEFERGEBIET.land, bezirke: LIEFERGEBIET.bezirke.map((b) => b.name) },
  plan: { tagesbudget, klickpreis, quote, schwelleKlicks, klicksJeMonat },
  gruppen: [...jeGruppe].map(([gruppe, begriffe]) => ({
    gruppe,
    keywords: [...begriffe.values()]
      .sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'))
      .map((k) => ({ begriff: k.begriff, herkunft: k.herkunft, volumen: null, kd: null })),
  })),
};

mkdirSync(join(SHOP, 'ausgabe'), { recursive: true });
writeFileSync(ziel, `${JSON.stringify(liste, null, 2)}\n`, 'utf8');

const gesamt = liste.gruppen.reduce((s, g) => s + g.keywords.length, 0);
console.log(`\nMessliste geschrieben: ausgabe/messliste-baustoff.json`);
console.log(`  ${gesamt} Begriffe in ${liste.gruppen.length} Anzeigengruppen`);
for (const g of liste.gruppen) console.log(`    ${g.gruppe.padEnd(10)} ${g.keywords.length}`);
console.log(`\nOrt: ${liste.markt.bezirke.join(', ')} (${liste.markt.land}) — nicht Österreich.`);
console.log(`\nNötiges Volumen für ${Math.round(klicksJeMonat)} Klicks je Monat:`);
for (const b of bedarf) {
  console.log(`  bei ${(b.klickrate * 100).toString().padStart(2)} % Klickrate: ${
    Math.ceil(b.noetigesVolumen).toString().padStart(5)} Suchanfragen je Monat`);
}
console.log('\nWas das bedeutet, wenn der Markt weniger hergibt:\n');
console.log('  Volumen/Mon   Klicks/Mon   Engpass   Monate bis Schwelle   nicht ausgebbar');
for (const v of [500, 1000, 2000, 4000, 8000]) {
  const d = versuchsdauer({ suchvolumenJeMonat: v, klickrate: KLICKRATE.mittel, tagesbudget, klickpreis, schwelleKlicks });
  console.log(`  ${String(v).padStart(10)}   ${d.klicksJeMonat.toFixed(0).padStart(10)}   ${
    d.engpass.padEnd(7)}   ${d.monateBisSchwelle.toFixed(1).padStart(19)}   ${
    d.ungenutztesBudgetJeMonat.toFixed(0).padStart(12)} €`);
}
console.log(`  (bei ${KLICKRATE.mittel * 100} % Klickrate)`);
console.log('\nDie Messung selbst löst keine Ausgaben aus. Der Keyword-Planer ist kostenlos;');
console.log('ein Google-Ads-Konto ohne geschaltete Kampagne kostet nichts.');
