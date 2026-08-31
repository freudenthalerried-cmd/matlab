import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leseArtikelliste, fuehreZusammen, istStand, WARENGRUPPEN, istGtin } from '../src/artikelliste.js';

const KOPF_SPARTE = 'sku;bezeichnung;einheit;ek_netto;uvp_netto;sparte';

/**
 * **Das Werkzeug für den Tag, auf den dieses Vorhaben wartet.** Am 30.08.
 * stellte sich heraus, dass keines der vorhandenen eine Artikelliste
 * verarbeiten kann. Dieses tut es — und entscheidet dabei nichts, was eine
 * Entscheidung ist.
 */

const lieferant = { id: 'poschacher', name: 'Test' };
const werkzeug = fileURLToPath(new URL('../bin/artikelliste.mjs', import.meta.url));
const KOPF = 'sku;bezeichnung;einheit;ek_netto;uvp_netto;gruppe;gewicht_kg;sperrgut';
const lies = (...zeilen) => leseArtikelliste([KOPF, ...zeilen].join('\n'), lieferant, '2026-08-30');

test('ein Stand ist Pflicht und muss sortierbar sein', () => {
  // Ein Preis ohne Stand verstößt gegen die eigene Regel — und die
  // Artikelliste trägt kein Datum je Zeile, also muss es beim Aufruf stehen.
  assert.ok(istStand('2026-08-30'));
  assert.ok(!istStand('30.08.2026'), 'deutsches Datum sortiert nicht');
  assert.ok(!istStand(''));
  const ohne = leseArtikelliste(`${KOPF}\n1;Ware;STK;1,00;2,00;WDVS;;`, lieferant, '30.08.2026');
  assert.equal(ohne.artikel.length, 0);
  assert.match(ohne.fehler[0], /Kein brauchbarer Stand/);
});

test('ein unbekannter Gruppenname wird nicht zu „Sonstiges"', () => {
  // **Gemessen am 29.08.:** Ein Regelwerk erkannte 0 von 16 Gruppen aus der
  // Bezeichnung. Die Gruppe ist eine Entscheidung dieses Shops — und ein
  // Artikel ohne gültige Gruppe steht auf keiner Seite.
  //
  // **Ergänzt am 30.08.:** Ob in der Spalte eine falsche Gruppe oder die
  // Sparte des Lieferanten steht, lässt sich nicht unterscheiden — und muss
  // es nicht: Beides landet in der Liste der offenen Zuordnungen. Was zählt,
  // ist, dass der Artikel nicht durchrutscht.
  const e = lies('1;Fliesenkleber;SCK;10,00;20,00;Fliesen;;');
  assert.equal(e.artikel.length, 0);
  assert.equal(e.offeneSparten.get('Fliesen'), 1);
  assert.ok(WARENGRUPPEN.length === 7, `${WARENGRUPPEN.length} Warengruppen`);
  assert.ok(!WARENGRUPPEN.includes('Sonstiges'));
});

test('eine unbekannte Einheit ist ein Fehler', () => {
  // Der Gebindeteil rechnet nach Einheit; ein unbekanntes Kürzel ergäbe
  // stillschweigend falsche Mengen.
  const e = lies('1;Ware;PALETTE;10,00;20,00;WDVS;;');
  assert.equal(e.artikel.length, 0);
  assert.match(e.fehler[0], /Einheit „PALETTE"/);
});

test('ein Einkaufspreis über dem Listenpreis wird abgewiesen', () => {
  const e = lies('1;Ware;STK;30,00;20,00;WDVS;;');
  assert.equal(e.artikel.length, 0);
  assert.match(e.fehler[0], /über Listenpreis/);
});

test('eine doppelte Artikelnummer wird gemeldet, nicht überschrieben', () => {
  const e = lies('1;Erste;STK;1,00;2,00;WDVS;;', '1;Zweite;STK;3,00;4,00;WDVS;;');
  assert.equal(e.artikel.length, 1);
  assert.equal(e.artikel[0].bezeichnung, 'Erste');
  assert.match(e.fehler[0], /kommt mehrfach vor/);
});

test('der Katalogsatz trägt keinen Preis, der Preissatz trägt ihn', () => {
  // Die Trennung ist die Bedingung, unter der dieses Werkzeug gebaut werden
  // durfte: data/ ist öffentlich, preise/ ist gitignoriert.
  const e = lies('90001;Ziegel NF;STK;0,42;0,70;Mauerwerk;3,1;ja');
  assert.equal(e.fehler.length, 0, e.fehler.join(' | '));
  const [a] = e.artikel;
  assert.equal(a.sku, 'POS-90001');
  assert.equal(a.preisStand, '2026-08-30');
  for (const feld of ['ekNetto', 'uvpNetto', 'vkNetto', 'haendlerrabattAufUvp']) {
    assert.equal(a[feld], undefined, `${feld} steht im öffentlichen Katalog`);
  }
  assert.deepEqual(e.preise['POS-90001'], { ekNetto: 0.42, stand: '2026-08-30', uvpNetto: 0.7 });
});

test('Sperrgut kommt aus der Liste, wenn sie es sagt — sonst aus der Gruppe', () => {
  // Und die Herkunft steht daneben, damit niemand die Einschätzung für eine
  // Lieferantenangabe hält.
  const ausListe = lies('1;Ware;STK;1,00;2,00;Zubehör;;ja').artikel[0];
  assert.equal(ausListe.sperrgut, true);
  assert.equal(ausListe.sperrgutQuelle, 'liste');
  const geschaetzt = lies('2;Ware;STK;1,00;2,00;Dämmung;;').artikel[0];
  assert.equal(geschaetzt.sperrgut, true, 'Dämmung kommt palettiert');
  assert.equal(geschaetzt.sperrgutQuelle, 'eingeschaetzt');
  const leicht = lies('3;Ware;STK;1,00;2,00;Zubehör;;').artikel[0];
  assert.equal(leicht.sperrgut, false);
});

test('Zusammenführen behält, was die Liste nicht nennt', () => {
  // Eine Liste kann das ganze Sortiment sein oder eine Ergänzung; das sieht
  // man ihr nicht an. Löschen ist eine Entscheidung.
  const bestand = [
    { sku: 'POS-1', gruppe: 'WDVS', bezeichnung: 'Alt eins' },
    { sku: 'POS-2', gruppe: 'WDVS', bezeichnung: 'Alt zwei' },
  ];
  const neue = [{ sku: 'POS-2', gruppe: 'WDVS', bezeichnung: 'Neu zwei' }, { sku: 'POS-3', gruppe: 'WDVS', bezeichnung: 'Neu drei' }];
  const ohne = fuehreZusammen(bestand, neue);
  assert.deepEqual(ohne.zugang, ['POS-3']);
  assert.deepEqual(ohne.geaendert, ['POS-2']);
  assert.deepEqual(ohne.fehlend, ['POS-1']);
  assert.equal(ohne.artikel.length, 3, 'POS-1 bleibt stehen');
  const mit = fuehreZusammen(bestand, neue, { entfernen: true });
  assert.equal(mit.artikel.length, 2);
  assert.ok(!mit.artikel.some((a) => a.sku === 'POS-1'));
});

/* --------------------------- das Werkzeug --------------------------- */

const mitDatei = (inhalt) => {
  const o = mkdtempSync(join(tmpdir(), 'artikelliste-'));
  const datei = join(o, 'liste.csv');
  writeFileSync(datei, inhalt);
  return { ordner: o, datei };
};

test('ein halb umgelenkter Lauf bricht ab', () => {
  // Dieselbe Sperre wie im Katalogerzeuger, aus demselben Anlass.
  const { datei } = mitDatei(`${KOPF}\n1;Ware;STK;1,00;2,00;WDVS;;\n`);
  const lauf = spawnSync(process.execPath, [werkzeug, 'poschacher', datei, '--stand=2026-08-30'], {
    encoding: 'utf8',
    env: { ...process.env, KATALOG_ZIEL: '/tmp/nur-eines.json', KATALOG_PREISE_ZIEL: undefined },
  });
  assert.equal(lauf.status, 2);
  assert.match(lauf.stderr, /Nur eines der beiden Ziele/);
});

test('ohne einen gelesenen Artikel wird nichts geschrieben', () => {
  const { ordner, datei } = mitDatei(`${KOPF}\n1;Ware;STK;1,00;2,00;Fliesen;;\n`);
  const ziel = join(ordner, 'katalog.json');
  writeFileSync(ziel, JSON.stringify({ artikel: [{ sku: 'POS-99' }] }));
  const lauf = spawnSync(process.execPath, [werkzeug, 'poschacher', datei, '--stand=2026-08-30', '--schreiben'], {
    encoding: 'utf8',
    env: { ...process.env, KATALOG_ZIEL: ziel, KATALOG_PREISE_ZIEL: join(ordner, 'preise.json') },
  });
  assert.equal(lauf.status, 2);
  assert.match(lauf.stderr, /kein einziger Artikel gelesen/);
  assert.equal(JSON.parse(readFileSync(ziel, 'utf8')).artikel.length, 1, 'der Bestand bleibt');
  assert.equal(existsSync(join(ordner, 'preise.json')), false);
});

test('der Probelauf schreibt nichts und nennt die Fehlenden', () => {
  const { ordner, datei } = mitDatei(`${KOPF}\n90001;Ziegel;STK;0,42;0,70;Mauerwerk;;\n`);
  const ziel = join(ordner, 'katalog.json');
  writeFileSync(ziel, JSON.stringify({ artikel: [{ sku: 'POS-99', gruppe: 'WDVS', bezeichnung: 'Bestand' }] }));
  const lauf = spawnSync(process.execPath, [werkzeug, 'poschacher', datei, '--stand=2026-08-30'], {
    encoding: 'utf8',
    env: { ...process.env, KATALOG_ZIEL: ziel, KATALOG_PREISE_ZIEL: join(ordner, 'preise.json') },
  });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.match(lauf.stdout, /Nicht in der Liste: 1 \(bleiben stehen\)/);
  assert.match(lauf.stdout, /Probelauf/);
  assert.equal(JSON.parse(readFileSync(ziel, 'utf8')).artikel.length, 1, 'nichts geschrieben');
});

test('mit --schreiben entstehen zwei Dateien, und die Preise stehen nur in einer', () => {
  const { ordner, datei } = mitDatei(`${KOPF}\n90001;Ziegel NF;STK;0,42;0,70;Mauerwerk;3,1;ja\n`);
  const ziel = join(ordner, 'katalog.json');
  const preise = join(ordner, 'preise.json');
  const lauf = spawnSync(process.execPath, [werkzeug, 'poschacher', datei, '--stand=2026-08-30', '--schreiben'], {
    encoding: 'utf8',
    env: { ...process.env, KATALOG_ZIEL: ziel, KATALOG_PREISE_ZIEL: preise },
  });
  assert.equal(lauf.status, 0, lauf.stderr);
  const katalog = JSON.parse(readFileSync(ziel, 'utf8'));
  assert.equal(katalog.artikel.length, 1);
  assert.ok(!readFileSync(ziel, 'utf8').includes('0.42'), 'der Einkaufspreis steht im öffentlichen Katalog');
  const p = JSON.parse(readFileSync(preise, 'utf8'));
  assert.equal(p.preise['POS-90001'].ekNetto, 0.42);
  assert.match(p._warnung, /VERTRAULICH/);
});


/* ------------------------------------------------------------------ *
 * Die Sparten des Lieferanten
 * ------------------------------------------------------------------ */

const mitSparten = (tabelle, ...zeilen) =>
  leseArtikelliste([KOPF_SPARTE, ...zeilen].join('\n'), lieferant, '2026-08-30', tabelle);

test('eine zugeordnete Sparte wird zur Warengruppe', () => {
  // Der Lieferant gliedert nach seinem Sortiment, dieser Shop nach der
  // Aufgabe auf der Baustelle. Die Zuordnung wird **einmal** getroffen, nicht
  // je Artikel — für ~20 Sparten eine Tabelle statt hunderter Entscheidungen.
  const e = mitSparten({ Kaminsysteme: 'Kamin' }, '1;Mantelstein;STK;1,00;2,00;Kaminsysteme');
  assert.deepEqual(e.fehler, []);
  assert.equal(e.artikel[0].gruppe, 'Kamin');
});

test('eine unzugeordnete Sparte erzeugt keine Fehlerzeile je Artikel', () => {
  // **Der Punkt der Bündelung.** Bei dreihundert Artikeln aus zwanzig Sparten
  // stünden sonst dreihundert Zeilen mit derselben Aussage da, und die Arbeit
  // bestünde darin, sie zu sortieren.
  const e = mitSparten({}, ...Array.from({ length: 12 }, (_, i) =>
    `${i + 1};Ware ${i};STK;1,00;2,00;${i < 9 ? 'Trockenbau' : 'Fliesen'}`));
  assert.equal(e.artikel.length, 0);
  assert.deepEqual(e.fehler, [], 'die Sparten stehen gebündelt, nicht je Zeile');
  assert.equal(e.offeneSparten.get('Trockenbau'), 9);
  assert.equal(e.offeneSparten.get('Fliesen'), 3);
});

test('eine Zuordnung auf eine Gruppe, die es nicht gibt, wird abgewiesen', () => {
  // Die Tabelle ist von Hand geführt; ein Tippfehler darin darf nicht
  // durchrutschen und Artikel auf eine leere Seite schicken.
  const e = mitSparten({ Trockenbau: 'Trockenbau' }, '1;Ware;STK;1,00;2,00;Trockenbau');
  assert.equal(e.artikel.length, 0);
  assert.equal(e.offeneSparten.size, 0, 'die Sparte ist zugeordnet, nur falsch');
  assert.match(e.fehler[0], /bekannt sind/);
});

test('eine Liste mit gültiger Gruppenspalte braucht keine Tabelle', () => {
  // Der einfache Fall bleibt einfach.
  const e = lies('1;Ware;STK;1,00;2,00;WDVS;;');
  assert.deepEqual(e.fehler, []);
  assert.equal(e.artikel[0].gruppe, 'WDVS');
  assert.equal(e.offeneSparten.size, 0);
});

test('das Werkzeug führt die offenen Sparten nach Gewicht auf', () => {
  const o = mkdtempSync(join(tmpdir(), 'sparten-'));
  const datei = join(o, 'liste.csv');
  writeFileSync(datei, [KOPF_SPARTE,
    ...Array.from({ length: 7 }, (_, i) => `${i + 1};Ware;STK;1,00;2,00;Waermedaemmverbund`),
    '90;Ware;STK;1,00;2,00;Trockenbau'].join('\n'));
  const lauf = spawnSync(process.execPath, [werkzeug, 'poschacher', datei, '--stand=2026-08-30'], {
    encoding: 'utf8',
    env: { ...process.env, SPARTEN_DATEI: join(o, 'gibtsnicht.json') },
  });
  assert.equal(lauf.status, 2, 'ohne Zuordnung kein Artikel');
  assert.match(lauf.stdout, /Offene Sparten \(2\)/);
  assert.match(lauf.stdout, /8 Zeilen warten auf eine Spartenzuordnung/);
  // Nach Gewicht: die häufigere Sparte zuerst, damit die Entscheidung dort
  // beginnt, wo sie am meisten bewegt.
  const wdvs = lauf.stdout.indexOf('Waermedaemmverbund');
  const trocken = lauf.stdout.indexOf('Trockenbau');
  assert.ok(wdvs > 0 && trocken > wdvs, 'die häufigere Sparte steht nicht oben');
  assert.match(lauf.stdout, /Erlaubt sind: Dämmung/);
});

/* ------------------------------------------------------------------ *
 * Artikelkennungen — geprüft statt bloß vorhanden
 * ------------------------------------------------------------------ */

test('istGtin rechnet die Prüfziffer nach', () => {
  // Gegengerechnet an 3000 erzeugten Fällen: Zu jedem Präfix akzeptiert die
  // Funktion genau eine der zehn möglichen Endziffern. Hier stehen die
  // Längen, die vorkommen dürfen, und die Fehlerarten, die auftreten.
  assert.equal(istGtin('96385074'), true, 'GTIN-8');
  assert.equal(istGtin('9008811000005'), true, 'EAN-13');
  assert.equal(istGtin('4007817327005'), true, 'EAN-13');

  // Ein Zahlendreher ergibt keine „ungefähr richtige" Kennung.
  assert.equal(istGtin('4007817327006'), false, 'falsche Prüfziffer');
  assert.equal(istGtin('4007813727005'), false, 'Zahlendreher im Präfix');
  // Abgeschnitten, zu lang, keine Ziffern, leer.
  assert.equal(istGtin('400781732700'), false);
  assert.equal(istGtin('400781732700512'), false);
  assert.equal(istGtin('400781732700X'), false);
  // **Leerzeichen sind die tückische Fehlerart, nicht Buchstaben.** `Number(' ')`
  // ist null — ohne die ausdrückliche Ziffernprüfung ginge eine Kennung mit
  // Leerstelle als gültig durch, weil sie sich wie eine Null verrechnet. Ein
  // Buchstabe fällt schon an der Arithmetik durch (NaN), ein Leerzeichen nicht.
  // Gemessen am 31.08.: Ohne die Zeile meldet `9 08811000005` „gültig".
  assert.equal(istGtin('9 08811000005'), false, 'Leerzeichen an Ziffernstelle');
  assert.equal(istGtin('90088110000 5'), false, 'Leerzeichen vor der Prüfziffer');
  assert.equal(istGtin(''), false);
  assert.equal(istGtin(null), false);
  assert.equal(istGtin(undefined), false);
});

test('Führende Nullen bleiben erhalten', () => {
  // Auf der Zeichenkette gerechnet, nicht auf einer Zahl: `00000000` wäre als
  // Zahl die Null und ginge durch jede Längenprüfung.
  assert.equal(istGtin('00000000'), true, 'acht Nullen sind rechnerisch gültig');
  assert.equal(istGtin(0), false, 'eine Zahl ist keine Kennung');
});

test('Eine GTIN mit falscher Prüfziffer wird zurückgewiesen, nicht gewarnt', () => {
  // **Eine falsche Kennung ist schlimmer als keine.** Sie kann eine andere
  // Ware bezeichnen — dann bewirbt der Shop einen Artikel und liefert einen
  // anderen. Deshalb ein Fehler, der die Zeile anhält, und keine Warnung, die
  // sie durchlässt.
  const csv = [
    'sku;bezeichnung;einheit;gruppe;ek_netto;uvp_netto;gtin',
    'P-1;Rohr NW 100;STK;Kanal;10,00;20,00;4007817327006',
  ].join('\n');
  const { artikel, fehler } = leseArtikelliste(csv, 'poschacher', '2026-08-31', {});
  assert.equal(artikel.length, 0, 'die Zeile darf nicht durchkommen');
  assert.ok(fehler.some((f) => /Prüfziffer geht nicht auf/.test(f)), fehler.join(' | '));
  assert.ok(fehler.some((f) => /4007817327006/.test(f)), 'der Fehler nennt die Kennung nicht');
});

test('Eine gültige GTIN kommt durch, eine leere Spalte warnt nur', () => {
  // Beide Gegenrichtungen: Die Prüfung darf weder Gültiges abweisen noch aus
  // einer fehlenden Angabe einen Fehler machen — ohne GTIN ist der Artikel
  // verkäuflich, nur nicht bewerbbar.
  const mit = leseArtikelliste([
    'sku;bezeichnung;einheit;gruppe;ek_netto;uvp_netto;gtin',
    'P-1;Rohr NW 100;STK;Kanal;10,00;20,00;9008811000005',
  ].join('\n'), 'poschacher', '2026-08-31', {});
  assert.deepEqual(mit.fehler, []);
  assert.equal(mit.artikel[0].gtin, '9008811000005');

  const ohne = leseArtikelliste([
    'sku;bezeichnung;einheit;gruppe;ek_netto;uvp_netto;gtin',
    'P-1;Rohr NW 100;STK;Kanal;10,00;20,00;',
  ].join('\n'), 'poschacher', '2026-08-31', {});
  assert.deepEqual(ohne.fehler, []);
  assert.equal(ohne.artikel[0].gtin, null);
  assert.ok(ohne.warnungen.some((w) => /ohne GTIN/.test(w)), ohne.warnungen.join(' | '));
});
