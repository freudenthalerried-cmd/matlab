/**
 * Der Abstand zur Liste — und wo er fehlt, warum.
 *
 * **Befund vom 10. September 2026.** Die Wissensseite „Was Baumeisterpreis
 * heißt" sagt zweimal, der Abstand zur Liste stehe *„auf jeder
 * Artikelkarte"*. Gemessen stand er auf **39 von 46**. Drei der sieben
 * übrigen tragen „Beipack" — die Seite erklärt ihn ausdrücklich als *kein
 * Preisvorteil*, das ist die Auskunft. **Vier trugen nichts.**
 *
 * > **Eine leere Stelle ist keine Auskunft: Sie sieht aus wie ein Artikel
 * > ohne Vorteil, und der Leser kann beides nicht unterscheiden.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { AUSKUENFTE, karten, vorteilsangabebefund } from '../src/vorteilsangabe.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

const karte = (inhalt) => `<div class="karte"><a href="artikel/POS-1.html">x</a>${inhalt}</div>`;

test('die Karten werden an ihrer Marke geschnitten, nicht an der Verschachtelung', () => {
  const html = `<main>${karte('a')}${karte('b')}${karte('c')}</main>`;
  assert.equal(karten(html).length, 3);
  assert.equal(karten('<main>ohne Karten</main>').length, 0);
});

test('jede der drei Auskünfte zählt', () => {
  assert.equal(AUSKUENFTE.length, 3);
  for (const [inhalt, id] of [
    ['<span class="marker vorteil">31 % unter Liste</span>', 'vorteil'],
    ['<span class="marker beipack">Beipack</span>', 'beipack'],
    ['<span class="marker offen">Listenpreis nicht bekannt</span>', 'listenpreis-offen'],
    ['<span class="marker offen">Listenpreis des Lieferanten nicht bekannt</span>', 'listenpreis-offen'],
  ]) {
    const b = vorteilsangabebefund([{ name: 'x', html: karte(inhalt) }], 1);
    assert.deepEqual(b.meldungen, [], inhalt);
    assert.equal(b.nach[id], 1, inhalt);
  }
});

test('eine Karte ohne jede Auskunft ist der Fund', () => {
  const b = vorteilsangabebefund([{ name: 'index.html', html: karte('nur ein Preis: 1,93 €') }], 1);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'karte-ohne-auskunft');
  assert.match(b.meldungen[0].wo, /POS-1/);
});

test('ein Lauf ohne Karten meldet, dass er nichts gemessen hat', () => {
  const b = vorteilsangabebefund([{ name: 'x', html: '<main>leer</main>' }], 40);
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-karten'));
});

test('jede Artikelkarte im Bestand sagt, woran sie ist', (t) => {
  if (!existsSync(SITE)) return t.skip('ohne Bau keine Aussage');
  const seiten = [];
  const gehe = (ordner) => {
    for (const e of readdirSync(ordner)) {
      const pfad = join(ordner, e);
      if (statSync(pfad).isDirectory()) { gehe(pfad); continue; }
      if (e.endsWith('.html')) seiten.push({ name: pfad.split('/site/')[1], html: readFileSync(pfad, 'utf8') });
    }
  };
  gehe(SITE);
  const b = vorteilsangabebefund(seiten, 200);
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  // Und die Verteilung: Ohne Karten mit offenem Listenpreis prüfte dieser
  // Testfall die Auskunft nicht, die am 10. September gefehlt hat.
  assert.ok(b.nach['listenpreis-offen'] > 0, 'keine Karte mit offenem Listenpreis — dann ist die Regel unbelegt');
  assert.ok(b.nach.vorteil > b.nach.beipack, 'der Regelfall bleibt die Zahl');
});
