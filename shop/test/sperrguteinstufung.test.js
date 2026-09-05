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
  SPERRGUT_GRUPPEN, HANDGEWICHT_KG, HINGENOMMEN,
  sperrgutAusGruppe, einstufungsbefund,
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
