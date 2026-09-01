import test from 'node:test';
import assert from 'node:assert/strict';
import { rolloutplan, ETAPPEN } from '../src/rollout.js';
import { abbruchschwelle } from '../src/werbewirkung.js';

const HAUPT = { tagesbudget: 9.99, klickpreis: 1.5, quote: 0.01 };

test('Jede Etappe in brauchtVor gibt es auch', () => {
  assert.ok(ETAPPEN.length >= 5, `nur ${ETAPPEN.length} Etappen — die Schleife prüfte zu wenig`);
  const ids = new Set(ETAPPEN.map((e) => e.id));
  for (const e of ETAPPEN) {
    for (const v of e.brauchtVor) assert.ok(ids.has(v), `${e.id} braucht „${v}", das es nicht gibt`);
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
  // Kette von 57. Eine Summe, die plausibel aussieht und nicht aufgeht.
  const r = rolloutplan(HAUPT);
  assert.equal(r.versuch.versuchstage + r.wartenImStrang + r.arbeitImStrang, r.gesamt);
});

test('Eine Etappe beginnt nie vor ihrer Vorbedingung', () => {
  const r = rolloutplan(HAUPT);
  const nach = new Map(r.plan.map((e) => [e.id, e]));
  assert.ok(r.plan.length >= 5, 'zu wenige Etappen im Plan');
  assert.ok(r.plan.some((e) => e.brauchtVor.length > 0), 'keine einzige Abhängigkeit — die Schleife prüfte nichts');
  for (const e of r.plan) {
    for (const v of e.brauchtVor) {
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

test('Der bestimmende Strang endet an der spätesten Etappe', () => {
  const r = rolloutplan(HAUPT);
  const letzte = r.plan[r.plan.length - 1];
  assert.equal(r.strang[r.strang.length - 1], letzte.id);
  assert.equal(letzte.fertigTag, r.gesamt);
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
    { id: 'a', titel: 'A', zustaendig: 'werkzeug', brauchtVor: ['b'], tage: 1, art: 'gesetzt', woher: '', ergebnis: '' },
    { id: 'b', titel: 'B', zustaendig: 'werkzeug', brauchtVor: ['a'], tage: 1, art: 'gesetzt', woher: '', ergebnis: '' },
  ];
  assert.throws(() => rolloutplan({ ...HAUPT, etappen: ring }), /Ringschluss/);
});

test('Eine unbekannte Vorbedingung wird benannt, nicht übersprungen', () => {
  const kaputt = [
    { id: 'a', titel: 'A', zustaendig: 'werkzeug', brauchtVor: ['gibtesnicht'], tage: 1, art: 'gesetzt', woher: '', ergebnis: '' },
  ];
  assert.throws(() => rolloutplan({ ...HAUPT, etappen: kaputt }), /gibtesnicht/);
});
