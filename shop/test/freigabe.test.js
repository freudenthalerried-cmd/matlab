import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freigabebefund, MINDESTSEITEN } from '../src/freigabe.js';

/*
 * Jede der vier Regeln einmal feuern lassen — und einmal den Fall, in dem
 * keine feuert. Ohne den letzten prüfte diese Datei nur, dass es überhaupt
 * rot werden kann.
 */

/** Eine Lage, in der nichts zu beanstanden ist. */
const gut = () => ({
  seiten: 85,
  quelleStand: 1_700_000_000,
  ausgabeStand: 1_700_000_100,
  internafunde: [],
  luecken: [],
});

test('eine vollständige, frische Ausgabe darf hinaus', () => {
  const e = freigabebefund(gut());
  assert.equal(e.sauber, true, e.meldungen.map((m) => m.satz).join(' | '));
  assert.equal(e.meldungen.length, 0);
  assert.equal(e.geprueft, 4);
});

test('ein halbes Verzeichnis darf eine laufende Seite nicht überschreiben', () => {
  const e = freigabebefund({ ...gut(), seiten: MINDESTSEITEN - 1 });
  assert.equal(e.sauber, false);
  assert.ok(e.meldungen.some((m) => m.regel === 'ausgabe-zu-duenn'));
  // Die Schranke selbst gilt noch als genug — sonst prüfte der Fall darüber
  // nur, dass irgendeine Zahl kleiner ist als irgendeine andere.
  assert.equal(freigabebefund({ ...gut(), seiten: MINDESTSEITEN }).sauber, true);
});

test('eine Ausgabe, die ihrer Quelle hinterherhängt, ist eine Seite von vorgestern', () => {
  const l = gut();
  const e = freigabebefund({ ...l, ausgabeStand: l.quelleStand - 86_400 });
  assert.equal(e.sauber, false);
  const m = e.meldungen.find((x) => x.regel === 'ausgabe-haengt-hinterher');
  assert.ok(m, 'die Regel hat nicht gefeuert');
  // Beide Tage stehen im Satz: Ohne sie müsste der Leser selbst nachsehen,
  // welcher der beiden Stände der ältere ist.
  assert.match(m.satz, /\d{4}-\d{2}-\d{2}.*\d{4}-\d{2}-\d{2}/s);
  // Gleichstand ist kein Hinterherhängen: im selben Commit gebaut.
  assert.equal(freigabebefund({ ...l, ausgabeStand: l.quelleStand }).sauber, true);
});

test('ein internes Wort im Erzeugnis hält den Upload an', () => {
  const e = freigabebefund({
    ...gut(),
    internafunde: [{
      kennung: 'shop.js',
      id: 'lieferantenname',
      fund: 'Poschacher',
      umfeld: '… name: "Poschacher Baustoffhandel" …',
      warum: 'Der Lieferantenname im Fließtext.',
    }],
  });
  assert.equal(e.sauber, false);
  const m = e.meldungen.find((x) => x.regel === 'internes-wort');
  assert.ok(m);
  // Datei, Muster und Grund stehen im Satz — ohne die Datei sucht der Leser.
  assert.match(m.satz, /shop\.js/);
  assert.match(m.satz, /lieferantenname/);
});

test('eine sichtbare Lücke im Impressum ist kein Shop', () => {
  const e = freigabebefund({
    ...gut(),
    luecken: [
      { seite: 'rechtliches/impressum.html', was: 'E-Mail — fehlt' },
      { seite: 'rechtliches/impressum.html', was: 'UID — fehlt' },
    ],
  });
  assert.equal(e.sauber, false);
  const m = e.meldungen.find((x) => x.regel === 'pflichtangabe-fehlt');
  assert.ok(m);
  assert.match(m.satz, /§ 5 ECG/);
  assert.equal(e.durchgelassen, 0);
});

test('--ohne-impressum lässt die Lücke durch und sagt es laut', () => {
  const luecken = [{ seite: 'rechtliches/impressum.html', was: 'E-Mail — fehlt' }];
  const e = freigabebefund({ ...gut(), luecken, ohneImpressum: true });
  assert.equal(e.sauber, true, 'die Ausnahme soll genau diese eine Regel übergehen');
  assert.equal(e.durchgelassen, 1, 'der Lauf muss nennen, was er durchgelassen hat');
  // Und sie übergeht wirklich nur diese eine: Ein internes Wort bleibt rot.
  const f = freigabebefund({
    ...gut(),
    luecken,
    ohneImpressum: true,
    internafunde: [{ kennung: 'a.html', id: 'eigene-marge', fund: 'Marge', umfeld: '…', warum: '…' }],
  });
  assert.equal(f.sauber, false);
  // Mit der Länge davor: über einer leeren Liste ist jede Allaussage wahr,
  // und dieser Fall wäre dann grün, gerade wenn die Ausnahme zu viel durchlässt.
  assert.ok(f.meldungen.length >= 1, 'ohne Meldung prüft die Allaussage darunter nichts');
  assert.ok(f.meldungen.every((m) => m.regel !== 'pflichtangabe-fehlt'));
});

test('ohne Lücken meldet --ohne-impressum nichts durchgelassen', () => {
  const e = freigabebefund({ ...gut(), ohneImpressum: true });
  assert.equal(e.durchgelassen, 0, 'eine Ausnahme, die nichts durchlässt, wird nicht gemeldet');
  assert.equal(e.sauber, true);
});

/*
 * Die Action liegt außerhalb von `shop/`, und die Weisungstafel führt nur
 * Stellen im Shop. Ihre Spur zeigt deshalb auf das Werkzeug und sucht darin
 * den Dateinamen der Action. Diese beiden Fälle halten die Kette zusammen:
 * Verschwindet eine der beiden Dateien, fällt hier etwas um — und nicht erst
 * an dem Tag, an dem jemand auf „Veröffentlichen" drückt.
 */
test('die Action ruft genau den Prüfer, auf den die Weisung zeigt', () => {
  const wurzel = new URL('../../', import.meta.url);
  const action = readFileSync(new URL('.github/workflows/veroeffentlichen.yml', wurzel), 'utf8');
  assert.match(action, /node shop\/bin\/freigabepruefung\.mjs/,
    'die Action lädt hoch, ohne vorher zu fragen, ob sie darf');
  assert.match(action, /--ohne-impressum/, 'der Vorschauweg fehlt');
  // Kein push-Auslöser: Wann der Shop hinausgeht, entscheidet der Auftraggeber.
  assert.doesNotMatch(action, /^\s{2}push:/m, 'ein push-Auslöser würde ungefragt veröffentlichen');
  // Und kein Löschen ohne ausdrückliches Ankreuzen.
  assert.doesNotMatch(action, /mirror -R[^"]*--delete\b/,
    '--delete darf nur aus der Eingabe kommen, nicht fest in der Zeile stehen');
});

test('der Prüfer nennt die Action, die ihn ruft', () => {
  const werkzeug = readFileSync(new URL('../bin/freigabepruefung.mjs', import.meta.url), 'utf8');
  assert.match(werkzeug, /veroeffentlichen\.yml/,
    'ohne diesen Namen zeigt die Spur der Weisungstafel ins Leere');
});
