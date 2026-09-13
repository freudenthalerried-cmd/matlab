/**
 * **Ausschlüsse gegen den eigenen Text — 6. September 2026.**
 *
 * Die Kampagne schloss „vergleich" als „Suche ohne Kaufabsicht" aus. Auf 39
 * Artikelseiten steht *„Der Vergleich bezieht sich auf die Liste unseres
 * Lieferanten"* — der Satz, der das Verkaufsargument dieses Shops trägt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { EIGENWORTGRENZE, ausschlussbefund, eigenvorkommen } from '../src/ausschluss.js';
import { hauptbereichText } from '../bin/kampagne.mjs';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

test('gezählt wird das ganze Wort, nicht der Wortteil', () => {
  assert.equal(eigenvorkommen('einzeln', 'einzelne Platten einzeln geliefert'), 1);
  assert.equal(eigenvorkommen('test', 'Der Test und die Testreihe'), 1);
});

test('ein mehrwortiger Ausschluss wird nicht gezählt — er trägt seine Absicht in der Wendung', () => {
  assert.equal(eigenvorkommen('was ist', 'was ist das'), null);
});

test('ein Ausschluss über der Grenze wird gemeldet', () => {
  const text = Array(EIGENWORTGRENZE + 1).fill('Der Vergleich zur Liste.').join(' ');
  const b = ausschlussbefund({
    ausschluesse: Array.from({ length: 20 }, (_, i) => ({ thema: 'x', wort: `wort${i}` }))
      .concat([{ thema: 'Suche ohne Kaufabsicht', wort: 'vergleich' }]),
    seitentext: text,
  });
  const m = b.meldungen.find((x) => x.wort === 'vergleich');
  assert.ok(m, b.meldungen.map((x) => x.text).join('\n'));
  assert.match(m.text, new RegExp(`${EIGENWORTGRENZE + 1}×`));
});

test('ein Ausschluss unter der Grenze wird nicht gemeldet', () => {
  const b = ausschlussbefund({
    ausschluesse: Array.from({ length: 20 }, (_, i) => ({ thema: 'x', wort: `wort${i}` }))
      .concat([{ thema: 'Preis und Menge', wort: 'muster' }]),
    seitentext: 'Ein Muster und noch ein Muster.',
  });
  assert.deepEqual(b.meldungen, []);
});

test('eine zu kurze Liste ist kein grüner Befund', () => {
  const b = ausschlussbefund({ ausschluesse: [{ thema: 'x', wort: 'abc' }], seitentext: 'nichts' });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-ausschluesse'));
});

/**
 * **Und gegen den echten Bestand.** Die Fälle darüber prüfen erfundene Texte;
 * dieser prüft, dass die Entscheidung von heute im Erzeugnis angekommen ist.
 */
test('kein Ausschluss der Kampagne steht häufig im eigenen Seitentext', () => {
  if (!existsSync(SITE)) return; // ohne Bau keine Aussage — und keine falsche
  const datei = join(SHOP, 'ausgabe', 'kampagne', 'negative-keywords.csv');
  if (!existsSync(datei)) return;

  let text = '';
  const gehe = (o) => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      const p = join(o, e.name);
      if (e.isDirectory()) { gehe(p); continue; }
      if (!e.name.endsWith('.html') || !statSync(p).isFile()) continue;
      const t = hauptbereichText(readFileSync(p, 'utf8'));
      if (t) text += ` ${t}`;
    }
  };
  gehe(SITE);
  assert.ok(text.length > 50_000, `nur ${text.length} Zeichen Seitentext — das misst nichts`);

  const ausschluesse = [...new Map(readFileSync(datei, 'utf8').trim().split('\n').slice(1)
    .map((z) => z.split(','))
    .map((t) => [t[2], { thema: t[1], wort: t[2] }])).values()];
  const b = ausschlussbefund({ ausschluesse, seitentext: text });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);

  // Und die Messung muss etwas gesehen haben: Wäre die Liste leer, bestünde
  // der Vergleich darüber stumm.
  assert.ok(b.gezaehlt.length >= 50, `nur ${b.gezaehlt.length} einwortige Ausschlüsse`);
});
