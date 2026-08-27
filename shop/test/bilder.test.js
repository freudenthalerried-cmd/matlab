import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { artikelBild, gruppenBild, bauform, dickeMm, gradzahl, BAUFORM_TEXT } from '../src/bilder.js';

const katalog = JSON.parse(readFileSync(fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8'));

test('die Bauform kommt aus Bezeichnung, Gruppe und Einheit', () => {
  const f = (bezeichnung, gruppe = '', einheit = 'STK') => bauform({ bezeichnung, gruppe, einheit });
  assert.equal(f('PVC Kanalbogen NW 100 45 grad'), 'bogen', 'ein Bogen ist ein Bogen, kein Rohr');
  assert.equal(f('PVC Kanalabzweiger 100 100 45 grad'), 'abzweig');
  assert.equal(f('PVC Kanalrohr NW 100 1 m'), 'rohr');
  assert.equal(f('Schachtring 800 300 80 mm'), 'ring');
  assert.equal(f('Fassaden EPS 5 cm 0,5 m2', 'Dämmung', 'M2'), 'platte');
  assert.equal(f('Baumit KlebeSpachtel 25 kg', 'Mörtel', 'SCK'), 'sack');
  assert.equal(f('Capatect Glasgewebe M, Breite 110cm', 'WDVS', 'M2'), 'rolle');
  assert.equal(f('Ökotherm HL N+F 10 50 23,8 cm', 'Mauerwerk'), 'stein');
});

test('Maße werden aus der Bezeichnung gelesen', () => {
  assert.equal(dickeMm('XPS glatt SF 100 mm 0,75 m2'), 100);
  assert.equal(dickeMm('Fassaden EPS 5 cm 0,5 m2'), 50);
  assert.equal(dickeMm('Prima Dosierpistole Metall Lite'), null);
  assert.equal(gradzahl('PVC Kanalbogen NW 100 30 grad'), 30);
  assert.equal(gradzahl('PVC Kanalrohr NW 100 1 m'), null);
});

test('die gezeichnete Stärke folgt dem Maß', () => {
  // Der Punkt der ganzen Übung: Ein Bild, das bei 2 cm und bei 10 cm gleich
  // aussieht, ist Dekoration. Verglichen wird die y-Lage der Oberkante —
  // je dicker die Platte, desto höher beginnt sie im Feld.
  const oben = (b) => Number(artikelBild({ bezeichnung: b, gruppe: 'Dämmung', einheit: 'M2' })
    .match(/<path d="M18 (\d+(?:\.\d+)?)/)[1]);
  assert.ok(oben('EPS 10 cm') < oben('EPS 2 cm'), 'die dickere Platte beginnt weiter oben');
});

test('der Winkel eines Bogens wird gezeichnet, nicht nur beschriftet', () => {
  const spitze = (b) => artikelBild({ bezeichnung: b, gruppe: 'Kanal', einheit: 'STK' })
    .match(/L40 62 L([\d.]+) ([\d.]+)/);
  const [, x30, y30] = spitze('Kanalbogen 30 grad');
  const [, x45, y45] = spitze('Kanalbogen 45 grad');
  assert.ok(Number(y45) < Number(y30), '45° steigt steiler als 30°');
  assert.ok(Number(x45) < Number(x30), '45° reicht dafür weniger weit');
});

test('jeder Artikel des Katalogs bekommt ein gültiges Bild', () => {
  assert.ok(katalog.artikel.length >= 40, 'ohne Artikel prüft diese Schleife nichts');
  for (const a of katalog.artikel) {
    const svg = artikelBild(a);
    assert.match(svg, /^<svg /, `${a.sku}: kein SVG`);
    assert.match(svg, /viewBox="0 0 120 90"/, `${a.sku}: fremdes Feld`);
    assert.match(svg, /role="img" aria-label="[^"]+"/, `${a.sku}: ohne Beschreibung`);
    assert.equal((svg.match(/<svg/g) ?? []).length, 1, `${a.sku}: verschachteltes SVG`);
    assert.ok(!/NaN|undefined|null/.test(svg), `${a.sku}: unaufgelöster Wert im Bild`);
    assert.ok(BAUFORM_TEXT[bauform(a)], `${a.sku}: Bauform ohne Klartext`);
  }
});

test('jede Warengruppe hat ein Sinnbild', () => {
  const gruppen = [...new Set(katalog.artikel.map((a) => a.gruppe))];
  assert.ok(gruppen.length >= 6);
  for (const g of gruppen) {
    const svg = gruppenBild(g);
    assert.match(svg, /class="schema gruppe"/, `${g}: falsche Klasse`);
    assert.ok(!/NaN|undefined/.test(svg), `${g}: unaufgelöster Wert`);
  }
});

test('die Beschriftung entkommt spitzen Klammern', () => {
  const svg = artikelBild({ bezeichnung: 'Teil <script> 5 cm', gruppe: 'Dämmung', einheit: 'M2' });
  assert.ok(!svg.includes('<script>'), 'sonst steht fremdes Markup in der Zeichnung');
});
