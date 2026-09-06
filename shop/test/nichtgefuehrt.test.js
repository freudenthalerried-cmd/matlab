/**
 * Was wir nicht führen, wofür aber bezahlt wird.
 *
 * **Befund vom 6. September 2026.** Der Shop führt 24 Wörter, von denen er
 * sagt, er führe sie nicht — mit Grund und redaktioneller Antwort. **Keines**
 * stand in der Ausschlussliste der Kampagne. Die Anzeigen laufen auf *Phrase*:
 * Sie erscheinen, sobald die Anfrage den Produktbegriff enthält, und „XPS
 * 80 mm Sockelschiene" enthält ihn.
 *
 * > **Ein Betrieb, der aufschreibt, was er nicht hat, und weiter dafür
 * > bezahlt, hat die Liste für den falschen Leser geschrieben.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { THEMA, ausschluesseAusRegister, deckungsbefund } from '../src/nichtgefuehrt.js';
import { EIGENWORTGRENZE, eigenvorkommen } from '../src/ausschluss.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

/* ------------------------------------------------------------------ *
 * Die Ableitung
 * ------------------------------------------------------------------ */

test('ein Wort ohne eigene Fundstelle wird ausgeschlossen', () => {
  const a = ausschluesseAusRegister({
    register: [{ wort: 'silikatputz' }],
    seitentext: 'Unser Oberputz ist ein Reibputz.',
  });
  assert.deepEqual(a.woerter, ['silikatputz']);
  assert.deepEqual(a.zurueckgehalten, []);
});

test('ein Wort, das im eigenen Text gewöhnliches Deutsch ist, bleibt zulässig — mit Grund', () => {
  const seitentext = Array.from({ length: EIGENWORTGRENZE }, () => 'Abdichtung').join(' und ');
  const a = ausschluesseAusRegister({ register: [{ wort: 'abdichtung' }], seitentext });
  assert.deepEqual(a.woerter, []);
  assert.equal(a.zurueckgehalten.length, 1);
  assert.equal(a.zurueckgehalten[0].vorkommen, EIGENWORTGRENZE);
  assert.match(a.zurueckgehalten[0].grund, /eigenen Seitentext/);
});

test('knapp unter der Grenze wird ausgeschlossen — die Grenze ist gemessen, nicht gefühlt', () => {
  const seitentext = Array.from({ length: EIGENWORTGRENZE - 1 }, () => 'Abdichtung').join(' und ');
  const a = ausschluesseAusRegister({ register: [{ wort: 'abdichtung' }], seitentext });
  assert.deepEqual(a.woerter, ['abdichtung']);
});

test('worauf geboten wird, wird nicht ausgeschlossen', () => {
  const a = ausschluesseAusRegister({
    register: [{ wort: 'drainage' }],
    seitentext: 'nichts dazu',
    keywords: ['Drainage Grundmauerschutz'],
  });
  assert.deepEqual(a.woerter, []);
  assert.match(a.zurueckgehalten[0].grund, /Drainage Grundmauerschutz/);
});

test('das Thema steht am Eintrag, damit die Zeile im CSV ihre Herkunft nennt', () => {
  assert.equal(THEMA, 'Nicht im Sortiment');
});

/* ------------------------------------------------------------------ *
 * Der Abgleich, in beide Richtungen
 * ------------------------------------------------------------------ */

const register = (n) => Array.from({ length: n }, (_, i) => ({ wort: `wort${i}` }));

test('ein Registerwort ohne Ausschluss und ohne Grund ist der Fund', () => {
  const woerter = register(12);
  const b = deckungsbefund({
    register: woerter,
    ausgeschlossen: woerter.slice(1).map((w) => w.wort),
    zurueckgehalten: [],
  });
  const m = b.meldungen.find((x) => x.regel === 'registerwort-ohne-ausschluss');
  assert.ok(m, 'registerwort-ohne-ausschluss fehlt');
  assert.equal(m.wort, 'wort0');
  assert.match(m.text, /zahlt für die Absage/);
});

test('ein zurückgehaltenes Wort ohne Grund ist ebenfalls ein Fund', () => {
  const woerter = register(12);
  const b = deckungsbefund({
    register: woerter,
    ausgeschlossen: woerter.slice(1).map((w) => w.wort),
    zurueckgehalten: [{ wort: 'wort0', grund: 'weil' }],
  });
  assert.ok(b.meldungen.some((m) => m.regel === 'zurueckgehalten-ohne-grund'));
});

test('mit Grund ist der Befund sauber', () => {
  const woerter = register(12);
  const b = deckungsbefund({
    register: woerter,
    ausgeschlossen: woerter.slice(1).map((w) => w.wort),
    zurueckgehalten: [{ wort: 'wort0', grund: 'steht 17× im eigenen Seitentext und trifft den eigenen Leser' }],
  });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.ausgeschlossen, 11);
});

test('die Rückrichtung: ein Ausschluss ohne Registereintrag', () => {
  const woerter = register(12);
  const b = deckungsbefund({
    register: woerter,
    ausgeschlossen: [...woerter.map((w) => w.wort), 'erfunden'],
    zurueckgehalten: [],
  });
  assert.ok(b.meldungen.some((m) => m.regel === 'ausschluss-ohne-register' && m.wort === 'erfunden'));
});

test('beides zugleich ist ein Widerspruch, kein Vorrang', () => {
  const woerter = register(12);
  const b = deckungsbefund({
    register: woerter,
    ausgeschlossen: woerter.map((w) => w.wort),
    zurueckgehalten: [{ wort: 'wort0', grund: 'ein Grund, der lang genug ist, um zu zählen' }],
  });
  assert.ok(b.meldungen.some((m) => m.regel === 'zugleich-aus-und-zurueckgehalten'));
});

test('ein zu kleines Register ist kein grüner Befund', () => {
  const b = deckungsbefund({ register: [{ wort: 'eins' }], ausgeschlossen: ['eins'], zurueckgehalten: [] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-register'));
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

/** Der Fließtext aller gebauten Seiten — grob, aber für eine Wortzählung genug. */
function seitentext() {
  const site = join(SHOP, 'ausgabe', 'site');
  if (!existsSync(site)) return '';
  let text = '';
  const gehe = (o) => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      const pfad = join(o, e.name);
      if (e.isDirectory()) { gehe(pfad); continue; }
      if (!e.name.endsWith('.html')) continue;
      text += ` ${readFileSync(pfad, 'utf8').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')}`;
    }
  };
  gehe(site);
  return text;
}

test('jedes Wort des Nicht-Sortiments ist ausgeschlossen — oder aus gemessenem Grund nicht', () => {
  const datei = join(SHOP, 'data', 'suchwoerter.json');
  const csv = join(SHOP, 'ausgabe', 'kampagne', 'negative-keywords.csv');
  if (!existsSync(datei) || !existsSync(csv)) return; // ohne Bau keine Aussage

  const eintraege = JSON.parse(readFileSync(datei, 'utf8'))._nichtAufgenommen ?? [];
  assert.ok(eintraege.length >= 20, `nur ${eintraege.length} Registerwörter`);

  const ausgeschlossen = new Set(readFileSync(csv, 'utf8').trim().split('\n').slice(1)
    .map((z) => z.split(',')[2]?.toLowerCase())
    .filter(Boolean));
  const text = seitentext();
  assert.ok(text.length > 10000, 'kein gebauter Seitentext — die Messung liefe ins Leere');

  const offen = [];
  for (const e of eintraege) {
    const wort = e.wort.toLowerCase();
    if (ausgeschlossen.has(wort)) continue;
    if ((eigenvorkommen(wort, text) ?? 0) >= EIGENWORTGRENZE) continue;
    offen.push(wort);
  }
  // „drainage" steht im geführten Keyword „Drainage Grundmauerschutz" der
  // zurückgestellten Gruppe Kanal — worauf geboten wird, wird nicht
  // ausgeschlossen. Der Fall steht namentlich hier, damit ein zweiter nicht
  // stillschweigend dazukommt.
  assert.deepEqual(offen, ['drainage']);
});

test('kein abgeleiteter Ausschluss ohne Eintrag im Register — die Rückrichtung im Bestand', () => {
  const datei = join(SHOP, 'data', 'suchwoerter.json');
  const csv = join(SHOP, 'ausgabe', 'kampagne', 'negative-keywords.csv');
  if (!existsSync(datei) || !existsSync(csv)) return;

  const woerter = new Set((JSON.parse(readFileSync(datei, 'utf8'))._nichtAufgenommen ?? [])
    .map((e) => e.wort.toLowerCase()));
  const zeilen = readFileSync(csv, 'utf8').trim().split('\n').slice(1)
    .map((z) => z.split(','))
    .filter((f) => f[1] === THEMA);
  assert.ok(zeilen.length >= 15, `nur ${zeilen.length} abgeleitete Ausschlüsse`);
  for (const f of zeilen) {
    assert.ok(woerter.has(f[2].toLowerCase()), `„${f[2]}" steht in keinem Registereintrag`);
  }
});
