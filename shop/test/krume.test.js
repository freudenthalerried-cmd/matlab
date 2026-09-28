/**
 * Die Brotkrume — sichtbar seit jeher, maschinenlesbar seit heute.
 *
 * **Befund vom 7. September 2026.** 81 von 82 gebauten Seiten zeigen oben
 * einen Pfad. **Keine einzige** zeichnete ihn aus. Eine Suchmaschine stellt
 * ihn statt der nackten Adresse ins Ergebnis — wenn er ausgezeichnet ist.
 *
 * > **Der Pfad stand auf jeder Seite und in keiner Auszeichnung.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { brotkrume, krumeAusHtml, krumenbefund } from '../src/krume.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

// Mit `canonical`: Eine Seite ohne eines ist von der Regel ausgenommen — die
// Fehlerseite trägt bewusst keines. Steht es nicht in der Probe, prüft sie
// eine Ausnahme statt der Regel.
const seite = (krume) => `<link rel="canonical" href="https://x/y.html">`
  + `<main><p class="krume">${krume}</p><h1>x</h1></main>`;

test('die Stufen kommen aus der gerenderten Krume', () => {
  const stufen = krumeAusHtml(seite('<a href="../index.html">Start</a> › <a href="wdvs.html">WDVS</a> › Putzgrund'));
  assert.deepEqual(stufen, [
    { name: 'Start', href: '../index.html' },
    { name: 'WDVS', href: 'wdvs.html' },
    { name: 'Putzgrund', href: null },
  ]);
});

test('ohne Krume keine Stufen', () => {
  assert.deepEqual(krumeAusHtml('<main><h1>Start</h1></main>'), []);
  assert.deepEqual(krumeAusHtml(''), []);
});

test('die Auszeichnung löst die Verweise gegen die Seitenadresse auf', () => {
  const ld = brotkrume({
    stufen: krumeAusHtml(seite('<a href="../index.html">Start</a> › <a href="wdvs.html">WDVS</a> › Putzgrund')),
    seiteUrl: 'https://bauversand.com/gruppe/putzgrund.html',
  });
  assert.equal(ld['@type'], 'BreadcrumbList');
  assert.deepEqual(ld.itemListElement.map((x) => x.item), [
    'https://bauversand.com/index.html',
    'https://bauversand.com/gruppe/wdvs.html',
    'https://bauversand.com/gruppe/putzgrund.html',
  ]);
  assert.deepEqual(ld.itemListElement.map((x) => x.position), [1, 2, 3]);
});

test('die Wurzel bekommt die Schreibweise, die auch das canonical nennt', () => {
  // Sonst stünde `bauversand.com/index.html` in der Liste, während die
  // Startseite selbst `bauversand.com/` als maßgeblich ausweist — zwei
  // Adressen für dieselbe Seite, der Fehler der Sitemap vom 3. September.
  const ld = brotkrume({
    stufen: krumeAusHtml(seite('<a href="../index.html">Start</a> › Wissen › Seite')),
    seiteUrl: 'https://bauversand.com/wissen/seite.html',
    normalisiere: (u) => (u === 'https://bauversand.com/index.html' ? 'https://bauversand.com/' : u),
  });
  assert.equal(ld.itemListElement[0].item, 'https://bauversand.com/');
});

test('eine Krume mit einer Stufe bekommt keine Liste', () => {
  assert.equal(brotkrume({ stufen: [{ name: 'Start', href: null }], seiteUrl: 'https://x/' }), null);
  assert.equal(brotkrume({ stufen: [], seiteUrl: 'https://x/' }), null);
});

test('eine Seite mit Pfad und ohne Auszeichnung ist der Fund', () => {
  const seiten = Array.from({ length: 41 }, (_, i) => ({
    name: `s${i}`,
    text: seite('<a href="/">Start</a> › Wissen › Seite')
      + (i === 0 ? '' : '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":['
        + '{"name":"Start"},{"name":"Wissen"},{"name":"Seite"}]}</script>'),
  }));
  const b = krumenbefund({ seiten });
  const m = b.meldungen.find((x) => x.regel === 'krume-ohne-auszeichnung');
  assert.ok(m, 'die Meldung fehlt');
  assert.equal(m.wo, 's0');
});

test('eine Auszeichnung, die etwas anderes sagt als die Seite, ist ebenfalls einer', () => {
  const seiten = Array.from({ length: 41 }, () => ({
    name: 's',
    text: `${seite('<a href="/">Start</a> › Wissen › Seite')}<script type="application/ld+json">`
      + '{"@type":"BreadcrumbList","itemListElement":[{"name":"Start"},{"name":"Sortiment"}]}</script>',
  }));
  const b = krumenbefund({ seiten });
  assert.ok(b.meldungen.some((m) => m.regel === 'krume-sagt-etwas-anderes'));
});

test('eine Seite ohne canonical ist von der Regel ausgenommen', () => {
  // Die Fehlerseite: Sie zeigt einen Pfad und trägt bewusst kein Kanonisch,
  // weil sie unter jeder Adresse ausgeliefert wird, die es nicht gibt. Eine
  // Krumenauszeichnung behauptete dasselbe, was das Kanonisch nicht sagen
  // darf — dass diese Seite an einer Stelle der Site steht.
  const seiten = Array.from({ length: 41 }, () => ({
    name: '404.html',
    text: '<main><p class="krume"><a href="/">Start</a> › Adresse nicht gefunden</p></main>',
  }));
  const b = krumenbefund({ seiten });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.ausgezeichnet, 0);
});

test('zu wenige Seiten sind kein grüner Befund', () => {
  const b = krumenbefund({ seiten: [{ name: 'x', text: '' }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-seiten'));
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

function gebauteSeiten() {
  const gefunden = [];
  const gehe = (ordner, vorne) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      if (e.isDirectory()) { gehe(join(ordner, e.name), `${vorne}${e.name}/`); continue; }
      if (!e.name.endsWith('.html')) continue;
      gefunden.push({ name: `${vorne}${e.name}`, text: readFileSync(join(ordner, e.name), 'utf8') });
    }
  };
  gehe(SITE, '');
  return gefunden;
}

test('jede gebaute Seite mit Pfad zeichnet ihn aus — und sagt dasselbe', () => {
  if (!existsSync(SITE)) return; // ohne Bau keine Aussage
  const b = krumenbefund({ seiten: gebauteSeiten() });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.ausgezeichnet >= 70, `nur ${b.ausgezeichnet} Seiten mit ausgezeichnetem Pfad`);
});

test('der Pfad endet bei der Seite selbst', () => {
  if (!existsSync(SITE)) return;
  for (const [datei, letzte] of [
    ['artikel/POS-13728.html', 'Capatect Putzgrund weiß 25 kg'],
    ['wissen/xps-oder-eps.html', 'XPS oder EPS — welche Platte wohin'],
    ['rechtliches/agb.html', 'Geschäftsbedingungen'],
  ]) {
    const pfad = join(SITE, datei);
    if (!existsSync(pfad)) continue;
    const stufen = krumeAusHtml(readFileSync(pfad, 'utf8'));
    assert.ok(stufen.length >= 2, `${datei}: keine Krume`);
    assert.equal(stufen[stufen.length - 1].name, letzte, `${datei}: der Pfad endet woanders`);
  }
});

test('die Startseite meldet ihre eigene Suche an — mit der Adresse, die es gibt', () => {
  const datei = join(SITE, 'index.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  const knoten = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((m) => {
      const daten = JSON.parse(m[1]);
      return Array.isArray(daten) ? daten : [daten];
    });
  const web = knoten.find((k) => k['@type'] === 'WebSite');
  assert.ok(web, 'kein WebSite-Knoten auf der Startseite');
  const vorlage = web.potentialAction?.target?.urlTemplate ?? '';
  assert.match(vorlage, /\/suche\.html\?q=\{search_term_string\}$/);
  // Die Vorlage muss auf eine Seite zeigen, die es gibt — sonst ist sie
  // dieselbe Sorte Zusage wie ein Keyword, das die eigene Suche nicht
  // beantwortet.
  assert.ok(existsSync(join(SITE, 'suche.html')), 'die Suchseite fehlt');
});
