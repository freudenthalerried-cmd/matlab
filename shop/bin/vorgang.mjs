#!/usr/bin/env node
/**
 * Aus einer eingegangenen Anfrage das Angebot machen.
 *
 *   npm run vorgang -- anfrage.txt --kunde ../kunden/mueller.json
 *   npm run vorgang -- anfrage.txt --kunde … --stufe bestaetigung
 *
 * **Der Anlass, 3. September 2026.** Seit heute früh liest `npm run
 * anfrage-lesen` die Anfrage zurück, statt sie abtippen zu lassen — drei
 * Minuten je Anfrage und die eine Stelle, an der ein Tippfehler falsche Ware
 * auf eine Baustelle bringt.
 *
 * Danach hörte der Weg auf. Der nächste Schritt des Anfragebetriebs heißt
 * „Angebot schreiben und senden" und kostet fünf Minuten; die Funktion dafür
 * gibt es seit dem 31. August (`erzeugeAngebot` in `beleg.js`), sie ist
 * geprüft, hat Bindefrist, Zahlungsbedingung, Pflichtangaben nach § 11 UStG
 * und einen eigenen Prüfer. **Aufgerufen hat sie außerhalb von Tests genau
 * eine Stelle: ihr eigener Prüfer, mit einem erfundenen Warenkorb.**
 *
 * > **Ein Beleg, den nur sein Prüfer erzeugt, ist ein Muster und kein
 * > Betriebsmittel.** Wer heute ein Angebot schreiben müsste, schriebe es von
 * > Hand — und dann gilt keine der Regeln, die dieser Bestand darüber kennt:
 * > keine Bindefrist, kein Zahlungsziel null, keine Anschrift des Ausstellers,
 * > keine Prüfung, ob eine Einkaufszahl durchgerutscht ist.
 *
 * Der Leser hatte also einen Ausgang und keinen Empfänger. Dieses Werkzeug ist
 * der Empfänger.
 *
 * ## Was es prüft, bevor es etwas ausgibt
 *
 * 1. **Die Anfrage wird nachgerechnet** (`leseAnfrage`). Weicht eine Summe ab,
 *    gibt es keinen Beleg, sondern den Grund.
 * 2. **Beide Rechnungen müssen dasselbe sagen.** Die Kasse rechnet mit
 *    `kundenWarenkorb` (ohne Einkaufspreise), der Beleg mit
 *    `berechneWarenkorb` (mit). Ein Testfall hält die beiden aneinander; hier
 *    steht dieselbe Prüfung am lebenden Fall, denn hier wird aus der Zahl des
 *    Kunden eine Zahl mit Bindefrist.
 * 3. **Der fertige Text geht durch `pruefeBelege`** — denselben Prüfer, der
 *    im Gesamtlauf über die Musterbelege läuft. Ein Befund heißt: nichts
 *    ausgeben.
 *
 * ## Die Kundendaten stehen in einer Datei, und die gehört nicht hierher
 *
 * `--kunde` erwartet einen Pfad. Firmenname, Anschrift und UID eines Kunden
 * sind seine Daten und nicht unsere Beispiele; sie gehören **außerhalb des
 * Repositories** (dieses ist bis heute öffentlich). Das Werkzeug legt selbst
 * nichts ab und schreibt keine Datei.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { leseAnfrage } from '../src/anfragelesen.js';
import { kundenWarenkorb, oeffentlicherArtikel, oeffentlicherLieferant } from '../src/shopkern.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';
import { berechneWarenkorb } from '../src/warenkorb.js';
import { baueVorgang, darfVorgangLaufen } from '../src/vorgang.js';
import { pruefeBelege } from '../src/belegpruefung.js';
import { EUR } from '../src/format.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);
const lies = (...t) => JSON.parse(readFileSync(join(...t), 'utf8'));

// --- Aufruf lesen -----------------------------------------------------------
const argumente = process.argv.slice(2);
const wahl = (name, ersatz = null) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 && argumente[i + 1] ? argumente[i + 1] : ersatz;
};
const frei = argumente.filter((a, i) => !a.startsWith('--') && !argumente[i - 1]?.startsWith('--'));

const anfrageDatei = frei[0] ?? null;
const kundeDatei = wahl('kunde');
const stufe = wahl('stufe', 'angebot');
const heute = new Date().toISOString().slice(0, 10);
const datum = wahl('datum', heute);
// Die Vorgangsnummer klammert Angebot, Bestätigung, Bestellungen und Rechnung.
// Sie wird **nicht** hier erzeugt: Ein Werkzeug, das selbst Nummern zieht,
// vergibt bei jedem Lauf eine neue und macht aus einem zweiten Ausdruck einen
// zweiten Vorgang. Ohne Angabe endet der Lauf und sagt das.
const nummer = wahl('nummer');

const abbruch = (text, rat = null) => {
  console.error(`\nAbbruch: ${text}`);
  if (rat) console.error(rat);
  process.exit(1);
};

if (!kundeDatei) {
  abbruch('Ohne --kunde gibt es keinen Empfänger.',
    'Erwartet wird der Pfad zu einer JSON-Datei mit firma, strasse, plz, ort, uid.\n'
    + 'Sie gehört außerhalb dieses Verzeichnisses — Kundendaten sind die des Kunden.');
}
if (!nummer) {
  abbruch('Ohne --nummer gibt es keine Vorgangsnummer.',
    'Sie klammert Angebot, Bestätigung und Rechnung. Zweimal dieselbe Nummer ist\n'
    + 'derselbe Vorgang; eine selbst gezogene wäre bei jedem Ausdruck eine neue.');
}
if (!['angebot', 'bestaetigung'].includes(stufe)) {
  abbruch(`Unbekannte Stufe „${stufe}".`,
    'Möglich sind „angebot" und „bestaetigung". Die Rechnung entsteht hier nicht:\n'
    + 'Sie braucht Lieferdatum und Zahlungseingang, und beides ist kein Kommandozeilenwert,\n'
    + 'sondern ein Vorgang, den niemand aus einer Anfrage ableiten kann.');
}
if (!existsSync(kundeDatei)) abbruch(`Die Kundendatei fehlt: ${kundeDatei}`);

const text = anfrageDatei ? readFileSync(anfrageDatei, 'utf8') : readFileSync(0, 'utf8');
if (!text.trim()) {
  abbruch('Kein Anfragetext.', 'Entweder eine Datei angeben oder den Mailtext hereinleiten.');
}

// --- Bestand laden ----------------------------------------------------------
const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');
if (!existsSync(preisPfad)) {
  abbruch('Die Preisdatei fehlt: preise/baustoff-preise.json.',
    'Ohne sie hat kein Artikel einen Einkaufspreis — und ohne den prüft Gate 20 nichts.');
}
const betreiberDatei = lies(SHOP, 'data', 'betreiber.json');
const lieferantenDatei = lies(SHOP, 'data', 'lieferanten.json');
const katalog = ladeBaustoffkatalog(
  lies(SHOP, 'data', 'katalog-baustoff.json'),
  lies(preisPfad),
  lieferantenDatei,
  ZIELMARGE,
);

// --- 1. Die Anfrage zurücklesen und nachrechnen -----------------------------
const kundensicht = {
  artikel: katalog.artikel.map(oeffentlicherArtikel),
  lieferanten: [...katalog.lieferantenById.values()].map(oeffentlicherLieferant),
  mindestbestellwertNetto: betreiberDatei.mindestbestellwertNetto ?? null,
};
const gelesen = leseAnfrage(text, (zeilen) => kundenWarenkorb(zeilen, kundensicht));
if (!gelesen.gelesen) {
  abbruch(`Die Anfrage ließ sich nicht übernehmen — ${gelesen.grund}`,
    'Ein Leser, der bei Abweichung weitermacht, hat die Autorität einer Maschine\n'
    + 'und die Verlässlichkeit einer Vermutung. Zuerst: npm run anfrage-lesen');
}

// --- 2. Beide Rechnungen gegeneinander --------------------------------------
//
// `kundenWarenkorb` rechnet ohne Einkaufspreise, `berechneWarenkorb` mit. Ein
// Testfall hält beide für erfundene Körbe aneinander; hier steht die Prüfung
// am lebenden Fall, weil an dieser Stelle aus der Zahl, die der Kunde gesehen
// hat, eine Zahl mit Bindefrist wird. Ein Angebot, das eine andere Summe nennt
// als die Anfrage, ist die teuerste Art, Vertrauen zu verlieren.
const korb = berechneWarenkorb(gelesen.zeilen, katalog);
const abweichungen = [
  ['Warenwert netto', gelesen.rechnung.warenwertNetto, korb.warenwertNetto],
  ['Fracht netto', gelesen.rechnung.frachtNetto, korb.frachtNetto],
  ['Gesamtbetrag brutto', gelesen.rechnung.bruttoGesamt, korb.summeBrutto],
].filter(([, a, b]) => Math.abs(a - b) > 0.005);
if (abweichungen.length) {
  console.error('\nAbbruch: Kasse und Beleg rechnen verschieden.\n');
  for (const [was, a, b] of abweichungen) {
    console.error(`  ${was.padEnd(22)} Anfrage ${EUR(a).padStart(12)}   Beleg ${EUR(b).padStart(12)}`);
  }
  console.error('\nDie Kasse rechnet ohne Einkaufspreise, der Beleg mit. Sie müssen dasselbe');
  console.error('ergeben; tun sie es nicht, ist der Fehler in einer der beiden Rechnungen');
  console.error('und nicht in diesem Angebot.');
  process.exit(1);
}

// --- 3. Den Vorgang bauen ---------------------------------------------------
const betreiber = {
  firma: betreiberDatei.firma ?? '',
  marke: betreiberDatei.marke ?? '',
  strasse: betreiberDatei.strasse ?? '',
  plz: betreiberDatei.plz ?? '',
  ort: betreiberDatei.ort ?? '',
  uid: betreiberDatei.uid ?? '',
};
const vorgang = baueVorgang({
  vorgangsnummer: nummer,
  kundendaten: lies(kundeDatei),
  warenkorb: korb,
  betreiber,
  datum,
});

const beleg = stufe === 'angebot' ? vorgang.angebot : vorgang.bestaetigung;
const art = stufe === 'angebot' ? 'Angebot' : 'Auftragsbestätigung';

// --- 4. Den fertigen Text durch denselben Prüfer wie im Gesamtlauf ----------
//
// **Mit den Lieferantenbestellungen zusammen**, nicht allein. `pruefeBelege`
// kennt Regeln, die zwischen zwei Papieren liegen — verrechnet der Kunde eine
// Kranentladung, muss sie auch bestellt sein. Ein Durchlauf mit nur einem
// Beleg meldet diese Regeln als „hier nicht prüfbar", und das ist keine
// Prüfung, sondern eine Fußnote. Der Vorgang hat die Bestellungen bereits
// gebaut; sie gehen deshalb mit — hinaus geht davon nichts.
const pflichtangaben = [
  { was: 'Straße des Ausstellers', wert: betreiber.strasse },
  { was: 'Ort des Ausstellers', wert: `${betreiber.plz} ${betreiber.ort}`.trim() },
];
const befund = pruefeBelege([
  { art, text: beleg.text, mussEnthalten: pflichtangaben },
  ...vorgang.bestellungen.map((b) => ({ art: 'Lieferantenbestellung', text: b.text })),
]);

// --- Bericht ----------------------------------------------------------------
console.log(`\n${art} zu Vorgang ${nummer} — ${gelesen.zeilen.length} Position(en), `
  + `${EUR(korb.summeBrutto)} brutto`);
if (gelesen.bezirk) console.log(`Baustelle im Bezirk: ${gelesen.bezirk}`);
console.log('');

const zeichen = (ok) => (ok ? '✓' : '✗');
console.log(`  ${zeichen(vorgang.kundenpruefung.gueltig)} Kundendaten`);
for (const f of vorgang.kundenpruefung.fehler) console.log(`      ${f}`);
for (const w of vorgang.kundenpruefung.warnungen) console.log(`      (Hinweis) ${w}`);
for (const [name, f] of [['Annahme (AGB Punkt 2)', vorgang.freigabe.annahme],
  ['Bestellung beim Lieferanten (Gate 20)', vorgang.freigabe.bestellung]]) {
  console.log(`  ${zeichen(f.erlaubt)} ${name}`);
  for (const g of f.gruende) console.log(`      ${g}`);
}
console.log(`  ${zeichen(befund.sauber)} Belegprüfung`);
// Die Meldungen sind Objekte mit `regel` und `text` — dieselbe Form wie in
// `npm run pruefe-belege`. Als Zeichenkette gedruckt stünde hier
// „[object Object]", also ein Prüfbefund, den niemand lesen kann.
for (const b of befund.befunde) {
  for (const m of b.meldungen) console.log(`      ${m.text} [${m.regel}]`);
}

const ganz = darfVorgangLaufen(vorgang);
if (!ganz.erlaubt) {
  console.log('\nDer Vorgang als Ganzes läuft noch nicht:');
  for (const g of ganz.gruende) console.log(`  · ${g}`);
}

if (!befund.sauber) {
  console.error(`\nAbbruch: Der Prüfer hat den Text (${art}) beanstandet — nichts ausgegeben.`);
  console.error('Ein beanstandeter Beleg, den man trotzdem druckt, ist ein Prüfer ohne Wirkung.');
  process.exit(1);
}
if (stufe === 'bestaetigung' && !vorgang.freigabe.annahme.erlaubt) {
  console.error('\nAbbruch: Die Annahme ist nicht frei — eine Auftragsbestätigung schließt den');
  console.error('Vertrag (AGB Punkt 2). Sie entsteht hier nicht gegen die eigene Sperre.');
  process.exit(1);
}

console.log(`\n${'—'.repeat(72)}\n`);
console.log(beleg.text);
console.log(`\n${'—'.repeat(72)}`);

/**
 * Ein sichtbares `[[ … — FEHLT ]]` ist Absicht und trotzdem kein
 * versandfertiger Beleg.
 *
 * `LUECKE()` setzt die Marke überall dort, wo eine Pflichtangabe fehlt — heute
 * betrifft das die Lieferzeit des Lieferanten, eine der fünf offenen Fragen an
 * ihn. Der Text bleibt lesbar und zeigt die Lücke, statt sie mit einer
 * plausiblen Zahl zu füllen; das ist die Regel dieses Bestands.
 *
 * Was er nicht darf, ist so hinausgehen. Deshalb steht der Satz **unter** dem
 * Beleg, wo ihn liest, wer ihn kopieren will — und nicht nur oben im Bericht,
 * den man beim zweiten Mal überspringt.
 */
const luecken = [...beleg.text.matchAll(/\[\[ (.+?) — FEHLT \]\]/g)].map((t) => t[1]);
if (luecken.length) {
  console.log(`\nSo nicht versandfertig — ${luecken.length} Lücke(n) im Text:`);
  for (const l of new Set(luecken)) console.log(`  · ${l}`);
  console.log('Die Marke steht absichtlich da. Eine gefüllte Lücke wäre eine erfundene Angabe.');
}
console.log('\nNichts abgelegt, nichts versendet. Das Absenden entscheidet der Auftraggeber.');
process.exit(0);
