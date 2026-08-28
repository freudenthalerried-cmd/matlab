import test from 'node:test';
import assert from 'node:assert/strict';
import { suchname, taugtAlsKeyword, kurzform } from '../bin/kampagne.mjs';

/* ------------------------------------------------------------------ *
 * Aus einer Katalogbezeichnung einen Suchbegriff machen
 *
 * Der erste Wurf schnitt einfach ab und erzeugte Fragmente wie
 * „Baumit TextilglasGitter 1,1x" — schlimmer als gar kein Keyword, weil ein
 * Konto voller solcher Zeilen gepflegt aussieht und nichts einbringt.
 * ------------------------------------------------------------------ */

test('Gebindeangaben fallen weg, der Produktname bleibt', () => {
  assert.equal(suchname('XPS glatt SF 80 mm 0,75 m2'), 'XPS glatt SF 80 mm');
  assert.equal(suchname('Baumit KlebeSpachtel 25 kg'), 'Baumit KlebeSpachtel');
  assert.equal(suchname('Soudal Perimeterkleber B3 750 ml'), 'Soudal Perimeterkleber B3');
});

test('Ein abgeschnittenes Maß bleibt nicht als Rest stehen', () => {
  // Der Fehler, der die erste Fassung unbrauchbar machte.
  const s = suchname('Baumit TextilglasGitter 1,1x50 m');
  assert.equal(s, 'Baumit TextilglasGitter');
  assert.doesNotMatch(s, /x$/, 'endet auf ein halbes Maß');
  assert.doesNotMatch(s, /[,;]$/);
});

test('Farbangaben fallen weg — auch die mit ß', () => {
  // JavaScripts \b ist ASCII-basiert: „ß" gilt ihr nicht als Wortzeichen,
  // `weiß\b` trifft deshalb nie. Dieselbe Falle hat schon die ÖNORM-Regel
  // des Hohlheitsprüfers blind gemacht.
  assert.equal(suchname('Capatect Putzgrund weiß 25 kg'), 'Capatect Putzgrund');
  assert.equal(suchname('Capatect Glasgewebe M, Breite 110cm, orange 55 m2'), 'Capatect Glasgewebe M');
});

/* ------------------------------------------------------------------ *
 * Die Prüfung, ob ein Begriff überhaupt gesucht wird
 * ------------------------------------------------------------------ */

test('Zu kurze, zu lange und fragmentierte Begriffe fallen durch', () => {
  assert.equal(taugtAlsKeyword('XPS').taugt, false);
  assert.equal(taugtAlsKeyword('Capatect Klebe- und Spachtelmasse 186 M').taugt, false);
  assert.equal(taugtAlsKeyword('Baumit TextilglasGitter 1,1x,').taugt, false);
  assert.equal(taugtAlsKeyword('120 50 30').taugt, false);
});

test('Katalognummern sind keine Suchbegriffe', () => {
  const u = taugtAlsKeyword('Capatect Universaldübel 053115');
  assert.equal(u.taugt, false);
  assert.match(u.grund, /Katalognummer/);
});

test('Was ein Mensch eingibt, kommt durch', () => {
  for (const gut of ['XPS 80 mm', 'Capatect 186 M', 'Kanalrohr DN 100', 'Schiedel Kamin', 'Isover TDPT 20']) {
    assert.equal(taugtAlsKeyword(gut).taugt, true, `„${gut}" sollte durchkommen`);
  }
});

test('Genau sechs Zeichen genügen, fünf nicht', () => {
  // Die Kante, an der die Längenregel entscheidet. Ohne diesen Fall bliebe
  // eine Vertauschung von < und <= unbemerkt.
  assert.equal(taugtAlsKeyword('abcdef').taugt, true);
  assert.equal(taugtAlsKeyword('abcde').taugt, false);
});

test('Genau fünf Wörter genügen, sechs nicht', () => {
  assert.equal(taugtAlsKeyword('ein zwei drei vier fuenf').taugt, true);
  assert.equal(taugtAlsKeyword('ein zwei drei vier fuenf sechs').taugt, false);
});

/* ------------------------------------------------------------------ *
 * Kurzform: Marke plus Typkennung
 * ------------------------------------------------------------------ */

test('Aus dem Katalognamen wird die Bestellbezeichnung', () => {
  assert.equal(kurzform('Capatect Klebe- und Spachtelmasse 186 M 25 kg', 'Capatect'), 'Capatect 186 M');
  assert.equal(kurzform('Capatect Klebe- und Spachtelmasse 190 FEIN 25 kg', 'Capatect'), 'Capatect 190 FEIN');
  assert.equal(kurzform('Isover TDPT 20 1200 600 mm 8,64 m2', 'Isover'), 'Isover TDPT 20');
});

test('Das M hinter der Nummer gehört dazu — es trennt zwei Produkte', () => {
  // Ohne den einzelnen Großbuchstaben bliebe „Capatect 186", und das
  // trifft 186 M und 186 zugleich.
  assert.match(kurzform('Capatect Klebe- und Spachtelmasse 186 M 25 kg', 'Capatect'), / M$/);
});

test('Vierstellige Zahlen sind Maße, keine Typkennung', () => {
  const k = kurzform('Isover TDPT 20 1200 600 mm 8,64 m2', 'Isover');
  assert.doesNotMatch(k, /1200/);
});

test('Ohne erkennbare Typkennung gibt es keine Kurzform', () => {
  assert.equal(kurzform('Capatect Polystyrol-Rondelle für Universaldübel Holz', 'Capatect'), null);
  assert.equal(kurzform('Irgendwas ohne Marke', null), null);
});

/* ------------------------------------------------------------------ *
 * Die Rechnung hinter den Höchstgeboten
 * ------------------------------------------------------------------ */

test('das Werkzeug rechnet mit denselben Zahlen wie der Warenkorb', async () => {
  // Anlass: Dieses Werkzeug baut sein Kostenbild von Hand zusammen, statt
  // `berechneWarenkorb` zu rufen — und bekam deshalb die Untergrenze für
  // Palette und Folierung vom 28.08. zuerst nicht mit. Die Höchstgebote
  // hingen an einem Deckungsbeitrag, der je Gruppe um 28,50 € zu hoch war.
  //
  // Diese Probe führt das Werkzeug **aus** und hält seine Ausgabe gegen die
  // Bibliothek. Sie fällt, sobald die beiden Wege wieder auseinanderlaufen.
  const { existsSync, readFileSync } = await import('node:fs');
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
  const preise = pfad('../../preise/baustoff-preise.json');
  if (!existsSync(preise)) return; // ohne Preisdatei keine Aussage — und keine falsche

  const { WARENKOERBE } = await import('../bin/kampagne.mjs');
  const { ladeBaustoffkatalog } = await import('../src/baustoffkatalog.js');
  const { nebenkostenUntergrenze } = await import('../src/warenkorb.js');
  const { traegtSichSelbst } = await import('../src/kostenbild.js');
  const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const lieferantenDatei = lies(pfad('../data/lieferanten.json'));
  const k = ladeBaustoffkatalog(lies(pfad('../data/katalog-baustoff.json')), lies(preise), lieferantenDatei);
  const bySku = new Map(k.artikel.map((a) => [a.sku, a]));
  const lieferant = lieferantenDatei.lieferanten.find((l) => l.id === 'poschacher');

  const lauf = spawnSync(process.execPath, [pfad('../bin/kampagne.mjs')], { encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stderr);

  const gruppen = Object.keys(WARENKOERBE);
  assert.ok(gruppen.length >= 5, `nur ${gruppen.length} Warenkörbe`);
  let geprueft = 0;
  for (const [gruppe, korb] of Object.entries(WARENKOERBE)) {
    const zeile = lauf.stdout.split('\n').find((z) => z.trim().startsWith(gruppe));
    if (!zeile) continue; // übersprungene Gruppen nennt das Werkzeug an anderer Stelle
    const artikel = korb.positionen.map((p) => bySku.get(p.sku));
    if (artikel.some((a) => !a)) continue;

    const warenwertNetto = korb.positionen.reduce((s, p) => s + bySku.get(p.sku).vkNetto * p.menge, 0);
    const einkaufNetto = korb.positionen.reduce((s, p) => s + bySku.get(p.sku).ekNetto * p.menge, 0);
    const sperrgut = artikel.filter((a) => a.sperrgut).length;
    const frachtNetto = lieferant.fracht.pauschaleNetto + sperrgut * (lieferant.fracht.sperrgutZuschlagNetto ?? 0);
    const { nebenkostenUntergrenzeNetto } = nebenkostenUntergrenze(artikel, lieferant);
    const erwartet = traegtSichSelbst(
      { warenwertNetto, einkaufNetto, frachtNetto, nebenkostenUntergrenzeNetto },
      { frachtVerrechnet: true },
    ).deckungsbeitragNetto;

    assert.ok(zeile.includes(erwartet.toFixed(2)),
      `${gruppe}: das Werkzeug meldet „${zeile.trim()}", die Bibliothek rechnet ${erwartet.toFixed(2)} €`);
    geprueft++;
  }
  assert.ok(geprueft >= 5, `nur ${geprueft} Gruppen verglichen`);
});

test('eine Gruppe mit palettierter Ware trägt die Nebenkosten', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
  if (!existsSync(pfad('../../preise/baustoff-preise.json'))) return;
  const { WARENKOERBE } = await import('../bin/kampagne.mjs');
  const { nebenkostenUntergrenze } = await import('../src/warenkorb.js');
  const lieferantenDatei = JSON.parse(readFileSync(pfad('../data/lieferanten.json'), 'utf8'));
  const lieferant = lieferantenDatei.lieferanten.find((l) => l.id === 'poschacher');
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
  const bySku = new Map(katalog.artikel.map((a) => [a.sku, a]));

  const artikel = WARENKOERBE['Dämmung'].positionen.map((p) => bySku.get(p.sku)).filter(Boolean);
  assert.ok(artikel.length >= 1);
  assert.equal(nebenkostenUntergrenze(artikel, lieferant).nebenkostenUntergrenzeNetto, 28.5,
    'die Dämmplatte kommt auf der Palette — Palette und Folierung gehören in die Rechnung');
});
