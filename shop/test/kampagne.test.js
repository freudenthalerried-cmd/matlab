import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { suchname, taugtAlsKeyword, kurzform } from '../bin/kampagne.mjs';
import { LIEFERGEBIET, bezirksliste } from '../src/liefergebiet.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

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

/* ------------------------------------------------------------------ *
 * Jede Anzeige sagt, wohin geliefert wird
 * ------------------------------------------------------------------ */

test('Keine Anzeige nennt eine Region außerhalb des Liefergebiets', () => {
  // **Befund vom 31.08.** Vier der sechs Anzeigen warben „im Mühlviertel",
  // eine „im Umkreis von Linz". Beides ist nicht das Liefergebiet:
  //
  //   Mühlviertel   = Perg, Urfahr-Umgebung, Freistadt **und Rohrbach**
  //   Liefergebiet  = Perg, Urfahr-Umgebung, Freistadt, Linz-Land, Linz
  //
  // Die Anzeigen versprachen einen Bezirk zu viel und ließen die beiden
  // größten aus. Dasselbe wie eine tote Ziel-URL, nur subtiler: Man bezahlt
  // für Klicks, die in der Kasse abgelehnt werden.
  const datei = pfad('../ausgabe/kampagne/anzeigen.csv');
  if (!existsSync(datei)) return;
  const zeilen = readFileSync(datei, 'utf8').trim().split('\n');
  assert.ok(zeilen.length >= 2, `nur ${zeilen.length - 1} Anzeigen — prüft zu wenig`);

  // Landschaftsnamen, die nicht deckungsgleich mit dem Liefergebiet sind.
  const verboten = ['Mühlviertel', 'Innviertel', 'Hausruckviertel', 'Traunviertel',
    'Oberösterreich', 'österreichweit', 'Umkreis'];
  assert.ok(verboten.length >= 5, 'die Liste ist leer geworden — dann prüft die Schleife nichts');
  for (const zeile of zeilen.slice(1)) {
    for (const wort of verboten) {
      assert.ok(!zeile.includes(wort),
        `Eine Anzeige wirbt mit „${wort}" — das deckt sich nicht mit dem Liefergebiet`);
    }
  }
});

test('Jede Anzeige nennt das Liefergebiet, auch die mit dem höchsten Ertrag', () => {
  // Kamin trug gar keine Ortsangabe — ausgerechnet die Gruppe mit dem größten
  // Deckungsbeitrag, in die der erste Euro Werbebudget fließen soll.
  const datei = pfad('../ausgabe/kampagne/anzeigen.csv');
  if (!existsSync(datei)) return;
  const zeilen = readFileSync(datei, 'utf8').trim().split('\n').slice(1);
  // **Nicht `>= 4`.** Dort stand der Bestand von gestern als Literal, und als
  // das Budget am 31.08. auf die tragenden Gruppen konzentriert wurde, fiel
  // diese Probe um, obwohl nichts kaputt war — zum fünften Mal dieselbe
  // Falle. Geprüft gehört die Regel: **je Kampagne genau eine Anzeige.**
  const kampagnen = readFileSync(pfad('../ausgabe/kampagne/kampagnen.csv'), 'utf8')
    .trim().split('\n').slice(1);
  assert.ok(kampagnen.length >= 1, 'keine Kampagne ausgegeben');
  assert.equal(zeilen.length, kampagnen.length,
    `${zeilen.length} Anzeigen für ${kampagnen.length} Kampagnen`);

  const bezirke = LIEFERGEBIET.bezirke.map((b) => b.name);
  assert.ok(bezirke.length >= 3, `nur ${bezirke.length} Bezirke — dann prüft die Schleife zu wenig`);
  for (const zeile of zeilen) {
    const gruppe = zeile.split(',')[1];
    for (const bezirk of bezirke) {
      assert.ok(zeile.includes(bezirk),
        `Anzeige „${gruppe}" nennt den Bezirk ${bezirk} nicht`);
    }
  }
});

test('Die Ortsangaben halten die Zeichengrenzen ein', () => {
  // Ein gekürztes Liefergebiet wäre ein falsches — deshalb bricht das
  // Werkzeug ab, statt die Überschrift zu beschneiden. Diese Probe hält
  // fest, dass die erzeugte Angabe hineinpasst.
  const kurz = `Lieferung ${LIEFERGEBIET.bezirke[0].name} bis ${LIEFERGEBIET.bezirke.at(-1).name}`;
  const lang = `Geliefert wird in die Bezirke ${bezirksliste()}.`;
  assert.ok(kurz.length <= 30, `Überschrift ${kurz.length} Zeichen: „${kurz}"`);
  assert.ok(lang.length <= 90, `Beschreibung ${lang.length} Zeichen: „${lang}"`);
});

/* ------------------------------------------------------------------ *
 * Das Budget geht an die Gruppen, die es tragen
 * ------------------------------------------------------------------ */

const kampagnenDatei = pfad('../ausgabe/kampagne/kampagnen.csv');
const spaeterDatei = pfad('../ausgabe/kampagne/spaeter-pruefen.csv');
const zeilenVon = (datei) => readFileSync(datei, 'utf8').trim().split('\n').slice(1);

test('Das Tagesbudget wird konzentriert, nicht über alle Gruppen gestreut', () => {
  // **Befund vom 31.08.** Zehn Euro durch sechs Gruppen sind 1,67 € je Gruppe
  // und Tag. Nachgerechnet bei 1,00 € Klickpreis: 50 Klicks im Monat je
  // Gruppe, also 0,5 Bestellungen bei 1 % Kaufquote — im erwarteten Fall
  // bringt **keine einzige Gruppe** eine Bestellung im ersten Monat. Und aus
  // fünfzig Klicks ohne Bestellung lässt sich die Kaufquote nicht schätzen.
  // Man bezahlt für Rauschen.
  if (!existsSync(kampagnenDatei)) return;
  const zeilen = zeilenVon(kampagnenDatei);
  assert.ok(zeilen.length >= 1, 'keine Kampagne ausgegeben');

  const budgets = zeilen.map((z) => Number(z.split(',')[3]));
  assert.equal(budgets.length, zeilen.length, 'jede Kampagne braucht ein Budget');
  const summe = budgets.reduce((s, b) => s + b, 0);
  // Das gesamte Budget wird vergeben, nur eben auf weniger Gruppen.
  assert.ok(Math.abs(summe - 10) < 0.05, `Budgetsumme ${summe.toFixed(2)} € statt 10 €`);
  for (const b of budgets) {
    assert.ok(b >= 3, `${b} € je Tag kauft bei Marktpreisen keinen belastbaren Klickstrom`);
  }
});

test('Zurückgestellte Gruppen stehen in einer eigenen Datei, mit Grund', () => {
  // Zurückgestellt, nicht verworfen: Sie kommen dazu, sobald eine gemessene
  // Kaufquote vorliegt. Getrennt, damit niemand sie versehentlich mit
  // hochlädt und das Budget wieder streut.
  if (!existsSync(spaeterDatei)) return;
  const zeilen = zeilenVon(spaeterDatei);
  assert.ok(zeilen.length >= 1, 'keine zurückgestellte Gruppe — dann prüft dieser Fall nichts');
  for (const z of zeilen) {
    assert.match(z, /wartet auf eine gemessene Kaufquote/, `ohne Grund: ${z}`);
  }

  // Und keine davon steht zugleich in den Kampagnen.
  const imAnlauf = zeilenVon(kampagnenDatei).map((z) => z.split(',')[0]);
  for (const z of zeilen) {
    const gruppe = z.split(',')[0];
    assert.ok(!imAnlauf.includes(`Baustoffe ${gruppe}`),
      `${gruppe} steht in beiden Dateien`);
  }
});

test('Anzeigen und Keywords folgen dem ersten Anlauf', () => {
  // Ein Keyword ohne Anzeigengruppe lädt nicht, und eine Anzeige für eine
  // Gruppe ohne Budget wirbt nicht. Alle drei Dateien müssen dieselbe Menge
  // Gruppen führen — sonst ist der Import halb.
  for (const datei of ['anzeigen.csv', 'keywords.csv']) {
    const voll = pfad(`../ausgabe/kampagne/${datei}`);
    if (!existsSync(voll)) continue;
    const gruppenDrin = new Set(zeilenVon(voll).map((z) => z.split(',')[1]));
    const zurueck = zeilenVon(spaeterDatei).map((z) => z.split(',')[0]);
    assert.ok(zurueck.length >= 1, 'keine zurückgestellte Gruppe zum Vergleich');
    for (const g of zurueck) {
      assert.ok(!gruppenDrin.has(g), `${datei} führt die zurückgestellte Gruppe ${g}`);
    }
  }
});
