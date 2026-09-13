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
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  BEHAUPTUNG, lieferantenzahl, lieferungsbefund, lieferungssatz,
  MEHRLIEFERUNG, SATZBEDINGUNG, FLAECHENBEDINGUNG, saetzeVon, mehrlieferungsbefund,
} from '../src/lieferungen.js';
import { AGB_GLIEDERUNG, LIEFERHINWEISE } from '../src/rechtstexte.js';

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

/* ------------------------------------------------------------------ *
 * Die zweite Fassung — 10. September 2026
 *
 * `BEHAUPTUNG` kennt eine Formulierung: die, die am 6. September berichtigt
 * wurde. Gemessen über 127 Kundenflächen stand dieselbe Behauptung an sieben
 * weiteren Stellen — AGB Punkt 4, die Lieferhinweise der
 * Auftragsbestätigung, das Angebot und eine Wissensseite.
 *
 * > **Ein Prüfer, der aus einem Beispielsatz gebaut wird, erkennt den
 * > Beispielsatz.**
 * ------------------------------------------------------------------ */

test('die alten Formulierungen des Bestands kommen alle durch BEHAUPTUNG', () => {
  // Der Nachweis, warum es eine zweite Fassung braucht: nicht behauptet,
  // sondern hier festgehalten. Fiele einer dieser Sätze doch unter das alte
  // Muster, wäre die Begründung dieses Moduls falsch.
  for (const satz of [
    'Teillieferungen je Lieferant sind der Regelfall.',
    'Eine Bestellung erreicht die Baustelle deshalb in mehreren Sendungen an verschiedenen Tagen.',
    'Wir bündeln, was auf dieselbe Baustelle geht, statt drei Teillieferungen zu fahren.',
    'Lieferung im Streckengeschäft ab Werk der Hersteller; Teillieferungen je Lieferant sind der Regelfall.',
  ]) {
    assert.equal(BEHAUPTUNG.test(satz), false, `alt: ${satz}`);
    assert.equal(MEHRLIEFERUNG.test(satz), true, `neu: ${satz}`);
    assert.equal(SATZBEDINGUNG.test(satz), false, `Bedingung erfunden: ${satz}`);
  }
});

test('die richtigen Sätze des Bestands tragen ihre Bedingung', () => {
  for (const satz of [
    'Kommt ein zweiter Lieferant dazu, entstehen mehrere Lieferungen, und sie gilt für jede einzelne.',
    'Bei mehreren Lieferungen gilt er je Lieferung, weil Anfahrt und Verpackung je Lieferung anfallen.',
    'Artikel verschiedener Lieferanten kommen in getrennten Lieferungen.',
  ]) {
    assert.equal(MEHRLIEFERUNG.test(satz), true, `nicht gesehen: ${satz}`);
    assert.equal(SATZBEDINGUNG.test(satz), true, `nicht gedeckt: ${satz}`);
  }
});

test('„mehreren" allein deckt sich nicht selbst', () => {
  // Die Falle des ersten Entwurfs: „erreicht die Baustelle in mehreren
  // Sendungen" wäre durch sein eigenes Wort gedeckt gewesen.
  assert.equal(SATZBEDINGUNG.test('erreicht die Baustelle in mehreren Sendungen'), false);
  assert.equal(SATZBEDINGUNG.test('Bei mehreren Lieferungen gilt er je Lieferung'), true);
});

test('die Fläche darf tragen, was der Satz nicht sagt', () => {
  const b = mehrlieferungsbefund([
    { name: 'abnahme', text: 'Eine Bestellung erreicht die Baustelle in mehreren Sendungen. '
      + 'Das jetzige Sortiment läuft über einen Lieferanten, also kommt eine Bestellung in einer Sendung.' },
    { name: 'agb', text: 'Teillieferungen je Lieferant sind der Regelfall.' },
    { name: 'index', text: 'nichts dazu' },
  ], 1, 3);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].wo, 'agb');
  assert.equal(b.gesehen, 2, 'beide Aussagen gehören gesehen, nur eine gemeldet');
});

test('ein beliebiges Bedingungswort auf der Seite deckt nichts', () => {
  // Der Freibrief, der überall gilt: „wenn" steht auf jeder Seite.
  const b = mehrlieferungsbefund([
    { name: 'x', text: 'Teillieferungen sind der Regelfall. Wenn Sie Fragen haben, rufen Sie an.' },
    { name: 'y', text: '' }, { name: 'z', text: '' },
  ], 1, 3);
  assert.equal(b.meldungen.length, 1, 'FLAECHENBEDINGUNG ist nicht „irgendein Bedingungswort"');
  assert.equal(FLAECHENBEDINGUNG.test('Wenn Sie Fragen haben'), false);
});

test('mit dem zweiten Lieferanten schaltet sich die Regel selbst ab', () => {
  const flaechen = [
    { name: 'agb', text: 'Teillieferungen je Lieferant sind der Regelfall.' },
    { name: 'y', text: '' }, { name: 'z', text: '' },
  ];
  assert.equal(mehrlieferungsbefund(flaechen, 2, 3).meldungen.length, 0);
  assert.equal(mehrlieferungsbefund(flaechen, 1, 3).meldungen.length, 1);
});

test('zu wenige Flächen sind kein grüner Befund', () => {
  const b = mehrlieferungsbefund([{ name: 'x', text: '' }], 1, 20);
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-flaechen'));
});

test('Sätze werden über Zeilenumbrüche hinweg getrennt', () => {
  // Markdown bricht mitten im Satz um; zeilenweise wäre die Bedingung
  // unsichtbar, die eine Zeile tiefer steht.
  assert.deepEqual(saetzeVon('Erster Satz.\nZweiter\nSatz.'), ['Erster Satz.', 'Zweiter Satz.']);
});

/* Gegen den Bestand: alle Kundenflächen, die es gibt. */
test('keine Kundenfläche behauptet mehrere Lieferungen ohne ihre Bedingung', (t) => {
  if (!existsSync(SITE)) return t.skip('ausgabe/site fehlt — zuerst npm run website');
  const ohneTags = (h) => h.replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"');
  const flaechen = [];
  const gehe = (ordner, roh) => {
    for (const e of readdirSync(ordner)) {
      const pfad = join(ordner, e);
      if (statSync(pfad).isDirectory()) { gehe(pfad, roh); continue; }
      if (!e.endsWith('.html') && !e.endsWith('.md') && e !== 'llms.txt') continue;
      const text = readFileSync(pfad, 'utf8');
      flaechen.push({ name: pfad, text: roh || e.endsWith('.md') ? text : ohneTags(text) });
    }
  };
  gehe(SITE, false);
  gehe(join(SHOP, 'inhalte'), true);
  for (const p of AGB_GLIEDERUNG) flaechen.push({ name: `AGB Punkt ${p.nr}`, text: `${p.titel}. ${p.hinweis ?? ''}` });
  for (const h of LIEFERHINWEISE) flaechen.push({ name: `Lieferhinweis ${h.titel}`, text: `${h.titel}. ${h.text}` });

  const artikel = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')).artikel ?? [];
  const b = mehrlieferungsbefund(flaechen, lieferantenzahl(artikel), 60);
  assert.deepEqual(b.meldungen.map((m) => `${m.wo}: ${m.text}`), []);
  assert.ok(b.gesehen >= 20, `nur ${b.gesehen} Aussagen gesehen — der Bestand trägt mehr`);
});
