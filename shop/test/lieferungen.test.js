/**
 * Wie viele Lieferungen ein Warenkorb wird — und was der Kunde darüber liest.
 *
 * **Befund vom 6. September 2026.** Vier Stellen sagten dem Kunden: *„Werden
 * mehrere **Hersteller** bestellt, entstehen mehrere Lieferungen, und die
 * Grenze gilt für jede einzelne."* Der Katalog führt 46 Artikel von **einem**
 * Lieferanten, und der Rechenkern teilt nach `lieferantId`. Eine fünfte Stelle
 * wusste es und sagte es auch — der Hinweiskasten auf der Abnahmeseite.
 *
 * > **Der Bestand wusste es an einer Stelle und sagte an vier anderen das
 * > Gegenteil.**
 *
 * Die Richtung ist die vorsichtige, und deshalb fällt sie nicht auf: Wer
 * Baumit, Schiedel und Soudal in den Korb legt, liest, er brauche dreimal
 * 250 €. **Abgeschreckte Körbe stehen in keiner Abrechnung.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { BEHAUPTUNG, lieferantenzahl, lieferungsbefund, lieferungssatz } from '../src/lieferungen.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

test('die Lieferantenzahl kommt aus den Artikeln, nicht aus einer Notiz', () => {
  assert.equal(lieferantenzahl([{ lieferantId: 'a' }, { lieferantId: 'a' }, { lieferantId: 'b' }]), 2);
  assert.equal(lieferantenzahl([{ lieferantId: 'a' }, { lieferantId: 'a' }]), 1);
  assert.equal(lieferantenzahl([]), 0);
  assert.equal(lieferantenzahl([{}, { lieferantId: null }]), 0);
});

test('bei einem Lieferanten sagt der Satz „eine Lieferung" — und was sich ändert, wenn ein zweiter kommt', () => {
  const s = lieferungssatz(1);
  assert.match(s, /einem Lieferanten/);
  assert.match(s, /eine\s+Lieferung/);
  assert.match(s, /zweiter Lieferant/, 'die Regel je Lieferung darf nicht verschwinden');
});

test('bei mehreren Lieferanten gilt die Grenze je Lieferung', () => {
  const s = lieferungssatz(2);
  assert.match(s, /getrennten Lieferungen/);
  assert.match(s, /für jede einzelne/);
});

test('die Behauptung wird am Satzbau erkannt, nicht am Wort', () => {
  assert.ok(BEHAUPTUNG.test('Werden mehrere Hersteller bestellt, entstehen mehrere Lieferungen, und die Grenze gilt.'));
  assert.ok(BEHAUPTUNG.test('Bei mehreren Lieferanten entstehen mehrere Lieferungen.'));
  // Der Hinweiskasten der Abnahmeseite nennt beide Wörter und sagt das
  // Gegenteil. Schlüge die Regel hier an, träfe sie ausgerechnet die Stelle,
  // die es von Anfang an richtig hatte.
  assert.ok(!BEHAUPTUNG.test('Der Hinweis stammt aus dem ursprünglichen Zuschnitt mit mehreren '
    + 'Herstellern. Das jetzige Sortiment läuft über einen Lieferanten, also kommt eine '
    + 'Bestellung in einer Sendung.'));
  assert.ok(!BEHAUPTUNG.test(lieferungssatz(1)), 'der neue Satz darf nicht sein eigener Fund sein');
});

test('ein Text, der bei einem Lieferanten mehrere Lieferungen verspricht, ist der Fund', () => {
  const b = lieferungsbefund({
    lieferanten: 1,
    texte: [
      { name: 'lieferung.html', text: 'Werden mehrere Hersteller bestellt, entstehen mehrere Lieferungen.' },
      { name: 'index.html', text: 'nichts dazu' },
      { name: 'kasse.html', text: 'nichts dazu' },
    ],
  });
  const m = b.meldungen.find((x) => x.regel === 'mehrere-lieferungen-ohne-zweiten-lieferanten');
  assert.ok(m, 'die Meldung fehlt');
  assert.equal(m.wo, 'lieferung.html');
});

test('mit zwei Lieferanten ist derselbe Satz richtig', () => {
  const b = lieferungsbefund({
    lieferanten: 2,
    texte: [
      { name: 'lieferung.html', text: 'Werden mehrere Hersteller bestellt, entstehen mehrere Lieferungen.' },
      { name: 'index.html', text: '' }, { name: 'kasse.html', text: '' },
    ],
  });
  assert.deepEqual(b.meldungen, []);
});

test('zu wenige Texte sind kein grüner Befund', () => {
  const b = lieferungsbefund({ lieferanten: 1, texte: [{ name: 'x', text: '' }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-texte'));
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

test('keine gebaute Seite verspricht mehr Lieferungen, als es Lieferanten gibt', () => {
  const katalogDatei = join(SHOP, 'data', 'katalog-baustoff.json');
  if (!existsSync(SITE) || !existsSync(katalogDatei)) return; // ohne Bau keine Aussage

  const katalog = JSON.parse(readFileSync(katalogDatei, 'utf8'));
  const lieferanten = lieferantenzahl(katalog.artikel ?? katalog);
  assert.ok(lieferanten >= 1, 'kein Lieferant im Katalog — dann misst diese Probe nichts');

  const texte = [];
  const gehe = (ordner, vorne) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      if (e.isDirectory()) { gehe(join(ordner, e.name), `${vorne}${e.name}/`); continue; }
      if (!/\.(html|txt)$/.test(e.name)) continue;
      const roh = readFileSync(join(ordner, e.name), 'utf8');
      texte.push({ name: `${vorne}${e.name}`, text: roh.replace(/<[^>]+>/g, ' ') });
    }
  };
  gehe(SITE, '');

  const b = lieferungsbefund({ texte, lieferanten, mindestens: 60 });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
});

test('die Lieferseite sagt, was aus einem Warenkorb wird', () => {
  const datei = join(SITE, 'lieferung.html');
  if (!existsSync(datei)) return;
  const katalog = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8'));
  const text = readFileSync(datei, 'utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // Nicht „irgendein Satz dazu", sondern der abgeleitete: Steht ein anderer
  // da, ist er von Hand geschrieben und läuft ab.
  assert.ok(text.includes(lieferungssatz(lieferantenzahl(katalog.artikel ?? katalog)).slice(0, 60)),
    'die Lieferseite trägt den abgeleiteten Satz nicht');
});
