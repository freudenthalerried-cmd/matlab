#!/usr/bin/env node
/**
 * Wie alt ist die Preisbasis?
 *
 *   node bin/preisalterpruefung.mjs
 *
 * Die beworbenen Gruppen kommen aus `ausgabe/kampagne/anzeigen.csv` — also
 * aus der Entscheidung, die das Kampagnenwerkzeug tatsächlich getroffen hat,
 * und nicht aus einer zweiten Liste daneben. Fehlt die Datei, bricht der
 * Prüfer ab: Ohne sie wüsste er nicht, wo Geld auf eine Marge gesetzt wird,
 * und meldete die Verschärfung als bestanden, ohne sie geprüft zu haben.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preisalterBefund, GRENZE_TAGE, GRENZE_HERKUNFT } from '../src/preisalter.js';
import { WARENKOERBE } from './kampagne.mjs';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const katalogPfad = join(WURZEL, 'data', 'katalog-baustoff.json');
const anzeigenPfad = join(WURZEL, 'ausgabe', 'kampagne', 'anzeigen.csv');

if (!existsSync(anzeigenPfad)) {
  console.error(`Abbruch: ${anzeigenPfad} fehlt.`);
  console.error('Ohne die Anzeigen ist nicht bekannt, für welche Gruppen Werbebudget ausgegeben');
  console.error('wird — und genau dort ist ein alter Einkaufspreis ein Fehler und kein Verdacht.');
  console.error('Erst `npm run kampagne`, dann `npm run pruefe-preisalter`.');
  process.exit(2);
}

// Spalte 2 ist die Anzeigengruppe; die Kopfzeile fällt weg. Die Werte dieser
// Spalte enthalten keine Beistriche (Warengruppennamen), deshalb genügt hier
// die einfache Zerlegung — anders als bei den Keywords, wo eine
// Artikelbezeichnung mit Beistrich die naive Zerlegung zerlegt hat.
const beworbeneGruppen = new Set(
  readFileSync(anzeigenPfad, 'utf8').trim().split('\n').slice(1)
    .map((z) => z.split(',')[1]).filter(Boolean),
);

// Die Artikel, auf deren Preis ein Gebot ruht: die Positionen der
// Referenzwarenkörbe der beworbenen Gruppen. `WARENKOERBE` kommt aus dem
// Kampagnenwerkzeug selbst — eine zweite Liste daneben wäre die sicherste
// Art, beide auseinanderlaufen zu lassen.
const beworbeneSkus = new Set(
  [...beworbeneGruppen].flatMap((g) => (WARENKOERBE[g]?.positionen ?? []).map((p) => p.sku)),
);
if (beworbeneGruppen.size > 0 && beworbeneSkus.size === 0) {
  console.error('Abbruch: Zu den beworbenen Gruppen gibt es keinen Referenzwarenkorb.');
  console.error('Dann prüft die Verschärfung nichts und meldete es als bestanden.');
  process.exit(2);
}

const katalog = JSON.parse(readFileSync(katalogPfad, 'utf8'));
const heute = new Date().toISOString().slice(0, 10);
const e = preisalterBefund({ artikel: katalog.artikel, heute, beworbeneSkus });

console.log(`\nPreisalter am ${heute} — ${e.geprueft} Artikel`);
console.log(`Grenze: ${GRENZE_TAGE} Tage (${GRENZE_HERKUNFT.art}).`);
console.log(`  ${GRENZE_HERKUNFT.grund}`);
console.log(`\nJüngster Preis ${e.juengste} Tage, ältester ${e.aelteste}, Median ${e.median}.`);
console.log(`Anzeigen laufen auf: ${[...beworbeneGruppen].sort().join(', ') || '(nichts)'}`);
console.log(`Auf ${e.beworben.length} Artikelpreisen ruht ein Gebot (Referenzwarenkörbe).`);

if (e.verdacht.length) {
  console.log(`\n${e.verdacht.length} über der Grenze, aber ohne Gebot darauf — nachfragen, nicht sperren:`);
  for (const v of e.verdacht) {
    console.log(`  ${String(v.tage).padStart(4)} T  ${v.gruppe.padEnd(10)} ${v.bezeichnung.slice(0, 52)}`);
  }
}

if (e.sauber) {
  console.log('\nKeine Meldung — kein Gebot ruht auf einem Preis über der Grenze.');
  console.log('Ein alter Einkaufspreis ist die Marge von gestern, ausgewiesen als die von heute.');
  process.exit(0);
}

console.log(`\n${e.fehler.length} Meldung(en) — hier wird auf eine alte Marge Geld gesetzt:\n`);
for (const f of e.fehler) {
  console.log(`  ✗ ${f.sku}  ${f.gruppe}  ${f.bezeichnung.slice(0, 52)}`);
  console.log(`      ${f.grund}`);
}
console.log('\nZwei richtige Auswege: den Preis beim Lieferanten nachziehen, oder den Artikel aus');
console.log('dem Referenzwarenkorb nehmen. Der falsche wäre, die Grenze hochzusetzen.');
process.exit(1);
