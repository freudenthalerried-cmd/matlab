import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { erzeugeBestellungen, darfAutomatischAusgeloestWerden } from '../src/bestellung.js';

const daten = {
  lieferanten: JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url))),
  artikel: JSON.parse(readFileSync(new URL('../data/artikel.json', import.meta.url))),
};
const katalog = ladeKatalog(daten, 0.35);

const auftrag = {
  bestellnummer: 'A-2026-0001',
  zahlungEingegangen: true,
  kundeIstUnternehmer: true,
  uid: 'ATU12345678',
  absender: { firma: 'Musterfirma e.U.' },
  lieferadresse: {
    name: 'Baumeister Muster GmbH',
    strasse: 'Baustelle Feldweg 3',
    plz: '4600',
    ort: 'Wels',
    telefon: '+43 660 0000000',
  },
};

test('Katalog lädt vollständig und verknüpft die Lieferanten', () => {
  assert.equal(katalog.artikel.length, 9);
  assert.equal(katalog.lieferantenById.size, 3);
  for (const a of katalog.artikel) {
    assert.ok(a.vkNetto > 0);
    assert.ok(a.ekNetto < a.vkNetto || a.vkNetto === a.uvpNetto);
  }
});

test('Alle Katalogpreise sind als Platzhalter gekennzeichnet', () => {
  assert.ok(katalog.artikel.every((a) => a.ekIstPlatzhalter));
});

test('Warenkorb gruppiert nach Lieferant und rechnet Fracht je Gruppe', () => {
  const wk = berechneWarenkorb(
    [
      { sku: 'DR-100-050', menge: 1 },
      { sku: 'AB-RD-375', menge: 4 },
      { sku: 'ZB-DB-150', menge: 2 },
    ],
    katalog,
  );

  assert.equal(wk.teillieferungen.length, 3);
  // Drei Quellen bedeuten dreimal Fracht — der Kern des Streckengeschäfts.
  const mitFracht = wk.teillieferungen.filter((t) => t.frachtNetto > 0).length;
  assert.ok(mitFracht >= 1);
  assert.equal(
    wk.summeNetto,
    Math.round((wk.warenwertNetto + wk.frachtNetto) * 100) / 100,
  );
  assert.equal(wk.summeBrutto, Math.round((wk.summeNetto * 1.2) * 100) / 100);
});

test('Mischmarge bezieht sich auf den Warenwert, nicht auf die Summe', () => {
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 4 }], katalog);
  const erwartet = (wk.warenwertNetto - wk.einkaufNetto) / wk.warenwertNetto;
  assert.ok(Math.abs(wk.mischmarge - erwartet) < 1e-9);
});

test('Unterschrittener Mindestbestellwert blockiert die Bestellung', () => {
  const wk = berechneWarenkorb([{ sku: 'ZB-RR-125', menge: 1 }], katalog);
  assert.equal(wk.bestellbar, false);
  assert.equal(wk.hinweise.length, 1);
  assert.match(wk.hinweise[0], /Mindestbestellwert/);
});

test('Unbekannte Artikelnummer und unsinnige Mengen werden abgewiesen', () => {
  assert.throws(() => berechneWarenkorb([{ sku: 'GIBTSNICHT', menge: 1 }], katalog));
  assert.throws(() => berechneWarenkorb([{ sku: 'DR-100-050', menge: 0 }], katalog));
  assert.throws(() => berechneWarenkorb([{ sku: 'DR-100-050', menge: 1.5 }], katalog));
});

test('Je Lieferant entsteht genau eine Bestellung mit Lieferadresse', () => {
  const wk = berechneWarenkorb(
    [
      { sku: 'DR-100-050', menge: 2 },
      { sku: 'AB-RD-375', menge: 4 },
    ],
    katalog,
  );
  const bestellungen = erzeugeBestellungen(wk, auftrag);

  assert.equal(bestellungen.length, 2);
  assert.equal(bestellungen[0].nummer, 'A-2026-0001-01');
  for (const b of bestellungen) {
    assert.match(b.text, /Streckengeschäft/);
    assert.match(b.text, /4600 Wels/);
    assert.match(b.text, /neutral verpackt/);
    assert.match(b.csv.split('\n')[0], /^bestellnummer;sku;menge/);
  }
});

test('Gate 6: Platzhalterpreise verhindern die automatische Auslösung', () => {
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 4 }], katalog);
  const pruefung = darfAutomatischAusgeloestWerden(wk, auftrag);

  assert.equal(pruefung.erlaubt, false);
  assert.ok(pruefung.gruende.some((g) => /Platzhalter/.test(g)));
});

test('Gate 7: ohne bestätigten Unternehmerstatus keine Auslösung', () => {
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 4 }], katalog);
  const pruefung = darfAutomatischAusgeloestWerden(wk, {
    ...auftrag,
    kundeIstUnternehmer: false,
  });
  assert.ok(pruefung.gruende.some((g) => /Unternehmer/.test(g)));
});

test('Ohne Zahlungseingang keine Auslösung', () => {
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 4 }], katalog);
  const pruefung = darfAutomatischAusgeloestWerden(wk, { ...auftrag, zahlungEingegangen: false });
  assert.ok(pruefung.gruende.some((g) => /Zahlung/.test(g)));
});
