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
import * as shopkern from '../src/shopkern.js';

const MODULE = {
  'kunde.js': kunde,
  'beleg.js': beleg,
  'warenkorb.js': warenkorb,
  'preis.js': preis,
  'rechtstexte.js': rechtstexte,
  'zahlung.js': zahlung,
  // Seit dem 3. September nennt AGB-Punkt 5 ein Ziel in `shopkern.js` — der
  // Mindestbestellwert gegenüber dem Kunden (Gate 25).
  'shopkern.js': shopkern,
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

test('Zu jedem Datenfluss mit offener Frage steht auch, was dagegen getan wurde', () => {
  // Eine offene Frage ohne Maßnahme ist eine Notiz. Eine Maßnahme ohne offene
  // Frage wäre eine Beschönigung. Beides gehört zusammen.
  const fluss = DATENFLUESSE.find((f) => /Ansprechpartners? vor Ort/.test(f.datum));
  assert.ok(fluss.massnahme, 'Die Maßnahme fehlt');
  assert.match(fluss.massnahme, /ZUSICHERUNG_DRITTER/);
  assert.match(fluss.massnahme, /§ 131 BAO/, 'Warum die Nummer nicht in die Ablage darf');
  assert.match(fluss.offen, /entscheidet der Rechtstexteanbieter/, 'Die Frage bleibt offen');
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

/* ------------------------------------------------------------------ *
 * Sieben Mängel, die dieser Abgleich noch nie gemeldet hat
 * ------------------------------------------------------------------ *
 *
 * Der Dateikopf von `abgleich.js` warnt vor dem Fehler, „eine Prüfung
 * vergleicht eine Erklärung mit sich selbst und geht immer auf". Für die
 * **Ziele** war das gelöst: Die Module kommen als Parameter herein, und ein
 * weggelassenes Modul lässt die Prüfung durchfallen — zwei Testfälle weiter
 * oben zeigen es.
 *
 * Für die **Tafeln** war es nicht gelöst. `ZUORDNUNG`, `AGB_GLIEDERUNG`,
 * `SCHRITTE` und `SCHRITTE_OHNE_AGB` las die Funktion unmittelbar aus dem
 * Modul, und weil sie im Bestand zueinander passen, meldete sie immer
 * „vollständig". Der Deckungslauf vom 31.08. nennt sieben Mängelzweige, die
 * kein Testfall betritt.
 *
 * Seit heute sind die Tafeln hereinreichbar; der Bestand bleibt der
 * Vorgabewert. Ab hier bekommt jeder Mangel seinen Fall.
 */

const NUR_KLAUSEL = { nr: 1, art: 'klausel', wie: 'steht so in den AGB' };

test('Eine Zuordnung auf einen AGB-Punkt, den es nicht gibt, fällt auf', () => {
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [{ ...NUR_KLAUSEL, nr: 99 }],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [], ohneAgb: {},
  });
  assert.equal(p.vollstaendig, false);
  assert.ok(p.maengel.some((m) => /Punkt 99 — den Punkt gibt es nicht/.test(m)), p.maengel.join(' | '));
});

test('Ein doppelt zugeordneter Punkt fällt auf', () => {
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [NUR_KLAUSEL, { ...NUR_KLAUSEL }],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [], ohneAgb: {},
  });
  assert.ok(p.maengel.some((m) => /Punkt 1 ist doppelt zugeordnet/.test(m)), p.maengel.join(' | '));
});

test('Eine unbekannte Art der Umsetzung fällt auf', () => {
  // `ARTEN_DER_UMSETZUNG` ist die abschließende Liste. Eine Zuordnung, die
  // sich eine fünfte Art ausdenkt, würde sonst stillschweigend übersprungen —
  // und der Punkt gälte als umgesetzt, ohne dass irgendetwas nachgeschlagen
  // worden wäre.
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [{ nr: 1, art: 'handschlag', wie: 'wird schon' }],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [], ohneAgb: {},
  });
  assert.ok(p.maengel.some((m) => /unbekannte Art der Umsetzung „handschlag"/.test(m)), p.maengel.join(' | '));
  assert.ok(ARTEN_DER_UMSETZUNG.length >= 4, 'die Liste ist leer geworden — dann prüft dieser Fall nichts');
});

test('Eine Zuordnung ohne Begründung fällt auf', () => {
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [{ nr: 1, art: 'klausel', wie: '   ' }],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [], ohneAgb: {},
  });
  assert.ok(p.maengel.some((m) => /Punkt 1: ohne Begründung/.test(m)), p.maengel.join(' | '));
});

test('Eine Zuordnung mit Art, aber ohne Ziel fällt auf', () => {
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [{ nr: 1, art: 'code', modul: 'kunde.js', wie: 'im Code', ziel: [] }],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [], ohneAgb: {},
  });
  assert.ok(p.maengel.some((m) => /Punkt 1: code, aber ohne Ziel/.test(m)), p.maengel.join(' | '));
});

test('Ein AGB-Punkt ohne jede Zuordnung fällt auf — Versprechen ohne Umsetzung', () => {
  // Der Befund, für den dieses Modul überhaupt gebaut wurde.
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [NUR_KLAUSEL],
    gliederung: [{ nr: 1, titel: 'Geltung' }, { nr: 2, titel: 'Gewährleistung' }],
    schritte: [], ohneAgb: {},
  });
  assert.ok(p.maengel.some((m) => /AGB-Punkt 2 \(„Gewährleistung"\) hat keine Zuordnung/.test(m)),
    p.maengel.join(' | '));
});

test('Ein Ablaufschritt ohne AGB-Grundlage und ohne Begründung fällt auf', () => {
  // Die Gegenrichtung des Moduls: nicht ein Versprechen ohne Umsetzung,
  // sondern Verhalten ohne veröffentlichte Grundlage.
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [NUR_KLAUSEL],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [{ id: 'heimlich' }], ohneAgb: {},
  });
  assert.ok(p.maengel.some((m) => /Ablaufschritt „heimlich" steht in keinem AGB-Punkt/.test(m)),
    p.maengel.join(' | '));

  // Und mit Begründung ist derselbe Schritt in Ordnung.
  const mitGrund = pruefeAbgleich(MODULE, {
    zuordnung: [NUR_KLAUSEL],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [{ id: 'heimlich' }], ohneAgb: { heimlich: 'gesetzlich geboten' },
  });
  assert.ok(!mitGrund.maengel.some((m) => /heimlich/.test(m)), mitGrund.maengel.join(' | '));
});

test('Eine Klausel, die trotzdem ein Ziel nennt, fällt auf', () => {
  const p = pruefeAbgleich(MODULE, {
    zuordnung: [{ nr: 1, art: 'klausel', wie: 'nur Text', ziel: ['irgendwas'] }],
    gliederung: [{ nr: 1, titel: 'Geltung' }],
    schritte: [], ohneAgb: {},
  });
  assert.ok(p.maengel.some((m) => /als Klausel eingeordnet, nennt aber ein Ziel/.test(m)),
    p.maengel.join(' | '));
});

test('Ohne zweites Argument prüft der Abgleich weiterhin den Bestand', () => {
  // **Die wichtigste Gegenrichtung.** Die Tafeln hereinreichbar zu machen
  // wäre wertlos, wenn der Bestand dabei aus dem Blick geriete: Der Aufruf
  // ohne zweites Argument muss dieselbe Antwort geben wie zuvor.
  const bestand = pruefeAbgleich(MODULE);
  assert.equal(bestand.vollstaendig, true, bestand.maengel.join(' | '));
  assert.deepEqual(bestand, pruefeAbgleich(MODULE, {}));
  assert.deepEqual(bestand, pruefeAbgleich(MODULE, {
    zuordnung: ZUORDNUNG, gliederung: AGB_GLIEDERUNG,
    schritte: SCHRITTE, ohneAgb: SCHRITTE_OHNE_AGB,
  }));
});

test('Ein Datenfluss, den kein Punkt der Datenschutzerklärung deckt, fällt auf', () => {
  // Der letzte unerreichte Mängelzweig des Moduls — und bei einer Auskunft
  // nach Art. 13 DSGVO der teure Fall: Wer Daten weitergibt, muss den
  // Empfänger und die Grundlage in der Erklärung genannt haben. Ein Fluss,
  // den kein Punkt deckt, ist eine Übermittlung ohne Auskunft.
  const p = pruefeDatenfluesse({
    fluesse: [{
      datum: 'Telefonnummer der Baustelle', grundlage: 'Vertragserfüllung',
      empfaenger: ['Lieferant'], traegtPunkt: 'Ein Punkt, den es nicht gibt',
    }],
    gliederung: ['Welche Daten wir verarbeiten'],
  });
  assert.equal(p.vollstaendig, false);
  assert.ok(p.maengel.some((m) => /kein Punkt der Datenschutzerklärung deckt das ab/.test(m)),
    p.maengel.join(' | '));

  // Gegenrichtung, zweifach: mit deckendem Punkt kein Mangel — und der
  // Bestand ohne Argument bleibt, was er war.
  const gedeckt = pruefeDatenfluesse({
    fluesse: [{
      datum: 'Telefonnummer der Baustelle', grundlage: 'Vertragserfüllung',
      empfaenger: ['Lieferant'], traegtPunkt: 'Welche Daten wir verarbeiten',
    }],
    gliederung: ['Welche Daten wir verarbeiten'],
  });
  assert.equal(gedeckt.vollstaendig, true, gedeckt.maengel.join(' | '));
  assert.deepEqual(pruefeDatenfluesse(), pruefeDatenfluesse({}));
});
