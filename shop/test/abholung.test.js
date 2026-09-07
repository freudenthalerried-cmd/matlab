/**
 * Selbstabholung — eine Zusage ohne Ort.
 *
 * **Befund vom 6. September 2026.** Fünf Stellen sagten dem Kunden, er könne
 * selbst abholen; eine nannte den **Betriebssitz**. Der Gründungsparameter
 * lautet „Reines Streckengeschäft, kein eigenes Warenlager", und Punkt 4
 * derselben AGB sagt „Direktversand durch den Hersteller".
 *
 * > **Punkt 4 sagt Direktversand vom Hersteller, Punkt 12 sagte Abholung am
 * > Betriebssitz — in derselben Datei, acht Punkte auseinander.**
 *
 * Belegt ist das Gegenteil und steht seit dem 27. August in den
 * Lieferantendaten: Elf von fünfzehn Rechnungen lauten „Abholung Kunde" —
 * abgeholt wird am Lager Mauthausen, und der Kunde sind wir.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ZUSAGE, abholungsbefund, abholungslage, abholungssatz } from '../src/abholung.js';
import { LIEFERGEBIET, pruefeLieferort } from '../src/liefergebiet.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

test('ohne Bestätigung wird nichts zugesagt — und der Grund steht dabei', () => {
  const s = abholungssatz({ abholungDurchKunden: null });
  assert.match(s, /nicht zusagen/);
  assert.match(s, /Streckengeschäft/);
  assert.match(s, /angefragt/);
  assert.ok(!ZUSAGE.test(s), 'der neue Satz darf nicht sein eigener Fund sein');
});

test('mit Bestätigung sagt der Shop es wieder — mit Ort', () => {
  const s = abholungssatz({ abholungDurchKunden: true, abholortName: 'am Lager Mauthausen' });
  assert.match(s, /am Lager Mauthausen/);
  assert.match(s, /keine Fracht/);
});

test('zugesagt wird nur, wenn jeder Lieferant es erlaubt', () => {
  assert.equal(abholungslage([{ abholungDurchKunden: true }]).abholungDurchKunden, true);
  assert.equal(abholungslage([{ abholungDurchKunden: true }, { abholungDurchKunden: null }])
    .abholungDurchKunden, null);
  assert.equal(abholungslage([]).abholungDurchKunden, null);
  // Der Ort steht nur, wenn es einen gibt: Bei zwei Lieferanten wären es zwei.
  assert.equal(abholungslage([{ abholungDurchKunden: true, abholortName: 'A' },
    { abholungDurchKunden: true, abholortName: 'B' }]).abholortName, null);
});

test('ein Text, der Abholung zusagt, ist der Fund', () => {
  const b = abholungsbefund({
    zugesagt: null,
    texte: [
      { name: 'lieferung.html', text: 'Ja, ausdrücklich vorgesehen. Wer selbst abholt, zahlt keine Fracht.' },
      { name: 'index.html', text: 'nichts dazu' },
      { name: 'kasse.html', text: 'nichts dazu' },
    ],
  });
  const m = b.meldungen.find((x) => x.regel === 'abholung-zugesagt-ohne-ort');
  assert.ok(m, 'die Meldung fehlt');
  assert.equal(m.wo, 'lieferung.html');
});

test('mit bestätigter Abholung ist derselbe Satz in Ordnung', () => {
  const b = abholungsbefund({
    zugesagt: true,
    texte: [
      { name: 'lieferung.html', text: 'Wer selbst abholt, zahlt keine Fracht.' },
      { name: 'a', text: '' }, { name: 'b', text: '' },
    ],
  });
  assert.deepEqual(b.meldungen, []);
});

test('zu wenige Texte sind kein grüner Befund', () => {
  const b = abholungsbefund({ zugesagt: null, texte: [{ name: 'x', text: '' }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-texte'));
});

test('die Absage an einen Bezirk außerhalb nennt keinen Ausweg, den es nicht gibt', () => {
  const b = pruefeLieferort({ bezirk: 'Wien', land: 'AT' });
  assert.equal(b.liefern, false);
  assert.ok(!ZUSAGE.test(b.grund), `die Absage verspricht Abholung: „${b.grund}"`);
  assert.match(LIEFERGEBIET.selbstabholung, /nicht zugesagt/);
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

test('keine gebaute Seite sagt Abholung zu, solange der Lieferant sie nicht bestätigt hat', () => {
  const lieferantenDatei = join(SHOP, 'data', 'lieferanten.json');
  if (!existsSync(SITE) || !existsSync(lieferantenDatei)) return; // ohne Bau keine Aussage

  const alle = JSON.parse(readFileSync(lieferantenDatei, 'utf8')).lieferanten ?? [];
  const katalog = JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8'));
  const gefuehrt = new Set((katalog.artikel ?? []).map((a) => a.lieferantId));
  const lage = abholungslage(alle.filter((l) => gefuehrt.has(l.id)));

  const texte = [];
  const gehe = (ordner, vorne) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      if (e.isDirectory()) { gehe(join(ordner, e.name), `${vorne}${e.name}/`); continue; }
      if (!/\.(html|txt)$/.test(e.name)) continue;
      texte.push({
        name: `${vorne}${e.name}`,
        text: readFileSync(join(ordner, e.name), 'utf8').replace(/<[^>]+>/g, ' '),
      });
    }
  };
  gehe(SITE, '');

  const b = abholungsbefund({ texte, zugesagt: lage.abholungDurchKunden, mindestens: 60 });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
});

test('die Lieferseite sagt, warum nicht abgeholt werden kann', () => {
  const datei = join(SITE, 'lieferung.html');
  if (!existsSync(datei)) return;
  const text = readFileSync(datei, 'utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.match(text, /Abholung können wir derzeit nicht zusagen/);
  // Und der Beleg, der dagegen zu sprechen scheint, steht dabei — sonst liest
  // es sich wie eine Ausrede, und der nächste Lauf hebt es wieder auf.
  assert.match(text, /Abholung Kunde/);
  assert.match(text, /Mauthausen/);
  // **Und nicht „am Lager".** `pruefe-inhalte` hat diesen Satz beim ersten Bau
  // gemeldet: Die Regel gegen Vorratsbehauptungen traf ausgerechnet die
  // Erklärung, dass es keinen Vorrat gibt. Sie hatte recht — gemeint ist der
  // Standort des Lieferanten, und so steht es jetzt da.
  assert.ok(!/am Lager/.test(text), 'die Seite behauptet wieder ein Lager');
});
