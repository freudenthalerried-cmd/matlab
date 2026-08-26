import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LIEFERGEBIET, imLiefergebiet, pruefeLieferort, bezirksliste } from '../src/liefergebiet.js';
import { AGB_GLIEDERUNG } from '../src/rechtstexte.js';

test('Die Bezirke tragen Bundesland und Grund', () => {
  assert.ok(LIEFERGEBIET.bezirke.length >= 3);
  for (const b of LIEFERGEBIET.bezirke) {
    assert.ok(b.name && b.bundesland, `${b.name}: unvollständig`);
    assert.ok(b.grund && b.grund.length > 10, `${b.name}: ohne Grund im Gebiet`);
  }
});

test('Schreibweisen mit Bindestrich, Leerzeichen oder Vorsatz treffen dasselbe', () => {
  // „Linz-Land", „Linz Land", „Bezirk Linz-Land" sind derselbe Bezirk. Ein
  // Formular, das daran scheitert, lehnt eine Bestellung aus dem Kerngebiet ab.
  for (const form of ['Linz-Land', 'Linz Land', 'linz-land', 'Bezirk Linz-Land', ' Linz–Land ']) {
    assert.equal(imLiefergebiet(form), true, `„${form}" wurde nicht erkannt`);
  }
});

test('Ein leerer oder unbekannter Bezirk liegt nicht im Gebiet', () => {
  assert.equal(imLiefergebiet(''), false);
  assert.equal(imLiefergebiet(undefined), false);
  assert.equal(imLiefergebiet('Schärding'), false);
});

test('Der fehlende Bezirk ist ein eigener Ausgang, nicht dasselbe wie außerhalb', () => {
  const fehlt = pruefeLieferort({ land: 'AT' });
  const draussen = pruefeLieferort({ land: 'AT', bezirk: 'Schärding' });
  assert.equal(fehlt.liefern, false);
  assert.equal(draussen.liefern, false);
  assert.match(fehlt.grund, /fehlt/);
  assert.match(draussen.grund, /außerhalb/);
  assert.notEqual(fehlt.grund, draussen.grund, 'zwei Ursachen, zwei Auskünfte');
});

test('Jede Absage nennt, wohin geliefert wird', () => {
  for (const ort of [{ land: 'AT' }, { land: 'AT', bezirk: 'Schärding' }]) {
    assert.match(pruefeLieferort(ort).grund, /Perg/, 'eine Absage ohne Alternative ist eine halbe Auskunft');
  }
});

test('Der Vorbehalt zum Lieferanten steht ausdrücklich da', () => {
  // Wie weit der Lieferant fährt, steht in keiner der fünfzehn Rechnungen —
  // die Frachtpauschale staffelt nicht nach Entfernung. Das Gebiet ist
  // deshalb die engere der beiden Grenzen, und es sagt das.
  assert.match(LIEFERGEBIET.vorbehalt, /unbekannt/);
  assert.match(LIEFERGEBIET.vorbehalt, /erfragen/);
});

test('Kampagne und Liefergebiet nennen dieselben Bezirke', () => {
  // Beworben und beliefert muss dieselbe Fläche sein. Bis zum 26. August war
  // die Anzeigenzeile die einzige Festlegung überhaupt.
  const csv = readFileSync(fileURLToPath(new URL('../ausgabe/kampagne/kampagnen.csv', import.meta.url)), 'utf8');
  assert.ok(csv.includes(`Bezirk ${bezirksliste()}`), `die Kampagne wirbt für ein anderes Gebiet:\n${csv.split('\n')[1]}`);
});

test('Punkt 12 der Geschäftsbedingungen nennt das Gebiet, nicht nur das Land', () => {
  const punkt = AGB_GLIEDERUNG.find((a) => a.nr === 12);
  assert.match(punkt.titel, /Liefergebiet/);
  for (const b of LIEFERGEBIET.bezirke) {
    assert.ok(punkt.hinweis.includes(b.name), `${b.name} fehlt in Punkt 12`);
  }
  assert.match(punkt.hinweis, /Postleitzahl beweist keinen Bezirk/);
});
