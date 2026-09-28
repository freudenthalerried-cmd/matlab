import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ABSENDEDATEI, baubefund, bestellwegAktiv, EMPFANGSSKRIPT, oberflaeche, warenkorbZusage,
} from '../src/bestellwegbau.js';
import { VORAUSSETZUNGEN, bestellwegBefund } from '../src/bestellweg.js';
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

test('die ausgelieferte Oberfläche trägt den Absendeweg genau dann, wenn er an ist', () => {
  // **Der Befund vom 4. September, abends.** `npm run startklar` las
  // `shop-ui.js` und entschied daran den ersten Punkt. Das Absenden war am
  // Nachmittag in eine Datei daneben gezogen — und die Bereitschaftsliste
  // sagte auch mit vollständig beantworteter Betreiberdatei weiter, es gebe
  // keinen Bestellweg.
  const lies = (datei) => ({
    'shop-ui.js': 'var a = 1;',
    [ABSENDEDATEI]: "fetch('/bestellung', { method: 'POST' });",
  })[datei];

  assert.equal(bestellwegBefund(oberflaeche(lies, false)).moeglich, false);
  assert.equal(bestellwegBefund(oberflaeche(lies, true)).moeglich, true);
  // Und die Grundoberfläche geht in beiden Fällen mit.
  assert.match(oberflaeche(lies, false), /var a = 1;/);
  assert.match(oberflaeche(lies, true), /var a = 1;/);
});

/*
 * **Der Weg nach draußen — 15. September 2026.** Das Register der
 * Bestellfelder ist vollständig geprüft; ob sein Satz für den Kunden die
 * Oberfläche **erreicht**, prüfte nichts. Genau diese Lücke hat den `warum`
 * seit dem 4. September im Modul festgehalten.
 */
test('das Formular gibt den Satz für den Kunden hinaus', async () => {
  const quelle = readFileSync(new URL('../bin/website.mjs', import.meta.url), 'utf8');
  const { BESTELLFELDER } = await import('../src/bestellfelder.js');

  const stelle = /felder:\s*WEG\.aktiv\s*\?\s*BESTELLFELDER\.map\(\(f\) => \(\{([\s\S]*?)\}\)\)/
    .exec(quelle);
  assert.ok(stelle, 'die Stelle, an der die Felder hinausgehen, ist nicht mehr zu finden');
  assert.match(stelle[1], /hinweis:\s*f\.hinweis/,
    'das Formular gibt den Satz für den Kunden nicht hinaus — ein Pflichtfeld ohne Grund '
    + 'wird irgendwie ausgefüllt');

  // Und die Oberfläche zeigt ihn auch an, statt ihn nur zu empfangen.
  const ui = readFileSync(new URL('../shop-ui.js', import.meta.url), 'utf8');
  assert.match(ui, /vorgabe\.hinweis/, 'die Oberfläche liest den Satz nicht');
  assert.match(ui, /aria-describedby/,
    'ohne aria-describedby hört ein Screenreader den Satz gar nicht');
  assert.ok(BESTELLFELDER.length >= 8, `nur ${BESTELLFELDER.length} Felder`);
  assert.ok(BESTELLFELDER.every((f) => f.hinweis), 'ein Feld ohne Satz für den Kunden');
});
