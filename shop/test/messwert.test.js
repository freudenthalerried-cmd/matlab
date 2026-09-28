import test from 'node:test';
import assert from 'node:assert/strict';
import { ordneEin, REFERENZWERT, MINDESTDAUER_MONATE, GRENZEN } from '../src/messwert.js';

test('Unter dem Referenzwert: eingehalten, kein Handlungsbedarf', () => {
  const e = ordneEin({ wert: 180, messdauerMonate: 6 });
  assert.equal(e.stufe, 'unter');
  assert.equal(e.ueberschreitung, false);
  assert.equal(e.istQualifizierterAnlass, false);
  assert.match(e.massnahme, /keine naturwissenschaftliche/);
});

test('Zwischen Referenzwert und 1000: Sanierung nach ÖNORM S 5280-3', () => {
  const e = ordneEin({ wert: 450, messdauerMonate: 12 });
  assert.equal(e.stufe, 'ueber');
  assert.equal(e.ueberschreitung, true);
  assert.equal(e.istQualifizierterAnlass, true);
  assert.match(e.massnahme, /S 5280-3/);
});

test('Über 1000: zusätzlich Planung und Wirksamkeitskontrolle', () => {
  const e = ordneEin({ wert: 1400, messdauerMonate: 12 });
  assert.equal(e.stufe, 'deutlich');
  assert.match(e.massnahme, /Wirksamkeitskontrolle/);
});

test('Die Bandgrenzen: überschritten ist erst, was über 300 liegt', () => {
  // Genau 300 überschreiten den Referenzwert nicht — sprachlich nicht,
  // rechtlich nicht, und die qualifizierte Anfrage des Partnerangebots ist
  // als „Messwert über 300" definiert. Die erste Fassung dieses Testfalls
  // hatte die falsche Grenze des Codes festgeschrieben statt sie zu finden.
  assert.equal(ordneEin({ wert: 299.9, messdauerMonate: 6 }).stufe, 'unter');

  const genau = ordneEin({ wert: REFERENZWERT, messdauerMonate: 6 });
  assert.equal(genau.stufe, 'unter');
  assert.equal(genau.ueberschreitung, false);
  assert.equal(genau.istQualifizierterAnlass, false, 'genau 300 qualifiziert keinen Lead');
  assert.doesNotMatch(genau.aussage, /liegen über/);

  const knappDrueber = ordneEin({ wert: 300.1, messdauerMonate: 6 });
  assert.equal(knappDrueber.stufe, 'ueber');
  assert.equal(knappDrueber.istQualifizierterAnlass, true);

  assert.equal(ordneEin({ wert: 1000, messdauerMonate: 6 }).stufe, 'ueber');
  assert.equal(ordneEin({ wert: 1000.1, messdauerMonate: 6 }).stufe, 'deutlich');
});

test('Kurzzeitmessung wird nicht mit dem Referenzwert verglichen', () => {
  const e = ordneEin({ wert: 900, messdauerMonate: 2 });
  assert.equal(e.stufe, 'kurzzeit');
  assert.equal(e.vergleichbar, false);
  assert.equal(e.ueberschreitung, null);
  assert.equal(e.istQualifizierterAnlass, false, 'ein Kurzzeitwert qualifiziert keinen Lead');
  assert.match(e.aussage, new RegExp(String(MINDESTDAUER_MONATE)));
  assert.match(e.massnahme, /kostenlos/);
});

test('Genau sechs Monate zählen bereits als Langzeitmessung', () => {
  assert.equal(ordneEin({ wert: 400, messdauerMonate: 6 }).istLangzeit, true);
  assert.equal(ordneEin({ wert: 400, messdauerMonate: 5.9 }).istLangzeit, false);
});

test('Die drei Grenzen gehen mit jeder Ausgabe hinaus', () => {
  for (const fall of [
    { wert: 100, messdauerMonate: 12 },
    { wert: 500, messdauerMonate: 12 },
    { wert: 2000, messdauerMonate: 12 },
    { wert: 500, messdauerMonate: 1 },
  ]) {
    assert.deepEqual(ordneEin(fall).grenzen, GRENZEN);
  }
});

test('Keine Ausgabe enthält eine Gesundheits- oder Risikoaussage', () => {
  const verboten = /krebs|lunge|gefährlich|gesundheitsschädlich|risiko für/i;
  for (const wert of [50, 250, 300, 800, 5000]) {
    const e = ordneEin({ wert, messdauerMonate: 12 });
    for (const feld of [e.titel, e.aussage, e.massnahme]) {
      assert.ok(!verboten.test(feld), `unzulässige Aussage bei ${wert}: ${feld}`);
    }
  }
});

test('Unsinnige Eingaben werden abgewiesen', () => {
  assert.throws(() => ordneEin({ wert: -1, messdauerMonate: 6 }));
  assert.throws(() => ordneEin({ wert: 'viel', messdauerMonate: 6 }));
  assert.throws(() => ordneEin({ wert: 300, messdauerMonate: 0 }));
  assert.throws(() => ordneEin({ wert: 300 }));
  assert.throws(() => ordneEin());
});

test('Der qualifizierte Anlass ist genau die belegte Überschreitung', () => {
  // Das ist die Bedingung, die im Leadmodell einen Lead überhaupt erst wertvoll macht.
  assert.equal(ordneEin({ wert: 350, messdauerMonate: 6 }).istQualifizierterAnlass, true);
  assert.equal(ordneEin({ wert: 350, messdauerMonate: 3 }).istQualifizierterAnlass, false);
  assert.equal(ordneEin({ wert: 250, messdauerMonate: 12 }).istQualifizierterAnlass, false);
});
