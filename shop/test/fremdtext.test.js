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
import { erzeugeAngebot, erzeugeRechnung, erzeugeAuftragsbestaetigung } from '../src/beleg.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { baueKundenanfrage, mailtoAdresse } from '../src/kundenanfrage.js';
import { erzeugeImpressum } from '../src/rechtstexte.js';
import { robotsTxt } from '../src/maschinenlesbar.js';
import { erzeugeLieferantenanfrage } from '../src/lieferantenanfrage.js';
import { jsonFuerSkript } from '../src/format.js';
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
 * Nachgetragen am 2. September: drei Ausgänge, die im Verzeichnis fehlten
 *
 * Diese Datei nennt sich selbst ein Verzeichnis und sagt: „Was hier nicht
 * steht, ist ungeprüft." Genau das war der Fall. Angebot und Rechnung standen
 * hier, die **Auftragsbestätigung** nicht — das Dokument, mit dem nach Punkt 2
 * der AGB der Vertrag zustande kommt. Und der Anfragetext samt seiner
 * mailto-Adresse fehlte ganz, obwohl er der einzige Text ist, den der Kunde
 * selbst verschickt.
 *
 * > **Eine Regel gilt nur dort, wo jemand sie hingeschrieben hat.** Angebot
 * > und Rechnung waren geprüft, weil sie an dem Tag im Blick waren; die
 * > Bestätigung dazwischen nicht, weil sie es nicht war.
 * ------------------------------------------------------------------ */

test('Ausgang Auftragsbestätigung: Gift erzeugt keine zusätzliche Zeile', () => {
  const [harmlos, giftig] = belegPaar(erzeugeAuftragsbestaetigung);
  assert.equal(zeilen(giftig.text), zeilen(harmlos.text));
});

test('Ausgang Auftragsbestätigung: die untergeschobene Summenzeile verdrängt die echte nicht', () => {
  const [harmlos, giftig] = belegPaar(erzeugeAuftragsbestaetigung);
  const gesamt = (text) => text.split('\n').filter((z) => z.startsWith('Gesamtbetrag'));
  assert.equal(gesamt(giftig.text).length, 1, 'Zwei Gesamtbetragszeilen auf einer Auftragsbestätigung');
  assert.deepEqual(gesamt(giftig.text), gesamt(harmlos.text));
});

const anfragePaar = () => {
  // Der Mindestbestellwert steht niedrig: Diese Probe prüft die Maskierung
  // fremden Textes, nicht Gate 25. Mit der echten Grenze käme gar kein Text
  // zustande, und die Probe prüfte eine leere Zeichenkette gegen sich selbst.
  const daten = { artikel: katalog.artikel, lieferanten: lies('../data/lieferanten.json').lieferanten,
    mindestbestellwertNetto: 1 };
  const rechnung = kundenWarenkorb([{ sku: 'AB-RD-375', menge: 1 }, { sku: 'ZB-DB-150', menge: 2 }], daten);
  const bau = (b) => baueKundenanfrage({
    rechnung, bezirk: 'Perg', betreiber: b, datum: '2026-09-02',
  });
  return [bau({ ...betreiber, ort: 'Ried in der Riedmark' }),
    bau({ ...betreiber, ort: 'Ried in der Riedmark', firma: betreiber.firma + GIFT })];
};

test('Ausgang Kundenanfrage: Gift in den Betreiberdaten erzeugt keine zusätzliche Zeile', () => {
  const [harmlos, giftig] = anfragePaar();
  assert.equal(harmlos.moeglich, true, harmlos.hindernis);
  assert.equal(zeilen(giftig.text), zeilen(harmlos.text));
});

test('Ausgang Kundenanfrage: die untergeschobene Summenzeile verdrängt die echte nicht', () => {
  const [harmlos, giftig] = anfragePaar();
  const summe = (t) => t.split('\n').filter((z) => z.trim().startsWith('Brutto gesamt'));
  assert.equal(summe(giftig.text).length, 1);
  assert.deepEqual(summe(giftig.text), summe(harmlos.text));
});

test('Ausgang mailto-Adresse: Gift bleibt eine Adresse ohne zusätzliche Kopfzeile', () => {
  // Ein Umbruch in einem mailto-Rumpf kann im Mailprogramm einen zweiten
  // Kopfeintrag erzeugen. Die Adresse muss vollständig kodiert sein.
  const [, giftig] = anfragePaar();
  const adresse = mailtoAdresse({ ...giftig, empfaenger: 'bestellung@example.at' });
  if (adresse === null) return; // zu lang — dann gibt es keinen Knopf, siehe kundenanfrage.test.js
  assert.equal(zeilen(adresse), 1);
  assert.ok(!/[\r\n\u2028\u2029]/.test(adresse), 'roher Umbruch in der Adresse');
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

test('Ausgang UID-Belegzeile: auch Abfrage-ID und Datum sind fremder Text', () => {
  // Der erste Testfall prüfte nur den Namen — dieselbe blinde Stelle wie der
  // Code selbst: Alle drei Felder kommen aus der Antwort des fremden Dienstes.
  const auswertung = {
    stand: 'gueltig',
    name: 'Muster GmbH',
    abfrageDatum: `2026-08-16${GIFT}`,
    abfrageId: `WAPI${GIFT}X123`,
  };
  assert.equal(zeilen(belegzeile(auswertung, 'ATU12345675')), 1);
  assert.equal(hatSteuerzeichen(belegzeile(auswertung, 'ATU12345675')), false);
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
 * Ausgang 8: die Daten im Skriptelement
 *
 * Befund vom 3. September. Der Bau schreibt Shopdaten und maschinenlesbare
 * Auszeichnung mit `JSON.stringify` direkt zwischen `<script>` und
 * `</script>`. `JSON.stringify` maskiert kein `<` — eine Artikelbezeichnung
 * mit der Zeichenfolge `</script>` beendet das Skriptelement, und alles
 * dahinter liest der Browser als HTML.
 *
 * Vier Stellen waren betroffen: die Einzeldatei, `demo.html`, `shop.js` und
 * die ld+json-Auszeichnung jeder der 81 Seiten.
 * ------------------------------------------------------------------ */

test('Ausgang Skriptdaten: eine Bezeichnung kann das Skriptelement nicht beenden', () => {
  const giftig = { bezeichnung: `Platte </script><img src=x onerror=alert(1)> 50 mm${GIFT}` };
  const ausgabe = jsonFuerSkript(giftig);
  assert.doesNotMatch(ausgabe, /<\/script/i, 'die Zeichenfolge beendet das Element');
  assert.doesNotMatch(ausgabe, /<img/i);
  // Und der Wert überlebt: Maskiert wird die Schreibweise, nicht der Inhalt.
  assert.equal(JSON.parse(ausgabe).bezeichnung, giftig.bezeichnung);
});

test('Ausgang Skriptdaten: keine gebaute Seite trägt eine offene Zeichenfolge im JSON', () => {
  // Geprüft wird das Erzeugnis, nicht die Absicht: In den ld+json-Blöcken der
  // gebauten Seiten darf `</script` nicht vorkommen — sonst hätte der Browser
  // das Element schon dort beendet.
  const wurzel = new URL('../ausgabe/site/', import.meta.url);
  let ordner;
  try {
    ordner = readdirSync(wurzel);
  } catch (e) {
    return; // ohne Bau keine Aussage — und keine falsche
  }
  assert.ok(ordner.length > 3, 'der Bau ist leer');
  const dateien = [];
  const gehe = (u) => {
    for (const e of readdirSync(u, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(new URL(`${e.name}/`, u));
      else if (e.name.endsWith('.html')) dateien.push(new URL(e.name, u));
    }
  };
  gehe(wurzel);
  assert.ok(dateien.length >= 40, `nur ${dateien.length} Seiten — die Schleife prüfte zu wenig`);
  const offen = [];
  for (const datei of dateien) {
    const html = readFileSync(datei, 'utf8');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      if (/<\/script/i.test(m[1])) offen.push(String(datei));
    }
  }
  assert.deepEqual(offen, []);
});

/* ------------------------------------------------------------------ *
 * Ausgang 9: die Lieferantenanfrage
 * ------------------------------------------------------------------ */

test('Ausgang Lieferantenanfrage: Gift in den Betreiberdaten erzeugt keine zusätzliche Zeile', () => {
  const gut = { ...betreiber, email: 'buero@example.at', telefon: '+43 1 2345678' };
  const harmlos = erzeugeLieferantenanfrage({ betreiber: gut, lieferant: { name: 'Muster Baustoffe' } });
  const giftig = erzeugeLieferantenanfrage({
    betreiber: { ...gut, firma: gut.firma + GIFT },
    lieferant: { name: `Muster Baustoffe${GIFT}` },
  });
  assert.equal(zeilen(giftig.text), zeilen(harmlos.text));
  // Und keine erfundene fünfte Frage: Der Brief ist nummeriert, und eine Zeile,
  // die mit einer Ziffer und einem Punkt beginnt, liest der Empfänger als Frage.
  assert.equal((giftig.text.match(/^\d+\. /gm) ?? []).length,
    (harmlos.text.match(/^\d+\. /gm) ?? []).length);
});

/* ------------------------------------------------------------------ *
 * Ausgang 10: die robots.txt
 *
 * Am 2. September nachgetragen. Sie stand in keinem Verzeichnis, weil das
 * Namensmuster `Text` kannte und `Txt` nicht — dabei liest sie jeder Crawler,
 * und ihr einziges eingesetztes Feld ist eine Adresse von außen.
 * ------------------------------------------------------------------ */

test('Ausgang robots.txt: Gift in der Sitemap-Adresse erzeugt keine zusätzliche Zeile', () => {
  const harmlos = robotsTxt({ sitemap: 'https://bauversand.com/sitemap.xml' });
  const giftig = robotsTxt({ sitemap: `https://bauversand.com/sitemap.xml${GIFT}` });
  assert.equal(zeilen(giftig), zeilen(harmlos));
  // `hatSteuerzeichen` gilt der **Zeile**, nicht dem Dokument: Auf das ganze
  // robots.txt angewandt meldet es die eigenen Zeilenumbrüche und ist immer
  // wahr. Geprüft wird deshalb die eine Zeile, in der Fremdtext landet.
  const sitemapzeile = giftig.split('\n').find((z) => z.startsWith('Sitemap:'));
  assert.equal(hatSteuerzeichen(sitemapzeile), false);
  // Und keine eingeschmuggelte zweite Anweisung: Eine `Disallow`-Zeile, die
  // nicht aus dem Register stammt, wäre der Weg, mit dem sich ein Fremdtext
  // den ganzen Shop aus den Suchmaschinen nimmt.
  assert.equal((giftig.match(/^Disallow:/gm) ?? []).length,
    (harmlos.match(/^Disallow:/gm) ?? []).length);
});

/* ------------------------------------------------------------------ *
 * Ausgang 11: die Oberfläche
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
