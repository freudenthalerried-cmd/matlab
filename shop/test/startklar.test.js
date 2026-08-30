import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startklar } from '../src/startklar.js';
import { IMPRESSUMSFELDER } from '../src/rechtstexte.js';

const werkzeug = fileURLToPath(new URL('../bin/startklar.mjs', import.meta.url));

const vollstaendig = Object.fromEntries(IMPRESSUMSFELDER.map((f) => [f.feld, 'steht']));
const katalogVoll = { artikel: [{ sku: 'A', vkNetto: 10, ekIstPlatzhalter: false, lieferantId: 'l1' }] };
const alles = {
  betreiber: vollstaendig,
  impressumsfelder: IMPRESSUMSFELDER,
  katalog: katalogVoll,
  preisdateiVorhanden: true,
  zahlungsanbieter: 'EPS über einen Anbieter',
  rechtstexteFundstelle: 'Kanzlei X, Fassung vom …',
  domainZeigtAufShop: true,
  repositoryPrivat: true,
  lieferanten: [{ id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: 5 }],
};

test('mit allem, was gebraucht wird, ist der Shop startklar', () => {
  const b = startklar(alles);
  assert.equal(b.startklar, true, JSON.stringify(b.punkte.filter((p) => p.zustand !== 'erfuellt')));
  assert.equal(b.offen, 0);
  assert.equal(b.unpruefbar, 0);
  assert.ok(b.punkte.length >= 7, `nur ${b.punkte.length} Punkte geprüft`);
});

test('ein unbeantworteter Punkt zählt nicht als erfüllt', () => {
  // Der Kern dieses Werkzeugs. Ohne diese Regel ginge der Shop online, weil
  // die Prüfung nicht hinsehen konnte — und das ist genau die Sorte Lücke,
  // die dieses Vorhaben sonst überall vermeidet.
  const b = startklar({ ...alles, repositoryPrivat: null });
  assert.equal(b.startklar, false);
  assert.equal(b.unpruefbar, 1);
  const punkt = b.punkte.find((p) => p.id === 'repository');
  assert.equal(punkt.zustand, 'unpruefbar');
  assert.match(punkt.befund, /nicht feststellbar/);
  assert.equal(punkt.wer, 'Auftraggeber');
});

test('ein ausdrücklich verneinter Punkt ist offen, kein Fragezeichen', () => {
  const b = startklar({ ...alles, repositoryPrivat: false });
  assert.equal(b.unpruefbar, 0);
  assert.equal(b.offen, 1);
  assert.match(b.punkte.find((p) => p.id === 'repository').befund, /verneint/);
});

test('fehlende Impressumsangaben werden gezählt und benannt', () => {
  const b = startklar({ ...alles, betreiber: { ...vollstaendig, [IMPRESSUMSFELDER[0].feld]: '' } });
  const punkt = b.punkte.find((p) => p.id === 'impressum');
  assert.equal(punkt.zustand, 'offen');
  assert.match(punkt.befund, /1 Pflichtangaben fehlen/);
  assert.match(punkt.befund, new RegExp(IMPRESSUMSFELDER[0].bezeichnung.slice(0, 12)));
});

test('ohne Preisdatei ist der Katalog kein Sortiment', () => {
  const b = startklar({ ...alles, preisdateiVorhanden: false });
  const punkt = b.punkte.find((p) => p.id === 'preise');
  assert.equal(punkt.zustand, 'offen');
  assert.match(punkt.befund, /Preisdatei fehlt/);
});

test('ein Platzhalterpreis hält den Shop an', () => {
  const b = startklar({
    ...alles,
    katalog: { artikel: [{ sku: 'A', vkNetto: 10, ekIstPlatzhalter: true }] },
  });
  assert.equal(b.punkte.find((p) => p.id === 'keine-platzhalter').zustand, 'offen');
  assert.equal(b.startklar, false);
});

test('das Werkzeug läuft am Bestand und sagt, dass der Shop nicht startklar ist', () => {
  const ausgabe = execFileSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.match(ausgabe, /NICHT STARTKLAR/);
  assert.match(ausgabe, /Impressum vollständig/);
  assert.match(ausgabe, /Zahlungsanbieter/);
  assert.match(ausgabe, /von hier aus nicht feststellbar/);
  // Und der Punkt, der heute steht, steht auch da — relativ gezählt, nicht
  // absolut: Eine Probe, die „46" erwartet, fällt an dem Tag um, an dem der
  // Katalog wächst, und sieht dann aus, als wäre das Werkzeug kaputt.
  const katalog = JSON.parse(readFileSync(
    fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8'));
  const n = katalog.artikel.length;
  assert.match(ausgabe, new RegExp(`${n} von ${n} Artikeln`));
});

test('die Antworten kommen aus der Datei, nicht aus dem Werkzeug', async () => {
  // Die erste Fassung setzte die vier offenen Angaben im Werkzeug hart auf
  // null und schrieb daneben, sie gehörten in data/betreiber.json — dann
  // werde von selbst gemeldet. Das war eine Zusage, die der Code nicht
  // gehalten hätte. Diese Probe hält sie fest.
  const { mkdtempSync, writeFileSync, readFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const echt = JSON.parse(readFileSync(
    fileURLToPath(new URL('../data/betreiber.json', import.meta.url)), 'utf8'));

  const ordner = mkdtempSync(join(tmpdir(), 'startklar-'));
  const pfad = join(ordner, 'betreiber.json');
  writeFileSync(pfad, JSON.stringify({
    ...echt,
    zahlungsanbieter: 'Anbieter aus der Probe',
    repositoryPrivat: true,
    domainZeigtAufShop: false,
  }));

  const ausgabe = execFileSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, STARTKLAR_BETREIBER: pfad },
  });
  assert.match(ausgabe, /angebunden: Anbieter aus der Probe/);
  assert.match(ausgabe, /Repository ist privat\n\s+bestätigt/);
  // Ein ausdrückliches „nein" ist eine Antwort, kein Fragezeichen.
  assert.match(ausgabe, /ausdrücklich verneint/);
  assert.match(ausgabe, /0 von hier aus nicht feststellbar/);
});


/* ------------------------------------------------------------------ *
 * Die Lieferzeit — der Punkt, ohne den keine Bestätigung hinausdarf
 * ------------------------------------------------------------------ */

test('Ein liefernder Lieferant ohne Lieferzeit hält den Shop auf', () => {
  const b = startklar({
    ...alles,
    lieferanten: [{ id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: null }],
  });
  assert.equal(b.startklar, false);
  const punkt = b.punkte.find((p) => p.id === 'lieferzeit');
  assert.equal(punkt.zustand, 'offen');
  assert.match(punkt.befund, /Lieferant Eins/);
  assert.match(punkt.befund, /Auftragsbestätigung/);
  assert.equal(punkt.wer, 'Auftraggeber');
});

test('Ein Lieferant ohne geführte Ware blockiert nichts', () => {
  // Der Bestand trägt drei Lieferanten aus dem abgelösten Radon-Modell mit,
  // die keinen einzigen Artikel liefern. Ihre Lieferzeit zu verlangen, hieße
  // eine Angabe einzufordern, die niemand je braucht — und den Punkt
  // dauerhaft rot zu halten, bis jemand sie erfindet.
  const b = startklar({
    ...alles,
    lieferanten: [
      { id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: 5 },
      { id: 'alt', name: 'Alter Hersteller ohne Ware', lieferzeitWerktage: null },
    ],
  });
  assert.equal(b.punkte.find((p) => p.id === 'lieferzeit').zustand, 'erfuellt');
  assert.equal(b.startklar, true);
});

test('Ohne geladene Lieferanten bleibt der Punkt offen, nicht erfüllt', () => {
  // Dieselbe Regel wie beim Rest des Werkzeugs: Was niemand bestätigt hat,
  // zählt nicht als erfüllt. Ein Aufrufer, der die Liste vergisst, bekommt
  // keinen grünen Haken geschenkt.
  const b = startklar({ ...alles, lieferanten: [] });
  assert.equal(b.punkte.find((p) => p.id === 'lieferzeit').zustand, 'offen');
  assert.equal(b.startklar, false);
});

test('Eine Lieferzeit von 0 Werktagen ist eine Zahl, keine Lücke', () => {
  // `Number.isFinite` und nicht `!!`: Eine Selbstabholung am selben Tag wäre
  // eine gültige Angabe. Wer hier auf Wahrheitswert prüft, erklärt sie zur
  // fehlenden Angabe — derselbe Griff, der die Null erst zum Problem gemacht
  // hat, nur in die andere Richtung.
  const b = startklar({
    ...alles,
    lieferanten: [{ id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: 0 }],
  });
  assert.equal(b.punkte.find((p) => p.id === 'lieferzeit').zustand, 'erfuellt');
});
