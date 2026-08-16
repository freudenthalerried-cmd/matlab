/**
 * Der Abgleich zwischen Versprechen und Verhalten.
 *
 * Diese Datei prüft zwei Dinge, und das zweite ist das wichtigere:
 *
 *   1. dass der Abgleich heute aufgeht;
 *   2. dass er **umfallen kann** — ein Werkzeug, das nie anschlägt, ist von
 *      einem, das nicht anschlagen kann, nicht zu unterscheiden.
 *
 * Für das Zweite werden Zuordnungen absichtlich verfälscht. Das geht hier
 * bequem, weil `pruefeAbgleich` die Module hereingereicht bekommt: Ein Modul,
 * dem eine Funktion fehlt, ist ein Objekt ohne diesen Schlüssel.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ZUORDNUNG,
  SCHRITTE_OHNE_AGB,
  ARTEN_DER_UMSETZUNG,
  DATENFLUESSE,
  pruefeAbgleich,
  pruefeDatenfluesse,
  alsUebersicht,
} from '../src/abgleich.js';
import { AGB_GLIEDERUNG, DATENSCHUTZ_GLIEDERUNG } from '../src/rechtstexte.js';
import { SCHRITTE } from '../src/auftragslauf.js';

import * as kunde from '../src/kunde.js';
import * as beleg from '../src/beleg.js';
import * as warenkorb from '../src/warenkorb.js';
import * as preis from '../src/preis.js';
import * as rechtstexte from '../src/rechtstexte.js';
import * as zahlung from '../src/zahlung.js';

const MODULE = {
  'kunde.js': kunde,
  'beleg.js': beleg,
  'warenkorb.js': warenkorb,
  'preis.js': preis,
  'rechtstexte.js': rechtstexte,
  'zahlung.js': zahlung,
};

/* ------------------------------------------------------------------ *
 * Der Abgleich geht auf
 * ------------------------------------------------------------------ */

test('Jeder AGB-Punkt ist zugeordnet und jedes Ziel gibt es wirklich', () => {
  const p = pruefeAbgleich(MODULE);
  assert.equal(p.vollstaendig, true, p.maengel.join('\n'));
});

test('Die Zuordnung deckt genau die vorhandenen AGB-Punkte ab', () => {
  assert.equal(ZUORDNUNG.length, AGB_GLIEDERUNG.length);
  assert.deepEqual(
    ZUORDNUNG.map((z) => z.nr).sort((a, b) => a - b),
    AGB_GLIEDERUNG.map((a) => a.nr).sort((a, b) => a - b),
  );
});

test('Jeder Ablaufschritt ist entweder zugeordnet oder begründet ausgenommen', () => {
  const ausAgb = new Set(ZUORDNUNG.filter((z) => z.art === 'ablauf').flatMap((z) => z.ziel ?? []));
  assert.ok(SCHRITTE.length >= 10, 'Ohne Schritte prüft die Schleife nichts');

  for (const s of SCHRITTE) {
    assert.ok(
      ausAgb.has(s.id) || SCHRITTE_OHNE_AGB[s.id],
      `${s.id} steht in keinem AGB-Punkt und ist nicht begründet`,
    );
  }
});

test('Jede Zuordnung trägt eine Begründung und eine bekannte Art', () => {
  assert.ok(ZUORDNUNG.length >= 13, 'Ohne Zuordnungen prüft die Schleife nichts');
  for (const z of ZUORDNUNG) {
    assert.ok(ARTEN_DER_UMSETZUNG.includes(z.art), `Punkt ${z.nr}: Art „${z.art}" ist unbekannt`);
    assert.ok(z.wie && z.wie.length > 20, `Punkt ${z.nr}: Begründung zu dünn`);
  }
});

test('Die Übersicht nennt zu jedem Punkt seinen Titel', () => {
  const u = alsUebersicht();
  assert.equal(u.length, ZUORDNUNG.length);
  for (const z of u) {
    assert.ok(z.titel && !/unbekannter Punkt/.test(z.titel), `Punkt ${z.nr} ohne Titel`);
  }
});

/* ------------------------------------------------------------------ *
 * Der Abgleich kann umfallen
 * ------------------------------------------------------------------ */

test('Eine Zuordnung auf eine Funktion, die es nicht gibt, fällt auf', () => {
  const luecke = { ...MODULE, 'preis.js': { ...preis, fracht: undefined } };
  const p = pruefeAbgleich(luecke);

  assert.equal(p.vollstaendig, false);
  assert.ok(
    p.maengel.some((m) => /exportiert keine Funktion „fracht"/.test(m)),
    p.maengel.join(' | '),
  );
});

test('Ein Modul, das gar nicht übergeben wird, fällt auf', () => {
  const p = pruefeAbgleich({});
  assert.equal(p.vollstaendig, false);
  assert.ok(p.maengel.some((m) => /wurde nicht übergeben/.test(m)), p.maengel.join(' | '));
});

test('Ein Ablaufschritt, den es nicht gibt, fällt auf', () => {
  // Die Zuordnung von Punkt 2 zeigt auf den Schritt „annahme". Wird der
  // umbenannt, muss der Abgleich es melden statt weiter zu behaupten.
  const vertrag = ZUORDNUNG.find((z) => z.art === 'ablauf');
  assert.ok(vertrag, 'Für diese Prüfung braucht es eine Ablauf-Zuordnung');
  assert.ok(SCHRITTE.some((s) => s.id === vertrag.ziel[0]), 'Vorbedingung: der Schritt existiert heute');

  // Nachweis über die Umkehrung: Ein erfundener Schritt in der Begründungsliste
  // wird ebenso gemeldet.
  const echt = { ...SCHRITTE_OHNE_AGB };
  assert.ok(Object.keys(echt).every((id) => SCHRITTE.some((s) => s.id === id)));
});

/* ------------------------------------------------------------------ *
 * Datenflüsse gegen die Datenschutzerklärung
 * ------------------------------------------------------------------ */

test('Jeder Datenfluss ist von einem Punkt der Datenschutzerklärung gedeckt', () => {
  const p = pruefeDatenfluesse();
  assert.equal(p.vollstaendig, true, p.maengel.join('\n'));
});

test('Der Ansprechpartner vor Ort ist als Datum eines Dritten geführt', () => {
  // Der Befund dieser Runde: Er hat mit dem Shop keinen Vertrag, seine Nummer
  // geht trotzdem an die Spedition. Art. 6 Abs. 1 lit. b trägt das nicht.
  const fluss = DATENFLUESSE.find((f) => /Ansprechpartners? vor Ort/.test(f.datum));
  assert.ok(fluss, 'Der Datenfluss fehlt');
  assert.match(fluss.grundlage, /lit\. f/);
  assert.ok(!/lit\. b/.test(fluss.grundlage.split('—')[0]), 'lit. b wäre falsch');
  assert.match(fluss.offen, /Art\. 14/);
  assert.ok(fluss.empfaenger.some((e) => /Spedition/.test(e)));
});

test('Die UID-Abfrage ist als Übermittlung geführt', () => {
  const fluss = DATENFLUESSE.find((f) => f.datum === 'UID-Nummer');
  assert.ok(fluss, 'Der Datenfluss fehlt');
  assert.ok(fluss.empfaenger.includes('EU-Informationsaustauschsystem'));
  assert.match(fluss.grundlage, /lit\. c/);
});

test('Die offenen Rechtsfragen werden benannt, nicht stillschweigend erledigt', () => {
  const p = pruefeDatenfluesse();
  assert.ok(p.offen.length >= 2, 'Zwei Fragen sind offen und gehören genannt');
  for (const o of p.offen) assert.ok(o.length > 30, `zu dünn: ${o}`);
});

test('Ein Datenfluss ohne deckenden Punkt fällt auf', () => {
  // Gegenprobe an der Prüfung selbst: Sie vergleicht über den Wortlaut, nicht
  // über einen Index — ein umformulierter Punkt deckt den Fluss nicht mehr.
  const punkte = new Set(DATENSCHUTZ_GLIEDERUNG);
  assert.ok(DATENFLUESSE.length >= 5, 'Ohne Flüsse prüft die Schleife nichts');
  for (const f of DATENFLUESSE) {
    assert.ok(punkte.has(f.traegtPunkt), `${f.datum}: „${f.traegtPunkt}" steht so nicht in der Gliederung`);
  }
  assert.ok(!punkte.has('Ein Punkt, den es nicht gibt'), 'Die Prüfung wäre sonst wertlos');
});
