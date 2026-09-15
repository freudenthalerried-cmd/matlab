import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  OHNE_SCHICHT, SCHICHTEN, SYSTEM_UNBEKANNT,
  einordnung, systembruch, systembruchsatz, zuordnungsbefund, gewerkbefund,
  artikelseitensystembefund, kartensystembefund, systemkurz,
} from '../src/systemtreue.js';

const KATALOG = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8',
));

/** Dieselbe Auswahl, die der Prüfer trifft. */
const kandidaten = () => KATALOG.artikel.filter(
  (a) => a.gruppe === 'WDVS' || SCHICHTEN.some((s) => s.muster.test(a.bezeichnung)),
);

const artikel = (sku, bezeichnung) => ({ sku, bezeichnung });

test('jede Schicht trägt einen Grund, der trägt', () => {
  // **Am 8. September abends fiel `SYSTEME` weg.** Das System eines Artikels
  // ist sein Hersteller, und den führt `src/hersteller.js` — eine Liste.
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
  assert.equal(e.system, 'Synthesa (Capatect)');
  const b = einordnung(artikel('POS-29108', 'Baumit KlebeSpachtel 25 kg'));
  assert.equal(b.schicht, 'Klebe- und Armierungsmörtel');
  assert.equal(b.system, 'Baumit Österreich');
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
  assert.deepEqual(bruch.systeme, ['Baumit Österreich', 'Synthesa (Capatect)']);
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
  const b = zuordnungsbefund([], OHNE_SCHICHT, []);
  assert.equal(b.meldungen.length, OHNE_SCHICHT.length);
  assert.ok(b.meldungen.every((m) => m.regel === 'eintrag-ohne-artikel'));
});

/**
 * Dasselbe für das zweite Register — und der wichtigere Fall: Nennt die
 * Bezeichnung eines Tages doch einen Hersteller, gehört der Eintrag weg.
 */
test('ein System-unbekannt-Eintrag, dessen Artikel eine Marke bekommt, ist ein Befund', () => {
  const b = zuordnungsbefund(
    [{ sku: 'POS-18110', bezeichnung: 'Schiedel Mantelsteinkleber Dünnbettmörtel' }],
    [], SYSTEM_UNBEKANNT,
  );
  assert.ok(b.meldungen.some((m) => m.regel === 'unbekannt-und-doch-bekannt'));
});

test('ein System-unbekannt-Eintrag ohne Artikel ist ein Befund', () => {
  const b = zuordnungsbefund([], [], SYSTEM_UNBEKANNT);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['unbekannt-ohne-artikel']);
});

test('jeder System-unbekannt-Eintrag nennt Grund und Weg zur Auflösung', () => {
  assert.ok(SYSTEM_UNBEKANNT.length >= 1);
  for (const u of SYSTEM_UNBEKANNT) {
    assert.match(u.sku, /^POS-\d+$/);
    assert.ok(u.warum.length > 150, `${u.sku}: der Grund ist zu knapp`);
    assert.ok(u.loest.length > 80, `${u.sku}: ohne Weg zur Auflösung bleibt es eine Ausrede`);
  }
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

test('jedes Gewerk der Liste nennt seine Seite und einen Grund', async () => {
  const { GEWERKE } = await import('../src/systemtreue.js');
  assert.ok(GEWERKE.length >= 2);
  for (const g of GEWERKE) {
    assert.ok(g.gruppe, 'ein Gewerk ohne Gruppe lässt sich nicht am Katalog messen');
    assert.match(g.seite, /^wissen\//, `${g.gruppe}: die Fundstelle fehlt`);
    assert.ok(g.warum.length > 150, `${g.gruppe}: der Grund ist zu knapp`);
    if (!g.messbar) {
      assert.match(g.blockiert ?? '', /^POS-\d+$/,
        `${g.gruppe}: „nicht bestimmbar" ohne den Artikel, an dem es scheitert, ist eine Ausrede`);
    }
  }
});

test('die Wissensseite jedes Gewerks behauptet die Systemtreue wirklich', async () => {
  const { GEWERKE } = await import('../src/systemtreue.js');
  assert.ok(GEWERKE.length >= 2, 'ohne Gewerke prüft die Schleife darunter nichts');
  for (const g of GEWERKE) {
    const text = readFileSync(
      fileURLToPath(new URL(`../inhalte/${g.seite}.md`, import.meta.url)), 'utf8',
    );
    assert.match(text, /nicht mit denen eines anderen|nicht mischen|Mischen verlässt/,
      `${g.seite} sagt nichts über Systemtreue — dann gehört das Gewerk nicht in diese Liste`);
  }
});

test('der echte Katalog ergibt einen sauberen Gewerkbefund', async () => {
  const { gewerkbefund } = await import('../src/systemtreue.js');
  assert.deepEqual(gewerkbefund(KATALOG.artikel).meldungen, []);
});


test('„nicht bestimmbar" ohne benannten Artikel ist ein Befund', async () => {
  const { gewerkbefund } = await import('../src/systemtreue.js');
  const b = gewerkbefund(KATALOG.artikel, [
    { gruppe: 'Kamin', seite: 'wissen/kaminzug-aufbau', messbar: false, warum: 'x'.repeat(160) },
  ]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['unmessbar-ohne-beleg']);
});

test('ein messbares Gewerk mit einer stummen Schicht ist ein Befund', async () => {
  const { gewerkbefund } = await import('../src/systemtreue.js');
  const b = gewerkbefund(
    [{ sku: 'POS-99997', gruppe: 'WDVS', bezeichnung: 'Namenloser Putzgrund 25 kg' }],
    [{ gruppe: 'WDVS', seite: 'wissen/wdvs-systemaufbau', messbar: true, warum: 'x'.repeat(160) }],
  );
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['messbar-und-doch-stumm']);
});

/**
 * **Der Befund vom 9. September.** Die Kasse warnt seit dem Vortag vor
 * gemischten Systemen; `llms.txt` führte „Capatect Glasgewebe" zu 1,07 € und
 * „Baumit TextilglasGitter" zu 1,19 € in derselben Gruppe, ohne Unterschied.
 * Ein Assistent stellt daraus einen Korb zusammen, bevor ein Mensch ihn sieht.
 */
const zweiSysteme = [
  { sku: 'POS-50509', bezeichnung: 'Capatect Glasgewebe M 55 m2' },
  { sku: 'POS-52058', bezeichnung: 'Baumit TextilglasGitter 1,1x50 m' },
];
const zeilen = (mitSystem) => zweiSysteme
  .map((a) => `- [${a.bezeichnung}](https://x/artikel/${a.sku}.html): 1,00 € · WDVS`
    + (mitSystem ? ` · Glasgewebe des Systems ${a.bezeichnung.startsWith('Capatect') ? 'Synthesa (Capatect)' : 'Baumit Österreich'}` : ''))
  .join('\n');

test('führt llms.txt zwei Systeme in einer Rolle, muss der Satz dastehen', async () => {
  const { llmssystembefund } = await import('../src/systemtreue.js');
  const b = llmssystembefund(zeilen(true), zweiSysteme);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['systemtreue-unerwaehnt']);
});

test('mit dem Satz und den Systemen in den Zeilen meldet sie nichts', async () => {
  const { llmssystembefund } = await import('../src/systemtreue.js');
  const text = `… verlässt die geprüfte Zusammenstellung …\n${zeilen(true)}`;
  assert.deepEqual(llmssystembefund(text, zweiSysteme).meldungen, []);
});

/**
 * Der wichtigere der beiden Fälle: Ein Satz im Vorspann nützt nichts, wenn die
 * Zeile darunter schweigt — ein Assistent liest die Zeile, nicht den Vorspann.
 */
test('ein Satz im Vorspann genügt nicht, wenn die Zeile ihr System nicht nennt', async () => {
  const { llmssystembefund } = await import('../src/systemtreue.js');
  const text = `… verlässt die geprüfte Zusammenstellung …\n${zeilen(false)}`;
  const b = llmssystembefund(text, zweiSysteme);
  assert.equal(b.meldungen.length, 2);
  assert.ok(b.meldungen.every((m) => m.regel === 'schicht-ohne-system-in-llms'));
});

test('führt die Datei nur ein System, ist nichts zu melden', async () => {
  const { llmssystembefund } = await import('../src/systemtreue.js');
  const nur = [zweiSysteme[0]];
  assert.deepEqual(llmssystembefund(zeilen(true), nur).meldungen, []);
});

test('der echte Bau ist sauber', async () => {
  const { llmssystembefund } = await import('../src/systemtreue.js');
  const pfad = fileURLToPath(new URL('../ausgabe/site/llms.txt', import.meta.url));
  if (!existsSync(pfad)) return; // ohne Bau keine Aussage
  assert.deepEqual(llmssystembefund(readFileSync(pfad, 'utf8'), KATALOG.artikel).meldungen, []);
});

// **Ergänzt am 9. September 2026.** Die Systemtreue stand in der Kasse, in
// `llms.txt` und auf einer Wissensseite — auf keiner der 46 Artikelseiten. Das
// ist die Fläche, auf der die Schicht ausgewählt wird, und das Ziel der
// bezahlten Anzeigen.
test('eine Schicht, deren Seite ihr System nicht nennt, ist ein Befund', () => {
  const artikel = [{ sku: 'POS-10837', bezeichnung: 'Mantelstein MSTS EZ 16-18 SIKM', gruppe: 'Kamin' }];
  const b = artikelseitensystembefund(() => '<p>Kein Wort dazu.</p>', artikel);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'artikelseite-ohne-system');
  assert.match(b.meldungen[0].text, /Schiedel/);
});

test('nennt die Seite ihr System, meldet die Regel nichts', () => {
  const artikel = [{ sku: 'POS-10837', bezeichnung: 'Mantelstein MSTS EZ 16-18 SIKM', gruppe: 'Kamin' }];
  const b = artikelseitensystembefund(
    () => '<p>Mantelstein des Systems Schiedel Österreich.</p>', artikel);
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.schichten, 1, 'ohne Schicht prüfte die Regel nichts');
  assert.equal(b.gelesen, 1);
});

test('eine fehlende Artikelseite ist nicht messbar und nicht grün', () => {
  const artikel = [{ sku: 'POS-10837', bezeichnung: 'Mantelstein MSTS EZ 16-18 SIKM', gruppe: 'Kamin' }];
  const b = artikelseitensystembefund(() => null, artikel);
  assert.equal(b.meldungen[0].regel, 'artikelseite-fehlt');
  assert.equal(b.gelesen, 0);
});

test('ein Artikel ohne Systembindung wird nicht verlangt', () => {
  // Dübel und Zubehör tragen eine eigene Zulassung — von ihnen den Satz zu
  // verlangen hieße, eine Systemtreue zu behaupten, die es dort nicht gibt.
  const artikel = [{ sku: 'POS-11082', bezeichnung: 'Capatect Universaldübel Schraubdübel 053 115', gruppe: 'WDVS' }];
  const b = artikelseitensystembefund(() => '<p>Nichts.</p>', artikel);
  assert.equal(b.schichten, 0);
  assert.deepEqual(b.meldungen, []);
});

/*
 * ## Vier Regeln, die niemand hat feuern sehen
 *
 * **14. September 2026, abends.** Die Zählung der Regelnamen vom Vormittag
 * führt 67 Stellen, deren Name in keinem Testfall vorkommt. Vier davon stehen
 * in diesem Modul, und alle vier halten ein **Register gegen den Katalog** —
 * die Sorte Regel, die erst greift, wenn sich der Katalog ändert, und die
 * deshalb am ehesten unbemerkt kaputtgeht.
 */
test('Ein befreiter Artikel, der doch eine Schicht trifft', () => {
  const befreit = [{ sku: 'POS-77001', was: 'Probe', warum: 'x'.repeat(90) }];
  const b = zuordnungsbefund([artikel('POS-77001', 'Capatect Klebespachtel 25 kg')], befreit, []);
  assert.ok(b.meldungen.some((m) => m.regel === 'befreiter-artikel-ist-schicht'),
    JSON.stringify(b.meldungen));
});

test('Ein System-unbekannter Artikel, der gar keine Schicht mehr ist', () => {
  const unbekannt = [{ sku: 'POS-77002', was: 'Probe', warum: 'x'.repeat(90) }];
  const b = zuordnungsbefund([artikel('POS-77002', 'Schubkarre 80 Liter')], [], unbekannt);
  assert.ok(b.meldungen.some((m) => m.regel === 'unbekannt-ohne-schicht'),
    JSON.stringify(b.meldungen));
});

test('Ein Gewerk ohne Artikel und ein verschwundener Blockierer', () => {
  const leer = gewerkbefund([], [{ gruppe: 'WDVS', seite: 'x', messbar: true }]);
  assert.deepEqual(leer.meldungen.map((m) => m.regel), ['gewerk-ohne-artikel'],
    JSON.stringify(leer.meldungen));

  const gewerk = [{ gruppe: 'Kamin', seite: 'x', messbar: false, blockiert: 'POS-77003' }];
  const ohneBlockierer = gewerkbefund(
    [{ sku: 'POS-77004', bezeichnung: 'Mantelstein MSTS EZ 16-18 SIKM', gruppe: 'Kamin' }], gewerk,
  );
  assert.deepEqual(ohneBlockierer.meldungen.map((m) => m.regel), ['blockierer-verschwunden'],
    JSON.stringify(ohneBlockierer.meldungen));

  const mitBlockierer = gewerkbefund(
    [{ sku: 'POS-77003', bezeichnung: 'Mantelsteinkleber RMRTL', gruppe: 'Kamin' }], gewerk,
  );
  assert.deepEqual(mitBlockierer.meldungen, [], JSON.stringify(mitBlockierer.meldungen));
});

test('Die Gewerkeliste dieses Hauses ist in Ordnung', () => {
  const b = gewerkbefund(KATALOG.artikel);
  assert.deepEqual(b.meldungen, [], JSON.stringify(b.meldungen));
  assert.ok(b.gewerke >= 2, `nur ${b.gewerke} Gewerke — die Messung sagt dann wenig`);
});

/*
 * **Die Fläche vor der Artikelseite — 15. September 2026.** Die Kasse warnt
 * seit dem 8. September, die Artikelseite sagt es, `llms.txt` seit dem
 * 9. September auch. Die Gruppenseite sagte es bei keinem der zehn gebundenen
 * Artikel — und sie ist die erste, die ein Besucher sieht.
 *
 * > **Eine Warnung, die erst in der Kasse kommt, kommt nach der Entscheidung.**
 */
test('der Systemname wird auf Kartenlänge gekürzt, nicht abgeschnitten', () => {
  assert.equal(systemkurz('Synthesa (Capatect)'), 'Capatect');
  assert.equal(systemkurz('Baumit Österreich'), 'Baumit');
  assert.equal(systemkurz('Schiedel Österreich'), 'Schiedel');
  assert.equal(systemkurz(''), null, 'ohne System gibt es nichts zu kürzen');
  assert.equal(systemkurz(null), null);
});

test('eine Karte ohne Systemmarke ist ein Befund', () => {
  const gebunden = KATALOG.artikel.filter((a) => {
    const e = einordnung(a);
    return e.schicht && e.system;
  });
  assert.ok(gebunden.length >= 3, `nur ${gebunden.length} gebundene Schichten im Katalog`);
  const [erste] = gebunden;
  const kurz = systemkurz(einordnung(erste).system);

  const gut = kartensystembefund(
    () => `<span class="marker system">${kurz}-System</span>`, [erste],
  );
  assert.deepEqual(gut.meldungen, [], JSON.stringify(gut.meldungen));
  assert.equal(gut.mitMarke, 1);

  const stumm = kartensystembefund(() => '<span class="preis">1,00 €</span>', [erste]);
  assert.deepEqual(stumm.meldungen.map((m) => m.regel), ['karte-ohne-system'],
    'dort wird ausgewählt, und eine Warnung in der Kasse kommt nach der Entscheidung');

  const falsch = kartensystembefund(
    () => '<span class="marker system">Irgendwer-System</span>', [erste],
  );
  assert.deepEqual(falsch.meldungen.map((m) => m.regel), ['karte-ohne-system'],
    'die falsche Marke ist schlimmer als keine');
});

test('eine Karte, die ein System behauptet, das der Artikel nicht hat, ist ein Befund', () => {
  const frei = KATALOG.artikel.find((a) => {
    const e = einordnung(a);
    return !(e.schicht && e.system);
  });
  assert.ok(frei, 'kein ungebundener Artikel im Katalog — die Gegenrichtung prüft dann nichts');

  const b = kartensystembefund(() => '<span class="marker system">Capatect-System</span>', [frei]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['karte-behauptet-system'],
    'Dübel und Zubehör tragen eine eigene Zulassung');

  const ohne = kartensystembefund(() => '<span class="preis">1,00 €</span>', [frei]);
  assert.deepEqual(ohne.meldungen, []);
});

test('eine fehlende Karte ist kein grünes Ergebnis — aber nur, wo eine gehört', () => {
  const gebunden = KATALOG.artikel.filter((a) => {
    const e = einordnung(a);
    return e.schicht && e.system;
  });
  assert.ok(gebunden.length >= 1, 'ohne gebundene Schicht prüft dieser Fall nichts');
  const b = kartensystembefund(() => null, [gebunden[0]]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['karte-fehlt'],
    'eine fehlende Karte ist kein Beleg dafür, dass die Marke dort steht');

  const frei = KATALOG.artikel.find((a) => {
    const e = einordnung(a);
    return !(e.schicht && e.system);
  });
  assert.deepEqual(kartensystembefund(() => null, [frei]).meldungen, [],
    'wo keine Marke hingehört, ist eine fehlende Karte kein Befund dieses Prüfers');
});
