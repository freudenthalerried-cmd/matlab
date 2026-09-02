#!/usr/bin/env node
/**
 * Die zweite Rechnung anwenden — auf einen echten Vorgang.
 *
 *   npm run kontrolle
 *
 * **Warum es dieses Werkzeug gibt.** Am 2. September habe ich gezählt, welche
 * Ausfuhren des Rechenkerns außerhalb der Tests niemand aufruft. Dreißig, und
 * darunter **sieben Kontrollen aus `src/kontrolle.js`** — dreiundfünfzig
 * Testverweise, kein einziger Aufruf aus dem Betrieb.
 *
 * Der Auftragsabgleich behauptet zum neunten Ergebnis: *„kontrolle.js prüft
 * jeden Beleg gegen die Rechnung."* Das Präsens beschrieb einen Vorgang, den
 * es nicht gab. Der Rechenkern war fertig, geprüft und **unerreichbar** — es
 * fehlte nicht die Rechnung, sondern der Knopf.
 *
 * > **Eine Kontrolle, die nur ein Test aufruft, kontrolliert einen Test.**
 *
 * `kontrolle.js` ist ausdrücklich die *zweite* Rechnung: Sie liest den
 * gerenderten Belegtext zurück und rechnet aus den Zeichen nach. Sie kennt
 * weder `warenkorb.js` noch `preis.js` — deshalb findet sie Fehler, die allen
 * Testfällen entgehen, weil die Objekte prüfen und keine Zeichen.
 *
 * Geprüft wird ein aus dem echten Katalog gebauter Vorgang. Am Tag, an dem die
 * erste Lieferantenrechnung eintrifft, nimmt derselbe Befehl sie entgegen —
 * bis dahin hält er den eigenen Bau gegen sich selbst.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { ZIELMARGE, ladeBaustoffkatalog } from '../src/baustoffkatalog.js';
import { baueVorgang, darfVorgangLaufen } from '../src/vorgang.js';
import {
  pruefeBelegRechnerisch,
  pruefeVorgangsklammer,
  pruefeMargenleck,
  pruefeFrachtdeckung,
  pruefeBruttoUnabhaengig,
  vergleicheMitWarenkorb,
} from '../src/kontrolle.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));

const lieferantenDatei = lies(join(SHOP, 'data', 'lieferanten.json'));
const preisPfad = process.env.VEROEFFENTLICHUNG_PREISE || join(REPO, 'preise', 'baustoff-preise.json');
const baustoff = existsSync(preisPfad) && existsSync(join(SHOP, 'data', 'katalog-baustoff.json'));

const katalog = baustoff
  ? ladeBaustoffkatalog(lies(join(SHOP, 'data', 'katalog-baustoff.json')), lies(preisPfad), lieferantenDatei, ZIELMARGE)
  : ladeKatalog({ lieferanten: lieferantenDatei, artikel: lies(join(SHOP, 'data', 'artikel.json')) }, ZIELMARGE);
const katalogName = baustoff
  ? `Baustoffkatalog (${katalog.artikel.length} Artikel)`
  : `Radon-Platzhalterkatalog (${katalog.artikel.length} Artikel)`;

// Der Warenkorb der Zielgröße, wie in bin/belegpruefung.mjs — damit beide
// Prüfer denselben Vorgang ansehen und ihre Befunde vergleichbar sind.
const ZIELKORB = lies(join(SHOP, 'data', 'zielgroessen.json')).warenkorbNetto;
const haelfte = ZIELKORB / 2;
const verkaeuflich = katalog.artikel.filter((a) => typeof a.vkNetto === 'number' && a.vkNetto > 0);
if (verkaeuflich.length < 2) {
  console.error(`Zu wenige verkäufliche Artikel im ${katalogName} — kein Vorgang baubar.`);
  process.exit(2);
}
const gewaehlt = [...verkaeuflich]
  .sort((a, b) => Math.abs(a.vkNetto - haelfte) - Math.abs(b.vkNetto - haelfte))
  .slice(0, 2);
const warenkorb = berechneWarenkorb(
  gewaehlt.map((a) => ({ sku: a.sku, menge: Math.max(1, Math.round(haelfte / a.vkNetto)) })),
  katalog,
);

const betreiberDatei = lies(join(SHOP, 'data', 'betreiber.json'));
const vorgang = baueVorgang({
  vorgangsnummer: 'V-2026-0001',
  kundendaten: {
    firma: 'Musterbau GmbH',
    uid: 'ATU12345675',
    email: 'buero@musterbau.at',
    strasse: 'Baustellenweg 7',
    plz: '4600',
    ort: 'Wels',
    telefon: '+43 660 1234567',
    unternehmerBestaetigt: true,
  },
  warenkorb,
  betreiber: { firma: betreiberDatei.firma, uid: betreiberDatei.uid ?? '' },
  datum: '02.09.2026',
  lieferdatum: '05.09.2026',
  rechnungsnummer: 'RE-2026-0001',
  zahlungEingegangen: true,
  zahlung: { weg: 'eps', datum: '30.08.2026', kennzeichen: 'V-2026-0001' },
});

/**
 * Ein Prüfschritt.
 *
 * **Jede Kontrolle nennt ihr Urteilsfeld selbst.** Die erste Fassung las
 * `abweichungen ?? fehler ?? []` und hielt alles andere für sauber — damit
 * konnten `pruefeMargenleck` (`{dicht, funde}`), `pruefeBruttoUnabhaengig`
 * (`{stimmig, abweichung}`) und `pruefeFrachtdeckung` (`{gedeckt, grund}`) in
 * diesem Werkzeug **niemals rot werden.** Drei von sieben, in einem Prüfer,
 * der an dem Tag entstand, an dem drei andere Prüfer beim Nichtrotwerden
 * ertappt wurden.
 *
 * > **Ein Sammelgriff auf „irgendein Feld mit Abweichungen" ist keine
 * > Auswertung, sondern eine Hoffnung.**
 *
 * Deshalb steht das Feld jetzt am Aufruf. Wer eine Kontrolle ergänzt, muss
 * sagen, woran man ihr Urteil abliest.
 */
const schritte = [];
const nimm = (name, was, { ok, meldungen = [] }) => {
  if (typeof ok !== 'boolean') throw new Error(`Kontrolle „${name}" liefert kein Urteil`);
  schritte.push({ name, was, ok, abweichungen: meldungen });
};

const rechnerisch = (e) => ({ ok: e.stimmig, meldungen: e.fehler });

nimm('Rechnung geht in sich auf', 'Fünf Gleichungen im gerenderten Text',
  rechnerisch(pruefeBelegRechnerisch(vorgang.rechnung.text)));
nimm('Angebot geht in sich auf', 'Dieselben Gleichungen auf dem Angebot',
  rechnerisch(pruefeBelegRechnerisch(vorgang.angebot.text)));

const klammer = pruefeVorgangsklammer(vorgang);
nimm('Die Klammer des Vorgangs ist geschlossen', 'Nummer, Kunde und Lieferadresse in jedem Beleg',
  { ok: klammer.geschlossen, meldungen: klammer.abweichungen });

// Nicht „Verkauf unter Einkauf" — diese Kontrolle sucht die Einkaufszahlen im
// Kundentext. Gate: keine Spanne ausgeben.
const leck = pruefeMargenleck(vorgang);
nimm('Keine Einkaufszahl im Kundenbeleg', 'Wareneinsatz und Deckungsbeitrag stehen nirgends im Text',
  { ok: leck.dicht, meldungen: leck.funde });

const brutto = pruefeBruttoUnabhaengig(warenkorb);
nimm('Der Bruttobetrag hängt nicht am Rundungsweg', 'Brutto aus Netto, unabhängig gerechnet',
  { ok: brutto.stimmig, meldungen: brutto.stimmig ? [] : [`über Steuer ${brutto.ueberSteuer} €, direkt ${brutto.direkt} € — ${brutto.abweichung} € auseinander`] });

const gegenKorb = vergleicheMitWarenkorb(vorgang.rechnung.text, warenkorb);
nimm('Der Belegtext stimmt mit dem Warenkorb überein', 'Text gegen Objekt, Zeichen gegen Zahl',
  { ok: gegenKorb.deckungsgleich, meldungen: gegenKorb.abweichungen });

for (const b of vorgang.bestellungen) {
  const teil = warenkorb.teillieferungen.find((t) => t.lieferantId === b.lieferantId);
  const lieferant = lieferantenDatei.lieferanten.find((l) => l.id === b.lieferantId);
  // Die Bestellung selbst, nicht ihr gelesenes Ergebnis: `pruefeFrachtdeckung`
  // liest den Text intern noch einmal. Der erste Aufruf reichte das bereits
  // Gelesene weiter, und die Kontrolle fand darin keinen `.text` mehr —
  // Meldung: „Im Bestelltext steht kein Warenwert." Eine wahre Aussage über
  // ein Objekt, das nie ein Bestelltext war.
  const fracht = pruefeFrachtdeckung(b, teil, lieferant);
  nimm(`Fracht gedeckt: ${b.lieferantName}`, 'Was der Lieferant verlangt, ist verrechnet',
    { ok: fracht.gedeckt, meldungen: fracht.gedeckt ? [] : [fracht.grund] });
}

const freigabe = darfVorgangLaufen(vorgang);

console.log(`Kontrolle — die zweite Rechnung über Vorgang ${vorgang.vorgangsnummer}`);
console.log(`Katalog: ${katalogName}`);
console.log(`Warenkorb: ${warenkorb.warenwertNetto.toFixed(2)} € netto (Zielgröße ${ZIELKORB} €), `
  + `${vorgang.bestellungen.length} Lieferantenbestellung(en)\n`);

for (const s of schritte) {
  console.log(`  ${s.ok ? '✓' : '✗'} ${s.name}`);
  console.log(`      ${s.was}`);
  for (const a of s.abweichungen) console.log(`      → ${a}`);
}

const rot = schritte.filter((s) => !s.ok);
console.log(`\n${schritte.length - rot.length} von ${schritte.length} Kontrollen ohne Abweichung.`);

if (freigabe.erlaubt) {
  console.log('Der Vorgang dürfte laufen.');
} else {
  console.log('Laufen dürfte er nicht — offene Punkte, keine Rechenfehler:');
  for (const g of freigabe.gruende) console.log(`    · ${g}`);
}

console.log('');
if (rot.length === 0) {
  console.log('Die zweite Rechnung bestätigt die erste. Sie kennt weder warenkorb.js noch');
  console.log('preis.js — sie liest den Text, den der Kunde sieht, und rechnet nach.');
  console.log('Was sie nicht kann: Steht überall derselbe falsche Preis, geht sie auf.');
} else {
  console.log(`${rot.length} Kontrolle(n) mit Abweichung. Eine zweite Rechnung, die nicht`);
  console.log('aufgeht, ist ein Befund und keine Meinung — hier ist von Hand nachzusehen.');
  process.exitCode = 1;
}
