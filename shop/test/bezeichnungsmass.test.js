/**
 * Wie viele Artikelnamen tragen ein eindeutiges Maß?
 *
 * **Die Messung, 13. September 2026.** Am selben Tag wurde beziffert, dass 21
 * von 46 Beschreibungen über die Ware nichts sagen. Der naheliegende Ausweg —
 * die Maße aus den Bezeichnungen lesen — hat eine Bedingung bekommen:
 *
 * > *Wer es dennoch tut, misst zuerst, wie viele der 46 Namen eindeutig sind —
 * > und nicht, wie viele sich irgendwie lesen lassen.*
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { masseImNamen, lesbarkeit, massbefund, EINHEITEN_IM_NAMEN } from '../src/bezeichnungsmass.js';
import { beschreibungsbefund } from '../src/maschinenlesbar.js';

const KATALOG = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8'));

test('Ein Name mit genau einem Maß und sonst keiner Zahl ist eindeutig', () => {
  const proben = ['Soudal Profi-Pistolenschaum B3 750 ml', 'Baumit KlebeSpachtel 25 kg',
    'SIKM Rohr 133cm gedämmt'];
  assert.ok(proben.length >= 3, 'zu wenige Proben');
  for (const name of proben) {
    assert.equal(lesbarkeit(name), 'eindeutig', `„${name}" gilt als ${lesbarkeit(name)}`);
    assert.equal(masseImNamen(name).masse.length, 1);
  }
  assert.ok(EINHEITEN_IM_NAMEN.length >= 5, 'die Einheitenliste ist zu kurz zum Messen');
});

/*
 * **Der Fund innerhalb der Messung.** `1,1x50 m` und `7,5x182 mm` standen
 * zuerst in der Spalte „eindeutig", weil der Leser genau ein Paar aus Zahl und
 * Einheit fand. Der Name trägt zwei.
 *
 * > **„Eindeutig" hieß: Der Leser findet genau eine Zahl. Es hieß nicht: Der
 * > Name trägt genau eine.**
 */
test('Zwei Zahlen unter einer Einheit sind zwei Maße', () => {
  const gitter = masseImNamen('Baumit TextilglasGitter 1,1x50 m');
  assert.deepEqual(gitter.masse.map((x) => `${x.zahl} ${x.einheit}`), ['1,1 m', '50 m'],
    'die x-Form zählt wieder als ein Maß');
  assert.equal(lesbarkeit('Baumit TextilglasGitter 1,1x50 m'), 'mehrdeutig');
  assert.equal(lesbarkeit('Rahmenschraube Zylinderkopf vz 7,5x182 mm lose'), 'mehrdeutig');
  // Und das Kreuz mit Leerzeichen und mal-Zeichen liest sich genauso.
  assert.equal(masseImNamen('Band 48 x 50 m').masse.length, 2);
  assert.equal(masseImNamen('Band 48 × 50 m').masse.length, 2);
});

test('Eine nackte Zahl neben einem Maß macht den Namen mehrdeutig', () => {
  // `Grundmauerschutz 20 1,5 m` trägt ein Maß und eine 20 — welche der beiden
  // die Eigenschaft ist, sagt der Name nicht.
  assert.equal(lesbarkeit('Grundmauerschutz 20 1,5 m'), 'mehrdeutig');
  assert.equal(masseImNamen('Grundmauerschutz 20 1,5 m').ohneEinheit, 1);
  assert.equal(lesbarkeit('Schachtring 800 300 80 mm'), 'mehrdeutig');
  assert.equal(lesbarkeit('Mantelsteinkleber RMRTL Dünnbettmörtel'), 'ohne');
});

/*
 * Der teuerste Fall: eine Typenbezeichnung, die wie ein Maß aussieht.
 * `Capatect Klebe- und Spachtelmasse 186 M 25 kg` — das `186 M` ist die
 * Produktkennung des Herstellers, und der Leser liest 186 Meter.
 *
 * > **Ein Leser, der ein Maß findet, wo eine Kennung steht, erfindet eine
 * > Eigenschaft — und zwar eine, die plausibel aussieht.**
 */
test('Eine Typenbezeichnung sieht aus wie ein Maß und wird als mehrdeutig erkannt', () => {
  const name = 'Capatect Klebe- und Spachtelmasse 186 M 25 kg';
  const gelesen = masseImNamen(name).masse.map((x) => `${x.zahl} ${x.einheit}`);
  assert.ok(gelesen.includes('186 M'), 'der Leser sieht die Kennung nicht mehr als Maß');
  assert.equal(lesbarkeit(name), 'mehrdeutig',
    'die Kennung ginge als eindeutiges Maß durch und würde 186 Meter behaupten');
});

test('Ein leerer Lauf ist kein grüner', () => {
  assert.ok(massbefund([], 20, null).meldungen.some((m) => m.regel === 'zu-wenig-artikel'));
});

/*
 * Und der Bestand selbst. Diese Zahlen sind das Ergebnis der Runde; wandern
 * sie, ist entweder der Katalog gewachsen oder der Leser ein anderer — beides
 * gehört angesehen und nicht stillschweigend übernommen.
 */
test('Acht von sechsundvierzig Namen sind eindeutig lesbar', () => {
  const b = massbefund(KATALOG.artikel);
  // Die festgehaltene Messung gilt für diesen Katalog; wandert er, meldet der
  // Befund es selbst, und die Zusicherungen darunter sagen, wohin.
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.equal(b.artikel, 46, 'der Katalog ist gewachsen — die Messung gehört wiederholt');
  assert.equal(b.eindeutig, 8, `${b.eindeutig} statt 8 eindeutige Namen`);
  assert.equal(b.mehrdeutig, 26);
  assert.equal(b.ohne, 12);
  assert.equal(b.eindeutig + b.mehrdeutig + b.ohne, b.artikel, 'ein Name fällt durch alle Lagen');
});

/*
 * Die Zahl, wegen der die Messung gemacht wurde: Was brächte ein Leser
 * wirklich? Ein Name, dessen Maß die Beschreibung schon nennt, bringt nichts.
 */
test('Ein Namensleser senkte die einundzwanzig um drei', () => {
  const b = massbefund(KATALOG.artikel);
  const ohne = new Set(beschreibungsbefund(KATALOG.artikel).ohneWareneigenschaftSkus);
  assert.ok(ohne.size >= 1, 'ohne Bestand prüft der Vergleich darunter nichts');
  const gewinn = b.skus.eindeutig.filter((sku) => ohne.has(sku));
  assert.equal(gewinn.length, 3,
    `ein Namensleser erreichte ${gewinn.length} Beschreibungen, gemessen waren drei`);
  // Fünf der acht sagen ihr Maß schon — `packungsgewichtKg` liest die Kilogramm.
  assert.equal(b.eindeutig - gewinn.length, 5);
});

/*
 * **Die Regel, die den Bestand festhält — gemessen am 15. September 2026.**
 * `bestand-gewandert` ist die Zeile, auf der das ganze Modul ruht: Der Satz
 * *„ein Leser über die Namen wäre für 8 von 46 richtig"* ist eine Aussage über
 * **diesen** Katalog, und der Auftraggeber hat die Erweiterung auf mindestens
 * hundert Artikel angeordnet. Sie hat nie gefeuert, weil der Katalog seit der
 * Messung derselbe ist — was sie zur unwichtigsten Regel des Bestandes machte
 * und zur wichtigsten des Tages, an dem der Katalog wächst.
 */
test('ein gewachsener Bestand meldet sich, bevor das Urteil weitergilt', () => {
  const artikel = [
    { sku: 'A', bezeichnung: 'Sack Zement 25 kg' },
    { sku: 'B', bezeichnung: 'Platte' },
  ];
  const erwartet = { artikel: 3, ohne: 1, eindeutig: 1, mehrdeutig: 1 };
  const b = massbefund(artikel, 0, erwartet);
  const gewandert = b.meldungen.filter((m) => m.regel === 'bestand-gewandert');
  assert.ok(gewandert.length >= 1, 'ein anderer Bestand als der gemessene muss auffallen');
  assert.match(gewandert[0].text, /gemessen 2, festgehalten 3/);
});

test('deckt sich die Messung, meldet die Regel nichts — und null schaltet sie ab', () => {
  const artikel = [
    { sku: 'A', bezeichnung: 'Sack Zement 25 kg' },
    { sku: 'B', bezeichnung: 'Platte' },
  ];
  const ist = massbefund(artikel, 0, null);
  const deckt = massbefund(artikel, 0, {
    artikel: ist.artikel, ohne: ist.ohne, eindeutig: ist.eindeutig, mehrdeutig: ist.mehrdeutig,
  });
  assert.deepEqual(deckt.meldungen, [], JSON.stringify(deckt.meldungen));
  assert.deepEqual(ist.meldungen, [], 'ohne festgehaltene Messung gibt es nichts zu vergleichen');
});
