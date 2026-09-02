#!/usr/bin/env node
/**
 * Sagt jede Stelle, an der ein Preis steht, dasselbe?
 *
 *   npm run pruefe-preise
 *
 * **Warum es das gibt.** Am 29. August wurde derselbe Fehler an vier Stellen
 * nacheinander gefunden: Der Quadratmeterpreis stand da, die kleinste
 * bestellbare Menge nicht. Erst auf der Artikelseite berichtigt, dann im
 * Produktfeed, dann in `llms.txt`, dann auf der Artikelkarte — jedes Mal
 * dachte ich, es sei erledigt.
 *
 * > **Ein Fehler, der an einer Stelle behoben ist, sieht behoben aus.**
 *
 * Die drei Nachzügler waren nicht vergessen worden. Es hat niemand
 * nachgesehen, und der Bau meldete nichts, weil keine Prüfung die Ausgaben
 * miteinander verglich. Genau das tut dieses Werkzeug — und zwar für **jeden**
 * Artikel, nicht für die drei, an denen es aufgefallen ist.
 *
 * Verglichen werden vier Ausgaben:
 *
 * | Ausgabe | woher |
 * |---|---|
 * | Artikelseite, Preistafel | `ausgabe/site/artikel/<sku>.html` |
 * | Artikelseite, JSON-LD | dieselbe Datei |
 * | Artikelkarte auf der Gruppenseite | `ausgabe/site/gruppe/<gruppe>.html` |
 * | `llms.txt` | `ausgabe/site/llms.txt` |
 *
 * Geprüft wird zweierlei: **derselbe Preis** überall, und — wo es eine
 * Gebindebindung gibt — **die kleinste bestellbare Menge überall**. Eine
 * Ausgabe, die den Preis nennt und die Mindestmenge verschweigt, ist keine
 * halbe Auskunft, sondern eine falsche: Sie nennt einen Betrag, den man für
 * nichts bekommt.
 *
 * Was es **nicht** prüft: ob der Preis richtig gerechnet ist. Dafür gibt es
 * `npm test` und `npm run katalog`. Hier geht es allein um Übereinstimmung.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';
import { mengenschritt } from '../src/gebinde.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const REPO = join(WURZEL, '..');
const SITE = join(WURZEL, 'ausgabe', 'site');

if (!existsSync(SITE)) {
  console.error('ausgabe/site/ fehlt — zuerst npm run website.');
  process.exit(2);
}

const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');
if (!existsSync(preisPfad)) {
  console.error('Die Preisdatei fehlt — ohne sie ist kein Abgleich möglich.');
  process.exit(2);
}

const katalog = ladeBaustoffkatalog(
  lies(join(WURZEL, 'data', 'katalog-baustoff.json')),
  lies(preisPfad),
  lies(join(WURZEL, 'data', 'lieferanten.json')),
  ZIELMARGE,
);

/** „5,23" → 5.23. Die Ausgaben schreiben deutsch, verglichen wird als Zahl. */
const alsZahl = (roh) => Number(String(roh).replace(/\s|&nbsp;/g, '').replace('.', '').replace(',', '.'));

const artikel = katalog.artikel.filter((a) => a.vkNetto !== null);
if (artikel.length === 0) {
  console.error('Kein bepreister Artikel im Katalog — ein Abgleich über nichts ist kein Befund.');
  process.exit(2);
}

const llms = existsSync(join(SITE, 'llms.txt')) ? readFileSync(join(SITE, 'llms.txt'), 'utf8') : '';

/** Die Kartenblöcke aller Gruppenseiten, nach Artikelnummer aufgeschlüsselt. */
const karten = new Map();
const gruppenOrdner = join(SITE, 'gruppe');
if (existsSync(gruppenOrdner)) {
  for (const datei of readdirSync(gruppenOrdner).filter((d) => d.endsWith('.html'))) {
    const html = readFileSync(join(gruppenOrdner, datei), 'utf8');
    // **Nachgezogen am 02.09.** Hier stand `'<a class="karte"'`. Die Kachel ist
    // seit dem Umbau ein `div` mit einem Verweis darin — die Trennung fand
    // nichts mehr, und der Prüfer meldete für alle 46 Artikel „die
    // Artikelkarte nennt die Mindestmenge nicht". Ein Anker im HTML ist eine
    // Verabredung mit dem Bauwerkzeug, und wer das Bauwerkzeug ändert, ändert
    // die Verabredung mit.
    for (const block of html.split('<div class="karte"').slice(1)) {
      const sku = block.match(/artikel\/([A-Za-z0-9-]+)\.html/)?.[1];
      // Bis zum Ende der Kachel: Die schließende Marke der Karte ist jetzt
      // `</div>` — genommen wird der Block bis zur nächsten Karte bzw. bis zum
      // Ende, was die Legen-Zeile einschließt und den Nachbarn nicht.
      if (sku && !karten.has(sku)) karten.set(sku, block);
    }
  }
}

const befunde = [];
let geprueft = 0;
let mitSchritt = 0;

for (const a of artikel) {
  const seitenPfad = join(SITE, 'artikel', `${a.sku}.html`);
  if (!existsSync(seitenPfad)) {
    befunde.push(`${a.sku}: keine Artikelseite gebaut`);
    continue;
  }
  geprueft++;
  const html = readFileSync(seitenPfad, 'utf8');
  const schritt = mengenschritt(a);
  if (schritt) mitSchritt++;

  const stellen = [];

  // 1. Preistafel — der erste „Netto"-Eintrag.
  const tafel = html.match(/<span class="k">Netto<\/span><span class="w">([\d.,]+)\s*€/);
  stellen.push({ name: 'Preistafel', preis: tafel ? alsZahl(tafel[1]) : null, text: tafel?.[0] ?? null });

  // 2. JSON-LD.
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let ldPreis = null;
  let ldMindest = null;
  if (ld) {
    try {
      const daten = JSON.parse(ld[1]);
      ldPreis = Number(daten.offers?.price);
      ldMindest = daten.offers?.eligibleQuantity?.minValue ?? null;
    } catch (fehler) {
      befunde.push(`${a.sku}: JSON-LD lässt sich nicht lesen — ${fehler.message}`);
    }
  }
  stellen.push({ name: 'JSON-LD', preis: ldPreis, text: ld ? 'vorhanden' : null });

  // 3. Artikelkarte.
  const karte = karten.get(a.sku);
  const kartenPreis = karte?.match(/class="preis">([\d.,&nbsp;\s]+)€/)?.[1];
  stellen.push({ name: 'Artikelkarte', preis: kartenPreis ? alsZahl(kartenPreis) : null, text: karte ? 'vorhanden' : null });

  // 4. llms.txt.
  const zeile = llms.split('\n').find((z) => z.includes(`/artikel/${a.sku}.html`));
  const llmsPreis = zeile?.match(/:\s*([\d.,]+)\s*€\s*je/)?.[1];
  stellen.push({ name: 'llms.txt', preis: llmsPreis ? alsZahl(llmsPreis) : null, text: zeile ?? null });

  for (const s of stellen) {
    if (s.text === null) {
      befunde.push(`${a.sku}: ${s.name} nennt den Artikel nicht`);
      continue;
    }
    if (s.preis === null || Number.isNaN(s.preis)) {
      befunde.push(`${a.sku}: ${s.name} nennt keinen lesbaren Preis`);
      continue;
    }
    if (Math.abs(s.preis - a.vkNetto) > 0.005) {
      befunde.push(`${a.sku}: ${s.name} nennt ${s.preis.toFixed(2)} €, gerechnet sind ${a.vkNetto.toFixed(2)} €`);
    }
  }

  // Die Mindestmenge — nur dort, wo es eine gibt, und dann überall.
  if (schritt) {
    const alsText = String(schritt).replace('.', ',');
    if (!html.includes(`Abgabe in ganzen`) || !html.includes(alsText)) {
      befunde.push(`${a.sku}: die Artikelseite nennt die Mindestmenge ${alsText} nicht`);
    }
    if (ldMindest === null) {
      befunde.push(`${a.sku}: das JSON-LD nennt keine eligibleQuantity`);
    } else if (Math.abs(ldMindest - schritt) > 1e-9) {
      befunde.push(`${a.sku}: JSON-LD nennt ${ldMindest} als Mindestmenge, erwartet ${schritt}`);
    }
    if (karte && !karte.includes(`ab ${alsText}`)) {
      befunde.push(`${a.sku}: die Artikelkarte nennt die Mindestmenge nicht`);
    }
    if (zeile && !zeile.includes(`Abgabe ab ${alsText}`)) {
      befunde.push(`${a.sku}: llms.txt nennt die Mindestmenge nicht`);
    }

    // **Jede genannte Menge muss lieferbar sein.** Die Schwelle „ab hier
    // übersteigt die Ware die Zustellung" wurde auf ganze Einheiten
    // gerundet: 83,00 € ÷ 5,23 € ergab 16 m² — eine Menge, die es bei einer
    // Platte zu 0,75 m² nicht gibt. Dieselbe Sorte Zahl wie ein Preis, den
    // man für nichts bekommt, nur in der anderen Spalte.
    const schwelle = html.match(/gleich viel wert<\/span><span class="w">([\d.,]+)\s/);
    if (schwelle) {
      const wert = alsZahl(schwelle[1]);
      const teiler = Math.round((wert / schritt) * 1e6) / 1e6;
      if (!Number.isInteger(teiler)) {
        befunde.push(`${a.sku}: die Schwelle ${schwelle[1]} ist kein Vielfaches von ${alsText} — nicht lieferbar`);
      }
    }
  }
}

console.log(`\nPreisabgleich: ${geprueft} Artikel über 4 Ausgaben, ${mitSchritt} davon mit Gebindebindung\n`);
for (const b of befunde) console.log(`  ✗ ${b}`);
if (!befunde.length) {
  console.log('  Jede Ausgabe nennt denselben Preis, und wo es ein Gebinde gibt, nennen ihn alle.');
}
console.log(`\n${geprueft} Artikel geprüft, ${befunde.length} Abweichungen.`);
process.exit(befunde.length ? 1 : 0);
