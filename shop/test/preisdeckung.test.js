import test from 'node:test';
import assert from 'node:assert/strict';

import { gebotstragendeSkus, preisdeckungsbefund } from '../src/preisdeckung.js';

const treffer = {
  Fassadendübel: [{ sku: 'POS-1' }, { sku: 'POS-2' }],
  'WDVS Kleber': [{ sku: 'POS-2' }],
  Systemaufbau: [{ titel: 'eine Wissensseite' }],
};
const finde = (frage) => treffer[frage] ?? [];

test('Ein Keyword auf einen überalterten Preis fällt auf, ein frisches nicht', () => {
  const alterJeSku = new Map([['POS-1', 104], ['POS-2', 21]]);
  const keywords = [
    { Keyword: 'Fassadendübel', Anzeigengruppe: 'WDVS' },
    { Keyword: 'WDVS Kleber', Anzeigengruppe: 'WDVS' },
  ];
  const b = preisdeckungsbefund({ keywords, finde, alterJeSku, grenzeTage: 90 });

  assert.equal(b.geprueft, 2);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.betroffen.map((x) => x.Keyword), ['Fassadendübel']);
  assert.deepEqual(b.betroffen[0].alt, [{ sku: 'POS-1', tage: 104 }]);
});

test('Ohne alten Preis meldet er nichts — und behauptet nichts', () => {
  const alterJeSku = new Map([['POS-1', 30], ['POS-2', 21]]);
  const b = preisdeckungsbefund({
    keywords: [{ Keyword: 'Fassadendübel', Anzeigengruppe: 'WDVS' }],
    finde,
    alterJeSku,
    grenzeTage: 90,
  });
  assert.equal(b.sauber, true);
  assert.deepEqual(b.betroffen, []);
});

test('Ein Treffer ohne Artikelnummer zählt nicht — eine Wissensseite hat keinen Preis', () => {
  const b = preisdeckungsbefund({
    keywords: [{ Keyword: 'Systemaufbau', Anzeigengruppe: 'WDVS' }],
    finde,
    alterJeSku: new Map([['POS-1', 999]]),
    grenzeTage: 90,
  });
  assert.equal(b.sauber, true);
});

test('Ein Artikel ohne bekanntes Preisalter wird nicht stillschweigend für frisch genommen', () => {
  // Er wird auch nicht eskaliert: Dafür ist `pruefe-preisalter` zuständig, das
  // einen fehlenden Preisstand als Fehler meldet. Zweimal dieselbe Regel wäre
  // zwei Stellen, an denen sie sich ändern kann.
  const b = preisdeckungsbefund({
    keywords: [{ Keyword: 'Fassadendübel', Anzeigengruppe: 'WDVS' }],
    finde,
    alterJeSku: new Map(),
    grenzeTage: 90,
  });
  assert.equal(b.sauber, true);
});

test('Gebotstragend ist die Vereinigung aus Korb und Wort', () => {
  const skus = gebotstragendeSkus({
    korbSkus: ['POS-9'],
    keywords: ['Fassadendübel'],
    finde,
  });
  assert.deepEqual([...skus].sort(), ['POS-1', 'POS-2', 'POS-9']);

  // Ohne Keywords bleibt der Korb, ohne Korb bleiben die Wörter.
  assert.deepEqual([...gebotstragendeSkus({ korbSkus: ['POS-9'], finde })], ['POS-9']);
  assert.deepEqual([...gebotstragendeSkus({ keywords: ['WDVS Kleber'], finde })], ['POS-2']);
});
