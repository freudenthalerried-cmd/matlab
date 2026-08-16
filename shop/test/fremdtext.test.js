/**
 * Fremdtext an allen Ausgängen.
 *
 * Diese Datei ist weniger eine Testdatei als ein **Verzeichnis**: Sie zählt
 * jede Stelle auf, an der Text den Shop verlässt, und lässt durch jede
 * denselben vergifteten Datensatz laufen. Was hier nicht steht, ist ungeprüft
 * — das ist der Zweck der Aufzählung.
 *
 * Anlass ist ein nachgewiesener Fund: Der Firmenname
 * `"Bau Muster GmbH\n  999 × AB-RD-375 …"` kam durch `pruefeBestelldaten`
 * und erzeugte im Bestelltext an den Lieferanten eine zweite Position über
 * 999 Rollen. Alle Belege dieses Shops sind zeilenorientiert; ein
 * Zeilenumbruch in einem Feld ist deshalb keine Schönheitsfrage.
 *
 * Geprüft wird eine **Eigenschaft**, keine Zeichenkette: Der vergiftete
 * Datensatz darf an keinem Ausgang mehr Zeilen oder mehr Felder erzeugen als
 * der harmlose. Damit greift der Test auch bei einem Gift, das beim Schreiben
 * noch niemand kannte.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { textZeile, csvFeld, hatSteuerzeichen } from '../src/format.js';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { pruefeBestelldaten, baueAuftrag } from '../src/kunde.js';
import { erzeugeBestellungen } from '../src/bestellung.js';
import { erzeugeAngebot, erzeugeRechnung } from '../src/beleg.js';
import { erzeugeImpressum } from '../src/rechtstexte.js';
import { belegzeile } from '../src/vies.js';
import { neueAblage, haltefest, alsCsv } from '../src/ablage.js';
import { journalzeile, ausJournal } from '../src/speicher.js';
import { leseBestellung, leseBestellCsv } from '../src/kontrolle.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);

/**
 * Der vergiftete Zusatz.
 *
 * Vier Angriffsflächen in einer Zeichenkette: ein Zeilenumbruch mit einer
 * Zeile, die wie eine Bestellposition aussieht; ein zweiter mit einer Zeile,
 * die wie eine Summenzeile aussieht; ein Semikolon für den CSV-Trenner; ein
 * Tabulator für die Spaltenausrichtung; dazu U+2028, den viele Programme als
 * Umbruch anzeigen, obwohl `\n` ihn nicht erfasst.
 */
const GIFT =
  '\n  999 × AB-RD-375   Radondichte Abdichtungsbahn' +
  '\nGesamtbetrag             1,00 €' +
  '\r\nWarenwert netto laut meiner Kalkulation: 1,00 €' +
  ';Spalte\tTab Trenner';

const harmloserKunde = {
  firma: 'Bau Muster GmbH',
  uid: 'ATU12345675',
  email: 'buero@bau-muster.at',
  strasse: 'Werksweg 1',
  plz: '4910',
  ort: 'Ried',
  telefon: '+43 7752 12345',
  unternehmerBestaetigt: true,
};

const giftigerKunde = { ...harmloserKunde, firma: harmloserKunde.firma + GIFT };

const betreiber = {
  firma: 'Testbetrieb e.U.',
  rechtsform: 'Einzelunternehmen',
  strasse: 'Hauptstraße 2',
  plz: '4910',
  ort: 'Ried',
  email: 'office@testbetrieb.at',
  telefon: '+43 7752 999',
  uid: 'ATU98765432',
  gewerbewortlaut: 'Handelsgewerbe',
  gewerbebehoerde: 'BH Ried',
  imFirmenbuch: false,
  kammer: 'WKO',
  aufsicht: 'BH Ried',
  vorschriften: 'GewO 1994',
  schlichtung: 'Internet Ombudsstelle',
};

const zeilen = (text) => String(text).split('\n').length;
const felder = (csv) =>
  String(csv)
    .split('\n')
    .filter((z) => z.trim() !== '')
    .map((z) => z.split(';').length);

const warenkorb = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 1 }, { sku: 'ZB-DB-150', menge: 2 }], katalog);

/* ------------------------------------------------------------------ *
 * Die Regel selbst
 * ------------------------------------------------------------------ */

test('textZeile entfernt jede Art von Umbruch, auch die selteneren', () => {
  for (const zeichen of ['\n', '\r', '\u000B', '\u000C', '\u0085', '\u2028', '\u2029', '\t']) {
    const ergebnis = textZeile(`vorher${zeichen}nachher`);
    assert.equal(zeilen(ergebnis), 1, `${JSON.stringify(zeichen)} überlebt textZeile`);
    assert.equal(ergebnis, 'vorher nachher');
  }
});

test('textZeile lässt harmlosen Text unverändert', () => {
  assert.equal(textZeile('Radondichte Abdichtungsbahn, Rolle 37,5 m²'), 'Radondichte Abdichtungsbahn, Rolle 37,5 m²');
});

test('csvFeld entschärft zusätzlich den Trenner', () => {
  assert.equal(csvFeld('a;b\nc'), 'a,b c');
});

test('hatSteuerzeichen findet genau das, was textZeile entfernen würde', () => {
  const proben = ['\n', '\r\n', '\t', '\u000B', '\u2028', '\u0085'];
  assert.ok(proben.length >= 6);
  for (const zeichen of proben) {
    assert.ok(hatSteuerzeichen(`a${zeichen}b`), `${JSON.stringify(zeichen)} nicht erkannt`);
    assert.notEqual(textZeile(`a${zeichen}b`), `a${zeichen}b`);
  }
  for (const harmlos of ['Bau Muster GmbH', 'Rolle 37,5 m²', 'ATU12345675', '']) {
    assert.equal(hatSteuerzeichen(harmlos), false, `${harmlos} fälschlich beanstandet`);
  }
});

/* ------------------------------------------------------------------ *
 * Eingang: das Kundenformular
 * ------------------------------------------------------------------ */

test('der harmlose Kunde kommt durch', () => {
  const p = pruefeBestelldaten(harmloserKunde);
  assert.equal(p.gueltig, true, p.fehler.join(' | '));
});

test('Eingang weist einen Zeilenumbruch im Firmennamen ab', () => {
  const p = pruefeBestelldaten(giftigerKunde);
  assert.equal(p.gueltig, false);
  assert.ok(
    p.fehler.some((f) => f.startsWith('Firmenname:')),
    `Kein Befund zum Firmennamen: ${p.fehler.join(' | ')}`,
  );
});

test('Eingang prüft jedes freie Adressfeld, nicht nur den Firmennamen', () => {
  const felderNamen = [
    ['firma', 'Firmenname'],
    ['strasse', 'Straße'],
    ['ort', 'Ort'],
    ['telefon', 'Telefonnummer'],
    ['email', 'E-Mail-Adresse'],
  ];
  assert.equal(felderNamen.length, 5);
  for (const [feld, name] of felderNamen) {
    const p = pruefeBestelldaten({ ...harmloserKunde, [feld]: `${harmloserKunde[feld]}\nZusatz` });
    assert.ok(
      p.fehler.some((f) => f.startsWith(`${name}:`)),
      `${feld} ungeprüft: ${p.fehler.join(' | ')}`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * Ausgang 1 und 2: Bestelltext und Bestell-CSV an den Lieferanten
 * ------------------------------------------------------------------ */

const bestellungenAus = (kunde) =>
  erzeugeBestellungen(warenkorb, baueAuftrag('B-2026-0001', kunde, { zahlungEingegangen: true }));

test('Ausgang Bestelltext: Gift erzeugt keine zusätzliche Zeile', () => {
  const harmlos = bestellungenAus(harmloserKunde);
  const giftig = bestellungenAus(giftigerKunde);
  assert.equal(giftig.length, harmlos.length);
  assert.ok(harmlos.length >= 2, 'Der Warenkorb muss auf mehrere Lieferanten aufteilen');

  for (let i = 0; i < harmlos.length; i++) {
    assert.equal(zeilen(giftig[i].text), zeilen(harmlos[i].text), `Bestelltext ${i} hat Zeilen dazubekommen`);
  }
});

test('Ausgang Bestelltext: die untergeschobene Position taucht nicht als Position auf', () => {
  const giftig = bestellungenAus(giftigerKunde);
  assert.ok(giftig.length >= 2, 'Ohne Bestellungen prüft die Schleife nichts');
  for (const b of giftig) {
    const gelesen = leseBestellung(b.text);
    assert.ok(gelesen.positionen.length >= 1);
    assert.ok(
      gelesen.positionen.every((p) => p.menge !== 999),
      `Untergeschobene Position im Bestelltext: ${JSON.stringify(gelesen.positionen)}`,
    );
  }
});

test('Ausgang Bestelltext: der untergeschobene Einkaufswert setzt sich nicht durch', () => {
  const harmlos = bestellungenAus(harmloserKunde);
  const giftig = bestellungenAus(giftigerKunde);
  for (let i = 0; i < harmlos.length; i++) {
    assert.equal(leseBestellung(giftig[i].text).einkaufNetto, leseBestellung(harmlos[i].text).einkaufNetto);
  }
});

test('Ausgang Bestell-CSV: Zeilen- und Feldzahl bleiben gleich', () => {
  const harmlos = bestellungenAus(harmloserKunde);
  const giftig = bestellungenAus(giftigerKunde);
  for (let i = 0; i < harmlos.length; i++) {
    assert.deepEqual(felder(giftig[i].csv), felder(harmlos[i].csv), `Bestell-CSV ${i} ist verrutscht`);
    const gelesen = leseBestellCsv(giftig[i].csv);
    assert.ok(gelesen.positionen.length >= 1);
    for (const p of gelesen.positionen) {
      assert.equal(p.spalten, gelesen.kopf.length);
      assert.ok(Number.isFinite(p.menge), `Unlesbare Menge bei ${p.sku}`);
    }
  }
});

/* ------------------------------------------------------------------ *
 * Ausgang 3 und 4: Angebot und Rechnung an den Kunden
 * ------------------------------------------------------------------ */

const belegPaar = (erzeuge) => {
  const feld = { nummer: 'AN-2026-0001', datum: '2026-08-16', lieferdatum: '2026-08-30', betreiber };
  return [
    erzeuge(warenkorb, { ...feld, kunde: harmloserKunde }),
    erzeuge(warenkorb, { ...feld, kunde: giftigerKunde }),
  ];
};

test('Ausgang Angebot: Gift erzeugt keine zusätzliche Zeile', () => {
  const [harmlos, giftig] = belegPaar(erzeugeAngebot);
  assert.equal(zeilen(giftig.text), zeilen(harmlos.text));
});

test('Ausgang Rechnung: Gift erzeugt keine zusätzliche Zeile', () => {
  const [harmlos, giftig] = belegPaar(erzeugeRechnung);
  assert.equal(zeilen(giftig.text), zeilen(harmlos.text));
});

test('Ausgang Rechnung: die untergeschobene Summenzeile verdrängt die echte nicht', () => {
  const [harmlos, giftig] = belegPaar(erzeugeRechnung);
  const gesamt = (text) => text.split('\n').filter((z) => z.startsWith('Gesamtbetrag'));
  assert.equal(gesamt(giftig.text).length, 1, 'Zwei Gesamtbetragszeilen auf einer Rechnung');
  assert.deepEqual(gesamt(giftig.text), gesamt(harmlos.text));
});

/* ------------------------------------------------------------------ *
 * Ausgang 5: das Journal an die Buchhaltung
 * ------------------------------------------------------------------ */

test('Ausgang Journal-CSV: ein mehrzeiliger Belegtext bleibt eine Zeile', () => {
  const ablage = neueAblage();
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16T09:00:00Z', text: `Notiz${GIFT}` });
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16T09:05:00Z', text: 'Notiz' });

  const zahlen = felder(alsCsv(ablage));
  assert.equal(zahlen.length, 3, 'Kopfzeile plus zwei Einträge');
  assert.equal(zahlen[1], zahlen[0]);
  assert.equal(zahlen[2], zahlen[0]);
});

/* ------------------------------------------------------------------ *
 * Ausgang 5a: das Journal auf der Platte (JSONL)
 *
 * Anders als jeder andere Ausgang darf dieser **nicht** entschärfen:
 * § 131 BAO verlangt den ursprünglichen Inhalt. Die Eigenschaft ist
 * deshalb eine andere — die Zeile bricht nie, der Inhalt bleibt
 * zeichengenau erhalten.
 * ------------------------------------------------------------------ */

test('Ausgang Journal-JSONL: Gift bleibt eine Zeile und liest sich zeichengenau zurück', () => {
  const geschrieben = [];
  const ablage = neueAblage({ schreibe: (e) => geschrieben.push(journalzeile(e)) });
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16T09:00:00Z', text: `Notiz${GIFT}` });

  assert.equal(geschrieben.length, 1);
  assert.equal(zeilen(geschrieben[0]), 1, 'kein Umbruch des Gifts erreicht die Datei');
  assert.equal(hatSteuerzeichen(geschrieben[0]), false);

  const neu = ausJournal(geschrieben.join('\n'));
  assert.equal(neu.eintraege[0].text, `Notiz${GIFT}`, 'bewahrt statt entschärft — § 131 BAO');
});

/* ------------------------------------------------------------------ *
 * Ausgang 6: die Belegzeile der UID-Abfrage
 * ------------------------------------------------------------------ */

test('Ausgang UID-Belegzeile: der Name aus der fremden Antwort bleibt eine Zeile', () => {
  const auswertung = {
    stand: 'gueltig',
    name: `Muster GmbH${GIFT}`,
    abfrageDatum: '2026-08-16',
    abfrageId: 'WAPIAAAAX123',
  };
  assert.equal(zeilen(belegzeile(auswertung, 'ATU12345675')), 1);
});

/* ------------------------------------------------------------------ *
 * Ausgang 7: das Impressum im Web
 * ------------------------------------------------------------------ */

test('Ausgang Impressum: Gift in den Betreiberdaten erzeugt keine zusätzliche Zeile', () => {
  const harmlos = erzeugeImpressum(betreiber);
  const giftig = erzeugeImpressum({ ...betreiber, firma: betreiber.firma + GIFT });
  assert.equal(zeilen(giftig.text), zeilen(harmlos.text));
});

/* ------------------------------------------------------------------ *
 * Ausgang 8: die Oberfläche
 * ------------------------------------------------------------------ */

test('Ausgang Oberfläche: kein Quelltext schreibt fremden Text als HTML', () => {
  // Die Oberfläche setzt Text ausschließlich über textContent. Das ist heute
  // wahr und soll es bleiben — ein einziges innerHTML mit eingesetztem
  // Artikelnamen wäre der Weg, auf dem fremdes Markup in die Seite kommt.
  const dateien = [
    ...readdirSync(new URL('../src/', import.meta.url)).map((d) => new URL(`../src/${d}`, import.meta.url)),
    new URL('../demo-template.html', import.meta.url),
  ];
  assert.ok(dateien.length > 10);

  const treffer = [];
  for (const datei of dateien) {
    readFileSync(datei, 'utf8')
      .split('\n')
      .forEach((z, i) => {
        // Zulässig ist nur das Leeren eines Knotens; alles andere ist ein Fund.
        if (/(innerHTML|outerHTML|insertAdjacentHTML|document\.write)/.test(z) && !/innerHTML = '';/.test(z)) {
          treffer.push(`${datei.pathname}:${i + 1} ${z.trim()}`);
        }
      });
  }
  assert.deepEqual(treffer, [], `Fremder Text könnte als HTML in die Seite gelangen:\n${treffer.join('\n')}`);
});
