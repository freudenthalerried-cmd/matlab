import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  wortstaemme, baueSuchindex, suche, sortiere, filtere, filterwerte, vorteil,
  ladeKorb, speichereKorb, legeInKorb, setzeMenge, korbAnzahl, bereinige,
  kundenWarenkorb, oeffentlicherArtikel, oeffentlicherLieferant, KORBSCHLUESSEL,
} from '../src/shopkern.js';
import { berechneWarenkorb } from '../src/warenkorb.js';
import { kalkuliere } from '../src/preis.js';
import { findeInterna } from '../src/interna.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const katalogDatei = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
const lieferantenDatei = JSON.parse(readFileSync(pfad('../data/lieferanten.json'), 'utf8'));

/* ------------------------------------------------------------------ *
 * Suche
 * ------------------------------------------------------------------ */

const beispiel = [
  { sku: 'A', bezeichnung: 'Baumit KlebeSpachtel 25 kg', gruppe: 'Mörtel', einheit: 'SCK', vkNetto: 30, uvpNetto: 50, lieferantId: 'p', sperrgut: true },
  { sku: 'B', bezeichnung: 'Capatect Putzgrund weiß 25 kg', gruppe: 'WDVS', einheit: 'KG', vkNetto: 40, uvpNetto: 44, lieferantId: 'p', sperrgut: false },
  { sku: 'C', bezeichnung: 'XPS glatt SF 50 mm 0,75 m2', gruppe: 'Dämmung', einheit: 'M2', vkNetto: 12, uvpNetto: null, lieferantId: 'p', sperrgut: true },
];
const index = baueSuchindex({ artikel: beispiel, seiten: [
  { id: 'wissen/x', art: 'wissen', titel: 'Mörtel anrühren', kurz: 'Spachtel und Kleber' },
] });
const ids = (frage) => suche(index, frage).map((t) => t.id);

test('das Wort wird auch im zusammengesetzten Wort gefunden', () => {
  // Der Grund für die halbe Suchlogik. Der erste Entwurf kannte nur
  // Wortanfänge und fand „Baumit KlebeSpachtel" bei „spachtel" nicht.
  assert.ok(ids('spachtel').includes('artikel/A'));
  assert.ok(ids('grund').includes('artikel/B'));
});

test('Umlaute und ihre Umschreibung finden dasselbe', () => {
  assert.deepEqual(ids('dämmung'), ids('daemmung'));
  assert.ok(ids('moertel').includes('wissen/x'));
});

test('kurze Eingaben treffen nur den Wortanfang', () => {
  // „abc" mitten im Wort fände bei Artikelnummern zu viel.
  assert.ok(ids('xps').includes('artikel/C'));
  assert.equal(suche(index, 'mm').filter((t) => t.id === 'artikel/A').length, 0);
});

test('mehrere Wörter grenzen ein, statt zu erweitern', () => {
  assert.deepEqual(ids('xps 50'), ['artikel/C']);
  assert.deepEqual(ids('putzgrund weiß'), ['artikel/B']);
  assert.deepEqual(ids('xps spachtel'), []);
});

test('Artikel stehen vor Fachseiten', () => {
  const t = ids('spachtel');
  assert.equal(t[0], 'artikel/A', 'wer „spachtel" sucht, will zuerst den Spachtel kaufen');
});

test('eine leere Eingabe liefert nichts, nicht alles', () => {
  assert.deepEqual(suche(index, ''), []);
  assert.deepEqual(suche(index, '   '), []);
  assert.deepEqual(suche(index, '!!'), []);
});

test('wortstaemme wirft zu kurze Bruchstücke weg', () => {
  assert.ok(!wortstaemme('a b cd').includes('a'));
  assert.ok(wortstaemme('a b cd').includes('cd'));
});

/* ------------------------------------------------------------------ *
 * Sortieren und Filtern
 * ------------------------------------------------------------------ */

test('Artikel ohne Preis stehen in jeder Sortierung hinten', () => {
  // Sie auszublenden wäre falsch, sie unter „Preis aufsteigend" nach vorn zu
  // lassen wäre irreführend: null ist nicht null Euro.
  const mitLuecke = [...beispiel, { sku: 'D', bezeichnung: 'Ohne Preis', gruppe: 'Mörtel', vkNetto: null }];
  for (const wie of ['name', 'preis-auf', 'preis-ab', 'vorteil']) {
    const letzte = sortiere(mitLuecke, wie).at(-1);
    assert.equal(letzte.sku, 'D', `Sortierung ${wie} stellt den Artikel ohne Preis nicht hinten hin`);
  }
});

test('Preis aufsteigend und absteigend sind Umkehrungen', () => {
  const auf = sortiere(beispiel, 'preis-auf').map((a) => a.sku);
  const ab = sortiere(beispiel, 'preis-ab').map((a) => a.sku);
  assert.deepEqual(auf, ['C', 'A', 'B']);
  assert.deepEqual(ab, [...auf].reverse());
});

test('sortiere lässt die übergebene Liste unberührt', () => {
  const vorher = beispiel.map((a) => a.sku);
  sortiere(beispiel, 'preis-ab');
  assert.deepEqual(beispiel.map((a) => a.sku), vorher);
});

test('ein Filter ohne Angaben filtert nichts weg', () => {
  assert.equal(filtere(beispiel, {}).length, beispiel.length);
  assert.equal(filtere(beispiel).length, beispiel.length);
});

test('der Vorteilsfilter wirft Artikel ohne Vergleichspreis heraus', () => {
  assert.equal(vorteil(beispiel[2]), null, 'ohne Listenpreis gibt es keinen Vorteil');
  assert.deepEqual(filtere(beispiel, { suchtauglich: true }).map((a) => a.sku), ['A', 'B']);
});

test('filterwerte nennt nur, was im Bestand vorkommt', () => {
  const w = filterwerte(beispiel);
  assert.deepEqual(w.gruppen, ['Dämmung', 'Mörtel', 'WDVS']);
  assert.equal(w.preisMin, 12);
  assert.equal(w.preisMax, 40);
  assert.equal(w.mitSperrgut, true);
});

/* ------------------------------------------------------------------ *
 * Warenkorb
 * ------------------------------------------------------------------ */

function speicherAttrappe(anfang = null, kaputt = false) {
  let wert = anfang;
  return {
    getItem: () => { if (kaputt) throw new Error('gesperrt'); return wert; },
    setItem: (_, v) => { if (kaputt) throw new Error('gesperrt'); wert = v; },
    gelesen: () => wert,
  };
}

test('ein gesperrter Speicher macht den Shop nicht kaputt', () => {
  // In einem privaten Fenster wirft schon der Zugriff. Ein Shop, der deshalb
  // weiß bleibt, ist schlimmer als einer, der den Korb vergisst.
  const s = speicherAttrappe(null, true);
  assert.deepEqual(ladeKorb(s), []);
  assert.equal(speichereKorb(s, [{ sku: 'A', menge: 1 }]), false);
  assert.deepEqual(ladeKorb(null), []);
});

test('beschädigter Inhalt wird verworfen, nicht repariert', () => {
  // Wer eine kaputte Menge auf 1 setzt, verkauft dem Kunden etwas, das er
  // nicht bestellt hat.
  assert.deepEqual(ladeKorb(speicherAttrappe('kein json')), []);
  assert.deepEqual(ladeKorb(speicherAttrappe('{"sku":"A"}')), []);
  assert.deepEqual(
    ladeKorb(speicherAttrappe(JSON.stringify([{ sku: 'A', menge: 2.5 }, { sku: 'B', menge: 3 }]))),
    [{ sku: 'B', menge: 3 }],
  );
});

test('der Korb übersteht Schreiben und Lesen', () => {
  const s = speicherAttrappe();
  speichereKorb(s, [{ sku: 'A', menge: 2 }]);
  assert.deepEqual(ladeKorb(s), [{ sku: 'A', menge: 2 }]);
  assert.match(String(KORBSCHLUESSEL), /warenkorb/);
});

test('legeInKorb zählt zusammen und ändert die Vorlage nicht', () => {
  const eins = legeInKorb([], 'A', 2);
  const zwei = legeInKorb(eins, 'A', 3);
  assert.deepEqual(eins, [{ sku: 'A', menge: 2 }], 'die erste Liste bleibt, wie sie war');
  assert.deepEqual(zwei, [{ sku: 'A', menge: 5 }]);
  assert.equal(korbAnzahl(zwei), 5);
});

test('unsinnige Mengen werden abgewiesen, nicht stillschweigend geglättet', () => {
  assert.throws(() => legeInKorb([], 'A', 0), /Ungültige Menge/);
  assert.throws(() => legeInKorb([], 'A', 1.5), /Ungültige Menge/);
  assert.throws(() => legeInKorb([], '', 1), /Artikelnummer fehlt/);
  assert.throws(() => setzeMenge([], 'A', -1), /Ungültige Menge/);
});

test('Menge 0 entfernt die Zeile', () => {
  assert.deepEqual(setzeMenge([{ sku: 'A', menge: 3 }], 'A', 0), []);
});

test('was der Katalog nicht mehr kennt, wird genannt und nicht still entfernt', () => {
  const e = bereinige([{ sku: 'A', menge: 1 }, { sku: 'WEG', menge: 2 }], beispiel);
  assert.deepEqual(e.zeilen, [{ sku: 'A', menge: 1 }]);
  assert.deepEqual(e.entfallen, ['WEG']);
});

/* ------------------------------------------------------------------ *
 * Die Rechnung — und die Probe gegen den Rechenkern
 * ------------------------------------------------------------------ */

const lieferantProbe = {
  id: 'p', name: 'Probe', lieferzeitWerktage: 3,
  mindestbestellwertNetto: null,
  fracht: { modell: 'pauschale', freiHausAbNetto: null, pauschaleNetto: 75.5, sperrgutZuschlagNetto: 7.5 },
};

test('der Warenkorb rechnet Fracht und Sperrgutzuschlag', () => {
  const r = kundenWarenkorb(
    [{ sku: 'A', menge: 2 }, { sku: 'B', menge: 1 }],
    { artikel: beispiel, lieferanten: [oeffentlicherLieferant(lieferantProbe)] },
  );
  assert.equal(r.warenwertNetto, 100);
  assert.equal(r.frachtNetto, 83, '75,50 Pauschale plus einmal 7,50 für die palettierte Position');
  assert.equal(r.nettoGesamt, 183);
  assert.equal(r.bruttoGesamt, 219.6);
  assert.equal(r.stueck, 3);
});

test('dieselbe Rechnung wie im Rechenkern — nur mit weniger Wissen', () => {
  // Der Grund, warum es kundenWarenkorb() überhaupt gibt: berechneWarenkorb()
  // braucht Einkaufspreise, und die dürfen nicht in die Seite. Damit daraus
  // keine zweite Wahrheit wird, müssen beide dieselben Kundenzahlen liefern.
  const roh = [
    { sku: 'A', bezeichnung: 'Sack', gruppe: 'M', einheit: 'SCK', lieferantId: 'p', sperrgut: true, ekNetto: 22.5, uvpNetto: 50 },
    { sku: 'B', bezeichnung: 'Dose', gruppe: 'Z', einheit: 'DOS', lieferantId: 'p', sperrgut: false, ekNetto: 8, uvpNetto: 44 },
  ];
  const gerechnet = roh.map((a) => ({ ...a, ...kalkuliere(a, lieferantProbe, 0.25) }));
  const katalog = { artikel: gerechnet, lieferantenById: new Map([['p', lieferantProbe]]) };
  const zeilen = [{ sku: 'A', menge: 3 }, { sku: 'B', menge: 2 }];

  const kern = berechneWarenkorb(zeilen, katalog);
  const kunde = kundenWarenkorb(zeilen, {
    artikel: gerechnet.map(oeffentlicherArtikel),
    lieferanten: [oeffentlicherLieferant(lieferantProbe)],
  });

  assert.equal(kunde.warenwertNetto, kern.warenwertNetto);
  assert.equal(kunde.frachtNetto, kern.frachtNetto);
  assert.equal(kunde.teillieferungen.length, kern.teillieferungen.length);
  assert.equal(kunde.teillieferungen[0].frachtGrund, kern.teillieferungen[0].frachtGrund);
  assert.ok(!('lieferantName' in kunde.teillieferungen[0]),
    'der Lieferantenname gehört nicht in die Kundenrechnung');
});

test('eine Frei-Haus-Schwelle wird gemeldet statt verschwiegen', () => {
  // Sie misst am Bestellwert, also am Einkauf. Der Browser kennt keine
  // Einkaufspreise und kann sie nicht prüfen — also sagt er das.
  const mitSchwelle = oeffentlicherLieferant({ ...lieferantProbe, fracht: { ...lieferantProbe.fracht, freiHausAbNetto: 1500 } });
  const r = kundenWarenkorb([{ sku: 'A', menge: 1 }], { artikel: beispiel, lieferanten: [mitSchwelle] });
  assert.equal(r.offen.length, 1);
  assert.match(r.offen[0], /1500/);
  assert.equal(kundenWarenkorb([{ sku: 'A', menge: 1 }],
    { artikel: beispiel, lieferanten: [oeffentlicherLieferant(lieferantProbe)] }).offen.length, 0);
});

test('unbekannte Artikel und Artikel ohne Preis werfen', () => {
  const l = [oeffentlicherLieferant(lieferantProbe)];
  assert.throws(() => kundenWarenkorb([{ sku: 'WEG', menge: 1 }], { artikel: beispiel, lieferanten: l }), /Unbekannte Artikelnummer/);
  const ohnePreis = [{ ...beispiel[0], vkNetto: null }];
  assert.throws(() => kundenWarenkorb([{ sku: 'A', menge: 1 }], { artikel: ohnePreis, lieferanten: l }), /ohne Preis/);
});

/* ------------------------------------------------------------------ *
 * Was in die Seite darf
 * ------------------------------------------------------------------ */

test('der öffentliche Artikel trägt keinen Einkaufspreis', () => {
  const voll = { ...beispiel[0], ekNetto: 22.5, deckungsbeitragNetto: 7.5, rohmarge: 0.25, geheim: 'x' };
  const oeffentlich = oeffentlicherArtikel(voll);
  for (const feld of ['ekNetto', 'deckungsbeitragNetto', 'rohmarge', 'geheim']) {
    assert.ok(!(feld in oeffentlich), `${feld} gehört nicht in die Seite`);
  }
  assert.equal(oeffentlich.vkNetto, 30);
});

test('der öffentliche Lieferant trägt weder Konditionen noch Namen', () => {
  const voll = { ...lieferantProbe, haendlerrabattAufUvp: 0.42, mindestbestellwertNetto: 400, konditionenStand: 'bestaetigt' };
  const oeffentlich = oeffentlicherLieferant(voll);
  for (const feld of ['haendlerrabattAufUvp', 'mindestbestellwertNetto', 'konditionenStand', 'name']) {
    assert.ok(!(feld in oeffentlich), `${feld} gehört nicht in die Seite`);
  }
  assert.equal(oeffentlich.fracht.pauschaleNetto, 75.5, 'die Fracht bezahlt der Kunde und gehört hinaus');
});

test('die Nutzdaten des ganzen Katalogs enthalten keine Interna', () => {
  // Dieselbe Prüfung, die der Seitenbau über die fertigen Seiten laufen
  // lässt — hier über den eingebetteten Datensatz, bevor er eine Seite wird.
  const nutzdaten = JSON.stringify({
    artikel: katalogDatei.artikel.map(oeffentlicherArtikel),
    lieferanten: lieferantenDatei.lieferanten.map(oeffentlicherLieferant),
  });
  assert.deepEqual(findeInterna(nutzdaten).map((f) => `${f.id}: ${f.fund}`), []);
});
