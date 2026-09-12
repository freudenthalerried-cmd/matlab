/**
 * Wie weit reicht der Betrieb?
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg vom Klick bis zum Angebot
 * ist gebaut und in einem Befehl belegt. Danach hört er auf — und nirgends
 * stand, wo genau.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SCHRITTE, ABZWEIGE, kettenbefund, abzweigbefund, stufenbefund,
} from '../src/betriebskette.js';
import { AGB_GLIEDERUNG } from '../src/rechtstexte.js';

test('jeder Schritt nennt ein Gate, und jede Lücke ihren Grund', () => {
  assert.ok(SCHRITTE.length >= 8, `nur ${SCHRITTE.length} Schritte — die Kette ist zu kurz gefasst`);
  assert.deepEqual(kettenbefund().meldungen, []);
});

test('ein Schritt ohne Werkzeug und ohne Grund ist der Fund', () => {
  const b = kettenbefund([{ id: 'x', was: 'X', werkzeug: null, gate: 'Gate 1' }]);
  assert.equal(b.meldungen[0].regel, 'ohne-werkzeug-ohne-grund');
});

test('ein Schritt mit Werkzeug darf nicht begründen, warum keines da ist', () => {
  // Dieselbe Regel wie im Register der ungerufenen Ausfuhren: Eine Begründung
  // für einen Zustand, den es nicht mehr gibt, ist schlimmer als keine.
  const b = kettenbefund([{
    id: 'x', was: 'X', werkzeug: 'npm run x', gate: 'Gate 1',
    warumOhneWerkzeug: 'Ein Grund, der hier nichts mehr zu suchen hat, weil das Werkzeug da ist.',
  }]);
  assert.equal(b.meldungen[0].regel, 'grund-ohne-fall');
});

test('ein Schritt ohne Gate wird gemeldet', () => {
  const b = kettenbefund([{ id: 'x', was: 'X', werkzeug: 'npm run x' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'ohne-gate'), JSON.stringify(b.meldungen));
});

test('erreicht zählt den Zusammenhang, nicht die Werkzeuge', () => {
  /**
   * **Der eigentliche Ertrag der Liste.** Fünf Schritte haben ein Werkzeug,
   * und die Kette reicht trotzdem nur bis zum vierten: Die Aufbewahrung ist
   * gebaut und liegt jenseits der Lücke.
   *
   * > **Eine Zählung ohne diese Unterscheidung meldete „fünf von neun" und
   * > verspräche mehr, als zusammenhängt.**
   */
  const b = kettenbefund([
    { id: 'a', was: 'A', werkzeug: 'npm run a', gate: 'G' },
    { id: 'b', was: 'B', werkzeug: null, gate: 'G', warumOhneWerkzeug: 'Ein tragfähiger Grund, der lang genug ist, um durch die Prüfung zu kommen.' },
    { id: 'c', was: 'C', werkzeug: 'npm run c', gate: 'G' },
  ]);
  assert.equal(b.mitWerkzeug, 2);
  assert.equal(b.erreicht, 1, 'die Kette hört an der ersten Lücke auf');
  assert.equal(b.ersteLuecke.id, 'b');
});

test('ohne Lücke reicht die Kette bis zum Ende', () => {
  const b = kettenbefund([{ id: 'a', was: 'A', werkzeug: 'npm run a', gate: 'G' }]);
  assert.equal(b.erreicht, 1);
  assert.equal(b.ersteLuecke, null);
});

test('der Bestand hört bei der Zahlung auf', () => {
  // Nicht als Zusicherung über die Zukunft, sondern als Marke: Wird die Lücke
  // geschlossen, muss dieser Fall nachgezogen werden — und dann steht in der
  // Änderung, dass sich der Betrieb verlängert hat.
  const b = kettenbefund();
  assert.equal(b.ersteLuecke.id, 'zahlung');
  assert.equal(b.erreicht, 4);
});

/*
 * **Die Abzweige, 11. September 2026.** Die Schritte oben beschreiben den
 * geglückten Fall. Was passiert, wenn er nicht glückt, stand nirgends — auch
 * nicht, nachdem `npm run vorgang -- --stufe absage` gebaut war.
 */

test('jeder Abzweig nennt Werkzeug oder Grund und Regel oder Grund', () => {
  assert.equal(ABZWEIGE.length, 4, `${ABZWEIGE.length} Abzweige — die Liste hat sich geändert`);
  assert.deepEqual(abzweigbefund().meldungen, []);
});

test('ein Abzweig, der von einem erfundenen Schritt abgeht, wird gemeldet', () => {
  const b = abzweigbefund([{
    id: 'x', ab: 'gibtsnicht', was: 'X', werkzeug: 'npm run x', grundlage: 'AGB Punkt 1',
  }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['abzweig-ins-leere']);
});

test('ein Abzweig ohne Werkzeug und ohne Grund ist der Fund', () => {
  const b = abzweigbefund(
    [{ id: 'x', ab: 'a', was: 'X', werkzeug: null, grundlage: 'AGB Punkt 1' }],
    [{ id: 'a' }],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['abzweig-ohne-werkzeug-ohne-grund']);
});

test('ein Abzweig ohne veröffentlichte Regel und ohne Grund ist der teurere Fund', () => {
  // Der Unterschied zur Zeile darüber: Diesen trifft der Kunde, der schon
  // gezahlt hat — er sucht die Regel und findet keine.
  const b = abzweigbefund(
    [{ id: 'x', ab: 'a', was: 'X', werkzeug: 'npm run x', grundlage: null }],
    [{ id: 'a' }],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['abzweig-ohne-grundlage-ohne-grund']);
});

test('eine Begründung neben dem, was sie begründet, wird gemeldet', () => {
  const lang = 'Ein Grund, der hier nichts mehr zu suchen hat, weil das Benannte längst da ist.';
  const b = abzweigbefund(
    [{
      id: 'x', ab: 'a', was: 'X', werkzeug: 'npm run x', grundlage: 'AGB Punkt 1',
      warumOhneWerkzeug: lang, warumOhneGrundlage: lang,
    }],
    [{ id: 'a' }],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-ohne-fall', 'grundlage-doppelt']);
});

/*
 * **Die Gegenrichtung.** Am 10. September bekam `bin/vorgang.mjs` eine dritte
 * Stufe, und die Karte des Betriebs meldete weiter, es sei alles in Ordnung.
 * Die nächsten vier Fälle sind der Prüfer, der das nicht mehr zulässt.
 */

const QUELLE = readFileSync(new URL('../bin/vorgang.mjs', import.meta.url), 'utf8');

test('die Karte hat für jede Stufe des Werkzeugs einen Platz', () => {
  const b = stufenbefund(QUELLE);
  // **Fünf seit dem 12. September**: `bestellung` ist dazugekommen — das
  // fünfte Papier eines Geschäftsfalls, das bis dahin nur auf dem Bildschirm
  // stand.
  assert.equal(b.stufen.length, 6, `gelesen: ${JSON.stringify(b.stufen)}`);
  assert.deepEqual(b.meldungen, []);
});

test('eine Stufe, die in der Karte fehlt, wird gemeldet', () => {
  // Genau der Zustand vor dieser Runde: Der Abzweig „absage" existierte nicht.
  const ohne = ABZWEIGE.filter((z) => z.id !== 'absage');
  const b = stufenbefund(QUELLE, SCHRITTE, ohne);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['stufe-ohne-platz']);
  assert.match(b.meldungen[0].text, /absage/);
});

test('ein Platz für eine Stufe, die es nicht gibt, wird auch gemeldet', () => {
  const b = stufenbefund(QUELLE, [], [{
    id: 'x', ab: 'a', was: 'X', werkzeug: 'npm run vorgang -- --stufe mahnung',
  }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'platz-ohne-stufe'), JSON.stringify(b.meldungen));
});

test('ein Quelltext ohne lesbare Stufenliste ist kein grünes Ergebnis', () => {
  // Ein Prüfer, der nichts findet, hat nichts geprüft — und muss das sagen.
  const b = stufenbefund('const stufe = wahl("stufe");');
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['stufen-nicht-lesbar']);
});

test('die Begründung des Abzweigs ohne Regel gilt, solange die AGB schweigt', () => {
  /**
   * **Eine Begründung, die einen Verzicht trägt, gehört selbst geprüft.** Der
   * Abzweig `kann-nicht-geliefert-werden` hat keine veröffentlichte Regel, und
   * der Grund dafür lautet: keiner der dreizehn AGB-Punkte sagt, was gilt,
   * wenn die bezahlte Ware nicht kommt. Sobald das nicht mehr stimmt, ist die
   * Begründung falsch — und dieser Fall wird rot, bevor sie jemand liest.
   */
  assert.equal(AGB_GLIEDERUNG.length, 13, 'die AGB hat nicht mehr dreizehn Punkte');
  const treffer = AGB_GLIEDERUNG.filter(
    (p) => /rücktritt|lieferunfähig|nicht geliefert|nicht lieferbar/i.test(
      `${p.titel} ${p.hinweis ?? ''}`,
    ),
  );
  assert.deepEqual(treffer.map((p) => p.nr), [],
    'Die AGB regelt die Lieferunfähigkeit jetzt — warumOhneGrundlage nachziehen.');
});
