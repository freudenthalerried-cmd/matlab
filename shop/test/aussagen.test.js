/**
 * Aussagen über den eigenen Bestand — auf jeder Fläche, nicht nur in der Anzeige.
 *
 * **Der Anlass, 5. September 2026, abends.** Auf der Startseite stand im
 * ersten Satz unter der Hauptüberschrift:
 *
 * > „Was ein Baumeister im Einkauf zahlt, **zahlen Sie auch**"
 *
 * Wörtlich dieselbe Behauptung, die am selben Tag aus der WDVS-Anzeige
 * entfernt wurde — auf der Seite, die jeder zuerst sieht.
 *
 * > **Der Prüfer, der dagegen gebaut wurde, las nur die Anzeigen.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PREISAUSSAGEN, VORRATSWORTE, HINGENOMMENE_STELLEN,
  aussagenbefund, stellenbefund,
} from '../src/aussagen.js';
import { nurText } from '../src/format.js';

test('die Gleichsetzung ohne das Wort „Preis" wird getroffen', () => {
  // Über die 81 gebauten Seiten gelaufen, hätte das Register vom Nachmittag
  // **null** Treffer gemeldet: Seine drei Muster kannten „zahlen … Preis",
  // „zum Einkaufspreis" und „ohne Aufschlag". Die Behauptung auf der
  // Startseite hängt am Wort „auch".
  const satz = 'Was ein Baumeister im Einkauf zahlt, zahlen Sie auch — deshalb liegen '
    + '39 von 46 Artikeln unter dem Listenpreis.';
  assert.equal(aussagenbefund('index.html', satz).length, 1);
  assert.equal(aussagenbefund('index.html', satz)[0].regel, 'preisgleichheit');
});

test('die alten drei Muster gelten weiter', () => {
  for (const satz of [
    'Ein Baumeister kauft ein, Sie zahlen seinen Preis.',
    'Bei uns zum Einkaufspreis.',
    'Ohne Aufschlag direkt vom Lieferanten.',
  ]) {
    assert.equal(aussagenbefund('x.html', satz).length, 1, satz);
  }
});

test('der Claim und die Wahrheit daneben bleiben unbehelligt', () => {
  for (const satz of [
    'Der Einkauf eines Baumeisterbetriebs ist unsere Grundlage — deshalb liegen 39 von 46 Artikeln unter Liste.',
    'Baustoffe zum Baumeisterpreis, geliefert im Umkreis.',
    'Die Umsatzsteuer zahlen Sie auch bei uns.',
    'Baumeisterpreis, nicht Liste.',
  ]) {
    assert.deepEqual(aussagenbefund('x.html', satz), [], satz);
  }
});

test('ein Vorratswort ohne Lager fällt auf', () => {
  assert.ok(VORRATSWORTE.length >= 4, 'ein leeres Register bestünde jede Prüfung');
  const b = aussagenbefund('x.html', 'XPS und EPS ab Lager, sofort verfügbar.');
  assert.equal(b.length, 2);
  assert.ok(b.every((m) => m.regel === 'vorrat-ohne-lager'));
});

test('eine hingenommene Stelle bleibt außen vor — und wird zurückgehalten', () => {
  // Der Fehlalarm vom ersten Lauf: „…nicht aus dem Preis und nicht aus dem,
  // was vorrätig ist." Eine Verneinung, das Gegenteil einer Zusage.
  assert.ok(HINGENOMMENE_STELLEN.length >= 1, 'ein leeres Verzeichnis bestünde jede Prüfung');
  for (const h of HINGENOMMENE_STELLEN) assert.ok(h.warum.length >= 80, `${h.datei}: Grund zu kurz`);

  const eintrag = HINGENOMMENE_STELLEN[0];
  const satz = `Die Stärke ergibt sich aus dem Nachweis, nicht aus dem, was ${eintrag.wort} ist.`;
  assert.deepEqual(aussagenbefund(eintrag.datei, satz), []);
  assert.equal(aussagenbefund('andere.html', satz).length, 1, 'nur diese eine Datei ist gedeckt');
});

test('ein Eintrag, dessen Stelle es nicht mehr gibt, fällt auf', () => {
  assert.deepEqual(stellenbefund(HINGENOMMENE_STELLEN.map((h) => ({ datei: h.datei, wort: h.wort }))), []);
  const leer = stellenbefund([]);
  assert.equal(leer.length, HINGENOMMENE_STELLEN.length);
  assert.ok(leer.every((m) => m.regel === 'stelle-ohne-fall'));
});

test('der Bestand steht: keine gebaute Seite behauptet Preisgleichheit oder Vorrat', () => {
  // Gesucht wird im Text, nicht im Markup — die Startseite bricht den Satz
  // über zwei Zeilen, und ein Muster über rohes HTML fände ihn nicht.
  const seite = (p) => nurText(readFileSync(new URL(`../ausgabe/site/${p}`, import.meta.url), 'utf8'));
  for (const p of ['index.html', 'gruppe/wdvs.html', 'wissen/baumeisterpreis.html']) {
    assert.deepEqual(aussagenbefund(p, seite(p)), [], p);
  }
  assert.match(seite('index.html'), /Einkauf eines Baumeisterbetriebs ist unsere Grundlage/);
});
