#!/usr/bin/env node
/**
 * Eine Artikelliste des Lieferanten einlesen.
 *
 *   node bin/artikelliste.mjs <lieferantId> <datei.csv> --stand=YYYY-MM-DD
 *                             [--schreiben] [--entfernen]
 *
 * Ohne `--schreiben` wird nur gelesen und berichtet.
 *
 * **Warum es dieses Werkzeug gibt.** Am 30.08. stellte sich heraus, dass für
 * den Tag, auf den dieses Vorhaben wartet, kein brauchbares Werkzeug bereit
 * lag: `import.mjs` schrieb in den Platzhalterbestand des abgelösten Modells,
 * `katalog-aus-rechnungen.mjs` liest Rechnungen und meldete bei einer
 * Artikelliste „0 Artikel". Beide sagen das seither — aber Sagen ist nicht
 * Können.
 *
 * Geschrieben werden zwei Dateien, und die Trennung ist der Zweck:
 *
 *   data/katalog-baustoff.json   öffentlich, ohne Preise
 *   preise/baustoff-preise.json  lokal, gitignoriert
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { leseArtikelliste, fuehreZusammen, WARENGRUPPEN } from '../src/artikelliste.js';
import { sichere } from '../src/sicherung.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const REPO = join(WURZEL, '..');

const KATALOG_ZIEL = process.env.KATALOG_ZIEL || join(WURZEL, 'data', 'katalog-baustoff.json');
const PREISE_ZIEL = process.env.KATALOG_PREISE_ZIEL || join(REPO, 'preise', 'baustoff-preise.json');

// Dieselbe Sperre wie im Katalogerzeuger, aus demselben Anlass: Am 30.08.
// hat ein Lauf mit halb umgelenkten Zielen die vertrauliche Preisdatei
// geleert. Wer eine Ausgabe umlenkt, lenkt beide um.
if (Boolean(process.env.KATALOG_ZIEL) !== Boolean(process.env.KATALOG_PREISE_ZIEL)) {
  console.error('\nAbbruch: Nur eines der beiden Ziele ist umgelenkt.');
  console.error('Die beiden Ausgaben gehören zusammen; die Preisdatei holt kein git zurück.');
  process.exit(2);
}

const [, , lieferantId, datei, ...rest] = process.argv;
const schreiben = rest.includes('--schreiben');
const entfernen = rest.includes('--entfernen');
const stand = (rest.find((r) => r.startsWith('--stand=')) ?? '').slice('--stand='.length);

if (!lieferantId || !datei) {
  console.error('Aufruf: node bin/artikelliste.mjs <lieferantId> <datei.csv> --stand=YYYY-MM-DD [--schreiben] [--entfernen]');
  process.exit(2);
}

const lieferanten = JSON.parse(readFileSync(join(WURZEL, 'data', 'lieferanten.json'), 'utf8'));
const lieferant = lieferanten.lieferanten.find((l) => l.id === lieferantId);
if (!lieferant) {
  console.error(`Unbekannter Lieferant: ${lieferantId}`);
  console.error('Bekannt sind: ' + lieferanten.lieferanten.map((l) => l.id).join(', '));
  process.exit(2);
}

if (!existsSync(datei)) {
  console.error(`Artikelliste nicht lesbar: ${datei}`);
  process.exit(2);
}

/**
 * Die Zuordnung der Lieferantensparten auf die sieben Warengruppen.
 *
 * Sie wird **einmal** gefüllt, nicht je Artikel: Der Lieferant gliedert nach
 * seinem Sortiment, dieser Shop nach der Aufgabe auf der Baustelle. Fehlt die
 * Datei, läuft alles wie bisher — dann muss die Liste die Gruppen selbst
 * tragen.
 */
const SPARTEN_DATEI = process.env.SPARTEN_DATEI || join(WURZEL, 'data', 'sparten.json');
const sparten = existsSync(SPARTEN_DATEI)
  ? (JSON.parse(readFileSync(SPARTEN_DATEI, 'utf8')).sparten ?? {})
  : {};

const { artikel, preise, fehler, warnungen, offeneSparten } = leseArtikelliste(
  readFileSync(datei, 'utf8'), lieferant, stand, sparten,
);

console.log(`\nArtikelliste ${datei}`);
console.log(`Lieferant: ${lieferant.name} (${lieferant.id})`);
console.log(`Stand:     ${stand || '(fehlt)'}`);
const ohneSparte = [...offeneSparten.values()].reduce((a, b) => a + b, 0);
console.log(`Gelesen:   ${artikel.length} Artikel, ${fehler.length} Fehler, ${warnungen.length} Warnungen`);
if (ohneSparte) console.log(`           ${ohneSparte} Zeilen warten auf eine Spartenzuordnung`);
console.log('');

if (fehler.length) {
  console.log('Fehler — diese Zeilen wurden nicht übernommen:');
  for (const f of fehler.slice(0, 30)) console.log('  ✗ ' + f);
  if (fehler.length > 30) console.log(`  … und ${fehler.length - 30} weitere`);
  console.log('');
}
if (warnungen.length) {
  const ohneGtin = warnungen.filter((w) => /ohne GTIN/.test(w)).length;
  const andere = warnungen.filter((w) => !/ohne GTIN/.test(w));
  if (ohneGtin) console.log(`  ! ${ohneGtin} Artikel ohne GTIN — für den Produktfeed verlangt`);
  for (const w of andere.slice(0, 20)) console.log('  ! ' + w);
  console.log('');
}

/**
 * Offene Sparten gebündelt — und zwar so, dass man sie **abarbeiten** kann.
 *
 * Ohne diesen Block stünden bei einer Liste mit dreihundert Artikeln
 * dreihundert Fehlerzeilen da, und die Arbeit bestünde darin, sie zu
 * sortieren. Mit ihm stehen zwanzig Zeilen da, nach Artikelzahl geordnet, in
 * der Form, in der sie in `data/sparten.json` gehören. Das ist der
 * Unterschied zwischen einem Tag und zehn Minuten.
 */
if (offeneSparten.size) {
  console.log(`\nOffene Sparten (${offeneSparten.size}) — nach data/sparten.json unter "sparten":\n`);
  for (const [name, anzahl] of [...offeneSparten].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${JSON.stringify(name)}: "",${' '.repeat(Math.max(1, 34 - name.length))}${String(anzahl).padStart(4)} Artikel`);
  }
  console.log(`\n  Erlaubt sind: ${WARENGRUPPEN.join(', ')}`);
}

if (artikel.length === 0) {
  console.error('\nAbbruch: kein einziger Artikel gelesen — es wird nichts geschrieben.');
  process.exit(2);
}

const jeGruppe = new Map();
for (const a of artikel) jeGruppe.set(a.gruppe, (jeGruppe.get(a.gruppe) ?? 0) + 1);
for (const [g, n] of [...jeGruppe].sort((x, y) => y[1] - x[1])) {
  console.log(`  ${g.padEnd(12)} ${String(n).padStart(3)}`);
}

const bestand = existsSync(KATALOG_ZIEL) ? JSON.parse(readFileSync(KATALOG_ZIEL, 'utf8')) : { artikel: [] };
const zusammen = fuehreZusammen(bestand.artikel ?? [], artikel, { entfernen });
console.log(`\nNeu:        ${zusammen.zugang.length}`);
console.log(`Geändert:   ${zusammen.geaendert.length}`);
console.log(`Nicht in der Liste: ${zusammen.fehlend.length}${entfernen ? ' (werden entfernt)' : ' (bleiben stehen)'}`);
if (zusammen.fehlend.length && !entfernen) {
  console.log('  ' + zusammen.fehlend.slice(0, 10).join(', ') + (zusammen.fehlend.length > 10 ? ' …' : ''));
  console.log('  Löschen ist eine Entscheidung — mit --entfernen.');
}

if (!schreiben) {
  console.log('\nProbelauf. Zum Übernehmen mit --schreiben aufrufen.');
  process.exit(0);
}

const katalogNeu = {
  ...bestand,
  _datenstand: `Aus einer Artikelliste des Lieferanten, Stand ${stand}.`,
  _hinweis: bestand._hinweis
    ?? 'Diese Datei enthält bewusst KEINE Preise. Sie stehen in preise/baustoff-preise.json, die von .gitignore gedeckt ist.',
  lieferantId: bestand.lieferantId ?? lieferant.id,
  artikel: zusammen.artikel,
};

const preisBestand = existsSync(PREISE_ZIEL) ? JSON.parse(readFileSync(PREISE_ZIEL, 'utf8')) : {};
const preiseNeu = {
  _warnung: preisBestand._warnung
    ?? 'VERTRAULICH. Einkaufskonditionen des Auftraggebers. Diese Datei gehört nicht in ein öffentliches Verzeichnis.',
  _quelle: `Artikelliste des Lieferanten ${lieferant.id}, Stand ${stand}.`,
  lieferantId: preisBestand.lieferantId ?? lieferant.id,
  preise: { ...(preisBestand.preise ?? {}), ...preise },
};
if (entfernen) for (const sku of zusammen.fehlend) delete preiseNeu.preise[sku];

mkdirSync(dirname(PREISE_ZIEL), { recursive: true });
const gesichert = [sichere(KATALOG_ZIEL), sichere(PREISE_ZIEL)].filter(Boolean);
writeFileSync(KATALOG_ZIEL, JSON.stringify(katalogNeu, null, 2) + '\n', 'utf8');
writeFileSync(PREISE_ZIEL, JSON.stringify(preiseNeu, null, 2) + '\n', 'utf8');

console.log(`\ngeschrieben: ${KATALOG_ZIEL} (${katalogNeu.artikel.length} Artikel)`);
console.log(`geschrieben: ${PREISE_ZIEL}  (vertraulich, gitignoriert)`);
for (const k of gesichert) console.log(`gesichert:   ${k}`);
console.log('\nDanach: npm run website && npm run pruefe-preise');
