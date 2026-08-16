import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANNAHMEN,
  sessionbedarf,
  verschlechtere,
  elastizitaet,
  rangfolge,
  kipppunkt,
} from '../src/empfindlichkeit.js';

const LAGE = {
  zielgewinn: 5374,
  fixkosten: 650,
  rohmarge: 0.35,
  werbeanteil: 0.10,
  warenkorbNetto: 650,
  umsatzProSession: 0.02,
};

test('Die vier Annahmen tragen Herkunft, Konfidenz und den Weg zur Klärung', () => {
  assert.equal(ANNAHMEN.length, 4);
  for (const a of ANNAHMEN) {
    assert.ok(a.herkunft.length > 10, `${a.id} ohne Herkunft`);
    assert.ok(a.klaertDurch.length > 10, `${a.id} ohne Klärungsweg`);
    assert.ok(['kleiner', 'groesser'].includes(a.schlechterIst));
  }
});

test('Verschlechtern heißt bei jeder Annahme etwas anderes', () => {
  const m = verschlechtere(LAGE, 'rohmarge', 0.10);
  assert.ok(m.rohmarge < LAGE.rohmarge, 'weniger Marge ist schlechter');

  const w = verschlechtere(LAGE, 'werbeanteil', 0.10);
  assert.ok(w.werbeanteil > LAGE.werbeanteil, 'mehr Werbekosten sind schlechter');
});

test('Eine Annahme, die in der Lage fehlt, wird nicht erfunden', () => {
  assert.throws(() => verschlechtere({}, 'rohmarge', 0.1), /führt keinen Wert/);
  assert.throws(() => verschlechtere(LAGE, 'wetter', 0.1), /Unbekannte Annahme/);
});

test('Die Rohmarge ist der stärkste Hebel, stärker als proportional', () => {
  const e = elastizitaet(LAGE, 'rohmarge', 'karte-stripe');
  assert.ok(e.elastizitaet > 1.5, `erwartet über 1,5 — ist ${e.elastizitaet}`);
  assert.ok(e.mehrSessions > 300);
});

test('Die Umsatzquote wirkt proportional', () => {
  const e = elastizitaet(LAGE, 'umsatzProSession', 'karte-stripe');
  assert.ok(e.elastizitaet > 1.0 && e.elastizitaet < 1.2, `${e.elastizitaet}`);
});

test('Ein kleinerer Warenkorb schadet zweifach', () => {
  // Erstens braucht es mehr Bestellungen für denselben Umsatz. Zweitens steigt
  // der Anteil des Fixbetrags der Zahlungsgebühr, weil er sich auf weniger
  // Warenwert verteilt — die Deckungsbeitragsrate sinkt zusätzlich.
  const mitFix = elastizitaet(LAGE, 'warenkorbNetto', 'karte-stripe');
  const ohneFix = elastizitaet(LAGE, 'warenkorbNetto', 'rechnungskauf');

  assert.ok(mitFix.elastizitaet > 1.2, `mit Fixbetrag: ${mitFix.elastizitaet}`);
  assert.ok(
    mitFix.elastizitaet > ohneFix.elastizitaet,
    'beim Rechnungskauf ohne Fixbetrag fällt der zweite Effekt weg',
  );
});

test('Der Werbekostenanteil ist der schwächste Hebel', () => {
  const werbung = elastizitaet(LAGE, 'werbeanteil', 'karte-stripe');
  const marge = elastizitaet(LAGE, 'rohmarge', 'karte-stripe');
  assert.ok(werbung.elastizitaet < 0.6);
  assert.ok(werbung.elastizitaet < marge.elastizitaet / 2);
});

test('Nahe der Gate-1-Untergrenze wird die Rohmarge noch empfindlicher', () => {
  const bei35 = elastizitaet(LAGE, 'rohmarge', 'karte-stripe');
  const bei32 = elastizitaet({ ...LAGE, rohmarge: 0.32 }, 'rohmarge', 'karte-stripe');
  assert.ok(bei32.elastizitaet > bei35.elastizitaet, 'die Wirkung wächst zur Untergrenze hin');
});

test('Der teurere Zahlweg verschärft die Empfindlichkeit', () => {
  const karte = elastizitaet(LAGE, 'rohmarge', 'karte-stripe');
  const rechnung = elastizitaet(LAGE, 'rohmarge', 'rechnungskauf');
  assert.ok(rechnung.elastizitaet > karte.elastizitaet);
  assert.ok(rechnung.basisSessions > karte.basisSessions);
});

test('Die Rangfolge stellt die Rohmarge nach oben', () => {
  const r = rangfolge(LAGE, 'karte-stripe');
  assert.equal(r.length, 4);
  assert.equal(r[0].annahme, 'rohmarge');
  assert.equal(r[3].annahme, 'werbeanteil');
});

test('Die Rangfolge trägt mit, wie sich jede Annahme klären lässt', () => {
  for (const e of rangfolge(LAGE, 'karte-stripe')) {
    assert.ok(e.klaertDurch.length > 10);
    assert.ok(e.konfidenz.length > 3);
  }
});

test('Die Rohmarge hat einen Kipppunkt, die Umsatzquote nicht', () => {
  const marge = kipppunkt(LAGE, 'rohmarge', 'karte-stripe');
  assert.equal(marge.kippt, true);
  assert.ok(marge.wert > 0.11 && marge.wert < 0.13, `Kipppunkt bei ${marge.wert}`);

  const quote = kipppunkt(LAGE, 'umsatzProSession', 'karte-stripe');
  assert.equal(quote.kippt, false, 'weniger Besucherausbeute macht das Modell teurer, nicht untragbar');
});

test('Wo das Modell nicht mehr trägt, wird das gesagt statt gerechnet', () => {
  const eng = { ...LAGE, rohmarge: 0.13 };
  const e = elastizitaet(eng, 'rohmarge', 'karte-stripe');
  assert.equal(e.traegtNicht, true);
  assert.equal(e.neueSessions, null);
  assert.match(e.hinweis, /trägt das Modell nicht mehr/);
});

test('Eine Ausgangslage, die schon nicht trägt, wird nicht schöngerechnet', () => {
  const kaputt = { ...LAGE, rohmarge: 0.10 };
  assert.equal(sessionbedarf(kaputt, 'karte-stripe'), null);
  assert.throws(() => elastizitaet(kaputt, 'rohmarge', 'karte-stripe'), /trägt das Modell schon nicht/);
});
