import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gebindeKg, preisJeKilo, kilotafel, mengenschritt, GROESSTES_GEBINDE_KG } from '../src/gebinde.js';

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

test('der Mengenschritt gilt nur für Kilopreise mit ganzer Gebindegröße', () => {
  assert.equal(mengenschritt({ bezeichnung: 'Putzgrund 25 kg', einheit: 'KG' }), 25);
  assert.equal(mengenschritt({ bezeichnung: 'Sack 25 kg', einheit: 'SCK' }), null,
    'wer je Sack verkauft, verkauft schon in Gebinden');
  assert.equal(mengenschritt({ bezeichnung: 'Platte 0,5 m2', einheit: 'M2' }), null);
  assert.equal(mengenschritt({ bezeichnung: 'Fugenmasse 1,5 kg', einheit: 'KG' }), null,
    'ein gebrochener Schritt passt nicht in ein ganzzahliges Mengenfeld');
  assert.equal(mengenschritt({ bezeichnung: 'ohne Angabe', einheit: 'KG' }), null);
  assert.equal(mengenschritt(null), null);
});

test('am Bestand bekommt jeder Kilopreis-Gebindeartikel einen Schritt — und sonst keiner', () => {
  const datei = pfad('../ausgabe/site/shop.js');
  if (!existsSync(datei)) return;
  const artikel = JSON.parse(readFileSync(datei, 'utf8').match(/^window\.__SHOP__=(.*?);$/m)[1]).artikel;
  const mit = artikel.filter((a) => mengenschritt(a) !== null);
  assert.ok(mit.length >= 4, `nur ${mit.length} Artikel mit Gebindeschritt`);
  for (const a of mit) {
    assert.equal(a.einheit, 'KG');
    assert.equal(mengenschritt(a), gebindeKg(a.bezeichnung));
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
  const datei = pfad('../ausgabe/site/artikel/POS-12566.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  const feld = html.match(/<input id="menge-POS-12566"[^>]*>/);
  assert.ok(feld);
  assert.match(feld[0], /min="1"/);
  assert.ok(!feld[0].includes('step='), 'ohne bekannte Gebindegröße wird keine erfunden');
  assert.ok(!html.includes('Abgabe in ganzen Gebinden'));
});
