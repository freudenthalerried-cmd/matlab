import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Kontrast nach WCAG 2.1, gerechnet aus den Farbwerten der gebauten Seite.
 *
 * Gemessen am 29.08.: Vier Farbpaare des hellen Anstrichs lagen unter der
 * Schwelle — darunter die Verweisfarbe und die Schrift auf dem Hauptknopf.
 * Aufgefallen ist es nicht beim Ansehen, sondern beim Rechnen; ein Kontrast
 * von 4,17 statt 4,5 sieht man nicht, man misst ihn.
 *
 * Gelesen wird die **gebaute Seite**, nicht die Quelle: Was im Stil steht,
 * ist das, was der Besucher bekommt.
 */
const leuchtdichte = (hex) => {
  const h = hex.replace('#', '');
  const teil = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = teil.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const kontrast = (a, b) => {
  const [hoch, tief] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (hoch + 0.05) / (tief + 0.05);
};

/** Die Farbwerte eines Anstrichs aus dem Stil der gebauten Seite lesen. */
function palette(css, anfang) {
  const von = css.indexOf(anfang);
  assert.ok(von >= 0, `Anstrich „${anfang}" nicht im Stil gefunden`);
  const block = css.slice(von, css.indexOf('}', von));
  const werte = {};
  for (const treffer of block.matchAll(/--([a-z0-9-]+):(#[0-9A-Fa-f]{6})/g)) werte[treffer[1]] = treffer[2];
  return werte;
}

const PAARE = [
  ['tinte', 'grund', 4.5, 'Fließtext'],
  ['tinte', 'flaeche', 4.5, 'Text auf Fläche'],
  ['tinte', 'flaeche-2', 4.5, 'Text auf Fläche-2'],
  ['tinte-2', 'grund', 4.5, 'Zweittext'],
  ['gedaempft', 'grund', 4.5, 'Gedämpfter Text auf Grund'],
  ['gedaempft', 'flaeche', 4.5, 'Gedämpfter Text auf Fläche'],
  ['gedaempft', 'flaeche-2', 4.5, 'Gedämpfter Text auf Fläche-2'],
  ['ocker', 'grund', 4.5, 'Verweise auf Grund'],
  ['ocker', 'flaeche', 4.5, 'Verweise auf Fläche'],
  ['ocker', 'ocker-weich', 4.5, 'Markierung'],
  ['gruen', 'gruen-weich', 4.5, 'Zusage'],
  ['ziegel', 'ziegel-weich', 4.5, 'Absage'],
  ['grund', 'ocker', 4.5, 'Schrift auf dem Hauptknopf'],
  // 3:1 nach WCAG 1.4.11 — die Umrandung eines Bedienelements muss
  // erkennbar sein. Für `--linie` gilt das nicht: Sie zeichnet Trennlinien
  // und Kartenränder, keine Bedienelemente.
  ['linie-stark', 'grund', 3.0, 'Umrandung von Feldern auf Grund'],
  ['linie-stark', 'flaeche', 3.0, 'Umrandung von Feldern auf Fläche'],
];

for (const [anstrich, anfang] of [['hell', ':root{'], ['dunkel', ':root[data-theme="dark"]{']]) {
  test(`Kontrast im ${anstrich}en Anstrich reicht für WCAG 2.1 AA`, () => {
    const datei = pfad('../ausgabe/site/index.html');
    if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
    const css = readFileSync(datei, 'utf8');
    const p = palette(css, anfang);
    assert.ok(Object.keys(p).length >= 12, `nur ${Object.keys(p).length} Farbwerte gefunden`);

    const zuschwach = [];
    for (const [vorne, hinten, ziel, was] of PAARE) {
      assert.ok(p[vorne] && p[hinten], `${was}: Farbwert fehlt (${vorne}/${hinten})`);
      const wert = kontrast(p[vorne], p[hinten]);
      if (wert < ziel) zuschwach.push(`${was}: ${wert.toFixed(2)} statt ${ziel}`);
    }
    assert.deepEqual(zuschwach, []);
  });
}

test('die Rechnung stimmt an bekannten Werten', () => {
  // Ohne diese Probe prüfte der Test oben eine Formel, die niemand
  // nachgerechnet hat. Schwarz auf Weiß ist 21:1, Weiß auf Weiß ist 1:1.
  assert.equal(Math.round(kontrast('#000000', '#FFFFFF') * 100) / 100, 21);
  assert.equal(kontrast('#FFFFFF', '#FFFFFF'), 1);
  // Und ein Wert aus der Literatur: #767676 auf Weiß ist die klassische
  // Grenze mit 4,54.
  assert.ok(Math.abs(kontrast('#767676', '#FFFFFF') - 4.54) < 0.02);
});
