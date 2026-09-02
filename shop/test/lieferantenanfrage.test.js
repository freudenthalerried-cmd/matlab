/**
 * Die Lieferantenanfrage.
 *
 * Der Kern ist nicht der Brieftext, sondern die Zuordnung: Jede Frage nennt
 * die offenen Punkte, die sie schließt, und beide Richtungen werden geprüft.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRAGEN, punkteOhneFrage, fragenOhnePunkt, darfVersendetWerden, erzeugeLieferantenanfrage,
} from '../src/lieferantenanfrage.js';

const ACHT = [
  'lieferzeit', 'feed:GTIN/EAN', 'feed:Marke', 'feed:Produktbild',
  'preisalter', 'preisrhythmus', 'liefergebiet-lieferant', 'artikelliste',
].map((id) => ({ id }));

const betreiber = {
  firma: 'Freudenthaler Bau GmbH', plz: '4312', ort: 'Ried in der Riedmark',
  email: 'buero@example.at', telefon: '+43 1 2345678',
};
const lieferant = { name: 'Poschacher Baustoffhandel' };

test('vier Fragen schließen alle acht Punkte der Gruppe „Anfrage"', () => {
  assert.ok(FRAGEN.length >= 3, 'die Fragenliste ist gefüllt');
  assert.deepEqual(punkteOhneFrage(ACHT), []);
  assert.deepEqual(fragenOhnePunkt(ACHT), []);
});

test('ein neuer offener Punkt ohne Frage wird gemeldet', () => {
  // Die Richtung, die zählt: Ein Punkt ohne Frage bleibt nach dem Gespräch
  // offen, und niemand merkt es, weil das Gespräch stattgefunden hat.
  const neu = [...ACHT, { id: 'mindestbestellwert' }];
  assert.deepEqual(punkteOhneFrage(neu), ['mindestbestellwert']);
});

test('eine Frage, die nichts mehr schließt, wird gemeldet', () => {
  // Jede zusätzliche Frage senkt die Antwortwahrscheinlichkeit aller übrigen.
  const nurNoch = ACHT.filter((p) => p.id !== 'preisrhythmus');
  assert.deepEqual(fragenOhnePunkt(nurNoch), ['preisrhythmus']);
});

test('jede Frage nennt mindestens einen Punkt und einen Grund', () => {
  assert.ok(FRAGEN.length >= 3, 'die Liste ist gefüllt — sonst prüft die Schleife nichts');
  for (const f of FRAGEN) {
    assert.ok(f.schliesst.length >= 1, `${f.id}: schließt nichts`);
    assert.ok(f.warum.length >= 40, `${f.id}: ohne belastbaren Grund`);
    // `includes` und nicht `endsWith`: Ein Brief darf hinter die Frage einen
    // Satz stellen („wäre uns viel wert"). Die Zusicherung gilt der Frage,
    // nicht der Zeichensetzung am Ende.
    assert.ok(f.frage.includes('?'), `${f.id}: die Frage ist keine`);
  }
});

test('ohne Rückantwortadresse geht der Brief nicht hinaus', () => {
  // Der Befund vom 2. September: Die zwei billigsten offenen Punkte sperren
  // das Gespräch, das acht andere schließt.
  const ohne = darfVersendetWerden({ ...betreiber, email: '', telefon: '' }, lieferant);
  assert.equal(ohne.darf, false);
  assert.equal(ohne.gruende.length, 2);
  assert.ok(ohne.gruende.some((g) => /betreiber\.email/.test(g)));
  assert.equal(darfVersendetWerden(betreiber, lieferant).darf, true);
});

test('eine fehlende Angabe steht als Lücke im Brief, statt zu verschwinden', () => {
  const brief = erzeugeLieferantenanfrage({ betreiber: { ...betreiber, email: '' }, lieferant });
  assert.match(brief.text, /LUECKE: E-Mail-Adresse des Absenders/);
  assert.equal(brief.versandfaehig, false);
});

test('der Brief nennt jede Frage nummeriert und genau einmal', () => {
  const brief = erzeugeLieferantenanfrage({ betreiber, lieferant });
  assert.equal((brief.text.match(/^\d+\. /gm) ?? []).length, FRAGEN.length);
  for (const f of FRAGEN) assert.ok(brief.text.includes(f.titel), `${f.id} fehlt im Brief`);
  assert.match(brief.text, /^An: Poschacher Baustoffhandel$/m);
  assert.equal(brief.versandfaehig, true);
});
