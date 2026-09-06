import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { FEHLERPROBE, abnahmeplan, abnahmebefund } from '../src/abnahme.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

const minimal = () => ({
  'index.html': '<h1>Bauversand</h1>',
  '.htaccess': 'ErrorDocument 404 /404.html\n',
  '404.html': 'Diese Seite gibt es nicht <a href="/index.html">Start</a>',
  'robots.txt': 'User-agent: *\nSitemap: https://beispiel.test/sitemap.xml\n',
  'sitemap.xml': '<urlset><loc>a</loc><loc>b</loc></urlset>',
  'shop.js': 'window.__SHOP__={};',
  'llms.txt': 'Liefergebiet: Perg',
  'artikel/A-1.html': '<script src="../shop.js"></script>',
});

test('aus einem vollständigen Ausgabeordner entsteht die volle Liste', () => {
  const punkte = abnahmeplan({ ausgabe: minimal(), marke: 'Bauversand' });
  assert.deepEqual(punkte.map((p) => p.id).sort(), [
    'fehlerseite', 'fehlerseite-tief', 'llms', 'robots', 'sitemap', 'skript', 'startseite', 'tiefe-seite',
  ]);
});

test('der Pfad der Fehlerprobe ist erfunden — sonst löst er keine Fehlerseite aus', () => {
  const punkte = abnahmeplan({ ausgabe: minimal(), marke: 'Bauversand' });
  const probe = punkte.find((p) => p.id === 'fehlerseite');
  assert.equal(probe.pfad, `/${FEHLERPROBE}`);
  assert.equal(minimal()[FEHLERPROBE], undefined);
});

/**
 * **Der Pfad der Fehlerseite wird gelesen, nicht angenommen.** Steht in der
 * `.htaccess` ein anderer Name, fragt die Liste nach dem anderen Namen.
 */
test('die Fehlerseite kommt aus der .htaccess und nicht aus einer Annahme', () => {
  const a = { ...minimal(), '.htaccess': 'ErrorDocument 404 /fehler.html\n', 'fehler.html': 'Diese Seite gibt es nicht <a href="/index.html">x</a>' };
  delete a['404.html'];
  const punkte = abnahmeplan({ ausgabe: a, marke: 'Bauversand' });
  assert.equal(punkte.find((p) => p.id === 'fehlerseite').datei, 'fehler.html');
});

test('ohne ErrorDocument-Zeile entfällt der Punkt, statt ins Leere zu zeigen', () => {
  const a = { ...minimal(), '.htaccess': '# nichts\n' };
  const punkte = abnahmeplan({ ausgabe: a, marke: 'Bauversand' });
  assert.equal(punkte.some((p) => p.id.startsWith('fehlerseite')), false);
});

test('ein Punkt, dessen Erwartung in der Datei nicht steht, wird gemeldet', () => {
  const a = { ...minimal(), 'llms.txt': 'irgendetwas ohne das Wort' };
  const b = abnahmebefund({ punkte: abnahmeplan({ ausgabe: a, marke: 'Bauversand' }), ausgabe: a });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['erwartung-steht-nicht-drin']);
});

test('gäbe es den erfundenen Pfad wirklich, prüfte er nichts — und das wird gemeldet', () => {
  const a = { ...minimal(), [FEHLERPROBE]: 'hoppla' };
  const b = abnahmebefund({ punkte: abnahmeplan({ ausgabe: a, marke: 'Bauversand' }), ausgabe: a });
  assert.ok(b.meldungen.some((m) => m.regel === 'fehlerprobe-gibt-es'));
});

test('eine zu kurze Liste ist kein grüner Befund', () => {
  const a = { 'index.html': 'Bauversand' };
  const b = abnahmebefund({ punkte: abnahmeplan({ ausgabe: a, marke: 'Bauversand' }), ausgabe: a });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-punkte'));
});

/**
 * **Und gegen das echte Erzeugnis.** Die Liste ist nur dann eine Prüfliste,
 * wenn jeder Punkt auf etwas zeigt, das im Ausgabeordner wirklich steht. Was
 * sie darüber hinaus behauptet — dass der Server es auch herausgibt — ist von
 * hier aus nicht messbar und genau der Grund, aus dem es die Liste gibt.
 */
test('gegen den echten Ausgabeordner zeigt jeder Punkt auf vorhandenen Text', () => {
  if (!existsSync(SITE)) return; // ohne Bau keine Aussage — und keine falsche
  const ausgabe = {};
  const gehe = (o) => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      const voll = join(o, e.name);
      if (e.isDirectory()) { gehe(voll); continue; }
      if (statSync(voll).isFile()) ausgabe[relative(SITE, voll)] = readFileSync(voll, 'utf8');
    }
  };
  gehe(SITE);
  const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
  const punkte = abnahmeplan({ ausgabe, marke: String(betreiber.marke ?? betreiber.firma ?? '') });
  assert.ok(punkte.length >= 5, `nur ${punkte.length} Punkte aus dem echten Ordner`);
  const b = abnahmebefund({ punkte, ausgabe });
  assert.deepEqual(b.meldungen, []);
});
