#!/usr/bin/env node
/**
 * Zeigt jeder Rückweg auf eine Stelle, an der wirklich etwas steht?
 *
 *   npm run pruefe-kanaele
 *
 * **Nicht `rueckwegpruefung.mjs`.** Dieser Name war der erste Wurf — und er
 * ist vergeben: `npm run pruefe-rueckweg` fährt seit dem 6. September den
 * Sweep über bestellbare Mengen. Ich habe die Datei beim Schreiben
 * **überschrieben**; gefunden hat es `pruefe-ungerufen`, weil die Funktion
 * darin plötzlich niemand mehr rief. Wiederhergestellt aus dem letzten Commit.
 *
 * > **Ein neuer Prüfer, der eine Datei anlegt, legt sie vielleicht nicht an.**
 *
 * Warum es diese Messung gibt, steht im Kopf von `src/rueckweg.js` — dort
 * einmal.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  KANAELE, abweisungskanalbefund, kanalGefuellt, kanalbefund, rueckwegsatz,
} from '../src/rueckweg.js';
import { ABWEISUNGEN } from '../src/abweisung.js';
import { baueKundenanfrage, mailtoWeg } from '../src/kundenanfrage.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (...p) => JSON.parse(readFileSync(join(...p), 'utf8'));

const betreiber = lies(SHOP, 'data', 'betreiber.json');
const katalog = ladeBaustoffkatalog(
  lies(SHOP, 'data', 'katalog-baustoff.json'),
  lies(REPO, 'preise', 'baustoff-preise.json'),
  lies(SHOP, 'data', 'lieferanten.json'),
);

const meldungen = [];

/*
 * **Die Stelle, die den Fund gemacht hat.** Gefahren wird sie, nicht gelesen:
 * Ein Korb, eine Anfrage, und dann die Frage, was der Kunde zu lesen bekommt,
 * wenn keine Adresse hinterlegt ist. Ein Prüfer, der nur den Quelltext ansieht,
 * hätte den Satz gefunden und nicht, ob er wirklich erscheint.
 */
const artikel = katalog.artikel.filter((a) => a.vkNetto !== null);
if (artikel.length === 0) {
  console.error('Kein bepreister Artikel — der Anfrageweg lässt sich nicht fahren.');
  process.exit(2);
}
const rechnung = kundenWarenkorb(
  // Genug für die Grenze: Der erste Korb lag 59 € darunter und wurde abgewiesen,
  // bevor der Rückweg überhaupt in Frage kam.
  artikel.slice(0, 6).map((a) => ({ sku: a.sku, menge: 99 })),
  {
    artikel: katalog.artikel,
    lieferanten: [...katalog.lieferantenById.values()],
    // **Ohne die Grenze keine Anfrage — und der Prüfer misst nichts.** Der
    // erste Lauf ließ sie weg: `baueKundenanfrage` gab „Der Mindestbestellwert
    // ist nicht hinterlegt" zurück, `mailtoWeg` daraufhin „keine-anfrage", und
    // der Rückweg ohne Mailadresse kam nie zustande. Der Prüfer war grün und
    // hatte den Weg nicht befahren. Die Gegenprobe hat es gefunden.
    mindestbestellwertNetto: betreiber.mindestbestellwertNetto ?? null,
  },
);
const anfrage = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-09-15' });
const weg = mailtoWeg(anfrage);

// **Nicht gefahren ist nicht grün.** Ein Korb, aus dem keine Anfrage wird,
// erreicht den Rückweg nie — und ein Prüfer, der das verschweigt, meldet
// „keine Meldung" über einen Weg, den er nicht gegangen ist.
if (weg.grund === 'keine-anfrage') {
  console.error(`\nAbbruch: Aus dem Probekorb wird keine Anfrage (${anfrage.hindernis}) —`);
  console.error('der Rückweg ohne Mailadresse kommt damit gar nicht zustande.');
  process.exit(2);
}

if (weg.grund === 'keine-adresse') {
  meldungen.push(...kanalbefund(weg.text, betreiber, 'die Kasse ohne Mailadresse').meldungen);
} else if (weg.adresse === null && weg.grund !== 'keine-anfrage') {
  // „zu-lang" ist ein eigener Fall mit eigenem Satz; er nennt keinen Kanal.
  meldungen.push(...kanalbefund(`${weg.text} ${rueckwegsatz(betreiber).text}`,
    betreiber, `die Kasse (${weg.grund})`).meldungen);
}

/*
 * **Und die Abweisungen des Empfangsskripts.** Die zweite Sorte Rückweg: Was
 * der Besteller tun kann, wenn die Bestellung nicht durchgeht. Warum sie
 * `nenntKanal` sagen müssen und kein Muster über ihre Prosa läuft, steht bei
 * `abweisungskanalbefund` — dort einmal.
 */
meldungen.push(...abweisungskanalbefund(ABWEISUNGEN, betreiber).meldungen);

const offen = KANAELE.filter((k) => !kanalGefuellt(betreiber[k.feld]));
console.log(`\nRückwege — ${KANAELE.length} Kanäle, ${KANAELE.length - offen.length} davon `
  + 'in der Betreiberdatei belegt');
console.log(`Heute gilt: „${rueckwegsatz(betreiber).text}"\n`);

if (meldungen.length) {
  for (const m of meldungen) {
    console.log(`  ✗ ${m.text}`);
    console.log(`      [${m.regel}]`);
  }
  console.log(`\n${meldungen.length} Meldung(en).`);
  process.exit(1);
}

if (offen.length) {
  console.log(`${offen.map((k) => k.wort).join(' und ')} fehlt noch — und kein Satz an den`);
  console.log('Kunden tut so, als gäbe es sie. Das ist der Unterschied.');
} else {
  console.log('Jeder Rückweg zeigt auf eine Stelle, an der wirklich etwas steht.');
}
console.log('Ein Rückweg, der auf eine leere Stelle zeigt, ist kein Rückweg.');
process.exit(0);
