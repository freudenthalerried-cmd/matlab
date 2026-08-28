import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startklar } from '../src/startklar.js';
import { IMPRESSUMSFELDER } from '../src/rechtstexte.js';

const werkzeug = fileURLToPath(new URL('../bin/startklar.mjs', import.meta.url));

const vollstaendig = Object.fromEntries(IMPRESSUMSFELDER.map((f) => [f.feld, 'steht']));
const katalogVoll = { artikel: [{ sku: 'A', vkNetto: 10, ekIstPlatzhalter: false }] };
const alles = {
  betreiber: vollstaendig,
  impressumsfelder: IMPRESSUMSFELDER,
  katalog: katalogVoll,
  preisdateiVorhanden: true,
  zahlungsanbieter: 'EPS über einen Anbieter',
  rechtstexteFundstelle: 'Kanzlei X, Fassung vom …',
  domainZeigtAufShop: true,
  repositoryPrivat: true,
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
  // Und die zwei Punkte, die heute stehen, stehen auch da.
  assert.match(ausgabe, /46 von 46 Artikeln/);
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
