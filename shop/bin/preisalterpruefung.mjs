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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';
import { preisalterBefund, GRENZE_TAGE, GRENZE_HERKUNFT } from '../src/preisalter.js';
import { gebotstragendeSkus, rettungswegbefund } from '../src/preisdeckung.js';
import { baueSuchindex, suche } from '../src/shopkern.js';
import { WARENKOERBE } from './kampagne.mjs';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const katalogPfad = join(WURZEL, 'data', 'katalog-baustoff.json');
const anzeigenPfad = join(WURZEL, 'ausgabe', 'kampagne', 'anzeigen.csv');

/*
 * **Seit Gate 29 liest dieser Prüfer das Erzeugnis.** Die eigene Suche sagt
 * ihm, welche Artikel die geschalteten Keywords treffen; gefragt wird
 * `ausgabe/site/shop.js`, also dieselben Daten wie im Browser des Besuchers.
 * Gegen einen alten Index geprüft, ruhte das Gebot auf der Trefferliste von
 * gestern.
 */
{
  const stand = frischebefund(WURZEL, 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
}

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
const korbSkus = [...beworbeneGruppen]
  .flatMap((g) => (WARENKOERBE[g]?.positionen ?? []).map((p) => p.sku));

/*
 * **Korb *und* Wort — 8. September 2026.**
 *
 * Bis heute waren das nur die Korbpositionen. Die Begründung in
 * `src/preisalter.js` nannte aber von Anfang an zwei Gründe, warum der
 * Drehstiftdübel nicht eskaliert: „in keinem Keyword, in keinem
 * Referenzkorb". Gemessen traf das geschaltete Keyword „Fassadendübel" genau
 * diesen Artikel, und sein Preis war 104 Tage alt.
 *
 * > **Das Gebot ruht auf dem Korb; gekauft wird, was das Wort nennt.**
 *
 * Gelesen werden die **geschalteten** Keywords aus `keywords.csv` — dieselbe
 * Datei, die hochgeladen würde. Was Gate 29 dort schon zurückgestellt hat,
 * steht nicht mehr darin und trägt folgerichtig kein Gebot mehr.
 */
const keywordPfad = join(WURZEL, 'ausgabe', 'kampagne', 'keywords.csv');
const skript = join(WURZEL, 'ausgabe', 'site', 'shop.js');
let wortSkus = [];
if (existsSync(keywordPfad) && existsSync(skript)) {
  const roh = readFileSync(skript, 'utf8').match(/window\.__SHOP__=(\{[\s\S]*?\});\n/);
  if (roh) {
    const D = JSON.parse(roh[1]);
    const index = baueSuchindex({
      artikel: D.artikel ?? [], seiten: D.seiten ?? [], suchwoerter: D.suchwoerter ?? [],
    });
    const woerter = [...new Set(readFileSync(keywordPfad, 'utf8').trim().split('\n').slice(1)
      .map((z) => z.split(',')[2]).filter(Boolean))];
    wortSkus = [...gebotstragendeSkus({
      keywords: woerter, finde: (frage) => suche(index, frage, { grenze: 20 }),
    })];
  }
}

const beworbeneSkus = new Set([...korbSkus, ...wortSkus]);
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
console.log(`Auf ${e.beworben.length} Artikelpreisen ruht ein Gebot (Referenzwarenkörbe und geschaltete Keywords).`);

if (e.verdacht.length) {
  console.log(`\n${e.verdacht.length} über der Grenze, aber ohne Gebot darauf — nachfragen, nicht sperren:`);
  for (const v of e.verdacht) {
    console.log(`  ${String(v.tage).padStart(4)} T  ${v.gruppe.padEnd(10)} ${v.bezeichnung.slice(0, 52)}`);
  }
}


/**
 * **Ergänzt am 9. September 2026.** Der Rettungsweg der Preisdatei gehört
 * hierher, wo ohnehin über die Einkaufspreise gewacht wird: Ohne sie gibt es
 * keinen Preis, dessen Alter zu messen wäre.
 */
const versioniert = (pfad) => spawnSync('git', ['ls-files', '--error-unmatch', join('shop', pfad)],
  { cwd: join(WURZEL, '..'), encoding: 'utf8' }).status === 0;
const r = rettungswegbefund((pfad) => existsSync(join(WURZEL, pfad)), versioniert);
console.log(`  Rettungsweg der Preisdatei: ${r.geprueft} Datei(en) auf Vorhandensein und Versionierung`);

if (e.sauber && r.sauber) {
  console.log('\nKeine Meldung — kein Gebot ruht auf einem Preis über der Grenze.');
  console.log('Ein alter Einkaufspreis ist die Marge von gestern, ausgewiesen als die von heute.');
  process.exit(0);
}

for (const m of r.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${e.fehler.length} Meldung(en) — hier wird auf eine alte Marge Geld gesetzt:\n`);
for (const f of e.fehler) {
  console.log(`  ✗ ${f.sku}  ${f.gruppe}  ${f.bezeichnung.slice(0, 52)}`);
  console.log(`      ${f.grund}`);
}
console.log('\nZwei richtige Auswege: den Preis beim Lieferanten nachziehen, oder den Artikel aus');
console.log('dem Referenzwarenkorb nehmen. Der falsche wäre, die Grenze hochzusetzen.');
process.exit(1);
