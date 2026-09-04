import test from 'node:test';
import assert from 'node:assert/strict';
import { baubefund, bestellwegAktiv, EMPFANGSSKRIPT, warenkorbZusage } from '../src/bestellwegbau.js';
import { VORAUSSETZUNGEN } from '../src/bestellweg.js';
import { websiteVerarbeitung } from '../src/rechtstexte.js';

const VOLL = { email: 'office@bauversand.com', rechtstexteFundstelle: 'Kanzlei X' };

test('ohne Voraussetzung ist der Weg aus, und die Lücken werden benannt', () => {
  assert.ok(VORAUSSETZUNGEN.length >= 2, 'zu wenige Voraussetzungen — die Schleife prüfte kaum etwas');
  const b = bestellwegAktiv({}, VORAUSSETZUNGEN);
  assert.equal(b.aktiv, false);
  assert.equal(b.fehlend.length, VORAUSSETZUNGEN.length);
});

test('eine leere Zeichenkette zählt nicht als Angabe', () => {
  assert.equal(bestellwegAktiv({ ...VOLL, email: '   ' }, VORAUSSETZUNGEN).aktiv, false);
});

test('mit allen Voraussetzungen ist der Weg an', () => {
  assert.equal(bestellwegAktiv(VOLL, VORAUSSETZUNGEN).aktiv, true);
});

test('die Zusage über den Warenkorb kippt mit dem Schalter', () => {
  const aus = warenkorbZusage(false, 'korb-v1');
  const an = warenkorbZusage(true, 'korb-v1');
  assert.match(aus, /nicht an den Server übertragen/);
  assert.ok(!an.includes('nicht an den Server übertragen'),
    'die eingeschaltete Fassung darf das Gegenteil nicht behaupten');
  assert.match(an, new RegExp(EMPFANGSSKRIPT.replace('.', '\\.')));
  for (const satz of [aus, an]) assert.match(satz, /korb-v1/, 'der Schlüssel gehört in beide');
});

test('die Zusagenliste der Rechtsseite folgt demselben Schalter', () => {
  // Der Kern von Gate 26: Zwei Schalter für dieselbe Sache sind ein Schalter,
  // den einer vergisst. Deshalb gibt es die Liste nur noch als Funktion.
  const finde = (l) => l.find((z) => z.id === 'warenkorb-im-browser').befund;
  assert.notEqual(finde(websiteVerarbeitung(false)), finde(websiteVerarbeitung(true)));
  assert.match(finde(websiteVerarbeitung(false)), /nicht an den Server übertragen/);
  assert.match(finde(websiteVerarbeitung(true)), new RegExp(EMPFANGSSKRIPT.replace('.', '\\.')));
});

test('jede Zusage der Liste trägt einen Befund — auch die geschaltete', () => {
  for (const aktiv of [false, true]) {
    const liste = websiteVerarbeitung(aktiv);
    assert.ok(liste.length >= 5, `nur ${liste.length} Zusagen bei aktiv=${aktiv}`);
    for (const z of liste) {
      assert.ok(typeof z.befund === 'string' && z.befund.length > 20,
        `${z.id} ohne Befund bei aktiv=${aktiv}`);
    }
  }
});

test('der Baubefund sagt in Sätzen, was er tut', () => {
  const aus = baubefund({}, 'korb-v1', VORAUSSETZUNGEN);
  assert.equal(aus.aktiv, false);
  assert.match(aus.saetze[0], /nicht mitgeliefert/);
  // Jede Lücke nennt ihr Feld — sonst wüsste der Auftraggeber nicht, wohin.
  for (const v of aus.fehlend) assert.ok(aus.saetze.some((s) => s.includes(v.feld)));

  const an = baubefund(VOLL, 'korb-v1', VORAUSSETZUNGEN);
  assert.equal(an.aktiv, true);
  assert.match(an.saetze[0], /eingeschaltet/);
  assert.match(an.zusage, new RegExp(EMPFANGSSKRIPT.replace('.', '\\.')));
});
