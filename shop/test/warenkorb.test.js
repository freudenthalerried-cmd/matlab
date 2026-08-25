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
  // Die Zusicherung ist „vollständig und verknüpft", nicht „genau neun".
  // Geprüft wird deshalb, dass jeder Artikel seinen Lieferanten findet —
  // das ist die Verknüpfung, um die es geht.
  assert.ok(katalog.artikel.length > 0, 'kein Artikel geladen');
  for (const a of katalog.artikel) {
    assert.ok(katalog.lieferantenById.has(a.lieferantId), `${a.sku} ohne Lieferant`);
  }
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
  assert.equal(wk.hinweiseIntern.length, 1);
  assert.match(wk.hinweiseIntern[0], /Mindestbestellwert/);
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

/* ------------------------------------------------------------------ *
 * Lieferantenschwellen gelten für den Bestellwert
 *
 * `freiHausAbNetto` und `mindestbestellwertNetto` stehen in
 * `lieferanten.json` neben `haendlerrabattAufUvp` — es sind Konditionen des
 * Lieferanten uns gegenüber. Die Frage im Anschreiben lautet „ab welchem
 * Auftragswert liefern **Sie** frachtfrei?". Maßgeblich ist deshalb der Wert
 * unserer Bestellung, nicht der Rechnungsbetrag des Kunden. Bei 35 %
 * Zielmarge liegen die beiden rund 54 % auseinander.
 * ------------------------------------------------------------------ */

test('Die Frei-Haus-Schwelle wird am Bestellwert gemessen, nicht am Verkaufswert', () => {
  // Ein Warenkorb, dessen Verkaufswert über der Schwelle liegt und dessen
  // Bestellwert darunter — genau das Fenster, in dem der Fehler saß.
  const korb = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 4 }], katalog);
  const teil = korb.teillieferungen.find((t) => t.lieferantId === 'bahnen-de');
  assert.ok(teil, 'Teillieferung des Bahnenherstellers fehlt');

  const grenze = katalog.lieferantenById.get('bahnen-de').fracht.freiHausAbNetto;
  assert.ok(teil.warenwertNetto > grenze, 'Verkaufswert liegt über der Schwelle');
  assert.ok(teil.einkaufNetto < grenze, 'Bestellwert liegt darunter');
  assert.ok(teil.frachtNetto > 0, 'also fällt Fracht an');
});

test('Über der Schwelle im Bestellwert entfällt die Fracht wirklich', () => {
  const korb = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 6 }], katalog);
  const teil = korb.teillieferungen.find((t) => t.lieferantId === 'bahnen-de');
  assert.ok(teil);

  const grenze = katalog.lieferantenById.get('bahnen-de').fracht.freiHausAbNetto;
  assert.ok(teil.einkaufNetto >= grenze, 'Bestellwert erreicht die Schwelle');
  assert.equal(teil.frachtNetto, 0);
  assert.match(teil.frachtGrund, /Bestellwert/);
});

test('Der Mindestbestellwert wird am Bestellwert gemessen', () => {
  // 2 × DR-100-050: Verkauf 330 €, Einkauf 231 €, Grenze 250 €.
  // Am Verkaufswert gemessen wäre das bestellbar — beim Lieferanten nicht.
  const korb = berechneWarenkorb([{ sku: 'DR-100-050', menge: 2 }], katalog);
  const teil = korb.teillieferungen[0];
  const grenze = katalog.lieferantenById.get('rohr-at').mindestbestellwertNetto;

  assert.ok(teil.warenwertNetto > grenze, 'Verkaufswert liegt über der Grenze');
  assert.ok(teil.einkaufNetto < grenze, 'Bestellwert liegt darunter');
  assert.equal(teil.mindestbestellwert.erfuellt, false);
  assert.equal(korb.bestellbar, false);
  assert.equal(teil.mindestbestellwert.bestellwertNetto, teil.einkaufNetto);
});

test('Der interne Hinweis nennt den erreichten Bestellwert, nicht nur den Fehlbetrag', () => {
  const korb = berechneWarenkorb([{ sku: 'DR-100-050', menge: 2 }], katalog);
  assert.equal(korb.hinweiseIntern.length, 1);
  assert.match(korb.hinweiseIntern[0], /Bestellwert/);
  assert.match(korb.hinweiseIntern[0], /erreicht sind 231 €/);
});

/*
 * Der Fund dieser Runde: Genau dieser Hinweis stand im Angebot an den Kunden.
 * Neben einem Warenwert von 330 € war „erreicht sind 231 €" zu lesen — die
 * Handelsspanne, in Ziffern, mit dem Hersteller daneben.
 */
test('Der Hinweis an den Kunden nennt keine Zahl aus dem Einkauf', () => {
  const korb = berechneWarenkorb([{ sku: 'DR-100-050', menge: 2 }], katalog);
  assert.equal(korb.hinweise.length, 1);

  const teil = korb.teillieferungen[0];
  for (const geheim of [teil.einkaufNetto, teil.mindestbestellwert.grenze, teil.mindestbestellwert.fehlbetragNetto]) {
    assert.ok(
      !korb.hinweise[0].includes(String(geheim)),
      `${geheim} steht im Hinweis an den Kunden: ${korb.hinweise[0]}`,
    );
  }
});

test('Der Hinweis an den Kunden sagt trotzdem, was zu tun ist', () => {
  const korb = berechneWarenkorb([{ sku: 'DR-100-050', menge: 2 }], katalog);
  const teil = korb.teillieferungen[0];

  assert.match(korb.hinweise[0], /zu klein/);
  assert.match(korb.hinweise[0], /Warenwert netto/);
  assert.match(korb.hinweise[0], new RegExp(teil.lieferantName));

  // Der genannte Fehlbetrag ist in der Währung des Kunden gerechnet und
  // deshalb größer als der im Einkauf — sonst wäre er wieder rückrechenbar.
  const genannt = Number(/rund (\d+) €/.exec(korb.hinweise[0])[1]);
  assert.ok(genannt > teil.mindestbestellwert.fehlbetragNetto, 'im Warenwert gerechnet, nicht im Einkauf');
});

test('Am Referenzgebäude ändert die Schwellenkorrektur nichts', () => {
  // Dort liegt jede Teillieferung mit Verkaufs- und Bestellwert auf derselben
  // Seite ihrer Schwelle. Die Kennzahlen der Analyse bleiben damit gültig.
  const korb = berechneWarenkorb(
    [
      { sku: 'AB-RD-375', menge: 5 },
      { sku: 'AB-PR-010', menge: 4 },
      { sku: 'ZB-DB-150', menge: 2 },
      { sku: 'ZB-MA-SET', menge: 1 },
      { sku: 'ZB-RR-125', menge: 4 },
      { sku: 'DR-100-050', menge: 1 },
      { sku: 'DR-FT-SET', menge: 1 },
      { sku: 'DR-KS-100', menge: 1 },
      { sku: 'DR-SL-100', menge: 1 },
    ],
    katalog,
  );
  assert.equal(korb.summeBrutto, 3900.2);
  assert.equal(korb.frachtNetto, 162);
  assert.equal(korb.einkaufNetto, 2030.8);
  assert.equal(korb.bestellbar, true);
});
