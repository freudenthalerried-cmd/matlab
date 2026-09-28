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

/*
 * **Die Regel selbst, gemessen — 15. September 2026.** `pruefe-regeln` führt
 * `eigenes-wort-ausgeschlossen` seit dem 6. September als Stelle, die kein
 * Testfall je hat feuern sehen: Im Bestand steht kein Ausschlusswort öfter im
 * eigenen Seitentext als die Grenze erlaubt — genau deshalb ist der Prüfer
 * grün, und genau deshalb sagt sein grünes Ergebnis nichts über die Regel.
 */
test('ein Ausschlusswort, das die eigenen Seiten oft benutzen, ist ein Befund', () => {
  const seitentext = 'Vergleich '.repeat(EIGENWORTGRENZE + 1);
  const b = ausschlussbefund({
    ausschluesse: [{ thema: 'Suche ohne Kaufabsicht', wort: 'vergleich' }],
    seitentext,
    mindestens: 1,
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['eigenes-wort-ausgeschlossen'],
    'ein Wort, das die eigenen Seiten so oft benutzen, trägt nicht die Absicht seines Themas');
  assert.equal(b.meldungen[0].wort, 'vergleich');
  assert.equal(b.gezaehlt[0].n, EIGENWORTGRENZE + 1);
});

test('genau an der Grenze ist noch kein Befund', () => {
  const b = ausschlussbefund({
    ausschluesse: [{ thema: 'Suche ohne Kaufabsicht', wort: 'vergleich' }],
    seitentext: 'Vergleich '.repeat(EIGENWORTGRENZE),
    mindestens: 1,
  });
  assert.deepEqual(b.meldungen, [], 'die Grenze ist das letzte erlaubte Vorkommen, nicht das erste verbotene');
});

test('ein mehrwortiger Ausschluss wird gar nicht gezählt', () => {
  const b = ausschlussbefund({
    ausschluesse: [{ thema: 'Fremdmarke', wort: 'baumit direkt' }],
    seitentext: 'Baumit direkt '.repeat(50),
    mindestens: 0,
  });
  assert.deepEqual(b.meldungen, [], 'eine Wendung trägt ihre Absicht in der Wendung');
  assert.equal(b.gezaehlt.length, 0);
});
