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
// **Auch die zurückgestellten** — seit dem 6. September stehen sie in einer
// eigenen Datei, statt in keiner. Die Regel gilt für jedes Wort, auf das dieser
// Betrieb je bietet, nicht für die, auf die er zuerst bietet.
const SPAETER = join(SHOP, 'ausgabe', 'kampagne', 'keywords-zurueckgestellt.csv');

const viele = (n) => Array.from({ length: n }, (_, i) => `wort${i}`);

test('ein Keyword ohne jeden Treffer ist der Fund', () => {
  const b = suchdeckungsbefund({
    keywords: [...viele(10), 'gibt es nicht'],
    finde: (f) => (f === 'gibt es nicht' ? [] : [{ art: 'artikel', titel: 'x' }]),
    // Das echte Register hält seine eigenen Wörter gegen die Liste; hier wird
    // die Regel geprüft und nicht der Bestand.
    systemfragen: [],
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
    systemfragen: [{ keyword: 'WDVS System kaufen', warum: 'x'.repeat(120) }],
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
  const zeilenVon = (datei) => (existsSync(datei)
    ? readFileSync(datei, 'utf8').trim().split('\n').slice(1)
    : []);
  const keywords = [...new Set([...zeilenVon(KEYWORDS), ...zeilenVon(SPAETER)]
    .map((z) => (z.match(/^[^,]*,[^,]*,("(?:[^"]|"")*"|[^,]*)/) ?? [])[1])
    .filter(Boolean)
    .map((f) => f.replace(/^"|"$/g, '').replaceAll('""', '"')))];
  assert.ok(existsSync(SPAETER), 'die zurückgestellten Keywords stehen in keiner Datei');

  const b = suchdeckungsbefund({ keywords, finde: (f) => suche(index, f, { grenze: 20 }) });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.geprueft >= 20, `nur ${b.geprueft} Keywords — das misst nichts`);
});

test('Ein Wort mehr, ein Treffer weniger — das ist keine Systemfrage', () => {
  // „Putzgrund" fand den Artikel, „Putzgrund Fassade" nicht: Die Suche
  // verlangt alle Wortstämme. Wer mehr tippt, bekommt weniger — und dafür
  // wäre bezahlt worden.
  const b = suchdeckungsbefund({
    keywords: [...viele(10), 'Putzgrund Fassade'],
    finde: (f) => {
      if (f === 'Putzgrund Fassade') return [{ art: 'gruppe', titel: 'WDVS-Komponenten' }];
      return [{ art: 'artikel', titel: 'x' }];
    },
    systemfragen: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['wort-mehr-treffer-weniger']);
  assert.match(b.meldungen[0].text, /„Putzgrund" schon|„Fassade" schon/);
});

test('Ein einzelnes Wort ohne Artikel braucht einen Grund, keine kürzere Fassung', () => {
  const b = suchdeckungsbefund({
    keywords: [...viele(10), 'Systemkamin'],
    finde: (f) => (f === 'Systemkamin' ? [{ art: 'gruppe', titel: 'Kaminsystem' }] : [{ art: 'artikel', titel: 'x' }]),
    systemfragen: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['keyword-ohne-artikel-ohne-grund']);

  const mitGrund = suchdeckungsbefund({
    keywords: [...viele(10), 'Systemkamin'],
    finde: (f) => (f === 'Systemkamin' ? [{ art: 'gruppe', titel: 'Kaminsystem' }] : [{ art: 'artikel', titel: 'x' }]),
    systemfragen: [{ keyword: 'Systemkamin', warum: 'x'.repeat(120) }],
  });
  assert.deepEqual(mitGrund.meldungen, []);
});

test('Ein Grund für ein Wort, das niemand mehr führt, fällt auf', () => {
  const b = suchdeckungsbefund({
    keywords: viele(10),
    finde: () => [{ art: 'artikel', titel: 'x' }],
    systemfragen: [{ keyword: 'gibt es nicht mehr', warum: 'x'.repeat(120) }],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-ohne-keyword']);
});

test('Jede Systemfrage im Register nennt einen Grund, der einer ist', async () => {
  const { SYSTEMFRAGEN } = await import('../src/suchdeckung.js');
  assert.ok(SYSTEMFRAGEN.length >= 1, 'leeres Register — die Schleife prüft nichts');
  for (const f of SYSTEMFRAGEN) {
    assert.ok(f.keyword.length > 3, `„${f.keyword}" ist kein Keyword`);
    assert.ok(f.warum.length >= 120, `„${f.keyword}": der Grund ist zu knapp`);
  }
});
