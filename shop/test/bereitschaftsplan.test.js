/**
 * Bereitschaftsliste und Rolloutplan — zwei Listen über dieselbe Sache.
 *
 * **Der Anlass, 4. September 2026, spät.** Am selben Abend bekam
 * `startklar()` die **Bankverbindung** als zehnten Punkt. Der Rolloutplan —
 * das Papier, das der Auftraggeber vor der Budgetfreigabe liest — erfuhr
 * nichts davon und führte weiter vierzehn Etappen.
 *
 * > **Die kürzere Liste gewinnt**, weil sie kürzer aussieht: Ein Plan mit
 * > einer Voraussetzung weniger liest sich wie ein guter Plan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { ZUORDNUNG, planbefund } from '../src/bereitschaftsplan.js';
import { startklar } from '../src/startklar.js';
import { ETAPPEN } from '../src/rollout.js';

const punkte = startklar({}).punkte.map((p) => p.id);
const etappen = ETAPPEN.map((e) => e.id);

test('jeder Punkt der Bereitschaftsliste hat eine Etappe oder einen Grund', () => {
  const b = planbefund(punkte, etappen);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.equal(b.sauber, true);
  // Ohne diese Zusicherung liefe die Prüfung über eine leere Liste und
  // bestünde jede Prüfung.
  assert.ok(punkte.length >= 10, `nur ${punkte.length} Punkte — das ist zu wenig`);
  assert.equal(b.mitEtappe + b.begruendet, ZUORDNUNG.length);
});

/**
 * Die Richtung, die den Fund gemacht hätte: Ein Punkt, den niemand ins
 * Register geschrieben hat, fährt sonst still ungeplant mit.
 */
test('ein neuer Punkt ohne Eintrag fällt auf', () => {
  const b = planbefund([...punkte, 'gewerbeschein'], etappen);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['punkt-ohne-eintrag']);
  assert.match(b.meldungen[0].text, /gewerbeschein/);
});

test('ein Eintrag, dessen Punkt verschwunden ist, fällt auch auf', () => {
  const b = planbefund(punkte.filter((p) => p !== 'lieferzeit'), etappen);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['eintrag-ohne-punkt']);
});

test('eine Zuordnung auf eine Etappe, die es nicht gibt', () => {
  const b = planbefund(punkte, etappen.filter((e) => e !== 'betreiberangaben'));
  assert.equal(b.sauber, false);
  // Zwei Punkte hängen an dieser Etappe: Antwortzeit und Bankverbindung.
  assert.equal(b.meldungen.length, 2);
  for (const m of b.meldungen) assert.equal(m.regel, 'etappe-gibt-es-nicht');
});

test('ein Grund, der in eine Zeile passt, ist keiner', () => {
  const b = planbefund(['x'], etappen, [{ punkt: 'x', warumOhneEtappe: 'braucht keine' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-zu-duenn']);
});

test('Etappe und Grund zugleich sind ein Widerspruch, kein Doppel', () => {
  const b = planbefund(['x'], ['upload'], [
    { punkt: 'x', etappe: 'upload', warumOhneEtappe: 'a'.repeat(90) },
  ]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['zuordnung-und-grund']);
});

test('derselbe Punkt zweimal im Register', () => {
  const b = planbefund(['x'], ['upload'], [
    { punkt: 'x', etappe: 'upload' },
    { punkt: 'x', etappe: 'upload' },
  ]);
  assert.ok(b.meldungen.some((m) => m.regel === 'punkt-zweimal'));
});

/* ------------------------------------------------------------------ *
 * Die neue Etappe selbst
 * ------------------------------------------------------------------ */

test('der Plan führt die Etappe, die den Shop zahlungsfähig macht', () => {
  const e = ETAPPEN.find((x) => x.id === 'betreiberangaben');
  assert.ok(e, 'ohne sie hätte der Plan keinen Schritt, nach dem ein Kunde zahlen kann');
  assert.equal(e.zustaendig, 'eintragen', 'keine Ausgabe und keine Anfrage an Dritte');
  assert.match(e.ergebnis, /Vorkasse braucht keinen Zahlungsanbieter/);
});

/**
 * Punkt 2 der eigenen AGB: Mit der Auftragsbestätigung kommt der Vertrag
 * zustande. Wer den Bestellweg einschaltet, ohne sagen zu können, wohin
 * gezahlt wird, schließt Verträge, die er nicht abwickeln kann.
 */
test('der Bestellweg hängt an der Bankverbindung, nicht nur an E-Mail und Rechtstexten', () => {
  const weg = ETAPPEN.find((x) => x.id === 'bestellweg');
  const v = weg.brauchtVor.find((x) => x.etappe === 'betreiberangaben');
  assert.ok(v, 'sonst nimmt der Shop Bestellungen an, die er nicht abrechnen kann');
  assert.match(v.warum, /Vertrag/);
});
