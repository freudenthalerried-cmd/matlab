import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ANNAHMEN,
  sessionbedarf,
  verschlechtere,
  elastizitaet,
  rangfolge,
  kipppunkt,
} from '../src/empfindlichkeit.js';

// Die Lage des **laufenden** Modells, aus derselben Datei, mit der auch
// `npm run empfindlichkeit` rechnet. Vorher stand hier 0,35 Rohmarge — das
// Radonmodell, das der Auftraggeber am 22. August verlassen hat. Eine
// Vorrichtung, die einen anderen Plan beschreibt als das Werkzeug, prüft
// einen Plan, den es nicht gibt.
const LAGE = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/zielgroessen.json', import.meta.url)), 'utf8'),
);

test('Die vier Annahmen tragen Herkunft, Konfidenz und den Weg zur Klärung', () => {
  assert.equal(ANNAHMEN.length, 4);
  for (const a of ANNAHMEN) {
    assert.ok(a.herkunft.length > 10, `${a.id} ohne Herkunft`);
    assert.ok(a.klaertDurch.length > 10, `${a.id} ohne Klärungsweg`);
    assert.ok(['kleiner', 'groesser'].includes(a.schlechterIst));
  }
});

test('Verschlechtern heißt bei jeder Annahme etwas anderes', () => {
  const m = verschlechtere(LAGE, 'rohmarge', 0.10);
  assert.ok(m.rohmarge < LAGE.rohmarge, 'weniger Marge ist schlechter');

  const w = verschlechtere(LAGE, 'werbeanteil', 0.10);
  assert.ok(w.werbeanteil > LAGE.werbeanteil, 'mehr Werbekosten sind schlechter');
});

test('Eine Annahme, die in der Lage fehlt, wird nicht erfunden', () => {
  assert.throws(() => verschlechtere({}, 'rohmarge', 0.1), /führt keinen Wert/);
  assert.throws(() => verschlechtere(LAGE, 'wetter', 0.1), /Unbekannte Annahme/);
});

test('Die Rohmarge ist der stärkste Hebel, stärker als proportional', () => {
  const e = elastizitaet(LAGE, 'rohmarge', 'karte-stripe');
  assert.ok(e.elastizitaet > 1.5, `erwartet über 1,5 — ist ${e.elastizitaet}`);
  assert.ok(e.mehrSessions > 300);
});

test('Die Umsatzquote wirkt proportional', () => {
  const e = elastizitaet(LAGE, 'umsatzProSession', 'karte-stripe');
  assert.ok(e.elastizitaet > 1.0 && e.elastizitaet < 1.2, `${e.elastizitaet}`);
});

test('Ein kleinerer Warenkorb schadet zweifach', () => {
  // Erstens braucht es mehr Bestellungen für denselben Umsatz. Zweitens steigt
  // der Anteil des Fixbetrags der Zahlungsgebühr, weil er sich auf weniger
  // Warenwert verteilt — die Deckungsbeitragsrate sinkt zusätzlich.
  const mitFix = elastizitaet(LAGE, 'warenkorbNetto', 'karte-stripe');
  const ohneFix = elastizitaet(LAGE, 'warenkorbNetto', 'rechnungskauf');

  // **Berichtigt am 01.09.** Hier stand `> 1.2` — eine Zahl, die beim
  // 35-%-Modell gemessen und abgeschrieben wurde. Bei 25 % sind es 1,14, und
  // die Probe wurde rot, obwohl die Aussage stimmt. Geprüft wird jetzt die
  // Aussage: mehr als proportional, und mit Fixbetrag stärker als ohne.
  assert.ok(mitFix.elastizitaet > 1, `nicht überproportional: ${mitFix.elastizitaet}`);
  assert.ok(
    mitFix.elastizitaet > ohneFix.elastizitaet,
    'beim Rechnungskauf ohne Fixbetrag fällt der zweite Effekt weg',
  );
});

test('Der Werbekostenanteil ist der schwächste Hebel, die Rohmarge der stärkste', () => {
  // Gemessen wird die Rangfolge über **alle** Annahmen, nicht gegen zwei
  // abgeschriebene Schwellen. Wer eine fünfte Annahme aufnimmt, wird hier
  // daran erinnert, dass sie sich einordnen muss.
  const werte = ANNAHMEN.map((a) => ({ id: a.id, e: elastizitaet(LAGE, a.id, LAGE.zahlweg).elastizitaet }));
  assert.equal(werte.length, ANNAHMEN.length);
  assert.ok(werte.every((w) => Number.isFinite(w.e)), 'eine Annahme liefert keine Elastizität');

  const sortiert = [...werte].sort((x, y) => y.e - x.e);
  assert.equal(sortiert[0].id, 'rohmarge', `stärkster Hebel ist ${sortiert[0].id}`);
  assert.equal(sortiert.at(-1).id, 'werbeanteil', `schwächster Hebel ist ${sortiert.at(-1).id}`);
  assert.ok(sortiert.at(-1).e < sortiert[0].e / 2, 'der Abstand zwischen stärkstem und schwächstem ist eingeebnet');
});

test('Je kleiner die Rohmarge, desto empfindlicher wird sie', () => {
  // Die Rohmarge steht im Nenner der Deckungsbeitragsrate. Die Aussage ist
  // deshalb nicht an einen bestimmten Wert gebunden — geprüft wird der
  // Verlauf, nicht ein Paar abgeschriebener Zahlen.
  const stufen = [LAGE.rohmarge, LAGE.rohmarge - 0.03, LAGE.rohmarge - 0.06];
  assert.ok(stufen.at(-1) > 0, 'die Stufen müssen positiv bleiben');
  const werte = stufen.map((r) => elastizitaet({ ...LAGE, rohmarge: r }, 'rohmarge', LAGE.zahlweg).elastizitaet);
  for (let i = 1; i < werte.length; i++) {
    assert.ok(werte[i] > werte[i - 1],
      `bei ${stufen[i]} ist die Elastizität ${werte[i]}, bei ${stufen[i - 1]} schon ${werte[i - 1]}`);
  }
});

test('Der teurere Zahlweg verschärft die Empfindlichkeit', () => {
  const karte = elastizitaet(LAGE, 'rohmarge', 'karte-stripe');
  const rechnung = elastizitaet(LAGE, 'rohmarge', 'rechnungskauf');
  assert.ok(rechnung.elastizitaet > karte.elastizitaet);
  assert.ok(rechnung.basisSessions > karte.basisSessions);
});

test('Die Rangfolge stellt die Rohmarge nach oben', () => {
  const r = rangfolge(LAGE, 'karte-stripe');
  assert.equal(r.length, 4);
  assert.equal(r[0].annahme, 'rohmarge');
  assert.equal(r[3].annahme, 'werbeanteil');
});

test('Die Rangfolge trägt mit, wie sich jede Annahme klären lässt', () => {
  const r = rangfolge(LAGE, 'karte-stripe');
  assert.equal(r.length, ANNAHMEN.length);
  for (const e of r) {
    assert.ok(e.klaertDurch.length > 10);
    assert.ok(e.konfidenz.length > 3);
  }
});

test('Die Rohmarge hat einen Kipppunkt, die Umsatzquote nicht', () => {
  const marge = kipppunkt(LAGE, 'rohmarge', 'karte-stripe');
  assert.equal(marge.kippt, true);
  assert.ok(marge.wert > 0.11 && marge.wert < 0.13, `Kipppunkt bei ${marge.wert}`);

  const quote = kipppunkt(LAGE, 'umsatzProSession', 'karte-stripe');
  assert.equal(quote.kippt, false, 'weniger Besucherausbeute macht das Modell teurer, nicht untragbar');
});

test('Wo das Modell nicht mehr trägt, wird das gesagt statt gerechnet', () => {
  const eng = { ...LAGE, rohmarge: 0.13 };
  const e = elastizitaet(eng, 'rohmarge', 'karte-stripe');
  assert.equal(e.traegtNicht, true);
  assert.equal(e.neueSessions, null);
  assert.match(e.hinweis, /trägt das Modell nicht mehr/);
});

test('Eine Ausgangslage, die schon nicht trägt, wird nicht schöngerechnet', () => {
  const kaputt = { ...LAGE, rohmarge: 0.10 };
  assert.equal(sessionbedarf(kaputt, 'karte-stripe'), null);
  assert.throws(() => elastizitaet(kaputt, 'rohmarge', 'karte-stripe'), /trägt das Modell schon nicht/);
});

/**
 * **Berichtigt am 01.09.** Vorher prüfte diese Stelle die Untergrenze aus
 * Gate 1 (32 % Rohmarge) — ein Gate, das seit dem 22. August gegenstandslos
 * ist. Und sie verglich fest mit „kleiner als": Die einzige Grenze, die es im
 * laufenden Modell gibt, gehört zum **Werbekostenanteil**, und der wird
 * schlechter, wenn er *steigt*. Eine Wache, die in die falsche Richtung sieht,
 * hätte ihn nie ausgelöst.
 *
 * Die Grenzwerte stehen nicht mehr im Test, sondern kommen aus `ANNAHMEN` —
 * sonst prüft die Probe nur, ob zwei Stellen dieselbe Zahl tragen.
 */
test('Die dokumentierte Grenze schlägt in der Richtung an, in der die Annahme schlechter wird', () => {
  const mitGrenze = ANNAHMEN.filter((a) => a.grenze != null);
  assert.ok(mitGrenze.length > 0, 'keine Annahme mit Grenze — die Schleife darunter prüft nichts');

  for (const a of mitGrenze) {
    const basis = LAGE[a.id];
    assert.equal(typeof basis, 'number', `${a.id} fehlt in der Lage`);
    // Der Anteil, ab dem die Grenze reißt — und knapp beiderseits davon.
    const anteil = Math.abs(1 - a.grenze / basis);
    const drueber = elastizitaet(LAGE, a.id, LAGE.zahlweg, anteil * 1.05);
    const drunter = elastizitaet(LAGE, a.id, LAGE.zahlweg, anteil * 0.95);
    assert.equal(drueber.grenzeGerissen, true, `${a.id}: knapp jenseits der Grenze schlägt nicht an`);
    assert.equal(drueber.grenze, a.grenze);
    assert.match(drueber.hinweisGrenze, /Grenze/);
    assert.equal(drunter.grenzeGerissen, false, `${a.id}: knapp diesseits schlägt schon an`);
  }

  // Eine Annahme ohne Grenze löst nie aus — und zwar auch dann nicht, wenn
  // sie weit ins Ungünstige rutscht.
  const ohne = ANNAHMEN.find((a) => a.grenze == null);
  assert.ok(ohne, 'keine Annahme ohne Grenze — der Gegenfall fehlt');
  assert.equal(elastizitaet(LAGE, ohne.id, LAGE.zahlweg, 0.4).grenzeGerissen, false);
});

test('Der Kipppunkt nennt die dokumentierte Grenze mit — und nur, wo es eine gibt', () => {
  // Die Rohmarge hat keine eigene Grenze mehr: An die Stelle von Gate 1 tritt
  // Gate 20, und das ist genau der rechnerische Kipppunkt.
  const marge = kipppunkt(LAGE, 'rohmarge', LAGE.zahlweg);
  assert.equal(marge.kippt, true, 'die Rohmarge muss irgendwo kippen');
  assert.equal(marge.grenzeBeiAnteil, null, 'die Rohmarge trägt keine eigene Grenze mehr');

  // Der Werbekostenanteil hat eine, und sie liegt in der Richtung „größer".
  const werbung = ANNAHMEN.find((a) => a.id === 'werbeanteil');
  assert.ok(werbung.grenze > LAGE.werbeanteil, 'die Grenze liegt über der Basis, sonst prüft das hier nichts');
  const w = kipppunkt(LAGE, 'werbeanteil', LAGE.zahlweg);
  assert.ok(w.grenzeBeiAnteil > 0, 'der Anteil bis zur Grenze fehlt');
  const erreicht = LAGE.werbeanteil * (1 + w.grenzeBeiAnteil);
  assert.ok(Math.abs(erreicht - werbung.grenze) < 1e-9,
    `bei ${w.grenzeBeiAnteil} schlechter liegt der Wert bei ${erreicht}, nicht bei ${werbung.grenze}`);
});

/**
 * Die Zielgrößen stehen an einer Stelle — und der Katalog rechnet mit
 * derselben Marge. Laufen sie auseinander, plant das Modell einen Shop mit
 * einer Marge, die der Shop nicht nimmt.
 */
test('Die Zielgrößen sind vollständig und decken sich mit dem Katalog', async () => {
  const { ZIELMARGE } = await import('../src/baustoffkatalog.js');
  assert.equal(LAGE.rohmarge, ZIELMARGE,
    `zielgroessen.json rechnet mit ${LAGE.rohmarge}, der Katalog mit ${ZIELMARGE}`);

  // Jede Annahme, die das Modul kennt, muss die Lage auch führen — sonst
  // wirft `verschlechtere`, und zwar erst beim Aufruf.
  assert.ok(ANNAHMEN.length > 0, 'keine Annahmen — die Schleife prüft nichts');
  for (const a of ANNAHMEN) {
    assert.equal(typeof LAGE[a.id], 'number', `zielgroessen.json führt keinen Wert für ${a.id}`);
  }
  for (const feld of ['zielgewinn', 'fixkosten', 'zahlweg']) {
    assert.ok(LAGE[feld], `zielgroessen.json führt kein ${feld}`);
  }

  // Und jede Angabe trägt eine Herkunftsnotiz. Eine Zahl ohne Herkunft ist in
  // dieser Datei genauso wenig wert wie auf einer Kundenseite.
  for (const feld of ['zielgewinn', 'fixkosten', 'rohmarge', 'werbeanteil', 'warenkorbNetto', 'umsatzProSession']) {
    const notiz = `_${feld}Hinweis`;
    assert.ok(String(LAGE[notiz] ?? '').length > 20, `${feld} ohne Herkunftsnotiz (${notiz})`);
  }
});
