#!/usr/bin/env node
/**
 * Kommt aus jeder bestellbaren Menge dieselbe zurück?
 *
 *   npm run pruefe-rueckweg
 *
 * **Der Anlass, 13. September 2026.** `npm run anfrage-lesen` gibt es seit dem
 * 3. September und ersetzt das Abtippen einer eingegangenen Anfrage. Er trägt
 * seither den Satz über sich: *„Ein Leser, der bei Abweichung rät, ist
 * schlimmer als das Abtippen."* Geprüft war daran die **Abweichung** — dass er
 * nichts zurückgibt, wenn die Summen nicht stimmen.
 *
 * > **Nicht geprüft war der Fall, in dem die Summen stimmen und die Menge
 * > trotzdem eine andere ist.**
 *
 * Gemessen am Bestand: `POS-53402`, Kantenschutz in Stangen zu 2,5 m, 0,95 €
 * je laufendem Meter. Bestellt 302,50 LFM — also 121 ganze Stangen. Die
 * Positionszeile druckt `0,95 € 287,38 €`, und der Leser gab **302,51 LFM**
 * zurück: eine Menge, die kein ganzes Stück ist und die so niemand liefern
 * kann. Die Nachrechnung sah nichts, denn `302,51 × 0,95` sind auf Cent
 * gerundet wieder 287,38 €.
 *
 * **Der Fehler war kleiner als ein Cent in Geld und trotzdem eine andere
 * Ware.**
 *
 * Diese Prüfung geht den Weg hin und zurück — über jeden Artikel des Katalogs
 * und jede Menge, die die Oberfläche daraus bilden kann.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { rueckwegbefund } from '../src/anfragelesen.js';
import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';
import { oeffentlicherArtikel } from '../src/shopkern.js';
import { bestellschritt } from '../src/gebinde.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (...t) => JSON.parse(readFileSync(join(...t), 'utf8'));

/*
 * **Die Preisdatei liegt außerhalb des Verzeichnisses.** Fehlt sie, weigert
 * sich dieser Prüfer, statt über einen Katalog ohne Preise grün zu melden —
 * dieselbe Haltung wie `pruefe-gebinde` seit dem 8. September. Ein Artikel
 * ohne Verkaufspreis hat keine Zeilensumme, und ohne Zeilensumme gibt es
 * keinen Rückweg zu prüfen.
 */
let preise;
try {
  preise = lies(REPO, 'preise', 'baustoff-preise.json');
} catch {
  console.error('\nNicht messbar: preise/baustoff-preise.json fehlt — sie liegt außerhalb');
  console.error('des Verzeichnisses. Ohne Verkaufspreise hat keine Position eine Zeilensumme,');
  console.error('und über nichts grün zu melden wäre schlimmer als diese Weigerung.');
  process.exit(3);
}

const katalog = ladeBaustoffkatalog(
  lies(SHOP, 'data', 'katalog-baustoff.json'),
  preise,
  lies(SHOP, 'data', 'lieferanten.json'),
);

// Derselbe Zuschnitt wie in der Seite und im Leser: Geprüft wird der Weg, den
// ein Kunde geht, nicht der, den ein Testfall baut.
const artikel = katalog.artikel.map(oeffentlicherArtikel);
const nachSku = new Map(artikel.map((a) => [a.sku, a]));
const schrittFuer = (sku) => bestellschritt(nachSku.get(sku));

const befund = rueckwegbefund(artikel, schrittFuer);

console.log(`\nRückweg der Anfrage — ${befund.mengen} bestellbare Mengen über `
  + `${befund.artikel} Artikel hin und zurück gerechnet\n`);
console.log(`  Dazu ${befund.krumme} Zeilensummen zwischen zwei Gebinden — sie dürfen `
  + 'nicht durchgehen.\n');

if (befund.ohnePreis) {
  console.log(`  ${befund.ohnePreis} Artikel ohne Verkaufspreis — sie haben keine Zeilensumme.`);
}
/*
 * **Was nicht gefahren wurde, wird genannt — 13. September 2026.** Bis heute
 * rechnete dieser Sweep mit einem Schritt von 1 weiter, wo keiner bekannt war,
 * und übersprang dabei stillschweigend die Gegenrichtung. Mit `mengenschritt`
 * betraf das 28 von 46 Artikeln: eine Prüfung, die über eine nicht gefahrene
 * Strecke grün meldete.
 */
if (befund.ohneSchritt.length) {
  console.log(`  ${befund.ohneSchritt.length} Artikel ohne Bestellschritt, nicht gefahren: `
    + `${befund.ohneSchritt.join(', ')}`);
  console.log('  Ihre Bezeichnung nennt keine Gebindegröße, und ihre Einheit ist teilbar —');
  console.log('  geraten wird nichts, aber geprüft ist dort auch nichts.');
}

if (befund.sauber) {
  console.log('Keine Meldung. Jede Menge, die die Oberfläche bilden kann, kommt aus ihrer');
  console.log('eigenen Positionszeile unverändert zurück — auch dort, wo der Unterschied');
  console.log('in Geld unter einem Cent bliebe und die Nachrechnung ihn nicht sähe.');
  console.log('Und keine Zeilensumme, die zwischen zwei Gebinden liegt, wird auf eines');
  console.log('gerundet: Das Einrasten ist eine Annahme, und sie wird geprüft.');
  process.exit(0);
}

console.log('Der Leser gibt eine andere Menge zurück, als bestellt wurde:\n');
for (const m of befund.meldungen.slice(0, 20)) console.log(`  ✗ ${m.text}  [${m.regel}]`);
if (befund.meldungen.length > 20) {
  console.log(`  … und ${befund.meldungen.length - 20} weitere.`);
}
console.log(`\n${befund.meldungen.length} Meldung(en) über `
  + `${new Set(befund.meldungen.map((m) => m.sku)).size} Artikel.`);
process.exit(1);
