/**
 * **Referenzwarenkörbe gegen ihre Systemlisten — 6. September 2026.**
 *
 * Über `WARENKOERBE` steht seit dem 1. September: *„Wer je Artikel bietet,
 * bietet auf den Ein-Sack-Kunden … Gerechnet wird deshalb auf die Bestellung,
 * die eine Suche tatsächlich auslöst."* Im Korb der Gruppe „Dämmung" lag
 * **eine von vier** geführten Positionen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  MINDESTGRUND, korbbefund, nichtGefuehrt, positionen, positionsname,
} from '../src/warenkorbdeckung.js';
import { WARENKOERBE } from '../bin/kampagne.mjs';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ORDNER = join(SHOP, 'inhalte', 'system');

const liste = `| # | Position | Menge nach |\n|---|---|---|\n`
  + `| 1 | Platte | Fläche |\n`
  + `| 2 | Kleber *(nicht im Sortiment)* | Dosen |\n`
  + `| 3 | Bahn | Fläche |\n`;

test('die Positionen kommen aus der Tabelle, die Kennzeichnung wird abgetrennt', () => {
  assert.deepEqual(positionen(liste), ['Platte', 'Kleber *(nicht im Sortiment)*', 'Bahn']);
  assert.equal(nichtGefuehrt('Kleber *(nicht im Sortiment)*'), true);
  assert.equal(positionsname('Kleber *(nicht im Sortiment)*'), 'Kleber');
});

test('liegt jede geführte Position im Korb, meldet der Befund nichts', () => {
  const b = korbbefund({
    koerbe: { G: { positionen: [{ position: 'Platte' }, { position: 'Bahn' }] } },
    systemlisten: { G: liste },
  });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.uebersicht[0].gefuehrt, 2);
});

test('eine fehlende Position ohne Grund ist der Fund — der Fall vom 6. September', () => {
  const b = korbbefund({
    koerbe: { G: { positionen: [{ position: 'Platte' }] } },
    systemlisten: { G: liste },
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['position-ohne-grund']);
  assert.match(b.meldungen[0].text, /Bahn/);
});

test('ein knapper Grund ist keiner', () => {
  const knapp = { positionen: [{ position: 'Platte' }], ohne: [{ position: 'Bahn', warum: 'zu kurz' }] };
  assert.equal(korbbefund({ koerbe: { G: knapp }, systemlisten: { G: liste } }).sauber, false);
  const lang = { positionen: [{ position: 'Platte' }], ohne: [{ position: 'Bahn', warum: 'x'.repeat(MINDESTGRUND) }] };
  assert.equal(korbbefund({ koerbe: { G: lang }, systemlisten: { G: liste } }).sauber, true);
});

test('ein Grund für etwas, das im Korb liegt, wird gemeldet', () => {
  const korb = {
    positionen: [{ position: 'Platte' }, { position: 'Bahn' }],
    ohne: [{ position: 'Bahn', warum: 'x'.repeat(MINDESTGRUND) }],
  };
  const b = korbbefund({ koerbe: { G: korb }, systemlisten: { G: liste } });
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-fuer-etwas-im-korb'));
});

test('eine Korbposition, die in der Systemliste nicht steht, wird gemeldet', () => {
  const korb = { positionen: [{ position: 'Platte' }, { position: 'Bahn' }, { position: 'Erfundenes' }] };
  const b = korbbefund({ koerbe: { G: korb }, systemlisten: { G: liste } });
  assert.ok(b.meldungen.some((m) => m.regel === 'korbposition-nicht-in-der-liste'));
});

test('eine Systemliste ohne Korb ist ein Fund und kein stilles Bestehen', () => {
  const b = korbbefund({ koerbe: {}, systemlisten: { G: liste } });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['korb-fehlt']);
});

/**
 * **Und gegen den echten Bestand.** Ohne diesen Fall prüften die Fälle darüber
 * eine erfundene Tabelle.
 */
test('jeder echte Korb deckt seine Systemliste oder sagt, warum nicht', () => {
  if (!existsSync(ORDNER)) return;
  const systemlisten = {};
  for (const datei of readdirSync(ORDNER).filter((d) => d.endsWith('.md'))) {
    const text = readFileSync(join(ORDNER, datei), 'utf8');
    const gruppe = /^gruppe:\s*(.+)$/m.exec(text)?.[1]?.trim();
    if (gruppe) systemlisten[gruppe] = text;
  }
  assert.ok(Object.keys(systemlisten).length >= 3, 'zu wenige Systemlisten — das misst nichts');
  const b = korbbefund({ koerbe: WARENKOERBE, systemlisten });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.uebersicht.every((u) => u.gefuehrt >= 3), 'eine Liste ohne geführte Positionen');
});
