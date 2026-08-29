import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  wortstaemme, baueSuchindex, suche, sortiere, filtere, filterwerte, vorteil,
  ladeKorb, speichereKorb, legeInKorb, setzeMenge, korbPositionen, bereinige,
  kundenWarenkorb, oeffentlicherArtikel, oeffentlicherLieferant, kundenwoerter,
  abstand, erlaubterAbstand, meintenSie, KORBSCHLUESSEL,
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

test('der Warenkorb rechnet Fracht und Sperrgutzuschlag', () => {
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
  const vorher = baueSuchindex({ artikel: katalogDatei.artikel });
  const nachher = bestandsindex();
  const stumm = [
    'noppenbahn', 'dämmplatte', 'styropor', 'armierungsmörtel', 'klebemörtel', 'bauschaum',
    'montageschaum', 'baufolie', 'pe-folie', 'schornstein', 'rauchfang', 'sockeldämmung',
    'perimeterdämmung', 'vollwärmeschutz', 'trittschalldämmung', 'ziegel', 'tellerdübel',
    'anputzleiste',
  ];
  assert.equal(stumm.length, 18);
  for (const w of stumm) {
    assert.equal(suche(vorher, w).length, 0, `„${w}" fand vorher schon etwas — die Messung stimmt nicht`);
    assert.ok(suche(nachher, w).some((x) => x.art === 'artikel'), `„${w}" findet weiterhin nichts`);
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

test('acht Vertipper, die vorher nichts fanden, bekommen einen Vorschlag', () => {
  // Die Messung vom 28. August, als Probe festgehalten.
  const index = bestandsindex();
  const vertipper = {
    kanalror: 'kanalrohr',
    'dämmplate': 'dämmplatte',
    rauchfng: 'rauchfang',
    styropr: 'styropor',
    kantenschuz: 'kantenschutz',
    schachtrng: 'schachtring',
    gewbe: 'gewebe',
    spachtl: 'spachtelmasse',
  };
  assert.equal(Object.keys(vertipper).length, 8);
  for (const [falsch, erwartet] of Object.entries(vertipper)) {
    assert.equal(suche(index, falsch).length, 0, `„${falsch}" findet auf einmal etwas — die Messung stimmt nicht`);
    const vorschlaege = meintenSie(index, falsch);
    assert.equal(vorschlaege[0], erwartet, `„${falsch}" → ${JSON.stringify(vorschlaege)}`);
  }
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

test('derselbe Vorschlag erscheint nicht zweimal in zwei Schreibweisen', () => {
  // Der Index legt jedes Wort mit und ohne Umlaut ab. Als Vorschlag sind sie
  // ein Wort — zwei Zeilen mit demselben Wort sehen aus wie ein Fehler.
  const index = bestandsindex();
  const mit = meintenSie(index, 'dämmplate');
  assert.equal(mit[0], 'dämmplatte', 'wer Umlaute tippt, bekommt Umlaute');
  assert.ok(!mit.includes('daemmplatte'));
  const ohne = meintenSie(index, 'daemmplate');
  assert.equal(ohne[0], 'daemmplatte');
  assert.ok(!ohne.includes('dämmplatte'));
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
