#!/usr/bin/env node
/**
 * Stimmen die Kennzahlen der PR-Beschreibung noch?
 *
 *   node bin/schaufensterpruefung.mjs
 *
 * Gemessen wird am Verzeichnis, nicht an einer zweiten Liste. Wo eine Messung
 * ein Erzeugnis braucht (gebaute Seiten, Kampagnendateien), bricht der Prüfer
 * ab, wenn es fehlt — eine Messung ohne Gegenstand meldete sonst Grün.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { pruefeSchaufenster } from '../src/schaufenster.js';
import { PRUEFER, BROWSERPRUEFER } from '../src/pruefregister.js';
import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';
import { katalogbefund } from '../src/baustoffkatalog.js';
import { noetigerUmsatz } from '../src/kostenbild.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(SHOP, '..');
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));

const beschreibung = join(REPO, 'docs', 'baustoff-shop', 'pr-beschreibung.md');
const site = join(SHOP, 'ausgabe', 'site');
const kampagne = join(SHOP, 'ausgabe', 'kampagne');

for (const [pfad, wie] of [[beschreibung, ''], [site, 'npm run website'], [kampagne, 'npm run kampagne']]) {
  if (existsSync(pfad)) continue;
  console.error(`Abbruch: ${pfad} fehlt.${wie ? ` Zuerst \`${wie}\`.` : ''}`);
  console.error('Eine Messung ohne Gegenstand meldet Grün und hat nichts geprüft.');
  process.exit(2);
}

const zaehleHtml = (ordner, tief) => {
  if (!existsSync(ordner)) return 0;
  const eintraege = readdirSync(ordner, { withFileTypes: true });
  const hier = eintraege.filter((e) => e.isFile() && e.name.endsWith('.html')).length;
  if (!tief) return hier;
  return hier + eintraege.filter((e) => e.isDirectory())
    .reduce((s, e) => s + zaehleHtml(join(ordner, e.name), true), 0);
};

const katalogDatei = lies(join(SHOP, 'data', 'katalog-baustoff.json'));
const katalog = ladeBaustoffkatalog(
  katalogDatei,
  lies(join(REPO, 'preise', 'baustoff-preise.json')),
  lies(join(SHOP, 'data', 'lieferanten.json')),
);
// **Berichtigt am 01.09.** Hier stand ein Nachbau: `vorteil()` je Artikel,
// sortiert, Median gezogen. Er lieferte **26**, während die Startseite und die
// Preistafel **26,7** ausweisen — `vorteil()` rundet je Artikel auf ganze
// Prozent, `katalogbefund` bildet den Median des Verhältnisses und rundet
// einmal am Ende. Zwei Rechnungen für dieselbe Aussage, und der Prüfer segnete
// die ab, die niemand sieht.
//
// **Ein Prüfer, der mit einer eigenen Rechnung misst, prüft seine Rechnung.**
// Gemessen wird jetzt an derselben Quelle, aus der die Seite schöpft.
const befund = katalogbefund(katalog);

const gateText = readFileSync(join(REPO, 'docs', 'baustoff-shop', 'gate-register.md'), 'utf8');
// **Gezählt werden die Zeilen der Tafel, nicht die Erwähnungen im Fließtext.**
// Bis zum 3. September stand hier `/Gate (\d+)/` — die höchste Nummer, die
// irgendwo im Text vorkam. Gate 25 wurde an diesem Tag eingetragen und in
// seiner eigenen Zeile nie „Gate 25" genannt (die Zeile beginnt mit `| **25**`
// und spricht im Text über Gate 20). Der Prüfer meldete weiter 24 und war
// grün: Ein neues Gate war für ihn keines, solange niemand darüber schrieb.
//
// > **Ein Anker im Fließtext misst, worüber geredet wird — nicht, was da ist.**
const gates = Math.max(...[...gateText.matchAll(/^\|\s*\*\*(\d+)\*\*\s*\|/gm)].map((t) => Number(t[1])));
if (!Number.isFinite(gates) || gates < 20) {
  console.error(`Abbruch: In gate-register.md stehen nur ${gates} Gates — die Tafel ist nicht lesbar.`);
  process.exit(2);
}

const zaehleSzenarien = (datei) => {
  const quelle = readFileSync(join(SHOP, 'bin', datei), 'utf8');
  return [...quelle.matchAll(/\bname:\s*['"`]/g)].length;
};

const anzeigengruppen = readFileSync(join(kampagne, 'anzeigengruppen.csv'), 'utf8').trim().split('\n').slice(1);
const cpc = (gruppe) => {
  const zeile = anzeigengruppen.find((z) => z.split(',')[1] === gruppe);
  return zeile ? Number(zeile.split(',')[3]) : null;
};

// Die Zahl der Testfälle kommt aus dem Lauf selbst und nicht aus einer
// gezählten Schreibweise: `pruefe-tests` findet `test(`-Aufrufe, der Läufer
// zählt, was tatsächlich lief. Die beiden weichen ab, und veröffentlicht
// gehört die zweite.
// `node --test test/` zählt Dateien, nicht Fälle — der erste Versuch meldete
// „1". Aufgerufen wird deshalb derselbe Ausdruck wie in `npm test`, und die
// Dateiliste wird hier aufgelöst statt der Shell überlassen.
const testDateien = readdirSync(join(SHOP, 'test'))
  .filter((n) => n.endsWith('.test.js')).sort().map((n) => join('test', n));
if (testDateien.length === 0) {
  console.error('Abbruch: keine Testdateien gefunden — die Zahl wäre eine erfundene Null.');
  process.exit(2);
}
const lauf = spawnSync('node', ['--test', ...testDateien], { cwd: SHOP, encoding: 'utf8' });
const testTreffer = lauf.stdout.match(/^# tests (\d+)$/m);
if (!testTreffer) {
  console.error('Abbruch: Der Testlauf hat keine Zahl gemeldet.');
  console.error(lauf.stdout.slice(-800) + lauf.stderr.slice(-800));
  process.exit(2);
}

const geheimnis = spawnSync('node', ['bin/geheimnispruefung.mjs'], { cwd: SHOP, encoding: 'utf8' });
const geheimTreffer = geheimnis.stdout.match(/(\d+) von (\d+) Einkaufspreisen/);

const feed = spawnSync('node', ['bin/veroeffentlichung.mjs'], { cwd: SHOP, encoding: 'utf8' });
const feedTreffer = feed.stdout.match(/(\d+) veröffentlichbar/);

// Die Leitzahl kommt aus derselben Rechnung wie überall — und mit dem
// Zahlweg, der entschieden ist, nicht mit dem, für den sie einmal gerechnet
// wurde.
const zielgroessen = JSON.parse(readFileSync(join(SHOP, 'data', 'zielgroessen.json'), 'utf8'));
const leitzahl = noetigerUmsatz(zielgroessen, zielgroessen.zahlweg);
if (!leitzahl.tragfaehig) throw new Error(`Die Zielgrößen tragen sich nicht: ${leitzahl.grund}`);

const messwerte = {
  artikel: katalog.artikel.length,
  seiten: zaehleHtml(site, true),
  artikelseiten: zaehleHtml(join(site, 'artikel'), false),
  wissen: zaehleHtml(join(site, 'wissen'), false),
  system: zaehleHtml(join(site, 'system'), false),
  gruppen: zaehleHtml(join(site, 'gruppe'), false),
  rechtliches: zaehleHtml(join(site, 'rechtliches'), false),
  gates,
  tests: Number(testTreffer[1]),
  oberflaeche: zaehleSzenarien('oberflaechenprobe.mjs'),
  shop: zaehleSzenarien('shopprobe.mjs'),
  pruefer: PRUEFER.length,
  // Aus der erzeugten Messliste, nicht aus keywords.csv: Phrase und Exakt sind
  // ein Begriff, und diese Zusammenfassung macht `messliste.mjs`. Eine zweite
  // wäre ein zweiter Stand.
  keywords: JSON.parse(readFileSync(join(SHOP, 'ausgabe', 'messliste-baustoff.json'), 'utf8'))
    .gruppen.reduce((n, g) => n + g.keywords.length, 0),
  browserpruefer: BROWSERPRUEFER.length,
  feed: feedTreffer ? Number(feedTreffer[1]) : null,
  ohneGtin: katalogDatei.artikel.filter((a) => !a.gtin).length,
  unterListe: befund.unterListe,
  medianVorteil: befund.medianAbstandZurListe,
  anlauf: readFileSync(join(kampagne, 'kampagnen.csv'), 'utf8').trim().split('\n').length - 1,
  cpcKamin: cpc('Kamin'),
  cpcDaemmung: cpc('Dämmung'),
  cpcWdvs: cpc('WDVS'),
  rekonstruierbar: geheimTreffer ? Number(geheimTreffer[1]) : null,
  // Auf ganze Euro, weil die Beschreibung ganze Euro nennt. Dieselbe Lehre wie
  // beim Medianabstand: Gemessen wird so, wie die Aussage gemacht wird —
  // sonst meldet der Prüfer 43.395,77 gegen 43.396 und hat recht, ohne dass
  // jemand etwas davon hat.
  noetigerUmsatz: Math.round(leitzahl.umsatzNetto),
  bestellungen: leitzahl.bestellungen,
};

const e = pruefeSchaufenster(readFileSync(beschreibung, 'utf8'), messwerte);

console.log(`\nSchaufensterabgleich: ${e.geprueft} Kennzahlen der PR-Beschreibung`);
console.log('Geprüft werden die Zahlen, nicht die Prosa — eine überholte Einschätzung findet');
console.log('dieses Werkzeug nicht.\n');

if (e.sauber) {
  console.log(`Alle ${e.geprueft} Kennzahlen stimmen mit dem Verzeichnis überein.`);
  console.log('Ein Zahlenwerk, das nur beim Schreiben stimmt, ist ein Preisschild von letztem Jahr.');
  process.exit(0);
}

console.log(`${e.meldungen.length} Meldung(en):\n`);
for (const m of e.meldungen) {
  console.log(`  ✗ ${m.name} [${m.art}]`);
  console.log(`      ${m.grund}`);
}
console.log('\n„veraltet" heißt: die Zahl nachziehen. „anker" heißt: der Satz wurde umgeschrieben');
console.log('und das Muster in src/schaufenster.js gehört mit. Das Muster zu löschen wäre der');
console.log('falsche Ausweg — dann prüft niemand mehr diese Zahl.');
process.exit(1);
