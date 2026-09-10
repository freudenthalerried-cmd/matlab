/**
 * Die Untergrenze auf den Kundenseiten.
 *
 * **Befund vom 10. September 2026.** Verbindlich sind seit dem 3. September
 * 250 € netto Warenwert je Lieferung. 67 gebaute Seiten nannten sie. Eine
 * Wissensseite — die, deren ganzes Thema die Lieferkosten sind — nannte
 * „etwa 400 Euro", den Nulldurchgang einer Kostenrechnung vom 25. August mit
 * einer Marge, die am Tag darauf abgelöst wurde.
 *
 * > **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { untergrenzenbefund, betragAlsZahl, GRENZAUSSAGEN } from '../src/untergrenze.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));

test('ein deutscher Betrag wird als Zahl gelesen, nicht als Kommazahl', () => {
  assert.equal(betragAlsZahl('250'), 250);
  assert.equal(betragAlsZahl('250,00'), 250);
  assert.equal(betragAlsZahl('1.250,00'), 1250);
  assert.equal(betragAlsZahl('1.250'), 1250);
});

test('eine abweichende Grenze ist ein Befund', () => {
  const b = untergrenzenbefund(
    [{ name: 'wissen.md', text: 'Unter etwa 400 Euro netto Warenwert lohnt eine Lieferung nicht.' }],
    250,
  );
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'abweichende-grenze');
  assert.equal(b.meldungen[0].wert, 400);
  assert.equal(b.meldungen[0].zeile, 1);
});

test('die geltende Grenze ist keiner', () => {
  const b = untergrenzenbefund(
    [{ name: 'wissen.md', text: 'Unter 250 Euro netto Warenwert je Lieferung nimmt die Kasse nichts an.' }],
    250,
  );
  assert.equal(b.sauber, true);
  assert.equal(b.gefunden, 1);
});

test('alle drei Formen werden gefunden', () => {
  const text = [
    'Der Mindestbestellwert beträgt 250,00 € netto.',
    'Wir liefern ab 250 € netto Warenwert je Lieferung.',
    'Unter 250 Euro netto Warenwert nimmt die Kasse nichts an.',
  ].join('\n');
  const b = untergrenzenbefund([{ name: 'x.html', text }], 250);
  assert.equal(b.gefunden, 3);
  assert.equal(b.sauber, true);
});

/**
 * Der erste Entwurf las den **ganzen Satz** und meldete auf `lieferung.html`
 * die Frachttabelle: 75,50 € Pauschale und 7,50 € Kranentladung standen im
 * selben Satz wie das Wort „Mindestbestellwert". Gefangen wird der Betrag
 * **innerhalb** der Grenzaussage.
 */
test('Beträge daneben sind keine Grenze', () => {
  const b = untergrenzenbefund([{
    name: 'lieferung.html',
    text: 'Mindestbestellwert 250 € netto Warenwert je Lieferung — die Pauschale '
      + 'beträgt 75,50 € netto, die Kranentladung 7,50 € je Hub.',
  }], 250);
  assert.equal(b.sauber, true);
  assert.equal(b.gefunden, 1);
});

/**
 * Dieselbe Ziffer, eine andere Sache: § 11 Abs 6 UStG zieht die
 * Kleinbetragsgrenze bei 400 € brutto. Ein Prüfer, der jede 400 meldet,
 * meldet das Umsatzsteuergesetz.
 */
test('die Kleinbetragsgrenze des § 11 UStG ist keine Bestellgrenze', () => {
  const b = untergrenzenbefund([{
    name: 'agb.html',
    text: 'Auf Rechnungen über 400 € brutto steht die UID des Ausstellers. '
      + 'Der Mindestbestellwert beträgt 250 € netto Warenwert je Lieferung.',
  }], 250);
  assert.equal(b.sauber, true);
  assert.equal(b.gefunden, 1);
});

test('ein Satzende beendet die Aussage', () => {
  const b = untergrenzenbefund([{
    name: 'x.html',
    text: 'Die Fracht kostet 75,50 €. Der Warenwert steht daneben.',
  }], 250);
  assert.equal(b.gefunden, 0, 'über den Punkt hinweg entsteht sonst eine Aussage, die niemand geschrieben hat');
});

test('ohne hinterlegte Grenze weigert sich der Prüfer', () => {
  const b = untergrenzenbefund([{ name: 'x', text: 'Unter 250 € netto Warenwert.' }], null);
  assert.equal(b.messbar, false);
  assert.match(b.grund, /mindestbestellwertNetto/);
});

/**
 * Ein Lauf ohne Fundstelle ist kein grüner Lauf. Er hat nichts gemessen und
 * sagt „sauber" — dieselbe Falle wie bei den Kartenseiten.
 */
test('ein Lauf ohne Fundstellen meldet, dass er nichts gemessen hat', () => {
  const b = untergrenzenbefund([{ name: 'x', text: 'Kein Wort über Grenzen.' }], 250, 1);
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen[0].regel, 'nichts-gemessen');
});

test('jede Form fängt genau einen Betrag ein', () => {
  assert.ok(GRENZAUSSAGEN.length >= 3, 'ohne Formen prüft diese Schleife nichts');
  for (const a of GRENZAUSSAGEN) {
    assert.equal(new RegExp(a.muster.source).exec('Mindestbestellwert 250 € netto Warenwert')?.length ?? 2, 2,
      `${a.id}: ein Muster mit zwei Fanggruppen liest den falschen Betrag`);
  }
});

/* ------------------------------------------------------------------ *
 * Gegen den Bestand — der Grund, warum es diese Datei gibt.
 * ------------------------------------------------------------------ */

const GRENZE = JSON.parse(
  readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'),
).mindestbestellwertNetto;

test('jede Grenzaussage in inhalte/ nennt die hinterlegte Grenze', () => {
  const flaechen = [];
  for (const art of ['wissen', 'gruppen', 'system']) {
    const ordner = join(SHOP, 'inhalte', art);
    for (const datei of readdirSync(ordner).sort()) {
      if (!datei.endsWith('.md')) continue;
      flaechen.push({ name: `${art}/${datei}`, text: readFileSync(join(ordner, datei), 'utf8') });
    }
  }
  const b = untergrenzenbefund(flaechen, GRENZE, 1);
  assert.deepEqual(b.meldungen, [], 'siehe npm run pruefe-inhalte');
});

test('jede Grenzaussage auf den gebauten Seiten nennt dieselbe Zahl', (t) => {
  const site = join(SHOP, 'ausgabe', 'site');
  if (!existsSync(site)) return t.skip('ausgabe/site fehlt — zuerst npm run website');
  const flaechen = [];
  const gehe = (ordner) => {
    for (const e of readdirSync(ordner)) {
      const pfad = join(ordner, e);
      if (statSync(pfad).isDirectory()) gehe(pfad);
      else if (e.endsWith('.html')) flaechen.push({ name: pfad.split('/site/')[1], text: readFileSync(pfad, 'utf8') });
    }
  };
  gehe(site);
  const b = untergrenzenbefund(flaechen, GRENZE, 40);
  assert.deepEqual(b.meldungen, [], 'siehe npm run pruefe-seiten');
  assert.ok(b.gefunden >= 40, `nur ${b.gefunden} Grenzaussagen — der Bestand trägt mehr`);
});
