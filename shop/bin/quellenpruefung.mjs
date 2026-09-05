#!/usr/bin/env node
/**
 * Recherche prüfen: Welche Aussage ist belegt, welche nur behauptet?
 *
 *   node bin/quellenpruefung.mjs [recherche.json]
 *
 * Der dritte Durchgang der Prüfkette aus `inhalte-und-pruefteam.md`, jetzt
 * mit einer Regel statt einem Gefühl: Ein Video ist ein Hinweis, keine
 * Fundstelle; zwei Videos desselben Kanals sind eine Quelle; Kennwerte
 * brauchen Norm oder Datenblatt. Ohne Argument läuft die Vorlage.
 */

import { readFileSync } from 'node:fs';
import { werteRechercheAus, QUELLENARTEN } from '../src/quellen.js';

/**
 * **Berichtigt am 27.08.:** Ohne Argument las das Werkzeug bis dahin die
 * Vorlage mit erfundenen Quellen und meldete „Aussagen: 3 von 3 belegt".
 * Dieselbe Falle wie beim Inhaltsprüfer — und schlimmer, weil es das
 * Quellenregister des Bestands gar nicht gab: Das Werkzeug stand seit dem
 * 25. August bereit und hatte nie echte Eingabe gesehen.
 *
 * > **Ein Werkzeug ohne Bestand prüft die Vorlage und meldet Grün.**
 *
 * Jetzt liest es ohne Argument `inhalte/quellen.json` — die Fundstellen,
 * auf die sich die Inhaltsseiten wirklich berufen. Die Vorlage bleibt als
 * Selbstnachweis erreichbar: `--probe`.
 */
const datei = process.argv[2] === '--probe'
  ? new URL('../beispiel/recherche-beispiel.json', import.meta.url)
  : (process.argv[2] ?? new URL('../inhalte/quellen.json', import.meta.url));
let recherche;
try {
  recherche = JSON.parse(readFileSync(datei, 'utf8'));
} catch (fehler) {
  console.error(`Recherchedatei nicht lesbar: ${datei}`);
  console.error(`  ${fehler.message}`);
  console.error('Erwartet wird eine JSON-Datei nach dem Muster von beispiel/recherche-beispiel.json.');
  process.exit(1);
}

console.log(`\nThema: ${recherche.thema ?? '(ohne Titel)'}`);
if (recherche._hinweis) console.log(`Hinweis: ${recherche._hinweis}\n`);

const nachArt = {};
for (const q of recherche.quellen ?? []) nachArt[q.art] = (nachArt[q.art] ?? 0) + 1;
console.log('Quellen:');
for (const [art, anzahl] of Object.entries(nachArt)) {
  const eintrag = QUELLENARTEN[art];
  const rolle = eintrag ? (eintrag.tragend ? 'tragend' : 'Hinweis') : 'UNBEKANNT';
  console.log(`  ${anzahl}× ${art} (${rolle}${eintrag ? ' — ' + eintrag.was : ''})`);
}

const e = werteRechercheAus(recherche);
console.log(`\nAussagen: ${e.belegt} von ${e.aussagen} belegt`);
for (const o of e.offen) {
  console.log(`  ✗ ${o.id}: ${o.text}`);
  for (const g of o.gruende) console.log(`      → ${g}`);
}

console.log(`\n${e.verwendbar ? 'VERWENDBAR' : 'NOCH NICHT VERWENDBAR'} — ${e.verwendbar
  ? 'jede Aussage trägt ihre Quelle.'
  : 'offene Aussagen gehören belegt oder gestrichen, nicht abgeschwächt.'}`);
console.log('\nEin Video ist ein Hinweis, keine Fundstelle. Zusammenfassen ja, abschreiben nein.');

/**
 * **Ergänzt am 1. September.** Hier endete der Lauf ohne Rückgabewert, also
 * mit 0 — auch mit „NOCH NICHT VERWENDBAR". Der einzige exit(1) oben gilt
 * einer unlesbaren Datei.
 *
 * Gefunden hat es das Gegenprobenregister: Es strich einer Aussage ihre
 * Quellen, der Prüfer **meldete den Fund vollständig** und endete grün. Damit
 * stand er in jeder Prüferschleife auf „OK" — der zweite Prüfer an einem Tag
 * mit demselben Muster, nach `inhaltspruefung.mjs`.
 *
 * > **„Noch nicht verwendbar" mit Rückgabewert 0 heißt für jede Maschine:
 * > verwendbar.**
 */
// `--probe` ist der Selbstnachweis über eine absichtlich fehlerhafte Datei.
// Er soll finden und melden, nicht sperren — sonst kann das Werkzeug seine
// eigenen Muster nicht mehr vorführen.
if (!e.verwendbar && !process.argv.includes('--bericht') && !process.argv.includes('--probe')) {
  console.log('\nUnbelegte Aussagen lassen diesen Lauf rot enden. Mit --bericht nicht.');
  process.exit(1);
}
process.exit(0);
