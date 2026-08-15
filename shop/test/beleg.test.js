import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import {
  KLEINBETRAG_GRENZE_BRUTTO,
  UID_EMPFAENGER_GRENZE_BRUTTO,
  erforderlicheMerkmale,
  pruefeRechnungsmerkmale,
  erzeugeAngebot,
  erzeugeRechnung,
  darfRechnungGestelltWerden,
  reihengeschaeftEinordnung,
} from '../src/beleg.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const daten = { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') };
const katalog = ladeKatalog(daten, 0.35);

const korb = berechneWarenkorb(
  [
    { sku: katalog.artikel[0].sku, menge: 5 },
    { sku: katalog.artikel.find((a) => a.lieferantId !== katalog.artikel[0].lieferantId).sku, menge: 10 },
  ],
  katalog,
);

const betreiber = { firma: 'Musterfirma GmbH, Musterweg 1, 4600 Wels', uid: 'ATU12345675' };
const kunde = {
  firma: 'Bau Muster GmbH',
  strasse: 'Baustellenweg 7',
  plz: '4600',
  ort: 'Wels',
  uid: 'ATU12345675',
};

test('Bis 400 Euro brutto genügen die sechs Angaben der Kleinbetragsrechnung', () => {
  const noetig = erforderlicheMerkmale(KLEINBETRAG_GRENZE_BRUTTO);
  assert.equal(noetig.length, 6);
  assert.ok(!noetig.some((m) => m.feld === 'rechnungsnummer'));
  assert.ok(!noetig.some((m) => m.feld === 'empfaengerName'));
});

test('Über 400 Euro kommen Nummer, Empfänger und getrennte Steuer dazu', () => {
  const noetig = erforderlicheMerkmale(KLEINBETRAG_GRENZE_BRUTTO + 0.01);
  assert.equal(noetig.length, 10);
  assert.ok(noetig.some((m) => m.feld === 'rechnungsnummer'));
  assert.ok(!noetig.some((m) => m.feld === 'empfaengerUid'));
});

test('Erst über 10.000 Euro wird die UID des Empfängers verlangt', () => {
  assert.ok(!erforderlicheMerkmale(UID_EMPFAENGER_GRENZE_BRUTTO).some((m) => m.feld === 'empfaengerUid'));
  assert.ok(erforderlicheMerkmale(UID_EMPFAENGER_GRENZE_BRUTTO + 0.01).some((m) => m.feld === 'empfaengerUid'));
});

test('Die Prüfung benennt jede fehlende Pflichtangabe einzeln', () => {
  const p = pruefeRechnungsmerkmale({ bruttobetrag: 3900 });
  assert.equal(p.vollstaendig, false);
  assert.equal(p.kleinbetrag, false);
  assert.equal(p.empfaengerUidNoetig, false);
  assert.ok(p.fehlendeFelder.includes('rechnungsnummer'));
  assert.ok(p.fehlendeFelder.includes('ausstellerUid'));
});

test('Ein Betrag von null gilt nicht als ausgefüllte Angabe fürs Entgelt', () => {
  // Number.isFinite(0) ist true — der Betrag zählt als vorhanden, das ist richtig.
  const p = pruefeRechnungsmerkmale({ bruttobetrag: 0, ausstellerName: 'A', leistung: 'x', lieferdatum: '1.1.', ausstellungsdatum: '1.1.', steuersatz: '20 %' });
  assert.equal(p.vollstaendig, true);
  assert.equal(p.kleinbetrag, true);
});

test('Das Angebot trägt eine Bindefrist und weist die Teillieferungen aus', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-0001', datum: '15.08.2026', kunde, betreiber });
  assert.match(a.text, /Bindefrist: 14 Tage/);
  assert.match(a.text, /Angebot AN-0001/);
  assert.equal(a.bruttobetrag, korb.summeBrutto);
  for (const teil of korb.teillieferungen) {
    assert.ok(a.text.includes(teil.lieferantName), `${teil.lieferantName} fehlt im Angebot`);
  }
});

test('Das Angebot enthält keine Rechnungsnummer', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-0001', datum: '15.08.2026', kunde, betreiber });
  assert.ok(!/Rechnung/.test(a.text), 'ein Angebot ist keine Rechnung');
});

test('Angebot und Rechnung stimmen im Betrag mit dem Warenkorb überein', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-0001', datum: '15.08.2026', kunde, betreiber });
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber });
  assert.equal(a.bruttobetrag, r.bruttobetrag);
  const gerundet = korb.summeBrutto.toFixed(2).replace('.', ',');
  assert.ok(a.text.includes(gerundet) && r.text.includes(gerundet));
});

test('Eine vollständige Rechnung enthält keine Lückenmarkierung', () => {
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber });
  assert.equal(r.vollstaendig, true);
  assert.ok(!r.text.includes('FEHLT'));
  assert.match(r.text, /§ 377 UGB/);
});

test('Ohne Betreiberdaten bleiben die Lücken in der Rechnung sichtbar', () => {
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber: {} });
  assert.equal(r.vollstaendig, false);
  assert.match(r.text, /\[\[ UID des Ausstellers — FEHLT \]\]/);
});

test('Platzhalterpreise verhindern die Rechnung so wie die Bestellung', () => {
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber });
  const f = darfRechnungGestelltWerden(korb, r);
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /Platzhalterpreise/.test(g)));
});

test('Ohne Lieferung wird kein Lieferdatum bescheinigt', () => {
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber });
  const f = darfRechnungGestelltWerden(korb, r, { geliefert: false });
  assert.ok(f.gruende.some((g) => /Lieferung noch nicht erfolgt/.test(g)));
});

test('Auslandslieferanten machen das Streckengeschäft zum Reihengeschäft', () => {
  const e = reihengeschaeftEinordnung(korb, katalog);
  assert.equal(e.reihengeschaeft, true);
  assert.equal(e.uidPflicht, true);
  assert.ok(e.hinweise.some((h) => /innergemeinschaftlicher Erwerb/.test(h)));
  assert.ok(e.betroffeneLieferanten.every((id) => katalog.lieferantenById.get(id).land !== 'AT'));
});

test('Ein rein österreichischer Warenkorb ist kein Reihengeschäft', () => {
  const inland = katalog.artikel.find((a) => katalog.lieferantenById.get(a.lieferantId).land === 'AT');
  const nurInland = berechneWarenkorb([{ sku: inland.sku, menge: 20 }], katalog);
  const e = reihengeschaeftEinordnung(nurInland, katalog);
  assert.equal(e.reihengeschaeft, false);
  assert.deepEqual(e.hinweise, []);
});

test('Jeder Lieferant trägt ein Land — ohne das ist die Steuerfrage nicht zu stellen', () => {
  for (const l of daten.lieferanten.lieferanten) {
    assert.match(l.land, /^[A-Z]{2}$/, `${l.id} hat kein Land`);
  }
});
