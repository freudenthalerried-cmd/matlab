/**
 * Die Reichweite der Textprüfer.
 *
 * **Befund vom 10. September 2026.** `BEHAUPTUNG` in `src/lieferungen.js`
 * kannte genau die Formulierung, gegen die sie geschrieben wurde. Die Frage
 * dahinter ist größer als der eine Prüfer: Gemessen an 19 Umschreibungen
 * derselben Behauptungen fing **keines** der fünf Textregister auch nur eine.
 *
 * > **Eine Lücke, die aufgeschrieben ist, ist eine Entscheidung. Eine Lücke,
 * > die niemand kennt, ist ein Versehen.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UMSCHREIBUNGEN, umschreibungsbefund, registerbefund,
  REGELQUELLEN, FORMMUSTER, quellenbefund,
} from '../src/umschreibung.js';
import { MEHRLIEFERUNG } from '../src/lieferungen.js';
import { GRENZAUSSAGEN } from '../src/untergrenze.js';
import { ZUSAGE } from '../src/abholung.js';
import { UEBERNAHMEBEHAUPTUNGEN } from '../src/merkblattverweis.js';
import { BETRIEBSAUSSAGEN, GRENZWOERTER } from '../src/inhaltspruefung.js';
import { findeInterna } from '../src/interna.js';
import { PREISAUSSAGEN, VORRATSWORTE } from '../src/aussagen.js';

/** Dieselbe Zusammenstellung wie in `bin/umschreibungspruefung.mjs`. */
const faengt = (satz) => BETRIEBSAUSSAGEN.some((e) => e.wort.test(satz))
  || GRENZWOERTER.some((e) => e.wort.test(satz))
  || findeInterna(satz).length > 0
  || PREISAUSSAGEN.some((e) => new RegExp(e.muster.source, e.muster.flags).test(satz))
  || VORRATSWORTE.some((w) => satz.toLowerCase().includes(w.toLowerCase()))
  || MEHRLIEFERUNG.test(satz)
  || GRENZAUSSAGEN.some((a) => new RegExp(a.muster.source, a.muster.flags).test(satz))
  || ZUSAGE.test(satz)
  || UEBERNAHMEBEHAUPTUNGEN.some((e) => new RegExp(e.muster.source, e.muster.flags).test(satz));

test('jede Regel reicht so weit, wie das Register sagt', () => {
  const b = umschreibungsbefund(faengt, UMSCHREIBUNGEN);
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.gemessen >= 20, `nur ${b.gemessen} Umschreibungen — darüber lässt sich nichts sagen`);
});

test('eine enger gewordene Regel ist ein Befund', () => {
  const b = umschreibungsbefund(() => false, [{
    id: 'x', aussage: 'behauptet etwas', register: 'PROBE',
    saetze: [{ text: 'Satz A', gefangen: true, woher: 'Probe' }],
  }]);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'regel-verengt');
});

test('eine geschlossene Lücke ist auch einer', () => {
  const b = umschreibungsbefund(() => true, [{
    id: 'x', aussage: 'behauptet etwas', register: 'PROBE',
    saetze: [{ text: 'Satz A', gefangen: false, warum: 'ein hinreichend langer Grund für die Lücke' }],
  }]);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'eintrag-veraltet');
  assert.match(b.meldungen[0].text, /gefangen: true/);
});

test('das Register ist begründet — in beide Richtungen', () => {
  const b = registerbefund(UMSCHREIBUNGEN);
  assert.deepEqual(b.maengel, []);
  assert.ok(UMSCHREIBUNGEN.length >= 8, 'ohne Regeln prüft diese Schleife nichts');
});

test('eine Lücke ohne Grund ist ein Mangel', () => {
  const b = registerbefund([{
    id: 'x', aussage: 'a', register: 'P',
    saetze: [{ text: 'A', gefangen: true, woher: 'p' }, { text: 'B', gefangen: false, warum: 'zu kurz' }],
  }]);
  assert.equal(b.sauber, false);
  assert.match(b.maengel[0], /ohne dass ein Grund dabeisteht/);
});

test('ein gefangener Satz ohne Herkunft ist ein Mangel', () => {
  const b = registerbefund([{
    id: 'x', aussage: 'a', register: 'P',
    saetze: [{ text: 'A', gefangen: true }, { text: 'B', gefangen: true, woher: 'p' }],
  }]);
  assert.match(b.maengel[0], /ohne Herkunft/);
});

test('eine Regel mit einem einzigen Satz ist kein Vergleich', () => {
  const b = registerbefund([{ id: 'x', aussage: 'a', register: 'P', saetze: [{ text: 'A', gefangen: true, woher: 'p' }] }]);
  assert.match(b.maengel[0], /unter zwei Sätzen/);
});

/**
 * Der Nachweis, warum diese Datei entstanden ist: Die Sätze, die vor dem
 * 10. September durchrutschten, waren keine Kunstprodukte — es sind
 * Formulierungen, die auf einer Baustoffseite unauffällig aussehen.
 */
test('die geschlossenen Lücken sind wirklich geschlossen', () => {
  for (const satz of [
    'Wir haben die gängigen Größen immer da.',
    'Direkt aus unserem Bestand lieferbar.',
    'Besuchen Sie uns in unserem Verkaufsraum.',
    'Wir sind immer für Sie da.',
    'Unser Team liefert und stellt auf.',
    'Damit bleibt der Keller trocken, versprochen.',
    'Damit sind Sie rechtlich auf der sicheren Seite.',
    'Der Einkaufspreis liegt bei 12,40 €.',
    'Unsere Kalkulation rechnet mit 25 Prozent Aufschlag.',
  ]) {
    assert.equal(faengt(satz), true, `rutscht durch: ${satz}`);
  }
});

test('die offenen Lücken bleiben offen — und stehen mit Grund da', () => {
  // Nicht als Mangel, sondern als Entscheidung: „Schimmel" und „liefern" sind
  // im Baustofftext richtige Wörter, und ein Muster darauf träfe die richtige
  // Auskunft öfter als die falsche Zusage.
  const offen = UMSCHREIBUNGEN.flatMap((r) => r.saetze.filter((s) => !s.gefangen));
  assert.ok(offen.length >= 2, 'ohne offene Lücke prüft diese Schleife nichts');
  for (const s of offen) {
    assert.equal(faengt(s.text), false, `nicht mehr offen: ${s.text}`);
    assert.ok(s.warum.length >= 30, `${s.text}: Grund zu knapp`);
  }
});

/* ------------------------------------------------------------------ *
 * Eine Ebene höher — 10. September, nachmittags
 *
 * Die erste Fassung des Registers deckte vier Regeln ab und meldete grün.
 * Sie kannte vier weitere nicht, zwei davon vom selben Vormittag.
 *
 * > **Ein Register über die Reichweite, das nicht jede Regel kennt, hat die
 * > Lücke, die es misst — eine Ebene höher.**
 * ------------------------------------------------------------------ */

test('jede Behauptungsregel ist eingeordnet — oder sagt, warum nicht', () => {
  const namen = [...REGELQUELLEN.map((r) => `${r.modul}.${r.ausfuhr}`), ...FORMMUSTER];
  assert.equal(new Set(namen).size, namen.length, 'ein Muster steht zweimal in den Listen');
  const b = quellenbefund(namen);
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.behauptungsregeln >= 6, `nur ${b.behauptungsregeln} Behauptungsregeln geführt`);
});

test('jede eingeordnete Behauptungsregel zeigt auf eine Regel des Registers', () => {
  const ids = new Set(UMSCHREIBUNGEN.map((r) => r.id));
  const eingeordnet = REGELQUELLEN.filter((x) => x.behauptung && x.umschrieben);
  assert.ok(eingeordnet.length >= 6, 'ohne eingeordnete Regeln prüft diese Schleife nichts');
  for (const r of eingeordnet) {
    assert.ok(ids.has(r.umschrieben),
      `${r.modul}.${r.ausfuhr} zeigt auf „${r.umschrieben}" — die Regel gibt es nicht`);
  }
});

test('eine neu aufgetauchte Regel ist ein Befund', () => {
  const b = quellenbefund(['aussagen.PREISAUSSAGEN', 'neu.FRISCHES_MUSTER'],
    [{ modul: 'aussagen', ausfuhr: 'PREISAUSSAGEN', behauptung: true, umschrieben: 'preisgleichheit' }], []);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'regel-nicht-eingeordnet');
});

test('ein Eintrag ohne Regel ist auch einer', () => {
  const b = quellenbefund([],
    [{ modul: 'weg', ausfuhr: 'MUSTER', behauptung: true, umschrieben: 'x' }], []);
  assert.ok(b.meldungen.some((m) => m.regel === 'eintrag-ohne-regel'));
});

test('„keine Behauptungsregel" braucht einen Grund', () => {
  const b = quellenbefund(['x.Y'], [{ modul: 'x', ausfuhr: 'Y', behauptung: false, warum: 'kurz' }], []);
  assert.ok(b.meldungen.some((m) => m.regel === 'ohne-grund'));
});

test('eine Behauptungsregel ohne Umschreibungen braucht einen Grund', () => {
  const ohne = quellenbefund(['x.Y'], [{ modul: 'x', ausfuhr: 'Y', behauptung: true }], []);
  assert.ok(ohne.meldungen.some((m) => m.regel === 'ohne-umschreibung'));
  const mit = quellenbefund(['x.Y'], [{
    modul: 'x', ausfuhr: 'Y', behauptung: true,
    warum: 'OFFEN: steht als nächste Zeile aufgeschrieben und ist damit eine Entscheidung',
  }], []);
  assert.deepEqual(mit.meldungen, []);
});

/**
 * Der unangenehme Testfall: Die beiden Regeln, die am Vormittag des
 * 10. September entstanden sind, fielen nachmittags durch denselben Test, den
 * sie diagnostizieren halfen — `MEHRLIEFERUNG` mit 0 von 5, `GRENZAUSSAGEN`
 * mit 1 von 5.
 */
test('auch die jüngsten Regeln reichen weiter als ihr Anlass', () => {
  for (const satz of [
    'Ihre Bestellung wird auf zwei Fuhren aufgeteilt.',
    'Die Ware kommt in Etappen.',
    'Wir liefern in Teilmengen.',
  ]) assert.equal(MEHRLIEFERUNG.test(satz), true, `MEHRLIEFERUNG rutscht durch: ${satz}`);

  for (const satz of [
    'Bestellungen unter 400 Euro nehmen wir nicht an.',
    'Die Untergrenze liegt bei 400 Euro netto.',
    'Ab einem Bestellwert von 400 Euro netto liefern wir.',
  ]) {
    assert.equal(GRENZAUSSAGEN.some((a) => new RegExp(a.muster.source, a.muster.flags).test(satz)), true,
      `GRENZAUSSAGEN rutscht durch: ${satz}`);
  }
});
