import test from 'node:test';
import assert from 'node:assert/strict';
import { rolloutplan, ETAPPEN, vorgaenger, pruefeEtappen } from '../src/rollout.js';
import { abbruchschwelle } from '../src/werbewirkung.js';

const HAUPT = { tagesbudget: 9.99, klickpreis: 1.5, quote: 0.01 };

test('Jede Etappe in brauchtVor gibt es auch', () => {
  assert.ok(ETAPPEN.length >= 5, `nur ${ETAPPEN.length} Etappen — die Schleife prüfte zu wenig`);
  const ids = new Set(ETAPPEN.map((e) => e.id));
  for (const e of ETAPPEN) {
    for (const v of vorgaenger(e)) assert.ok(ids.has(v), `${e.id} braucht „${v}", das es nicht gibt`);
  }
});

test('Jede Etappe sagt, woher ihre Dauer kommt', () => {
  assert.ok(ETAPPEN.length >= 5, 'zu wenige Etappen');
  for (const e of ETAPPEN) {
    assert.ok(['gerechnet', 'gesetzt', 'fremdbestimmt'].includes(e.art), e.id);
    assert.ok(e.woher && e.woher.length > 30, `${e.id}: die Begründung der Dauer fehlt oder ist zu knapp`);
    assert.ok(e.ergebnis && e.ergebnis.length > 20, `${e.id}: was die Etappe löst, fehlt`);
  }
});

test('Die gerechnete Etappe trägt keine eigene Zahl', () => {
  // Sonst stünde eine Dauer im Verzeichnis, die von Budget und Klickpreis
  // abhängt — dieselbe Sorte stehengebliebene Zahl wie die 0.35 in
  // veroeffentlichung.mjs.
  assert.ok(ETAPPEN.length >= 5, 'zu wenige Etappen');
  for (const e of ETAPPEN) {
    if (e.art === 'gerechnet') assert.equal(e.tage, null, e.id);
    else assert.equal(typeof e.tage, 'number', e.id);
  }
});

test('Die Versuchsdauer folgt aus Schwelle, Budget und Klickpreis', () => {
  const r = rolloutplan(HAUPT);
  assert.equal(r.versuch.schwelleKlicks, abbruchschwelle(0.01));
  assert.equal(r.versuch.versuchstage, Math.ceil(abbruchschwelle(0.01) / (9.99 / 1.5)));
});

test('Versuch, Warten und Arbeit im Strang ergeben zusammen die Kettenlänge', () => {
  // Der erste Lauf zählte den Versuch als Arbeit mit: 45 + 10 + 47 bei einer
  // Kette von 57 Tagen — der Länge vor der Etappe „Search Console" vom
  // 3. September. Eine Summe, die plausibel aussieht und nicht aufgeht.
  const r = rolloutplan(HAUPT);
  assert.equal(r.versuch.versuchstage + r.wartenImStrang + r.arbeitImStrang, r.gesamt);
});

test('Eine Etappe beginnt nie vor ihrer Vorbedingung', () => {
  const r = rolloutplan(HAUPT);
  const nach = new Map(r.plan.map((e) => [e.id, e]));
  assert.ok(r.plan.length >= 5, 'zu wenige Etappen im Plan');
  assert.ok(r.plan.some((e) => e.brauchtVor.length > 0), 'keine einzige Abhängigkeit — die Schleife prüfte nichts');
  for (const e of r.plan) {
    for (const v of vorgaenger(e)) {
      assert.ok(e.beginntTag >= nach.get(v).fertigTag, `${e.id} beginnt vor ${v}`);
    }
  }
});

test('Was nicht voneinander abhängt, läuft nebeneinander', () => {
  const r = rolloutplan(HAUPT);
  const ohneVor = r.plan.filter((e) => e.brauchtVor.length === 0);
  assert.ok(ohneVor.length >= 4, 'zu wenige unabhängige Etappen — die Kette wäre künstlich lang');
  for (const e of ohneVor) assert.equal(e.beginntTag, 0, `${e.id} beginnt erst an Tag ${e.beginntTag}`);
});

test('Der bestimmende Strang endet an einer Etappe, die am Schlusstag fertig wird', () => {
  const r = rolloutplan(HAUPT);
  // **Berichtigt am 3. September.** Hier stand „an der **letzten** Etappe der
  // Liste". Seit die Zählung der Anfragen neben dem Versuch läuft, enden
  // **zwei** Etappen am selben Tag — und welche von beiden der Strang nennt,
  // ist eine Frage der Reihenfolge in der Liste und keine Aussage über den
  // Plan. Geprüft wird deshalb, was gemeint war.
  const ende = r.plan.find((e) => e.id === r.strang[r.strang.length - 1]);
  assert.ok(ende, `„${r.strang[r.strang.length - 1]}" steht im Strang und nicht im Plan`);
  assert.equal(ende.fertigTag, r.gesamt);
  assert.equal(r.plan[r.plan.length - 1].fertigTag, r.gesamt,
    'die letzte Etappe der Liste ist nicht die späteste — dann stimmt die Reihenfolge nicht mehr');
});

test('Ein billigerer Klick verkürzt die Kette, ein teurerer verlängert sie', () => {
  const billig = rolloutplan({ ...HAUPT, klickpreis: 0.5 });
  const teuer = rolloutplan({ ...HAUPT, klickpreis: 2.5 });
  assert.ok(billig.gesamt < rolloutplan(HAUPT).gesamt);
  assert.ok(teuer.gesamt > rolloutplan(HAUPT).gesamt);
});

test('0,5 % ausschließen sprengt die Frist, sobald der Klick über dem Marktboden liegt', () => {
  assert.equal(rolloutplan({ ...HAUPT, quote: 0.005, klickpreis: 0.5 }).passt, true);
  assert.equal(rolloutplan({ ...HAUPT, quote: 0.005, klickpreis: 1.5 }).passt, false);
});

test('Unsinnige Eingaben werden abgewiesen, nicht gerechnet', () => {
  assert.throws(() => rolloutplan({ ...HAUPT, tagesbudget: 0 }), /positiv/);
  assert.throws(() => rolloutplan({ ...HAUPT, klickpreis: -1 }), /positiv/);
  assert.throws(() => rolloutplan({ ...HAUPT, quote: 0 }), /zwischen 0 und 1/);
  assert.throws(() => rolloutplan({ ...HAUPT, quote: 1 }), /zwischen 0 und 1/);
});

test('Ein Ringschluss fällt auf, statt den Lauf hängen zu lassen', () => {
  const ring = [
    { id: 'a', titel: 'A', zustaendig: 'werkzeug', brauchtVor: [{ etappe: 'b', warum: 'x' }], tage: 1, art: 'gesetzt', woher: '', ergebnis: '' },
    { id: 'b', titel: 'B', zustaendig: 'werkzeug', brauchtVor: [{ etappe: 'a', warum: 'x' }], tage: 1, art: 'gesetzt', woher: '', ergebnis: '' },
  ];
  assert.throws(() => rolloutplan({ ...HAUPT, etappen: ring }), /Ringschluss/);
});

test('Eine unbekannte Vorbedingung wird benannt, nicht übersprungen', () => {
  const kaputt = [
    { id: 'a', titel: 'A', zustaendig: 'werkzeug', brauchtVor: [{ etappe: 'gibtesnicht', warum: 'x' }], tage: 1, art: 'gesetzt', woher: '', ergebnis: '' },
  ];
  assert.throws(() => rolloutplan({ ...HAUPT, etappen: kaputt }), /gibtesnicht/);
});


/* ------------------------------------------------------------------ *
 * Jede Abhängigkeit trägt ihren Grund — und jede fehlende auch
 *
 * Der Befund vom 2. September: `brauchtVor` war das einzige Feld im Plan ohne
 * Pflichtgrund, und genau dieses Feld war falsch. `lieferantengespraech` stand
 * auf `[]` und begann an Tag 0, obwohl der Brief an den Lieferanten eine
 * Rückantwortadresse braucht, die erst `impressum` einträgt.
 * ------------------------------------------------------------------ */

test('Der Plan ist in Form: jede Abhängigkeit und jede fehlende begründet', () => {
  assert.deepEqual(pruefeEtappen(), []);
});

test('Eine Etappe ohne Voraussetzung ohne Grund wird gemeldet', () => {
  // Die gefährlichere Richtung: Eine falsche Abhängigkeit verlängert die Kette
  // und fällt beim Rechnen auf, eine fehlende verkürzt sie und sieht aus wie
  // ein guter Plan.
  const befunde = pruefeEtappen([
    { id: 'a', brauchtVor: [] },
  ]);
  assert.deepEqual(befunde, ['a: hängt von nichts ab und sagt nicht, warum']);
});

test('Eine Abhängigkeit ohne Grund wird gemeldet', () => {
  const befunde = pruefeEtappen([
    { id: 'a', brauchtVor: [{ etappe: 'b', warum: 'zu kurz' }] },
    { id: 'b', brauchtVor: [], warumOhneVoraussetzung: 'Ein hinreichend langer Grund, der die Formprüfung besteht.' },
  ]);
  assert.deepEqual(befunde, ['a → b: ohne belastbaren Grund']);
});

test('Das Lieferantengespräch beginnt nicht vor dem Impressum', () => {
  // Der Brief braucht eine Rückantwortadresse. Diese Zusicherung steht hier
  // und nicht nur als Kommentar, weil die Verbindung zwischen zwei Dateien
  // sonst niemand hält.
  const r = rolloutplan(HAUPT);
  const gespraech = r.plan.find((e) => e.id === 'lieferantengespraech');
  const impressum = r.plan.find((e) => e.id === 'impressum');
  assert.ok(vorgaenger(gespraech).includes('impressum'));
  assert.ok(gespraech.beginntTag >= impressum.fertigTag,
    `das Gespräch beginnt an Tag ${gespraech.beginntTag}, das Impressum ist an Tag ${impressum.fertigTag} fertig`);
});
