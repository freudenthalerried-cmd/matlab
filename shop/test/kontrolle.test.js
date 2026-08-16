import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { berechneBedarf } from '../src/bedarf.js';
import { erzeugeAngebot, erzeugeRechnung } from '../src/beleg.js';
import { erzeugeBestellungen } from '../src/bestellung.js';
import { baueAuftrag } from '../src/kunde.js';
import {
  leseBetrag,
  leseBeleg,
  leseBestellung,
  leseBestellCsv,
  pruefeBestellung,
  pruefeBelegRechnerisch,
  pruefeFrachtdeckung,
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

const auftrag = baueAuftrag('V-1', {
  firma: 'Bau Muster GmbH',
  uid: 'ATU12345675',
  email: 'office@muster.at',
  telefon: '+43 660 0',
  strasse: 'Baustellenweg 7',
  plz: '4600',
  ort: 'Wels',
  unternehmerBestaetigt: true,
}, {});

test('Jede Lieferantenbestellung führt genau das, was im Warenkorb steht', () => {
  const bestellungen = erzeugeBestellungen(referenz, auftrag);
  assert.equal(bestellungen.length, referenz.teillieferungen.length);
  assert.ok(bestellungen.length >= 2, 'sonst prüft die Schleife nur einen Lieferanten');

  for (const [i, b] of bestellungen.entries()) {
    const p = pruefeBestellung(b, referenz.teillieferungen[i]);
    assert.deepEqual(p.abweichungen, [], b.lieferantName);
  }
});

test('Text und CSV einer Bestellung führen dieselben Mengen', () => {
  const b = erzeugeBestellungen(referenz, auftrag)[0];
  const ausText = leseBestellung(b.text).positionen.map((p) => `${p.sku}×${p.menge}`).sort();
  const ausCsv = leseBestellCsv(b.csv).positionen.map((p) => `${p.sku}×${p.menge}`).sort();

  assert.ok(ausText.length > 0, 'keine Position im Text gelesen');
  assert.deepEqual(ausText, ausCsv);
});

test('Ein Zeilenumbruch in der Bezeichnung zerlegt die CSV nicht mehr', () => {
  // Genau dieser Fall hat die Bestell-CSV in zwei Zeilen zerlegt: Die zweite
  // wurde beim Zurücklesen zu einer Geisterposition mit unlesbarer Menge.
  const boese = {
    ...katalog,
    artikel: katalog.artikel.map((a, i) =>
      i === 0 ? { ...a, bezeichnung: 'Rohr DN100; halb\nzweite Zeile' } : a,
    ),
  };
  const wk = berechneWarenkorb([{ sku: boese.artikel[0].sku, menge: 3 }], boese);
  const b = erzeugeBestellungen(wk, auftrag)[0];

  assert.equal(b.csv.split('\n').length, 2, 'Kopfzeile plus genau eine Position');
  const p = pruefeBestellung(b, wk.teillieferungen[0]);
  assert.deepEqual(p.abweichungen, []);
});

test('Eine vertauschte Menge im Bestelltext fällt auf', () => {
  const b = erzeugeBestellungen(referenz, auftrag)[0];
  const gefaelscht = { ...b, text: b.text.replace(/^(\s+)(\d+)(\s+×)/m, '$199$3') };
  assert.notEqual(gefaelscht.text, b.text, 'die Fälschung muss greifen');

  const p = pruefeBestellung(gefaelscht, referenz.teillieferungen[0]);
  assert.equal(p.deckungsgleich, false);
  assert.ok(p.abweichungen.some((a) => /Text führt/.test(a)));
});

test('Eine fehlende Zeile in der CSV fällt auf', () => {
  const b = erzeugeBestellungen(referenz, auftrag)[0];
  const zeilen = b.csv.split('\n');
  assert.ok(zeilen.length >= 3, 'zu wenig Zeilen für diese Prüfung');
  const gefaelscht = { ...b, csv: [zeilen[0], ...zeilen.slice(2)].join('\n') };

  const p = pruefeBestellung(gefaelscht, referenz.teillieferungen[0]);
  assert.equal(p.deckungsgleich, false);
  assert.ok(p.abweichungen.some((a) => /CSV führt/.test(a)));
});

test('Ein verfälschter Einkaufswert im Bestelltext fällt auf', () => {
  const b = erzeugeBestellungen(referenz, auftrag)[0];
  const gefaelscht = { ...b, text: b.text.replace(/(Warenwert netto[^:]*:\s*)[\d.,]+ €/, '$11,00 €') };
  assert.notEqual(gefaelscht.text, b.text);

  const p = pruefeBestellung(gefaelscht, referenz.teillieferungen[0]);
  assert.ok(p.abweichungen.some((a) => /Einkaufswert im Text/.test(a)));
});

test('Ein leerer Text meldet fehlende Zeilen statt zu rechnen', () => {
  const p = pruefeBelegRechnerisch('');
  assert.equal(p.stimmig, false);
  assert.equal(p.fehler.length, 1);
  assert.match(p.fehler[0], /fehlen die Zeilen/);
});

/* ------------------------------------------------------------------ *
 * Trägt die Fracht sich selbst?
 *
 * Die Kette hat zwei Seiten: Was der Kunde für Fracht zahlt und was der
 * Lieferant dafür verlangt. Bis zu dieser Runde hat sie niemand gegeneinander
 * gehalten — und genau dort saß ein Fehler, der Geld gekostet hätte.
 * ------------------------------------------------------------------ */

const lieferantVon = (teil) => katalog.lieferantenById.get(teil.lieferantId);

test('Am Referenzgebäude deckt sich die Fracht auf jeder Teillieferung', () => {
  const bestellungen = erzeugeBestellungen(referenz, auftrag);
  assert.ok(bestellungen.length >= 2, 'Für diese Prüfung braucht es mehrere Lieferanten');

  for (let i = 0; i < bestellungen.length; i++) {
    const teil = referenz.teillieferungen[i];
    const d = pruefeFrachtdeckung(bestellungen[i], teil, lieferantVon(teil));
    assert.equal(d.gedeckt, true, `${teil.lieferantName}: ${d.grund}`);
    assert.equal(d.differenz, 0);
  }
});

test('Die Frachtdeckung meldet es, wenn dem Kunden zu wenig verrechnet wurde', () => {
  const bestellungen = erzeugeBestellungen(referenz, auftrag);
  const i = referenz.teillieferungen.findIndex((t) => t.frachtNetto > 0);
  assert.ok(i >= 0, 'Für diese Prüfung braucht es eine Teillieferung mit Fracht');

  const teil = referenz.teillieferungen[i];
  const ohneFracht = { ...teil, frachtNetto: 0 };
  const d = pruefeFrachtdeckung(bestellungen[i], ohneFracht, lieferantVon(teil));

  assert.equal(d.gedeckt, false);
  assert.equal(d.differenz, -teil.frachtNetto);
  assert.match(d.grund, /gehen aus der Marge/);
});

test('Die Frachtdeckung misst die Schwelle am Bestellwert, nicht am Verkaufswert', () => {
  const bestellungen = erzeugeBestellungen(referenz, auftrag);
  const i = referenz.teillieferungen.findIndex((t) => t.frachtNetto > 0);
  assert.ok(i >= 0);
  const teil = referenz.teillieferungen[i];
  const l = lieferantVon(teil);

  const d = pruefeFrachtdeckung(bestellungen[i], teil, l);
  assert.ok(d.bestellwert < l.fracht.freiHausAbNetto, 'Bestellwert liegt unter der Schwelle');
  assert.ok(d.frachtLieferant > 0, 'also verlangt der Lieferant Fracht');
  assert.equal(d.bestellwert, teil.einkaufNetto, 'gelesen wird der Einkaufswert, nicht der Verkaufswert');
});

test('Ohne Warenwert im Bestelltext urteilt die Frachtdeckung nicht', () => {
  const bestellungen = erzeugeBestellungen(referenz, auftrag);
  const teil = referenz.teillieferungen[0];
  const ohne = { ...bestellungen[0], text: 'Bestellung ohne Wertangabe' };

  const d = pruefeFrachtdeckung(ohne, teil, lieferantVon(teil));
  assert.equal(d.gedeckt, false);
  assert.equal(d.bestellwert, null);
  assert.match(d.grund, /kein Warenwert/);
});
