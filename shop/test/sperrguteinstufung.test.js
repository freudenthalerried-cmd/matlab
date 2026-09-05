/**
 * Woher wir wissen wollen, welche Ware auf der Palette kommt.
 *
 * **Der Anlass, 5. September 2026.** Auf der Seite des PVC-Kanalbogens stehen
 * „Gewicht 0,285 kg je Stück, aus dem Lieferschein" und „Palettierte Ware. Sie
 * wird mit dem Kran entladen" übereinander — seit es die Seite gibt.
 *
 * > **Ein Bogen von 285 Gramm, mit dem Kran entladen.** Beide Angaben stehen
 * > auf derselben Seite; nebeneinandergehalten hat sie nie jemand.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  SPERRGUT_GRUPPEN, HANDGEWICHT_KG, HINGENOMMEN, FLAECHEN,
  sperrgutAusGruppe, einstufungsbefund, flaechenbefund,
} from '../src/sperrguteinstufung.js';

const katalog = JSON.parse(readFileSync(new URL('../data/katalog-baustoff.json', import.meta.url), 'utf8'));

test('die Warengruppe entscheidet, und sonst nichts', () => {
  assert.equal(SPERRGUT_GRUPPEN.length, 4);
  for (const g of SPERRGUT_GRUPPEN) assert.equal(sperrgutAusGruppe(g), true, g);
  for (const g of ['WDVS', 'Mörtel', 'Zubehör', '', undefined]) {
    assert.equal(sperrgutAusGruppe(g), false, String(g));
  }
});

/**
 * Die Liste stand bis heute zweimal: hier und als eigenes `Set` in
 * `bin/katalog-aus-rechnungen.mjs`. Zwei Listen für dieselbe Sache sind
 * heute gleich und morgen vielleicht nicht.
 */
test('es gibt sie nur einmal — auch für den Einleser', async () => {
  const quelle = readFileSync(new URL('../bin/katalog-aus-rechnungen.mjs', import.meta.url), 'utf8');
  assert.ok(!/SPERRGUT_GRUPPEN\s*=\s*new Set/.test(quelle), 'zweite Fassung derselben vier Namen');
  assert.match(quelle, /sperrgutAusGruppe/);
});

test('der Bestand widerspricht sich in vier Fällen, und jeder trägt seinen Grund', () => {
  const b = einstufungsbefund(katalog.artikel);
  assert.equal(b.artikel, 46);
  assert.ok(b.mitGewicht >= 5, `nur ${b.mitGewicht} Artikel mit Gewicht — dann prüft das hier wenig`);
  assert.equal(b.widersprueche, 4);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  // Die Zahl, die den Anlass trägt: keine einzige Einstufung ist belegt.
  assert.equal(b.unbelegt, 46);
});

test('jeder hingenommene Fall trägt einen tragfähigen Grund', () => {
  assert.ok(HINGENOMMEN.length > 0, 'eine leere Liste bestünde jede Prüfung');
  for (const h of HINGENOMMEN) {
    assert.ok(h.warum.length >= 200, `${h.sku}: Begründung zu kurz`);
    assert.ok(h.kurz, `${h.sku}: ohne kurze Fassung ist die Ausgabe unlesbar`);
  }
});

/* ------------------------------------------------------------------ *
 * Die Regeln einzeln
 * ------------------------------------------------------------------ */

const artikel = (x) => ({
  sku: 'A-1', gruppe: 'Kanal', einheit: 'STK', bezeichnung: 'Probe', sperrgut: true, ...x,
});

test('leichte Ware mit Kranentladung fällt auf', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 0.285 })], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['leicht-und-sperrgut']);
  assert.match(b.meldungen[0].text, /0\.285 kg/);
});

test('schwere Ware ohne Kranentladung auch', () => {
  const b = einstufungsbefund([artikel({ gruppe: 'Mörtel', sperrgut: false, gewichtKg: 40 })], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['schwer-und-frei']);
});

test('zwischen den Grenzen wird nicht geurteilt', () => {
  // Genau auf der Grenze gilt sie als schwer; knapp darunter ist der Fall
  // nicht zu entscheiden, und ein Prüfer, der ihn entscheidet, erfindet.
  const frei = (kg) => artikel({ gruppe: 'Mörtel', sperrgut: false, gewichtKg: kg });
  assert.equal(einstufungsbefund([frei(HANDGEWICHT_KG)], []).meldungen.length, 1);
  assert.equal(einstufungsbefund([frei(HANDGEWICHT_KG - 1)], []).meldungen.length, 0);
  assert.equal(einstufungsbefund([artikel({ sperrgut: true, gewichtKg: HANDGEWICHT_KG })], []).meldungen.length, 0);
});

test('ohne belegtes Gewicht gibt es kein Urteil', () => {
  const b = einstufungsbefund([artikel({}), artikel({ sku: 'A-2', gewichtKg: null })], []);
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.mitGewicht, 0);
});

test('eine gespeicherte Einstufung, die der eigenen Regel widerspricht', () => {
  const b = einstufungsbefund([artikel({ gruppe: 'WDVS', sperrgut: true })], []);
  assert.ok(b.meldungen.some((m) => m.regel === 'gruppe-widerspricht'));
});

test('ein Grund ohne Widerspruch bleibt nicht stehen', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 30 })], [{ sku: 'A-1', warum: 'x'.repeat(120) }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-ohne-widerspruch'));
});

test('ein Grund für einen Artikel, den es nicht gibt', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 0.3 })], [
    { sku: 'A-1', warum: 'x'.repeat(120) },
    { sku: 'GIBTESNICHT', warum: 'y'.repeat(120) },
  ]);
  assert.ok(b.meldungen.some((m) => m.regel === 'eintrag-ohne-artikel'));
});

test('ein zu dünner Grund zählt nicht als Grund', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 0.3 })], [{ sku: 'A-1', warum: 'ist halt so' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-zu-duenn'));
});

/* ------------------------------------------------------------------ *
 * Was die Seite dem Kunden sagt
 * ------------------------------------------------------------------ */

test('die Artikelseite nennt die Herkunft der Einstufung', async () => {
  const { existsSync } = await import('node:fs');
  const pfad = new URL('../ausgabe/site/artikel/POS-10115.html', import.meta.url);
  if (!existsSync(pfad)) return; // pruefung: begruendet — ohne Bau gibt es nichts zu lesen
  const html = readFileSync(pfad, 'utf8');
  assert.match(html, /Einstufung als palettierte Ware stammt aus der/);
  assert.match(html, /Warengruppe Kanal<\/strong> und nicht aus einer Angabe des Lieferanten/);
  // Und der Widerspruch steht dabei, nicht nur die Herkunft.
  assert.match(html, /wiegt 0,285 kg je Stück/);
});

/* ------------------------------------------------------------------ *
 * Wo der Kunde davon liest — ergänzt am 5. September, morgens
 *
 * **Der Befund.** Die Artikelseite nennt die Herkunft der Einstufung seit dem
 * Vortag. `llms.txt` sagte weiter nur „· palettiert", das Kassenbündel
 * „palettiert, Kranentladung je Hub".
 *
 * > **Eine Auskunft, die an einer Stelle qualifiziert ist und an der
 * > maschinenlesbaren blank steht, wird von Assistenten als Tatsache
 * > weitergegeben.**
 * ------------------------------------------------------------------ */

test('jede gebaute Fläche nennt ihren Grund, warum sie geführt wird', () => {
  assert.ok(FLAECHEN.length >= 2, 'weniger als zwei Flächen wären verdächtig wenig');
  for (const f of FLAECHEN) {
    assert.ok(f.datei, 'eine Fläche ohne Datei lässt sich nicht lesen');
    assert.ok(f.warum.length >= 60, `${f.datei}: Begründung zu kurz`);
  }
});

test('eine Fläche, die die Kranentladung nennt und ihre Herkunft nicht', () => {
  const b = flaechenbefund(() => 'Zustellung inkl. Kranentladung je Hub.');
  assert.equal(b.sauber, false);
  assert.ok(b.meldungen.every((m) => m.regel === 'einstufung-ohne-herkunft'));
});

test('eine Fläche ohne das Wort wird nicht behelligt', () => {
  // Nicht jede gebaute Datei muss davon reden. Ein Prüfer, der das verlangte,
  // erzwänge den Satz an Stellen, an denen er nichts zu suchen hat.
  const b = flaechenbefund(() => 'Nur Preise und Lieferzeiten.');
  assert.equal(b.sauber, true);
});

test('eine Fläche, die es nicht gibt, ist ein Befund und kein Freispruch', () => {
  const b = flaechenbefund(() => null);
  assert.ok(b.meldungen.every((m) => m.regel === 'flaeche-fehlt'));
  assert.equal(b.meldungen.length, FLAECHEN.length);
});

test('mit Herkunftsangabe ist die Fläche in Ordnung', () => {
  const b = flaechenbefund(() => 'palettiert — die Angabe folgt aus der Warengruppe.');
  assert.equal(b.sauber, true);
});

/**
 * Und der Satz an der Frachtzeile: Er stand bis heute zweimal im Bestand,
 * gehalten von einer Probe. Jetzt steht er einmal — und sagt, **welche** der
 * beiden Schätzungen gemeint ist.
 */
test('der Frachtsatz nennt beide Schätzungen getrennt', async () => {
  const { frachtGrundText } = await import('../src/frachttext.js');
  assert.equal(frachtGrundText(0), 'Pauschale');
  const drei = frachtGrundText(3);
  assert.match(drei, /3× Kranentladung/);
  assert.match(drei, /je Sperrgut-Position/, 'die Zahl der Hübe ist geschätzt');
  assert.match(drei, /aus der Warengruppe/, 'und die Einstufung selbst auch');
  // Ein Sonderfall, den der alte Ausdruck mit `> 0` schon richtig traf und der
  // beim Verlegen leicht verlorengeht.
  assert.equal(frachtGrundText(null), 'Pauschale');
  assert.equal(frachtGrundText(undefined), 'Pauschale');
});
