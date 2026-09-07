import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AUSSER, GRUND_MINDESTLAENGE, OHNE_FUNDSTELLE, ZAHLMUSTER, zahlenbefund,
} from '../src/zahlenherkunft.js';

const ORDNER = fileURLToPath(new URL('../inhalte', import.meta.url));

function inhaltsseiten() {
  const dateien = [];
  const gehe = (o) => {
    for (const n of readdirSync(o)) {
      const v = join(o, n);
      if (statSync(v).isDirectory()) gehe(v);
      else if (n.endsWith('.md')) dateien.push(v);
    }
  };
  gehe(ORDNER);
  return dateien.map((d) => ({ datei: relative(ORDNER, d), text: readFileSync(d, 'utf8') }));
}

test('Jede Zahl der Inhaltsseiten trägt eine Fundstelle oder einen Grund', () => {
  const seiten = inhaltsseiten();
  const { aussagen } = JSON.parse(readFileSync(join(ORDNER, 'quellen.json'), 'utf8'));
  assert.ok(seiten.length >= 10, `nur ${seiten.length} Inhaltsseiten gefunden`);

  const b = zahlenbefund({ seiten, aussagen });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.zahlen >= 10, `nur ${b.zahlen} Zahlen gemessen — das Muster greift nicht mehr`);
});

test('Die Vorlage mit erfundenen Zahlen wird nicht mitgemessen', () => {
  // `probe/` ist die Vorlage für `npm run pruefe-quellen --probe`. Ihre Zahlen
  // zu belegen hieße, die Vorlage zur Wahrheit zu erklären.
  assert.deepEqual(AUSSER, ['probe/']);
  const seiten = [{ datei: 'probe/probe.md', text: 'Er wiegt 42 kg und kostet 12,90 €.' }];
  const b = zahlenbefund({ seiten, aussagen: [], ohneFundstelle: [] });
  assert.equal(b.zahlen, 0);
  assert.equal(b.sauber, true);
});

test('Eine Zahl ohne Fundstelle fällt auf, eine begründete nicht', () => {
  const seiten = [{ datei: 'wissen/x.md', text: 'Das Gefälle beträgt 2 %.' }];

  const ohne = zahlenbefund({ seiten, aussagen: [], ohneFundstelle: [] });
  assert.deepEqual(ohne.meldungen.map((m) => m.regel), ['zahl-ohne-fundstelle']);

  const belegt = zahlenbefund({ seiten, aussagen: [{ text: 'Das Mindestgefälle beträgt 2 %.' }], ohneFundstelle: [] });
  assert.equal(belegt.sauber, true);

  const begruendet = zahlenbefund({
    seiten,
    aussagen: [],
    ohneFundstelle: [{ wert: '2 %', warum: 'x'.repeat(GRUND_MINDESTLAENGE) }],
  });
  assert.equal(begruendet.sauber, true);
  assert.equal(begruendet.ohneFundstelle, 1);
});

test('Ein Grund für eine Zahl, die es nicht mehr gibt, fällt auch auf', () => {
  const b = zahlenbefund({
    seiten: [{ datei: 'wissen/x.md', text: 'ohne Zahlen' }],
    aussagen: [],
    ohneFundstelle: [{ wert: '2 %', warum: 'x'.repeat(GRUND_MINDESTLAENGE) }],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-ohne-zahl']);

  const knapp = zahlenbefund({
    seiten: [{ datei: 'wissen/x.md', text: '2 %' }],
    aussagen: [],
    ohneFundstelle: [{ wert: '2 %', warum: 'zu kurz' }],
  });
  assert.deepEqual(knapp.meldungen.map((m) => m.regel), ['grund-zu-kurz']);
});

test('Jede Ausnahme nennt einen Grund, der einer ist', () => {
  assert.ok(OHNE_FUNDSTELLE.length >= 1, 'keine Ausnahme — die Schleife prüft nichts');
  for (const o of OHNE_FUNDSTELLE) {
    assert.ok(o.warum.length >= GRUND_MINDESTLAENGE, `„${o.wert}": der Grund ist zu knapp`);
    assert.match(o.wert, /^\d/, `„${o.wert}" ist kein Zahlwert`);
  }
});

test('Das Muster findet Einheiten, nicht bloß Ziffern', () => {
  const treffer = [...'2 % Gefälle, 500 mm Radius, 1.934 € netto, 14 Tage, 3 Stück'
    .matchAll(ZAHLMUSTER)].map((m) => `${m[1]} ${m[2]}`);
  assert.deepEqual(treffer, ['2 %', '500 mm', '1.934 €', '14 Tage']);
});
