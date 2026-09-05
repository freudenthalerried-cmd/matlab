import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WELT_HEUTE, WELT_AUSGEBAUT, aufwandProMonat, engpaesse } from '../src/auftragslauf.js';
import { noetigerUmsatz } from '../src/kostenbild.js';
import { GRENZE_STUNDEN_JE_MONAT } from '../bin/aufwand.mjs';

const ziel = JSON.parse(readFileSync(new URL('../data/zielgroessen.json', import.meta.url), 'utf8'));
const bestellungen = noetigerUmsatz(ziel, ziel.zahlweg).bestellungen;
const nachFreigabe = { ...WELT_HEUTE, zahlungsanbieter: true, betreiberdaten: true, echteKonditionen: true };

test('Der Aufwand rechnet gegen die Zielgröße, nicht gegen eine eingetragene Zahl', () => {
  assert.ok(bestellungen >= 40 && bestellungen <= 200, `${bestellungen} Bestellungen`);
  const doppelt = noetigerUmsatz({ ...ziel, zielgewinn: ziel.zielgewinn * 2 }, ziel.zahlweg).bestellungen;
  assert.ok(doppelt > bestellungen, 'mehr Zielgewinn muss mehr Bestellungen verlangen');
});

test('Voll ausgebaut kostet der Betrieb keine Handarbeit mehr', () => {
  const r = aufwandProMonat(WELT_AUSGEBAUT, bestellungen);
  assert.equal(r.minutenJeBestellung, 0);
  assert.equal(r.stundenProMonat, 0);
  assert.deepEqual(r.blockaden, []);
});

test('Heute läuft es gar nicht — zwei Schritte sind gesperrt', () => {
  const r = aufwandProMonat(WELT_HEUTE, bestellungen);
  assert.ok(r.blockaden.length >= 2, `nur ${r.blockaden.length} Blockaden`);
  assert.ok(r.minutenJeBestellung > 0);
});

test('Nach den Freigaben ist nichts mehr gesperrt und es bleibt unter der Grenze', () => {
  // Die Aussage, um die es geht: Der Betrieb läuft am ersten Tag neben dem
  // Baugeschäft. Reißt diese Probe, ist das keine Kleinigkeit.
  const r = aufwandProMonat(nachFreigabe, bestellungen);
  assert.deepEqual(r.blockaden, []);
  assert.ok(r.stundenProMonat <= GRENZE_STUNDEN_JE_MONAT,
    `${r.stundenProMonat} h über der Grenze von ${GRENZE_STUNDEN_JE_MONAT} h`);
});

test('Der Kipppunkt liegt über der Zielgröße, aber nicht weit darüber', () => {
  // 1,4× — die Zahl, die den Plan beschreibt. Sie darf sich ändern; dass sie
  // knapp ist, soll nicht unbemerkt verschwinden.
  const r = aufwandProMonat(nachFreigabe, bestellungen);
  const kipppunkt = Math.floor((GRENZE_STUNDEN_JE_MONAT * 60) / r.minutenJeBestellung);
  assert.ok(kipppunkt > bestellungen, 'die Zielgröße selbst muss tragbar sein');
  assert.ok(kipppunkt < bestellungen * 3,
    `${kipppunkt} — so viel Luft hat dieser Plan nicht, da stimmt eine Minutenangabe nicht`);
});

test('Die Engpässe nennen ihre Minuten und was sie sperren', () => {
  const liste = engpaesse();
  assert.ok(liste.length >= 5, `nur ${liste.length} Engpässe`);
  for (const e of liste) {
    assert.equal(typeof e.faehigkeit, 'string');
    assert.ok(Number.isFinite(e.zusatzminuten), e.faehigkeit);
    assert.ok(Array.isArray(e.blockiert), e.faehigkeit);
  }
});

test('Die Produktdatenschnittstelle ist der größte Einzelposten', () => {
  // Gate 6 in Stunden statt in Worten. Verschiebt sich das, hat sich der
  // Bruchpunkt des Modells verschoben — und das gehört gesehen.
  const groesster = engpaesse().reduce((a, b) => (b.zusatzminuten > a.zusatzminuten ? b : a));
  assert.equal(groesster.faehigkeit, 'produktdatenSchnittstelle');
});

test('Die Grenze ist gesetzt und benannt, nicht beiläufig', () => {
  assert.equal(typeof GRENZE_STUNDEN_JE_MONAT, 'number');
  assert.ok(GRENZE_STUNDEN_JE_MONAT >= 8 && GRENZE_STUNDEN_JE_MONAT <= 40,
    'eine Grenze außerhalb dieses Bereichs wäre keine Nebenbeschäftigung mehr');
});
