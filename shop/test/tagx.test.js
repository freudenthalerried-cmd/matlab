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

import {
  OFFENE_ANGABEN, OHNE_BAUWIRKUNG, betreiberAmTagX, tagxbefund, betreiberbefund,
} from '../src/tagx.js';
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
  oberflaeche: OFFENE_ANGABEN.map((a) => a.probe).join(' '),
});

test('jede offene Angabe nennt ein Feld des Betreibers, eine Probe und einen Grund', () => {
  assert.equal(OFFENE_ANGABEN.length, 6, `${OFFENE_ANGABEN.length} Angaben`);
  for (const a of OFFENE_ANGABEN) {
    assert.ok(a.feld in BETREIBER, `${a.feld} gibt es in der Betreiberdatei nicht`);
    assert.ok(String(a.probe).length >= 1, `${a.feld}: die Probe ist leer`);
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
  assert.equal(OFFENE_ANGABEN.length, 6, 'sonst prüft die Schleife bei leerer Liste nichts');
  for (const a of OFFENE_ANGABEN) {
    if (typeof a.probe !== 'string') continue;
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

/*
 * **Zwei Listen über denselben Tag — 11. September 2026, abends.**
 * `bin/bestellprobe.mjs` schrieb sich seit dem 4. September eine eigene
 * Betreiberdatei für den Tag X: drei Felder mit eigener Begründung, und eines
 * davon stand in `OFFENE_ANGABEN` gar nicht.
 */

test('jedes leere Feld der Betreiberdatei steht in einer der beiden Listen', () => {
  const b = betreiberbefund(BETREIBER);
  assert.deepEqual(b.meldungen, []);
  assert.ok(b.leer >= 5, `nur ${b.leer} leere Felder — die Prüfung hätte wenig zu tun`);
});

test('jeder Verzicht auf Bauwirkung nennt ein Feld und einen Grund, der trägt', () => {
  assert.equal(OHNE_BAUWIRKUNG.length, 3, `${OHNE_BAUWIRKUNG.length} Felder ohne Bauwirkung`);
  for (const o of OHNE_BAUWIRKUNG) {
    assert.ok(o.feld in BETREIBER, `${o.feld} gibt es in der Betreiberdatei nicht`);
    assert.ok(o.warum.length >= 80, `${o.feld}: der Grund trägt den Verzicht nicht`);
  }
});

test('ein leeres Feld ohne Platz ist ein Befund', () => {
  const b = betreiberbefund({ firma: 'X', neuesFeld: '' }, [], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['leeres-feld-ohne-platz']);
});

test('eine Angabe für ein Feld, das es nicht gibt, ist ein Befund', () => {
  const b = betreiberbefund(
    { firma: 'X', leer: '' },
    [{ feld: 'leer', probe: 'x', sichtbarIn: ['impressum'], warum: 'x'.repeat(90) },
      { feld: 'gibtsnicht', probe: 'x', sichtbarIn: ['impressum'], warum: 'x'.repeat(90) }],
    [],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['angabe-ohne-feld']);
});

test('eine volle Betreiberdatei ist kein grünes Ergebnis, sondern der Tag X', () => {
  // Die einzige Meldung dieses Bestandes, die eine gute Nachricht ist.
  const b = betreiberbefund({ firma: 'X', email: 'a@b.c' });
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nichts-mehr-offen']);
});

test('eine Angabe, die die Oberfläche nicht erreicht, ist ein Befund', () => {
  const lage = gut();
  lage.oberflaeche = '';
  const mitOberflaeche = OFFENE_ANGABEN.filter((a) => a.sichtbarIn.includes('oberflaeche'));
  assert.equal(mitOberflaeche.length, 1, 'sonst prüft der Fall die falsche Angabe');
  assert.deepEqual(tagxbefund({ ...lage, angaben: mitOberflaeche }).meldungen.map((m) => m.regel),
    ['angabe-erreicht-oberflaeche-nicht']);
});
