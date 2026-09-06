/**
 * **Was die Artikelseite über den Preisstand sagt — 6. September 2026.**
 *
 * Bis heute stand auf allen 46 Artikelseiten neben dem Datum: *„gültig bis zur
 * nächsten Liste"*. Der Satz behauptet eine Gültigkeit, die erst das Angebot
 * herstellt (14 Tage, § 862 ABGB), und knüpft sie an ein Ereignis, das dieser
 * Betrieb nicht beobachten kann: Der Preisrhythmus des Lieferanten ist
 * unbekannt.
 *
 * Diese Fälle halten die neue Aussage an der Wirklichkeit — **in beide
 * Richtungen**: Jede Seite über der Grenze trägt die Altersmarke, keine Seite
 * darunter trägt sie.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { preisalterTage, GRENZE_TAGE } from '../src/preisalter.js';
import { BINDEFRIST_TAGE } from '../src/beleg.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const ORDNER = join(SHOP, 'ausgabe', 'site', 'artikel');
const HEUTE = new Date().toISOString().slice(0, 10);

const katalog = () => JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')).artikel;

test('keine Artikelseite behauptet mehr eine Gültigkeit bis zur nächsten Liste', () => {
  if (!existsSync(ORDNER)) return; // ohne Bau keine Aussage — und keine falsche
  const seiten = readdirSync(ORDNER).filter((n) => n.endsWith('.html'));
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Artikelseiten`);
  const treffer = seiten.filter((n) => readFileSync(join(ORDNER, n), 'utf8').includes('gültig bis zur nächsten Liste'));
  assert.deepEqual(treffer, []);
});

test('jede Artikelseite nennt die Bindefrist des Angebots — dieselbe Zahl wie der Beleg', () => {
  if (!existsSync(ORDNER)) return;
  const seiten = readdirSync(ORDNER).filter((n) => n.endsWith('.html'));
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Artikelseiten`);
  const ohne = seiten.filter((n) => !readFileSync(join(ORDNER, n), 'utf8')
    .includes(`bindet ${BINDEFRIST_TAGE} Tage ab Angebotsdatum`));
  assert.deepEqual(ohne, []);
});

test('die Altersmarke steht genau dort, wo die Grundlage über der Grenze liegt', () => {
  if (!existsSync(ORDNER)) return;
  const artikel = katalog().filter((a) => a.preisStand);
  assert.ok(artikel.length >= 40, `nur ${artikel.length} Artikel mit Preisstand`);

  const falsch = [];
  let ueberGrenze = 0;
  for (const a of artikel) {
    const datei = join(ORDNER, `${a.sku}.html`);
    if (!existsSync(datei)) continue;
    const html = readFileSync(datei, 'utf8');
    const tage = preisalterTage(a.preisStand, HEUTE);
    const soll = typeof tage === 'number' && tage > GRENZE_TAGE;
    if (soll) ueberGrenze++;
    const ist = html.includes('Diese Grundlage ist');
    if (soll !== ist) falsch.push(`${a.sku}: ${tage} Tage, Marke ${ist ? 'steht' : 'fehlt'}`);
    if (soll) assert.ok(html.includes(`ist ${tage} Tage alt`), `${a.sku}: nennt das Alter nicht`);
  }
  assert.deepEqual(falsch, []);
  assert.ok(ueberGrenze >= 1,
    'kein Artikel über der Grenze — dann prüft dieser Fall die Marke nicht mehr, '
    + 'sondern nur noch ihre Abwesenheit');
});
