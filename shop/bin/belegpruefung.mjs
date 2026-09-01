#!/usr/bin/env node
/**
 * Die Belege erzeugen und lesen, die der Kunde bekommt.
 *
 *   npm run pruefe-belege
 *
 * Kein Prüfer dieser Kette hat je einen fertigen Beleg gesehen. Sie lesen
 * Quelltext, Inhaltsdateien und gebaute Seiten — der Beleg entsteht erst im
 * Betrieb, aus einem Warenkorb. Also baut dieses Werkzeug einen: echter
 * Katalog, echte Preise, zwei Positionen von einem Lieferanten, und dann
 * dieselben vier Texte, die eine Bestellung auslösen würde.
 *
 * Die Regeln stehen in `src/belegpruefung.js`; hier steht nur, woraus die
 * Belege gemacht werden. Beides getrennt, weil sonst ein Prüfer sein eigenes
 * Prüfobjekt herstellt und niemand die Regeln einzeln testen kann.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { ZIELMARGE } from '../src/baustoffkatalog.js';
import { erzeugeAngebot, erzeugeAuftragsbestaetigung, erzeugeRechnung } from '../src/beleg.js';
import { erzeugeBestellungen } from '../src/bestellung.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { baueKundenanfrage } from '../src/kundenanfrage.js';
import { pruefeBelege } from '../src/belegpruefung.js';

const wurzel = dirname(dirname(fileURLToPath(import.meta.url)));
const lies = (name) => JSON.parse(readFileSync(join(wurzel, 'data', name), 'utf8'));

const lieferantenDatei = lies('lieferanten.json');
const katalog = ladeKatalog({ lieferanten: lieferantenDatei, artikel: lies('artikel.json') }, ZIELMARGE);

// Zwei Positionen, damit Positionszeilen, Fracht und Summenblock alle
// vorkommen. Der Warenkorb ist erfunden — die Preise und Konditionen darin
// sind es nicht.
const korb = berechneWarenkorb(
  [
    { sku: katalog.artikel[0].sku, menge: 5 },
    { sku: katalog.artikel[3].sku, menge: 12 },
  ],
  katalog,
);

const betreiber = { firma: '[[ Firma des Betreibers ]]', uid: '[[ UID ]]' };
const kunde = { firma: 'Musterbau GmbH', strasse: 'Baustellenweg 7', plz: '4600', ort: 'Wels', uid: 'ATU12345675' };
const gemeinsam = { datum: '01.09.2026', kunde, betreiber };

const belege = [
  { art: 'Angebot', text: erzeugeAngebot(korb, { nummer: 'AN-0001', ...gemeinsam }).text },
  { art: 'Auftragsbestätigung', text: erzeugeAuftragsbestaetigung(korb, { nummer: 'AB-0001', ...gemeinsam }).text },
  {
    art: 'Rechnung',
    text: erzeugeRechnung(korb, {
      nummer: 'RE-0001',
      lieferdatum: '05.09.2026',
      zahlung: { weg: 'eps', datum: '30.08.2026', kennzeichen: 'AB-0001' },
      ...gemeinsam,
    }).text,
  },
];

// Die vierte Kundendatei: der Anfragetext, den die Kasse in eine E-Mail legt.
// Er kommt aus einem anderen Rechenweg (`shopkern.js` statt `warenkorb.js`) —
// derselbe Korb, zwei Kalkulationen. Genau deshalb gehört er in denselben
// Durchlauf: Was der Kunde in einem Zug liest, muss ein Prüfer in einem Zug
// gelesen haben.
const anfrage = baueKundenanfrage({
  rechnung: kundenWarenkorb(
    [
      { sku: katalog.artikel[0].sku, menge: 5 },
      { sku: katalog.artikel[3].sku, menge: 12 },
    ],
    { artikel: katalog.artikel, lieferanten: lieferantenDatei.lieferanten ?? lieferantenDatei },
  ),
  bezirk: 'Perg',
  betreiber: { firma: betreiber.firma, ort: 'Ried in der Riedmark', email: '' },
  datum: '2026-09-01',
});
if (!anfrage.moeglich) {
  console.error(`Die Kundenanfrage ließ sich nicht bauen: ${anfrage.hindernis}`);
  process.exit(1);
}
belege.push({ art: 'Kundenanfrage', text: anfrage.text });

// Der fünfte Außentext geht nicht an den Kunden, sondern an den Lieferanten.
// Er stand am 1. September vormittags noch außerhalb jeder Prüfung — und trug
// genau deshalb eine leere Zeile „Ansprechpartner vor Ort:".
for (const b of erzeugeBestellungen(korb, {
  bestellnummer: 'B-2026-0001',
  absender: { firma: betreiber.firma },
  lieferadresse: {
    name: kunde.firma,
    strasse: kunde.strasse,
    plz: kunde.plz,
    ort: kunde.ort,
    telefon: '+43 660 1234567',
    hinweis: 'Zufahrt über die Nordseite, Wendeplatz vorhanden',
  },
})) {
  belege.push({ art: 'Lieferantenbestellung', text: b.text });
}

const befund = pruefeBelege(belege);
const zeigeTexte = process.argv.includes('--zeigen');

if (zeigeTexte) {
  for (const b of belege) {
    console.log(`\n${'='.repeat(72)}\n${b.art}\n${'='.repeat(72)}\n${b.text}`);
  }
  console.log('');
}

console.log(`Belege geprüft: ${befund.geprueft} (${belege.map((b) => b.art).join(', ')})`);
console.log(`Zahlungsziel laut Geschäftsbedingungen: ${befund.zielTage} Tage\n`);

for (const b of befund.befunde) {
  if (b.sauber) {
    console.log(`  ✓ ${b.art}`);
    continue;
  }
  for (const m of b.meldungen) {
    console.log(`  ✗ ${b.art}${m.zeile ? `:${m.zeile}` : ''} [${m.regel}]`);
    console.log(`      ${m.text}`);
  }
}

console.log('');
if (befund.sauber) {
  console.log('Keine Meldung. Der Text, der beim Kunden ankommt, ist gelesen worden —');
  console.log('nicht nur der Quelltext, aus dem er entsteht.');
  console.log('\nMit --zeigen stehen die Belege vollständig da; gelesen gehören sie trotzdem.');
} else {
  console.log(`${befund.meldungen} Meldung(en). Ein Beleg hat keine Fußnoten — was auf ihm steht, gilt.`);
  process.exitCode = 1;
}
