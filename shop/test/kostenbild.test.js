import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { berechneBedarf } from '../src/bedarf.js';
import {
  UST,
  gebuehrenanteil,
  kaskade,
  noetigerUmsatz,
  mehrumsatzGegenVorkasse,
  proBestellung,
} from '../src/kostenbild.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);
const referenz = berechneWarenkorb(
  berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4, mitDrainage: true }, katalog).warenkorbzeilen,
  katalog,
);

/** Das realistische Szenario aus phase3, Warenkorb 650 € nach phase4. */
const ZIEL = {
  zielgewinn: 5374,
  fixkosten: 650,
  rohmarge: 0.35,
  werbeanteil: 0.10,
  warenkorbNetto: 650,
  umsatzProSession: 0.02,
};

test('Der Gebührenanteil rechnet den Bruttosatz auf den Nettoumsatz um', () => {
  // 1,4 % auf brutto sind 1,68 % auf netto, dazu 0,25 € auf 650 € Warenkorb.
  const a = gebuehrenanteil('karte-stripe', 650);
  assert.ok(Math.abs(a - (0.014 * 1.2 + 0.25 / 650)) < 1e-12);
  assert.ok(a > 0.014, 'auf netto gerechnet liegt der Anteil über dem Listensatz');
  assert.equal(gebuehrenanteil('vorkasse', 650), 0);
});

test('Ohne Warenkorb lässt sich der Fixanteil nicht verteilen', () => {
  assert.throws(() => gebuehrenanteil('karte-stripe', 0), /braucht einen Warenkorb/);
  assert.throws(() => gebuehrenanteil('erfunden', 650), /Unbekannter Zahlweg/);
});

test('Ohne Gebühren stimmt die Kaskade mit phase3 überein', () => {
  const k = kaskade({ ...ZIEL, umsatzNetto: 24200 }, 'vorkasse');
  assert.ok(Math.abs(k.deckungsbeitragsrate - 0.25) < 1e-12);
  assert.equal(k.deckungsbeitrag, 6050);
  assert.equal(k.gewinnVorSteuer, 5400);
});

test('Mit Kartengebühr sinkt der Deckungsbeitrag unter die Zielgröße', () => {
  const k = kaskade({ ...ZIEL, umsatzNetto: 24200 }, 'karte-stripe');
  assert.ok(k.deckungsbeitragsrate < 0.25);
  assert.ok(k.gewinnVorSteuer < 5374, 'derselbe Umsatz trägt die Zielgröße nicht mehr');
  // 415,87 € statt der 415,81 € aus zahlung.js: Dort wird der Fixbetrag mit
  // genau 37 Bestellungen gerechnet, hier mit dem Umsatz geteilt durch 650 €,
  // also mit 37,2. Die Differenz von sechs Cent ist genau dieser Rest.
  assert.equal(k.gebuehren, 415.87);
});

test('Der nötige Umsatz steigt mit jedem Zahlweg', () => {
  const vorkasse = noetigerUmsatz(ZIEL, 'vorkasse');
  const karte = noetigerUmsatz(ZIEL, 'karte-stripe');
  const rechnung = noetigerUmsatz(ZIEL, 'rechnungskauf');

  assert.equal(vorkasse.umsatzNetto, 24096);
  assert.ok(karte.umsatzNetto > vorkasse.umsatzNetto);
  assert.ok(rechnung.umsatzNetto > karte.umsatzNetto);
  assert.equal(rechnung.bestellungen, 44);
});

test('Aus dem Umsatz folgen Bestellungen und Besuche', () => {
  const k = noetigerUmsatz(ZIEL, 'karte-stripe');
  assert.equal(k.bestellungen, Math.ceil(k.umsatzNetto / 650));
  assert.equal(k.sessions, Math.ceil(k.bestellungen / 0.02));
});

test('Ohne Sessionannahme wird keine Besucherzahl erfunden', () => {
  const k = noetigerUmsatz({ ...ZIEL, umsatzProSession: null }, 'karte-stripe');
  assert.equal(k.sessions, null);
});

test('Wenn Werbung und Gebühren die Rohmarge auffressen, wird das gesagt', () => {
  const eng = { ...ZIEL, rohmarge: 0.10, werbeanteil: 0.10 };
  const k = noetigerUmsatz(eng, 'karte-stripe');
  assert.equal(k.tragfaehig, false);
  assert.match(k.grund, /bleibt nichts übrig/);
});

test('Der Vergleich misst den Preis eines Zahlwegs in Mehrumsatz', () => {
  const v = mehrumsatzGegenVorkasse(ZIEL);
  const vorkasse = v.find((e) => e.zahlweg === 'vorkasse');
  const rechnung = v.find((e) => e.zahlweg === 'rechnungskauf');

  assert.equal(vorkasse.mehrumsatz, 0);
  assert.ok(rechnung.mehrumsatz > 3500, 'der Rechnungskauf kostet mehrere tausend Euro Mehrumsatz');
  assert.ok(rechnung.mehrBestellungen >= 6);
  assert.ok(!v.some((e) => e.zahlweg === 'nachnahme'), 'Nachnahme ist ausgeschlossen und steht nicht im Vergleich');
});

test('Der Vergleich ist nach nötigem Umsatz sortiert', () => {
  const v = mehrumsatzGegenVorkasse(ZIEL);
  for (let i = 1; i < v.length; i++) {
    assert.ok(v[i].umsatzNetto >= v[i - 1].umsatzNetto);
  }
});

test('Die Einzelbestellung rechnet mit dem echten Warenkorb, nicht dem Durchschnitt', () => {
  const p = proBestellung(referenz, 'karte-stripe', 0.10);

  assert.equal(p.bruttobetrag, referenz.summeBrutto);
  assert.equal(p.wareneinsatz, referenz.einkaufNetto);
  assert.equal(p.rohertrag, referenz.deckungsbeitragNetto);
  assert.ok(Math.abs(p.bleibt - (p.rohertrag - p.werbung - p.gebuehr)) < 0.005);
});

test('Von 34 % Mischmarge bleiben nach Werbung und Gebühr rund 22 %', () => {
  const p = proBestellung(referenz, 'karte-stripe', 0.10);
  assert.ok(referenz.mischmarge > 0.34);
  assert.ok(p.margeNachAllem > 0.21 && p.margeNachAllem < 0.24, `unerwartet: ${p.margeNachAllem}`);
});

test('Die Umsatzsteuer steht 20 % und wird nicht als Kosten geführt', () => {
  assert.equal(UST, 0.20);
  const p = proBestellung(referenz, 'vorkasse', 0.10);
  assert.equal(p.umsatzsteuer, referenz.ust);
  assert.ok(Math.abs(p.bleibt - (p.rohertrag - p.werbung)) < 0.005, 'ohne Gebühr bleibt Rohertrag minus Werbung');
});

test('Die Gebühr fällt auch auf die durchlaufende Fracht', () => {
  const ohne = gebuehrenanteil('karte-stripe', 650);
  const mit = gebuehrenanteil('karte-stripe', 650, 30);
  assert.ok(mit > ohne, 'Fracht in der Bemessungsgrundlage erhöht den Anteil');
  assert.ok(Math.abs((mit - ohne) - 0.014 * 1.2 * 30 / 650) < 1e-12, 'genau um Prozentsatz mal Bruttofracht je Warenwert');
  assert.throws(() => gebuehrenanteil('karte-stripe', 650, -1), /nicht negativ/);
});

test('Kaskade und Einzelbestellung rechnen jetzt dieselbe Gebühr', () => {
  // Der Fund dieser Runde: proBestellung nahm den vollen summeBrutto samt
  // Fracht, die Kaskade nur den Warenumsatz — dieselbe Gebühr, zwei
  // Bemessungsgrundlagen. Am echten Referenzwarenkorb gegeneinander gehalten:
  const einzeln = proBestellung(referenz, 'karte-stripe', 0);
  const k = kaskade(
    {
      umsatzNetto: referenz.warenwertNetto,
      rohmarge: referenz.mischmarge,
      werbeanteil: 0,
      fixkosten: 0,
      warenkorbNetto: referenz.warenwertNetto,
      frachtProBestellungNetto: referenz.frachtNetto,
    },
    'karte-stripe',
  );
  assert.ok(referenz.frachtNetto > 0, 'der Referenzkorb trägt tatsächlich Fracht');
  assert.ok(Math.abs(k.gebuehren - einzeln.gebuehr) < 0.011, `Kaskade ${k.gebuehren} gegen Einzelbestellung ${einzeln.gebuehr}`);
});

test('Mit Fracht in der Grundlage braucht das Ziel mehr Umsatz — wenig, aber in die ehrliche Richtung', () => {
  const ohne = noetigerUmsatz(ZIEL, 'karte-stripe');
  const mit = noetigerUmsatz({ ...ZIEL, frachtProBestellungNetto: 30 }, 'karte-stripe');
  assert.ok(mit.umsatzNetto > ohne.umsatzNetto);
  assert.ok(mit.umsatzNetto - ohne.umsatzNetto < ohne.umsatzNetto * 0.01, 'der Effekt bleibt unter einem Prozent');
});
