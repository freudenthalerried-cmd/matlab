#!/usr/bin/env node
/**
 * Erzeugt die Dateien, die im Wurzelverzeichnis der Website liegen müssen.
 *
 *   node bin/veroeffentlichung.mjs [--schreiben]
 *
 * Ohne `--schreiben` wird nur berichtet — wie beim Preislisten-Import, und aus
 * demselben Grund: Was ins Wurzelverzeichnis geht, ist nach außen sichtbar.
 * Der Feed wird zusätzlich auf Vollständigkeit geprüft; solange Platzhalter
 * im Katalog stehen, bleibt er leer, und das wird gesagt statt verschwiegen.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { robotsTxt, llmsTxt, katalogFeed } from '../src/maschinenlesbar.js';
import { ladeKatalog } from '../src/warenkorb.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, '..');
const schreiben = process.argv.includes('--schreiben');
const ziel = join(wurzel, 'veroeffentlichung');

const lies = (...t) => JSON.parse(readFileSync(join(...t), 'utf8'));
const lieferantenDatei = lies(wurzel, 'data', 'lieferanten.json');

/**
 * Welcher Katalog veröffentlicht wird.
 *
 * Zwei Modelle liegen nebeneinander im Bestand, und beide sind nach Gate 12
 * gleichrangig: der Radon-Streckenhandel auf Platzhalterpreisen und der
 * Baustoffhandel auf eigenen Baumeister-Einkaufspreisen. Veröffentlicht wird
 * der **Baustoffkatalog**, sobald seine Preisdatei zur Hand ist — er ist der,
 * dessen Preise bestätigt sind.
 *
 * Ohne Preisdatei fällt das Werkzeug auf den Radonkatalog zurück und meldet
 * das. Es tut dann nichts Falsches: Dessen Preise sind Platzhalter, und die
 * Sperre in `katalogFeed` hält sie zurück. Aber es soll niemand glauben, er
 * habe den echten Katalog vor sich.
 */
const preisPfad = join(wurzel, '..', 'preise', 'baustoff-preise.json');
const baustoffVerfuegbar = existsSync(preisPfad) && existsSync(join(wurzel, 'data', 'katalog-baustoff.json'));

const katalog = baustoffVerfuegbar
  ? ladeBaustoffkatalog(
      lies(wurzel, 'data', 'katalog-baustoff.json'),
      JSON.parse(readFileSync(preisPfad, 'utf8')),
      lieferantenDatei,
      ZIELMARGE,
    )
  : ladeKatalog({ lieferanten: lieferantenDatei, artikel: lies(wurzel, 'data', 'artikel.json') }, 0.35);

const katalogName = baustoffVerfuegbar
  ? 'Baustoffkatalog aus den Lieferantenrechnungen'
  : 'Radon-Platzhalterkatalog (die Preisdatei des Baustoffkatalogs fehlt)';

// Firmendaten und Liefergebiet liegen noch nicht vor. Sie werden als Lücke
// ausgewiesen, nicht erfunden — dieselbe Regel wie im Impressum-Gerüst.
const LUECKEN = [];
// Der Firmenname steht seit dem 26. August in den Betreiberdaten. Er wird
// von dort genommen, nicht mehr aus einer Umgebungsvariablen erfragt — die
// Entität braucht überall dieselbe Schreibweise, und zwei Quellen für
// denselben Namen sind eine Quelle zu viel.
const betreiber = existsSync(join(wurzel, 'data', 'betreiber.json'))
  ? lies(wurzel, 'data', 'betreiber.json')
  : {};
// `??` prüft nur auf null und undefined — eine gesetzte, aber leere
// Umgebungsvariable hätte damit gegen die Betreiberdaten gewonnen und die
// Lücke wieder aufgerissen. Leer heißt hier „nicht gesetzt".
const firmenname = (process.env.SHOP_NAME?.trim() || betreiber.firma?.trim()) || null;
const bezirke = (process.env.SHOP_BEZIRKE ?? '').split(',').map((b) => b.trim()).filter(Boolean);
if (!firmenname) LUECKEN.push('Firmenname (SHOP_NAME) — die Entität braucht überall dieselbe Schreibweise');
if (bezirke.length === 0) LUECKEN.push('Liefergebiet (SHOP_BEZIRKE) — als Bezirksliste, nicht als Satz');

const robots = robotsTxt({ suche: true, training: false });
const llms = llmsTxt({
  name: firmenname ?? '[[ FIRMENNAME — FEHLT ]]',
  beschreibung: 'Baustoffe für Handwerksbetriebe, Lieferung regional.',
  liefergebiet: { land: 'AT', bezirke },
  hinweise: ['Alle Preise verstehen sich netto für Unternehmer.'],
  seiten: [],
});
const feed = katalogFeed(katalog.artikel, { liefergebiet: { land: 'AT', bezirke } });

console.log(`\nKatalog: ${katalogName}`);
console.log(`         ${katalog.artikel.length} Artikel`);
console.log(`Feed:    ${feed.anzahl} veröffentlichbar, ${feed.zurueckgehalten.length} zurückgehalten`);
if (feed.zurueckgehalten.length) {
  const gruende = new Set(feed.zurueckgehalten.flatMap((z) => z.gruende));
  for (const g of gruende) console.log(`  · ${g}`);
}
if (feed.mitLuecken.length) {
  console.log(`\n${feed.mitLuecken.length} Einträge sind veröffentlichbar, aber unvollständig:`);
  const luecken = new Map();
  for (const e of feed.mitLuecken) for (const f of e.fehlend) luecken.set(f, (luecken.get(f) ?? 0) + 1);
  for (const [was, wieoft] of luecken) console.log(`  · ${was} — bei ${wieoft} Artikeln`);
  console.log('Ein Feed mit lückenhaften Einträgen wird abgelehnt, nicht teilweise angenommen.');
}
console.log(`\nEinreichbar: ${feed.einreichbar ? 'ja' : 'nein'}`);
if (LUECKEN.length) {
  console.log('\nEs fehlen Angaben, die nicht erfunden werden:');
  for (const l of LUECKEN) console.log(`  · ${l}`);
}

if (!schreiben) {
  console.log('\nProbelauf. Zum Schreiben mit --schreiben aufrufen.');
  process.exit(0);
}
if (LUECKEN.length) {
  console.error('\nAbbruch: Es wird nichts veröffentlicht, solange Pflichtangaben fehlen.');
  process.exit(1);
}

mkdirSync(ziel, { recursive: true });
writeFileSync(join(ziel, 'robots.txt'), robots);
writeFileSync(join(ziel, 'llms.txt'), llms);
writeFileSync(join(ziel, 'feed.jsonl'), feed.zeilen.map((z) => JSON.stringify(z)).join('\n') + '\n');
console.log(`\nGeschrieben nach ${ziel}: robots.txt, llms.txt, feed.jsonl (${feed.anzahl} Zeilen)`);
