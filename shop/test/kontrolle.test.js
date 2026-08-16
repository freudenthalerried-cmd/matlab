import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { berechneBedarf } from '../src/bedarf.js';
import { erzeugeAngebot, erzeugeRechnung } from '../src/beleg.js';
import {
  leseBetrag,
  leseBeleg,
  pruefeBelegRechnerisch,
  pruefeBruttoUnabhaengig,
  vergleicheMitWarenkorb,
} from '../src/kontrolle.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);

const referenz = berechneWarenkorb(
  berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4, mitDrainage: true }, katalog).warenkorbzeilen,
  katalog,
);

const kunde = { firma: 'Bau Muster GmbH', strasse: 'Baustellenweg 7', plz: '4600', ort: 'Wels', uid: 'ATU12345675' };
const betreiber = { firma: 'Musterfirma GmbH, Musterweg 1, 4600 Wels', uid: 'ATU12345675' };

const angebot = erzeugeAngebot(referenz, { nummer: 'AN-1', datum: '15.08.2026', kunde, betreiber });
const rechnung = erzeugeRechnung(referenz, {
  nummer: 'RE-1',
  datum: '15.08.2026',
  lieferdatum: '22.08.2026',
  kunde,
  betreiber,
});

test('Beträge in österreichischer Schreibweise werden richtig gelesen', () => {
  assert.equal(leseBetrag('3.900,20 €'), 3900.2);
  assert.equal(leseBetrag('  Fracht Muster: 162,00 € (Pauschale)'), 162);
  assert.equal(leseBetrag('1.234.567,89 €'), 1234567.89);
  assert.equal(leseBetrag('-54,85 €'), -54.85);
  assert.equal(leseBetrag('kein Betrag'), null);
  assert.equal(leseBetrag(null), null);
});

test('Der Belegtext gibt alle Summenzeilen her', () => {
  const b = leseBeleg(rechnung.text);
  for (const k of ['warenwertNetto', 'frachtNetto', 'summeNetto', 'ust', 'summeBrutto']) {
    assert.equal(typeof b[k], 'number', `${k} nicht gelesen`);
  }
  assert.ok(b.zeilensummen.length > 0, 'keine Position gelesen');
  assert.ok(b.frachten.length > 0, 'keine Frachtzeile gelesen');
});

test('Die Rechnung geht in sich auf — nachgerechnet aus ihrem eigenen Text', () => {
  const p = pruefeBelegRechnerisch(rechnung.text);
  assert.deepEqual(p.fehler, []);
  assert.equal(p.stimmig, true);
});

test('Das Angebot geht ebenso auf', () => {
  const p = pruefeBelegRechnerisch(angebot.text);
  assert.deepEqual(p.fehler, []);
  assert.equal(p.stimmig, true);
});

test('Text und Warenkorb stimmen auf den Cent überein', () => {
  const v = vergleicheMitWarenkorb(rechnung.text, referenz);
  assert.deepEqual(v.abweichungen, []);
  assert.equal(v.deckungsgleich, true);
});

test('Jede Position des Warenkorbs steht auch im Text', () => {
  const gerechnet = referenz.teillieferungen.reduce((s, t) => s + t.positionen.length, 0);
  assert.ok(gerechnet >= 5, `nur ${gerechnet} Positionen — die Prüfung wäre zu schwach`);
  assert.equal(leseBeleg(rechnung.text).zeilensummen.length, gerechnet);
});

test('Ein fehlender Betrag im Text wird gemeldet, nicht ergänzt', () => {
  const verstuemmelt = rechnung.text.split('\n').filter((z) => !/^Umsatzsteuer/.test(z)).join('\n');
  const p = pruefeBelegRechnerisch(verstuemmelt);

  assert.equal(p.stimmig, false);
  assert.ok(p.fehler.some((f) => /fehlen die Zeilen: ust/.test(f)), p.fehler.join(' | '));
});

test('Ein verfälschter Gesamtbetrag fällt auf', () => {
  const gefaelscht = rechnung.text.replace(/^(Gesamtbetrag\s+)[\d.,]+ €/m, '$19.999,99 €');
  assert.notEqual(gefaelscht, rechnung.text, 'die Fälschung muss greifen');

  const p = pruefeBelegRechnerisch(gefaelscht);
  assert.equal(p.stimmig, false);
  assert.ok(p.fehler.some((f) => /Netto plus Steuer/.test(f)));
});

test('Eine unterschlagene Position fällt auf', () => {
  const zeilen = rechnung.text.split('\n');
  const ersteAZeile = zeilen.findIndex((z) => /à\s/.test(z));
  assert.ok(ersteAZeile > 0, 'keine Positionszeile gefunden');
  zeilen.splice(ersteAZeile, 1);

  const p = pruefeBelegRechnerisch(zeilen.join('\n'));
  assert.equal(p.stimmig, false);
  assert.ok(p.fehler.some((f) => /Positionen ergeben/.test(f)));
});

test('Eine falsch gerundete Umsatzsteuer fällt auf', () => {
  const gefaelscht = rechnung.text.replace(/^(Umsatzsteuer 20 %\s+)[\d.,]+ €/m, '$1650,00 €');
  assert.notEqual(gefaelscht, rechnung.text);

  const p = pruefeBelegRechnerisch(gefaelscht);
  assert.equal(p.stimmig, false);
  assert.ok(p.fehler.some((f) => /20 % von/.test(f)));
});

test('Ein Text, der in sich stimmt, aber vom Warenkorb abweicht, fällt erst im Vergleich auf', () => {
  // Alle Beträge verzehnfacht: die inneren Gleichungen halten, die Zahlen sind falsch.
  const anderer = berechneWarenkorb([{ sku: katalog.artikel[0].sku, menge: 1 }], katalog);
  const fremdeRechnung = erzeugeRechnung(anderer, {
    nummer: 'RE-2',
    datum: '15.08.2026',
    lieferdatum: '22.08.2026',
    kunde,
    betreiber,
  });

  assert.equal(pruefeBelegRechnerisch(fremdeRechnung.text).stimmig, true, 'in sich stimmig');
  const v = vergleicheMitWarenkorb(fremdeRechnung.text, referenz);
  assert.equal(v.deckungsgleich, false, 'gegen den falschen Warenkorb geprüft muss es auffallen');
  assert.ok(v.abweichungen.some((a) => /Gesamtbetrag/.test(a)));
});

test('Brutto über die Steuer und Brutto direkt ergeben dasselbe', () => {
  const p = pruefeBruttoUnabhaengig(referenz);
  assert.equal(p.stimmig, true, `${p.ueberSteuer} gegen ${p.direkt}`);
  assert.equal(p.abweichung, 0);
});

test('Über viele Warenkörbe hinweg bleiben beide Wege deckungsgleich', () => {
  // Die einzige Prüfung im Bestand, die nicht dieselbe Arithmetik benutzt, die
  // sie prüft: netto + gerundete USt gegen netto × 1,2. Deshalb über viele
  // Mengen, nicht nur über den Referenzkorb.
  let geprueft = 0;
  for (let i = 0; i < katalog.artikel.length; i++) {
    for (let menge = 1; menge <= 25; menge++) {
      const wk = berechneWarenkorb([{ sku: katalog.artikel[i].sku, menge }], katalog);
      assert.equal(pruefeBruttoUnabhaengig(wk).stimmig, true, `${katalog.artikel[i].sku} × ${menge}`);
      geprueft++;
    }
  }
  assert.ok(geprueft >= 200, `nur ${geprueft} Warenkörbe geprüft`);
});

test('Ein leerer Text meldet fehlende Zeilen statt zu rechnen', () => {
  const p = pruefeBelegRechnerisch('');
  assert.equal(p.stimmig, false);
  assert.equal(p.fehler.length, 1);
  assert.match(p.fehler[0], /fehlen die Zeilen/);
});
