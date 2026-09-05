import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  rekonstruiereEinkauf, rekonstruierbarkeit, findeAbfluss,
  ausgabemuster, findeInterneWoerter, teileFunde, HINGENOMMEN,
} from '../src/geheimnis.js';
import { INTERNE_WOERTER } from '../src/zahlung.js';

/* ------------------------------------------------------------------ *
 * Die Rechnung, die jeder anstellen kann
 *
 * `.gitignore` deckt die Preisdatei. Er deckt nicht die Angabe: Im
 * Verzeichnis stehen die Verkaufspreise (die gehören dorthin) und die
 * Zielmarge (die steht in einem Dutzend Dokumenten). Ein Schritt genügt.
 * ------------------------------------------------------------------ */

test('Aus Verkaufspreis und Marge folgt der Einkaufspreis', () => {
  assert.equal(rekonstruiereEinkauf(100, 0.25), 75);
  assert.equal(rekonstruiereEinkauf(53.33, 0.25), 40);
  assert.throws(() => rekonstruiereEinkauf(0, 0.25), /positiv/);
  assert.throws(() => rekonstruiereEinkauf(100, 1), /zwischen 0 und 1/);
});

test('Ein gekappter Verkaufspreis ist das Einzige, was etwas verbirgt', () => {
  // Gate 22 kappt den Verkaufspreis am Listenpreis des Lieferanten. Genau
  // dort greift die Rückrechnung zu tief — die Sperre, die den Preisvorteil
  // ausweist, verbirgt nebenbei den Einkauf.
  const e = rekonstruierbarkeit([
    { sku: 'FREI', vkNetto: 100, ekNetto: 75 },
    { sku: 'DECKEL', vkNetto: 45, ekNetto: 40 },
  ], 0.25);
  assert.equal(e.geprueft, 2);
  assert.equal(e.getroffen, 1);
  assert.deepEqual(e.verfehlt.map((z) => z.sku), ['DECKEL']);
  assert.equal(e.verfehlt[0].rekonstruiert, 33.75);
});

test('Der Anteil ist eine Zahl, keine Beruhigung', () => {
  const e = rekonstruierbarkeit([{ sku: 'A', vkNetto: 100, ekNetto: 75 }], 0.25);
  assert.equal(e.anteil, 1);
  assert.equal(rekonstruierbarkeit([], 0.25).anteil, 0, 'ohne Artikel keine Division durch null');
});

test('Artikel ohne Preis fallen heraus, statt als Treffer zu zählen', () => {
  const e = rekonstruierbarkeit([
    { sku: 'A', vkNetto: 100, ekNetto: 75 },
    { sku: 'LEER', vkNetto: 0, ekNetto: 0 },
  ], 0.25);
  assert.equal(e.geprueft, 1);
});

/* ------------------------------------------------------------------ *
 * Abfluss
 * ------------------------------------------------------------------ */

test('Ein Feldname mit Zahl daneben ist ein Verdacht', () => {
  const t = findeAbfluss('  "ekNetto": 1.45,', 'preise.json');
  assert.equal(t.length, 1);
  assert.equal(t[0].zeile, 1);
  assert.match(t[0].art, /Einkaufspreis/);
});

test('Ein Rechenschritt ist kein Wert', () => {
  // Ohne die Wortgrenze davor traf die Regel `t.einkaufNetto : 1` — der
  // Doppelpunkt kam aus einem Bedingungsausdruck. Ein Prüfer, der den
  // Rechenkern meldet statt des Lecks, wird abgeschaltet.
  assert.deepEqual(findeAbfluss('const hebel = t.einkaufNetto > 0 ? t.warenwertNetto / t.einkaufNetto : 1;'), []);
  assert.deepEqual(findeAbfluss('const x = summe.ekNetto = 0;'), [], 'Eigenschaftszugriff zählt nicht');
});

test('Der Feldname allein löst nichts aus', () => {
  assert.deepEqual(findeAbfluss('export function artikelEinkauf(artikel, lieferant) {'), []);
  assert.deepEqual(findeAbfluss('  ekNetto,'), []);
});

test('Die Zeilennummer zeigt auf die Fundstelle', () => {
  const t = findeAbfluss('eins\nzwei\nhaendlerrabattAufUvp: 0.42\n', 'x');
  assert.equal(t[0].zeile, 3);
});

/* ------------------------------------------------------------------ *
 * Das Werkzeug selbst
 * ------------------------------------------------------------------ */

test('Das Werkzeug läuft und benennt alle drei Durchgänge', () => {
  const werkzeug = fileURLToPath(new URL('../bin/geheimnispruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8' });

  /**
   * **Ergänzt am 4. September.** Der Prüfer misst die **gebauten** Seiten und
   * weigert sich seither über einem veralteten Bau. Das ist bei ihm besonders
   * wichtig: Er sagt, ob aus den veröffentlichten Verkaufspreisen die
   * Einkaufspreise zurückzurechnen sind — über einem alten Erzeugnis sagte er
   * das über die Seiten von gestern.
   *
   * Die Probe prüft deshalb beide Ausgänge und keinen davon stillschweigend.
   */
  if (lauf.status === 2) {
    assert.match(`${lauf.stderr}`, /ist älter als \d+ Quelldatei/,
      `Ausgang 2 ohne Frischemeldung:\n${lauf.stdout}${lauf.stderr}`);
    return;
  }

  // Durchgang 3 fällt ein Urteil: Steht die Zielmarge in einer Ausgabedatei,
  // endet das Werkzeug mit 1. Am Bestand darf das nicht sein.
  assert.equal(lauf.status, 0, lauf.stdout.slice(-1200));
  assert.match(lauf.stdout, /Durchgang 1 — Abfluss/);
  assert.match(lauf.stdout, /Durchgang 2 — Rekonstruktion/);
  assert.match(lauf.stdout, /Durchgang 3 — steht der Schlüssel in der Ausgabe/);
  assert.match(lauf.stdout, /Durchgang 4 — interne Namen und Schranken in der Ausgabe/);
  assert.match(lauf.stdout, /Keine interne Bezeichnung und keine Lieferantenschwelle/);
  assert.match(lauf.stdout, /übergangen/, 'was nicht angesehen wurde, steht dabei');
  assert.match(lauf.stdout, /schützt keine Angabe/, 'das Werkzeug benennt seine eigene Aussage');
  // Der Durchgang muss etwas angesehen haben. „Keine Ausgabedatei gefunden"
  // sähe sonst genauso still aus wie ein sauberer Befund.
  assert.match(lauf.stdout, /[0-9]+ Ausgabedatei\(en\) geprüft, die Zielmarge steht in keiner/);
});

/* ------------------------------------------------------------------ *
 * Aussagen über Werte — 5. September
 *
 * Die Durchgänge 1 bis 3 suchen Beträge. In `ausgabe/website.html` stand
 * seit dem ersten Bau „Kreditkarte (EU-Karte, Listenpreis Stripe)", in
 * `shop.js` „Eine Frei-Haus-Schwelle ab 1500 € misst am Bestellwert". Keines
 * von beiden ist ein Einkaufspreis; beide sagen etwas über einen.
 * ------------------------------------------------------------------ */

const muster = () => ausgabemuster(INTERNE_WOERTER, [1500, 1200, null, 1500]);

test('die Schwelle wird nur in Gesellschaft eines Frachtworts gesucht', () => {
  // Ohne die Klammer traf 1200 jede Artikelnummer und jedes Millimetermaß.
  // Ein Prüfer mit vierzig falschen Meldungen wird abgeschaltet.
  const echt = findeInterneWoerter('Frei Haus ab 1500 € Bestellwert', muster(), 'x');
  assert.equal(echt.length, 1);
  assert.match(echt[0].art, /Frei-Haus-Schwelle 1500/);
  assert.deepEqual(findeInterneWoerter('Rohr DN 1500, Länge 1200 mm', muster(), 'x'), []);
});

test('doppelte Schwellen ergeben ein Muster, fehlende keines', () => {
  const m = muster();
  assert.equal(m.filter((x) => /Frei-Haus-Schwelle/.test(x.name)).length, 2, '1500 zweimal, null gar nicht');
  assert.equal(m.length, INTERNE_WOERTER.length + 2);
});

test('der Abwicklername wird gefunden, wo er im Kundentext steht', () => {
  const f = findeInterneWoerter('Kreditkarte (EU-Karte, Listenpreis Stripe)', muster(), 'agb.html');
  assert.ok(f.some((x) => /Stripe/.test(x.art)), 'genau der Satz, der seit dem ersten Bau ausgeliefert wurde');
});

test('jedes Muster trägt seinen Grund mit', () => {
  for (const m of muster()) assert.ok(m.warum && m.warum.length >= 80, m.name);
});

test('eine hingenommene Fundstelle zählt nicht als offen', () => {
  const funde = findeInterneWoerter('{"id":"karte-stripe","name":"Kreditkarte (EU-Karte)"}', muster(), 'shop.js');
  const g = teileFunde(funde);
  assert.equal(g.offen.length, 0);
  assert.equal(g.hingenommen, 1);
  assert.equal(g.sauber, true);
});

test('eine hingenommene Fundstelle, die es nicht mehr gibt, fällt auf', () => {
  // Die Rückrichtung: Sonst stünde hier in einem Monat eine Ausnahme für eine
  // Stelle, die längst behoben ist — und sie läse sich wie ein Zustand.
  const g = teileFunde([]);
  assert.equal(g.leerlaufend.length, HINGENOMMEN.length);
  assert.equal(g.sauber, false);
});

test('jede hingenommene Fundstelle trägt einen tragfähigen Grund', () => {
  assert.ok(HINGENOMMEN.length >= 1, 'ein leeres Verzeichnis bestünde jede Prüfung');
  for (const h of HINGENOMMEN) assert.ok(h.warum.length >= 80, String(h.auszug));
});
