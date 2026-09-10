/**
 * Die Seiten, die eine Frage vor der Bestellung beantworten.
 *
 * **Befund vom 10. September 2026.** Der Suchindex, den jeder Besucher
 * mitgeliefert bekommt, trug 46 Artikel und 24 Inhaltsseiten. Gemessen an
 * zwanzig Fragen, die ein Besteller vor dem Absenden stellt, fand er
 * **zwei** — und „lieferung" führte auf die Gruppenseite *Zubehör und
 * Kleinteile*.
 *
 * > **Eine Suche, die nur das Sortiment kennt, antwortet auf jede zweite
 * > Frage mit „nichts gefunden" — obwohl die Antwort im Haus liegt.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { DIENSTSEITEN, dienstseitenbefund } from '../src/dienstseiten.js';
import { suche, baueSuchindex } from '../src/shopkern.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

/** Die Fragen, an denen der Befund gemessen wurde. */
const FRAGEN = ['kranentladung', 'frachtpauschale', 'fracht', 'lieferzeit', 'mindestbestellwert',
  'liefergebiet', 'widerruf', 'rügefrist', 'impressum', 'agb', 'datenschutz', 'zahlung',
  'zahlungsarten', 'vorkasse', 'rechnung', 'versandkosten', 'abholung', 'lieferung',
  'reklamation', 'umsatzsteuer'];

test('jeder Eintrag ist vollständig und wird gebaut', () => {
  assert.ok(DIENSTSEITEN.length >= 5, 'ohne Einträge prüft diese Schleife nichts');
  const b = dienstseitenbefund(DIENSTSEITEN.map((s) => s.id));
  assert.deepEqual(b.meldungen, []);
});

test('ein Eintrag ohne Seite ist ein Befund', () => {
  const b = dienstseitenbefund([], [{ id: 'weg', titel: 't', frage: 'f', kurz: 'k' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'eintrag-ohne-seite'));
});

test('eine gebaute Dienstseite ohne Eintrag ist auch einer', () => {
  const b = dienstseitenbefund(['rechtliches/neu'], [], []);
  assert.ok(b.meldungen.some((m) => m.regel === 'seite-nicht-gefuehrt'));
  // Mit Grund ausgenommen meldet sie nicht.
  assert.deepEqual(dienstseitenbefund(['rechtliches/neu'], [], ['rechtliches/neu']).meldungen, []);
});

test('ein Eintrag ohne Frage oder Kurzantwort ist unvollständig', () => {
  const b = dienstseitenbefund(['x'], [{ id: 'x', titel: 't', frage: '', kurz: 'k' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'eintrag-unvollstaendig'));
});

/**
 * Gegen das Erzeugnis: den Suchindex, der ausgeliefert wird. Nicht gegen die
 * Vorlage — was der Besucher bekommt, ist die Datei.
 */
test('die ausgelieferte Suche beantwortet jede der zwanzig Fragen', (t) => {
  const datei = join(SHOP, 'ausgabe', 'site', 'shop.js');
  if (!existsSync(datei)) return t.skip('ohne Bau keine Aussage');
  const roh = readFileSync(datei, 'utf8');
  const daten = JSON.parse(/window\.__SHOP__\s*=\s*(\{[\s\S]*?\});/.exec(roh)[1]);
  const index = baueSuchindex({
    artikel: daten.artikel, seiten: daten.seiten, suchwoerter: daten.suchwoerter ?? [],
  });
  const leer = FRAGEN.filter((f) => suche(index, f).length === 0);
  assert.deepEqual(leer, [], 'diese Fragen an den Shop bleiben ohne Antwort');

  // Und die Richtung: „lieferung" führte vor dem 10. September auf die
  // Gruppenseite „Zubehör und Kleinteile".
  const treffer = suche(index, 'versandkosten')[0];
  assert.match(String(treffer.titel), /Lieferung/);
});

test('die Dienstseiten stehen wirklich im ausgelieferten Index', (t) => {
  const datei = join(SHOP, 'ausgabe', 'site', 'shop.js');
  if (!existsSync(datei)) return t.skip('ohne Bau keine Aussage');
  const roh = readFileSync(datei, 'utf8');
  const daten = JSON.parse(/window\.__SHOP__\s*=\s*(\{[\s\S]*?\});/.exec(roh)[1]);
  const ids = new Set(daten.seiten.map((s) => s.id));
  for (const s of DIENSTSEITEN) assert.ok(ids.has(s.id), `${s.id} fehlt im ausgelieferten Index`);
});
