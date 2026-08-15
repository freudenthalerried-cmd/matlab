import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pruefeBestelldaten, uidPruefzifferStimmt, baueAuftrag } from '../src/kunde.js';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { erzeugeBestellungen, darfAutomatischAusgeloestWerden } from '../src/bestellung.js';

const vollstaendig = {
  firma: 'Baumeister Muster GmbH',
  uid: 'ATU12345675',
  email: 'office@muster.at',
  strasse: 'Feldweg 3',
  plz: '4600',
  ort: 'Wels',
  telefon: '+43 660 0000000',
  unternehmerBestaetigt: true,
};

test('Vollständige Daten sind gültig und ohne Warnung', () => {
  const p = pruefeBestelldaten(vollstaendig);
  assert.equal(p.gueltig, true);
  assert.deepEqual(p.fehler, []);
  assert.deepEqual(p.warnungen, []);
});

test('UID-Prüfziffer: genau eine Ziffer passt je Basis', () => {
  const treffer = [];
  for (let d = 0; d < 10; d++) if (uidPruefzifferStimmt('ATU1234567' + d)) treffer.push(d);
  assert.deepEqual(treffer, [5], 'ATU12345675 ist das gängige Beispiel');
});

test('UID-Prüfziffer weist fremde Formate ab', () => {
  assert.equal(uidPruefzifferStimmt('ATU123'), false);
  assert.equal(uidPruefzifferStimmt('DE123456789'), false);
  assert.equal(uidPruefzifferStimmt('ATU1234567X'), false);
});

test('Falsche Prüfziffer ist eine Warnung, kein Fehler', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, uid: 'ATU12345670' });
  assert.equal(p.gueltig, true, 'verbindlich ist die MIAS-Abfrage, nicht die Prüfziffer');
  assert.equal(p.fehler.length, 0);
  assert.ok(p.warnungen.some((w) => /Prüfziffer/.test(w)));
});

test('Falsches UID-Format ist dagegen ein Fehler', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, uid: 'DE123456789' });
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /ATU/.test(f)));
});

test('Gate 7: ohne Unternehmerbestätigung keine gültige Bestellung', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, unternehmerBestaetigt: false });
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /Gate 7/.test(f)));
});

test('Pflichtfelder werden einzeln benannt', () => {
  const p = pruefeBestelldaten({ unternehmerBestaetigt: true, uid: 'ATU12345675' });
  assert.equal(p.gueltig, false);
  for (const begriff of [/Firmenname/, /Straße/, /Ort/, /Telefonnummer/, /Postleitzahl/, /E-Mail/]) {
    assert.ok(p.fehler.some((f) => begriff.test(f)), `Fehlermeldung fehlt für ${begriff}`);
  }
});

test('Postleitzahl wird auf vier Stellen und den AT-Bereich geprüft', () => {
  assert.ok(pruefeBestelldaten({ ...vollstaendig, plz: '460' }).fehler.some((f) => /vierstellig/.test(f)));
  assert.ok(pruefeBestelldaten({ ...vollstaendig, plz: '0999' }).fehler.some((f) => /Bereich/.test(f)));
  assert.equal(pruefeBestelldaten({ ...vollstaendig, plz: '1010' }).gueltig, true);
});

test('UID wird normalisiert: Großschreibung und Leerzeichen', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, uid: ' atu 1234 5675 ' });
  assert.equal(p.normalisiert.uid, 'ATU12345675');
  assert.equal(p.gueltig, true);
});

test('Der Auftrag trägt die Lieferadresse in die Bestellungen', () => {
  const daten = {
    lieferanten: JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url))),
    artikel: JSON.parse(readFileSync(new URL('../data/artikel.json', import.meta.url))),
  };
  const katalog = ladeKatalog(daten, 0.35);
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 5 }], katalog);
  const auftrag = baueAuftrag('A-2026-0007', vollstaendig, { zahlungEingegangen: true });

  assert.equal(auftrag.kundeIstUnternehmer, true);
  assert.equal(auftrag.uid, 'ATU12345675');

  const bestellungen = erzeugeBestellungen(wk, auftrag);
  assert.equal(bestellungen.length, 1);
  assert.match(bestellungen[0].text, /4600 Wels/);
  assert.match(bestellungen[0].text, /Baumeister Muster GmbH/);

  // Platzhalterpreise halten die Auslösung weiterhin auf.
  const pruefung = darfAutomatischAusgeloestWerden(wk, auftrag);
  assert.equal(pruefung.erlaubt, false);
  assert.ok(pruefung.gruende.some((g) => /Platzhalter/.test(g)));
});

test('Ohne Unternehmerbestätigung bleibt der Auftrag gesperrt', () => {
  const auftrag = baueAuftrag('A-1', { ...vollstaendig, unternehmerBestaetigt: false });
  assert.equal(auftrag.kundeIstUnternehmer, false);
});
