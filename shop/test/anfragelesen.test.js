/**
 * Die Anfrage zurücklesen, statt sie abzutippen.
 *
 * **Der Anlass, 3. September 2026.** Der Anfragebetrieb kostet fünfzehn
 * Minuten je Anfrage, und der erste Schritt heißt „Anfrage lesen und den
 * Positionen zuordnen": drei Minuten, in denen ein Mensch Artikelnummern und
 * Mengen aus einer Mail in den Shop zurücktippt.
 *
 * > **Das ist die eine Stelle, an der ein Tippfehler falsche Ware auf eine
 * > Baustelle bringt.**
 *
 * Die Probe geht den ganzen Weg: Anfragetext erzeugen, zurücklesen, und den
 * zurückgelesenen Warenkorb mit dem verglichen, aus dem er entstanden ist.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { lesePositionen, leseAnfrage } from '../src/anfragelesen.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { baueKundenanfrage } from '../src/kundenanfrage.js';

const lies = (n) => JSON.parse(readFileSync(fileURLToPath(new URL(n, import.meta.url)), 'utf8'));
const lieferanten = lies('../data/lieferanten.json').lieferanten;

/** Ein Sortiment mit einem langen Namen — der erzwingt den Umbruch. */
const artikel = [
  {
    sku: 'POS-51967', bezeichnung: 'Thermo-Trennstein 12-18 EZ Absolut monolithisch weiß mit sehr langem Namen',
    gruppe: 'Mauerwerk', einheit: 'STK', lieferantId: 'poschacher', sperrgut: true,
    vkNetto: 255.91, ekNetto: 1, preisStand: '2026-06-25',
  },
  {
    sku: 'POS-12476', bezeichnung: 'SIKM Rohr 133cm gedämmt 18', gruppe: 'Kamin',
    einheit: 'STK', lieferantId: 'poschacher', sperrgut: true,
    vkNetto: 210.99, ekNetto: 1, preisStand: '2026-07-27',
  },
];
const daten = { artikel, lieferanten, mindestbestellwertNetto: 250 };
const rechne = (zeilen) => kundenWarenkorb(zeilen, daten);

/** Der Text, wie der Kunde ihn abschickt. */
function anfragetext(zeilen) {
  const a = baueKundenanfrage({
    rechnung: rechne(zeilen),
    bezirk: 'Perg',
    betreiber: { firma: 'Freudenthaler Bau GmbH', ort: 'Ried in der Riedmark', email: '' },
    datum: '2026-09-03',
  });
  assert.equal(a.moeglich, true, a.hindernis);
  return a.text;
}

test('der zurückgelesene Warenkorb ist der abgeschickte', () => {
  const zeilen = [{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }];
  const e = leseAnfrage(anfragetext(zeilen), rechne);
  assert.equal(e.gelesen, true, e.grund);
  const nachNummer = (l) => [...l].sort((a, b) => a.sku.localeCompare(b.sku));
  assert.deepEqual(nachNummer(e.zeilen), nachNummer(zeilen));
  assert.equal(e.bezirk, 'Perg');
  assert.equal(e.rechnung.warenwertNetto, rechne(zeilen).warenwertNetto);
});

test('die Menge kommt aus der Rechnung, nicht aus der Zeilenanordnung', () => {
  // Der lange Name bricht um; die Menge steht dann auf einer anderen Zeile als
  // die Artikelnummer. Genau deshalb wird sie aus Zeilensumme ÷ Einzelpreis
  // gerechnet — beide stehen mit der Nummer auf derselben Zeile.
  const text = anfragetext([{ sku: 'POS-51967', menge: 3 }]);
  const mitNummer = text.split('\n').filter((z) => z.includes('POS-51967'));
  assert.equal(mitNummer.length, 1, 'die Artikelnummer steht auf genau einer Zeile');
  assert.ok(!/^\s*3\s/.test(mitNummer[0]), 'die Menge steht nicht auf derselben Zeile — sonst prüft dieser Fall nichts');
  assert.deepEqual(lesePositionen(text).zeilen, [{ sku: 'POS-51967', menge: 3 }]);
});

test('gebrochene Mengen kommen unverfälscht zurück', () => {
  const zeilen = [{ sku: 'POS-12476', menge: 1 }, { sku: 'POS-51967', menge: 2 }];
  const e = leseAnfrage(anfragetext(zeilen), rechne);
  assert.equal(e.gelesen, true, e.grund);
  const summe = e.zeilen.reduce((n, z) => n + z.menge, 0);
  assert.equal(summe, 3);
});

test('ein veränderter Betrag wird nicht überschrieben, sondern gemeldet', () => {
  // Der Fall, für den der Leser gebaut ist: Der Text sagt etwas anderes, als
  // die Zeilen ergeben — geänderter Preis oder veränderter Text.
  const text = anfragetext([{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }])
    .replace('677,89', '699,00');
  const e = leseAnfrage(text, rechne);
  assert.equal(e.gelesen, false);
  assert.match(e.grund, /Summen stimmen nicht überein/);
  assert.match(e.grund, /Warenwert/);
});

test('eine unbekannte Artikelnummer bricht das Lesen ab', () => {
  const text = anfragetext([{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }])
    .replace('POS-12476', 'POS-99999');
  const e = leseAnfrage(text, rechne);
  assert.equal(e.gelesen, false);
  assert.match(e.grund, /nicht rechnen|Unbekannte/);
});

test('ein fremder Text ergibt keine Positionen, sondern einen Grund', () => {
  for (const text of ['', 'Guten Tag, bitte um ein Angebot. Danke.', null]) {
    const e = leseAnfrage(text, rechne);
    assert.equal(e.gelesen, false, `„${text}" wurde gelesen`);
    assert.ok(e.grund.length > 20);
  }
});

test('Summenzeilen werden nicht für Positionen gehalten', () => {
  // „Warenwert 677,89 €" trägt einen Betrag und keine Artikelnummer;
  // „Netto gesamt" ebenso. Beide dürfen nicht als Position zählen.
  const text = anfragetext([{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }]);
  const gelesen = lesePositionen(text);
  assert.equal(gelesen.zeilen.length, 2, `${gelesen.zeilen.length} Positionen statt zwei`);
  assert.deepEqual(gelesen.meldungen, [], gelesen.meldungen.join(' | '));
});
