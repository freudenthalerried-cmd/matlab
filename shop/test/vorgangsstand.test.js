import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PAPIERSCHRITT, VORAUSGESETZT, bindungslage, luecken, papierschrittbefund, vorgangsstand,
} from '../src/vorgangsstand.js';
import { ARTEN } from '../src/ablage.js';
import { SCHRITTE, ABZWEIGE } from '../src/betriebskette.js';

const P = (art, zeitpunkt = '2026-09-11T09:00:00+02:00') => ({ art, zeitpunkt });
const HEUTE = '2026-09-12';

test('Jedes Papier belegt einen Schritt, jeder genannte Schritt existiert', () => {
  /*
   * Das Register in beide Richtungen. Die zweite ist die, die man vergisst:
   * Ein Eintrag bleibt stehen, der Schritt heißt längst anders, und die Akte
   * nennt einen nächsten Schritt, den die Betriebskette nicht führt.
   */
  const b = papierschrittbefund();
  assert.equal(b.sauber, true, JSON.stringify(b.meldungen));
  assert.equal(b.geprueft, Object.keys(ARTEN).length);

  // Die beiden Arten ohne Blatt belegen nichts — sie *sind* die Aufzeichnung.
  assert.equal(PAPIERSCHRITT.vermerk, undefined);
  assert.equal(PAPIERSCHRITT.uidabfrage, undefined);
  assert.equal(Object.keys(PAPIERSCHRITT).length, 6);
});

test('Nach dem Angebot ist die Annahme dran — mit Werkzeug und Gate aus der Kette', () => {
  /*
   * **12. September 2026, abends.** Die Akte sagte, was geschehen ist. Vier
   * Vorgänge an vier verschiedenen Punkten der Kette bekamen dieselbe
   * Auskunft: die Zeilen und ihre Belege. Nichts sagte, was zu tun ist.
   */
  const s = vorgangsstand([P('angebot')], { heute: HEUTE });
  assert.equal(s.abgeschlossen, null);
  assert.equal(s.erreicht, 'angebot');
  assert.equal(s.naechster.id, 'annahme', 'nach dem Angebot kommt etwas anderes');
  // Abgelesen, nicht abgeschrieben: Werkzeug und Gate stehen in der Kette.
  const kette = SCHRITTE.find((x) => x.id === 'annahme');
  assert.equal(s.naechster.werkzeug, kette.werkzeug);
  assert.equal(s.naechster.gate, kette.gate);
});

test('Nach der Annahme wartet der Zahlungseingang — ein Schritt ohne Werkzeug', () => {
  const s = vorgangsstand([P('angebot'), P('auftragsbestaetigung')], { heute: HEUTE });
  assert.equal(s.erreicht, 'annahme');
  assert.equal(s.naechster.id, 'zahlung');
  assert.equal(s.naechster.werkzeug, null);
  assert.ok(s.naechster.warumOhneWerkzeug, 'ein Schritt ohne Werkzeug ohne Grund');
});

test('Nach der Lieferantenbestellung wartet die Lieferung, danach die Rechnung', () => {
  const bestellt = vorgangsstand(
    [P('angebot'), P('auftragsbestaetigung'), P('lieferantenbestellung')], { heute: HEUTE });
  assert.equal(bestellt.naechster.id, 'lieferung');

  const gestellt = vorgangsstand([P('rechnung')], { heute: HEUTE });
  assert.equal(gestellt.naechster.id, 'aufbewahrung');
});

test('Ein Abzweig beendet den Vorgang — die Frage nach dem nächsten Schritt entfällt', () => {
  const abgesagt = vorgangsstand([P('absage')], { heute: HEUTE });
  assert.equal(abgesagt.abgeschlossen, 'abgesagt');
  assert.equal(abgesagt.naechster, null, 'ein abgesagter Fall bekommt einen nächsten Schritt');
  assert.equal(abgesagt.abzweig.id, 'absage');
  assert.ok(ABZWEIGE.some((a) => a.id === abgesagt.abzweig.id));

  // Die Gutschrift hebt die Rechnung auf und geht der Absage vor.
  const aufgehoben = vorgangsstand([P('rechnung'), P('gutschrift')], { heute: HEUTE });
  assert.equal(aufgehoben.abgeschlossen, 'aufgehoben');
  assert.equal(aufgehoben.abzweig.id, 'rechnung-falsch');
});

test('Ein Angebot, dessen Bindefrist abgelaufen ist, wartet nicht mehr auf Annahme', () => {
  /*
   * Nimmt der Kunde am zwanzigsten Tag an, entsteht kein Vertrag zum Preis von
   * damals (§ 862 ABGB). „Als Nächstes: der Kunde nimmt an" wäre dann falsch —
   * die Folge ist eine Entscheidung des Betreibers, und das sagt der Abzweig.
   */
  const alt = vorgangsstand([P('angebot', '2026-08-20T09:00:00+02:00')], { heute: HEUTE });
  assert.equal(alt.abgeschlossen, 'verfallen', 'ein verfallenes Angebot wartet weiter auf Annahme');
  assert.equal(alt.abzweig.id, 'angebot-verfaellt');

  // Ist es angenommen worden, zählt die Frist nicht mehr.
  const angenommen = vorgangsstand(
    [P('angebot', '2026-08-20T09:00:00+02:00'), P('auftragsbestaetigung')], { heute: HEUTE });
  assert.equal(angenommen.abgeschlossen, null);
  assert.equal(angenommen.naechster.id, 'zahlung');
});

test('Ohne Geschäftstag wird keine Frist gerechnet und nichts behauptet', () => {
  // Unbekannt ist nicht „verfallen" — dieselbe Regel wie in npm run akte.
  const s = vorgangsstand([P('angebot', '2026-08-20T09:00:00+02:00')]);
  assert.equal(s.abgeschlossen, null);
  assert.equal(s.naechster.id, 'annahme');
});


test('Die Bindefrist ist mit der Annahme beantwortet, nicht abgelaufen', () => {
  /*
   * **12. September 2026, spät.** `npm run akte` rechnete die Bindefrist zu
   * **jedem** Angebot aus. Gemessen an einem Vorgang mit Angebot vom
   * 20. August, Auftragsbestätigung vom 22. und Rechnung vom 29.:
   *
   *   Bindefrist: bis 2026-09-03 — VERFALLEN seit 9 Tag(en)
   *   Stand: zuletzt „rechnung"
   *   Angebote: 2 binden noch, 1 verfallen
   *
   * Ein abgerechneter Vorgang stand als verfallenes Angebot da — und daneben
   * der Satz, eine Annahme danach sei ein neues Angebot des Kunden. Angewandt
   * auf eine gestellte Rechnung ist das die Aufforderung, einem Kunden zu
   * sagen, sein Auftrag sei hinfällig.
   */
  const offen = bindungslage([P('angebot', '2026-09-11T09:00:00+02:00')]);
  assert.equal(offen.offen, true);
  assert.equal(offen.durch, null);

  // Ohne Rechnung: Allein die Auftragsbestätigung beendet die Bindung.
  const nurAngenommen = bindungslage([
    P('angebot', '2026-08-20T09:00:00+02:00'),
    P('auftragsbestaetigung', '2026-08-22T09:00:00+02:00'),
  ]);
  assert.equal(nurAngenommen.offen, false,
    'ein angenommenes Angebot wird weiter auf seine Bindefrist geprüft');

  const angenommen = bindungslage([
    P('angebot', '2026-08-20T09:00:00+02:00'),
    P('auftragsbestaetigung', '2026-08-22T09:00:00+02:00'),
    P('rechnung', '2026-08-29T09:00:00+02:00'),
  ]);
  assert.equal(angenommen.offen, false,
    'ein abgerechneter Vorgang wird weiter auf seine Bindefrist geprüft');
  assert.equal(angenommen.durch.art, 'auftragsbestaetigung');
  assert.equal(angenommen.durch.zeitpunkt, '2026-08-22T09:00:00+02:00');

  // Die Absage beendet sie ebenso.
  const abgesagt = bindungslage([
    P('angebot', '2026-08-20T09:00:00+02:00'), P('absage', '2026-08-21T09:00:00+02:00'),
  ]);
  assert.equal(abgesagt.offen, false);
  assert.equal(abgesagt.durch.art, 'absage');
});

test('Eine Rechnung ohne Auftragsbestätigung beendet die Bindung auch', () => {
  // Den Fall sollte es nicht geben — die Kette verlangt den Vertragsschluss
  // vor der Rechnung. Die Akte darf trotzdem nicht behaupten, ein
  // abgerechneter Vorgang warte noch auf die Annahme.
  const b = bindungslage([
    P('angebot', '2026-08-20T09:00:00+02:00'), P('rechnung', '2026-08-29T09:00:00+02:00'),
  ]);
  assert.equal(b.offen, false);
  assert.equal(b.durch.art, 'rechnung');
});


test('Ein Papier, dessen Voraussetzung fehlt, fällt auf', () => {
  /*
   * **13. September 2026.** `vorgangsstand` nimmt den **höchsten** erreichten
   * Schritt und sah nicht nach, ob die davor belegt sind: Ein Vorgang mit
   * Angebot und Lieferantenbestellung, aber ohne Auftragsbestätigung, stand
   * als „zuletzt: lieferantenbestellung, als Nächstes: die Lieferung" da —
   * also auf Kurs. Er ist es nicht: Ware ist bei einem Dritten bestellt, an
   * die kein Kunde gebunden ist (AGB Punkt 2).
   */
  const ohne = luecken([P('angebot'), P('lieferantenbestellung')]);
  assert.deepEqual(ohne.map((l) => l.papier), ['lieferantenbestellung'],
    'die Ware ist bestellt, der Vertrag fehlt — und niemand sagt es');
  assert.equal(ohne[0].braucht, 'auftragsbestaetigung');

  // Mit dem Vertragspapier ist nichts zu melden.
  assert.deepEqual(
    luecken([P('angebot'), P('auftragsbestaetigung'), P('lieferantenbestellung')]), []);

  // Und die Rechnung ebenso: ein Entgelt ohne die Vereinbarung, aus der es folgt.
  assert.deepEqual(luecken([P('rechnung')]).map((l) => l.papier), ['rechnung']);
});

test('Ein fehlendes Angebot ist kein Mangel — die Bestellung des Kunden ist das Angebot', () => {
  /*
   * Nach AGB Punkt 2 ist die Bestellung des Kunden das Angebot, und die
   * Auftragsbestätigung nimmt es an. Wer über die Kasse bestellt, braucht
   * kein Papier dieses Hauses davor. **Wer aus der Schrittfolge eine
   * Pflichtkette machte, meldete diesen normalen Weg als Lücke** — deshalb
   * ist `VORAUSGESETZT` eine kurze, begründete Liste und keine Ableitung.
   */
  assert.deepEqual(luecken([P('auftragsbestaetigung')]), []);
  assert.deepEqual(luecken([P('auftragsbestaetigung'), P('lieferantenbestellung')]), []);
  assert.equal(VORAUSGESETZT.length, 2);
  for (const v of VORAUSGESETZT) {
    assert.ok(ARTEN[v.papier]?.beleg, `${v.papier} ist kein Papier`);
    assert.ok(ARTEN[v.braucht]?.beleg, `${v.braucht} ist kein Papier`);
    assert.ok(v.warum.length >= 80, `${v.papier}: der Grund trägt nicht`);
  }
});
