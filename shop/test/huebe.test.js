/**
 * Wonach die Kranentladung verrechnet wird.
 *
 * **Der Befund, 4. September 2026.** Der Shop zählt für die Kranentladung die
 * **Sperrgut-Positionen** eines Warenkorbs. Der Lieferant fakturiert
 * „Kranentladung pro **Hub**" — und ein Hub ist das Anheben einer Palette,
 * nicht einer Artikelzeile.
 *
 * > **Das Modell liegt auf beiden belegten Lieferungen daneben, und zwar in
 * > entgegengesetzte Richtungen.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { HUBBELEGE, JE_HUB_NETTO, abweichung, hubbefund } from '../src/huebe.js';

const lieferanten = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/lieferanten.json', import.meta.url)), 'utf8',
)).lieferanten;

test('der Hubsatz steht nur an einer Stelle', () => {
  const poschacher = lieferanten.find((l) => l.id === 'poschacher');
  assert.equal(JE_HUB_NETTO, poschacher.fracht.sperrgutZuschlagNetto,
    'zwei Zahlen für denselben Satz — eine davon veraltet');
});

test('jeder Beleg trägt seinen Grund', () => {
  assert.ok(HUBBELEGE.length >= 2, 'unter zwei Beobachtungen ist keine Aussage');
  for (const b of HUBBELEGE) {
    assert.ok(b.warum && b.warum.length >= 60, `${b.rechnung}: ohne belastbaren Grund`);
    assert.ok(b.huebe > 0 && b.palettenGeliefert > 0 && b.sperrgutPositionen > 0, b.rechnung);
  }
});

test('das Modell trifft keine der belegten Lieferungen', () => {
  const e = hubbefund();
  assert.equal(e.trifft, 0);
  assert.equal(e.groesstesZuViel, 22.5);
  assert.equal(e.groesstesZuWenig, 7.5);
  // Beide Richtungen kommen vor — ein Fehler, der sich im Mittel aufhebt,
  // trifft trotzdem jede einzelne Lieferung.
  assert.ok(e.einzeln.some((a) => a.richtung === 'zu viel'));
  assert.ok(e.einzeln.some((a) => a.richtung === 'zu wenig'));
});

/**
 * Der eindeutige Beleg: sechs Sperrgut-Positionen, drei Hübe. Er schließt die
 * Zählung je Position aus, ohne dass man wissen muss, wonach sonst gezählt
 * wird. Was **stattdessen** gilt, sagt keiner der beiden Belege.
 */
test('mindestens ein Beleg widerlegt die Zählung je Position eindeutig', () => {
  const eindeutig = HUBBELEGE.filter((b) => b.palettenGutgeschrieben === 0);
  assert.ok(eindeutig.length >= 1, 'ohne einen eindeutigen Beleg ist nichts widerlegt');
  assert.ok(eindeutig.some((b) => Math.abs(b.huebe - b.sperrgutPositionen) >= 3),
    'auf keinem eindeutigen Beleg weichen Hübe und Positionen deutlich ab');

  // Und die andere Richtung bleibt offen: Eine Palettenregel liest hier
  // niemand heraus.
  const e = hubbefund();
  assert.ok(e.huebeGegenPaletten.some((d) => d !== 0),
    'gingen Hübe und Paletten überall auf, wäre die Palettenfrage beantwortet');
});

test('ein leerer Befund ist kein grüner', () => {
  assert.throws(() => hubbefund([]), /kein grüner/);
});

test('eine Lieferung, auf der das Modell trifft, wird als Treffer gezählt', () => {
  const treffer = abweichung({ rechnung: 'X', huebe: 3, sperrgutPositionen: 3 });
  assert.equal(treffer.differenz, 0);
  assert.equal(treffer.richtung, 'genau');
});

/**
 * Das Register ist von Hand geführt. Ohne diese Probe wäre es die dritte
 * Zahlenquelle und die einzige ungeprüfte.
 */
test('das Register stimmt mit den Rechnungen überein', () => {
  const quelle = fileURLToPath(new URL('../../preise/poschacher-positionen.csv', import.meta.url));
  assert.equal(typeof existsSync(quelle), 'boolean');
  if (!existsSync(quelle)) return;

  const artikel = JSON.parse(readFileSync(
    fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8',
  )).artikel;
  const nachNummer = new Map(artikel.map((a) => [String(a.lieferantenArtikelnummer), a]));

  const zeilen = readFileSync(quelle, 'utf8').trim().split('\n');
  const kopf = zeilen[0].split(';');
  const feld = (f, n) => f[kopf.indexOf(n)];
  const rechnungen = new Map();
  for (const z of zeilen.slice(1)) {
    const f = z.split(';');
    const r = feld(f, 'Rechnung');
    if (!rechnungen.has(r)) rechnungen.set(r, []);
    rechnungen.get(r).push({ nr: feld(f, 'ArtNr'), bez: feld(f, 'Bezeichnung'), menge: Number(feld(f, 'Menge')) });
  }

  // Ohne diese Zusicherung prüfte die Schleife bei leerem Register nichts.
  assert.ok(HUBBELEGE.length >= 2, `nur ${HUBBELEGE.length} Belege im Register`);
  for (const b of HUBBELEGE) {
    const positionen = rechnungen.get(b.rechnung);
    assert.ok(positionen, `Rechnung ${b.rechnung} steht nicht in der Positionsdatei`);
    const summe = (muster) => positionen.filter((p) => muster.test(p.bez))
      .reduce((n, p) => n + p.menge, 0);
    assert.equal(summe(/Kranentladung/i), b.huebe, `${b.rechnung}: Hübe`);
    // Geliefert: alle positiven Palettenzeilen, ÖBB wie Einweg.
    // Gutgeschrieben: die negativen. Beide getrennt, weil ihre Summe je nach
    // Lesart drei verschiedene Zahlen ergibt — genau die Mehrdeutigkeit, die
    // dieser Beleg trägt.
    const palettenzeilen = positionen.filter((p) => /Palette/i.test(p.bez));
    assert.equal(palettenzeilen.filter((p) => p.menge > 0).reduce((n, p) => n + p.menge, 0),
      b.palettenGeliefert, `${b.rechnung}: gelieferte Paletten`);
    // `Math.abs`, nicht das Minuszeichen: Ohne Rückgabe entstünde `-0`, und das
    // ist für eine strenge Gleichheit nicht `0`.
    assert.equal(Math.abs(palettenzeilen.filter((p) => p.menge < 0).reduce((n, p) => n + p.menge, 0)),
      b.palettenGutgeschrieben, `${b.rechnung}: gutgeschriebene Paletten`);
    const sperrgut = positionen.filter((p) => nachNummer.get(p.nr)?.sperrgut).length;
    assert.equal(sperrgut, b.sperrgutPositionen, `${b.rechnung}: Sperrgut-Positionen`);
  }
});
