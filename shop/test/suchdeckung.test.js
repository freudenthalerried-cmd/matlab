/**
 * **Die eigene Suche gegen die geführten Keywords — 6. September 2026.**
 *
 * Die Regel steht seit dem 1. September als Kommentar in `bin/kampagne.mjs`:
 * *„Auf ein Wort zu bieten, das die eigene Suche nicht beantwortet, ist ein
 * bezahlter Klick auf eine leere Trefferliste."* Ein Satz, ein Fall, kein
 * Prüfer — seither.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { suchdeckungsbefund } from '../src/suchdeckung.js';
import { baueSuchindex, suche } from '../src/shopkern.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SKRIPT = join(SHOP, 'ausgabe', 'site', 'shop.js');
const KEYWORDS = join(SHOP, 'ausgabe', 'kampagne', 'keywords.csv');

const viele = (n) => Array.from({ length: n }, (_, i) => `wort${i}`);

test('ein Keyword ohne jeden Treffer ist der Fund', () => {
  const b = suchdeckungsbefund({
    keywords: [...viele(10), 'gibt es nicht'],
    finde: (f) => (f === 'gibt es nicht' ? [] : [{ art: 'artikel', titel: 'x' }]),
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['keyword-ohne-treffer']);
  assert.match(b.meldungen[0].text, /leere Trefferliste/);
});

test('ein Keyword, das nur auf eine Gruppenseite führt, ist kein Fehler — aber es wird genannt', () => {
  const b = suchdeckungsbefund({
    keywords: [...viele(10), 'WDVS System kaufen'],
    finde: (f) => (f === 'WDVS System kaufen'
      ? [{ art: 'gruppe', titel: 'WDVS-Komponenten' }]
      : [{ art: 'artikel', titel: 'x' }]),
  });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.ohneArtikel.length, 1);
  assert.equal(b.ohneArtikel[0].keyword, 'WDVS System kaufen');
  assert.equal(b.mitArtikel, 10);
});

test('eine zu kurze Liste ist kein grüner Befund', () => {
  const b = suchdeckungsbefund({ keywords: ['eins'], finde: () => [{ art: 'artikel', titel: 'x' }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-keywords'));
});

/**
 * **Gegen den Index, den der Besucher bekommt.** Der erste Messversuch baute
 * ihn nur aus Artikeln und Suchwörtern, ohne die 24 Inhaltsseiten — und
 * meldete drei Fehler, die keine waren.
 *
 * > **Ein Prüfer, der einen anderen Index befragt als der Kunde, misst einen
 * > anderen Shop.**
 */
test('jedes geführte Keyword findet im ausgelieferten Index etwas', () => {
  if (!existsSync(SKRIPT) || !existsSync(KEYWORDS)) return; // ohne Bau keine Aussage
  const roh = readFileSync(SKRIPT, 'utf8').match(/window\.__SHOP__=(\{[\s\S]*?\});\n/);
  assert.ok(roh, 'shop.js trägt keine __SHOP__-Daten mehr — die Messung liefe ins Leere');
  const D = JSON.parse(roh[1]);
  assert.ok((D.seiten ?? []).length >= 20, `nur ${(D.seiten ?? []).length} Seiten im Index`);

  const index = baueSuchindex({
    artikel: D.artikel ?? [], seiten: D.seiten ?? [], suchwoerter: D.suchwoerter ?? [],
  });
  const keywords = [...new Set(readFileSync(KEYWORDS, 'utf8').trim().split('\n').slice(1)
    .map((z) => (z.match(/^[^,]*,[^,]*,("(?:[^"]|"")*"|[^,]*)/) ?? [])[1])
    .filter(Boolean)
    .map((f) => f.replace(/^"|"$/g, '').replaceAll('""', '"')))];

  const b = suchdeckungsbefund({ keywords, finde: (f) => suche(index, f, { grenze: 20 }) });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.geprueft >= 20, `nur ${b.geprueft} Keywords — das misst nichts`);
});
