#!/usr/bin/env node
/**
 * Wie oft ändert der Lieferant seine Preise? — gemessen statt gefragt.
 *
 *   npm run preiswechsel
 *
 * **Der Anlass, 3. September 2026.** In `npm run offenepunkte` steht seit
 * Tagen „Preisrhythmus des Lieferanten" unter **Anfrage an Dritte**, mit dem
 * Grund:
 *
 * > Aus fünfzehn Rechnungen nicht ableitbar — sie zeigen, wann wir gekauft
 * > haben, nicht, wann er die Liste ändert.
 *
 * Der Satz stimmt für den **Rhythmus** und nicht für die **Beobachtung**:
 * Wo derselbe Artikel an zwei Tagen auf einer Rechnung steht, ist ablesbar,
 * ob sich sein Preis dazwischen bewegt hat. Das beantwortet die Frage nicht,
 * aber es beziffert, was wir schon wissen — und macht aus einer Frage ins
 * Blaue eine mit einem Befund daneben.
 *
 * Vierter Fall derselben Art an zwei Tagen: eine Begründung, die schlüssig
 * klingt und etwas anderes beschreibt als das, worum es geht.
 *
 * ## Was dieses Werkzeug nicht ausgibt
 *
 * **Keinen einzigen Preis.** Die Grundlage liegt in `preise/`, das von
 * `.gitignore` gedeckt ist; die Ausgabe eines Werkzeugs landet dagegen
 * schnell in einem Dokument. Gedruckt werden nur Zählungen, Zeitspannen und
 * relative Abweichungen — der Prüfer `pruefe-geheimnis` bewacht `data/`, für
 * die eigene Ausgabe ist dieses Werkzeug selbst verantwortlich.
 *
 * ## Wie gerechnet wird
 *
 * Verglichen wird der **effektive** Preis, also `Betrag / Menge`, nicht der
 * ausgewiesene Einzelpreis. Genau daran hängt der einzige scheinbare Wechsel
 * im Bestand: Bei einem Artikel halbierte sich der Einzelpreis, während
 * gleichzeitig ein Rabatt von 50 % entfiel — der Nettopreis blieb derselbe.
 * Ein Vergleich der Einzelpreise hätte hier eine Preisänderung gemeldet, die
 * es nicht gab.
 *
 * Negative Mengen bleiben außen vor. Sie sind Rückgaben und Gutschriften; bei
 * den Paletten steht dort ein anderer Betrag als beim Kauf, und das ist Pfand
 * und keine Preisänderung.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const QUELLE = join(SHOP, '..', 'preise', 'poschacher-positionen.csv');

if (!existsSync(QUELLE)) {
  console.error('preise/poschacher-positionen.csv fehlt — sie liegt außerhalb des Verzeichnisses.');
  console.error('Ohne sie ist hier nichts zu messen, und eine Aussage ohne Grundlage wäre geraten.');
  process.exit(2);
}

const zeilen = readFileSync(QUELLE, 'utf8').trim().split('\n');
const kopf = zeilen[0].split(';');
const spalte = (felder, name) => felder[kopf.indexOf(name)];
const tag = (s) => {
  const [t, m, j] = String(s).split('.');
  return `${j}-${m}-${t}`;
};

const jeArtikel = new Map();
let uebersprungen = 0;
for (const zeile of zeilen.slice(1)) {
  const f = zeile.split(';');
  const menge = Number(spalte(f, 'Menge'));
  const betrag = Number(spalte(f, 'Betrag'));
  if (!Number.isFinite(menge) || !Number.isFinite(betrag) || menge <= 0) {
    uebersprungen += 1;
    continue;
  }
  const art = spalte(f, 'ArtNr');
  if (!jeArtikel.has(art)) jeArtikel.set(art, []);
  jeArtikel.get(art).push({ tag: tag(spalte(f, 'Datum')), effektiv: betrag / menge });
}

const tage = (von, bis) => Math.round((Date.parse(bis) - Date.parse(von)) / 86400000);

const beobachtet = [];
for (const [art, posten] of jeArtikel) {
  const tageDavon = [...new Set(posten.map((p) => p.tag))].sort();
  if (tageDavon.length < 2) continue;
  const sortiert = [...posten].sort((a, b) => a.tag.localeCompare(b.tag));
  const erste = sortiert[0].effektiv;
  // Ein Cent auf hundert Euro ist keine Preisänderung, sondern eine Rundung.
  const abweichung = Math.max(...sortiert.map((p) => Math.abs(p.effektiv - erste) / erste));
  beobachtet.push({
    art,
    spanne: tage(tageDavon[0], tageDavon[tageDavon.length - 1]),
    tage: tageDavon.length,
    geaendert: abweichung > 0.01,
    abweichungProzent: Number((abweichung * 100).toFixed(2)),
  });
}

beobachtet.sort((a, b) => b.spanne - a.spanne);
const geaendert = beobachtet.filter((b) => b.geaendert);
const spannen = beobachtet.map((b) => b.spanne);

console.log('Preiswechsel beim Lieferanten — gemessen an den eigenen Rechnungen\n');
console.log(`${zeilen.length - 1} Positionen, ${jeArtikel.size} Artikelnummern, `
  + `${uebersprungen} Zeilen ohne verwertbare Menge (Rückgaben, Gutschriften).`);
console.log(`An mehr als einem Tag gekauft: ${beobachtet.length} Artikelnummern.\n`);

for (const b of beobachtet) {
  console.log(`  ${b.art.padEnd(8)} an ${b.tage} Tagen über ${String(b.spanne).padStart(3)} Tage — `
    + (b.geaendert ? `Preis um ${b.abweichungProzent} % verschoben` : 'Preis unverändert'));
}

const laengste = spannen.length ? Math.max(...spannen) : 0;
console.log(`\n${beobachtet.length - geaendert.length} von ${beobachtet.length} unverändert, `
  + `längste beobachtete Spanne ${laengste} Tage.`);

if (geaendert.length === 0 && beobachtet.length > 0) {
  console.log('\nKein nachweisbarer Preiswechsel im Bestand.');
  console.log(`Das ist **keine** Aussage über den Rhythmus: Beobachtet sind ${laengste} Tage,`);
  console.log('gesetzt ist eine Grenze von 90. Was fehlt, ist der Zeitraum, nicht die Messung —');
  console.log('und die Frage an den Lieferanten bleibt offen, aber sie hat jetzt einen Befund daneben.');
} else if (beobachtet.length > 0) {
  console.log(`\n${geaendert.length} Artikelnummer(n) mit verschobenem Nettopreis — einzeln ansehen.`);
}

console.log('\nHier steht kein einziger Preis. Die Grundlage liegt außerhalb des Verzeichnisses,');
console.log('und die Ausgabe eines Werkzeugs landet schneller in einem Dokument als eine Datei.');
process.exit(0);
