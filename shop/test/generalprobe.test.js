/**
 * Die Generalprobe des Freigabetags.
 *
 * Jedes Glied der Kette ist einzeln geprüft — Bogen, Auswertung, Kaskade,
 * Sessionbedarf, Partnerregeln. Was bisher niemand geprüft hat, ist das
 * **Zusammenspiel**: Kommen am Tag der Freigabe dreizehn Antworten und drei
 * bis fünf Partnerrückmeldungen, müssen sie ohne einen einzigen Handgriff am
 * Code durch die ganze Strecke laufen. Genau das behauptet Gate 17 („alle
 * Antworten sind am Tag ihres Eintreffens auswertbar") — hier läuft die
 * Behauptung als Probe.
 *
 * Alle Antworten sind FIKTIV und tragen erfundene Namen. Sie belegen nichts
 * über Hersteller oder Konditionen; sie belegen, dass die Strecke trägt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { pruefeBogen, werteRundeAus } from '../src/auswertung.js';
import { pruefePartnerbogen, wertePartnerrundeAus, PREISBAND_STUFE_A } from '../src/partnerauswertung.js';
import { MARGENUNTERGRENZE } from '../src/preis.js';

/** Die kanonische Lage aus phase3/phase4, samt Zahlweg und Referenzfracht. */
const LAGE = {
  zielgewinn: 5374,
  fixkosten: 650,
  werbeanteil: 0.10,
  warenkorbNetto: 650,
  frachtProBestellungNetto: 34.1,
  umsatzProSession: 0.02,
  zahlweg: 'karte-stripe',
};

// --- Fiktive Lieferantenantworten: zwei Hersteller, ein Großhändler --------

const bahnenHersteller = {
  hersteller: 'FIKTIV Bahnen GmbH',
  sortiment: 'Bahnen',
  streckengeschaeft: true,
  haendlerrabatt: 0.40,
  frachtmodell: 'freiHausAb',
  produktdaten: 'csv',
  preisrhythmus: 'jährlich zum 1. Februar',
  fakturierendesLand: 'DE',
};

const rohrHersteller = {
  hersteller: 'FIKTIV Rohr GmbH',
  sortiment: 'Rohr',
  streckengeschaeft: true,
  haendlerrabatt: 0.36,
  frachtmodell: 'staffel',
  produktdaten: 'excel',
  preisrhythmus: 'halbjährlich',
  fakturierendesLand: 'AT',
};

const grosshaendler = {
  hersteller: 'FIKTIV Baustoffgroßhandel eGen',
  sortiment: 'Bahnen',
  streckengeschaeft: true,
  einkaufNetto: 6.2,
  strassenpreisDeckelNetto: 10.5,
  frachtmodell: 'pauschale',
  produktdaten: 'csv',
  preisrhythmus: 'IDS Connect, tagesaktuell',
  fakturierendesLand: 'AT',
};

const absage = { hersteller: 'FIKTIV Schweigsam AG' };

test('Generalprobe A: dreizehn Antworten laufen ohne Handgriff bis zur Sessionzahl', () => {
  // Der Rücklauf: drei verwertbare Antworten, der Rest schweigt oder sagt ab.
  const antworten = [bahnenHersteller, rohrHersteller, grosshaendler, absage];

  // Schritt 1: Der Bogen nimmt jede verwertbare Antwort vollständig an.
  for (const a of [bahnenHersteller, rohrHersteller, grosshaendler]) {
    assert.equal(pruefeBogen(a).vollstaendig, true, `${a.hersteller} scheitert schon am Bogen`);
  }
  assert.equal(pruefeBogen(absage).vollstaendig, false, 'Schweigen ist kein vollständiger Bogen');

  // Schritt 2: Die Runde besteht, die tragende Marge ist der zweitbeste Wert.
  const runde = werteRundeAus(antworten, LAGE);
  assert.equal(runde.pruefungA, true);
  assert.equal(runde.bestanden, 3);
  // Rabattweg 40 % und 36 %, Großhandelsweg 1 − 6,2/10,5 ≈ 40,95 % — der
  // zweitbeste ist der 40er-Rabatt, der drittbeste (36 %) begrenzt nicht.
  assert.ok(Math.abs(runde.tragendeMarge - 0.40) < 1e-9, `tragende Marge ${runde.tragendeMarge}`);

  // Schritt 3: Die Kaskade übernimmt die Marge und liefert den Besucherbedarf.
  assert.ok(runde.folgen?.tragfaehig, 'die Kaskade muss mit der tragenden Marge rechnen');
  assert.ok(runde.folgen.sessions > 1000 && runde.folgen.sessions < 3000, `Sessions ${runde.folgen.sessions}`);
  assert.ok(runde.folgen.umsatzNetto > 15000 && runde.folgen.umsatzNetto < 30000, `Umsatz ${runde.folgen.umsatzNetto}`);
});

test('Generalprobe A, Gegenlage: zwei magere Zusagen reißen die Untergrenze und die Runde sagt es', () => {
  const mager = { ...bahnenHersteller, hersteller: 'FIKTIV Mager GmbH', haendlerrabatt: 0.31 };
  const runde = werteRundeAus([mager, rohrHersteller, absage], LAGE);
  assert.equal(runde.pruefungA, false, '31 % liegen unter der Untergrenze — nur einer besteht');
  assert.match(runde.grund, /ein einzelner Lieferant ist kein Sortiment|Kein Hersteller/);
  assert.ok(0.31 < MARGENUNTERGRENZE, 'die Probe prüft wirklich unterhalb der Untergrenze');
});

test('Generalprobe B: fünf Partnerantworten laufen bis zum tragenden Leadpreis', () => {
  const partner = (betrieb, bezirk, extra = {}) => ({
    betrieb: `FIKTIV ${betrieb}`,
    bezirk,
    feuchteArbeiten: true,
    namentlicheNennung: true,
    leadpreis: 150,
    rueckmeldefrist24h: true,
    exklusivitaetLeistungsgebunden: true,
    ...extra,
  });

  const antworten = [
    partner('Abdichtung Nord', 'Braunau am Inn', { leadpreis: 180 }),
    partner('Keller & Co', 'Schärding'),
    partner('Sanierung Süd', 'Vöcklabruck', { namentlicheNennung: false }),
    partner('Nur Radon', 'Linz-Land', { feuchteArbeiten: false, leadpreis: 220 }),
    partner('Zögerer', 'Wels-Land', { rueckmeldefrist24h: false }),
  ];

  assert.equal(antworten.length, 5, 'fünf Rückmeldungen — der obere Rand der Stufe-A-Planung');
  for (const a of antworten) {
    assert.equal(pruefePartnerbogen(a).vollstaendig, true, `${a.betrieb} scheitert am Bogen`);
  }

  const runde = wertePartnerrundeAus(antworten);
  assert.equal(runde.machbar, true, 'drei bestehen — die Bauform ist belegt');
  assert.equal(runde.bestanden, 3);
  assert.equal(runde.tragenderLeadpreis, 180, 'der zweithöchste der Bestandenen (220, 180, 150)');
  assert.equal(runde.imPreisband, true);
  assert.ok(PREISBAND_STUFE_A.von <= 180 && 180 <= PREISBAND_STUFE_A.bis);
  assert.equal(runde.mitFeuchteArbeiten, 4, 'die Gruppe-C-Reichweite wird mitgezählt');
});
