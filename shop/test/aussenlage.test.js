/**
 * Die Außenlage — gemessen statt angenommen.
 *
 * **Der Anlass, 9. September 2026, nachts.** In `src/startklar.js` stand seit
 * dem ersten Bau, ob das Repository privat ist, sei „von hier aus nicht
 * feststellbar". Nachgesehen hatte das niemand: Der Netzausgang ist gesperrt,
 * das GitHub-Werkzeug nicht — es beantwortet die Frage in einem Aufruf.
 *
 * > **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * > ausschließt.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  aussenlage, tageSeit, widerspruchsbefund, aussengrenzenbefund, GRENZE_TAGE,
} from '../src/aussenlage.js';
import { startklar } from '../src/startklar.js';

const vermerk = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/aussenlage.json', import.meta.url)), 'utf8'));

test('der Vermerk im Verzeichnis ist lesbar und trägt sein Messdatum', () => {
  assert.match(vermerk.gemessenAm, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof vermerk.repositoryOeffentlich, 'boolean');
  // Die Grenze der Datei gehört in die Datei — nicht nur in den Kopf dieses Tests.
  assert.match(vermerk._grenze, /Handgriff/);
  /*
   * **Nachgezogen am 10. September.** Hier stand `/GitHub-Werkzeug/`, weil die
   * Sichtbarkeit nur über ein fremdes Werkzeug zu haben war. Seit an dem Tag
   * gemessen wurde, dass `api.github.com` aus dieser Umgebung antwortet, kann
   * der Shop sie selbst erheben — und der Weg, der ohne fremdes Werkzeug
   * auskommt, ist der, den dieses Feld nennen muss.
   */
  assert.match(vermerk._wieGemessen, /api\.github\.com/);
});

test('eine frische Messung wird durchgereicht', () => {
  const b = aussenlage(vermerk, vermerk.gemessenAm);
  assert.equal(b.repositoryOeffentlich, vermerk.repositoryOeffentlich);
  assert.equal(b.alter, 0);
  assert.equal(b.grund, null);
});

/**
 * Der Kern: **Eine Messung ist eine Aussage über den Tag, an dem sie gemacht
 * wurde.** Der gefährliche Fall ist nicht „öffentlich und keiner weiß es",
 * sondern „einmal privat gemessen, seither wieder öffentlich".
 */
test('eine alte Messung sagt über heute nichts', () => {
  const spaet = new Date(Date.parse(`${vermerk.gemessenAm}T00:00:00Z`) + (GRENZE_TAGE + 1) * 86400000)
    .toISOString().slice(0, 10);
  const b = aussenlage(vermerk, spaet);
  assert.equal(b.repositoryOeffentlich, null);
  assert.match(b.grund, /Tage alt/);
});

test('genau an der Grenze trägt sie noch', () => {
  const rand = new Date(Date.parse(`${vermerk.gemessenAm}T00:00:00Z`) + GRENZE_TAGE * 86400000)
    .toISOString().slice(0, 10);
  assert.equal(aussenlage(vermerk, rand).repositoryOeffentlich, vermerk.repositoryOeffentlich);
});

test('ein fehlender oder unlesbarer Vermerk ist keine Auskunft, sondern ein Grund', () => {
  const faelle = [
    [null, /fehlt/],
    [{}, /kein lesbares Messdatum/],
    [{ gemessenAm: 'gestern', repositoryOeffentlich: true }, /kein lesbares Messdatum/],
    [{ gemessenAm: '2026-09-20', repositoryOeffentlich: true }, /auf morgen/],
  ];
  assert.equal(faelle.length, 4, 'die Schleife prüfte zu wenig');
  for (const [eingabe, muster] of faelle) {
    const b = aussenlage(eingabe, '2026-09-09');
    assert.equal(b.repositoryOeffentlich, null, JSON.stringify(eingabe));
    assert.match(b.grund, muster, JSON.stringify(eingabe));
  }
});

test('ein Feld, das keine Wahrheitsangabe ist, gilt nicht als Auskunft', () => {
  const b = aussenlage({ gemessenAm: '2026-09-09', repositoryOeffentlich: 'ja' }, '2026-09-09');
  assert.equal(b.repositoryOeffentlich, null);
});

test('tageSeit rechnet vorwärts und meldet Unlesbares', () => {
  assert.equal(tageSeit('2026-09-01', '2026-09-09'), 8);
  assert.equal(tageSeit('2026-09-09', '2026-09-01'), -8);
  assert.equal(tageSeit('irgendwann', '2026-09-09'), null);
});

/* ------------------------------------------------------------------ *
 * Die Messung schlägt die Angabe
 * ------------------------------------------------------------------ */

test('Angabe und Messung, die einander widersprechen, fallen auf', () => {
  const gemessen = { repositoryOeffentlich: true };
  const b = widerspruchsbefund(gemessen, true);
  assert.deepEqual(b.map((m) => m.regel), ['erklaerung-gegen-messung']);
  assert.match(b[0].text, /die Messung gilt/);
});

test('stimmen sie überein, gibt es nichts zu melden', () => {
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: true }, false), []);
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: false }, true), []);
  // Ohne Messung oder ohne Angabe ist nichts zu vergleichen.
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: null }, true), []);
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: true }, null), []);
});

/* ------------------------------------------------------------------ *
 * Was die Bereitschaftsliste daraus macht
 * ------------------------------------------------------------------ */

test('mit Messung ist der Repositorypunkt beantwortet, nicht gefragt', () => {
  const offen = startklar({ aussenlage: vermerk, heute: vermerk.gemessenAm })
    .punkte.find((p) => p.id === 'repository');
  assert.equal(offen.zustand, 'offen', 'öffentlich gemessen heißt offen, nicht unpruefbar');
  assert.match(offen.befund, /gemessen am/);

  const privat = startklar({
    aussenlage: { ...vermerk, repositoryOeffentlich: false },
    heute: vermerk.gemessenAm,
  }).punkte.find((p) => p.id === 'repository');
  assert.equal(privat.zustand, 'erfuellt');
});

/**
 * Und die Gegenrichtung, ohne die die Messung zur Zusage würde: Ist sie alt
 * oder fehlt sie, steht der Punkt wieder als Frage da — mit dem Grund.
 */
test('ohne tragende Messung ist der Punkt wieder eine Frage', () => {
  const b = startklar({ aussenlage: null, heute: '2026-09-09' })
    .punkte.find((p) => p.id === 'repository');
  assert.equal(b.zustand, 'unpruefbar');
  assert.match(b.befund, /fehlt/);
  assert.match(b.befund, /rekonstruierbar/);
});

/* ------------------------------------------------------------------ *
 * Die behaupteten Grenzen
 * ------------------------------------------------------------------ */

test('jede behauptete Grenze nennt einen Weg oder einen Grund', () => {
  const b = aussengrenzenbefund(vermerk, vermerk.gemessenAm);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.ok(b.grenzen >= 5, `nur ${b.grenzen} Grenzen — die Liste ist zu dünn zum Prüfen`);
  assert.equal(b.gemessen + b.begruendet, b.grenzen);
});

/**
 * Der Kern: **Nicht versucht ist nicht unmöglich.** Genau diese Lücke hat am
 * 9. September zweimal eine falsche Grenze gedeckt.
 */
test('ein genannter Weg ohne Versuch fällt auf', () => {
  const b = aussengrenzenbefund({ versuche: {} }, '2026-09-09',
    [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grenze-ohne-versuch']);
  assert.match(b.meldungen[0].text, /niemand ist ihn gegangen/);
});

test('ein alter Versuch sagt über heute nichts', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-01-01', ergebnis: 'gesperrt', beleg: 'a'.repeat(30) } } },
    '2026-09-09', [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['versuch-veraltet']);
});

test('ein Ergebnis ohne Beleg ist eine Behauptung mit Ziffern', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-09-09', ergebnis: 'gesperrt', beleg: 'ging nicht' } } },
    '2026-09-09', [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['beleg-fehlt']);
});

test('ein drittes Ergebnis gibt es nicht', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-09-09', ergebnis: 'vielleicht', beleg: 'a'.repeat(30) } } },
    '2026-09-09', [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['ergebnis-unbekannt']);
});

test('ohne Weg braucht es einen ganzen Grund', () => {
  const b = aussengrenzenbefund({ versuche: {} }, '2026-09-09',
    [{ id: 'x', was: 'irgendwas', wie: null, warumOhneVersuch: 'geht halt nicht' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-zu-duenn']);
});

/** Beide Richtungen: ein Versuch ohne Grenze, und ein Versuch ohne Weg. */
test('ein Versuch, zu dem keine Grenze gehört, fällt auch auf', () => {
  const b = aussengrenzenbefund(
    { versuche: { fremd: { am: '2026-09-09', ergebnis: 'gesperrt', beleg: 'a'.repeat(30) } } },
    '2026-09-09', []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['versuch-ohne-grenze']);
});

test('eine Grenze ohne Weg, zu der es einen Versuch gibt, ist ein Widerspruch', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-09-09', ergebnis: 'gesperrt', beleg: 'a'.repeat(30) } } },
    '2026-09-09',
    [{ id: 'x', was: 'irgendwas', wie: null, warumOhneVersuch: 'g'.repeat(90) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['versuch-ohne-weg']);
});

/**
 * Und das Ergebnis, um das es geht: Eine Grenze, die sich als überschreitbar
 * erwiesen hat, ist keine Grenze mehr. Am 9. September war es die
 * Sichtbarkeit des Repositorys.
 */
test('das Verzeichnis hält fest, welche Grenze gefallen ist', () => {
  const b = aussengrenzenbefund(vermerk, vermerk.gemessenAm);
  assert.ok(b.moeglich >= 1, 'keine einzige überschrittene Grenze — dann fehlt der Anlass');
  assert.equal(vermerk.versuche['repository-sichtbarkeit'].ergebnis, 'moeglich');
  assert.match(vermerk.versuche['repository-sichtbarkeit'].beleg, /visibility/);
});
