/**
 * Die Stücklisten und das, was sie über sich selbst sagen.
 *
 * **Der Anlass, 5. September 2026.** `kellerwand-perimeter` versprach im
 * Vorspann „fünf davon aus unserem Sortiment" und schrieb zwanzig Zeilen
 * weiter „Drei der sieben Positionen führen wir nicht".
 *
 * > **Dieselbe Seite, zwei Zahlen** — und die fünfte war ausgerechnet die
 * > Position, die die Tabelle als „nicht im Sortiment" führt und die
 * > zugleich unter „wird oft vergessen" steht.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ZAHLWORT, NICHT_GEFUEHRT, liesSystemliste, listenbefund, systemlistenbefund,
} from '../src/systemlisten.js';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const katalog = JSON.parse(readFileSync(join(wurzel, 'data', 'katalog-baustoff.json'), 'utf8'));
const katalogSkus = new Set(katalog.artikel.map((a) => a.sku));
const ordner = join(wurzel, 'inhalte', 'system');
const listen = readdirSync(ordner).filter((d) => d.endsWith('.md')).sort()
  .map((d) => ({ name: d, gelesen: liesSystemliste(readFileSync(join(ordner, d), 'utf8')) }));

test('der Bestand sagt über sich selbst die Wahrheit', () => {
  const b = systemlistenbefund(listen, katalogSkus);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.equal(b.listen, 4);
  assert.ok(b.positionen >= 30, `nur ${b.positionen} Positionen — dann prüft das hier wenig`);
});

/**
 * Der Zweck dieser Listen steht auf einer eigenen Wissensseite: **was fehlt,
 * hält die Baustelle auf.** Eine Liste ohne nicht geführte Position wäre
 * verdächtig — sie zeigte nur, was im Regal liegt.
 */
test('jede Liste führt auch, was dieses Haus nicht liefert', () => {
  assert.ok(listen.length >= 3, 'zu wenige Listen');
  for (const l of listen) {
    // Zwei Arten von Kennzeichnung: gar nicht geführt, oder eingeschränkt
    // („nicht in Flächenstärke"). Die zweite kam am 5. September dazu, nachdem
    // ein Testfall vom 30. August die Gleichsetzung zurückgewiesen hat.
    assert.ok(l.gelesen.ohneSortiment + l.gelesen.eingeschraenkt >= 1,
      `${l.name}: keine einzige gekennzeichnete Lücke — eine Liste, die nur das Regal zeigt`);
    assert.ok(l.gelesen.positionen - l.gelesen.ohneSortiment >= 1, `${l.name}: nichts lieferbar`);
    assert.ok(l.gelesen.skus.length >= 1, `${l.name}: nennt keinen Artikel`);
  }
});

/* ------------------------------------------------------------------ *
 * Die Regeln einzeln
 * ------------------------------------------------------------------ */

const seite = (zeilen, text = '') => `---\nskus: POS-1\n---\n\n${text}\n\n`
  + '| # | Position | Menge nach | oft vergessen |\n|---|---|---|---|\n'
  + zeilen.map((z, i) => `| ${i + 1} | ${z} | x | — |`).join('\n');

test('eine Zahl im Text gegen die Tabelle', () => {
  const g = liesSystemliste(seite(['A', 'B'], 'Sieben Positionen bilden das Bauteil.'));
  assert.equal(g.positionen, 2);
  const b = listenbefund('probe.md', g, new Set(['POS-1']));
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['zahl-widerspricht']);
});

test('die Zahl der nicht geführten Positionen gegen die Kennzeichnungen', () => {
  // Genau der Fall vom 5. September: Der Text sagt drei, gekennzeichnet ist eine.
  const g = liesSystemliste(seite(
    ['A *(nicht im Sortiment)*', 'B', 'C'],
    'Drei der drei Positionen führen wir nicht.',
  ));
  const b = listenbefund('probe.md', g, new Set(['POS-1']));
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nicht-gefuehrt-zahl']);
  assert.match(b.meldungen[0].text, /3 nicht geführte Position\(en\), gekennzeichnet sind 1/);
});

test('stimmen beide Zahlen, schweigt der Prüfer', () => {
  const g = liesSystemliste(seite(
    ['A *(nicht im Sortiment)*', 'B', 'C'],
    'Drei Positionen bilden das Bauteil. Eine der drei Positionen führen wir nicht.',
  ));
  assert.deepEqual(listenbefund('probe.md', g, new Set(['POS-1'])).meldungen, []);
});

test('ein Artikel der Kopfzeile, den es nicht gibt', () => {
  const g = liesSystemliste(seite(['A *(nicht im Sortiment)*', 'B']));
  const b = listenbefund('probe.md', g, new Set());
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['sku-gibt-es-nicht']);
});

test('eine Liste ohne Tabelle ist keine Liste', () => {
  const b = listenbefund('probe.md', liesSystemliste('---\nskus: POS-1\n---\nNur Text.'), new Set(['POS-1']));
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['keine-position']);
});

test('eine Liste, von der nichts lieferbar ist', () => {
  const g = liesSystemliste(seite(['A *(nicht im Sortiment)*', 'B *(nicht im Sortiment)*']));
  const b = listenbefund('probe.md', g, new Set(['POS-1']));
  assert.ok(b.meldungen.some((m) => m.regel === 'alles-fremd'));
});

test('ein Lauf über zu wenige Listen ist kein grüner', () => {
  const b = systemlistenbefund([listen[0]], katalogSkus, 3);
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-listen'));
});

test('Zahlwörter und Ziffern werden gleich gelesen', () => {
  assert.equal(ZAHLWORT.sieben, 7);
  const mitZiffer = liesSystemliste(seite(['A'], '2 Positionen bilden das Bauteil.'));
  assert.deepEqual(mitZiffer.gesamtaussagen, [{ wort: '2', wert: 2 }]);
});

test('die Kennzeichnung steht in der Positionsspalte, nicht irgendwo', () => {
  // „eigenes Gewerk" in der letzten Spalte sagt, **wer** es macht — nicht, ob
  // wir es führen. Die Kanalliste führt eine Position, die beides ist: fremdes
  // Gewerk und trotzdem im Sortiment.
  assert.equal(NICHT_GEFUEHRT.test('Grundmauerschutzbahn'), false);
  assert.equal(NICHT_GEFUEHRT.test('Abschlussschiene *(nicht im Sortiment)*'), true);
});

/**
 * Die Unterscheidung, die ein Testfall vom 30. August erzwungen hat.
 *
 * > **Eine Kennzeichnung, die zu viel behauptet, ist so falsch wie eine, die
 * > fehlt** — und die falsche Richtung ist die teurere: Sie schickt den
 * > Kunden von einer Ware weg, die es gibt.
 */
test('„nicht im Sortiment" und „nicht in Flächenstärke" sind zweierlei', async () => {
  const { EINGESCHRAENKT } = await import('../src/systemlisten.js');
  assert.equal(NICHT_GEFUEHRT.test('Dämmplatten *(nicht in Flächenstärke)*'), false);
  assert.equal(EINGESCHRAENKT.test('Dämmplatten *(nicht in Flächenstärke)*'), true);
  assert.equal(EINGESCHRAENKT.test('Abschlussschiene *(nicht im Sortiment)*'), false);
  assert.equal(NICHT_GEFUEHRT.test('Abschlussschiene *(nicht im Sortiment)*'), true);
});
