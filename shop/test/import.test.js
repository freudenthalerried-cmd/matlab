import test from 'node:test';
import assert from 'node:assert/strict';
import { zahl, jaNein, leseCsv, importierePreisliste, vergleiche } from '../src/import.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { ZIELMARGE } from '../src/baustoffkatalog.js';

const lieferant = { id: 'bahnen-de', name: 'Test', haendlerrabattAufUvp: 0.42 };

test('Zahlen in deutscher und englischer Schreibweise', () => {
  assert.equal(zahl('1.234,56'), 1234.56);
  assert.equal(zahl('1,234.56'), 1234.56);
  assert.equal(zahl('398'), 398);
  assert.equal(zahl('230,84 €'), 230.84);
  assert.equal(zahl(''), null);
  assert.equal(zahl(null), null);
  assert.ok(Number.isNaN(zahl('keine Zahl')));
});

test('Ja-Nein-Spalten in üblichen Schreibweisen', () => {
  for (const w of ['ja', 'J', 'true', '1', 'x', 'YES']) assert.equal(jaNein(w), true);
  for (const w of ['nein', '0', '', 'n/a']) assert.equal(jaNein(w), false);
});

test('CSV erkennt Semikolon und Komma als Trenner', () => {
  const semi = leseCsv('sku;bezeichnung\nA-1;Bahn');
  assert.deepEqual(semi.kopf, ['sku', 'bezeichnung']);
  assert.equal(semi.zeilen[0].bezeichnung, 'Bahn');

  const komma = leseCsv('sku,bezeichnung\nA-1,Bahn');
  assert.equal(komma.zeilen[0].sku, 'A-1');
});

test('CSV verträgt BOM und leere Zeilen', () => {
  const { zeilen } = leseCsv('﻿sku;bezeichnung\n\nA-1;Bahn\n\n');
  assert.equal(zeilen.length, 1);
  assert.equal(zeilen[0].sku, 'A-1');
});

test('Bestätigter Einkaufspreis setzt ekQuelle auf bestaetigt', () => {
  const csv = 'sku;bezeichnung;uvp_netto;ek_netto;gewicht_kg;sperrgut\nAB-1;Radonbahn;398,00;230,84;20;ja';
  const { artikel, fehler } = importierePreisliste(csv, lieferant);

  assert.deepEqual(fehler, []);
  assert.equal(artikel.length, 1);
  assert.equal(artikel[0].ekQuelle, 'bestaetigt');
  assert.equal(artikel[0].ekNetto, 230.84);
  assert.equal(artikel[0].sperrgut, true);
  assert.equal(artikel[0].gewichtKg, 20);
});

test('Ohne Einkaufspreis bleibt der Artikel Platzhalter', () => {
  const csv = 'sku;bezeichnung;uvp_netto\nAB-2;Bahn ohne EK;398,00';
  const { artikel, warnungen } = importierePreisliste(csv, lieferant);

  assert.equal(artikel[0].ekQuelle, 'platzhalter');
  assert.equal(artikel[0].ekNetto, undefined);
  assert.ok(warnungen.some((w) => /Platzhalter/.test(w)));
});

test('Fehlende Pflichtspalten brechen den Import ab', () => {
  const { artikel, fehler } = importierePreisliste('preis\n1', lieferant);
  assert.equal(artikel.length, 0);
  assert.ok(fehler.some((f) => /sku/.test(f)));
  assert.ok(fehler.some((f) => /bezeichnung/.test(f)));
});

test('Fehlende Preisspalte bricht den Import ab', () => {
  const { fehler } = importierePreisliste('sku;bezeichnung\nA-1;Bahn', lieferant);
  assert.ok(fehler.some((f) => /Preisspalte/.test(f)));
});

test('Doppelte SKU wird gemeldet, nicht stillschweigend überschrieben', () => {
  const csv = 'sku;bezeichnung;ek_netto\nA-1;Erste;100\nA-1;Zweite;200';
  const { artikel, fehler } = importierePreisliste(csv, lieferant);
  assert.equal(artikel.length, 1);
  assert.ok(fehler.some((f) => /mehrfach/.test(f)));
});

test('Unlesbare Zahl wird abgewiesen statt geraten', () => {
  const csv = 'sku;bezeichnung;ek_netto\nA-1;Bahn;etwa hundert';
  const { artikel, fehler } = importierePreisliste(csv, lieferant);
  assert.equal(artikel.length, 0);
  assert.ok(fehler.some((f) => /nicht lesbar/.test(f)));
});

test('Einkaufspreis über UVP ist ein Fehler, keine Warnung', () => {
  const csv = 'sku;bezeichnung;uvp_netto;ek_netto\nA-1;Bahn;100;120';
  const { artikel, fehler } = importierePreisliste(csv, lieferant);
  assert.equal(artikel.length, 0);
  assert.ok(fehler.some((f) => /nicht kleiner als UVP/.test(f)));
});

test('Gate 22: ein deckelnder Listenpreis erzeugt eine Warnung, blockiert aber nicht', () => {
  // **Neu gefasst am 30.08.** Hier stand „Gate 1: zu dünne Marge" und
  // erwartete eine Warnung gegen die Untergrenze von 32 % — die Regel des
  // abgelösten Modells. Mit der heutigen Zielmarge von 25 % hätte sie bei
  // **jedem** Artikel jeder Liste angeschlagen.
  //
  // Gemeldet wird jetzt der Fall, den es wirklich gibt: EK 70 bei UVP 90
  // ergäbe 93,33 € Verkaufspreis, der Listendeckel lässt nur 90 € zu.
  const csv = 'sku;bezeichnung;uvp_netto;ek_netto\nA-1;Bahn;90;70';
  const { artikel, warnungen } = importierePreisliste(csv, lieferant);
  assert.equal(artikel.length, 1);
  assert.ok(warnungen.some((w) => /Gate 22/.test(w)), warnungen.join(' | '));
});

test('ein Artikel, der die Zielmarge erreicht, wird nicht gemeldet', () => {
  // Die Gegenrichtung — und der eigentliche Befund vom 30.08.: Ein Werkzeug,
  // das jede Zeile meldet, meldet nichts. Der Rundungsrest eines auf Cent
  // gerundeten Preises ist kein Befund; verglichen wird deshalb der Preis
  // gegen den ungedeckelten Preis, nicht die Marge gegen die Zielmarge.
  const csv = 'sku;bezeichnung;uvp_netto;ek_netto\nA-1;Bahn;200;70\nA-2;Platte;20;10';
  const { artikel, warnungen } = importierePreisliste(csv, lieferant);
  assert.equal(artikel.length, 2);
  assert.deepEqual(warnungen.filter((w) => /Gate 22/.test(w)), []);
});

test('Vergleich meldet Neuzugänge, Wegfall und Preisänderungen', () => {
  const alt = [
    { sku: 'A-1', ekNetto: 100 },
    { sku: 'A-2', ekNetto: 50 },
  ];
  const neu = [
    { sku: 'A-1', ekNetto: 110 },
    { sku: 'A-3', ekNetto: 20 },
  ];
  const d = vergleiche(alt, neu);

  assert.deepEqual(d.neuzugaenge, ['A-3']);
  assert.deepEqual(d.entfallen, ['A-2']);
  assert.equal(d.preisaenderungen.length, 1);
  assert.equal(d.preisaenderungen[0].sku, 'A-1');
  assert.ok(Math.abs(d.preisaenderungen[0].veraenderung - 0.1) < 1e-9);
});

test('Vergleich ignoriert Artikel ohne bestätigten Einkaufspreis', () => {
  const d = vergleiche([{ sku: 'A-1' }], [{ sku: 'A-1', ekNetto: 99 }]);
  assert.equal(d.preisaenderungen.length, 0);
});

test('Eine mehrdeutige Zahl wird abgewiesen statt geraten', () => {
  // `1.234` kann 1234 (deutsche Tausendergruppe) oder 1,234 (englische
  // Dezimalzahl) bedeuten — die Kopfzeile von import.js verspricht: abweisen
  // statt raten. Vor dieser Prüfung wurde englisch geraten; ein Einkaufspreis
  // wäre still um den Faktor 1.000 geschrumpft.
  assert.ok(Number.isNaN(zahl('1.234')), 'deutsch 1234 oder englisch 1,234 — nicht eindeutig');
  assert.ok(Number.isNaN(zahl('1,234')), 'englisch 1234 oder deutsch 1,234 — nicht eindeutig');
  assert.ok(Number.isNaN(zahl('12.345')), 'auch mit zwei führenden Ziffern mehrdeutig');

  // Eindeutig bleibt lesbar: Tausendergruppen beginnen nie mit einzelner Null,
  // und wer beide Trenner setzt, hat sich erklärt.
  assert.equal(zahl('0,500'), 0.5);
  assert.equal(zahl('0.500'), 0.5);
  assert.equal(zahl('1.234,56'), 1234.56);
  assert.equal(zahl('1234.567'), 1234.567);
});

test('Ein mehrdeutiger Preis lässt die Zeile am Import scheitern, nicht schrumpfen', () => {
  const liste = 'sku;bezeichnung;uvp_netto\nXX-1;Testartikel;1.234\n';
  const e = importierePreisliste(liste, { id: 'l1', haendlerrabattAufUvp: 0.35 });
  assert.equal(e.artikel.length, 0);
  assert.equal(e.fehler.length, 1);
  assert.match(e.fehler[0], /Zahl nicht lesbar/);
});


test('die Warnschwelle folgt der geltenden Zielmarge', () => {
  // **Die Lücke, die am 30.08. auffiel:** Der Vorgabewert der Zielmarge war
  // 0,35 — die Zahl des abgelösten Modells —, und **kein** Testfall hätte es
  // gemerkt. Der alte Testfall verlangte sogar eine Warnung, die es nur mit
  // der alten Zahl gibt.
  //
  // EK 70 bei UVP 100: Mit 25 % Zielmarge sind 93,33 € nötig, der Deckel
  // liegt bei 100 — kein Befund. Mit den alten 35 % wären es 107,69 €, und
  // der Deckel griffe. Dieselbe Zeile, zwei Urteile.
  assert.equal(ZIELMARGE, 0.25, 'die Probe hängt an dieser Entscheidung');
  const csv = 'sku;bezeichnung;uvp_netto;ek_netto\nA-1;Bahn;100;70';
  const jetzt = importierePreisliste(csv, lieferant);
  assert.deepEqual(jetzt.warnungen.filter((w) => /Gate 22/.test(w)), [],
    'mit der geltenden Zielmarge deckelt der Listenpreis hier nicht');
  const alt = importierePreisliste(csv, lieferant, 0.35);
  assert.equal(alt.warnungen.filter((w) => /Gate 22/.test(w)).length, 1,
    'mit der alten Zielmarge deckelte er');
});

test('der Datensatz trägt keinen Verkaufspreis — und das ist der Grund für die Sperre', () => {
  // Nachgemessen, weil ich es zuerst falsch angenommen hatte: Der
  // Verkaufspreis wird für die Warnung gerechnet und **nicht gespeichert**.
  // Die falsche Zielmarge hätte also falsche Warnungen erzeugt, keine
  // falschen Preise.
  //
  // Was der Datensatz trägt, ist `ekNetto` und `uvpNetto` — die Konditionen.
  // Deshalb schreibt `bin/import.mjs` seit dem 30.08. nicht mehr: `data/` ist
  // versioniert und öffentlich.
  const csv = 'sku;bezeichnung;uvp_netto;ek_netto\nA-1;Bahn;500;75';
  const { artikel } = importierePreisliste(csv, lieferant);
  assert.equal(artikel[0].vkNetto, undefined, 'ein Verkaufspreis wird nicht mitgeschrieben');
  assert.equal(artikel[0].ekNetto, 75, 'der Einkaufspreis dagegen schon');
  assert.equal(artikel[0].uvpNetto, 500);
});

/* ------------------------------------------------------------------ *
 * Ein unbekanntes Gewicht ist kein Gewicht von null
 * ------------------------------------------------------------------ */

const KOPF = 'sku;bezeichnung;uvp_netto;ek_netto;gewicht_kg;sperrgut';

test('Fehlt die Gewichtsspalte, bleibt das Feld weg — es wird keine Null gesetzt', () => {
  // **Der Befund vom 31.08.** `gewicht ?? 0` machte aus „unbekannt" nicht
  // irgendeinen Wert, sondern den leichtestmöglichen — und weil `0` eine Zahl
  // ist, galt die Position im Warenkorb als **belegt**. Der Kunde las „0 kg ·
  // aus den Lieferscheinen" statt „0 kg · 1 Position ohne belegtes Gewicht".
  const { artikel, fehler } = importierePreisliste(`${KOPF}\nA-1;Ware;398,00;230,84;;ja`, lieferant);
  assert.deepEqual(fehler, []);
  assert.equal(artikel.length, 1);
  assert.ok(!('gewichtKg' in artikel[0]),
    `gewichtKg steht mit ${artikel[0].gewichtKg} da, obwohl die Spalte leer war`);
});

test('Ein angegebenes Gewicht kommt unverändert durch', () => {
  // Gegenrichtung: Die Lücke darf nicht der neue Normalfall werden.
  const { artikel } = importierePreisliste(`${KOPF}\nA-1;Ware;398,00;230,84;20,5;ja`, lieferant);
  assert.equal(artikel[0].gewichtKg, 20.5);
});

test('Kein Einleser gibt jemals ein Gewicht von null aus', () => {
  // Die Regel, nicht der Einzelfall: Eine ausdrückliche Null in der Spalte ist
  // genauso wenig ein Gewicht wie eine leere Spalte. Wer „0" schreibt, hat
  // nicht gewogen — Ware ohne Masse gibt es nicht.
  for (const wert of ['', '0', '0,0', '  ']) {
    const { artikel } = importierePreisliste(`${KOPF}\nA-1;Ware;398,00;230,84;${wert};ja`, lieferant);
    assert.ok(!('gewichtKg' in artikel[0]),
      `bei Spaltenwert „${wert}" steht gewichtKg=${artikel[0].gewichtKg}`);
  }
});

test('Ohne Gewicht zählt der Warenkorb die Position als unbelegt', () => {
  // Die Wirkung, nicht nur die Absicht: Was der Einleser weglässt, muss den
  // Kunden erreichen. Ohne diesen Fall prüfte die Probe oben nur eine
  // Feldform, nicht die Auskunft, um die es geht.
  const { artikel } = importierePreisliste(`${KOPF}\nA-1;Ware;398,00;230,84;;nein`, lieferant);
  const lieferanten = [{
    id: lieferant.id, name: lieferant.name, lieferzeitWerktage: 3,
    fracht: { pauschaleNetto: 20, sperrgutZuschlagNetto: 0 },
  }];
  const korb = kundenWarenkorb(
    [{ sku: 'A-1', menge: 3 }],
    { artikel: [{ ...artikel[0], vkNetto: 80 }], lieferanten },
  );
  assert.equal(korb.positionenOhneGewicht, 1,
    'der Warenkorb hält das unbekannte Gewicht für belegt');
});
