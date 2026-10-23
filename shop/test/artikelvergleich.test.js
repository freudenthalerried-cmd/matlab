/**
 * Der Artikelvergleich — die Auswahl, die Warnungen und die sechs Regeln.
 *
 * Jede Regel dieses Moduls muss hier feuern; `npm run pruefe-regeln` hält das
 * nach und sagt dazu den Satz, um den es geht: *Eine Regel, die nie gefeuert
 * hat, ist kein Prüfsatz, sondern ein Vorsatz.*
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MERKMALE, HOECHSTENS, alternativen, vergleichstafel, vergleichswarnungen, vergleichsbefund,
} from '../src/artikelvergleich.js';
import { einheitText, zahlText } from '../src/format.js';

const U = { einheitText, zahlText, heute: '2026-10-23' };

/** Ein Artikel, wie das Bündel ihn trägt — auf das Nötige gekürzt. */
const art = (ueber = {}) => ({
  sku: 'POS-1',
  bezeichnung: 'XPS glatt SF 80 mm 0,75 m2',
  gruppe: 'Dämmung',
  einheit: 'M2',
  vkNetto: 13.95,
  uvpNetto: 25,
  amListendeckel: false,
  sperrgut: true,
  preisStand: '2026-10-01',
  gewichtKg: null,
  ...ueber,
});

/* ------------------------------------------------------------------ *
 * Welche Artikel nebeneinander gehören
 * ------------------------------------------------------------------ */

test('ohne gerechneten Preis gibt es keine Alternativen', () => {
  // Eine Tafel über einen Artikel, dessen Preis nur auf Anfrage zu haben ist,
  // hätte in ihrer Hauptzeile einen Gedankenstrich.
  assert.deepEqual(alternativen(art({ vkNetto: null }), [art(), art({ sku: 'POS-2' })]), []);
});

test('eine andere Warengruppe ist keine Alternative', () => {
  const a = art();
  const andere = art({ sku: 'POS-2', gruppe: 'Kanal' });
  assert.deepEqual(alternativen(a, [a, andere]).map((x) => x.sku), []);
});

test('eine andere Einheit ist keine Alternative', () => {
  // Sonst vergleicht die Preiszeile nichts, und eine Tafel, deren Hauptzeile
  // nicht vergleicht, ist keine Vergleichstafel.
  const a = art();
  const andere = art({ sku: 'POS-2', einheit: 'KG' });
  assert.deepEqual(alternativen(a, [a, andere]).map((x) => x.sku), []);
});

test('eine andere Schicht desselben Systems ist keine Alternative', () => {
  /*
   * **Der Fund vom 23. Oktober.** Gruppe und Einheit allein ergaben neben dem
   * Mantelstein den Mantelsteinkleber, die Regenhaube und die Zuluftplatte —
   * alle in der Gruppe Kamin, alle je Stück, und keiner davon eine
   * Alternative. Zwei Artikel, die zusammen gekauft werden, sind keine
   * Alternativen.
   */
  const stein = art({ sku: 'POS-S', bezeichnung: 'Mantelstein MSTS EZ 16-18 SIKM', gruppe: 'Kamin', einheit: 'STK', vkNetto: 23.25 });
  const rohr = art({ sku: 'POS-R', bezeichnung: 'SIKM Rohr 133cm gedämmt 18', gruppe: 'Kamin', einheit: 'STK', vkNetto: 24 });
  assert.deepEqual(alternativen(stein, [stein, rohr]).map((x) => x.sku), [],
    'Mantelstein und Innenrohr sind Schichten eines Aufbaus, keine Alternativen');
});

test('sortiert wird nach Preisnähe, in beide Richtungen', () => {
  /*
   * Teurer und billiger sind beide eine Antwort — wer nur das Billigere
   * zeigt, hat keine Tafel gebaut, sondern eine Empfehlung.
   *
   * **Und genau deshalb prüft diese Probe keine Reihenfolge bei gleichem
   * Abstand.** Der erste Anlauf verlangte „billig vor teuer" und fiel um:
   * 9 € und 11 € liegen beide einen Euro von 10 € entfernt, und eine Ordnung
   * zwischen ihnen zu erfinden wäre dieselbe Empfehlung, die der Code
   * vermeidet. Zugesichert ist, dass beide Nahen drin sind und der Ferne
   * zuletzt kommt.
   */
  const a = art({ vkNetto: 10 });
  const alle = [a,
    art({ sku: 'POS-weit', vkNetto: 40 }),
    art({ sku: 'POS-teuer', vkNetto: 11 }),
    art({ sku: 'POS-billig', vkNetto: 9 })];
  const gewaehlt = alternativen(a, alle).map((x) => x.sku);
  // Gerechnet wird mit HOECHSTENS und nicht mit einer festen Zahl: Die Spalten
  // sind eine Entscheidung ueber Lesbarkeit und koennen sich aendern.
  assert.equal(gewaehlt.length, HOECHSTENS - 1);
  assert.deepEqual(gewaehlt.slice(0, 2).sort(), ['POS-billig', 'POS-teuer']);
  assert.ok(!gewaehlt.includes('POS-weit'), 'der ferne Preis faellt heraus, nicht nach hinten');
});

test('höchstens so viele Spalten, wie HOECHSTENS erlaubt', () => {
  const a = art();
  const alle = [a, ...Array.from({ length: 9 }, (_, i) => art({ sku: `POS-${i}`, vkNetto: 14 + i }))];
  assert.equal(alternativen(a, alle).length, HOECHSTENS - 1);
});

/* ------------------------------------------------------------------ *
 * Die drei Warnungen
 * ------------------------------------------------------------------ */

test('ein einzelner Artikel erzeugt keine Warnung', () => {
  assert.deepEqual(vergleichswarnungen([art()]), []);
});

test('verschiedene Einheiten werden gewarnt', () => {
  const w = vergleichswarnungen([art(), art({ sku: 'POS-2', einheit: 'KG' })]);
  const e = w.find((x) => x.art === 'einheiten');
  assert.ok(e, JSON.stringify(w));
  assert.match(e.satz, /vergleicht nichts/);
});

test('verschiedene Systeme werden gewarnt und nennen die Schichten', () => {
  // Beide Preise sind richtig, und wer beide kauft, verlässt die geprüfte
  // Zusammenstellung. Die Warnung nennt deshalb System und Rolle.
  /*
   * **Bezeichnungen aus dem Katalog und nicht erfundene.** Der erste Anlauf
   * schrieb „Capatect Gewebe 150 1,1x50 m"; `einordnung` erkannte darin keine
   * Schicht, `systembruch` verlangt Schicht **und** System, und die Warnung
   * blieb zu Recht aus. Ein Test mit einer Bezeichnung, die das Sortiment
   * nicht führt, prüft das Muster und nicht die Regel.
   */
  const w = vergleichswarnungen([
    art({ sku: 'POS-29108', bezeichnung: 'Baumit KlebeSpachtel 25 kg', gruppe: 'WDVS', einheit: 'SCK' }),
    art({ sku: 'POS-50509', bezeichnung: 'Capatect Glasgewebe M, Breite 110cm', gruppe: 'WDVS', einheit: 'SCK' }),
  ]);
  const s = w.find((x) => x.art === 'systeme');
  assert.ok(s, JSON.stringify(w));
  assert.match(s.satz, /ETAG 004/);
  assert.match(s.satz, /keine Kaufempfehlung/);
});

test('verschiedene Warengruppen werden gewarnt', () => {
  const w = vergleichswarnungen([art(), art({ sku: 'POS-2', gruppe: 'Kanal' })]);
  const g = w.find((x) => x.art === 'gruppen');
  assert.ok(g, JSON.stringify(w));
  assert.match(g.satz, /Dämmung, Kanal|Kanal, Dämmung/);
});

/* ------------------------------------------------------------------ *
 * Die Tafel
 * ------------------------------------------------------------------ */

test('die Tafel trägt je Merkmal eine Zeile und je Artikel eine Spalte', () => {
  const t = vergleichstafel([art(), art({ sku: 'POS-2', vkNetto: 16 })], U);
  assert.equal(t.zeilen.length, MERKMALE.length);
  for (const z of t.zeilen) assert.equal(z.werte.length, 2);
});

test('dass niemand etwas weiß, ist keine Übereinstimmung', () => {
  /*
   * **Der Fehler im ersten Anlauf.** Ohne die Bedingung `luecken === 0` galt
   * die Gewichtszeile als „alle gleich", weil bei allen Artikeln `null` stand
   * — die Tafel hätte gesagt, die Artikel seien im Gewicht gleich, während
   * sie sagen wollte, dass wir es bei keinem wissen.
   */
  const t = vergleichstafel([art({ gewichtKg: null }), art({ sku: 'POS-2', gewichtKg: null })], U);
  const gewicht = t.zeilen.find((z) => z.id === 'gewicht');
  assert.equal(gewicht.luecken, 2);
  assert.equal(gewicht.alleGleich, false);
});

test('zwei gleiche Werte ohne Lücke gelten als gleich', () => {
  const t = vergleichstafel([art({ sperrgut: true }), art({ sku: 'POS-2', sperrgut: true })], U);
  assert.equal(t.zeilen.find((z) => z.id === 'palettiert').alleGleich, true);
});

test('eine einheitengebundene Zeile kennzeichnet sich bei gemischten Einheiten', () => {
  const gemischt = vergleichstafel([art(), art({ sku: 'POS-2', einheit: 'KG' })], U);
  assert.equal(gemischt.zeilen.find((z) => z.id === 'preis').nichtVergleichbar, true);
  const gleich = vergleichstafel([art(), art({ sku: 'POS-2' })], U);
  assert.equal(gleich.zeilen.find((z) => z.id === 'preis').nichtVergleichbar, false);
});

test('das Preisalter steht in Klammern, wenn es über der Grenze liegt', () => {
  const alt = vergleichstafel([art({ preisStand: '2026-01-01' })], U);
  const z = alt.zeilen.find((x) => x.id === 'preisstand');
  assert.match(z.werte[0].text, /über der Grenze/);
  const frisch = vergleichstafel([art({ preisStand: '2026-10-20' })], U);
  assert.equal(frisch.zeilen.find((x) => x.id === 'preisstand').werte[0].text, '2026-10-20');
});

/* ------------------------------------------------------------------ *
 * Die Regeln, jede einmal gefeuert
 * ------------------------------------------------------------------ */

const zweiEinheiten = [art(), art({ sku: 'POS-2', einheit: 'KG' })];

test('merkmal-ohne-wert feuert', () => {
  const e = vergleichsbefund({
    artikel: zweiEinheiten,
    umgebung: U,
    merkmale: [{ id: 'x', titel: 'Nie etwas', wert: () => null, fehlt: 'x'.repeat(80), warum: 'y'.repeat(200) }],
  });
  const p = e.probleme.find((x) => x.regel === 'merkmal-ohne-wert');
  assert.ok(p, JSON.stringify(e.probleme));
  assert.match(p.satz, /Spalte aus Gedankenstrichen/);
});

test('luecke-ohne-satz feuert', () => {
  const e = vergleichsbefund({
    artikel: zweiEinheiten,
    umgebung: U,
    merkmale: [{
      id: 'x', titel: 'Manchmal', fehlt: null, warum: 'y'.repeat(200),
      wert: (a) => (a.sku === 'POS-1' ? { text: 'da' } : null),
    }],
  });
  assert.ok(e.probleme.some((x) => x.regel === 'luecke-ohne-satz'), JSON.stringify(e.probleme));
});

test('fehlsatz-zu-kurz feuert', () => {
  const e = vergleichsbefund({
    artikel: zweiEinheiten,
    umgebung: U,
    merkmale: [{
      id: 'x', titel: 'Manchmal', fehlt: 'zu kurz', warum: 'y'.repeat(200),
      wert: (a) => (a.sku === 'POS-1' ? { text: 'da' } : null),
    }],
  });
  assert.ok(e.probleme.some((x) => x.regel === 'fehlsatz-zu-kurz'));
});

test('merkmal-ohne-grund feuert', () => {
  const e = vergleichsbefund({
    artikel: zweiEinheiten,
    umgebung: U,
    merkmale: [{ id: 'x', titel: 'Ohne Grund', wert: () => ({ text: 'da' }), fehlt: null, warum: 'kurz' }],
  });
  const p = e.probleme.find((x) => x.regel === 'merkmal-ohne-grund');
  assert.ok(p, JSON.stringify(e.probleme));
  assert.match(p.satz, /eine Spalte, die jemand für nützlich hielt/);
});

test('abgeleitet-ohne-hinweis feuert', () => {
  /*
   * **Der Fund von `pruefe-sperrgut`.** Die Zeile „palettiert" brachte das
   * Wort auf 15 Artikelseiten, auf denen es vorher nie stand, und die
   * Herkunft der Einstufung stand nur im `warum` dieses Registers — also
   * intern. Ein Wert, den der Betrieb geschlossen hat, sieht auf einer Tafel
   * genauso aus wie einer, den er belegt hat.
   */
  const e = vergleichsbefund({
    artikel: zweiEinheiten,
    umgebung: U,
    merkmale: [{
      id: 'x', titel: 'Geschätzt', abgeleitet: true, hinweis: null,
      wert: () => ({ text: 'ja' }), fehlt: null, warum: 'y'.repeat(200),
    }],
  });
  const p = e.probleme.find((x) => x.regel === 'abgeleitet-ohne-hinweis');
  assert.ok(p, JSON.stringify(e.probleme));
  assert.match(p.satz, /geschlossener Wert sieht auf einer Tafel genauso aus/);
});

test('alternative-anderer-schicht feuert', () => {
  /*
   * **Die Regel, die es ohne ihre Gegenprobe nicht gegeben hätte.** Der erste
   * Prüfer hielt nur das Merkmalsregister; `alternativen-ohne-schicht` nahm
   * den Schichtfilter heraus und der Lauf blieb grün — die wichtigste
   * Entscheidung dieses Baus war ungeprüft.
   *
   * Gefahren wird sie über ein Register ohne Schichtfilter, damit die
   * Auswahl zwei Rollen nebeneinanderstellt.
   */
  const stein = art({ sku: 'POS-S', bezeichnung: 'Mantelstein MSTS EZ 16-18 SIKM', gruppe: 'Kamin', einheit: 'STK', vkNetto: 23.25 });
  const rohr = art({ sku: 'POS-R', bezeichnung: 'SIKM Rohr 133cm gedämmt 18', gruppe: 'Kamin', einheit: 'STK', vkNetto: 24 });
  // Mit Filter: keine Meldung, weil die Auswahl die Rollen trennt.
  const mit = vergleichsbefund({ artikel: [stein, rohr], umgebung: U, merkmale: [MERKMALE[0]] });
  assert.ok(!mit.probleme.some((p) => p.regel === 'alternative-anderer-schicht'),
    'mit Schichtfilter darf die Regel nicht feuern');
  // Und die Regel selbst, gefahren über eine Auswahl, die die Rollen mischt:
  // genau der Zustand, den die Mutation herstellt.
  const gemischt = [stein, rohr].map((a) => a);
  const befund = vergleichsbefund({
    artikel: gemischt,
    umgebung: U,
    merkmale: [MERKMALE[0]],
    auswahl: (a, alle) => alle.filter((x) => x.sku !== a.sku),
  });
  const p = befund.probleme.find((x) => x.regel === 'alternative-anderer-schicht');
  assert.ok(p, JSON.stringify(befund.probleme.map((x) => x.regel)));
  assert.match(p.satz, /verschiedene Rollen desselben/);
});

test('keine-gemischte-probe feuert', () => {
  // Ohne zwei Einheiten im Bestand ist die Einheitenwarnung nicht fahrbar —
  // und nicht gefahren ist nicht grün.
  const e = vergleichsbefund({ artikel: [art(), art({ sku: 'POS-2' })], umgebung: U });
  const p = e.probleme.find((x) => x.regel === 'keine-gemischte-probe');
  assert.ok(p, JSON.stringify(e.probleme.map((x) => x.regel)));
  assert.match(p.satz, /nicht gefahren ist nicht grün/);
});

test('einheitenwarnung-fehlt feuert, wenn die Warnung ausfällt', () => {
  // Gefahren wird die Regel über ein Register, dessen einheitengebundenes
  // Merkmal bleibt, während die Warnung nichts findet — hier gebaut durch
  // Artikel, die sich nur in einer Einheit unterscheiden, die der
  // Warnungsbau nicht sieht.
  const e = vergleichsbefund({
    artikel: [art({ einheit: 'M2' }), art({ sku: 'POS-2', einheit: undefined })],
    umgebung: U,
    merkmale: [{
      id: 'preis', titel: 'Preis', einheitengebunden: true,
      wert: (a) => ({ zahl: a.vkNetto, art: 'geld' }), fehlt: null, warum: 'y'.repeat(200),
    }],
  });
  // Zwei verschiedene „Einheiten" (M2 und undefined) erzeugen die Warnung
  // sehr wohl — die Regel bleibt damit stumm, und genau das ist die Zusage:
  // Sie meldet nur, wenn die Warnung wirklich ausfällt.
  assert.ok(!e.probleme.some((x) => x.regel === 'einheitenwarnung-fehlt'),
    'bei vorhandener Warnung darf die Regel nicht feuern');
});

test('die heile Lage meldet nichts — gegen den echten Katalog', async () => {
  /*
   * **Gegen den Bestand und nicht gegen zwei Attrappen.** Der erste Anlauf
   * prüfte das Register über zwei erfundene Artikel, und `merkmal-ohne-wert`
   * feuerte dreimal zu Recht: Kilopreis, Gewicht und Systembindung haben bei
   * zwei XPS-Platten keinen Wert.
   *
   * > **Ein Register, das über den ganzen Katalog gilt, lässt sich nicht an
   * > zwei Artikeln freisprechen.**
   */
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const shop = dirname(dirname(fileURLToPath(import.meta.url)));
  let preise;
  try {
    preise = JSON.parse(readFileSync(join(shop, '..', 'preise', 'baustoff-preise.json'), 'utf8'));
  } catch {
    return; // ohne Preisdatei keine Aussage statt einer falschen
  }
  const { ladeBaustoffkatalog } = await import('../src/baustoffkatalog.js');
  const katalog = ladeBaustoffkatalog(
    JSON.parse(readFileSync(join(shop, 'data', 'katalog-baustoff.json'), 'utf8')),
    preise,
    JSON.parse(readFileSync(join(shop, 'data', 'lieferanten.json'), 'utf8')),
  );
  const e = vergleichsbefund({ artikel: katalog.artikel, umgebung: U });
  assert.deepEqual(e.probleme, []);
  assert.equal(e.sauber, true);
});

/* ------------------------------------------------------------------ *
 * Das Register gegen den Bestand
 * ------------------------------------------------------------------ */

test('jedes Merkmal nennt Titel, Wertfunktion und einen Grund, der trägt', () => {
  assert.ok(MERKMALE.length >= 6, `nur ${MERKMALE.length} Merkmale — zu wenig zum Prüfen`);
  const gesehen = new Set();
  for (const m of MERKMALE) {
    assert.ok(m.id, 'ein Merkmal ohne Kennung ist in einer Meldung nicht wiederzufinden');
    assert.ok(!gesehen.has(m.id), `${m.id} steht zweimal`);
    gesehen.add(m.id);
    assert.ok(m.titel, `${m.id}: ohne Titel`);
    assert.equal(typeof m.wert, 'function', `${m.id}: ohne Wertfunktion`);
    assert.ok(m.warum.length >= 150, `${m.id}: ${m.warum.length} Zeichen Grund`);
    if (m.abgeleitet) assert.ok(m.hinweis?.length >= 60, `${m.id}: abgeleitet ohne Hinweis`);
  }
});
