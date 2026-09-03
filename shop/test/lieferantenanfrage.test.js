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

// Die offenen Punkte der Gruppe „Anfrage", wie `npm run offenepunkte` sie
// führt. Die ersten fünf kommen aus Werkzeugen (startklar, veroeffentlichung,
// pruefe-preisalter), die übrigen aus `OHNE_WERKZEUG`. **Die Liste stand hier
// als `GRUPPE` und war am 3. September neun** — der Testfall darunter hält sie
// jetzt gegen das Register, damit sie nicht ein zweites Mal zurückbleibt.
const GRUPPE = [
  'lieferzeit', 'feed:GTIN/EAN', 'feed:Marke', 'feed:Produktbild',
  'preisalter', 'preisrhythmus', 'liefergebiet-lieferant', 'palettenzahl', 'artikelliste',
].map((id) => ({ id }));

const betreiber = {
  firma: 'Freudenthaler Bau GmbH', plz: '4312', ort: 'Ried in der Riedmark',
  email: 'buero@example.at', telefon: '+43 1 2345678',
};
const lieferant = { name: 'Poschacher Baustoffhandel' };

test('jede Frage schließt etwas, und jeder Punkt der Gruppe „Anfrage" wird gefragt', () => {
  assert.ok(FRAGEN.length >= 3, 'die Fragenliste ist gefüllt');
  assert.deepEqual(punkteOhneFrage(GRUPPE), []);
  assert.deepEqual(fragenOhnePunkt(GRUPPE), []);
});

test('ein neuer offener Punkt ohne Frage wird gemeldet', () => {
  // Die Richtung, die zählt: Ein Punkt ohne Frage bleibt nach dem Gespräch
  // offen, und niemand merkt es, weil das Gespräch stattgefunden hat.
  const neu = [...GRUPPE, { id: 'mindestbestellwert' }];
  assert.deepEqual(punkteOhneFrage(neu), ['mindestbestellwert']);
});

test('eine Frage, die nichts mehr schließt, wird gemeldet', () => {
  // Jede zusätzliche Frage senkt die Antwortwahrscheinlichkeit aller übrigen.
  const nurNoch = GRUPPE.filter((p) => p.id !== 'preisrhythmus');
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
  // das Gespräch, das alle übrigen schließt.
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

/**
 * Die Probeliste oben ist von Hand geschrieben — also gehört sie gehalten.
 *
 * Am 3. September kam `palettenzahl` in `OHNE_WERKZEUG` dazu. `pruefe-anfrage`
 * meldete es sofort, dieser Datei fiel es nicht auf: Sie prüfte ihre eigene
 * Liste gegen die Fragen und ging auf. **Eine Probe, die ihre eigene Menge
 * mitbringt, prüft ihre Menge.**
 */
test('die Probeliste kennt jeden handgeführten Punkt der Gruppe „Anfrage"', async () => {
  const { OHNE_WERKZEUG } = await import('../src/offenepunkte.js');
  const ausRegister = OHNE_WERKZEUG.filter((p) => p.zustaendig === 'anfrage').map((p) => p.id);
  assert.ok(ausRegister.length >= 3, `nur ${ausRegister.length} handgeführte Punkte — zu wenig zum Prüfen`);

  const inProbe = new Set(GRUPPE.map((p) => p.id));
  const fehlend = ausRegister.filter((id) => !inProbe.has(id));
  assert.deepEqual(fehlend, [], 'diese Punkte stehen im Register und nicht in der Probeliste');
});
