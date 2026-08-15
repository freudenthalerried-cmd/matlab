import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUFBEWAHRUNG_JAHRE,
  neueAblage,
  naechsteNummer,
  haltefest,
  stelleRechnungAus,
  storniere,
  vorgangsakte,
  pruefeNummernkreis,
  aufbewahrungBis,
  alsCsv,
} from '../src/ablage.js';

const vollstaendig = {
  vollstaendig: true,
  fehlend: [],
  nettobetrag: 3250.17,
  bruttobetrag: 3900.2,
  text: 'Rechnung … Gesamtbetrag 3.900,20 €',
};

const unvollstaendig = {
  vollstaendig: false,
  fehlend: ['UID-Nummer des Ausstellers'],
  nettobetrag: 3250.17,
  bruttobetrag: 3900.2,
};

test('Nummern laufen je Art und Jahr getrennt', () => {
  const a = neueAblage();
  assert.equal(naechsteNummer(a, 'rechnung', 2026), 'RE-2026-0001');
  assert.equal(naechsteNummer(a, 'rechnung', 2026), 'RE-2026-0002');
  assert.equal(naechsteNummer(a, 'angebot', 2026), 'AN-2026-0001');
  assert.equal(naechsteNummer(a, 'rechnung', 2027), 'RE-2027-0001');
});

test('Über den Jahreswechsel bleibt jede Nummer einmalig', () => {
  const a = neueAblage();
  const alle = new Set();
  for (const jahr of [2026, 2027]) {
    for (let i = 0; i < 3; i++) alle.add(naechsteNummer(a, 'rechnung', jahr));
  }
  assert.equal(alle.size, 6, 'der Zähler beginnt neu, die Jahreszahl hält sie auseinander');
});

test('Ein Bestand lässt sich fortschreiben', () => {
  const a = neueAblage({ zaehler: { 'rechnung:2026': 41 } });
  assert.equal(naechsteNummer(a, 'rechnung', 2026), 'RE-2026-0042');
});

test('Arten ohne Nummernkreis bekommen keine Nummer', () => {
  const a = neueAblage();
  assert.throws(() => naechsteNummer(a, 'uidabfrage', 2026), /führt keinen Nummernkreis/);
  assert.throws(() => naechsteNummer(a, 'erfunden', 2026), /Unbekannte Vorgangsart/);
});

test('Eine unvollständige Rechnung verbraucht keine Nummer', () => {
  const a = neueAblage();
  const versuch = stelleRechnungAus(a, unvollstaendig, { zeitpunkt: '2026-08-15', jahr: 2026, vorgang: 'V-1' });

  assert.equal(versuch.ausgestellt, false);
  assert.match(versuch.grund, /keine Nummer vergeben/);
  assert.equal(a.eintraege.length, 0);
  assert.equal(naechsteNummer(a, 'rechnung', 2026), 'RE-2026-0001', 'die Eins ist noch frei');
});

test('Die Nummer entsteht erst mit der Ausstellung', () => {
  const a = neueAblage();
  // Ein Angebot vorweg — es darf den Rechnungskreis nicht anfassen.
  haltefest(a, { art: 'angebot', nummer: naechsteNummer(a, 'angebot', 2026), zeitpunkt: '2026-08-14', vorgang: 'V-1' });
  assert.equal(a.zaehler['rechnung:2026'], undefined);

  const r = stelleRechnungAus(a, vollstaendig, { zeitpunkt: '2026-08-15', jahr: 2026, vorgang: 'V-1' });
  assert.equal(r.ausgestellt, true);
  assert.equal(r.nummer, 'RE-2026-0001');
});

test('Was in der Ablage steht, ändert sich nicht mehr', () => {
  const a = neueAblage();
  const e = haltefest(a, { art: 'vermerk', zeitpunkt: '2026-08-15', text: 'ursprünglich' });

  assert.throws(() => {
    'use strict';
    e.text = 'geändert';
  }, TypeError);
  assert.equal(a.eintraege[0].text, 'ursprünglich');
});

test('Jeder Eintrag braucht einen Zeitpunkt', () => {
  const a = neueAblage();
  assert.throws(() => haltefest(a, { art: 'vermerk' }), /braucht einen Zeitpunkt/);
});

test('Ein Storno ändert die Rechnung nicht, sondern stellt eine Gutschrift daneben', () => {
  const a = neueAblage();
  const r = stelleRechnungAus(a, vollstaendig, { zeitpunkt: '2026-08-15', jahr: 2026, vorgang: 'V-1' });

  const g = storniere(a, r.nummer, { grund: 'Lieferung storniert', zeitpunkt: '2026-08-20', jahr: 2026 });

  assert.equal(g.nummer, 'GS-2026-0001');
  assert.equal(g.bezugAuf, 'RE-2026-0001');
  assert.equal(g.betragBrutto, -3900.2);
  assert.equal(a.eintraege[0].text, vollstaendig.text, 'die Rechnung bleibt, wie sie war');
  assert.equal(a.eintraege.length, 2);
});

test('Eine stornierte Nummer wird nicht wiederverwendet', () => {
  const a = neueAblage();
  const r = stelleRechnungAus(a, vollstaendig, { zeitpunkt: '2026-08-15', jahr: 2026, vorgang: 'V-1' });
  storniere(a, r.nummer, { grund: 'Irrtum', zeitpunkt: '2026-08-16', jahr: 2026 });

  const zweite = stelleRechnungAus(a, vollstaendig, { zeitpunkt: '2026-08-17', jahr: 2026, vorgang: 'V-2' });
  assert.equal(zweite.nummer, 'RE-2026-0002');
});

test('Zweimal stornieren geht nicht', () => {
  const a = neueAblage();
  const r = stelleRechnungAus(a, vollstaendig, { zeitpunkt: '2026-08-15', jahr: 2026, vorgang: 'V-1' });
  storniere(a, r.nummer, { grund: 'Irrtum', zeitpunkt: '2026-08-16', jahr: 2026 });

  assert.throws(
    () => storniere(a, r.nummer, { grund: 'nochmal', zeitpunkt: '2026-08-17', jahr: 2026 }),
    /bereits storniert/,
  );
});

test('Eine unbekannte Nummer lässt sich nicht stornieren', () => {
  const a = neueAblage();
  assert.throws(() => storniere(a, 'RE-2026-9999', { grund: 'x', zeitpunkt: '2026-08-15', jahr: 2026 }), /Kein Eintrag/);
});

test('Der Nummernkreis meldet Lücken, statt sie zu bewerten', () => {
  const a = neueAblage();
  stelleRechnungAus(a, vollstaendig, { zeitpunkt: '2026-08-15', jahr: 2026, vorgang: 'V-1' });
  assert.equal(pruefeNummernkreis(a, 'rechnung', 2026).lueckenlos, true);

  // Eine Nummer ziehen, ohne den Beleg abzulegen — genau der Fall, der nicht
  // passieren darf und den die Prüfung deshalb finden muss.
  naechsteNummer(a, 'rechnung', 2026);
  const p = pruefeNummernkreis(a, 'rechnung', 2026);
  assert.equal(p.lueckenlos, false);
  assert.deepEqual(p.fehlend, ['RE-2026-0002']);
  assert.equal(p.hoechste, 2);
  assert.equal(p.anzahl, 1);
});

test('Die Vorgangsakte sammelt alles zu einem Auftrag in seiner Reihenfolge', () => {
  const a = neueAblage();
  haltefest(a, { art: 'uidabfrage', zeitpunkt: '2026-08-15T09:00', vorgang: 'V-1', text: 'UID ATU… gueltig' });
  haltefest(a, { art: 'angebot', nummer: naechsteNummer(a, 'angebot', 2026), zeitpunkt: '2026-08-15T09:05', vorgang: 'V-1' });
  haltefest(a, { art: 'vermerk', zeitpunkt: '2026-08-15T09:10', vorgang: 'V-2', text: 'anderer Vorgang' });
  stelleRechnungAus(a, vollstaendig, { zeitpunkt: '2026-08-22', jahr: 2026, vorgang: 'V-1' });

  const akte = vorgangsakte(a, 'V-1');
  assert.deepEqual(akte.map((e) => e.art), ['uidabfrage', 'angebot', 'rechnung']);
  assert.deepEqual(akte.map((e) => e.lfd), [1, 2, 4]);
});

test('Die Aufbewahrungsfrist endet sieben Jahre nach dem Kalenderjahr', () => {
  assert.equal(AUFBEWAHRUNG_JAHRE, 7);
  assert.equal(aufbewahrungBis(2026).jahr, 2033);
  assert.match(aufbewahrungBis(2026).hinweis, /31\.12\.2033.*§ 132 BAO/);
  assert.throws(() => aufbewahrungBis('2026'), /braucht ein Jahr/);
});

test('Das Journal geht als CSV hinaus, Semikolon und Umbruch entschärft', () => {
  const a = neueAblage();
  haltefest(a, { art: 'vermerk', zeitpunkt: '2026-08-15', text: 'mit;Semikolon\nund Umbruch' });
  const csv = alsCsv(a);

  const zeilen = csv.split('\n');
  assert.equal(zeilen.length, 2, 'der Umbruch im Text darf keine zweite Zeile erzeugen');
  assert.match(zeilen[0], /^lfd;art;nummer/);
  assert.match(zeilen[1], /mit,Semikolon und Umbruch/);
});
