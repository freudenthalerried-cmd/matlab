import test from 'node:test';
import assert from 'node:assert/strict';
import { suchname, taugtAlsKeyword, kurzform } from '../bin/kampagne.mjs';

/* ------------------------------------------------------------------ *
 * Aus einer Katalogbezeichnung einen Suchbegriff machen
 *
 * Der erste Wurf schnitt einfach ab und erzeugte Fragmente wie
 * „Baumit TextilglasGitter 1,1x" — schlimmer als gar kein Keyword, weil ein
 * Konto voller solcher Zeilen gepflegt aussieht und nichts einbringt.
 * ------------------------------------------------------------------ */

test('Gebindeangaben fallen weg, der Produktname bleibt', () => {
  assert.equal(suchname('XPS glatt SF 80 mm 0,75 m2'), 'XPS glatt SF 80 mm');
  assert.equal(suchname('Baumit KlebeSpachtel 25 kg'), 'Baumit KlebeSpachtel');
  assert.equal(suchname('Soudal Perimeterkleber B3 750 ml'), 'Soudal Perimeterkleber B3');
});

test('Ein abgeschnittenes Maß bleibt nicht als Rest stehen', () => {
  // Der Fehler, der die erste Fassung unbrauchbar machte.
  const s = suchname('Baumit TextilglasGitter 1,1x50 m');
  assert.equal(s, 'Baumit TextilglasGitter');
  assert.doesNotMatch(s, /x$/, 'endet auf ein halbes Maß');
  assert.doesNotMatch(s, /[,;]$/);
});

test('Farbangaben fallen weg — auch die mit ß', () => {
  // JavaScripts \b ist ASCII-basiert: „ß" gilt ihr nicht als Wortzeichen,
  // `weiß\b` trifft deshalb nie. Dieselbe Falle hat schon die ÖNORM-Regel
  // des Hohlheitsprüfers blind gemacht.
  assert.equal(suchname('Capatect Putzgrund weiß 25 kg'), 'Capatect Putzgrund');
  assert.equal(suchname('Capatect Glasgewebe M, Breite 110cm, orange 55 m2'), 'Capatect Glasgewebe M');
});

/* ------------------------------------------------------------------ *
 * Die Prüfung, ob ein Begriff überhaupt gesucht wird
 * ------------------------------------------------------------------ */

test('Zu kurze, zu lange und fragmentierte Begriffe fallen durch', () => {
  assert.equal(taugtAlsKeyword('XPS').taugt, false);
  assert.equal(taugtAlsKeyword('Capatect Klebe- und Spachtelmasse 186 M').taugt, false);
  assert.equal(taugtAlsKeyword('Baumit TextilglasGitter 1,1x,').taugt, false);
  assert.equal(taugtAlsKeyword('120 50 30').taugt, false);
});

test('Katalognummern sind keine Suchbegriffe', () => {
  const u = taugtAlsKeyword('Capatect Universaldübel 053115');
  assert.equal(u.taugt, false);
  assert.match(u.grund, /Katalognummer/);
});

test('Was ein Mensch eingibt, kommt durch', () => {
  for (const gut of ['XPS 80 mm', 'Capatect 186 M', 'Kanalrohr DN 100', 'Schiedel Kamin', 'Isover TDPT 20']) {
    assert.equal(taugtAlsKeyword(gut).taugt, true, `„${gut}" sollte durchkommen`);
  }
});

test('Genau sechs Zeichen genügen, fünf nicht', () => {
  // Die Kante, an der die Längenregel entscheidet. Ohne diesen Fall bliebe
  // eine Vertauschung von < und <= unbemerkt.
  assert.equal(taugtAlsKeyword('abcdef').taugt, true);
  assert.equal(taugtAlsKeyword('abcde').taugt, false);
});

test('Genau fünf Wörter genügen, sechs nicht', () => {
  assert.equal(taugtAlsKeyword('ein zwei drei vier fuenf').taugt, true);
  assert.equal(taugtAlsKeyword('ein zwei drei vier fuenf sechs').taugt, false);
});

/* ------------------------------------------------------------------ *
 * Kurzform: Marke plus Typkennung
 * ------------------------------------------------------------------ */

test('Aus dem Katalognamen wird die Bestellbezeichnung', () => {
  assert.equal(kurzform('Capatect Klebe- und Spachtelmasse 186 M 25 kg', 'Capatect'), 'Capatect 186 M');
  assert.equal(kurzform('Capatect Klebe- und Spachtelmasse 190 FEIN 25 kg', 'Capatect'), 'Capatect 190 FEIN');
  assert.equal(kurzform('Isover TDPT 20 1200 600 mm 8,64 m2', 'Isover'), 'Isover TDPT 20');
});

test('Das M hinter der Nummer gehört dazu — es trennt zwei Produkte', () => {
  // Ohne den einzelnen Großbuchstaben bliebe „Capatect 186", und das
  // trifft 186 M und 186 zugleich.
  assert.match(kurzform('Capatect Klebe- und Spachtelmasse 186 M 25 kg', 'Capatect'), / M$/);
});

test('Vierstellige Zahlen sind Maße, keine Typkennung', () => {
  const k = kurzform('Isover TDPT 20 1200 600 mm 8,64 m2', 'Isover');
  assert.doesNotMatch(k, /1200/);
});

test('Ohne erkennbare Typkennung gibt es keine Kurzform', () => {
  assert.equal(kurzform('Capatect Polystyrol-Rondelle für Universaldübel Holz', 'Capatect'), null);
  assert.equal(kurzform('Irgendwas ohne Marke', null), null);
});
