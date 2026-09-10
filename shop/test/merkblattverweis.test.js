/**
 * Wo das Merkblatt steht, auf das eine Seite verweist.
 *
 * **Befund vom 7. September 2026.** Die zweite Redaktionsregel schickt den
 * Leser ins Merkblatt des Herstellers, statt Kennwerte abzuschreiben — und der
 * Bestand hält sie. Gezählt wurde die andere Hälfte: **acht Inhaltsseiten
 * nennen ein Merkblatt, vier nannten keinen Hersteller.** Darunter „Mengen für
 * 100 m² Fassade" mit acht Erwähnungen und null Verweisen, also ausgerechnet
 * die Seite, deren ganzer Zweck der Rechenweg mit den Werten aus *Ihrem*
 * Merkblatt ist.
 *
 * > **Eine Seite, die den Leser ins Merkblatt schickt und den Weg dorthin
 * > verschweigt, hat die Auskunft an die Stelle verlegt, an der sie nicht
 * > steht.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { MERKBLATT, herstellerDerGruppe, merkblattbefund, merkblattsatz, merkblattdeckung, selbstbeschreibungsbefund } from '../src/merkblattverweis.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

test('die Hersteller kommen aus den Artikeln der Warengruppe', () => {
  const artikel = [
    { bezeichnung: 'Capatect Putzgrund weiß 25 kg', gruppe: 'WDVS' },
    { bezeichnung: 'Baumit KlebeSpachtel 25 kg', gruppe: 'WDVS' },
    { bezeichnung: 'Baumit ThermoMörtel 50 40 l', gruppe: 'Mörtel' },
    { bezeichnung: 'PVC Kanalrohr NW 100 1 m', gruppe: 'Kanal' },
  ];
  assert.deepEqual(herstellerDerGruppe(artikel, 'WDVS').map((h) => h.name),
    ['Baumit Österreich', 'Synthesa (Capatect)']);
  assert.deepEqual(herstellerDerGruppe(artikel, 'Mörtel').map((h) => h.name), ['Baumit Österreich']);
  // Kanalrohre tragen keine Marke — dann steht kein Weg da, und das ist die
  // richtige Antwort. Ein erfundener Weg wäre schlimmer als keiner.
  assert.deepEqual(herstellerDerGruppe(artikel, 'Kanal'), []);
  assert.deepEqual(herstellerDerGruppe(artikel, null), []);
});

test('derselbe Hersteller zweimal ist einmal', () => {
  const artikel = [
    { bezeichnung: 'SIKM Rohr 133cm gedämmt 18', gruppe: 'Kamin' },
    { bezeichnung: 'SIK Zuluftplatte EZ 16-18', gruppe: 'Kamin' },
    { bezeichnung: 'Schiedel Fugenmasse FM 1,5 kg', gruppe: 'Kamin' },
  ];
  assert.deepEqual(herstellerDerGruppe(artikel, 'Kamin').map((h) => h.name), ['Schiedel Österreich']);
});

test('eine Seite mit Merkblatt und ohne Weg ist der Fund', () => {
  const seiten = Array.from({ length: 11 }, (_, i) => ({
    name: `seite${i}`,
    gruppe: 'WDVS',
    text: i === 0 ? 'Die Werte stehen im Merkblatt des Herstellers.' : 'nichts dazu',
  }));
  const b = merkblattbefund({ seiten, hersteller: () => [{ url: 'https://www.baumit.at/' }] });
  const m = b.meldungen.find((x) => x.regel === 'merkblatt-ohne-weg');
  assert.ok(m, 'die Meldung fehlt');
  assert.equal(m.wo, 'seite0');
});

test('mit dem Verweis ist sie in Ordnung', () => {
  const seiten = Array.from({ length: 11 }, (_, i) => ({
    name: `seite${i}`,
    gruppe: 'WDVS',
    text: i === 0 ? 'Merkblatt: <a href="https://www.baumit.at/">Baumit</a>' : '',
  }));
  const b = merkblattbefund({ seiten, hersteller: () => [{ url: 'https://www.baumit.at/' }] });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.mitMerkblatt, 1);
});

test('ohne bekannte Marke wird kein Weg verlangt', () => {
  const seiten = Array.from({ length: 11 }, (_, i) => ({
    name: `seite${i}`,
    gruppe: 'Kanal',
    text: i === 0 ? 'Die Werte stehen im Datenblatt.' : '',
  }));
  const b = merkblattbefund({ seiten, hersteller: () => [] });
  assert.deepEqual(b.meldungen, []);
});

test('zu wenige Seiten sind kein grüner Befund', () => {
  const b = merkblattbefund({ seiten: [{ name: 'x', gruppe: 'WDVS', text: '' }], hersteller: () => [] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-seiten'));
});

test('das Muster findet Merkblatt und Datenblatt, auch im Plural', () => {
  for (const satz of ['aus dem Merkblatt', 'die Merkblätter des Herstellers', 'im Datenblatt', 'die Datenblätter']) {
    assert.ok(MERKBLATT.test(satz), `nicht gefunden: „${satz}"`);
  }
  assert.ok(!MERKBLATT.test('Das Blatt liegt bei.'));
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

test('jede gebaute Seite, die ein Merkblatt nennt, nennt auch den Weg dorthin', () => {
  const katalogDatei = join(SHOP, 'data', 'katalog-baustoff.json');
  if (!existsSync(SITE) || !existsSync(katalogDatei)) return; // ohne Bau keine Aussage
  const katalog = JSON.parse(readFileSync(katalogDatei, 'utf8'));

  const seiten = [];
  for (const art of ['wissen', 'gruppen', 'system']) {
    const ordner = join(SHOP, 'inhalte', art);
    if (!existsSync(ordner)) continue;
    for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.md'))) {
      const quelle = readFileSync(join(ordner, datei), 'utf8');
      const gruppe = (/^gruppe:\s*(.+)$/m.exec(quelle) ?? [])[1]?.trim() ?? null;
      const slug = (/^slug:\s*(\S+)/m.exec(quelle) ?? [])[1] ?? datei.replace(/\.md$/, '');
      const id = `${art === 'gruppen' ? 'gruppe' : art}/${slug}`;
      const gebaut = join(SITE, `${id}.html`);
      if (!existsSync(gebaut)) continue;
      seiten.push({ name: id, gruppe, text: readFileSync(gebaut, 'utf8') });
    }
  }

  const b = merkblattbefund({
    seiten,
    hersteller: (g) => herstellerDerGruppe(katalog.artikel ?? [], g),
    mindestens: 20,
  });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.mitMerkblatt >= 5, `nur ${b.mitMerkblatt} Seiten nennen ein Merkblatt`);
});

test('der Verweis zeigt auf die Herstellerseite und nicht auf ein Dokument', () => {
  const datei = join(SITE, 'wissen', 'mengen-fuer-100-qm-wdvs.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  assert.match(html, /Wo das Merkblatt steht/);
  // Kein tiefer Dokumentpfad: Er sieht aus wie ein Beleg und ist beim
  // nächsten Update des Herstellers einer auf eine Fehlerseite.
  const stelle = html.slice(html.indexOf('Wo das Merkblatt steht'), html.indexOf('Wo das Merkblatt steht') + 700);
  assert.ok(!/\.pdf/i.test(stelle), 'der Verweis zeigt auf ein Dokument');
});

/* ------------------------------------------------------------------ *
 * Die Selbstbeschreibung in llms.txt — 10. September 2026
 *
 * Die Datei, die für Maschinen geschrieben ist, sagte über den eigenen Bau:
 * *„Technische Kennwerte werden nicht abgeschrieben, sondern beim Hersteller
 * verlinkt."* Gemessen tragen **24 von 46** Artikelseiten den Verweis.
 *
 * > **Eine Selbstbeschreibung ist eine Zusage wie jede andere — nur liest sie
 * > niemand nach, weil sie über den eigenen Bau spricht.**
 * ------------------------------------------------------------------ */

test('der Satz folgt der Zahl', () => {
  assert.match(merkblattsatz(46, 46), /sondern beim Hersteller verlinkt/);
  assert.match(merkblattsatz(24, 46), /24 von 46/);
  assert.match(merkblattsatz(24, 46), /übrigen 22/);
  assert.match(merkblattsatz(0, 46), /für keinen der 46/);
  // Ohne Seiten keine Zahl — und dann auch keine erfundene.
  assert.match(merkblattsatz(0, 0), /beim Hersteller verlinkt/);
});

test('die Deckung wird am Erzeugnis gemessen, nicht am Katalog', () => {
  const d = merkblattdeckung([
    { name: 'a', html: '<h2>Technische Kennwerte</h2><p>Siehe <a href="https://www.baumit.at/">Baumit</a></p><h2>x' },
    { name: 'b', html: '<h2>Technische Kennwerte</h2><p>Kein Merkblatt vorhanden.</p><h2>x' },
    { name: 'c', html: '<h2>Anderes</h2><p><a href="https://www.baumit.at/">Baumit</a></p><h2>x' },
  ]);
  assert.equal(d.gesamt, 3);
  assert.equal(d.mitVerweis, 1, 'ein Verweis außerhalb des Abschnitts zählt nicht');
  assert.deepEqual(d.ohne, ['b', 'c']);
});

test('eine Selbstbeschreibung, die nicht hält, ist ein Befund', () => {
  const alt = 'Technische Kennwerte werden nicht abgeschrieben, sondern beim Hersteller verlinkt.';
  const b = selbstbeschreibungsbefund(alt, { gesamt: 46, mitVerweis: 24 }, 20);
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen[0].regel, 'selbstbeschreibung-haelt-nicht');
  assert.match(b.meldungen[0].text, /24 von 46/);
});

test('zu wenige Seiten sind kein grüner Befund', () => {
  const b = selbstbeschreibungsbefund('irgendwas', { gesamt: 2, mitVerweis: 2 }, 20);
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-seiten'));
});

test('llms.txt beschreibt die gebauten Artikelseiten richtig', (t) => {
  const llmsDatei = join(SITE, 'llms.txt');
  const ordner = join(SITE, 'artikel');
  if (!existsSync(llmsDatei) || !existsSync(ordner)) return t.skip('ohne Bau keine Aussage');
  const seiten = readdirSync(ordner)
    .filter((n) => n.endsWith('.html'))
    .map((n) => ({ name: n, html: readFileSync(join(ordner, n), 'utf8') }));
  const b = selbstbeschreibungsbefund(readFileSync(llmsDatei, 'utf8'), merkblattdeckung(seiten), 20);
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
});
