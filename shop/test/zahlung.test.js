import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { berechneBedarf } from '../src/bedarf.js';
import { cent } from '../src/preis.js';
import {
  ZAHLWEGE,
  ANFORDERUNGEN,
  gebuehr,
  wirkungAufBestellung,
  wirkungAufMonat,
  pruefeZahlweg,
  vergleiche,
  zahlwegName,
  namensbefund,
  INTERNE_WOERTER,
  NICHT_IM_REGISTER,
} from '../src/zahlung.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);

/** Das Referenzgebäude aus phase4: 12 × 10 m, vier Durchführungen, mit Drainage. */
const referenz = berechneWarenkorb(
  berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4, mitDrainage: true }, katalog).warenkorbzeilen,
  katalog,
);

/** Die Planungslage aus PARAMETER.md und phase4. */
const LAGE = { umsatzNetto: 24200, bestellungen: 37, zielgewinn: 5374 };

test('Die Gebühr ist Prozentsatz auf brutto plus Fixbetrag', () => {
  assert.equal(gebuehr(1000, 'karte-stripe'), 14.25);
  assert.equal(gebuehr(1000, 'vorkasse'), 0);
  assert.equal(gebuehr(1000, 'paypal'), 25.25);
});

test('Ein unbekannter Zahlweg und ein Betrag von null werden zurückgewiesen', () => {
  assert.throws(() => gebuehr(1000, 'bitcoin'), /Unbekannter Zahlweg/);
  assert.throws(() => gebuehr(0, 'karte-stripe'), /positiven Bruttobetrag/);
});

test('Die Gebühr trifft den Deckungsbeitrag härter, als der Prozentsatz aussieht', () => {
  const w = wirkungAufBestellung(referenz, 'karte-stripe');

  assert.equal(w.bruttobetrag, 3900.2);
  assert.equal(w.gebuehr, 54.85);
  // 1,4 % auf brutto sind gerechnet auf den Warenwert netto spürbar mehr.
  assert.ok(w.effektivAufWarenwert > 0.014, 'auf den Warenwert netto gerechnet liegt es über dem Listensatz');
  assert.ok(w.anteilAmDeckungsbeitrag > 0.04 && w.anteilAmDeckungsbeitrag < 0.07);
  assert.equal(w.deckungsbeitragNachher, cent(referenz.deckungsbeitragNetto - 54.85));
});

test('Rechnungskauf kostet ein Vielfaches der Karte', () => {
  const karte = wirkungAufBestellung(referenz, 'karte-stripe');
  const rechnung = wirkungAufBestellung(referenz, 'rechnungskauf');
  assert.ok(rechnung.gebuehr > karte.gebuehr * 2);
});

test('Die Monatshochrechnung rechnet auf den Bruttoumsatz', () => {
  const m = wirkungAufMonat(LAGE, 'karte-stripe');
  assert.equal(m.umsatzBrutto, 29040);
  assert.equal(m.gebuehrProMonat, 415.81);
  assert.ok(m.anteilAmZielgewinn > 0.07 && m.anteilAmZielgewinn < 0.08);
});

test('Vorkasse kostet im Modell nichts', () => {
  const m = wirkungAufMonat(LAGE, 'vorkasse');
  assert.equal(m.gebuehrProMonat, 0);
  assert.equal(m.anteilAmZielgewinn, 0);
});

test('Ohne Bestellungen wird nicht hochgerechnet', () => {
  assert.throws(() => wirkungAufMonat({ ...LAGE, bestellungen: 0 }, 'karte-stripe'), /braucht Bestellungen/);
});

test('Nachnahme scheitert an der Registrierkasse und an der Rückmeldung', () => {
  const p = pruefeZahlweg('nachnahme', LAGE);
  assert.equal(p.geeignet, false);
  assert.ok(p.verletzt.some((v) => /Registrierkassenpflicht/.test(v)));
  assert.ok(p.verletzt.some((v) => /maschinell/.test(v)));
});

test('Vorkasse scheitert allein an der fehlenden maschinellen Rückmeldung', () => {
  const p = pruefeZahlweg('vorkasse', LAGE);
  assert.equal(p.geeignet, false);
  assert.deepEqual(p.verletzt, ['Meldet den Zahlungseingang maschinell zurück']);
});

test('Rechnungskauf reißt die Kostenschwelle', () => {
  const p = pruefeZahlweg('rechnungskauf', LAGE);
  assert.equal(p.geeignet, false);
  assert.ok(p.verletzt.some((v) => /10 % des Zielgewinns/.test(v)));
});

test('EPS erfüllt alle vier Anforderungen', () => {
  const p = pruefeZahlweg('eps', LAGE);
  assert.equal(p.geeignet, true);
  assert.deepEqual(p.verletzt, []);
});

test('Jede Anforderung nennt, woher sie kommt', () => {
  assert.equal(ANFORDERUNGEN.length, 4);
  for (const a of ANFORDERUNGEN) {
    assert.ok(a.herkunft && a.herkunft.length > 5, `${a.id} ohne Herkunft`);
  }
});

test('Der Vergleich sortiert nach Monatskosten und lässt keinen Zahlweg aus', () => {
  const v = vergleiche(LAGE);
  assert.equal(v.length, ZAHLWEGE.length);
  for (let i = 1; i < v.length; i++) {
    assert.ok(v[i].gebuehrProMonat >= v[i - 1].gebuehrProMonat);
  }
  assert.equal(v[0].zahlweg, 'vorkasse', 'der billigste Weg ist der, den niemand anbietet');
});

test('Jeder Zahlweg trägt Quelle und Konfidenz', () => {
  assert.ok(ZAHLWEGE.length >= 7, `nur ${ZAHLWEGE.length} Zahlwege`);
  for (const z of ZAHLWEGE) {
    assert.ok(['hoch', 'mittel', 'niedrig'].includes(z.konfidenz), `${z.id} ohne Konfidenz`);
    assert.ok(z.quelle && z.quelle.length > 5, `${z.id} ohne Quelle`);
  }
});

test('Beim Rechnungskauf ist die Konfidenz ausdrücklich niedrig', () => {
  const r = ZAHLWEGE.find((z) => z.id === 'rechnungskauf');
  assert.equal(r.konfidenz, 'niedrig');
  assert.match(r.quelle, /nicht veröffentlicht/);
});

test('Die Monatshochrechnung nimmt die Fracht in die Bemessungsgrundlage', () => {
  const lage = { umsatzNetto: 24000, bestellungen: 37, zielgewinn: 5374 };
  const ohne = wirkungAufMonat(lage, 'karte-stripe');
  const mit = wirkungAufMonat({ ...lage, frachtProBestellungNetto: 30 }, 'karte-stripe');
  assert.ok(mit.gebuehrProMonat > ohne.gebuehrProMonat);
  const erwartet = 0.014 * 1.2 * 30 * 37;
  assert.ok(
    Math.abs(mit.gebuehrProMonat - ohne.gebuehrProMonat - erwartet) < 0.02,
    'genau der Prozentsatz auf die Bruttofracht aller Bestellungen',
  );
});

/* ------------------------------------------------------------------ *
 * Ein Feld, zwei Leser — 5. September
 *
 * `name` ging an die interne Kostentabelle **und** an den Kunden. In
 * `ausgabe/website.html` stand dadurch seit dem ersten Bau der AGB-Seite
 * „Kreditkarte (EU-Karte, Listenpreis Stripe)" — Abwickler und Preisart eines
 * Anbieters, der noch nicht gewählt ist. Zwei Absätze darunter sagte dieselbe
 * Seite, dass er noch nicht gewählt ist.
 * ------------------------------------------------------------------ */

test('kein Kundenname trägt ein internes Wort', () => {
  const b = namensbefund();
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.equal(b.zahlwege, ZAHLWEGE.length);
  assert.ok(b.woerter >= 3, 'ein leeres Register bestünde jede Prüfung');
});

test('der Kunde liest den Kundennamen, die Kostentabelle den internen', () => {
  assert.equal(zahlwegName('karte-stripe'), 'Kreditkarte (EU-Karte)');
  assert.match(ZAHLWEGE.find((z) => z.id === 'karte-stripe').name, /Stripe/,
    'intern bleibt der Abwickler stehen — dort ist er die Angabe, um die es geht');
  assert.equal(zahlwegName('offene-rechnung'), 'Offene Rechnung, 30 Tage netto');
});

test('ein Zahlweg ohne Kundennamen wird nicht stillschweigend zum internen', () => {
  // Der naheliegende Rückfall wäre `z.kundenname ?? z.name`. Er sähe aus wie
  // Vorsorge und wäre der Fehler von heute, nur seltener.
  const ohne = ZAHLWEGE.map((z) => ({ ...z, kundenname: undefined }));
  const b = namensbefund(ohne);
  assert.equal(b.meldungen.filter((m) => m.regel === 'kundenname-fehlt').length, ZAHLWEGE.length);
});

test('ein internes Wort, das im Kundennamen steht, fällt auf', () => {
  const kaputt = [{ id: 'x', name: 'Karte (Listenpreis Stripe)', kundenname: 'Karte über Stripe' }];
  const b = namensbefund(kaputt, INTERNE_WOERTER.filter((w) => w.wort === 'Stripe'));
  assert.ok(b.meldungen.some((m) => m.regel === 'internes-wort-im-kundennamen'));
});

test('ein Eintrag, den kein interner Name mehr trägt, fällt auf', () => {
  // Die Rückrichtung. Ohne sie bliebe ein Register grün, weil es leerläuft.
  const b = namensbefund(ZAHLWEGE, [{ wort: 'Adyen', warum: 'x'.repeat(120) }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'wort-ohne-fall'));
});

test('jeder Eintrag trägt einen tragfähigen Grund, auch der ausgeschlossene', () => {
  for (const w of INTERNE_WOERTER) assert.ok(w.warum.length >= 80, w.wort);
  assert.ok(NICHT_IM_REGISTER.length >= 1);
  for (const w of NICHT_IM_REGISTER) assert.ok(w.warumNicht.length >= 80, w.wort);
});

test('„Listenpreis" steht im Gegenregister, nicht im Register', () => {
  // Das Wort meint an 216 Fundstellen den Listenpreis des Herstellers — das
  // Verkaufsargument des Shops. Ein Prüfer, der es anschwärzt, wird
  // abgeschaltet, und dann meldet er auch „Listenpreis Stripe" nicht mehr.
  assert.ok(NICHT_IM_REGISTER.some((w) => w.wort === 'Listenpreis'));
  const b = namensbefund(ZAHLWEGE, [...INTERNE_WOERTER, { wort: 'Listenpreis', warum: 'x'.repeat(120) }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'zweimal-gefuehrt'));
});
