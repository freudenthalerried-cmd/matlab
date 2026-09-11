#!/usr/bin/env node
/**
 * Aus einer eingegangenen Anfrage das Angebot machen.
 *
 *   npm run vorgang -- anfrage.txt --kunde ../kunden/mueller.json
 *   npm run vorgang -- anfrage.txt --kunde … --stufe bestaetigung
 *   npm run vorgang -- anfrage.txt --kunde … --stufe absage
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

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { leseAnfrage } from '../src/anfragelesen.js';
import { pruefeBestellfelder } from '../src/bestellfelder.js';
import { pruefeBestelldaten } from '../src/kunde.js';
import { kundenWarenkorb, oeffentlicherArtikel, oeffentlicherLieferant } from '../src/shopkern.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';
import { berechneWarenkorb } from '../src/warenkorb.js';
import { baueVorgang, darfVorgangLaufen } from '../src/vorgang.js';
import { absagegruende, erzeugeAbsage } from '../src/absage.js';
import { findeInterna } from '../src/interna.js';
import { pruefeBelege } from '../src/belegpruefung.js';
import { pruefeAblageAufDrittdaten } from '../src/kontrolle.js';
import { EUR } from '../src/format.js';
import {
  ARTEN, haltefest, naechsteNummer, neueAblage, pruefeNummernkreis, stelleRechnungAus,
} from '../src/ablage.js';
import { ausJournal, journalzeile } from '../src/speicher.js';
import { ABLAGEORT, belegname, belegordner, belegpfad, journalpfad } from '../src/ablageort.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';

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
// Der Kalender des Betriebs, nicht die Uhr des Rechners: § 11 Abs 1 Z 4
// UStG verlangt das Ausstellungsdatum, und das ist der Tag am Sitz.
const heute = geschaeftstag();
const datum = wahl('datum', heute);
// Die Vorgangsnummer klammert Angebot, Bestätigung, Bestellungen und Rechnung.
// Sie wird **nicht** hier erzeugt: Ein Werkzeug, das selbst Nummern zieht,
// vergibt bei jedem Lauf eine neue und macht aus einem zweiten Ausdruck einen
// zweiten Vorgang. Ohne Angabe endet der Lauf und sagt das.
const nummer = wahl('nummer');
// **Ablegen ist eine eigene Entscheidung.** Was ins Journal geht, geht nach
// § 132 BAO für sieben Jahre hinein; eine Löschung nach Art. 17 DSGVO läuft
// dort ins Leere (Abs. 3 lit. b). Ein Werkzeug, das bei jedem Probeausdruck
// ablegt, sammelt erfundene Geschäftsfälle in einer Datei, die nichts vergisst.
const ablegen = argumente.includes('--ablegen');
// Die drei Angaben der Rechnungsstufe. Sie kommen aus der Welt und nicht aus
// der Anfrage — deshalb stehen sie hier als Argumente und nirgends als
// Vermutung.
const geliefert = wahl('geliefert');
const bezahlt = wahl('bezahlt');
const zahlweg = wahl('zahlweg', 'vorkasse');

/**
 * **Das Feldregister gegen die Prüfung halten — vor allem anderen.**
 *
 * Dieses Werkzeug macht aus einer Bestellung ein Angebot. Erhebt das Formular
 * weniger, als `pruefeBestelldaten` verlangt, kommt hier eine Bestellung an,
 * aus der kein Beleg werden kann — genau der Zustand vom 4. September, als
 * die Kasse drei Felder sammelte und die Prüfung acht verlangte.
 *
 * Der Prüfer steht **hier** und nicht in einem eigenen Werkzeug: Wer die
 * beiden Listen auseinanderlaufen lässt, merkt es an der Stelle, an der es
 * weh tut.
 */
const registerbefund = pruefeBestellfelder(pruefeBestelldaten);
if (!registerbefund.sauber) {
  console.error('\nAbbruch: Das Bestellfeldregister passt nicht zur Bestelldatenprüfung.');
  for (const m of registerbefund.meldungen) console.error(`  · ${m.text} [${m.regel}]`);
  console.error('Ein Formular, das weniger erhebt, als der Beleg braucht, sammelt Bestellungen,');
  console.error('aus denen kein Angebot werden kann.');
  process.exit(2);
}

const abbruch = (text, rat = null) => {
  console.error(`\nAbbruch: ${text}`);
  if (rat) console.error(rat);
  process.exit(1);
};

/**
 * Legt die **Durchschrift** ab — den Beleg selbst, nicht die Zeile über ihn.
 *
 * **Der Fund vom 11. September, abends.** Bis dahin schrieb `--ablegen` eine
 * Journalzeile und druckte den Beleg auf den Bildschirm. Die Runde davor hatte
 * den vollen Belegtext aus dem Journal genommen — richtig, eine Journalzeile
 * ist keine Urkunde —, und damit landete er **nirgendwo** mehr. Nach dem
 * Schließen des Fensters gab es das Papier nicht mehr, das der Kunde bekommt.
 *
 * > **§ 132 BAO verlangt die Belege sieben Jahre, § 11 Abs 2 UStG vom
 * > Aussteller eine Durchschrift oder Abschrift jeder Rechnung.** Eine
 * > Aufzeichnung über ein Papier, das niemand mehr hat, erfüllt keines von
 * > beiden.
 *
 * Geschrieben wird mit `flag: 'wx'`: Eine bestehende Datei bricht den Lauf ab,
 * statt überschrieben zu werden. Eine Durchschrift, die sich überschreiben
 * lässt, ist keine — § 131 Abs 1 Z 6 BAO verlangt, dass der ursprüngliche
 * Inhalt feststellbar bleibt.
 *
 * **Zuerst die Durchschrift, dann die Journalzeile.** Bricht das Schreiben ab,
 * steht kein Eintrag über ein Papier in der Akte, das es nicht gibt; bricht
 * umgekehrt die Journalzeile, liegt eine Durchschrift ohne Eintrag da — und
 * `npm run pruefe-ablage` meldet beide Richtungen.
 */
const legeDurchschriftAb = (wurzel, jahr, eintrag, text) => {
  const ordner = join(wurzel, belegordner(jahr));
  mkdirSync(ordner, { recursive: true });
  const datei = join(ordner, belegname(eintrag));
  try {
    writeFileSync(datei, text.endsWith('\n') ? text : `${text}\n`, { encoding: 'utf8', flag: 'wx' });
  } catch (fehler) {
    if (fehler.code !== 'EEXIST') throw fehler;
    abbruch(`Die Durchschrift ${belegname(eintrag)} liegt schon in der Ablage.`,
      'Nichts abgelegt. Ein zweiter Beleg unter demselben Namen überschriebe den ersten,\n'
      + 'und § 131 Abs 1 Z 6 BAO verlangt, dass der ursprüngliche Inhalt feststellbar bleibt.');
  }
  return datei;
};

/**
 * **Eine Probe, die den Bestand verändert, ist keine — 11. September 2026.**
 *
 * Gefunden hat das der neue Abgleich zwischen Journal und Durchschriften: In
 * der **echten** Akte stand ein Eintrag. Er stammte aus den Läufen dieses
 * Hauses vom selben Tag — zwei gezogene Rechnungsnummern, ein Eintrag mit
 * `betragNetto: null` und einem Betreff, der eine andere Nummer nennt als der
 * Eintrag. Kein Geschäftsfall; und trotzdem wären `RE-2026-0001` und
 * `RE-2026-0002` verbraucht gewesen, bevor der Betrieb seine erste Rechnung
 * stellt. § 11 Abs 1 Z 5 UStG kennt kein Zurücknehmen einer Nummer.
 *
 * Der Satz dazu steht seit dem 4. September im Quelltext dieses Werkzeugs,
 * über `VORGANG_ABLAGE`: *„Eine Probe, die den Bestand verändert, ist
 * keine."* Er beschrieb, wofür der Schalter da ist — und hielt niemanden auf,
 * der ihn vergaß.
 *
 * **Woran eine Probe zu erkennen ist:** Sie tauscht die Grundlagen aus. Wer
 * `VORGANG_BETREIBER` setzt, rechnet mit einem Betrieb, den es so nicht gibt
 * — heute unvermeidlich, denn dem echten fehlen UID und E-Mail, und ohne UID
 * sperrt § 11 Abs 1 Z 6 UStG die Rechnung. Wer `VORGANG_LIEFERANTEN` setzt,
 * rechnet mit Lieferzeiten, die niemand zugesagt hat.
 *
 * > **Ein Beleg auf ausgetauschter Grundlage gehört nicht in die Akte, die
 * > sieben Jahre steht.** Er gehört in einen Wegwerfordner, und dafür gibt es
 * > `VORGANG_ABLAGE`.
 */
const PROBENSCHALTER = ['VORGANG_BETREIBER', 'VORGANG_LIEFERANTEN'];

if (ablegen && !process.env.VORGANG_ABLAGE) {
  const gesetzt = PROBENSCHALTER.filter((schalter) => process.env[schalter]);
  if (gesetzt.length) {
    abbruch(`--ablegen in die echte Akte, aber ${gesetzt.join(' und ')} ist gesetzt.`,
      'Wer die Grundlagen austauscht, probt — und eine Probe, die den Bestand verändert,\n'
      + 'ist keine. Der Eintrag stünde nach § 132 BAO sieben Jahre in der echten Akte und\n'
      + 'verbrauchte eine Belegnummer, die § 11 UStG nicht zurücknimmt.\n'
      + 'Für Proben: VORGANG_ABLAGE auf einen Wegwerfordner setzen.');
  }
}

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
if (!['angebot', 'bestaetigung', 'absage', 'rechnung'].includes(stufe)) {
  abbruch(`Unbekannte Stufe „${stufe}".`,
    'Möglich sind „angebot", „bestaetigung", „absage" und „rechnung".\n'
    + 'Die Rechnung verlangt zusätzlich --geliefert, --bezahlt und --zahlweg: Beides sind\n'
    + 'Feststellungen des Betreibers, und dieses Haus erfindet sie nicht.');
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
/*
 * **`VORGANG_BETREIBER` wie `VORGANG_LIEFERANTEN` — 11. September 2026.**
 *
 * Die UID-Nummer des Ausstellers ist Pflichtangabe nach § 11 Abs 1 Z 6 UStG
 * und eine der vier Angaben, die der Auftraggeber noch liefern muss. Solange
 * sie fehlt, **darf** keine Rechnung entstehen — und das ist richtig so.
 *
 * > **Eine Sperre, die richtig ist, macht den Weg dahinter trotzdem
 * > ungeprüft.** Ohne diesen Schalter fährt keine Probe je eine Rechnung, und
 * > was nie gefahren wurde, ist nicht gebaut, sondern behauptet.
 *
 * Derselbe Schalter, dieselbe Begründung wie bei den Lieferzeiten.
 */
const betreiberDatei = process.env.VORGANG_BETREIBER
  ? JSON.parse(readFileSync(process.env.VORGANG_BETREIBER, 'utf8'))
  : lies(SHOP, 'data', 'betreiber.json');
// `VORGANG_LIEFERANTEN` wie `WEBSITE_LIEFERANTEN`: Die Lieferzeit ist eine der
// neun offenen Fragen an den Lieferanten, und ohne sie trägt jeder Beleg eine
// Lücke. Eine Probe, die den Weg **bis in die Akte** fahren will, braucht
// deshalb einen Bestand mit beantworteter Lieferzeit — sonst prüft sie nur die
// Absage und nie den Durchgang.
const lieferantenDatei = process.env.VORGANG_LIEFERANTEN
  ? JSON.parse(readFileSync(process.env.VORGANG_LIEFERANTEN, 'utf8'))
  : lies(SHOP, 'data', 'lieferanten.json');
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

/*
 * **Die dritte Stufe: die Absage — 11. September 2026.**
 *
 * Der Betrieb konnte drei Dinge schreiben, und alle drei sagten **ja**:
 * Angebot, Auftragsbestätigung, Rechnung. Für das Nein gab es nichts, obwohl
 * der Bestand genau weiß, wann es eintritt — `darfVorgangLaufen` zählt die
 * Gründe einzeln auf. Nur stehen sie in der Sprache des Betriebs, denn sie
 * sind für diese Konsole geschrieben: „…(Gate 7)", „Lieferzeit unbekannt
 * (<Lieferantenname>)". Gemessen an `findeInterna` tragen **zwei von neun**
 * ein Internum.
 *
 * > **Eine Absage, die es nur in der Sprache des Betriebs gibt, wird in der
 * > Sprache des Betriebs verschickt.**
 *
 * Sie ist eine eigene Stufe und nicht die Nebenwirkung einer Sperre: Ob ein
 * Kunde ein Angebot oder eine Absage bekommt, entscheidet der Betreiber und
 * nicht der Zustand einer Prüfung. Ein Vorgang, der noch nicht bis zur
 * Bestätigung laufen darf, ist ja oft genau der, für den ein **Angebot** das
 * Richtige ist.
 */
/*
 * **Die vierte Stufe: die Rechnung — 11. September 2026.**
 *
 * Sie hätte es seit dem 2. September geben können. `erzeugeRechnung` baut sie,
 * `darfRechnungGestelltWerden` hält sie auf, `stelleRechnungAus` zieht die
 * Nummer, und `baueVorgang` fügt alle drei längst zusammen. Was fehlte, war
 * der Befehl — und die Begründung dafür stand seit dem 10. September in der
 * Betriebskette:
 *
 * > *Was fehlt, ist der Befehl, der beides zusammenführt — und ihm fehlen zwei
 * > Angaben, die kein Kommandozeilenwert sind: das **Lieferdatum** und der
 * > **Zahlungseingang**.*
 *
 * Diese Begründung wirft zwei Dinge zusammen. **Festzustellen**, dass bezahlt
 * wurde, braucht den Kontoauszug — den hat dieses Haus nicht und soll ihn
 * nicht haben. **Die Rechnung zu schreiben**, nachdem der Betreiber es
 * festgestellt hat, braucht nur, dass er es eingibt. Genauso wie die Anschrift
 * des Kunden, die auch niemand aus einer Anfrage ableitet.
 *
 * > **Eine Angabe, die aus der Welt kommt, ist deshalb kein Hindernis für ein
 * > Werkzeug — sie ist sein erstes Argument.**
 *
 * Gesperrt bleibt alles, was gesperrt war: Ohne Lieferdatum und Zahlweg
 * entsteht nichts, `darfRechnungGestelltWerden` prüft die Pflichtangaben nach
 * § 11 UStG, die Platzhalterpreise und den Zahlungsvermerk, und die Nummer
 * fällt erst beim Ablegen — damit kein abgebrochener Lauf eine verbrennt.
 */
if (stufe === 'rechnung') {
  if (!geliefert || !bezahlt) {
    abbruch('Für eine Rechnung fehlt ein Datum.',
      'Verlangt sind --geliefert <JJJJ-MM-TT> und --bezahlt <JJJJ-MM-TT>, dazu --zahlweg.\n'
      + 'Beides sind Feststellungen des Betreibers: Die Lieferung hat er bestätigt bekommen,\n'
      + 'den Zahlungseingang sieht er auf dem Kontoauszug. Dieses Haus sieht weder das eine\n'
      + 'noch das andere — und erfindet deshalb keines von beiden.');
  }

  const mitRechnung = baueVorgang({
    vorgangsnummer: nummer,
    kundendaten: lies(kundeDatei),
    warenkorb: korb,
    betreiber,
    datum,
    lieferdatum: geliefert,
    zahlung: { weg: zahlweg, datum: bezahlt, betrag: korb.summeBrutto },
    auftrag: { geliefert: true },
  });

  /*
   * **Die fehlende Nummer ist kein Mangel, sondern die Reihenfolge.** Sie
   * fällt erst beim Ablegen, damit kein abgebrochener Lauf eine aus dem
   * fortlaufenden Kreis verbrennt (§ 11 Abs 1 Z 3 UStG). Ohne diese
   * Unterscheidung könnte man die Rechnung nie ansehen, bevor man sie ablegt
   * — und ein Beleg, den niemand vorher liest, ist der, auf dem der Fehler
   * steht.
   *
   * **Auch mit `--ablegen` — berichtigt am 11. September, abends.** Hier
   * stand `&& !ablegen`, und damit verlangte der Lauf die Nummer genau dann,
   * wenn er sie gleich selbst ziehen würde: Ablegen war unmöglich. Geprüft
   * wird sie unten ein zweites Mal, nachdem sie gefallen ist — dort gehört
   * sie hin.
   */
  const NUMMERNGRUND = /Fortlaufende Rechnungsnummer/;
  const gruende = mitRechnung.freigabe.rechnung.gruende
    .map((g) => g.replace(/(Pflichtangaben nach § 11 UStG fehlen: )(.*)/, (_, kopf, liste) => {
      const rest = liste.split(', ').filter((x) => !NUMMERNGRUND.test(x));
      return rest.length ? kopf + rest.join(', ') : '';
    }))
    .filter(Boolean);

  if (gruende.length) {
    console.error('\nAbbruch: Diese Rechnung darf nicht gestellt werden.');
    for (const g of gruende) console.error(`  · ${g}`);
    console.error('\nEine erfundene Rechnung ist schlimmer als eine fehlende — sie wird bezahlt.');
    process.exit(1);
  }

  const text = mitRechnung.rechnung.text;
  const leck = findeInterna(text);
  if (leck.length) {
    console.error('\nAbbruch: Die Rechnung trägt ein Internum — nichts ausgegeben.');
    for (const l of leck) console.error(`  · ${l.text ?? JSON.stringify(l)}`);
    process.exit(1);
  }

  const zeige = (belegtext) => {
    console.log(`\n${'—'.repeat(72)}\n`);
    console.log(belegtext);
    console.log(`\n${'—'.repeat(72)}`);
  };

  if (!ablegen) {
    zeige(text);
    console.log('\nDie Rechnungsnummer fällt erst beim Ablegen: Ein abgebrochener Lauf');
    console.log('verbrennt keine Nummer aus dem fortlaufenden Kreis (§ 11 Abs 1 Z 3 UStG).');
    console.log('Mit `--ablegen` wird sie gezogen und der Beleg ins Journal geschrieben.');
    process.exit(0);
  }

  /*
   * **Der Satz von oben, eingelöst — 11. September 2026, abends.**
   *
   * Bis heute endete diese Stufe hier, und der Satz „Mit `--ablegen` wird sie
   * gezogen und der Beleg ins Journal geschrieben" war eine **Zusage über den
   * eigenen Betrieb, die nicht stimmte**. Sie ist die teuerste Sorte: Wer sie
   * liest, legt ab und sieht nicht nach.
   *
   * Die Reihenfolge ist die eines Menschen: erst die Nummer ziehen, dann den
   * Beleg damit bauen, dann prüfen, dann ablegen. Vorher war sie unmöglich —
   * eine Rechnung ohne Nummer ist nach § 11 Abs 1 Z 3 UStG nicht vollständig,
   * und ohne Vollständigkeit wies `stelleRechnungAus` sie ab.
   */
  const jahrDerRechnung = Number(datum.slice(0, 4));
  const wurzelDerAkte = process.env.VORGANG_ABLAGE ?? join(REPO, ABLAGEORT);
  const journaldatei = join(wurzelDerAkte, `journal-${jahrDerRechnung}.jsonl`);
  mkdirSync(wurzelDerAkte, { recursive: true });
  const bestandDerAkte = existsSync(journaldatei) ? readFileSync(journaldatei, 'utf8') : '';
  const akte = ausJournal(bestandDerAkte, {
    schreibe: (e) => appendFileSync(journaldatei, `${journalzeile(e)}\n`, 'utf8'),
  });

  const rechnungsnummer = naechsteNummer(akte, 'rechnung', jahrDerRechnung);
  const ausgestellt = baueVorgang({
    vorgangsnummer: nummer,
    kundendaten: lies(kundeDatei),
    warenkorb: korb,
    betreiber,
    datum,
    lieferdatum: geliefert,
    zahlung: { weg: zahlweg, datum: bezahlt, betrag: korb.summeBrutto },
    auftrag: { geliefert: true },
    rechnungsnummer,
  });
  const nachtraeglich = ausgestellt.freigabe.rechnung;
  if (!nachtraeglich.erlaubt) {
    console.error('\nAbbruch: Mit der gezogenen Nummer trägt die Rechnung noch immer nicht.');
    for (const g of nachtraeglich.gruende) console.error(`  · ${g}`);
    process.exit(1);
  }

  // Erst das Papier, dann die Zeile darüber.
  const durchschrift = legeDurchschriftAb(
    wurzelDerAkte, jahrDerRechnung,
    { art: 'rechnung', nummer: rechnungsnummer, vorgang: nummer },
    ausgestellt.rechnung.text,
  );

  const eintrag = stelleRechnungAus(akte, ausgestellt.rechnung, {
    zeitpunkt: datum,
    jahr: jahrDerRechnung,
    vorgang: nummer,
    // **Die gezogene Nummer, nicht eine zweite.** Der erste Wurf verließ sich
    // darauf, dass der Beleg seine Nummer mitführt; er tut es nicht, und die
    // Ablage zog daraufhin eine **zweite** — gedruckt stand RE-2026-0001, im
    // Journal RE-2026-0002. Genau der Fehler, gegen den der Absatz darüber
    // geschrieben ist.
    nummer: rechnungsnummer,
    // Nur der Betreff. Was ins Journal geht, steht sieben Jahre (§ 132 BAO),
    // und die Anschrift des Kunden steht schon im Beleg.
    betreff: `Rechnung ${rechnungsnummer} zu Vorgang ${nummer}, `
      + `${korb.teillieferungen.reduce((n, t) => n + t.positionen.length, 0)} Position(en)`,
  });
  if (!eintrag.ausgestellt) {
    console.error(`\nAbbruch: ${eintrag.grund}`);
    process.exit(1);
  }

  /*
   * **Gezeigt wird der Beleg, der abgelegt wurde.** Der erste Wurf druckte
   * die Fassung **ohne** Nummer und legte die mit ab — zwei Papiere für einen
   * Geschäftsfall, und das gedruckte trug an der Stelle der Nummer eine
   * Lückenmarke. Dieselbe Familie wie der Befund vom 4. September über die
   * Angebotsnummer: *Ein Beleg, der unter einer anderen Nummer abgelegt ist
   * als der, die auf ihm steht, ist schlechter als ein nicht abgelegter.*
   */
  zeige(ausgestellt.rechnung.text);
  console.log(`\nAbgelegt: Rechnungsnummer ${eintrag.nummer}, laufende Nummer `
    + `${eintrag.eintrag.lfd} im Journal ${jahrDerRechnung}.`);
  console.log(`Durchschrift: ${process.env.VORGANG_ABLAGE ? durchschrift
    : belegpfad(jahrDerRechnung, { art: 'rechnung', nummer: eintrag.nummer })}`);
  console.log('Im Journal steht der Betreff, nicht der Belegtext — die Anschrift des Kunden');
  console.log('steht auf der Durchschrift und gehört nicht ein zweites Mal in die Akte.');
  process.exit(0);
}

if (stufe === 'absage') {
  const ganzeLage = darfVorgangLaufen(vorgang);
  const gruende = [...ganzeLage.gruende, ...vorgang.kundenpruefung.fehler];
  if (!gruende.length) {
    console.error('\nAbbruch: Es gibt keinen Grund für eine Absage — der Vorgang läuft.');
    console.error('Eine Absage ohne Grund ist keine Absage, sondern eine Unhöflichkeit.');
    process.exit(1);
  }
  const uebersetzt = absagegruende(gruende);
  if (!uebersetzt.vollstaendig) {
    console.error('\nAbbruch: Für diese Gründe gibt es keinen Satz an den Kunden:');
    for (const g of uebersetzt.ohneSatz) console.error(`  · ${g}`);
    console.error('Eine Absage, die einen Grund weglässt, sagt nicht, warum sie absagt.');
    process.exit(1);
  }
  const absage = erzeugeAbsage({
    nummer, datum, kunde: vorgang.kundendaten ?? lies(kundeDatei), betreiber, gruende,
  });
  // Derselbe Prüfer, der über jede gebaute Seite läuft — nur dass ihn eine
  // Mail bisher nie gesehen hat.
  const leck = findeInterna(absage.text);
  if (leck.length) {
    console.error('\nAbbruch: Die Absage trägt ein Internum — nichts ausgegeben.');
    for (const l of leck) console.error(`  · ${l.text ?? JSON.stringify(l)}`);
    process.exit(1);
  }
  console.log(`\n${'—'.repeat(72)}\n`);
  console.log(absage.text);
  console.log(`\n${'—'.repeat(72)}`);
  console.log('\nDie Absage nennt keinen Betrag und keine Position: Was abgesagt wird,');
  console.log('steht in der Anfrage des Kunden.');
  process.exit(0);
}

const beleg = stufe === 'angebot' ? vorgang.angebot : vorgang.bestaetigung;
const art = stufe === 'angebot' ? 'Angebot' : 'Auftragsbestätigung';

/*
 * **Derselbe Prüfer wie über jede gebaute Seite — seit dem 11. September auch
 * hier.** Die Absage bekam ihn am 10. September, mit dem Satz, geprüft würde
 * sie sonst von niemandem, „denn die Interna-Prüfung läuft über gebaute
 * Seiten und Anzeigentexte, nicht über eine Mail von Hand". Genau das galt
 * für Angebot, Auftragsbestätigung und Rechnung auch — nur wurden die schon
 * gedruckt. Gemessen am 11. September: **drei Nennungen des Lieferantennamens
 * in einem Angebot von 1.544 Zeichen.**
 *
 * > **Eine Regel, die für Seiten gilt und für Briefe nicht, ist keine Regel
 * > über den Bezugsweg, sondern eine über HTML.**
 */
{
  const leck = findeInterna(beleg.text);
  if (leck.length) {
    console.error(`\nAbbruch: ${art} trägt ein Internum — nichts ausgegeben.`);
    for (const l of leck) console.error(`  · ${l.fund ?? l.text ?? JSON.stringify(l)} [${l.id}]`);
    console.error('\nDer Bezugsweg steht dem Kunden nicht zu und dem Wettbewerber schon gar nicht.');
    process.exit(1);
  }
}

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
  console.log('Mit `--stufe absage` entsteht daraus der Brief an den Kunden.');
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
/**
 * Ablegen — der Schritt, den es seit dem 31. August gibt und den bis heute
 * niemand gegangen ist.
 *
 * `src/ablage.js` führt Nummernkreis und Journal nach § 11 UStG und § 131 BAO,
 * `src/speicher.js` gibt ihnen ein Gedächtnis aus Zeilen, die nur wachsen.
 * Beide sind gebaut, geprüft und vollständig — und sieben ihrer Ausfuhren rief
 * außerhalb der Tests niemand. Was gefehlt hat, war nicht Code, sondern ein
 * **Ort**: Ein Journal trägt Namen, Anschriften und Beträge, und dieses
 * Verzeichnis ist öffentlich. Seit heute gibt es `ablage/`, gesperrt in
 * `.gitignore` und bewacht von `npm run pruefe-ablage`.
 *
 * Zwei Schranken davor, und beide sind unnachgiebig:
 *
 * **Ein Beleg mit einer sichtbaren Lücke wird nicht abgelegt.** `[[ … FEHLT ]]`
 * heißt: Eine Pflichtangabe ist offen. Sieben Jahre lang stünde dann ein
 * unvollständiges Papier in der Akte, und die Lücke wäre nicht mehr die
 * Erinnerung an eine offene Frage, sondern ein Mangel im Beleg.
 *
 * **Ein Belegbefund verhindert die Ablage ebenso.** Die Prüfung oben hat den
 * Lauf schon beendet, wenn sie etwas fand — hier steht sie noch einmal, weil
 * eine Schranke, die von der Reihenfolge zweier Blöcke abhängt, keine ist.
 */
if (!ablegen) {
  console.log('\nNichts abgelegt, nichts versendet. `--ablegen` schreibt ins Journal;');
  console.log('das Absenden entscheidet der Auftraggeber.');
  process.exit(0);
}

if (luecken.length) {
  abbruch(`Nicht abgelegt: ${luecken.length} Lücke(n) im Beleg.`,
    'Was ins Journal geht, geht nach § 132 BAO für sieben Jahre hinein.\n'
    + 'Ein Beleg mit offener Pflichtangabe gehört nicht dazu.');
}
if (!befund.sauber) {
  abbruch('Nicht abgelegt: die Belegprüfung hat etwas gefunden.');
}

const jahr = Number(datum.slice(0, 4));
// `VORGANG_ABLAGE` lenkt den Ort um — für Proben, die den ganzen Weg fahren
// wollen, ohne in die echte Akte zu schreiben. Dieselbe Bauweise wie
// `WEBSITE_AUSGABE`: Eine Probe, die den Bestand verändert, ist keine.
const wurzel = process.env.VORGANG_ABLAGE ?? join(REPO, ABLAGEORT);
const journal = join(wurzel, `journal-${jahr}.jsonl`);
mkdirSync(wurzel, { recursive: true });

// **Erst zurücklesen, dann schreiben.** Ohne den Bestand begänne der Zähler
// bei eins, und zwei Angebote trügen dieselbe Nummer. `ausJournal` ist dabei
// streng: Eine Zeile, die nicht sauber zurückliest, bricht den Lauf ab, statt
// den Zähler zu raten.
const bestand = existsSync(journal) ? readFileSync(journal, 'utf8') : '';
const ablage = ausJournal(bestand, {
  schreibe: (e) => appendFileSync(journal, `${journalzeile(e)}\n`, 'utf8'),
});

const abgelegteArt = stufe === 'angebot' ? 'angebot' : 'auftragsbestaetigung';

/**
 * **Die Nummer kommt vom Beleg, nicht aus dem Zähler.**
 *
 * Der erste Wurf rief hier `naechsteNummer(ablage, 'angebot', jahr)` und
 * bekam `AN-2026-0001`. Auf dem Papier stand `AN-2026-0102` — `vorgang.js`
 * bildet die Angebotsnummer seit dem 31. August als `AN-${vorgangsnummer}`.
 *
 * > **Ein Beleg, der unter einer anderen Nummer abgelegt ist als der, die auf
 * > ihm steht, ist schlechter als ein nicht abgelegter.** Wer die Akte nach
 * > dem Papier durchsucht, findet nichts und schließt daraus das Falsche.
 *
 * Zwei Zahlenreihen für dasselbe Papier — dieselbe Familie wie die
 * Listenpreisspalte vom Vormittag. Aufgelöst wird sie zugunsten des Papiers:
 * Das Journal hält fest, was hinausgegangen ist.
 *
 * Was dabei offen bleibt und offen benannt gehört: Diese Nummer ist **von
 * Hand** vergeben (`--nummer`). Fortlaufend und einmalig verlangt § 11 Abs 1
 * Z 5 UStG für die **Rechnung**, und die entsteht hier nicht. Für das Angebot
 * meldet `pruefeNummernkreis` unten, was der Bestand hergibt — Lücken sind
 * dann eine Auskunft, keine Zusicherung.
 */
const belegnummer = ARTEN[abgelegteArt].nummernkreis ? beleg.nummer : null;

// Erst das Papier, dann die Zeile darüber — siehe `legeDurchschriftAb`.
const durchschrift = legeDurchschriftAb(
  wurzel, jahr, { art: abgelegteArt, nummer: belegnummer, vorgang: nummer }, beleg.text,
);

const eintrag = haltefest(ablage, {
  art: abgelegteArt,
  nummer: belegnummer,
  zeitpunkt: datum,
  vorgang: nummer,
  betragNetto: korb.summeNetto,
  betragBrutto: korb.summeBrutto,
  // **Nur der Betreff, nie der Belegtext.** Das Felderverzeichnis sagt es
  // ausdrücklich: Was hier steht, steht sieben Jahre. Der volle Text enthält
  // die Anschrift des Kunden ein zweites Mal und gehört in den Beleg, nicht
  // ins Journal.
  text: `${art} zu Vorgang ${nummer}, ${gelesen.zeilen.length} Position(en)`,
});

const kreis = ARTEN[abgelegteArt].nummernkreis
  ? pruefeNummernkreis(ablage, abgelegteArt, jahr)
  : null;

console.log(`\nAbgelegt: ${abgelegteArt}${belegnummer ? ` ${belegnummer}` : ''}`
  + ` als lfd. ${eintrag.lfd} in ${process.env.VORGANG_ABLAGE ? journal : journalpfad(jahr)}`);
console.log(`Durchschrift: ${process.env.VORGANG_ABLAGE ? durchschrift
  : belegpfad(jahr, { art: abgelegteArt, nummer: belegnummer, vorgang: nummer })}`);
if (!belegnummer) {
  console.log('Ohne Belegnummer — eine fortlaufende Nummer verlangt § 11 UStG für die');
  console.log('Rechnung. Rückführbar bleibt der Eintrag über die Vorgangsnummer.');
}
if (kreis && !kreis.lueckenlos) {
  console.log(`Achtung, Lücke im Nummernkreis: ${kreis.fehlend.join(', ')}`);
}
/*
 * **Angeschlossen am 9. September 2026.** `pruefeAblageAufDrittdaten` gibt es
 * seit dem Bau der Ablage, und sie sagt über sich selbst, sie mache „aus dem
 * Zufall eine Zusicherung": Heute steht die Rufnummer der fremden Baustelle
 * nicht im Journal, weil `ablageEintraege` nur den Betreff ablegt — nicht,
 * weil jemand es prüft. **Gerufen hat sie niemand**, also war sie eine
 * Erklärung und keine Zusicherung. Gefunden hat das der Prüfer der
 * ungerufenen Ausfuhren, nachdem er gelernt hatte, Erwähnungen von Aufrufen
 * zu unterscheiden.
 *
 * Die Prüfung läuft **nach** dem Schreiben, und das ist kein Widerspruch:
 * § 131 BAO verlangt, dass der ursprüngliche Inhalt feststellbar bleibt —
 * herausnehmen ließe sich der Eintrag ohnehin nicht mehr. Sie sagt, was
 * drinsteht, damit es beim nächsten Mal nicht wieder hineingerät.
 */
const drittdaten = pruefeAblageAufDrittdaten(ablage, vorgang.auftrag ?? {});
if (!drittdaten.dicht) {
  console.log('\nAchtung, Daten Dritter in der Ablage:');
  for (const f of drittdaten.funde) console.log(`  ${f}`);
  console.log('Sie stehen dort sieben Jahre und sind nach Art. 17 DSGVO nicht zu löschen.');
}

console.log('Das Journal liegt außerhalb der Versionierung. Nichts versendet —');
console.log('das Absenden entscheidet der Auftraggeber.');
process.exit(0);
