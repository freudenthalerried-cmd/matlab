/**
 * Sagt die ausgezeichnete Entität überall dasselbe — und das Belegte?
 *
 * **Der Anlass, 11. September 2026.** `ki-sichtbarkeit-konzept.md` nennt die
 * Konsistenz der Entität als ersten von drei Vertrauensgründen und heißt sie
 * „den billigsten und meistvernachlässigten Hebel". Gemessen: 71
 * Organisationsblöcke in der Ausgabe, **70 davon nur mit Name und
 * Firmenname**. Straße, Postleitzahl und Firmenbuchnummer lagen belegt in der
 * Betreiberdatei und standen in keiner einzigen Auszeichnung.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { ENTITAETSFELDER, organisationsdaten, entitaetsbefund } from '../src/maschinenlesbar.js';

const BETREIBER = JSON.parse(
  readFileSync(new URL('../data/betreiber.json', import.meta.url), 'utf8'),
);

test('die gebaute Entität trägt jede belegte Angabe', () => {
  const org = organisationsdaten(BETREIBER);
  assert.equal(org.name, BETREIBER.marke);
  assert.equal(org.legalName, BETREIBER.firma);
  assert.equal(org.address.streetAddress, BETREIBER.strasse);
  assert.equal(org.address.postalCode, String(BETREIBER.plz));
  assert.equal(org.identifier.value, BETREIBER.firmenbuchnummer);
  // **Mit Schrägstrich.** Die Betreiberdatei führt die Adresse ohne, die
  // Startseite nennt sich kanonisch mit — und zwei Schreibweisen derselben
  // Wurzel standen in diesem Bestand schon einmal nebeneinander.
  assert.equal(org.url, `${BETREIBER.domain}/`);
});

test('eine leere Angabe wird weggelassen, nicht gefüllt', () => {
  /**
   * **Die Linie dieses Bestandes seit dem ersten Tag.** `vatID: ""` wäre keine
   * Angabe, sondern eine Behauptung über eine fehlende.
   *
   * > **Eine Lücke, die sichtbar ist, ist besser als eine, die gefüllt
   * > aussieht.**
   */
  const org = organisationsdaten({ ...BETREIBER, uid: '', telefon: '   ', email: '' });
  assert.equal('vatID' in org, false);
  assert.equal('telephone' in org, false);
  assert.equal('email' in org, false);
});

test('sobald die UID kommt, steht sie drin', () => {
  // Die Gegenrichtung: Der Prüfer verlangt sie in dem Augenblick, in dem der
  // Auftraggeber sie liefert — ohne dass jemand daran denken muss.
  const org = organisationsdaten({ ...BETREIBER, uid: 'ATU12345675' });
  assert.equal(org.vatID, 'ATU12345675');
});

test('jedes Feld des Registers zeigt auf eine Angabe der Betreiberdatei', () => {
  assert.equal(ENTITAETSFELDER.length, 9, `${ENTITAETSFELDER.length} Felder`);
  for (const f of ENTITAETSFELDER) {
    assert.ok(f.quelle in BETREIBER, `${f.quelle} gibt es in der Betreiberdatei nicht`);
    assert.match(f.feld, /^[a-z]/i);
  }
});

test('eine fehlende belegte Angabe ist ein Befund', () => {
  const org = organisationsdaten(BETREIBER);
  delete org.address.streetAddress;
  const b = entitaetsbefund([org], BETREIBER);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['angabe-fehlt']);
});

test('eine gefüllte Angabe ohne Beleg ist ein Befund', () => {
  const org = { ...organisationsdaten(BETREIBER), vatID: '' };
  // Ein leerer String ist gesetzt und nicht belegt — genau der Fall.
  org.vatID = 'ATU00000000';
  const b = entitaetsbefund([org], { ...BETREIBER, uid: '' });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['angabe-ohne-beleg']);
});

test('zwei Fassungen derselben Firma sind ein Befund', () => {
  /**
   * Der Satz des Konzepts wörtlich: *Ein Assistent, der drei Schreibweisen
   * derselben Firma findet, hat drei schwache Entitäten statt einer starken.*
   * Am 3. September ist genau das passiert — die Startseite trug den neuen
   * Markennamen, achtzig Seiten den alten.
   */
  const a = organisationsdaten(BETREIBER);
  const b = { ...organisationsdaten(BETREIBER), name: 'Bauversand Handel' };
  const befund = entitaetsbefund([a, b], BETREIBER);
  assert.deepEqual(befund.meldungen.map((m) => m.regel), ['mehrere-fassungen']);
});

test('zusätzliche Felder am Wurzelknoten sind keine zweite Fassung', () => {
  // Der Block der Startseite trägt `@context` und das Liefergebiet, und das
  // ist richtig so. Ein Vergleich über das ganze Objekt hätte diesen
  // Unterschied gemeldet und den gemeinten verdeckt.
  const a = organisationsdaten(BETREIBER);
  const b = { '@context': 'https://schema.org', ...organisationsdaten(BETREIBER), areaServed: [] };
  assert.deepEqual(entitaetsbefund([a, b], BETREIBER).meldungen, []);
});

test('kein einziger Block ist kein grünes Ergebnis', () => {
  const b = entitaetsbefund([], BETREIBER);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['keine-entitaet']);
});
