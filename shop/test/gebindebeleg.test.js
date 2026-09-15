/**
 * Der Gebindeschritt gegen die Lieferantenrechnungen.
 *
 * **Der Anlass, 4. September 2026.** Der Gebindeschritt hat den größten Hebel
 * und die dünnste Grundlage: Er wird **aus dem Artikelnamen gelesen**. Von ihm
 * hängen ab: die kleinste bestellbare Menge, der Preis je Gebinde, das
 * Aufrunden im Warenkorb, die Frachtschwelle und der Satz „angenommen wird
 * eine Anfrage ab 450 kg".
 *
 * > **Eine Zahl, die aus einer Zeichenkette gelesen wird und fünf Rechnungen
 * > trägt, gehört gegen etwas gehalten, das nicht dieselbe Zeichenkette ist.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { istVielfaches, pruefeGebindeGegenBelege, TOLERANZ } from '../src/gebindebeleg.js';
import { mengenschritt } from '../src/gebinde.js';

const artikel = [
  { sku: 'A', bezeichnung: 'Putzgrund weiß 25 kg', einheit: 'KG', lieferantenArtikelnummer: '111' },
  { sku: 'B', bezeichnung: 'XPS glatt SF 30 mm 0,75 m2', einheit: 'M2', lieferantenArtikelnummer: '222' },
  { sku: 'C', bezeichnung: 'Kanalrohr NW 100', einheit: 'STK', lieferantenArtikelnummer: '333' },
];
const pos = (artikelnummer, menge, belegart = 'Rechnung') => ({ artikelnummer, menge, belegart });

test('ein Vielfaches ist eines, auch mit Nachkommastellen', () => {
  assert.equal(istVielfaches(75, 25), true);
  assert.equal(istVielfaches(5.25, 0.75), true);
  assert.equal(istVielfaches(7, 25), false);
  assert.equal(istVielfaches(5, 0.75), false);
  // Ein Schritt von 0 oder null ist kein Teiler, sondern eine fehlende Angabe.
  assert.equal(istVielfaches(10, 0), false);
  assert.equal(istVielfaches(10, null), false);
  assert.ok(TOLERANZ > 0 && TOLERANZ < 1e-3);
});

test('negative Mengen sind Gutschriften und zählen mit', () => {
  const e = pruefeGebindeGegenBelege(artikel, [pos('111', -50, 'Gutschrift')], mengenschritt);
  assert.equal(e.gutschriften, 1);
  assert.equal(e.sauber, true, JSON.stringify(e.abweichungen));
  // Eine Rückgabe, die kein ganzes Gebinde ist, fällt genauso auf.
  const schief = pruefeGebindeGegenBelege(artikel, [pos('111', -7, 'Gutschrift')], mengenschritt);
  assert.equal(schief.sauber, false);
});

test('ein verlesener Schritt fällt an den fakturierten Mengen auf', () => {
  const e = pruefeGebindeGegenBelege(artikel, [pos('111', 25), pos('111', 50)], () => 20);
  assert.equal(e.sauber, false);
  assert.equal(e.abweichungen.length, 1);
  assert.deepEqual(e.abweichungen[0].mengen, [25, 50]);
});

test('Artikel ohne Schritt im Namen werden ausgewiesen, nicht übersprungen', () => {
  const e = pruefeGebindeGegenBelege(artikel, [pos('333', 3), pos('333', 5)], mengenschritt);
  assert.equal(e.geprueft, 0);
  assert.deepEqual(e.ohneSchritt, [{ sku: 'C', positionen: 2 }]);
  // Sie gelten nicht als geprüft — sonst meldete der Lauf Grün über nichts.
  assert.equal(e.sauber, true);
});

test('eine Position ohne Artikel im Katalog wird gezählt', () => {
  const e = pruefeGebindeGegenBelege(artikel, [pos('999', 1)], mengenschritt);
  assert.equal(e.ohneArtikel, 1);
  assert.equal(e.artikelMitPositionen, 0);
});

test('eine unlesbare Menge ist ein Fehler und kein stiller Übersprung', () => {
  assert.throws(() => pruefeGebindeGegenBelege(artikel, [pos('111', Number.NaN)], mengenschritt),
    /ohne lesbare Menge/);
});

test('der Bestand steht: jeder gelesene Schritt passt zu den Rechnungen', () => {
  const quelle = fileURLToPath(new URL('../../preise/poschacher-positionen.csv', import.meta.url));
  assert.equal(typeof existsSync(quelle), 'boolean');
  if (!existsSync(quelle)) return;

  const katalog = JSON.parse(readFileSync(
    fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8',
  )).artikel;
  const zeilen = readFileSync(quelle, 'utf8').trim().split('\n');
  const kopf = zeilen[0].split(';');
  const positionen = zeilen.slice(1).map((z) => {
    const f = z.split(';');
    return {
      artikelnummer: f[kopf.indexOf('ArtNr')],
      menge: Number(f[kopf.indexOf('Menge')]),
      belegart: f[kopf.indexOf('Belegart')],
    };
  });

  const e = pruefeGebindeGegenBelege(katalog, positionen, mengenschritt);
  assert.deepEqual(e.abweichungen, []);
  assert.ok(e.geprueft >= 10, `nur ${e.geprueft} Artikel mit Schritt — misst dieser Fall noch etwas?`);
});
