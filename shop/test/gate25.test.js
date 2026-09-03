/**
 * Gate 25 — der Mindestbestellwert gegenüber dem Kunden.
 *
 * **Der Anlass, 3. September 2026.** Gate 20 („keine Bestellung ohne positiven
 * Deckungsbeitrag") lief seit dem 28. August, aber es lief an der falschen
 * Stelle: in `darfAutomatischAusgeloestWerden`, also **nach** der Kasse. Ein
 * Warenkorb über 19,30 € wurde durchgerechnet, mit Preisen ausgewiesen und
 * als fertige Anfrage zum Abschicken angeboten — und wäre bei der Auslösung
 * abgelehnt worden.
 *
 * > **Eine Sperre, die erst nach dem Ja greift, ist keine Sperre, sondern
 * > eine Absage mit Verzögerung.**
 *
 * Diese Datei hält die getroffene Grenze gegen die Rechnung, aus der sie
 * stammt. Sie ist der Grund, warum die Zahl in `data/betreiber.json` nicht
 * still nach unten wandern kann: **Was der Shop annimmt, darf Gate 20 nicht
 * ablehnen.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { mindestbestellwertKunde, kundenWarenkorb } from '../src/shopkern.js';
import { baueKundenanfrage } from '../src/kundenanfrage.js';
import { traegtSichSelbst } from '../src/kostenbild.js';
import { ZAHLUNGSBEDINGUNGEN } from '../src/rechtstexte.js';

const lies = (name) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8'));

const betreiberDatei = lies('../data/betreiber.json');
const lieferanten = lies('../data/lieferanten.json').lieferanten;
const zielgroessen = lies('../data/zielgroessen.json');
const GRENZE = betreiberDatei.mindestbestellwertNetto;

test('die Grenze steht in den Betreiberdaten und ist eine Zahl über null', () => {
  assert.equal(typeof GRENZE, 'number', 'ohne Zahl sperrt die Kasse alles — auch das ist ein Fehler');
  assert.ok(GRENZE > 0, `Mindestbestellwert ${GRENZE}`);
  assert.ok(
    String(betreiberDatei._mindestbestellwertHinweis ?? '').length > 200,
    'eine Entscheidung ohne aufgeschriebene Herleitung ist eine Zahl aus dem Nichts',
  );
});

/**
 * Der Kern: Ab welchem Warenwert trägt eine Lieferung sich selbst?
 *
 * Gerechnet mit den bestätigten Poschacher-Konditionen und der Zielmarge aus
 * `zielgroessen.json` — nicht mit gerundeten Zahlen aus einem Dokument.
 */
function nulldurchgang(lieferant, palettenzahl, zahlwegId, rohmarge) {
  const nebenkosten =
    lieferant.nebenkosten.paletteOebbNetto * palettenzahl + lieferant.nebenkosten.folierungNetto;
  const frachtNetto = lieferant.fracht.pauschaleNetto + lieferant.fracht.sperrgutZuschlagNetto;
  let unten = 0;
  let oben = 5000;
  for (let i = 0; i < 60; i++) {
    const w = (unten + oben) / 2;
    const traegt = traegtSichSelbst(
      {
        warenwertNetto: w,
        einkaufNetto: w * (1 - rohmarge),
        frachtNetto,
        nebenkostenUntergrenzeNetto: nebenkosten,
      },
      { zahlwegId, frachtVerrechnet: true },
    );
    if (traegt.traegt) oben = w;
    else unten = w;
  }
  return oben;
}

test('was die Kasse annimmt, lehnt Gate 20 nicht ab — für jeden angebotenen Zahlweg', () => {
  const poschacher = lieferanten.find((l) => l.id === 'poschacher');
  assert.ok(poschacher, 'ohne den bestätigten Lieferanten prüft dieser Testfall nichts');
  const wege = ZAHLUNGSBEDINGUNGEN.angeboten.map((z) => z.id);
  assert.ok(wege.length >= 2, `nur ${wege.length} angebotene Zahlwege — die Schleife prüft zu wenig`);

  for (const zahlwegId of wege) {
    const schwelle = nulldurchgang(poschacher, 1, zahlwegId, zielgroessen.rohmarge);
    assert.ok(
      GRENZE >= schwelle,
      `${zahlwegId}: der Mindestbestellwert ${GRENZE} € liegt unter dem Nulldurchgang `
        + `${schwelle.toFixed(2)} € — die Kasse nimmt an, was Gate 20 ablehnt`,
    );
  }
});

test('die Grenze trägt auch die zweite Palette — die dritte nicht, und das steht so da', () => {
  // Die Palettenzahl je Lieferung ist nicht ableitbar: Der Katalog führt
  // Gewicht für sieben von 46 Artikeln. Eine Palette ist der belegte Boden,
  // zwei der erste unbelegte Schritt. Genau bis dorthin reicht die Grenze —
  // darüber bleibt Gate 20 die Rückfallebene, und der Hinweis in den
  // Betreiberdaten sagt das.
  const poschacher = lieferanten.find((l) => l.id === 'poschacher');
  const schlechtester = 'karte-stripe';
  const zwei = nulldurchgang(poschacher, 2, schlechtester, zielgroessen.rohmarge);
  const drei = nulldurchgang(poschacher, 3, schlechtester, zielgroessen.rohmarge);

  assert.ok(GRENZE >= zwei, `zwei Paletten tragen erst ab ${zwei.toFixed(2)} €`);
  assert.ok(GRENZE < drei, `drei Paletten tragen ab ${drei.toFixed(2)} € — die Grenze behauptet mehr, als sie deckt`);
  assert.match(
    String(betreiberDatei._mindestbestellwertHinweis),
    /DREI Paletten deckt diese Grenze NICHT/,
    'was die Grenze nicht deckt, gehört neben die Grenze',
  );
});

/* ------------------------------------------------------------------ *
 * Das Verhalten der Prüfung selbst
 * ------------------------------------------------------------------ */

test('unter der Grenze fehlt ein aufgerundeter Betrag, darüber nichts', () => {
  const zuKlein = mindestbestellwertKunde(96.5, 250);
  assert.equal(zuKlein.erfuellt, false);
  assert.equal(zuKlein.fehlbetragNetto, 154, 'aufgerundet, sonst reicht das Nachgelegte wieder nicht');
  assert.match(zuKlein.grund, /250 € netto Warenwert/);
  assert.match(zuKlein.grund, /154/);

  const genau = mindestbestellwertKunde(250, 250);
  assert.equal(genau.erfuellt, true, 'an der Grenze selbst ist sie erfüllt');
  assert.equal(genau.fehlbetragNetto, 0);
});

test('ohne hinterlegte Grenze gilt sie als nicht erfüllt, nicht als übersprungen', () => {
  // Dieselbe Begründung wie bei den Pflichtfeldern in `bestellung.js`: Eine
  // Sperre, die sich bei fehlender Angabe selbst abschaltet, ist keine.
  for (const fehlt of [null, undefined, 0, -5, '250']) {
    const u = mindestbestellwertKunde(10000, fehlt);
    assert.equal(u.erfuellt, false, `bei ${JSON.stringify(fehlt)} ließ die Prüfung durch`);
    assert.match(u.grund, /nicht hinterlegt/);
  }
});

test('der leere Warenkorb erfüllt den Mindestbestellwert nicht', () => {
  // `Math.min` über eine leere Liste ist `Infinity` — und damit über jeder
  // Grenze. Ohne diese Zeile wäre der leere Korb der einzige, der durchkommt.
  const leer = kundenWarenkorb([], { artikel: [], lieferanten, mindestbestellwertNetto: GRENZE });
  assert.equal(leer.mindestbestellwert.erfuellt, false);
});

/* ------------------------------------------------------------------ *
 * Gemessen am Korb, nicht an der Summe
 * ------------------------------------------------------------------ */

/** Zwei Artikel bei zwei Lieferanten, Preise frei gewählt. */
function korbDaten(preisA, preisB) {
  const artikel = [
    { sku: 'A-1', bezeichnung: 'Artikel A', gruppe: 'g', einheit: 'ST', lieferantId: 'poschacher',
      sperrgut: true, vkNetto: preisA, ekNetto: 1, gewichtKg: 10, preisStand: '2026-06-16' },
    { sku: 'B-1', bezeichnung: 'Artikel B', gruppe: 'g', einheit: 'ST', lieferantId: 'zubehoer-de',
      sperrgut: false, vkNetto: preisB, ekNetto: 1, gewichtKg: 2, preisStand: '2026-06-16' },
  ];
  return { artikel, lieferanten, mindestbestellwertNetto: 250 };
}

test('zwei kleine Teillieferungen sind zwei Verlustgeschäfte, auch wenn die Summe reicht', () => {
  // 200 + 200 = 400 € liegen über der Grenze; jede einzelne Lieferung liegt
  // darunter. Palette, Folierung und Anfahrt fallen je Lieferung an, also
  // misst die Grenze je Lieferung.
  const daten = korbDaten(200, 200);
  const korb = kundenWarenkorb([{ sku: 'A-1', menge: 1 }, { sku: 'B-1', menge: 1 }], daten);
  assert.equal(korb.teillieferungen.length, 2, 'ohne zwei Teillieferungen prüft dieser Fall nichts');
  assert.equal(korb.warenwertNetto, 400);
  assert.equal(korb.mindestbestellwert.erfuellt, false,
    'an der Summe gemessen wäre der Korb durchgekommen');
  assert.equal(korb.mindestbestellwert.fehlbetragNetto, 50);
});

test('reicht jede Teillieferung, ist die Grenze erfüllt', () => {
  const daten = korbDaten(300, 260);
  const korb = kundenWarenkorb([{ sku: 'A-1', menge: 1 }, { sku: 'B-1', menge: 1 }], daten);
  assert.equal(korb.teillieferungen.length, 2);
  assert.equal(korb.mindestbestellwert.erfuellt, true);
});

/* ------------------------------------------------------------------ *
 * Was der Kunde sieht
 * ------------------------------------------------------------------ */

test('unter der Grenze entsteht kein Anfragetext, sondern ein Grund', () => {
  const daten = korbDaten(100, 100);
  const korb = kundenWarenkorb([{ sku: 'A-1', menge: 1 }], daten);
  const a = baueKundenanfrage({
    rechnung: korb, bezirk: 'Perg',
    betreiber: { firma: 'Freudenthaler Bau GmbH', ort: 'Ried in der Riedmark', email: '' },
    datum: '2026-09-03',
  });
  assert.equal(a.moeglich, false, 'ein fertiger Text unter einer Absage wäre ein Angebot mit Widerruf daneben');
  assert.equal(a.text, '', 'kein halber Text, der sich kopieren lässt');
  assert.match(a.hindernis, /Mindestbestellwert/);
  assert.match(a.hindernis, /150/, 'der Fehlbetrag steht im Grund, nicht nur die Grenze');
});

test('der Grund nennt keine Spanne und keinen Einkaufspreis', () => {
  // Die stehende Weisung: keine Spanne auf einer Kundenseite. Der Fehlbetrag
  // ist in Warenwert gerechnet — aus ihm lässt sich kein Einkauf ableiten.
  const u = mindestbestellwertKunde(96.5, 250);
  for (const wort of ['Marge', 'Spanne', 'Einkauf', 'Palette', 'Deckungsbeitrag', 'Gate']) {
    assert.ok(!u.grund.includes(wort), `„${wort}" steht im Kundenhinweis`);
  }
});
