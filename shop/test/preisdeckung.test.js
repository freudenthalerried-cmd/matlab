import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { gebotstragendeSkus, preisdeckungsbefund, RETTUNGSWEG, rettungswegbefund } from '../src/preisdeckung.js';

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

// **Ergänzt am 9. September 2026, nachmittags.** Der Behälter wurde neu
// gestartet — genau das hat am 8. September die Preisdatei gekostet. Der
// Rettungsweg (Rückrechnung aus der gebauten Ausgabe) wurde an diesem Tag zum
// ersten Mal nachgeprüft statt angenommen: 46 von 46 Einkaufspreisen auf den
// Cent identisch. Er hängt daran, dass `ausgabe/site/shop.js` versioniert ist
// — und gebaute Ausgaben versioniert man normalerweise nicht.
test('vorhanden und versioniert meldet nichts', () => {
  const b = rettungswegbefund(() => true, () => true);
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.geprueft, RETTUNGSWEG.length);
  assert.ok(b.geprueft > 0, 'ein leerer Rettungsweg prüfte nichts');
});

test('eine fehlende Datei ist ein Befund', () => {
  const b = rettungswegbefund(() => false, () => true);
  assert.equal(b.meldungen.length, RETTUNGSWEG.length);
  assert.equal(b.meldungen[0].regel, 'rettungsweg-fehlt');
});

test('vorhanden, aber nicht versioniert ist genauso ein Befund', () => {
  // Der eigentliche Punkt: Wer `ausgabe/` in .gitignore schreibt, tut das
  // Übliche und kappt den einzigen Weg zurück. Niemand erführe es bis zum
  // nächsten Verlust — dann ist es zu spät.
  const b = rettungswegbefund(() => true, () => false);
  assert.equal(b.meldungen.length, RETTUNGSWEG.length);
  assert.equal(b.meldungen[0].regel, 'rettungsweg-nicht-versioniert');
  assert.match(b.meldungen[0].text, /nächsten Neuaufsetzen/);
});

test('das Register nennt genau die Datei, aus der zurückgerechnet wird', () => {
  // Zwei Listen für dieselbe Sache wären eine, die niemand pflegt: Steht hier
  // eine Datei, die `preiswiederherstellung.mjs` nicht liest, führt das
  // Register etwas, das den Rettungsweg gar nicht trägt.
  const werkzeug = readFileSync(
    new URL('../bin/preiswiederherstellung.mjs', import.meta.url), 'utf8');
  // Ohne diese Zusicherung liefe die Schleife bei leerem Register durch und
  // prüfte nichts — `pruefe-tests` hat genau das hier gefunden, im Haken,
  // bevor der Commit hinausging.
  assert.ok(RETTUNGSWEG.length > 0, 'ein leeres Register prüfte nichts');
  for (const pfad of RETTUNGSWEG) {
    const teile = pfad.split('/');
    assert.ok(werkzeug.includes(teile[teile.length - 1]),
      `${pfad} steht im Register, wird aber vom Rettungswerkzeug nicht gelesen`);
  }
});
