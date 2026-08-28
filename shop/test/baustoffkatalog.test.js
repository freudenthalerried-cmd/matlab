import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ladeBaustoffkatalog, katalogbefund, ZIELMARGE } from '../src/baustoffkatalog.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const lies = (p) => JSON.parse(readFileSync(pfad(p), 'utf8'));

const KATALOG = lies('../data/katalog-baustoff.json');
const LIEFERANTEN = lies('../data/lieferanten.json');

// Die Preisdatei liegt bewusst außerhalb des Repositories und fehlt in einer
// frischen Arbeitskopie. Beide Fälle gehören geprüft — der Fall ohne sie ist
// sogar der wichtigere, weil er im öffentlichen Zustand der Normalfall ist.
const PREIS_PFAD = pfad('../../preise/baustoff-preise.json');
const PREISE = existsSync(PREIS_PFAD) ? JSON.parse(readFileSync(PREIS_PFAD, 'utf8')) : null;

test('Ohne Preisdatei liefert der Katalog keine Preise — und erfindet auch keine', () => {
  const k = ladeBaustoffkatalog(KATALOG, null, LIEFERANTEN);

  assert.equal(k.preiseGeladen, false);
  assert.equal(k.vollstaendig, false);
  assert.equal(k.ohnePreis.length, k.artikel.length, 'alle Artikel ohne Preis');

  for (const a of k.artikel) {
    assert.equal(a.vkNetto, null, `${a.sku} hat einen Preis, obwohl keiner geladen ist`);
    assert.equal(a.vkBrutto, null);
    assert.equal(a.ekNetto, null);
    assert.equal(a.ekQuelle, 'fehlt');
    assert.equal(a.ekIstPlatzhalter, true, `${a.sku} müsste als Platzhalter gelten`);
    assert.match(a.grund, /Einkaufspreis/);
  }
});

test('Ohne Preisdatei bleibt die Bezeichnung erhalten — gesperrt ist der Preis, nicht der Katalog', () => {
  const k = ladeBaustoffkatalog(KATALOG, null, LIEFERANTEN);
  // Der Bestand ist die Zusicherung: 46 Artikel aus fünfzehn Rechnungen.
  // Ohne diese Zeile prüfte die Schleife darunter bei leerem Katalog nichts.
  assert.ok(k.artikel.length >= 46, `nur ${k.artikel.length} Artikel im Katalog`);
  for (const a of k.artikel) {
    assert.ok(a.bezeichnung.length > 0);
    assert.ok(a.gruppe.length > 0);
    assert.ok(a.einheit.length > 0);
  }
});

test('Eine lückenhafte Preisdatei sperrt genau die fehlenden Artikel', () => {
  const eineSku = KATALOG.artikel[0].sku;
  const teil = { preise: { [eineSku]: { uvpNetto: 100, haendlerrabattAufUvp: 0.5 } } };
  const k = ladeBaustoffkatalog(KATALOG, teil, LIEFERANTEN);

  assert.equal(k.preiseGeladen, true);
  assert.equal(k.vollstaendig, false, 'eine Lücke macht den Katalog unvollständig');
  assert.equal(k.ohnePreis.length, KATALOG.artikel.length - 1);

  const versorgt = k.artikel.find((a) => a.sku === eineSku);
  assert.equal(versorgt.vkNetto, 66.67);
  assert.equal(versorgt.ekIstPlatzhalter, false);
});

test('Der öffentliche Katalog trägt keine Preise', () => {
  // Der eigentliche Zweck der Trennung. Diese Zusicherung ist der Grund,
  // warum es zwei Dateien gibt — sie gehört geprüft, nicht nur beschrieben.
  const roh = JSON.stringify(KATALOG.artikel);
  for (const feld of ['uvpNetto', 'ekNetto', 'vkNetto', 'haendlerrabattAufUvp', 'listeNetto', 'rabatt']) {
    assert.equal(roh.includes(`"${feld}"`), false, `${feld} steht im öffentlichen Katalog`);
  }
});

test('Der öffentliche Lieferantensatz trägt keinen Rabattsatz', () => {
  const poschacher = LIEFERANTEN.lieferanten.find((l) => l.id === 'poschacher');
  assert.ok(poschacher, 'Lieferant poschacher fehlt');
  assert.equal(poschacher.haendlerrabattAufUvp, null, 'der Rabattsatz gehört nicht ins Repository');
  assert.equal(poschacher.konditionenStand, 'bestaetigt');
  assert.equal(poschacher.fracht.freiHausAbNetto, null, 'es gibt keine Frei-Haus-Schwelle');
});

test('Jeder Katalogartikel kennt seinen Lieferanten', () => {
  const ids = new Set(LIEFERANTEN.lieferanten.map((l) => l.id));
  assert.ok(KATALOG.artikel.length >= 46, `nur ${KATALOG.artikel.length} Artikel im Katalog`);
  for (const a of KATALOG.artikel) {
    assert.ok(ids.has(a.lieferantId), `${a.sku} verweist auf unbekannten Lieferanten ${a.lieferantId}`);
  }
});

test('Ein unbekannter Lieferant wird abgewiesen, nicht übergangen', () => {
  const kaputt = { artikel: [{ ...KATALOG.artikel[0], lieferantId: 'gibtsnicht' }] };
  assert.throws(() => ladeBaustoffkatalog(kaputt, null, LIEFERANTEN), /Unbekannter Lieferant/);
});

test('Sperrgut ist als Einschätzung gekennzeichnet, nicht als Lieferantenangabe', () => {
  assert.ok(KATALOG.artikel.length >= 46, `nur ${KATALOG.artikel.length} Artikel im Katalog`);
  for (const a of KATALOG.artikel) {
    assert.equal(a.sperrgutQuelle, 'eingeschaetzt');
  }
});

test('Keinem Artikel ist eine GTIN angedichtet', () => {
  // Ohne GTIN kein Google-Shopping-Feed. Eine erfundene wäre schlimmer als
  // keine: Sie führte zur Ablehnung des Kontos, nicht nur des Artikels.
  assert.ok(KATALOG.artikel.length >= 46, `nur ${KATALOG.artikel.length} Artikel im Katalog`);
  for (const a of KATALOG.artikel) {
    assert.equal(a.gtin, null, `${a.sku} trägt eine GTIN, die niemand bestätigt hat`);
  }
});

test('Die Zielmarge des Modells ist 25 % vom Verkauf', () => {
  assert.equal(ZIELMARGE, 0.25);
});

// --- Mit echter Preisdatei, wenn vorhanden -------------------------------

test('Mit Preisdatei rechnet jeder Artikel durch', { skip: PREISE === null && 'preise/baustoff-preise.json fehlt' }, () => {
  const k = ladeBaustoffkatalog(KATALOG, PREISE, LIEFERANTEN);
  assert.equal(k.vollstaendig, true);
  assert.ok(k.artikel.length >= 46, `nur ${k.artikel.length} Artikel im Katalog`);

  for (const a of k.artikel) {
    assert.ok(a.vkNetto > 0, `${a.sku} ohne Verkaufspreis`);
    assert.ok(a.ekNetto > 0, `${a.sku} ohne Einkaufspreis`);
    assert.ok(a.vkNetto >= a.ekNetto, `${a.sku} verkauft unter Einkauf`);
    assert.equal(a.ekIstPlatzhalter, false);
    // Der Verkaufspreis geht nie über die Liste des Lieferanten.
    if (a.uvpNetto !== null) assert.ok(a.vkNetto <= a.uvpNetto + 1e-9, `${a.sku} über Liste`);
  }
});

test('Der Befund trennt Suchartikel von Beipack', { skip: PREISE === null && 'preise/baustoff-preise.json fehlt' }, () => {
  const b = katalogbefund(ladeBaustoffkatalog(KATALOG, PREISE, LIEFERANTEN));

  assert.equal(b.unterListe + b.amDeckel + b.ohneListe, b.mitPreis, 'die drei Lager decken alle Artikel');
  assert.ok(b.unterListe > b.amDeckel, 'die Mehrheit trägt die Zielmarge unter der Liste');
  assert.ok(b.medianAbstandZurListe > 0, 'im Median unter der Liste');

  // Kein Artikel steht in beiden Listen.
  const doppelt = b.suchtauglicheSkus.filter((s) => b.nurBeipackSkus.includes(s));
  assert.deepEqual(doppelt, []);
});

/* ------------------------------------------------------------------ *
 * Gate 24 — Einkaufspreis nur auf Anfrage
 * ------------------------------------------------------------------ */

const anfrageArtikel = {
  sku: 'LGH-1', lieferantenArtikelnummer: '30486', bezeichnung: 'QUAR GK30 Glättputz lose',
  gruppe: 'Mörtel', lieferantId: 'poschacher', einheit: 'TO', sperrgut: true,
  gtin: null, preisStand: '2026-08-27', ekQuelle: 'anfrage',
};

const lieferantenProbe = { lieferanten: [{ id: 'poschacher', name: 'Probe', ustSatz: 0.2 }] };

test('Gate 24: ein Artikel auf Anfrage bekommt keinen Preis', () => {
  const k = ladeBaustoffkatalog({ artikel: [anfrageArtikel] }, { preise: {} }, lieferantenProbe);
  const a = k.artikel[0];
  assert.equal(a.vkNetto, null);
  assert.equal(a.ekNetto, null);
  assert.equal(a.ekQuelle, 'anfrage');
  assert.match(a.grund, /Gate 24/);
  assert.deepEqual(k.nurAnfrage, ['LGH-1']);
});

test('Gate 24 greift auch, wenn in der Preisdatei doch eine Zahl steht', () => {
  // Der eigentliche Prüfpunkt. Ein tagesaktueller Preis ist keine
  // Kalkulationsgrundlage, auch wenn ihn jemand einmal aufgeschrieben hat —
  // die Sperre steht deshalb vor dem Blick in die Preisdatei.
  const k = ladeBaustoffkatalog(
    { artikel: [anfrageArtikel] },
    { preise: { 'LGH-1': { ekNetto: 100, uvpNetto: 250 } } },
    lieferantenProbe,
  );
  assert.equal(k.artikel[0].vkNetto, null, 'ein Angebot von vorgestern macht keinen Katalogartikel');
  assert.equal(k.artikel[0].ekNetto, null);
});

test('Gate 24: der Befund weist die Artikel getrennt aus', () => {
  const gewoehnlich = { ...anfrageArtikel, sku: 'LGH-2', ekQuelle: 'bestaetigt' };
  const k = ladeBaustoffkatalog(
    { artikel: [anfrageArtikel, gewoehnlich] },
    { preise: { 'LGH-2': { ekNetto: 100, uvpNetto: 250 } } },
    lieferantenProbe,
  );
  const b = katalogbefund(k);
  assert.equal(b.artikelGesamt, 2);
  assert.equal(b.verkaeuflich, 1, 'der Anfrageartikel zählt nicht als verkäuflich');
  assert.deepEqual(b.nurAnfrageSkus, ['LGH-1']);
  assert.ok(!b.suchtauglicheSkus.includes('LGH-1'));
  assert.ok(!b.nurBeipackSkus.includes('LGH-1'), 'Beipack ist ein anderer Fall als Anfrage');
});

test('ohne Anfrageartikel ändert sich nichts', () => {
  // Damit die Sperre nicht stillschweigend etwas anderes mitnimmt.
  const k = ladeBaustoffkatalog(
    { artikel: [{ ...anfrageArtikel, ekQuelle: 'bestaetigt' }] },
    { preise: { 'LGH-1': { ekNetto: 100, uvpNetto: 250 } } },
    lieferantenProbe,
  );
  assert.deepEqual(k.nurAnfrage, []);
  assert.deepEqual(katalogbefund(k).nurAnfrageSkus, []);
  assert.equal(katalogbefund(k).verkaeuflich, 1);
  assert.ok(k.artikel[0].vkNetto > 0);
});
