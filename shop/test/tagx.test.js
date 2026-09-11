/**
 * Erwartet der Bestand den Tag, an dem die Angaben kommen?
 *
 * **Der Anlass, 11. September 2026.** Jeder Prüfer dieses Bestandes misst den
 * Zustand von heute: ein Impressum mit vier Lücken, eine Entität ohne UID,
 * einen ausgeschalteten Bestellweg. Alle sind grün, und alle prüfen denselben
 * halbfertigen Stand.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { OFFENE_ANGABEN, betreiberAmTagX, tagxbefund } from '../src/tagx.js';
import { VORAUSSETZUNGEN } from '../src/bestellweg.js';

const BETREIBER = JSON.parse(
  readFileSync(new URL('../data/betreiber.json', import.meta.url), 'utf8'),
);

/** Eine Lage, in der alles ankommt. Jeder Fall verbiegt genau eine Sache. */
const gut = () => ({
  impressum: OFFENE_ANGABEN.map((a) => a.probe).join(' '),
  entitaeten: [Object.fromEntries(OFFENE_ANGABEN.map((a) => [a.feld, a.probe]))],
  dateien: ['index.html', 'bestellung.php'],
  hinweis: 'Vorschau ohne Bestellmöglichkeit — es fehlt die Lieferzeit des Lieferanten.',
});

test('jede offene Angabe nennt ein Feld des Betreibers, eine Probe und einen Grund', () => {
  assert.equal(OFFENE_ANGABEN.length, 5, `${OFFENE_ANGABEN.length} Angaben`);
  for (const a of OFFENE_ANGABEN) {
    assert.ok(a.feld in BETREIBER, `${a.feld} gibt es in der Betreiberdatei nicht`);
    assert.ok(a.probe.length >= 5, `${a.feld}: die Probe ist zu kurz, um etwas zu treffen`);
    assert.ok(a.sichtbarIn.length >= 1, `${a.feld}: nennt keine Stelle`);
    assert.ok(a.warum.length >= 80, `${a.feld}: der Grund trägt nicht`);
  }
});

test('die Proben stehen in keiner Datei des Bestandes', () => {
  /**
   * **Sie sind Proben, keine Angaben.** Eine erfundene UID im echten
   * Impressum wäre genau der Fehler, gegen den dieser ganze Bestand gebaut
   * ist — deshalb dürfen die Probewerte nirgends im Bestand auftauchen.
   */
  const roh = readFileSync(new URL('../data/betreiber.json', import.meta.url), 'utf8');
  assert.equal(OFFENE_ANGABEN.length, 5, 'sonst prüft die Schleife bei leerer Liste nichts');
  for (const a of OFFENE_ANGABEN) {
    assert.equal(roh.includes(a.probe), false,
      `die Probe für ${a.feld} steht in data/betreiber.json — sie ist keine Angabe`);
  }
});

test('der Bestellweg verlangt genau die Felder, die das Register nennt', () => {
  // Der erste Wurf führte nur die vier Impressumsangaben und verlangte
  // trotzdem den Bestellweg. Er tat es nicht: `VORAUSSETZUNGEN` nennt zwei
  // Felder, und das zweite ist die Fundstelle der Rechtstexte.
  const felder = new Set(VORAUSSETZUNGEN.map((v) => v.feld.replace(/^betreiber\./, '')));
  const gefuehrt = new Set(OFFENE_ANGABEN.map((a) => a.feld));
  assert.ok(felder.size >= 2, `nur ${felder.size} Voraussetzungen — die Schleife prüfte nichts`);
  for (const f of felder) {
    assert.ok(gefuehrt.has(f),
      `${f} ist Voraussetzung des Bestellwegs und steht in keiner offenen Angabe`);
  }
});

test('betreiberAmTagX setzt nur die offenen Angaben', () => {
  const voll = betreiberAmTagX(BETREIBER);
  for (const a of OFFENE_ANGABEN) assert.equal(voll[a.feld], a.probe);
  assert.equal(voll.firma, BETREIBER.firma, 'alles andere bleibt, wie es ist');
  assert.equal(voll.firmenbuchnummer, BETREIBER.firmenbuchnummer);
});

test('die heile Lage meldet nichts', () => {
  assert.deepEqual(tagxbefund(gut()).meldungen, []);
});

test('eine Angabe, die das Impressum nicht erreicht, ist ein Befund', () => {
  const lage = gut();
  lage.impressum = lage.impressum.replace(OFFENE_ANGABEN[0].probe, '');
  assert.deepEqual(tagxbefund(lage).meldungen.map((m) => m.regel),
    ['angabe-erreicht-impressum-nicht']);
});

test('eine Angabe, die nur in einem Teil der Blöcke steht, ist ein Befund', () => {
  /**
   * **Ein Assistent liest die Blöcke der Artikelseiten, nicht den der
   * Startseite.** Am 10. September trugen siebzig von einundsiebzig Blöcken
   * nur Name und Firmenname — und der eine vollständige war der, den er am
   * ehesten nicht liest.
   */
  const lage = gut();
  lage.entitaeten = [lage.entitaeten[0], { name: 'Bauversand' }];
  const b = tagxbefund(lage);
  assert.ok(b.meldungen.some((m) => m.regel === 'angabe-erreicht-entitaet-nicht'),
    JSON.stringify(b.meldungen));
  assert.match(b.meldungen[0].text, /1 von 2/);
});

test('ein ausgeschalteter Bestellweg ist ein Befund', () => {
  const lage = gut();
  lage.dateien = ['index.html'];
  assert.deepEqual(tagxbefund(lage).meldungen.map((m) => m.regel), ['bestellweg-bleibt-aus']);
});

test('ohne eine Angabe, die den Bestellweg beansprucht, wird er nicht verlangt', () => {
  // Sonst verlangte eine Liste ohne die Fundstelle der Rechtstexte einen Weg,
  // der ohne sie gar nicht angehen darf — genau der Fehler des ersten Wurfs.
  const lage = { ...gut(), dateien: ['index.html'] };
  const ohneWeg = OFFENE_ANGABEN.filter((a) => !a.sichtbarIn.includes('bestellweg'));
  assert.ok(ohneWeg.length >= 3);
  assert.deepEqual(tagxbefund({ ...lage, angaben: ohneWeg }).meldungen, []);
});

test('ein Hinweis, der eine gelieferte Angabe noch als fehlend nennt, ist ein Befund', () => {
  const lage = gut();
  lage.hinweis = 'Vorschau ohne Bestellmöglichkeit — es fehlt die uid des Betreibers.';
  assert.deepEqual(tagxbefund(lage).meldungen.map((m) => m.regel),
    ['hinweis-nennt-gelieferte-angabe']);
});

test('eine leere Liste offener Angaben ist kein grünes Ergebnis', () => {
  const b = tagxbefund({ ...gut(), angaben: [] });
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['keine-offene-angabe']);
});
