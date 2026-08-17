import test from 'node:test';
import assert from 'node:assert/strict';
import { zahl, jaNein, leseCsv, importierePreisliste, vergleiche } from '../src/import.js';

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

test('Gate 1: zu dünne Marge erzeugt eine Warnung, blockiert aber nicht', () => {
  // EK 70 bei UVP 100 lässt höchstens 30 % Marge zu.
  const csv = 'sku;bezeichnung;uvp_netto;ek_netto\nA-1;Bahn;100;70';
  const { artikel, warnungen } = importierePreisliste(csv, lieferant);
  assert.equal(artikel.length, 1);
  assert.ok(warnungen.some((w) => /Gate 1/.test(w)));
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
