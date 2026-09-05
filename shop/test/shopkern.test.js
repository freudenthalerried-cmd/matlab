import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  wortstaemme, baueSuchindex, suche, sortiere, filtere, filterwerte, vorteil,
  ladeKorb, speichereKorb, legeInKorb, setzeMenge, korbPositionen, bereinige,
  kundenWarenkorb, oeffentlicherArtikel, oeffentlicherLieferant, kundenwoerter,
  abstand, erlaubterAbstand, meintenSie, KORBSCHLUESSEL, stamm, indexwoerter,
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
  // 2,5 ist seit dem 29.08. eine gültige Menge — Flächenware wird in
  // Platten zu 0,75 m² abgegeben, ganze Quadratmeter gibt es dort nicht.
  // Verworfen wird, was keine Menge ist: mehr als zwei Nachkommastellen,
  // null, negativ.
  assert.deepEqual(
    ladeKorb(speicherAttrappe(JSON.stringify([{ sku: 'A', menge: 2.5 }, { sku: 'B', menge: 3 }]))),
    [{ sku: 'A', menge: 2.5 }, { sku: 'B', menge: 3 }],
  );
  assert.deepEqual(
    ladeKorb(speicherAttrappe(JSON.stringify([{ sku: 'A', menge: 2.5001 }, { sku: 'B', menge: 3 }]))),
    [{ sku: 'B', menge: 3 }],
  );
  assert.deepEqual(
    ladeKorb(speicherAttrappe(JSON.stringify([{ sku: 'A', menge: 0 }, { sku: 'B', menge: 3 }]))),
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
  assert.equal(korbPositionen(zwei), 1, 'zwei Klicks auf denselben Artikel sind eine Position');
});

test('unsinnige Mengen werden abgewiesen, nicht stillschweigend geglättet', () => {
  assert.throws(() => legeInKorb([], 'A', 0), /Ungültige Menge/);
  assert.throws(() => legeInKorb([], 'A', -2), /Ungültige Menge/);
  // Zwei Nachkommastellen sind die Grenze: In ihnen gehen Gebinde auf
  // (0,5 · 0,75 · 8,64) und in ihnen ist eine Rechnung stellbar. Was
  // darunter liegt, ist keine Menge, sondern ein Tippfehler.
  assert.throws(() => legeInKorb([], 'A', 1.005), /Ungültige Menge/);
  assert.throws(() => legeInKorb([], 'A', Number.NaN), /Ungültige Menge/);
  assert.throws(() => legeInKorb([], '', 1), /Artikelnummer fehlt/);
  assert.throws(() => setzeMenge([], 'A', -1), /Ungültige Menge/);
});

test('Gebindemengen mit Nachkommastellen sind gültig', () => {
  // Vier Platten zu 0,75 m² sind 3,00 m², fünf sind 3,75 m². Vor dem 29.08.
  // hat der Korb genau diese Mengen abgewiesen und ausschließlich die
  // unlieferbaren ganzen Quadratmeter zugelassen.
  assert.deepEqual(legeInKorb([], 'A', 0.75), [{ sku: 'A', menge: 0.75 }]);
  assert.deepEqual(legeInKorb([{ sku: 'A', menge: 0.75 }], 'A', 0.75), [{ sku: 'A', menge: 1.5 }]);
  assert.deepEqual(setzeMenge([{ sku: 'A', menge: 1.5 }], 'A', 3.75), [{ sku: 'A', menge: 3.75 }]);
  // Und die Summe rutscht nicht in Gleitkommastaub ab.
  assert.equal(legeInKorb([{ sku: 'A', menge: 8.64 }], 'A', 8.64)[0].menge, 17.28);
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

test('der Warenkorb rechnet Fracht und Kranentladung', () => {
  const r = kundenWarenkorb(
    [{ sku: 'A', menge: 2 }, { sku: 'B', menge: 1 }],
    { artikel: beispiel, lieferanten: [oeffentlicherLieferant(lieferantProbe)] },
  );
  assert.equal(r.warenwertNetto, 100);
  assert.equal(r.frachtNetto, 83, '75,50 Pauschale plus einmal 7,50 für die palettierte Position');
  assert.equal(r.nettoGesamt, 183);
  assert.equal(r.bruttoGesamt, 219.6);
  assert.equal(r.positionen, 2);
  // `stueck` gibt es seit dem 29.08. nicht mehr: Eine Summe über Stück,
  // Quadratmeter und Kilogramm ist keine Menge.
  assert.equal(r.stueck, undefined);
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

test('eine Frei-Haus-Schwelle wird gemeldet statt verschwiegen — ohne ihre Zahl', () => {
  // Sie misst am Bestellwert, also am Einkauf. Der Browser kennt keine
  // Einkaufspreise und kann sie nicht prüfen — also sagt er das.
  //
  // **Und er sagt es seit dem 5. September ohne die Zahl.** Bis dahin stand
  // hier `assert.match(r.offen[0], /1500/)`: Der Test hat ausdrücklich
  // verlangt, dass die Schwelle in der Kasse steht, und `shop.js` hat sie an
  // jeden Besucher ausgeliefert. Sie misst am Einkauf — wer sie kennt und ein
  // Angebot mit 0,00 € Fracht daneben legt, hat eine Untergrenze unseres
  // Wareneinsatzes und den Warenwert auf demselben Blatt.
  const mitSchwelle = oeffentlicherLieferant({ ...lieferantProbe, fracht: { ...lieferantProbe.fracht, freiHausAbNetto: 1500 } });
  assert.ok(!('freiHausAbNetto' in mitSchwelle.fracht), 'die Zahl gehört nicht in die Seite');
  assert.equal(mitSchwelle.fracht.freiHausMoeglich, true);

  const r = kundenWarenkorb([{ sku: 'A', menge: 1 }], { artikel: beispiel, lieferanten: [mitSchwelle] });
  assert.equal(r.offen.length, 1);
  assert.match(r.offen[0], /frachtfrei/);
  assert.doesNotMatch(r.offen[0], /1500/, 'die Schwelle darf genannt sein, ihre Höhe nicht');
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

/* ------------------------------------------------------------------ *
 * Gewicht
 * ------------------------------------------------------------------ */

test('das Gewicht summiert nur, was belegt ist, und nennt den Rest', () => {
  // Eine Summe über Artikel mit unbekanntem Gewicht wäre eine Untergrenze,
  // die wie eine Summe aussieht.
  const artikel = [
    { ...beispiel[0], sku: 'G1', gewichtKg: 2.5 },
    { ...beispiel[1], sku: 'G2', gewichtKg: null },
  ];
  const r = kundenWarenkorb([{ sku: 'G1', menge: 4 }, { sku: 'G2', menge: 1 }],
    { artikel, lieferanten: [oeffentlicherLieferant(lieferantProbe)] });
  assert.equal(r.gewichtKg, 10);
  assert.equal(r.positionenOhneGewicht, 1);
});

test('ohne jede Gewichtsangabe bleibt die Summe null und die Lücke sichtbar', () => {
  const artikel = [{ ...beispiel[0], sku: 'G1', gewichtKg: null }];
  const r = kundenWarenkorb([{ sku: 'G1', menge: 3 }],
    { artikel, lieferanten: [oeffentlicherLieferant(lieferantProbe)] });
  assert.equal(r.gewichtKg, 0);
  assert.equal(r.positionenOhneGewicht, 1, 'null Kilo darf nicht wie ein Messwert aussehen');
});

test('ein unbelegtes Gewicht wird nicht zu null gemacht', () => {
  assert.equal(oeffentlicherArtikel({ sku: 'X' }).gewichtKg, null);
  assert.equal(oeffentlicherArtikel({ sku: 'X', gewichtKg: 'schwer' }).gewichtKg, null);
  assert.equal(oeffentlicherArtikel({ sku: 'X', gewichtKg: 2.5 }).gewichtKg, 2.5);
});

test('der Katalog trägt Gewichte nur mit Quellenangabe', () => {
  const mitGewicht = katalogDatei.artikel.filter((a) => typeof a.gewichtKg === 'number');
  assert.ok(mitGewicht.length >= 5, 'ohne Gewichte prüft diese Schleife nichts');
  // „rechnung" oder „liste" — mehr Quellen gibt es nicht, und jede Angabe
  // nennt ihre. Ein Gewicht ohne Herkunft ist eine Behauptung.
  for (const a of mitGewicht) {
    assert.ok(['rechnung', 'liste'].includes(a.gewichtQuelle), `${a.sku}: Gewichtsquelle „${a.gewichtQuelle}"`);
    assert.ok(a.gewichtKg > 0, `${a.sku}: Gewicht muss positiv sein`);
  }
  const ohne = katalogDatei.artikel.filter((a) => a.gewichtKg === undefined);
  assert.ok(ohne.every((a) => a.gewichtQuelle === undefined),
    'ein Artikel ohne Gewicht darf auch keine Gewichtsquelle tragen');
});

/* ------------------------------------------------------------------ *
 * Kundenwörter — die Sprache der Baustelle statt der des Lieferanten
 * ------------------------------------------------------------------ */

const suchwoerterDatei = JSON.parse(readFileSync(pfad('../data/suchwoerter.json'), 'utf8'));
const bestandsindex = () => baueSuchindex({
  artikel: katalogDatei.artikel,
  suchwoerter: suchwoerterDatei.woerter,
});

test('jedes Kundenwort findet genau die Artikel, für die es eingetragen ist', () => {
  const index = bestandsindex();
  assert.ok(suchwoerterDatei.woerter.length >= 30, 'ohne Register prüft diese Schleife nichts');
  for (const e of suchwoerterDatei.woerter) {
    const treffer = suche(index, e.wort).filter((x) => x.art === 'artikel');
    assert.ok(treffer.length > 0, `„${e.wort}" findet nichts`);
    for (const sku of e.skus ?? []) {
      assert.ok(treffer.some((x) => x.sku === sku), `„${e.wort}" findet ${sku} nicht`);
    }
    if (e.gruppe) {
      assert.equal(treffer[0].gruppe, e.gruppe,
        `„${e.wort}" führt nicht zuerst in die Gruppe ${e.gruppe}`);
    }
  }
});

/**
 * Eine Begründung ist entweder ausgeschrieben oder ein Verweis auf einen
 * anderen Eintrag, der sie ausschreibt („wie Noppenbahn"). Der Verweis muss
 * ins Register zeigen — sonst wäre „wie oben" eine Begründung, die auf nichts
 * zeigt, und genau davon hat dieses Projekt schon genug gesehen.
 */
const begruendet = (e, alleWorte) => {
  const text = String(e.warum ?? '').trim();
  if (text.length > 20) return true;
  // „Wie X" und „Siehe X." sind derselbe Verweis in zwei Schreibweisen —
  // beide gelten nur, wenn X wirklich in derselben Liste steht. Der zweite
  // ist am 29.08. dazugekommen, als die Ablehnungen „Siehe silikatputz."
  // trugen; das ist keine Lockerung der Regel, sondern dieselbe Regel.
  const verweis = /^(?:wie|siehe) ([\p{L}-]+)\.?$/iu.exec(text);
  return !!verweis && alleWorte.has(verweis[1].toLowerCase());
};

test('jeder Eintrag des Registers zeigt auf vorhandene Ware und trägt eine Begründung', () => {
  const skus = new Set(katalogDatei.artikel.map((a) => a.sku));
  const gruppen = new Set(katalogDatei.artikel.map((a) => a.gruppe));
  const alleWorte = new Set(suchwoerterDatei.woerter.map((w) => w.wort.toLowerCase()));
  assert.ok(suchwoerterDatei.woerter.length >= 30, `nur ${suchwoerterDatei.woerter.length} Kundenwörter im Register`);
  for (const e of suchwoerterDatei.woerter) {
    assert.ok(begruendet(e, alleWorte), `„${e.wort}": keine Begründung`);
    assert.ok(e.skus?.length || e.gruppe, `„${e.wort}": kein Ziel`);
    for (const s of e.skus ?? []) assert.ok(skus.has(s), `„${e.wort}": ${s} gibt es nicht`);
    if (e.gruppe) assert.ok(gruppen.has(e.gruppe), `„${e.wort}": Gruppe ${e.gruppe} gibt es nicht`);
  }
});

test('was der Shop nicht führt, bleibt unauffindbar', () => {
  // Die Gegenzusage zum Register, und die wichtigere von beiden. „Drainage"
  // darf nicht die Noppenbahn finden — das ist genau die Verwechslung, vor
  // der die Wissensseite warnt. Ein Suchwort, das ersatzweise auf etwas
  // Ähnliches zeigt, verkauft das Falsche.
  const index = bestandsindex();
  assert.ok(suchwoerterDatei._nichtAufgenommen.length >= 4);
  const abgelehnt = new Set(suchwoerterDatei._nichtAufgenommen.map((w) => w.wort.toLowerCase()));
  for (const e of suchwoerterDatei._nichtAufgenommen) {
    assert.ok(begruendet(e, abgelehnt), `„${e.wort}": Ablehnung ohne Begründung`);
    const treffer = suche(index, e.wort).filter((x) => x.art === 'artikel');
    assert.deepEqual(treffer.map((x) => x.titel), [], `„${e.wort}" findet Ware, obwohl abgelehnt`);
  }
});

test('der eigene Name schlägt das Kundenwort', () => {
  // Sonst steht der Ersatz vor dem Gemeinten: Wer „Spachtel" sucht, will den
  // Spachtel und nicht das, was wir zusätzlich darunter eingetragen haben.
  // Der kürzere Titel gewinnt bei Gleichstand — deshalb trägt hier
  // ausgerechnet der Artikel mit dem Kundenwort den kürzeren Namen. Sonst
  // ginge der Test auch dann durch, wenn Kundenwörter so schwer wögen wie
  // der eigene Name, und bewiese nichts.
  const artikel = [
    { sku: 'N-1', bezeichnung: 'Baumit KlebeSpachtel 25 kg', gruppe: 'Mörtel', einheit: 'SCK', vkNetto: 30 },
    { sku: 'N-2', bezeichnung: 'Putzgrund 25 kg', gruppe: 'WDVS', einheit: 'KG', vkNetto: 40 },
  ];
  const index = baueSuchindex({ artikel, suchwoerter: [{ wort: 'klebespachtel', skus: ['N-2'] }] });
  const treffer = suche(index, 'klebespachtel');
  assert.equal(treffer.length, 2, 'beide werden gefunden');
  assert.equal(treffer[0].sku, 'N-1', 'der Artikel mit dem Wort im Namen steht vorn');
});

test('kundenwoerter liefert nur die Wörter des jeweiligen Artikels', () => {
  const register = [
    { wort: 'noppenbahn', skus: ['X-1'] },
    { wort: 'rauchfang', gruppe: 'Kamin' },
  ];
  assert.deepEqual(kundenwoerter({ sku: 'X-1', gruppe: 'Kanal' }, register), ['noppenbahn']);
  assert.deepEqual(kundenwoerter({ sku: 'X-2', gruppe: 'Kamin' }, register), ['rauchfang']);
  assert.deepEqual(kundenwoerter({ sku: 'X-3', gruppe: 'Mörtel' }, register), []);
});

test('achtzehn Wörter, die vorher nichts fanden, finden jetzt Ware', () => {
  // Die Messung vom 27. August, festgehalten als Probe: ohne Register null
  // Treffer, mit Register Ware. Ein Vorher-Nachher, das ohne diesen Test nur
  // in einem Dokument stünde.
  //
  // **Neu gefasst am 30.08.** Die erste Fassung verlangte, dass **jedes** der
  // achtzehn Wörter ohne Register stumm bleibt. Das war am 27. August wahr
  // und ist eine Aussage über einen Katalog mit 46 Artikeln — in der
  // Generalprobe mit 172 fiel sie um, weil „dämmplatte" dann in einer
  // Bezeichnung vorkommt.
  //
  // Sie wäre also ausgerechnet am Tag der Lieferantenliste fehlgeschlagen,
  // zwischen echten Befunden, und jemand hätte unter Zeitdruck entscheiden
  // müssen, ob das schlimm ist. Geprüft wird deshalb die **Zusage** — das
  // Register macht stumme Wörter hörbar und nimmt keinem Wort etwas weg —
  // und die historische Zahl steht als Nachricht dabei.
  const vorher = baueSuchindex({ artikel: katalogDatei.artikel });
  const nachher = bestandsindex();
  const stumm = [
    'noppenbahn', 'dämmplatte', 'styropor', 'armierungsmörtel', 'klebemörtel', 'bauschaum',
    'montageschaum', 'baufolie', 'pe-folie', 'schornstein', 'rauchfang', 'sockeldämmung',
    'perimeterdämmung', 'vollwärmeschutz', 'trittschalldämmung', 'ziegel', 'tellerdübel',
    'anputzleiste',
  ];
  assert.equal(stumm.length, 18);
  const stummGeblieben = stumm.filter((w) => suche(vorher, w).length === 0);
  assert.ok(stummGeblieben.length >= 1,
    `Am 27.08. waren alle 18 ohne Register stumm; heute keines mehr. `
    + `Der Katalog ist gewachsen — die Messung gehört nachgezogen, das Register nicht abgeschafft.`);
  for (const w of stumm) {
    const ohne = suche(vorher, w).map((x) => x.id);
    const mit = suche(nachher, w).map((x) => x.id);
    assert.ok(mit.length >= 1, `„${w}" findet weiterhin nichts`);
    assert.ok(mit.some((id) => id.startsWith('artikel/')), `„${w}" findet keine Ware`);
    // Kein Schleifenkörper: `ohne` ist bei einem stummen Wort leer, und das
    // ist der Regelfall. Eine Längenzusicherung wäre hier falsch — geprüft
    // wird, dass nichts wegfällt, nicht dass etwas da war.
    assert.ok(ohne.every((id) => mit.includes(id)),
      `„${w}": das Register nimmt Treffer weg, statt welche hinzuzufügen`);
  }
});

test('ein zusammengesetztes Kundenwort trägt sein Grundwort mit', () => {
  // „Dämmplattenkleber" enthält „Dämmplatte". Wer die Platte sucht, sieht
  // deshalb auch den Kleber dafür — aber hinter den Platten. Das ist gewollt
  // und hier festgehalten, damit es niemand für einen Fehler hält.
  //
  // **Gemessen an einem festen Satz Artikel, nicht am Bestand.** Die erste
  // Fassung suchte im ganzen Katalog und verlangte „mindestens Platz 10".
  // Im Lastlauf mit 100 eingespielten Artikeln fiel sie um: Der Kleber
  // rutschte aus den ersten vierzig Treffern heraus und war gar nicht mehr
  // zu finden — die Zusage war unverändert wahr, die Probe nur nicht mehr in
  // der Lage, sie zu sehen.
  const artikel = [
    { sku: 'P-1', bezeichnung: 'XPS glatt SF 30 mm', gruppe: 'Dämmung', einheit: 'M2', vkNetto: 5 },
    { sku: 'P-2', bezeichnung: 'XPS glatt SF 50 mm', gruppe: 'Dämmung', einheit: 'M2', vkNetto: 8 },
    { sku: 'K-1', bezeichnung: 'Soudabond Easy 750 ml', gruppe: 'Zubehör', einheit: 'DOS', vkNetto: 12 },
  ];
  const index = baueSuchindex({
    artikel,
    suchwoerter: [
      { wort: 'dämmplatte', gruppe: 'Dämmung' },
      { wort: 'dämmplattenkleber', skus: ['K-1'] },
    ],
  });
  const treffer = suche(index, 'dämmplatte');
  assert.equal(treffer.length, 3, 'der Kleber wird mitgefunden');
  assert.equal(treffer[0].gruppe, 'Dämmung', 'die Platten zuerst');
  assert.equal(treffer[treffer.length - 1].sku, 'K-1', 'der Kleber zuletzt');
});

/* ------------------------------------------------------------------ *
 * „Meinten Sie …?"
 * ------------------------------------------------------------------ */

test('die Editierdistanz zählt Einfügen, Löschen und Ersetzen', () => {
  assert.equal(abstand('rohr', 'rohr'), 0);
  assert.equal(abstand('kanalror', 'kanalrohr'), 1, 'ein fehlender Buchstabe');
  assert.equal(abstand('gewbe', 'gewebe'), 1);
  assert.equal(abstand('haus', 'maus'), 1, 'ein ersetzter Buchstabe');
  assert.ok(abstand('rohr', 'schachtring', 2) > 2, 'die Obergrenze bricht früh ab');
});

test('kurze Wörter dürfen sich nicht vertippen', () => {
  // Bei drei Buchstaben ist jeder „Vertipper" ein anderes Wort.
  assert.equal(erlaubterAbstand('dn'), 0);
  assert.equal(erlaubterAbstand('rohr'), 1);
  assert.equal(erlaubterAbstand('spachtel'), 2);
});

test('acht Vertipper kommen an — sieben über den Vorschlag, einer direkt', () => {
  // Die Messung vom 28. August, als Probe festgehalten.
  //
  // **Berichtigt am 30.08.** Hier stand zusätzlich, jeder der acht finde
  // direkt nichts. Das war die Lage vor dem Wortstamm: Seit „dämmplate" auf
  // `dammplat` gestutzt wird, steckt es in `dammplatt` und findet die zehn
  // Dämmplatten von selbst. Zugesichert ist nicht die Null, sondern das
  // Ergebnis — der Kunde kommt an der Ware an.
  const index = bestandsindex();
  const vertipper = {
    kanalror: 'kanalrohr',
    'dämmplate': 'dämmplatte',
    rauchfng: 'rauchfang',
    styropr: 'styropor',
    kantenschuz: 'kantenschutz',
    schachtrng: 'schachtring',
    gewbe: 'gewebe',
    // **Neu gefasst am 30.08.** Hier stand `spachtl: 'spachtelmasse'`. In der
    // Generalprobe mit 172 Artikeln schlug die Suche „klebespachtel" zuerst
    // vor — dieselbe Ware, ein anderes Wort, weil die Häufigkeiten sich mit
    // dem Katalog verschieben. Die Zusage lautet „der Kunde kommt an", nicht
    // „das Wort lautet so"; wo mehrere Wörter dieselbe Ware nennen, stehen
    // sie alle da.
    spachtl: ['spachtelmasse', 'klebespachtel', 'klebespachtelmasse'],
  };
  assert.equal(Object.keys(vertipper).length, 8);
  let direkt = 0;
  for (const [falsch, erwartet] of Object.entries(vertipper)) {
    const vorschlaege = meintenSie(index, falsch);
    const zulaessig = Array.isArray(erwartet) ? erwartet : [erwartet];
    assert.ok(zulaessig.includes(vorschlaege[0]), `„${falsch}" → ${JSON.stringify(vorschlaege)}`);
    if (suche(index, falsch).length) direkt++;
  }
  assert.equal(direkt, 1, 'die Zahl der direkt findenden Vertipper hat sich verschoben — nachmessen');
});

test('was der Shop nicht führt, bekommt keinen Ersatzvorschlag', () => {
  // Dieselbe Zusage wie im Kundenwörter-Register, an der zweiten Stelle, an
  // der sie brechen könnte. „dachziegel" lag im ersten Entwurf zwei
  // Buchstaben neben „hochlochziegel" — und ein Kunde, der Dachziegel sucht,
  // hätte einen Mauerziegel vorgeschlagen bekommen.
  const index = bestandsindex();
  for (const wort of ['dachziegel', 'zement', 'fliesen', 'estrich', 'xyzabc']) {
    assert.deepEqual(meintenSie(index, wort), [], `„${wort}" bekommt einen Ersatzvorschlag`);
  }
});

test('der Vorschlag ist die Schreibweise des Katalogs, egal wie getippt wurde', () => {
  // Bis zum 30.08. legte der Index jedes Umlautwort doppelt ab, und dieser
  // Test verlangte, der Vorschlag folge der Tastatur des Kunden: „daemmplate"
  // → „daemmplatte". Das war eine Schreibweise, unter der die Ware nirgends
  // steht. Jetzt gibt es je Wort eine Normalform und daran genau einen Namen.
  const index = bestandsindex();
  for (const getippt of ['dämmplate', 'daemmplate']) {
    const vorschlaege = meintenSie(index, getippt);
    assert.equal(vorschlaege[0], 'dämmplatte', `„${getippt}" → ${JSON.stringify(vorschlaege)}`);
    assert.ok(!vorschlaege.includes('daemmplatte'), 'die Ersatzschreibweise ist kein eigener Vorschlag');
  }
});

test('kein Vorschlag ist ein Wortstamm', () => {
  // Der erste Wurf des Stemmers bot „dammplatt", „geweb" und „spachtelmass"
  // an. Gesucht wird über Stämme, vorgeschlagen wird über Wörter — und ein
  // Wort, das so in keinem Katalog steht, ist kein Rat, sondern ein Fehler
  // des Shops.
  const index = bestandsindex();
  const bestand = new Set();
  for (const e of index) for (const f of e.formen ?? []) bestand.add(f);
  assert.ok(bestand.size >= 100, `nur ${bestand.size} Wörter im Bestand — die Schleife prüft zu wenig`);
  const vertipper = ['kanalror', 'dämmplate', 'rauchfng', 'styropr', 'kantenschuz', 'schachtrng', 'gewbe', 'spachtl'];
  const vorschlaege = vertipper.flatMap((falsch) => meintenSie(index, falsch));
  assert.ok(vorschlaege.length >= 8, `nur ${vorschlaege.length} Vorschläge — die Schleife prüft zu wenig`);
  for (const v of vorschlaege) {
    assert.ok(bestand.has(v), `„${v}" steht in keiner Bezeichnung und in keinem Kundenwort`);
  }
});


/* ------------------------------------------------------------------ *
 * Der Kunde tippt den Plural
 * ------------------------------------------------------------------ */

/**
 * 35 Paare aus der Sprache der Baustelle — Einzahl und Mehrzahl desselben
 * Worts, von Hand aus dem Wortschatz dieses Katalogs und des
 * Kundenwörter-Registers gezogen. Kein Generator: „abdeckbandn" und
 * „armierungsgewebeen" sind keine deutschen Wörter, und eine Messung, die
 * solche Formen mitzählt, misst den Generator statt die Suche.
 *
 * Vier Paare sind absichtlich formgleich (Ziegel, Dübel, Gewebe): Der
 * deutsche Plural ist nicht immer länger, und eine Probe, die nur die
 * schwierigen Fälle enthält, übersieht, wenn die leichten kaputtgehen.
 */
const NUMERUSPAARE = [
  ['dämmplatte', 'dämmplatten'], ['noppenbahn', 'noppenbahnen'], ['noppenfolie', 'noppenfolien'],
  ['abflussrohr', 'abflussrohre'], ['abflussrohr', 'abflussrohren'], ['kaminrohr', 'kaminrohre'],
  ['kanalrohr', 'kanalrohre'], ['eckschiene', 'eckschienen'], ['anputzleiste', 'anputzleisten'],
  ['rondelle', 'rondellen'], ['schornstein', 'schornsteine'], ['kamin', 'kamine'],
  ['grundierung', 'grundierungen'], ['mantelstein', 'mantelsteine'], ['schachtring', 'schachtringe'],
  ['trennstein', 'trennsteine'], ['rahmenschraube', 'rahmenschrauben'], ['spachtelmasse', 'spachtelmassen'],
  ['fugenmasse', 'fugenmassen'], ['zuluftplatte', 'zuluftplatten'], ['regenhaube', 'regenhauben'],
  ['folie', 'folien'], ['baufolie', 'baufolien'], ['dosierpistole', 'dosierpistolen'],
  ['sicherungsseil', 'sicherungsseile'], ['laibung', 'laibungen'],
  // Mit Umlaut im Plural — die Stelle, an der eine reine Endungsregel scheitert.
  ['kanalbogen', 'kanalbögen'], ['kreppband', 'kreppbänder'], ['abdeckband', 'abdeckbänder'],
  ['malerband', 'malerbänder'], ['putzgrund', 'putzgründe'], ['fensteranschluss', 'fensteranschlüsse'],
  // Formgleich.
  ['tellerdübel', 'tellerdübel'], ['ziegel', 'ziegel'], ['gewebe', 'gewebe'],
];

test('wer den Plural tippt, findet dieselben Artikel wie mit der Einzahl', () => {
  // **Gemessen am 30.08.:** 31 der 35 Paare verloren beim Wechsel in den
  // Plural **jeden** Treffer. „dämmplatte" fand zehn Artikel, „dämmplatten"
  // einen; „schornsteine", „abflussrohre", „spachtelmassen": null.
  //
  // Der Grund lag in der Trefferregel: Sie kennt Wortanfang und Wortmitte,
  // also findet ein kürzeres Suchwort das längere Indexwort — und der
  // deutsche Plural ist fast immer die längere Form.
  const index = bestandsindex();
  assert.equal(NUMERUSPAARE.length, 35, 'die Messung hängt an dieser Liste');
  const skus = (frage) => suche(index, frage).filter((t) => t.art === 'artikel').map((t) => t.sku).sort();
  for (const [einzahl, mehrzahl] of NUMERUSPAARE) {
    const eins = skus(einzahl);
    assert.ok(eins.length > 0, `„${einzahl}" findet selbst nichts — das Paar misst nichts`);
    assert.deepEqual(skus(mehrzahl), eins, `„${mehrzahl}" findet nicht dasselbe wie „${einzahl}"`);
  }
});

test('zwei Registereinträge sind entfallen — der Wortstamm deckt sie ab', () => {
  // „dübelteller" stand neben „duebelteller", „rondellen" neben der
  // Artikelbezeichnung *Rondelle*. Beide Einträge waren Handarbeit gegen
  // eine fehlende Regel; seit es die Regel gibt, sind sie zwei Stellen, die
  // auseinanderlaufen können. Was zählt, ist nicht der Eintrag, sondern dass
  // der Kunde ankommt.
  const index = bestandsindex();
  const gefuehrt = new Set(suchwoerterDatei.woerter.map((e) => e.wort));
  for (const wort of ['dübelteller', 'rondellen']) {
    assert.ok(!gefuehrt.has(wort), `„${wort}" steht wieder im Register`);
    const treffer = suche(index, wort).filter((t) => t.art === 'artikel');
    assert.deepEqual(treffer.map((t) => t.sku), ['POS-29610'], `„${wort}" findet die Rondelle nicht mehr`);
  }
  assert.equal(suchwoerterDatei._entfallen.length, 2, 'die Streichung ist nicht begründet');
});

/**
 * Was der Antwortsatz einer Gruppenseite verspricht — Wort für Wort, von
 * Hand, wie das Kundenwörter-Register.
 *
 * Eine maschinelle Auslese scheitert hier: „Auswahl", „Einbauort" und
 * „Wärmeschutznachweis" stehen in denselben Sätzen und sind keine Ware. Was
 * ein Warenwort ist, entscheidet ein Mensch; dass es einlösbar ist, prüft
 * diese Liste.
 *
 * Steht eine zweite Gruppe dabei, sagt der Satz das ausdrücklich — die Ware
 * gehört dann in die andere Gruppe, und die Seite verweist dorthin.
 */
const GRUPPENDATEI = new Map([
  ['Dämmung', 'daemmung'], ['Kamin', 'kamin'], ['Kanal', 'kanal'], ['Mauerwerk', 'mauerwerk'],
  ['Mörtel', 'moertel'], ['WDVS', 'wdvs'], ['Zubehör', 'zubehoer'],
]);

const GRUPPENVERSPRECHEN = [
  { gruppe: 'Dämmung', wort: 'XPS' },
  // **Berichtigt am 2. September.** Hier stand „Fassadenplatte". Die Seite
  // verspricht sie seit heute nicht mehr: Der Shop führt EPS nur in dünnen
  // Ausgleichsstärken, nicht in Flächenstärke — die Systemliste sagte es
  // längst, die Landeseite nicht. Der Test hat den Wechsel angezeigt, und
  // genau dafür gibt es die Gegenrichtung: Die Liste darf nicht neben den
  // Seiten herlaufen.
  //
  // Erst stand hier „Ausgleichsplatte" — und die zweite Richtung schlug an:
  // Das Wort findet keinen Artikel, denn die Ware heißt „Fassaden EPS 2 cm".
  // Ein Versprechen, das der Kunde nicht eintippt, ist keines.
  { gruppe: 'Dämmung', wort: 'EPS' },
  { gruppe: 'Dämmung', wort: 'Trittschalldämmplatte' },
  { gruppe: 'Dämmung', wort: 'Folie', findetIn: 'Zubehör' },
  { gruppe: 'Kamin', wort: 'Fertigfuß' },
  { gruppe: 'Kamin', wort: 'Mantelstein' },
  { gruppe: 'Kamin', wort: 'Innenrohr' },
  { gruppe: 'Kamin', wort: 'Putztüranschluss' },
  { gruppe: 'Kamin', wort: 'Zuluft' },
  { gruppe: 'Kamin', wort: 'Trennstein' },
  { gruppe: 'Kamin', wort: 'Regenhaube' },
  { gruppe: 'Kanal', wort: 'Kanalrohr' },
  { gruppe: 'Kanal', wort: 'Bogen' },
  { gruppe: 'Kanal', wort: 'Abzweiger' },
  { gruppe: 'Kanal', wort: 'Schachtring' },
  { gruppe: 'Kanal', wort: 'Grundmauerschutz' },
  { gruppe: 'Mauerwerk', wort: 'Hochlochziegel' },
  { gruppe: 'Mörtel', wort: 'Thermomörtel' },
  { gruppe: 'Mörtel', wort: 'Klebespachtel' },
  { gruppe: 'Mörtel', wort: 'Vergussmörtel' },
  { gruppe: 'Mörtel', wort: 'Dünnbettmörtel', findetIn: 'Kamin' },
  { gruppe: 'WDVS', wort: 'Klebemasse', nichtWoertlich: 'Die Seite schreibt „Klebe- und Spachtelmassen"; ein Kunde tippt das Wort ganz.' },
  { gruppe: 'WDVS', wort: 'Spachtelmasse' },
  { gruppe: 'WDVS', wort: 'Glasgewebe' },
  { gruppe: 'WDVS', wort: 'Dübel' },
  { gruppe: 'WDVS', wort: 'Kantenschutz' },
  { gruppe: 'WDVS', wort: 'Putzgrund' },
  { gruppe: 'WDVS', wort: 'Oberputz' },
  { gruppe: 'Zubehör', wort: 'Schaum' },
  { gruppe: 'Zubehör', wort: 'Klebeband' },
  { gruppe: 'Zubehör', wort: 'Schraube' },
  { gruppe: 'Zubehör', wort: 'Folie' },
];

test('was der Antwortsatz einer Gruppenseite nennt, führt die Gruppe auch', () => {
  // **Gemessen am 30.08.** Fünf der sieben Gruppenseiten versprachen Ware,
  // die dort nicht steht: „Planziegel" (geführt wird ein Hochlochziegel),
  // „Mauermörtel" (nicht im Sortiment), „Anschlussformteile" für den Kamin
  // (nicht im Sortiment), „Dübel" beim Zubehör (stehen unter WDVS),
  // „Trennlagen" bei der Dämmung (steht als Folie beim Zubehör).
  //
  // Diese Sätze stehen als Meta-Beschreibung, als JSON-LD-Antwort und in
  // `llms.txt`. Ein Kunde, der auf „Mörtel" klickt und Mauermörtel sucht,
  // bekam ein Versprechen, das die Gruppe nicht hält.
  const index = bestandsindex();
  assert.ok(GRUPPENVERSPRECHEN.length >= 30, `nur ${GRUPPENVERSPRECHEN.length} Versprechen geprüft`);
  for (const { gruppe, wort, findetIn } of GRUPPENVERSPRECHEN) {
    const treffer = suche(index, wort).filter((t) => t.art === 'artikel');
    assert.ok(treffer.length > 0, `„${wort}" (${gruppe}) findet keinen Artikel`);
    const soll = findetIn ?? gruppe;
    assert.ok(treffer.some((t) => t.gruppe === soll),
      `„${wort}" findet nur ${[...new Set(treffer.map((t) => t.gruppe))].join('/')}, erwartet ${soll}`);
  }
});

test('ein Preisvorteil wird abgerundet, nie aufgerundet', () => {
  // **Gemessen am 30.08.:** `Math.round` machte aus 39,80 % ein „40 % unter
  // Listenpreis". Bei 21 von 39 Artikeln mit Marker stand bis zu ein voller
  // Prozentpunkt zu viel auf der Seite.
  //
  // Kaufmännisch runden ist bei einer Messgröße richtig und bei einem
  // Werbeversprechen falsch: Wer 39,8 % nachlässt und „40 %" schreibt,
  // behauptet 0,2 Punkte, die er nicht gibt.
  assert.equal(vorteil({ uvpNetto: 100, vkNetto: 60.2 }), 39, '39,8 % sind 39, nicht 40');
  assert.equal(vorteil({ uvpNetto: 100, vkNetto: 88.01 }), 11, '11,99 % sind 11');
  assert.equal(vorteil({ uvpNetto: 100, vkNetto: 60 }), 40, 'genau 40 bleibt 40');
  assert.equal(vorteil({ uvpNetto: 100, vkNetto: 80 }), 20, 'und genau 20 bleibt 20');
  // Gate 22: Wer am Listendeckel steht, hat keinen Vorteil zu zeigen.
  assert.equal(vorteil({ uvpNetto: 100, vkNetto: 100, amListendeckel: true }), null);
  assert.equal(vorteil({ vkNetto: 10 }), null, 'ohne Listenpreis kein Vorteil');
});

test('jede Position der Systemlisten hat einen Artikel oder eine Kennzeichnung', () => {
  // **Gemessen am 30.08.** über alle 35 Positionen der vier Systemlisten:
  // Sieben fanden keinen Artikel. Zwei davon waren als fremdes Gewerk
  // gekennzeichnet (Abdichtung, Verfüllmaterial), **fünf nicht** —
  // Anschlussformteil Feuerstätte, Übergangsstücke, Gleitmittel und zweimal
  // die Abschlussschiene.
  //
  // Für Übergangsstücke und Gleitmittel stand die Entscheidung sogar schon
  // im Kundenwörter-Register unter „nicht aufgenommen": Der Shop wusste, dass
  // er sie nicht führt, und schrieb sie trotzdem ungekennzeichnet auf die
  // Bestellliste. Wer danach auszählt, bestellt sie hier — und bekommt sie
  // nicht.
  //
  // Die Liste soll vollständig bleiben: Eine Positionsliste, die nur zeigt,
  // was im Regal liegt, ist ein Angebot. Gekennzeichnet muss sie sein.
  const index = bestandsindex();
  const ordner = fileURLToPath(new URL('../inhalte/system', import.meta.url));
  const dateien = readdirSync(ordner).filter((d) => d.endsWith('.md'));
  assert.ok(dateien.length >= 4, `nur ${dateien.length} Systemlisten`);
  let positionen = 0;
  for (const datei of dateien) {
    const text = readFileSync(join(ordner, datei), 'utf8');
    const zeilen = [...text.matchAll(/^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|([^|]*)\|([^|]*)\|/gm)];
    assert.ok(zeilen.length >= 7, `${datei}: nur ${zeilen.length} Positionen`);
    for (const [, nummer, benennung, , vermerk] of zeilen) {
      positionen++;
      const woerter = benennung.split(/[^\p{L}]+/u).filter((w) => w.length >= 4);
      const gefunden = woerter.some((w) => suche(index, w).some((t) => t.art === 'artikel'));
      if (/nicht im Sortiment/.test(benennung + vermerk)) {
        // **Die Gegenrichtung, und die gefährlichere.** Eine Kennzeichnung an
        // einer Ware, die es sehr wohl gibt, schickt den Kunden woandershin —
        // still, ohne Fehlermeldung. Der erste Wurf dieser Probe ließ genau
        // das durch: „Armierungsmörtel *(nicht im Sortiment)*" fiel nicht auf.
        assert.equal(gefunden, false,
          `${datei} Position ${nummer} „${benennung}": als nicht geführt gekennzeichnet, aber im Katalog`);
        continue;
      }
      if (/eigenes Gewerk/.test(benennung + vermerk)) continue;
      assert.ok(gefunden,
        `${datei} Position ${nummer} „${benennung}": kein Artikel und keine Kennzeichnung`);
    }
  }
  assert.ok(positionen >= 30, `nur ${positionen} Positionen geprüft`);
});

test('die Versprechensliste steht wirklich auf den Seiten', () => {
  // **Die Grenze der Probe darüber**, benannt und so weit wie möglich
  // geschlossen: Sie prüft eine von Hand geführte Liste, nicht den Satz auf
  // der Seite. Schriebe jemand „Mauermörtel" zurück in den Antwortsatz, ohne
  // die Liste anzufassen, bliebe sie stumm.
  //
  // Dagegen hilft die Gegenrichtung: Jedes Wort der Liste muss im
  // Antwortsatz seiner Seite wirklich vorkommen. Damit kann die Liste nicht
  // zur Erzählung werden, die neben den Seiten herläuft. Was sie **nicht**
  // leistet: neue Wörter im Satz bemerken. Dafür bräuchte es ein Wörterbuch,
  // das Ware von Nichtware trennt — „Auswahl", „Einbauort" und
  // „Wärmeschutznachweis" stehen in denselben Sätzen.
  for (const { gruppe, wort, nichtWoertlich } of GRUPPENVERSPRECHEN) {
    if (nichtWoertlich) continue;
    const datei = pfad(`../inhalte/gruppen/${GRUPPENDATEI.get(gruppe)}.md`);
    const text = readFileSync(datei, 'utf8');
    const anfang = text.indexOf('Die Antwort in zwei Sätzen');
    assert.ok(anfang > 0, `${gruppe}: kein Antwortabsatz`);
    const staemme = new Set(wortstaemme(text.slice(anfang, text.indexOf('\n\n', anfang))));
    assert.ok(staemme.has(stamm(wort.toLowerCase())),
      `„${wort}" steht nicht im Antwortsatz der Gruppe ${gruppe}`);
  }
});

test('ein Wortteil findet das Kompositum auch nach dem Stutzen', () => {
  // **Der Befund vom 30.08.**, einen Tag nach dem Wortstamm: „bogen" fand
  // nichts, obwohl der Shop zwei PVC Kanalbögen führt — vorher fand es beide.
  //
  // Die Mindeststammlänge gilt für das ganze Wort: `kanalbogen` verliert sein
  // `-en`, das alleinstehende `bogen` behält es, weil `bog` zu kurz wäre. Und
  // `kanalbog` enthält `bogen` nicht mehr. Der Stamm half der Beugung und
  // schadete dem Wortteil.
  const index = bestandsindex();
  const skus = (frage) => suche(index, frage).filter((t) => t.art === 'artikel').map((t) => t.sku).sort();
  const bogen = skus('bogen');
  assert.ok(bogen.length >= 2, `„bogen" findet ${bogen.length} Artikel`);
  assert.deepEqual(skus('kanalbogen'), bogen, 'das ganze Wort findet dasselbe');
  assert.deepEqual(skus('kanalbögen'), bogen, 'und die Mehrzahl auch');
  // Der Index trägt beides, die Frage nur den Stamm:
  const drin = indexwoerter('PVC Kanalbogen NW 100 45 grad');
  assert.ok(drin.includes('kanalbog'), 'der Stamm fehlt im Index');
  assert.ok(drin.includes('kanalbogen'), 'die ungestutzte Form fehlt im Index');
  assert.deepEqual(wortstaemme('kanalbogen'), ['kanalbog'], 'die Frage trägt nur den Stamm');
});

test('der Wortstamm schneidet keine Wortstämme an', () => {
  // Zwei Längensperren halten den Stamm zusammen: Unter fünf Zeichen wird gar
  // nicht gestutzt, und was übrig bleibt, behält mindestens vier. Ohne die
  // zweite wird aus „Boden" ein „bod".
  assert.equal(stamm('boden'), 'boden', 'der Reststamm wäre zu kurz');
  assert.equal(stamm('ziegel'), 'ziegel', 'el ist keine Endung dieser Stufe');
  assert.equal(stamm('kamin'), 'kamin', 'zu kurz für jede Endung');
  assert.equal(stamm('haus'), 'haus', 'das s gehört zum Wort');
  assert.equal(stamm('hause'), 'haus', 'die Endung dagegen fällt');
  // „mauer" verliert sein e nicht an die Endungsregel, sondern an die
  // Normalform: ue wird zu u, damit „duebel" den Dübel findet. Ein
  // hingenommener Preis, kein Versehen — er trifft Index und Frage gleich,
  // und „grundmauerschutz" findet sich deshalb weiterhin selbst.
  assert.equal(stamm('mauer'), 'maur');
  // Und die Beugung fällt wirklich zusammen:
  assert.equal(stamm('dämmplatten'), stamm('dämmplatte'));
  assert.equal(stamm('kanalbögen'), stamm('kanalbogen'));
  assert.equal(stamm('moertel'), stamm('mörtel'));
});

test('was der Shop nicht führt, bleibt auch mit Wortstamm unauffindbar', () => {
  // Die Gegenrichtung zur Pluralprobe: Ein Stemmer, der zu viel abschneidet,
  // macht aus zwei Wörtern eines. Geprüft an genau der Liste, die das
  // Register begründet **nicht** aufgenommen hat — dort wäre ein
  // Zufallstreffer am teuersten, weil er auf Ersatzware zeigt.
  const index = bestandsindex();
  const abgelehnt = (suchwoerterDatei._nichtAufgenommen ?? []).map((e) => e.wort);
  assert.ok(abgelehnt.length >= 20, `nur ${abgelehnt.length} Ablehnungen — die Schleife prüft zu wenig`);
  for (const wort of abgelehnt) {
    const treffer = suche(index, wort).filter((t) => t.art === 'artikel');
    assert.equal(treffer.length, 0, `„${wort}" findet auf einmal ${treffer.map((t) => t.titel).join(', ')}`);
  }
});

/* ------------------------------------------------------------------ *
 * Zentimeter und Millimeter sind dasselbe Maß
 * ------------------------------------------------------------------ */

test('cm und mm finden einander', () => {
  // Gemessen am 29.08.: „xps 8 cm" fand nichts, obwohl der Shop XPS in
  // 80 mm führt. Dass „eps 5 cm" ging, war Zufall — die EPS-Platten heißen
  // im Katalog in Zentimetern, die XPS-Platten in Millimetern.
  const index = bestandsindex();
  const namen = (frage) => suche(index, frage).filter((t) => t.art === 'artikel').map((t) => t.titel);

  const achtCm = namen('xps 8 cm');
  assert.ok(achtCm.length >= 2, `„xps 8 cm" findet ${achtCm.length} Artikel`);
  for (const n of achtCm) assert.match(n, /80 mm/);
  assert.deepEqual(namen('xps 80 mm').sort(), achtCm.sort());

  // Und die Gegenrichtung: Der Katalog schreibt Zentimeter, der Kunde tippt
  // Millimeter.
  const fuenfzigMm = namen('eps 50 mm');
  assert.ok(fuenfzigMm.length >= 1);
  for (const n of fuenfzigMm) assert.match(n, /5 cm/);
});

test('Meter und Quadratmeter bleiben unberührt', () => {
  // Aus „1,1x50 m" eine Länge in Millimetern zu machen hieße, eine Kante zu
  // erfinden — dieselbe Regel wie bei der Plattenstärke.
  assert.ok(wortstaemme('Baumit TextilglasGitter 1,1x50 m').every((w) => !w.endsWith('mm')));
  assert.ok(wortstaemme('Fassaden EPS 2 cm 0,5 m2').includes('20mm'));
  assert.ok(!wortstaemme('Isover TDPT 20 1200 600 mm 8,64 m2').includes('200mm'),
    'die 20 ist eine Typkennung, kein Maß');
});

test('die neuen Kundenwörter führen zu genau der gemeinten Ware', () => {
  // Die Messung vom 29.08., als Probe festgehalten: 78 Baustellenwörter
  // gegen den Bestand, elf davon fanden nichts und meinten trotzdem Ware.
  const index = bestandsindex();
  const erstes = (frage) => (suche(index, frage).filter((t) => t.art === 'artikel')[0] ?? {}).titel;
  assert.match(erstes('kaminrohr'), /SIKM Rohr/);
  assert.match(erstes('styrodur'), /XPS/);
  assert.match(erstes('dübelteller'), /Rondelle/);
  assert.match(erstes('rondellen'), /Rondelle/);
  assert.match(erstes('abdeckband'), /Abdeckklebeband/);
  assert.match(erstes('malerband'), /Abdeckklebeband/);
  assert.match(erstes('fensteranschluss'), /Gewebeanschlussleiste/);
  assert.match(erstes('laibung'), /Gewebeanschlussleiste/);
  assert.match(erstes('klebespachtelmasse'), /Spachtel/i);
});


test('jede Ablehnung trägt zwei Texte: eine Begründung und eine Antwort', () => {
  // Zwei Fragen, zwei Texte. `warum` erklärt dem nächsten Lauf die
  // redaktionelle Entscheidung, `antwort` beantwortet die Frage des Kunden.
  // Den einen für den anderen zu halten wäre derselbe Fehler wie eine
  // Funktion, die zwei Fragen auf einmal beantwortet — und der Kunde läse
  // Sätze über den Suchindex statt über die Ware.
  assert.ok(suchwoerterDatei._nichtAufgenommen.length >= 20);
  for (const e of suchwoerterDatei._nichtAufgenommen) {
    assert.ok(String(e.antwort ?? '').trim().length > 25, `„${e.wort}": keine Kundenantwort`);
    // Die Antwort spricht über Ware, nicht über die Mechanik des Shops.
    for (const wort of ['Suchwort', 'Suchindex', 'Treffer wäre', 'Register', 'Wissensseite']) {
      assert.ok(!e.antwort.includes(wort),
        `„${e.wort}": die Antwort spricht über den Shop statt über die Ware („${wort}")`);
    }
    // Und sie steht für sich — ein Verweis auf einen anderen Eintrag wäre
    // auf der Seite unlesbar.
    assert.doesNotMatch(e.antwort, /^(siehe|wie) /i, `„${e.wort}": Verweis statt Antwort`);
  }
});

/**
 * **Gemessen am 01.09.:** „XPS Platten kaufen" und „WDVS System kaufen" —
 * zwei Keywords des ersten Anzeigenanlaufs — fanden nichts. Nicht weil das
 * Sortiment fehlt, sondern weil **alle** Suchwörter treffen müssen und
 * „kaufen" in keinem Artikelnamen steht. Der Shop verkauft; dass jemand
 * kaufen will, schränkt das Sortiment nicht ein.
 */
test('Absichtswörter machen eine Suche nicht leer — allein sind sie aber keine', async () => {
  const { ABSICHTSWOERTER } = await import('../src/shopkern.js');
  assert.ok(ABSICHTSWOERTER.length > 0, 'keine Absichtswörter — die Schleifen darunter prüfen nichts');

  const index = baueSuchindex({
    artikel: [
      { sku: 'A-1', bezeichnung: 'XPS glatt SF 50 mm', gruppe: 'Dämmung' },
      { sku: 'A-2', bezeichnung: 'Capatect Putzgrund weiß', gruppe: 'WDVS' },
    ],
    seiten: [],
    suchwoerter: [],
  });

  const ohne = suche(index, 'XPS', { grenze: 5 }).map((t) => t.sku);
  assert.deepEqual(ohne, ['A-1'], 'die Ausgangssuche findet den Artikel nicht');

  // Jedes Absichtswort einzeln darf das Ergebnis nicht kippen.
  for (const w of ABSICHTSWOERTER) {
    const mit = suche(index, `XPS ${w}`, { grenze: 5 }).map((t) => t.sku);
    assert.deepEqual(mit, ohne, `„XPS ${w}" findet etwas anderes als „XPS"`);
  }

  // Eine Frage aus lauter Absicht bleibt leer. Eine Suche, die auf „kaufen"
  // das ganze Sortiment ausschüttet, hat nicht verstanden, was gefragt war.
  assert.deepEqual(suche(index, ABSICHTSWOERTER.join(' '), { grenze: 5 }), []);
  for (const w of ABSICHTSWOERTER) {
    assert.deepEqual(suche(index, w, { grenze: 5 }), [], `„${w}" allein liefert Treffer`);
  }

  // Und ein Wort, das die Suche nicht kennt, schränkt weiterhin ein — sonst
  // wäre aus dem Ausnahmefall eine allgemeine Aufweichung geworden.
  assert.deepEqual(suche(index, 'XPS Regenrinne', { grenze: 5 }), []);
});
