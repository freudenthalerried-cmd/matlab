/**
 * Zahlen in hiesiger Schreibweise.
 *
 * **Befund vom 2. September 2026.** Die Buchhaltungs-CSV geht mit Semikolon
 * als Trenner hinaus — das ist die hiesige Schreibweise — und trug die Beträge
 * mit Punkt:
 *
 * ```
 * 1;rechnung;RE-2026-0001;2026-09-02;V-1;768.39;922.07;;…
 * ```
 *
 * In einer Tabellenkalkulation mit deutscher Ländereinstellung ist der Punkt
 * das Tausendertrennzeichen. Aus 768,39 € werden lautlos 76.839 €, und die
 * Zahl sieht nach dem Import wie eine Zahl aus. Dieselbe Datei geht zum
 * Steuerberater.
 *
 * > **Eine Datei, die zur Hälfte deutsch formatiert ist, ist falsch
 * > formatiert.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { zahlText, csvBetrag, zahlAusText } from '../src/format.js';
import { neueAblage, haltefest, alsCsv } from '../src/ablage.js';
import { leseBestellung } from '../src/kontrolle.js';

test('zahlText schreibt ganze Zahlen ohne Nachkomma und gebrochene mit Komma', () => {
  assert.equal(zahlText(55), '55');
  assert.equal(zahlText(0.75), '0,75');
  assert.equal(zahlText(1234.5), '1234,5');
  assert.equal(zahlText(0), '0');
});

test('zahlText macht aus einer fehlenden Angabe keine Null', () => {
  // `Number(null)` ist 0. Ohne Wache stünde in der Zeile eines Vermerks ohne
  // Betrag ein sauberes „0" — eine erfundene Null sieht aus wie eine gebuchte.
  for (const leer of [null, undefined, '', 'x', NaN]) assert.equal(zahlText(leer), '');
});

test('csvBetrag schreibt Geld immer mit zwei Stellen', () => {
  assert.equal(csvBetrag(1234.5), '1234,50', '„1234,5" ist in einer Buchhaltung kein Betrag');
  assert.equal(csvBetrag(768.39), '768,39');
  assert.equal(csvBetrag(0), '0,00');
  for (const leer of [null, undefined, '', 'x']) assert.equal(csvBetrag(leer), '');
});

test('zahlAusText liest Komma und Punkt', () => {
  // Beides mit Absicht: Ältere Dateien tragen den Punkt, und ein Leser, der
  // sie ab heute nicht mehr versteht, macht aus einem Formatfehler einen
  // Datenverlust.
  assert.equal(zahlAusText('0,75'), 0.75);
  assert.equal(zahlAusText('0.75'), 0.75);
  assert.equal(zahlAusText('55'), 55);
  assert.ok(Number.isNaN(zahlAusText('')));
});

test('Hin und zurück: was geschrieben wird, ist wieder lesbar', () => {
  for (const n of [55, 0.75, 2.55, 8.64, 1234.5]) {
    assert.equal(zahlAusText(zahlText(n)), n, `${n} überlebt den Umweg nicht`);
  }
});

test('Die Buchhaltungs-CSV trägt Komma, nicht Punkt', () => {
  const a = neueAblage();
  haltefest(a, {
    art: 'rechnung', nummer: 'RE-2026-0001', zeitpunkt: '2026-09-02',
    betragNetto: 768.39, betragBrutto: 922.07,
  });
  haltefest(a, { art: 'vermerk', zeitpunkt: '2026-09-02', text: 'ohne Betrag' });
  const zeilen = alsCsv(a).split('\n');
  assert.match(zeilen[1], /;768,39;922,07;/);
  assert.doesNotMatch(zeilen[1], /768\.39/, 'der Punkt macht daraus 76.839 €');
  // Und der Vermerk ohne Betrag bleibt leer statt gebucht.
  assert.match(zeilen[2], /;;;/);
});

test('Eine gebrochene Menge überlebt den Weg durch den Bestelltext', () => {
  // **Der zweite Befund desselben Tages.** `leseBestellung` verlangte
  // `(\d+)` — nur ganze Zahlen. Der Shop gibt Platten zu 0,75 m² und Rollen
  // zu 55 m² ab; eine Zeile mit gebrochener Menge traf das Muster nicht und
  // verschwand still. Die Gegenprobe verglich dann eine Position weniger und
  // beschuldigte den Bestelltext, in dem die Position sehr wohl stand.
  const text = [
    'Bestellung B-1', '', 'hiermit bestelle ich im Streckengeschäft zur Direktlieferung an den unten',
    'genannten Endkunden:', '',
    '    55 × POS-52058    Baumit TextilglasGitter 1,1x50 m',
    '  0,75 × POS-12569    XPS glatt SF 30 mm 0,75 m2',
    '', 'Lieferadresse (Baustelle):', '  Musterbau GmbH', '  Weg 7', '  4600 Wels', '',
  ].join('\n');
  const gelesen = leseBestellung(text);
  assert.equal(gelesen.positionen.length, 2, 'eine Position ist still verschwunden');
  assert.deepEqual(gelesen.positionen.map((p) => p.menge), [55, 0.75]);
});
