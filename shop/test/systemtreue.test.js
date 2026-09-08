import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  OHNE_SCHICHT, SCHICHTEN, SYSTEME,
  einordnung, systembruch, systembruchsatz, zuordnungsbefund,
} from '../src/systemtreue.js';

const KATALOG = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8',
));

/** Dieselbe Auswahl, die der Prüfer trifft. */
const kandidaten = () => KATALOG.artikel.filter(
  (a) => a.gruppe === 'WDVS' || SCHICHTEN.some((s) => s.muster.test(a.bezeichnung)),
);

const artikel = (sku, bezeichnung) => ({ sku, bezeichnung });

test('jedes System und jede Schicht trägt einen Grund, der trägt', () => {
  assert.ok(SYSTEME.length >= 2, 'mit einem System gäbe es nichts zu vergleichen');
  for (const s of SYSTEME) assert.ok(s.warum.length > 80, `${s.name}: der Grund ist zu knapp`);
  assert.ok(SCHICHTEN.length >= 3);
  for (const s of SCHICHTEN) assert.ok(s.warum.length > 80, `${s.rolle}: der Grund ist zu knapp`);
});

/**
 * Der Kern des Registers: Wer einen Artikel aus der Systemprüfung nimmt, sagt
 * warum. Beim Dübel ist der Grund die eigene Wissensseite — er trägt eine
 * eigene Zulassung.
 */
test('jede Ausnahme nennt Artikel und Grund', () => {
  assert.ok(OHNE_SCHICHT.length >= 1);
  for (const e of OHNE_SCHICHT) {
    assert.match(e.sku, /^POS-\d+$/);
    assert.ok(e.was, `${e.sku}: ohne Bezeichnung ist der Eintrag nicht nachvollziehbar`);
    assert.ok(e.warum.length > 120, `${e.sku}: der Grund ist zu knapp, um in einem Jahr zu tragen`);
  }
});

test('der echte Katalog ergibt einen sauberen Befund', () => {
  const b = zuordnungsbefund(kandidaten());
  assert.deepEqual(b.meldungen, []);
  assert.ok(b.geprueft >= 8);
});

test('die Klebe- und Spachtelmasse wird als Schicht erkannt — mit Bindestrich und „und"', () => {
  // Der erste Anlauf las `Klebe[- ]?(und )?Spachtel` und ließ ausgerechnet die
  // zwei Capatect-Massen durchfallen: Zwischen den Wörtern stehen zwei Zeichen.
  const e = einordnung(artikel('POS-11283', 'Capatect Klebe- und Spachtelmasse 186 M 25 kg'));
  assert.equal(e.schicht, 'Klebe- und Armierungsmörtel');
  assert.equal(e.system, 'Capatect');
  const b = einordnung(artikel('POS-29108', 'Baumit KlebeSpachtel 25 kg'));
  assert.equal(b.schicht, 'Klebe- und Armierungsmörtel');
  assert.equal(b.system, 'Baumit');
});

test('ein Zubehörteil ist keine Schicht', () => {
  for (const [sku, bez] of [
    ['POS-52124', 'Capatect Gewebeanschlussleiste 3D Universal Plus 2,55 m'],
    ['POS-53402', 'Capatect Kantenschutz mit Gewebe Carbon 11,5 13,5 cm 2,5 m'],
    ['POS-11082', 'Capatect Universaldübel Schraubdübel 053 115, 100 STK, 1 KAR'],
  ]) {
    assert.equal(einordnung(artikel(sku, bez)).schicht, null, `${bez} gilt als Schicht`);
  }
});

test('zwei Systeme im Korb sind ein Bruch — der Fall aus der eigenen Wissensseite', () => {
  const bruch = systembruch([
    artikel('POS-11283', 'Capatect Klebe- und Spachtelmasse 186 M 25 kg'),
    artikel('POS-52058', 'Baumit TextilglasGitter 1,1x50 m'),
  ]);
  assert.deepEqual(bruch.systeme, ['Baumit', 'Capatect']);
  assert.match(systembruchsatz(bruch), /ETAG 004/);
  assert.match(systembruchsatz(bruch), /Glasgewebe/);
});

/**
 * Der grüne Fall — der Befund vom 6. September über sieben Sperren, die nur
 * ihren eigenen Sperrgrund kannten. Eine Warnung, die bei jedem Korb angeht,
 * liest nach dem dritten Mal niemand mehr.
 */
test('ein Korb aus einem System ist kein Bruch', () => {
  assert.equal(systembruch([
    artikel('POS-11283', 'Capatect Klebe- und Spachtelmasse 186 M 25 kg'),
    artikel('POS-50509', 'Capatect Glasgewebe M, Breite 110cm, orange 55 m2'),
  ]), null);
});

test('ein Dübel des anderen Hauses ist kein Bruch — er trägt eine eigene Zulassung', () => {
  assert.equal(systembruch([
    artikel('POS-11283', 'Capatect Klebe- und Spachtelmasse 186 M 25 kg'),
    artikel('POS-52537', 'Drehstiftdübel PK(100) K 6 40 mm'),
  ]), null);
});

test('ohne Bruch gibt es keinen Satz', () => {
  assert.equal(systembruchsatz(null), '');
});

test('eine Schicht ohne erkennbares System ist ein Befund', () => {
  const b = zuordnungsbefund([artikel('POS-99999', 'Namenloser Putzgrund 25 kg')]);
  assert.deepEqual(b.meldungen.map((m) => m.regel).filter((r) => r === 'schicht-ohne-system'),
    ['schicht-ohne-system']);
});

test('ein Artikel ohne Schicht und ohne Eintrag ist ein Befund', () => {
  const b = zuordnungsbefund([artikel('POS-99998', 'Capatect Neuheit ohne Rolle')], []);
  assert.ok(b.meldungen.some((m) => m.regel === 'artikel-ohne-schicht'));
});

test('ein Eintrag, dessen Artikel verschwunden ist, ist ein Befund — die zweite Richtung', () => {
  const b = zuordnungsbefund([], OHNE_SCHICHT);
  assert.equal(b.meldungen.length, OHNE_SCHICHT.length);
  assert.ok(b.meldungen.every((m) => m.regel === 'eintrag-ohne-artikel'));
});

/**
 * Der Weg bis zum Kunden — nicht nur bis zum Modul. Der Befund vom
 * 6. September: Eine Regel, die niemand hinausträgt, ist keine.
 */
test('ein gemischter Warenkorb trägt den Hinweis bis in den Anfragetext', async () => {
  const { ladeBaustoffkatalog } = await import('../src/baustoffkatalog.js');
  const { kundenWarenkorb } = await import('../src/shopkern.js');
  const { baueKundenanfrage } = await import('../src/kundenanfrage.js');
  const lies = (n) => JSON.parse(readFileSync(fileURLToPath(new URL(n, import.meta.url)), 'utf8'));
  const betreiber = lies('../data/betreiber.json');
  const katalog = ladeBaustoffkatalog(
    lies('../data/katalog-baustoff.json'),
    lies('../../preise/baustoff-preise.json'),
    lies('../data/lieferanten.json'),
  );
  // Mengen über dem Mindestbestellwert — sonst entsteht nach Gate 25 gar keine
  // Anfrage, und die Probe wäre grün, ohne etwas gezeigt zu haben.
  const rechnung = kundenWarenkorb(
    [{ sku: 'POS-11283', menge: 400 }, { sku: 'POS-52058', menge: 40 }],
    {
      artikel: katalog.artikel,
      lieferanten: [...katalog.lieferantenById.values()],
      mindestbestellwertNetto: betreiber.mindestbestellwertNetto,
    },
  );
  const anfrage = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber });
  assert.equal(anfrage.moeglich, true, 'ohne mögliche Anfrage prüft der Rest nichts');
  const zeile = anfrage.text.split('\n').find((z) => /Systemtreue/.test(z));
  assert.ok(zeile, 'der Anfragetext nennt die Systemtreue nicht');
  // **Ein Hinweis ist kein offener Punkt.** Er darf nicht als „Offen:"
  // erscheinen — das sagte dem Kunden, seine Bestellung sei unvollständig.
  assert.ok(zeile.startsWith('Hinweis zur Systemtreue'), `als offener Punkt ausgegeben: ${zeile}`);
});

test('ein systemtreuer Warenkorb trägt keinen Hinweis hinaus', async () => {
  const { ladeBaustoffkatalog } = await import('../src/baustoffkatalog.js');
  const { kundenWarenkorb } = await import('../src/shopkern.js');
  const lies = (n) => JSON.parse(readFileSync(fileURLToPath(new URL(n, import.meta.url)), 'utf8'));
  const katalog = ladeBaustoffkatalog(
    lies('../data/katalog-baustoff.json'),
    lies('../../preise/baustoff-preise.json'),
    lies('../data/lieferanten.json'),
  );
  const rechnung = kundenWarenkorb(
    [{ sku: 'POS-11283', menge: 400 }, { sku: 'POS-50509', menge: 4 }],
    { artikel: katalog.artikel, lieferanten: [...katalog.lieferantenById.values()] },
  );
  assert.equal((rechnung.offen ?? []).some((o) => /Systemtreue/.test(o)), false);
});
