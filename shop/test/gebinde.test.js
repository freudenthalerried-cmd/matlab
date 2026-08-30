import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gebindeKg, gebindeM2, gebindezahl, preisJeKilo, kilotafel, mengenschritt, GROESSTES_GEBINDE_KG, gebindeLfm, GEBINDELESER } from '../src/gebinde.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

test('genau eine kg-Angabe im Namen ergibt die Gebindegröße', () => {
  assert.equal(gebindeKg('Baumit KlebeSpachtel 25 kg'), 25);
  assert.equal(gebindeKg('Schiedel Fugenmasse FM 1,5 kg'), 1.5);
  assert.equal(gebindeKg('Capatect Putzgrund weiß 25 kg'), 25);
  assert.equal(gebindeKg('Capatect PrimaPor K20 weiß 25 kg SH-Reibputz'), 25);
});

test('keine, zwei oder unplausible Angaben ergeben nichts', () => {
  assert.equal(gebindeKg('Fassaden EPS 2 cm 0,5 m2'), null, 'gar keine kg-Angabe');
  assert.equal(gebindeKg('Baumit ThermoMörtel 50 40 l'), null, 'Liter sind kein Gewicht');
  assert.equal(gebindeKg('Soudal Perimeterkleber B3 750 ml'), null);
  assert.equal(gebindeKg('Musterware 5 kg im 25 kg Karton'), null, 'zwei Angaben — welche ist es?');
  assert.equal(gebindeKg(`Palette ${GROESSTES_GEBINDE_KG + 10} kg`), null, 'über der Grenze');
  assert.equal(gebindeKg('Probe 0,05 kg'), null, 'unter der Grenze');
  assert.equal(gebindeKg(''), null);
  assert.equal(gebindeKg(null), null);
});

test('die Wortgrenze trägt Umlaute — kg vor einem Umlaut zählt nicht', () => {
  // `\b` ist in JavaScript ASCII-gebunden; derselbe Fehler wie bei marke()
  // und bauform(). „25 kgÖsterreich" wäre mit `\b` ein Treffer.
  assert.equal(gebindeKg('Muster 25 kgÖsterreich'), null);
  assert.equal(gebindeKg('Muster 25 kg2'), null);
  assert.equal(gebindeKg('Muster 25 kg, lose'), 25);
});

test('bei Kilopreis wird der Gebindepreis gerechnet, bei Gebindepreis der Kilopreis', () => {
  const jeKg = preisJeKilo({ bezeichnung: 'Putzgrund 25 kg', einheit: 'KG', vkNetto: 2.77 });
  assert.deepEqual(jeKg, { gebindeKg: 25, jeKgNetto: 2.77, jeGebindeNetto: 69.25, grundlage: 'kilopreis' });

  const jeSack = preisJeKilo({ bezeichnung: 'KlebeSpachtel 25 kg', einheit: 'SCK', vkNetto: 14.32 });
  assert.deepEqual(jeSack, { gebindeKg: 25, jeKgNetto: 0.57, jeGebindeNetto: 14.32, grundlage: 'gebindepreis' });
});

test('Fläche, Länge und Volumen bekommen keinen Kilopreis', () => {
  assert.equal(preisJeKilo({ bezeichnung: 'Platte 25 kg', einheit: 'M2', vkNetto: 9 }), null);
  assert.equal(preisJeKilo({ bezeichnung: 'Bahn 25 kg', einheit: 'LFM', vkNetto: 9 }), null);
  assert.equal(preisJeKilo({ bezeichnung: 'Eimer 25 kg', einheit: 'LTR', vkNetto: 9 }), null);
});

test('ohne Preis gibt es keine Umrechnung', () => {
  assert.equal(preisJeKilo({ bezeichnung: 'Sack 25 kg', einheit: 'SCK', vkNetto: null }), null);
  assert.equal(preisJeKilo({ bezeichnung: 'Sack 25 kg', einheit: 'SCK', vkNetto: 0 }), null);
  assert.equal(preisJeKilo(null), null);
});

test('die Tafel sortiert nach Kilopreis und sagt, wen sie auslässt', () => {
  const tafel = kilotafel([
    { sku: 'A', bezeichnung: 'Teuer 25 kg', einheit: 'KG', vkNetto: 2.77 },
    { sku: 'B', bezeichnung: 'Billig 25 kg', einheit: 'SCK', vkNetto: 14.32 },
    { sku: 'C', bezeichnung: 'Platte 0,5 m2', einheit: 'M2', vkNetto: 1.93 },
  ]);
  assert.deepEqual(tafel.zeilen.map((z) => z.sku), ['B', 'A']);
  assert.equal(tafel.ohne, 1);
  assert.equal(tafel.gesamt, 3);
});

test('am Bestand: jede Zeile der Tafel rechnet sich aus ihrem eigenen Katalogpreis', () => {
  const datei = pfad('../ausgabe/site/shop.js');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const roh = readFileSync(datei, 'utf8').match(/^window\.__SHOP__=(.*?);$/m);
  assert.ok(roh, 'die Nutzdaten stehen nicht in der ersten Zeile von shop.js');
  const artikel = JSON.parse(roh[1]).artikel;

  const tafel = kilotafel(artikel);
  // Beide Seiten müssen vorkommen, sonst prüft der Test nur einen Fall.
  assert.ok(tafel.zeilen.length >= 5, `nur ${tafel.zeilen.length} Zeilen`);
  assert.ok(tafel.ohne > 0, 'kein einziger Artikel ausgelassen — dann stimmt die Erkennung nicht');
  const grundlagen = new Set(tafel.zeilen.map((z) => z.grundlage));
  assert.ok(grundlagen.has('kilopreis') && grundlagen.has('gebindepreis'),
    `im Bestand müssen beide Fälle vorkommen, gefunden: ${[...grundlagen].join(', ')}`);

  for (const z of tafel.zeilen) {
    const erwartet = z.grundlage === 'kilopreis'
      ? z.vkNetto * z.gebindeKg
      : z.vkNetto / z.gebindeKg;
    const genannt = z.grundlage === 'kilopreis' ? z.jeGebindeNetto : z.jeKgNetto;
    assert.ok(Math.abs(genannt - erwartet) < 0.005,
      `${z.sku}: ${genannt} statt ${erwartet.toFixed(4)}`);
  }
});

test('die Gruppenseite Mörtel trägt die Tafel und nennt die ausgelassenen Artikel', () => {
  const datei = pfad('../ausgabe/site/gruppe/moertel.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  assert.match(html, /Was ein Kilogramm kostet/);
  assert.match(html, /je Gebinde, netto/);
  assert.match(html, /je kg, netto/);
  assert.match(html, /nicht in der Tafel/, 'eine Tafel, die schweigend kürzt, sieht vollständig aus');
});

test('die Artikelseite nennt beide Preise, und zwar den jeweils gerechneten', () => {
  const kilopreisSeite = pfad('../ausgabe/site/artikel/POS-13728.html');
  const gebindeSeite = pfad('../ausgabe/site/artikel/POS-29108.html');
  if (!existsSync(kilopreisSeite) || !existsSync(gebindeSeite)) return;

  const jeKg = readFileSync(kilopreisSeite, 'utf8');
  assert.match(jeKg, /Je Gebinde/);
  assert.match(jeKg, /69,25/, 'der Gebindepreis fehlt');
  assert.match(jeKg, /aus der Bezeichnung/);

  const jeSack = readFileSync(gebindeSeite, 'utf8');
  assert.match(jeSack, /Je Kilogramm/);
  assert.match(jeSack, /0,57/, 'der Kilopreis fehlt');
});

test('der Mengenschritt gilt für Kilo- und für Flächenware', () => {
  assert.equal(mengenschritt({ bezeichnung: 'Putzgrund 25 kg', einheit: 'KG' }), 25);
  assert.equal(mengenschritt({ bezeichnung: 'XPS glatt SF 30 mm 0,75 m2', einheit: 'M2' }), 0.75);
  assert.equal(mengenschritt({ bezeichnung: 'Fugenmasse 1,5 kg', einheit: 'KG' }), 1.5,
    'gebrochene Schritte sind seit istMenge() zugelassen');
  assert.equal(mengenschritt({ bezeichnung: 'Sack 25 kg', einheit: 'SCK' }), null,
    'wer je Sack verkauft, verkauft schon in Gebinden');
  assert.equal(mengenschritt({ bezeichnung: 'ohne Angabe', einheit: 'KG' }), null);
  assert.equal(mengenschritt({ bezeichnung: 'Bahn 1,1x50 m', einheit: 'M2' }), null,
    'Meter sind keine Quadratmeter — die zweite Kante wird nicht erfunden');
  assert.equal(mengenschritt({ bezeichnung: 'Grundmauerschutz 20 1,5 m', einheit: 'M2' }), null);
  assert.equal(mengenschritt(null), null);
});

test('gebindeM2 liest nur ausdrückliche Quadratmeter', () => {
  assert.equal(gebindeM2('Isover TDPT 20 1200 600 mm 8,64 m2'), 8.64);
  assert.equal(gebindeM2('Capatect Glasgewebe M, Breite 110cm, orange 55 m2'), 55);
  assert.equal(gebindeM2('Fassaden EPS 2 cm 0,5 m2'), 0.5);
  assert.equal(gebindeM2('Baumit TextilglasGitter 1,1x50 m'), null);
  assert.equal(gebindeM2('Rolle 100 m2 auf 50 m2 Träger'), null, 'zwei Angaben — welche ist es?');
});

test('gebindezahl rundet auf ganze Einheiten auf und sagt, ob es aufgeht', () => {
  assert.deepEqual(gebindezahl(5, 0.75), { stueck: 7, gedeckteMenge: 5.25, gehtAuf: false });
  assert.deepEqual(gebindezahl(3, 0.75), { stueck: 4, gedeckteMenge: 3, gehtAuf: true });
  assert.deepEqual(gebindezahl(25, 25), { stueck: 1, gedeckteMenge: 25, gehtAuf: true });
  assert.equal(gebindezahl(5, 0), null);
  assert.equal(gebindezahl(0, 0.75), null);
});

test('am Bestand bekommt jeder Gebindeartikel einen Schritt — und nicht jeder Artikel', () => {
  const datei = pfad('../ausgabe/site/shop.js');
  if (!existsSync(datei)) return;
  const artikel = JSON.parse(readFileSync(datei, 'utf8').match(/^window\.__SHOP__=(.*?);$/m)[1]).artikel;
  const mit = artikel.filter((a) => mengenschritt(a) !== null);
  assert.ok(mit.length >= 12, `nur ${mit.length} Artikel mit Gebindeschritt`);
  // **Nicht mehr `['KG', 'M2']`.** Hier stand der Bestand von gestern als
  // Literal, und als die laufenden Meter dazukamen, fiel diese Probe um,
  // obwohl nichts kaputt war. Geprüft gehört die Regel: Ein Schritt entsteht
  // nur für Einheiten, für die es einen Leser gibt — und jeder Leser findet
  // im Bestand seinen Fall, sonst prüft die Schleife darunter ihn nicht.
  const einheiten = new Set(mit.map((a) => a.einheit));
  const bekannt = Object.keys(GEBINDELESER);
  // Beide Schleifen darunter prüfen bei leerer Liste nichts. Eine geleerte
  // Zuordnung wäre sonst der grünste Zustand dieser Probe.
  assert.ok(einheiten.size >= 2, `nur ${einheiten.size} Einheit(en) mit Schritt im Bestand`);
  assert.ok(bekannt.length >= 3, `nur ${bekannt.length} Einheiten in GEBINDELESER`);
  for (const e of einheiten) {
    assert.ok(bekannt.includes(e), `${e} bekommt einen Schritt, hat aber keinen Leser`);
  }
  for (const e of bekannt) {
    assert.ok(einheiten.has(e), `kein Artikel mit Einheit ${e} im Bestand — der Leser läuft nie`);
  }
  for (const a of mit) {
    assert.equal(mengenschritt(a), GEBINDELESER[a.einheit](a.bezeichnung), a.sku);
  }
  // Und die Gegenrichtung: Nicht jeder Artikel bekommt einen — sonst wäre
  // die Erkennung wirkungslos.
  assert.ok(mit.length < artikel.length, 'jeder Artikel hat einen Schritt — das kann nicht stimmen');
});

test('die Artikelseite beginnt bei einem Gebinde und zählt in Gebinden weiter', () => {
  const datei = pfad('../ausgabe/site/artikel/POS-13728.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  const feld = html.match(/<input id="menge-POS-13728"[^>]*>/);
  assert.ok(feld, 'kein Mengenfeld gefunden');
  assert.match(feld[0], /min="25"/);
  assert.match(feld[0], /value="25"/);
  assert.match(feld[0], /step="25"/);
  assert.match(html, /Abgabe in ganzen Gebinden zu 25 kg/);
  assert.match(html, /69,25 € netto/, 'der Gebindepreis gehört in den Satz');
});

test('ein Artikel ohne Gebinde behält das freie Mengenfeld', () => {
  // POS-10095 (PVC Kanalrohr, je Stück) trägt keine Gebindegröße im Namen.
  const datei = pfad('../ausgabe/site/artikel/POS-10095.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  const feld = html.match(/<input id="menge-POS-10095"[^>]*>/);
  assert.ok(feld);
  assert.match(feld[0], /min="1"/);
  assert.ok(!feld[0].includes('step='), 'ohne bekannte Gebindegröße wird keine erfunden');
  assert.ok(!html.includes('Abgabe in ganzen'));
});

test('eine Dämmplatte beginnt bei einer Platte, nicht bei einem Quadratmeter', () => {
  const datei = pfad('../ausgabe/site/artikel/POS-12569.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  const feld = html.match(/<input id="menge-POS-12569"[^>]*>/);
  assert.ok(feld, 'kein Mengenfeld gefunden');
  assert.match(feld[0], /min="0.75"/);
  assert.match(feld[0], /step="0.75"/);
  assert.match(html, /Abgabe in ganzen Einheiten zu 0,75 m²/);
});

/* ------------------------------------------------------------------ *
 * Längenware: laufende Meter, die es nur in ganzen Stangen gibt
 * ------------------------------------------------------------------ */

test('gebindeLfm liest die Länge aus der Bezeichnung', () => {
  assert.equal(gebindeLfm('Capatect Gewebeanschlussleiste 3D Universal Plus 2,55 m'), 2.55);
  assert.equal(gebindeLfm('Kantenschutz mit Gewebe Carbon 11,5 13,5 cm 2,5 m'), 2.5);
  assert.equal(gebindeLfm('Sockelleiste 3 m'), 3);
});

test('gebindeLfm verwechselt Millimeter, Zentimeter und Quadratmeter nicht mit Metern', () => {
  // Der Kantenschutz oben trägt „13,5 cm" unmittelbar vor „2,5 m". Fiele die
  // Abgrenzung, wäre der Schritt 13,5 statt 2,5 — der Kunde bekäme das
  // Fünffache angeboten und die Karte den fünffachen Preis.
  assert.equal(gebindeLfm('Klebeband 48 mm breit'), null);
  assert.equal(gebindeLfm('Profil 30 cm'), null);
  assert.equal(gebindeLfm('PAE-Folie 100 m2'), null);
  assert.equal(gebindeLfm('Platte 0,75 m²'), null);
});

test('Zwei Längenangaben sind ein Maß, keine Gebindelänge', () => {
  // „Was die Bezeichnung nicht sagt, sagt sie nicht" — dieselbe Regel wie bei
  // der Fläche. Aus 1,1 × 50 die 50 zu nehmen hieße raten, welche Kante die
  // Stangenlänge ist.
  assert.equal(gebindeLfm('Gitter 1,1 m x 50 m'), null);
  assert.equal(gebindeLfm('ohne jede Zahl'), null);
});

test('Unsinnige Längen werden verworfen, nicht durchgereicht', () => {
  assert.equal(gebindeLfm('Faden 0,05 m'), null);
  assert.equal(gebindeLfm('Trasse 5000 m'), null);
});

test('Nur bei Einheit LFM wird die Länge zum Mengenschritt', () => {
  // Gegenrichtung: Ein Rohr „NW 100 1 m", das je Stück verkauft wird, hat
  // schon den Schritt eins. Aus seinem Namen eine Länge zu ziehen, machte aus
  // einem Stück einen Meter.
  const leiste = { einheit: 'LFM', bezeichnung: 'Anschlussleiste 2,55 m' };
  assert.equal(mengenschritt(leiste), 2.55);
  assert.equal(mengenschritt({ einheit: 'STK', bezeichnung: 'PVC Kanalrohr NW 100 1 m' }), null);
  assert.equal(mengenschritt({ einheit: 'RLL', bezeichnung: 'PAE-Folie T 100 2 50 m 100 m2' }), null);
});

test('Vier laufende Meter Leiste sind zwei Stangen, nicht vier Meter', () => {
  // Der ganze Anlass in einer Zeile: Die Menge, die es nicht gibt.
  const schritt = gebindeLfm('Anschlussleiste 2,55 m');
  const z = gebindezahl(4, schritt);
  assert.equal(z.stueck, 2);
  assert.equal(z.gedeckteMenge, 5.1);
  assert.equal(z.gehtAuf, false);
});

test('Jede Einheit in GEBINDELESER wird von mengenschritt auch bedient', () => {
  // Die Zuordnung ist die Zusicherung. Wer sie erweitert und die Kette in
  // `mengenschritt` vergisst, bekommt hier den Befund — und nicht erst,
  // wenn ein Kunde eine unlieferbare Menge bestellt.
  const proben = {
    KG: 'Putzgrund 25 kg',
    M2: 'Dämmplatte 0,75 m2',
    LFM: 'Anschlussleiste 2,55 m',
  };
  const bekannt = Object.keys(GEBINDELESER);
  assert.ok(bekannt.length >= 3, `nur ${bekannt.length} Einheiten — die Schleife prüft zu wenig`);
  for (const einheit of bekannt) {
    const bezeichnung = proben[einheit];
    assert.ok(bezeichnung, `für ${einheit} fehlt in dieser Probe ein Beispielname`);
    assert.equal(
      mengenschritt({ einheit, bezeichnung }),
      GEBINDELESER[einheit](bezeichnung),
      `${einheit}: mengenschritt und GEBINDELESER sind auseinandergelaufen`,
    );
    assert.ok(mengenschritt({ einheit, bezeichnung }) > 0, `${einheit} liefert keinen Schritt`);
  }
});
