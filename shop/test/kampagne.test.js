import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { suchname, taugtAlsKeyword, kurzform, alleAnzeigentexte, pruefeTexte, ANZEIGENTEXTE } from '../bin/kampagne.mjs';
import { LIEFERGEBIET, bezirksliste } from '../src/liefergebiet.js';
import { WARENGRUPPEN, GRUPPENSEITE } from '../src/artikelliste.js';
import { join } from 'node:path';

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

test('Jede Anzeige zeigt auf eine Seite, die wirklich gebaut ist', () => {
  // **Der teuerste Fund des Tages.** Die Ziel-URL war der Google-*Anzeigepfad*
  // — das Zierwerk, das unter der Adresse eingeblendet wird. Alle drei
  // Anzeigen des ersten Anlaufs zeigten damit auf Seiten, die es nicht gibt:
  //
  //   bauversand.com/fassade    →  gebaut ist gruppe/wdvs.html
  //   bauversand.com/daemmung   →  gebaut ist gruppe/daemmung.html
  //   bauversand.com/kamin      →  gebaut ist gruppe/kamin.html
  //
  // Jeder Klick wäre bezahlt und auf einer Fehlerseite gelandet. Diese Probe
  // schlägt die Adresse im gebauten Ordner nach, statt sie zu lesen.
  const anzeigenDatei = pfad('../ausgabe/kampagne/anzeigen.csv');
  const siteOrdner = pfad('../ausgabe/site');
  if (!existsSync(anzeigenDatei) || !existsSync(siteOrdner)) return;

  const kopf = readFileSync(anzeigenDatei, 'utf8').trim().split('\n')[0].split(',');
  const spalte = kopf.indexOf('Finale URL');
  assert.ok(spalte >= 0, 'keine Spalte „Finale URL"');
  const zeilen = readFileSync(anzeigenDatei, 'utf8').trim().split('\n').slice(1);
  assert.ok(zeilen.length >= 1, 'keine Anzeige — dann prüft diese Probe nichts');

  for (const zeile of zeilen) {
    const url = zeile.split(',')[spalte];
    const pfadTeil = new URL(url).pathname.replace(/^\/+/, '');
    assert.ok(pfadTeil.endsWith('.html'), `${url} zeigt nicht auf eine Seite`);
    assert.ok(existsSync(join(siteOrdner, pfadTeil)),
      `${url} zeigt ins Leere — ${pfadTeil} ist nicht gebaut`);
  }
});

test('Jede Warengruppe hat eine Seitenkennung, und jede Kennung eine Gruppe', () => {
  // Die Zuordnung ist die Zusicherung. Wer eine Warengruppe ergänzt und die
  // Kennung vergisst, bekommt hier den Befund — und nicht erst, wenn eine
  // Anzeige für sie ins Leere zeigt.
  assert.ok(WARENGRUPPEN.length >= 5, `nur ${WARENGRUPPEN.length} Warengruppen`);
  for (const g of WARENGRUPPEN) {
    assert.ok(GRUPPENSEITE[g], `die Warengruppe „${g}" hat keine Seitenkennung`);
    assert.match(GRUPPENSEITE[g], /^[a-z]+$/, `„${GRUPPENSEITE[g]}" taugt nicht als Adresse`);
  }
  const kennungen = Object.keys(GRUPPENSEITE);
  assert.equal(kennungen.length, WARENGRUPPEN.length,
    'so viele Kennungen wie Warengruppen, sonst prüft die Schleife nicht alle');
  for (const kennung of kennungen) {
    assert.ok(WARENGRUPPEN.includes(kennung), `Kennung für „${kennung}" ohne Warengruppe`);
  }
});

/* ------------------------------------------------------------------ *
 * Was eine Anzeige behauptet, muss wahr sein
 * ------------------------------------------------------------------ */

test('Keine Anzeige behauptet einen Vorrat, den es nicht gibt', () => {
  // **Befund vom 31.08.** Eine Überschrift lautete „XPS und EPS ab Lager".
  // PARAMETER.md legt fest: reines Streckengeschäft, kein eigenes Warenlager —
  // die Ware geht vom Lieferanten direkt auf die Baustelle.
  //
  // Im B2B-Baustoffhandel ist „ab Lager" keine Floskel, sondern eine
  // Terminzusage: Der Bauleiter plant danach und stellt die Kolonne darauf
  // ein. Sie zu machen, ohne ein Lager zu haben, kostet ihn einen Tag.
  const datei = pfad('../ausgabe/kampagne/anzeigen.csv');
  if (!existsSync(datei)) return;
  const zeilen = readFileSync(datei, 'utf8').trim().split('\n').slice(1);
  assert.ok(zeilen.length >= 1, 'keine Anzeige — prüft nichts');

  const vorrat = ['ab lager', 'auf lager', 'lagernd', 'sofort verfügbar', 'vorrätig', 'lagerware'];
  assert.ok(vorrat.length >= 4, 'die Liste ist leer geworden');
  for (const zeile of zeilen) {
    for (const wort of vorrat) {
      assert.ok(!zeile.toLowerCase().includes(wort),
        `Eine Anzeige wirbt mit „${wort}" — der Shop führt kein Lager`);
    }
  }
});

test('Keine Überschrift endet mitten im Satz', () => {
  // „Vom Baumeister, nicht vom" — fünfundzwanzig Zeichen, also innerhalb der
  // dreißig, und trotzdem ein Fragment. Jemand hat „…nicht vom Baumarkt"
  // gekürzt statt umformuliert.
  //
  // Genau der Fehler, den dieses Werkzeug bei den Keywords längst verhindert
  // („Baumit TextilglasGitter 1,1x" — schlimmer als gar kein Keyword). Für die
  // Anzeigentexte galt die Regel nicht, obwohl sie dort ein Mensch liest.
  const datei = pfad('../ausgabe/kampagne/anzeigen.csv');
  if (!existsSync(datei)) return;
  const kopf = readFileSync(datei, 'utf8').trim().split('\n')[0].split(',');
  const zeilen = readFileSync(datei, 'utf8').trim().split('\n').slice(1);
  assert.ok(zeilen.length >= 1, 'keine Anzeige — prüft nichts');
  const spalten = kopf
    .map((k, i) => ({ k, i }))
    .filter(({ k }) => /^(Überschrift|Beschreibung)/.test(k));
  assert.ok(spalten.length >= 5, `nur ${spalten.length} Textspalten`);

  const halbsatz = ['vom', 'von', 'am', 'im', 'zum', 'zur', 'mit', 'für', 'und', 'oder',
    'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'auf', 'aus', 'bei', 'nach', 'ohne', 'bis'];
  for (const zeile of zeilen) {
    const felder = zeile.split(',');
    for (const { k, i } of spalten) {
      const text = (felder[i] ?? '').replace(/^"|"$/g, '').trim();
      if (!text) continue;
      const letztes = text.replace(/[.,;:!?]+$/, '').split(/\s+/).at(-1).toLowerCase();
      assert.ok(!halbsatz.includes(letztes),
        `${k} endet auf „${letztes}": „${text}" — abgeschnitten statt umformuliert`);
    }
  }
});

test('Auch die zurückgestellten Anzeigentexte werden geprüft', () => {
  // **Befund vom 31.08., abends.** Seit das Budget mittags auf die tragenden
  // Gruppen konzentriert wurde, gingen nur noch drei Anzeigen durch
  // `pruefeTexte`. In der zurückgestellten Gruppe Kanal stand weiterhin „PVC
  // Kanal ab Lager" — dieselbe unwahre Vorratszusage, die am Nachmittag aus
  // der Dämmung entfernt worden war.
  //
  // Sie wäre am Tag der Aktivierung hinausgegangen: ein Fehler mit bekanntem
  // Auslösetag, kein latenter. Und die Blindstelle war die Folge meiner
  // eigenen Änderung — wer den Ausgabeumfang verkleinert, verkleinert die
  // Prüfung mit, wenn beide an derselben Liste hängen.
  //
  // Geprüft wird deshalb, dass das Werkzeug **abbricht**, wenn irgendein Text
  // im Vorrat eine Vorratszusage trägt — auch einer, der heute nicht
  // ausgegeben wird.
  // **Der erste Anlauf dieser Probe war zu schwach**, und das Werkzeug hat es
  // gezeigt: Sie las den Quelltext und verlangte, dass `Object.entries(
  // ANZEIGENTEXTE)` **dasteht**. Eine Mutation, die den Ausdruck stehen ließ
  // und nur die Verwendung zurücknahm, blieb unbemerkt. Geprüft wird jetzt
  // das Verhalten, nicht die Schreibweise.

  // 1. Die Prüfmenge deckt jede Warengruppe des Vorrats — auch die
  //    zurückgestellten, die heute keine Anzeige bekommen.
  const vorrat = alleAnzeigentexte();
  const imVorrat = vorrat.map((a) => a.Anzeigengruppe);
  assert.deepEqual([...imVorrat].sort(), Object.keys(ANZEIGENTEXTE).sort(),
    'die Prüfmenge deckt nicht alle Gruppen');
  const zurueck = zeilenVon(spaeterDatei).map((z) => z.split(',')[0]);
  assert.ok(zurueck.length >= 1, 'keine zurückgestellte Gruppe zum Vergleich');
  for (const g of zurueck) {
    assert.ok(imVorrat.includes(g), `die zurückgestellte Gruppe ${g} wird nicht geprüft`);
  }

  // 2. Und die Prüfung findet in dieser Menge tatsächlich etwas.
  const mitZusage = [...vorrat, { Anzeigengruppe: 'Probe', 'Überschrift 1': 'Alles ab Lager' }];
  const gefunden = pruefeTexte(mitZusage);
  assert.ok(gefunden.some((f) => /behauptet Vorrat/.test(f)),
    `die Vorratszusage wurde nicht gefunden: ${gefunden.join(' | ')}`);

  // 3. Der echte Vorrat ist sauber.
  assert.deepEqual(pruefeTexte(vorrat), [], 'ein Anzeigentext im Vorrat ist zu beanstanden');
});
