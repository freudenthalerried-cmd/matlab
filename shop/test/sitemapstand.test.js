/**
 * Das Änderungsdatum in der Sitemap.
 *
 * **Befund vom 7. September 2026.** Seit dem Vortag leitet der Bau das
 * Änderungsdatum jeder Inhaltsseite aus dem Verzeichnis ab und schreibt es als
 * `dateModified` in die strukturierte Auskunft. In der `sitemap.xml` — der
 * Stelle, an der eine Suchmaschine zuerst danach sieht — standen **78 Einträge
 * und null `<lastmod>`**.
 *
 * > **Die Angabe war da, und sie stand nicht dort, wo danach gefragt wird.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { DATUM, lastmodFuer, sitemapbefund } from '../src/sitemapstand.js';
import { standAusGit } from '../src/inhaltsstand.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITEMAP = join(SHOP, 'ausgabe', 'site', 'sitemap.xml');

test('eine Inhaltsseite trägt den Stand ihrer Quelldatei', () => {
  const inhalte = new Map([['wissen/xps-oder-eps', { stand: '2026-08-25' }]]);
  assert.equal(lastmodFuer({ id: 'wissen/xps-oder-eps', inhalte }), '2026-08-25');
});

test('eine Artikelseite trägt den Stand der Katalogdatei', () => {
  assert.equal(lastmodFuer({ id: 'artikel/POS-1', katalogStand: '2026-08-28' }), '2026-08-28');
});

test('ohne datierbare Quelle steht keines', () => {
  // Die Startseite entsteht aus dem Bauwerkzeug. Ein `lastmod`, das immer
  // heute sagt, ist die Angabe, die eine Suchmaschine ignoriert — und es
  // entwertet die richtigen daneben.
  assert.equal(lastmodFuer({ id: 'index', inhalte: new Map() }), null);
  assert.equal(lastmodFuer({ id: 'artikel/POS-1', katalogStand: null }), null);
  assert.equal(lastmodFuer({ id: 'wissen/ohne-stand', inhalte: new Map([['wissen/ohne-stand', {}]]) }), null);
});

const eintraege = (n) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, lastmod: '2026-09-01' }));

test('ein abweichendes Datum ist der Fund', () => {
  const b = sitemapbefund({
    eintraege: [...eintraege(40), { id: 'falsch', lastmod: '2026-01-01' }],
    erwartet: (id) => (id === 'falsch' ? '2026-09-05' : '2026-09-01'),
    heute: '2026-09-07',
  });
  const m = b.meldungen.find((x) => x.regel === 'lastmod-weicht-ab');
  assert.ok(m, 'die Meldung fehlt');
  assert.equal(m.wo, 'falsch');
});

test('ein Datum ohne Quelle ist ebenfalls einer', () => {
  const b = sitemapbefund({
    eintraege: [...eintraege(40), { id: 'erfunden', lastmod: '2026-09-01' }],
    erwartet: (id) => (id === 'erfunden' ? null : '2026-09-01'),
    heute: '2026-09-07',
  });
  assert.ok(b.meldungen.some((m) => m.regel === 'lastmod-ohne-quelle'));
});

test('ein Datum in der Zukunft wird gemeldet', () => {
  const b = sitemapbefund({
    eintraege: [...eintraege(40), { id: 'morgen', lastmod: '2026-09-08' }],
    erwartet: () => null,
    heute: '2026-09-07',
  });
  // Erst „ohne Quelle", dann die Zukunft — gemeldet wird der erste Grund, und
  // die Schleife läuft weiter. Beides zugleich zu melden wäre doppelt.
  assert.ok(b.meldungen.length > 0);
});

test('eine leere Sitemap ist kein grüner Befund', () => {
  const b = sitemapbefund({ eintraege: [], erwartet: () => null, heute: '2026-09-07' });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-eintraege'));
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

/** Die Einträge der gebauten Sitemap — Kennung und Datum. */
function ausSitemap() {
  const xml = readFileSync(SITEMAP, 'utf8');
  const gefunden = [];
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
    const pfad = m[1].replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, '');
    gefunden.push({ id: pfad === '' ? 'index' : pfad, lastmod: m[2] ?? null });
  }
  return gefunden;
}

test('jedes lastmod in der Sitemap stimmt mit seiner Quelle überein', () => {
  if (!existsSync(SITEMAP)) return; // ohne Bau keine Aussage

  const git = (argumente) => execFileSync('git', argumente, { cwd: join(SHOP, '..'), encoding: 'utf8' });
  /* Der Geschaeftskalender: Die sitemap.xml traegt ihre Staende in Ortszeit,
   * und ein Vergleich gegen die Rechneruhr weicht am spaeten Abend um einen
   * Tag ab. */
  const heute = geschaeftstag();
  const katalogStand = standAusGit({ pfad: 'shop/data/katalog-baustoff.json', git, heute });

  const inhalte = new Map();
  for (const art of ['wissen', 'gruppen', 'system']) {
    const ordner = join(SHOP, 'inhalte', art);
    if (!existsSync(ordner)) continue;
    for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.md'))) {
      const quelle = readFileSync(join(ordner, datei), 'utf8');
      const slug = (/^slug:\s*(\S+)/m.exec(quelle) ?? [])[1] ?? datei.replace(/\.md$/, '');
      const id = `${art === 'gruppen' ? 'gruppe' : art}/${slug}`;
      inhalte.set(id, { stand: standAusGit({ pfad: `shop/inhalte/${art}/${datei}`, git, heute }) });
    }
  }

  const b = sitemapbefund({
    eintraege: ausSitemap(),
    erwartet: (id) => lastmodFuer({ id, inhalte, katalogStand }),
    heute,
  });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.mitDatum >= 60, `nur ${b.mitDatum} Einträge mit Datum`);
});

test('die Seiten ohne datierbare Quelle tragen keines — und sind benannt', () => {
  if (!existsSync(SITEMAP)) return;
  const ohne = ausSitemap().filter((e) => !e.lastmod).map((e) => e.id).sort();
  // Ihre Quelle ist das Bauwerkzeug. Sie stehen hier mit Namen, damit eine
  // neue Seite nicht stillschweigend dazukommt — und damit auffällt, wenn
  // eine Inhaltsseite hierher rutscht, weil ihr Stand verloren ging.
  assert.deepEqual(ohne, [
    'index', 'lieferung',
    'rechtliches/abnahme', 'rechtliches/agb', 'rechtliches/datenschutz',
    'rechtliches/impressum', 'rechtliches/index',
    'wissen/index',
  ]);
});

test('jedes ausgegebene Datum hat Datumsform', () => {
  if (!existsSync(SITEMAP)) return;
  const eintraege = ausSitemap();
  // Die Zusicherung über die Zahl steht vor der Schleife: Eine Schleife über
  // eine leere Sitemap prüft nichts und meldet grün.
  assert.ok(eintraege.length >= 40, `nur ${eintraege.length} Einträge in der Sitemap`);
  for (const e of eintraege) {
    if (e.lastmod) assert.match(e.lastmod, DATUM, `${e.id}: „${e.lastmod}"`);
  }
});
