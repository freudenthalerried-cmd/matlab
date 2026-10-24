/**
 * Die Kurzbeschreibung, die in Suchergebnis und Sprachmodell landet.
 *
 * **Der Befund, 3. September 2026.** Die `<meta name="description">` jeder
 * Seite entstand als `kurz.slice(0, 300)`. Vier der 81 Seiten waren länger,
 * und alle vier endeten mitten im Wort — „das Ergebnis rechnen Sie m",
 * „Gesamthöhe, Ansc".
 *
 * > **Ein abgeschnittenes Wort sagt dem Leser und der Maschine dasselbe: hier
 * > hat jemand nicht hingesehen.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kurzfassung } from '../src/format.js';

test('was passt, bleibt unverändert', () => {
  const kurz = 'Ein kurzer Satz.';
  assert.equal(kurzfassung(kurz, 300), kurz);
  assert.equal(kurzfassung(kurz, kurz.length), kurz, 'genau auf der Grenze bleibt der Text ganz');
});

test('zu lang wird am letzten Satzende beendet', () => {
  const text = 'Erster Satz. Zweiter Satz. Ein dritter, der nicht mehr hineinpasst und weiterläuft.';
  const k = kurzfassung(text, 30);
  assert.equal(k, 'Erster Satz. Zweiter Satz.');
  assert.ok(!k.endsWith('…'), 'ein vollständiger Satz braucht keine Auslassung');
});

test('ohne Satzende wird an der Wortgrenze gekürzt', () => {
  // Der gemessene Fall: „…das Ergebnis rechnen Sie m" — mitten im Wort.
  const text = 'Die Mengen folgen aus den Maßen der gewählten Produkte und dem Rechenweg daneben';
  const k = kurzfassung(text, 40);
  assert.ok(k.length <= 42, `zu lang: ${k.length}`);
  assert.ok(k.endsWith(' …'), `keine Auslassung: ${k}`);
  const letztes = k.slice(0, -2).split(' ').pop();
  assert.ok(text.split(' ').includes(letztes), `„${letztes}" ist ein halbes Wort`);
});

test('kein Satzzeichen bleibt vor der Auslassung stehen', () => {
  const k = kurzfassung('Kleber, Gewebe, Dübel, Putzgrund und alles Weitere dazu', 24);
  assert.ok(!/[,;:–—-] …$/.test(k), `Satzzeichen vor der Auslassung: ${k}`);
});

test('leerer Text und unbrauchbare Grenze ergeben nichts Halbes', () => {
  assert.equal(kurzfassung('', 300), '');
  assert.equal(kurzfassung(null, 300), '');
  assert.equal(kurzfassung('Text', 0), '');
  assert.equal(kurzfassung('  mehrere   Leerzeichen  ', 300), 'mehrere Leerzeichen');
});

test('keine gebaute Seite endet mitten im Wort', () => {
  const site = fileURLToPath(new URL('../ausgabe/site', import.meta.url));
  const sammle = (o, hin = []) => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      const p = join(o, e.name);
      if (e.isDirectory()) sammle(p, hin);
      else if (e.name.endsWith('.html')) hin.push(p);
    }
    return hin;
  };
  const seiten = sammle(site);
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Seiten — die Schleife prüft zu wenig`);

  const angeschnitten = [];
  for (const pfad of seiten) {
    const html = readFileSync(pfad, 'utf8');
    const treffer = /<meta name="description" content="([^"]*)"/.exec(html);
    if (!treffer) { angeschnitten.push(`${pfad}: keine Beschreibung`); continue; }
    const text = treffer[1];
    // Eine gekürzte Beschreibung endet auf „ …", eine vollständige auf einem
    // Satzzeichen. Alles andere ist ein Schnitt mitten im Wort.
    if (!/(?: …|[.!?»"”)]|&[a-z]+;)$/.test(text)) {
      angeschnitten.push(`${pfad.slice(site.length + 1)}: …${text.slice(-40)}`);
    }
  }
  assert.deepEqual(angeschnitten, [], 'diese Beschreibungen brechen mitten im Wort ab');
});
