import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { GRUND_MINDESTLAENGE, OHNE_WORTDECKUNG, doppeltesWort, korbtextbefund } from '../src/korbtext.js';
import { wortstaemme } from '../src/shopkern.js';
import { WARENKOERBE, warenkorbText } from '../bin/kampagne.mjs';

const KATALOG = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8',
));

test('Jeder Klartext nennt den Artikel, für den er steht', () => {
  const b = korbtextbefund({
    koerbe: WARENKOERBE,
    bezeichnungJeSku: new Map(KATALOG.artikel.map((a) => [a.sku, a.bezeichnung])),
    staemme: wortstaemme,
    text: warenkorbText,
  });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.positionen >= 10, `nur ${b.positionen} Positionen — die Schleife prüft fast nichts`);
});

test('Ein Klartext, der etwas anderes nennt, fällt auf', () => {
  const koerbe = {
    Mauerwerk: { umfang: '128 Stück', positionen: [{ sku: 'POS-1', menge: 128, was: 'Planziegel' }] },
  };
  const b = korbtextbefund({
    koerbe,
    bezeichnungJeSku: new Map([['POS-1', 'Ökotherm HL N+F 10 50 23,8 cm']]),
    staemme: wortstaemme,
    text: (k) => `${k.umfang} ${k.positionen[0].was}`,
    ohneWortdeckung: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['klartext-nennt-etwas-anderes']);
  assert.match(b.meldungen[0].text, /Planziegel/);
});

test('Ein doppeltes Wort im Korbtext fällt auf', () => {
  assert.equal(doppeltesWort('128 Planziegel Planziegel'), 'Planziegel');
  assert.equal(doppeltesWort('128 Stück Hochlochziegel'), null);
  // Kurze Wörter zählen nicht: „100 m² Kellerwand außen" darf „m" zweimal tragen.
  assert.equal(doppeltesWort('30 lfm Kanal DN 100: Rohre, Bögen'), null);

  const koerbe = {
    Mauerwerk: { umfang: '128 Planziegel', positionen: [{ sku: 'POS-1', menge: 128, was: 'Planziegel' }] },
  };
  const b = korbtextbefund({
    koerbe,
    bezeichnungJeSku: new Map([['POS-1', 'Planziegel 25 cm']]),
    staemme: wortstaemme,
    text: (k) => `${k.umfang} ${k.positionen[0].was}`,
    ohneWortdeckung: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['wort-doppelt']);
});

test('Eine begründete Ausnahme zählt — und ein Grund ohne Position fällt auf', () => {
  const koerbe = {
    Dämmung: { umfang: '100 m²', positionen: [{ sku: 'POS-2', menge: 100, was: 'Perimeterdämmung' }] },
  };
  const grund = { was: 'Perimeterdämmung', sku: 'POS-2', warum: 'x'.repeat(GRUND_MINDESTLAENGE) };
  const bezeichnungJeSku = new Map([['POS-2', 'XPS glatt SF 80 mm']]);

  const mit = korbtextbefund({
    koerbe, bezeichnungJeSku, staemme: wortstaemme, text: () => 'x', ohneWortdeckung: [grund],
  });
  assert.deepEqual(mit.meldungen, []);

  const veraltet = korbtextbefund({
    koerbe: { Dämmung: { umfang: '100 m²', positionen: [] } },
    bezeichnungJeSku,
    staemme: wortstaemme,
    text: () => 'x',
    ohneWortdeckung: [grund],
  });
  assert.deepEqual(veraltet.meldungen.map((m) => m.regel), ['grund-ohne-position']);
});

test('Eine Position ohne Artikel im Katalog fällt auf', () => {
  const b = korbtextbefund({
    koerbe: { X: { umfang: '1', positionen: [{ sku: 'POS-99999', menge: 1, was: 'irgendwas' }] } },
    bezeichnungJeSku: new Map(),
    staemme: wortstaemme,
    text: () => 'x',
    ohneWortdeckung: [],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['position-ohne-artikel']);
});

test('Jede Ausnahme nennt einen Grund, der einer ist', () => {
  assert.ok(OHNE_WORTDECKUNG.length >= 1, 'leeres Register — die Schleife prüft nichts');
  for (const o of OHNE_WORTDECKUNG) {
    assert.match(o.sku, /^POS-\d+$/, `„${o.was}" nennt keine Artikelnummer`);
    assert.ok(o.warum.length >= GRUND_MINDESTLAENGE, `„${o.was}": der Grund ist zu knapp`);
  }
});
