import test from 'node:test';
import assert from 'node:assert/strict';

import { OHNE_MESSUNG, WERKZEUGE_MIT_GRUNDLAGE, kennzahlen, punktebefund } from '../src/punktezahlen.js';

const MESSWERTE = {
  artikel: 46, mitGewicht: 7, mindestbestellwert: 250, grenzeTage: 90, begriffe: 29,
};

/**
 * Eine Lage, in der jede lebende Zahl stimmt. Jeder Testfall verbiegt genau
 * eine Sache daran.
 */
const gut = () => ({
  punkte: [
    { id: 'einkaufspreise-belegen', text: 'Einkaufspreise wieder belegen (46 sind zurückgerechnet)' },
    {
      id: 'palettenzahl',
      text: 'der Katalog führt Gewicht für 7 von 46 Artikeln. '
        + 'Macht aus dem Mindestbestellwert (Gate 25, 250 €) eine Rechnung.',
    },
    {
      id: 'preisrhythmus',
      text: 'beobachtet sind 32 Tage, gesetzt ist eine Grenze von 90. '
        + 'Entscheidet, ob die 90-Tage-Grenze die richtige ist.',
    },
    { id: 'suchvolumen', text: 'Suchvolumen der 29 Keywords im Liefergebiet messen' },
  ],
  messwerte: MESSWERTE,
  gibtEs: () => true,
});

test('jede Kennzahl nennt ihre Quelle und den Punkt, in dem sie steht', () => {
  const tafel = kennzahlen(MESSWERTE);
  assert.ok(tafel.length >= 5);
  for (const k of tafel) {
    assert.ok(k.name, 'eine Kennzahl ohne Namen ist in einer Meldung nicht wiederzufinden');
    assert.ok(k.wie, `${k.name}: ohne Quelle ist die Messung nicht nachzuvollziehen`);
    assert.ok(k.wo, `${k.name}: ohne Punkt könnte das Muster irgendwo im Text treffen`);
    assert.equal(typeof k.soll, 'number', `${k.name}: der Sollwert ist keine Zahl`);
  }
});

test('jeder Freibrief trägt einen Grund, der trägt', () => {
  assert.ok(OHNE_MESSUNG.length >= 3);
  for (const e of OHNE_MESSUNG) {
    assert.ok(e.zahlen.length >= 1);
    assert.ok(e.warumOhneMessung.length > 100,
      `Freibrief für ${e.zahlen.join(', ')}: der Grund ist zu knapp, um in einem Jahr zu tragen`);
  }
});

test('die heile Lage meldet nichts', () => {
  const b = punktebefund(gut());
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.sauber, true);
});

test('eine überholte Zahl ist ein Befund — der Fall vom 8. September', () => {
  const lage = gut();
  lage.punkte[3] = { id: 'suchvolumen', text: 'Suchvolumen der 32 Keywords im Liefergebiet messen' };
  const b = punktebefund(lage);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'zahl-veraltet');
  assert.match(b.meldungen[0].text, /sagt 32, gemessen sind 29/);
});

test('ein umgeschriebener Satz, den kein Muster mehr trifft, ist ein Befund', () => {
  const lage = gut();
  lage.punkte[3] = { id: 'suchvolumen', text: 'Suchvolumen der Anzeigenbegriffe messen' };
  const b = punktebefund(lage);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['muster-trifft-nicht']);
});

test('ein Punkt, den es nicht mehr gibt, ist ein Befund', () => {
  const lage = gut();
  lage.punkte = lage.punkte.filter((p) => p.id !== 'suchvolumen');
  const b = punktebefund(lage);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['punkt-fehlt']);
});

test('eine Zahl ohne Messung und ohne Freibrief ist ein Befund', () => {
  const lage = gut();
  lage.punkte[3].text += ' Erwartet werden 800 Abrufe.';
  const b = punktebefund(lage);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['zahl-ohne-eintrag']);
  assert.match(b.meldungen[0].text, /800/);
});

/**
 * Der zweite Fall vom 8. September: Zwei Punkte derselben Liste
 * widersprachen einander — der eine sagte, `npm run preiswechsel` finde
 * etwas, der andere, es messe seither nichts.
 */
test('ein Befehl ohne Grundlage, in der Gegenwartsform genannt, ist ein Befund', () => {
  const lage = gut();
  lage.punkte[2].text = '`npm run preiswechsel` findet keinen einzigen Preiswechsel. '
    + 'beobachtet sind 32 Tage, gesetzt ist eine Grenze von 90. '
    + 'Entscheidet, ob die 90-Tage-Grenze die richtige ist.';
  lage.gibtEs = (pfad) => pfad !== 'preise/poschacher-positionen.csv';
  const b = punktebefund(lage);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['werkzeug-misst-nichts-mehr']);
});

test('derselbe Befehl mit dem Zugeständnis daneben ist kein Befund', () => {
  const lage = gut();
  lage.punkte[2].text = '`npm run preiswechsel` fand am 30. August nichts und misst seither '
    + 'nichts mehr. beobachtet sind 32 Tage, gesetzt ist eine Grenze von 90. '
    + 'Entscheidet, ob die 90-Tage-Grenze die richtige ist.';
  lage.gibtEs = (pfad) => pfad !== 'preise/poschacher-positionen.csv';
  assert.deepEqual(punktebefund(lage).meldungen, []);
});

test('liegt die Grundlage da, ist die Gegenwartsform in Ordnung', () => {
  const lage = gut();
  lage.punkte[2].text = '`npm run preiswechsel` findet keinen Preiswechsel. '
    + 'beobachtet sind 32 Tage, gesetzt ist eine Grenze von 90. '
    + 'Entscheidet, ob die 90-Tage-Grenze die richtige ist.';
  assert.deepEqual(punktebefund(lage).meldungen, []);
});

test('ein Freibrief für eine Zahl, die nirgends mehr steht, ist ein Befund — die zweite Richtung', () => {
  const lage = gut();
  lage.punkte[1].text = 'der Katalog führt Gewicht für 7 von 46 Artikeln. '
    + 'Macht aus dem Mindestbestellwert (Gate 25, 250 €) eine Rechnung.';
  // 403 steht in keinem der vier Punkte dieser Lage.
  const b = punktebefund({ ...lage, vollstaendig: true });
  assert.ok(b.meldungen.some((m) => m.regel === 'eintrag-ohne-zahl' && m.text.includes('403')));
});

test('jedes Werkzeug mit auswärtiger Grundlage nennt Datei und Grund', () => {
  assert.ok(WERKZEUGE_MIT_GRUNDLAGE.length >= 1);
  for (const w of WERKZEUGE_MIT_GRUNDLAGE) {
    assert.match(w.befehl, /^npm run /);
    assert.ok(w.braucht.includes('/'), `${w.befehl}: die Grundlage ist kein Pfad`);
    assert.ok(w.warum.length > 80, `${w.befehl}: der Grund ist zu knapp`);
  }
});
