import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loeseVerweis, loeseVerwandt } from '../bin/website.mjs';
import { lesKopf } from '../src/markdown.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

/* ------------------------------------------------------------------ *
 * Verweise auflösen
 * ------------------------------------------------------------------ */

test('Relative Verweise werden zur logischen Kennung', () => {
  assert.equal(loeseVerweis('baumeisterpreis', 'wissen'), 'wissen/baumeisterpreis');
  assert.equal(loeseVerweis('../wissen/xps-oder-eps', 'system'), 'wissen/xps-oder-eps');
  assert.equal(loeseVerweis('../system/kaminzug', 'gruppen'), 'system/kaminzug');
  assert.equal(loeseVerweis('../lieferung', 'wissen'), 'lieferung');
});

test('Gruppenseiten liegen unter „gruppe", nicht unter „gruppen"', () => {
  // Der Ordner heißt gruppen, die Kennung gruppe. Ohne diese Abbildung
  // zeigen alle Gruppenverweise ins Leere.
  assert.equal(loeseVerweis('kanal', 'gruppen'), 'gruppe/kanal');
});

test('Äußere Verweise werden nicht angefasst', () => {
  assert.equal(loeseVerweis('https://www.baumit.at/', 'wissen'), null);
  assert.equal(loeseVerweis('#abschnitt', 'wissen'), null);
  assert.equal(loeseVerwandt('https://www.synthesa.at/'), null);
});

test('Ein nackter Name unter „verwandt" meint eine Wissensseite', () => {
  // Festgelegte Konvention. Die Alternative — der Reihe nach in mehreren
  // Gattungen suchen — hätte einen Tippfehler stillschweigend auf eine
  // falsche, aber vorhandene Seite gelenkt.
  assert.equal(loeseVerwandt('untergrund-pruefen'), 'wissen/untergrund-pruefen');
  assert.equal(loeseVerwandt('system/kaminzug'), 'system/kaminzug');
  assert.equal(loeseVerwandt('gruppe/kanal'), 'gruppe/kanal');
});

/* ------------------------------------------------------------------ *
 * Die Inhalte selbst
 * ------------------------------------------------------------------ */

const ARTEN = ['wissen', 'gruppen', 'system'];
const alleInhalte = () => {
  const raus = [];
  for (const art of ARTEN) {
    const ordner = pfad(`../inhalte/${art}`);
    if (!existsSync(ordner)) continue;
    for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.md'))) {
      raus.push({ art, datei, ...lesKopf(readFileSync(join(ordner, datei), 'utf8')) });
    }
  }
  return raus;
};

test('Jede Inhaltsseite trägt Titel, Frage, Kurzfassung und Stand', () => {
  // Der Aufbau ist die Zusage aus den Redaktionsprinzipien: eine Frage je
  // Seite, die Antwort in den ersten zwei Sätzen. Eine Seite ohne Frage
  // bricht die Zusage — auch gegenüber maschinellen Lesern, die genau
  // diese Felder auswerten.
  const seiten = alleInhalte();
  assert.ok(seiten.length >= 20, `nur ${seiten.length} Inhaltsseiten gefunden`);
  for (const s of seiten) {
    for (const feld of ['titel', 'frage', 'kurz', 'stand']) {
      assert.ok(s.kopf[feld], `${s.art}/${s.datei}: „${feld}" fehlt`);
    }
    assert.match(String(s.kopf.stand), /^\d{4}-\d{2}-\d{2}$/, `${s.datei}: Stand ohne Datumsform`);
  }
});

test('Die Kurzfassung beantwortet die Frage in zwei Sätzen, nicht in zehn', () => {
  for (const s of alleInhalte()) {
    const saetze = String(s.kopf.kurz).split(/(?<=[.!?])\s+/).filter(Boolean);
    assert.ok(saetze.length <= 3, `${s.datei}: Kurzfassung hat ${saetze.length} Sätze`);
    assert.ok(String(s.kopf.kurz).length >= 80, `${s.datei}: Kurzfassung zu knapp`);
  }
});

test('Fragen und Kurzfassungen bleiben Fließtext, keine Listen', () => {
  // Der Fehler, der zuerst nur in der llms.txt sichtbar wurde.
  for (const s of alleInhalte()) {
    for (const feld of ['frage', 'kurz', 'titel']) {
      assert.equal(typeof s.kopf[feld], 'string', `${s.datei}: „${feld}" ist keine Zeichenkette`);
    }
    assert.doesNotMatch(String(s.kopf.frage), /,\S/, `${s.datei}: fehlendes Leerzeichen nach Komma`);
  }
});

test('Jede Frage ist als Frage formuliert', () => {
  for (const s of alleInhalte()) {
    assert.match(String(s.kopf.frage), /\?$/, `${s.datei}: „frage" endet nicht auf ein Fragezeichen`);
  }
});

test('Kein Kopfblock verspricht eine Gattung, die es nicht gibt', () => {
  const gruppen = new Set(
    JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8')).artikel.map((a) => a.gruppe),
  );
  for (const s of alleInhalte()) {
    if (!s.kopf.gruppe) continue;
    assert.ok(gruppen.has(s.kopf.gruppe), `${s.datei}: Warengruppe „${s.kopf.gruppe}" gibt es im Katalog nicht`);
  }
});

test('Jede Warengruppe des Katalogs hat eine Seite', () => {
  const gruppen = new Set(
    JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8')).artikel.map((a) => a.gruppe),
  );
  const beschrieben = new Set(alleInhalte().filter((s) => s.art === 'gruppen').map((s) => s.kopf.gruppe));
  for (const g of gruppen) {
    assert.ok(beschrieben.has(g), `Warengruppe „${g}" hat keine Seite in inhalte/gruppen/`);
  }
});

/* ------------------------------------------------------------------ *
 * Rechtsseiten
 *
 * Sie sind ein Gerüst mit sichtbaren Lücken, kein fertiger Rechtstext.
 * Die Zusicherung, die hier zählt: Es wird nichts erfunden, und was fehlt,
 * bleibt sichtbar.
 * ------------------------------------------------------------------ */

test('Die Betreiberdaten behaupten nur, was belegbar ist', () => {
  const b = JSON.parse(readFileSync(pfad('../data/betreiber.json'), 'utf8'));
  // Belegbar aus Firmenbuch und öffentlichen Verzeichnissen:
  for (const feld of ['firma', 'rechtsform', 'strasse', 'plz', 'ort', 'firmenbuchnummer', 'firmenbuchgericht']) {
    assert.ok(String(b[feld] ?? '').trim(), `${feld} sollte belegt sein`);
  }
  // Nicht belegbar — und deshalb ausdrücklich leer statt geraten:
  for (const feld of ['email', 'telefon', 'uid', 'gewerbewortlaut']) {
    assert.equal(String(b[feld] ?? '').trim(), '', `${feld} wurde geraten statt offengelassen`);
  }
});

test('Das erzeugte Impressum macht jede Lücke sichtbar', async () => {
  const { erzeugeImpressum } = await import('../src/rechtstexte.js');
  const b = JSON.parse(readFileSync(pfad('../data/betreiber.json'), 'utf8'));
  const i = erzeugeImpressum(b);

  assert.equal(i.vollstaendig, false, 'noch fehlen Pflichtangaben — das darf nicht verschwiegen werden');
  assert.equal(i.fehlend.length, 4);
  // Jede Lücke steht als Marke im Text, nicht als Leerzeile.
  assert.equal((i.text.match(/FEHLT/g) ?? []).length, i.fehlend.length);
  // Und was belegt ist, steht auch drin.
  assert.match(i.text, /Freudenthaler Bau GmbH/);
  assert.match(i.text, /FN 347938z/);
});

test('Eine vollständige Datenlage erzeugt ein Impressum ohne Marken', async () => {
  // Gegenprobe: Die Lückenmarken kommen aus den Daten, nicht aus der Vorlage.
  const { erzeugeImpressum } = await import('../src/rechtstexte.js');
  const b = JSON.parse(readFileSync(pfad('../data/betreiber.json'), 'utf8'));
  const voll = { ...b, email: 'a@b.at', telefon: '+43 1 0000000', uid: 'ATU00000000', gewerbewortlaut: 'Baumeister' };
  const i = erzeugeImpressum(voll);

  assert.equal(i.vollstaendig, true);
  assert.doesNotMatch(i.text, /FEHLT/);
});
