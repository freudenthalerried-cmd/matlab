import test from 'node:test';
import assert from 'node:assert/strict';
import { traegtSichSelbst, mindestwarenkorbFreiHaus } from '../src/kostenbild.js';

const korb = (warenwertNetto, einkaufNetto, frachtNetto) => ({ warenwertNetto, einkaufNetto, frachtNetto });

test('verrechnete Fracht rettet die Bestellung, eingepreiste Fracht versenkt sie', () => {
  // 100 € Warenwert bei 20 % Rohmarge = 80 € Einkauf, 25 € Fracht.
  const k = korb(100, 80, 25);
  const verrechnet = traegtSichSelbst(k, { frachtVerrechnet: true });
  const freiHaus = traegtSichSelbst(k, { frachtVerrechnet: false });

  assert.equal(verrechnet.traegt, true, 'zahlt der Kunde die Fracht, bleibt etwas übrig');
  assert.ok(verrechnet.deckungsbeitragNetto > 15);
  assert.equal(freiHaus.traegt, false, 'frei Haus frisst denselben Warenkorb auf');
  assert.ok(freiHaus.deckungsbeitragNetto < 0);
  assert.ok(
    freiHaus.gruende[0].includes('frei Haus'),
    'der Grund nennt die Ursache, statt nur eine Zahl zu melden',
  );
});

test('Gate 20 ist strenger als eine Margenschwelle — es prüft die einzelne Bestellung', () => {
  // Dieselbe Rohmarge von 20 %, zwei Warenkörbe: der große trägt, der kleine nicht.
  const gross = traegtSichSelbst(korb(650, 520, 25), { frachtVerrechnet: false });
  const klein = traegtSichSelbst(korb(50, 40, 25), { frachtVerrechnet: false });
  assert.equal(gross.traegt, true);
  assert.equal(klein.traegt, false);
});

test('die Zahlungsgebühr wird auf den Bruttobetrag gerechnet, den der Kunde zahlt', () => {
  const ohneFracht = traegtSichSelbst(korb(100, 80, 0), { zahlwegId: 'karte-stripe' });
  // 100 € netto = 120 € brutto; 1,4 % davon = 1,68 €, plus 0,25 € Fixbetrag.
  assert.equal(ohneFracht.gebuehrNetto, 1.93);
  const vorkasse = traegtSichSelbst(korb(100, 80, 0), { zahlwegId: 'vorkasse' });
  assert.equal(vorkasse.gebuehrNetto, 0, 'Vorkasse kostet keine Gebühr');
  assert.ok(vorkasse.deckungsbeitragNetto > ohneFracht.deckungsbeitragNetto);
});

test('der Mindestwarenkorb für frei Haus stimmt mit der vorgelegten Rechnung überein', () => {
  const erwartet = [
    [15, 83.24],
    [25, 137.83],
    [40, 219.71],
    [60, 328.88],
  ];
  assert.equal(erwartet.length, 4, 'vier Frachtstufen werden geprüft');
  for (const [fracht, schwelle] of erwartet) {
    const s = mindestwarenkorbFreiHaus({ rohmarge: 0.2, frachtNetto: fracht });
    assert.equal(s.erreichbar, true);
    assert.equal(s.warenkorbNetto, schwelle, `bei ${fracht} € Fracht`);
  }
});

test('an der Schwelle selbst trägt die Bestellung gerade eben', () => {
  const s = mindestwarenkorbFreiHaus({ rohmarge: 0.2, frachtNetto: 25 });
  const knappDarunter = traegtSichSelbst(
    korb(s.warenkorbNetto - 1, (s.warenkorbNetto - 1) * 0.8, 25),
    { frachtVerrechnet: false },
  );
  const knappDarueber = traegtSichSelbst(
    korb(s.warenkorbNetto + 1, (s.warenkorbNetto + 1) * 0.8, 25),
    { frachtVerrechnet: false },
  );
  assert.equal(knappDarunter.traegt, false, 'einen Euro darunter trägt es nicht');
  assert.equal(knappDarueber.traegt, true, 'einen Euro darüber trägt es');
});

test('eine Rohmarge unter der Zahlungsgebühr ist mit keinem Warenkorb zu retten', () => {
  const s = mindestwarenkorbFreiHaus({ rohmarge: 0.01, frachtNetto: 25 });
  assert.equal(s.erreichbar, false);
  assert.ok(s.grund.includes('Zahlungsgebühr'));
});

test('genau null trägt nicht — ein Nullgeschäft deckt keine Fixkosten', () => {
  // Vorkasse (keine Gebühr), keine Fracht, Verkauf zum Einkaufspreis:
  // der Deckungsbeitrag ist exakt 0.
  const nullgeschaeft = traegtSichSelbst(korb(100, 100, 0), { zahlwegId: 'vorkasse' });
  assert.equal(nullgeschaeft.deckungsbeitragNetto, 0);
  assert.equal(
    nullgeschaeft.traegt,
    false,
    'null ist kein Beitrag — die Bestellung kostet Arbeit und trägt nichts zu Fixkosten und Gewinn bei',
  );
  assert.ok(nullgeschaeft.gruende.length > 0, 'und der Grund wird genannt');
});

/* ------------------------------------------------------------------ *
 * Palette und Folierung in Gate 20
 * ------------------------------------------------------------------ */

test('nicht weiterverrechnete Nebenkosten mindern den Deckungsbeitrag', () => {
  const ohne = traegtSichSelbst({ warenwertNetto: 100, einkaufNetto: 80, frachtNetto: 25 });
  const mit = traegtSichSelbst({
    warenwertNetto: 100, einkaufNetto: 80, frachtNetto: 25, nebenkostenUntergrenzeNetto: 28.5,
  });
  assert.equal(mit.nebenkostenNetto, 28.5);
  assert.ok(mit.deckungsbeitragNetto < ohne.deckungsbeitragNetto - 28,
    `${mit.deckungsbeitragNetto} gegen ${ohne.deckungsbeitragNetto}`);
});

test('kippt die Bestellung daran, sagt der Grund es', () => {
  // Sonst steht dort eine Zahl, die niemand erklären kann — und die
  // naheliegende Erklärung wäre die falsche (die Fracht).
  const k = traegtSichSelbst({
    warenwertNetto: 100, einkaufNetto: 80, frachtNetto: 25, nebenkostenUntergrenzeNetto: 28.5,
  });
  assert.equal(k.traegt, false);
  assert.match(k.gruende[0], /Palette und Folierung/);
});

test('ohne palettierte Ware ändert sich nichts an der alten Rechnung', () => {
  const k = traegtSichSelbst({ warenwertNetto: 100, einkaufNetto: 80, frachtNetto: 25 });
  assert.equal(k.nebenkostenNetto, 0);
  assert.equal(k.traegt, true);
});
