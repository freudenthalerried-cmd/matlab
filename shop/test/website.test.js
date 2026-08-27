import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loeseVerweis, loeseVerwandt, marke, mitverbaut, HERSTELLER } from '../bin/website.mjs';
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

/* ------------------------------------------------------------------ *
 * Herstellerzuordnung
 * ------------------------------------------------------------------ */

test('die Marke wird überall in der Bezeichnung gefunden, nicht nur am Anfang', () => {
  // Der erste Wurf prüfte startsWith. Drei Schiedel-Artikel trugen deshalb
  // „kein Herstellermerkblatt vorhanden", obwohl der Hersteller dasteht.
  assert.equal(marke('Capatect Putzgrund weiß 25 kg'), 'Capatect');
  assert.equal(marke('Mantelstein MSTS EZ 16-18 SIKM'), 'SIKM');
  assert.equal(marke('Thermo-Trennstein 12-18 EZ Absolut monolithisch weiß'), 'Absolut');
  assert.equal(marke('Regenhaube mit Sicherungsseil 180 Absolut & SIH'), 'Absolut');
});

test('die längste Marke gewinnt, sonst verdeckt SIK das SIKM', () => {
  assert.equal(marke('SIKM Rohr 133cm gedämmt 18'), 'SIKM');
  assert.equal(marke('SIK Zuluftplatte EZ 16-18 inkl. Befestigungsset'), 'SIK');
  assert.equal(HERSTELLER[marke('SIKM Rohr 133cm gedämmt 18')].url, HERSTELLER.SIK.url,
    'beide zeigen ohnehin auf Schiedel — die Zuordnung muss trotzdem stimmen');
});

test('eine Marke wird nur als ganzes Wort erkannt', () => {
  // Ohne Wortgrenze fände „SIK" das Wort „Sikkativ" und „Absolut" das Adverb.
  assert.equal(marke('Sikkativ für Ölfarben'), null);
  assert.equal(marke('absolut dichtes Klebeband'), null, 'klein geschrieben ist es ein Adverb');
  assert.equal(marke('Baumithaltiger Ersatz'), null, 'kein Treffer mitten im Wort');
});

test('jeder Artikel mit Marke bekommt einen Herstellerverweis', () => {
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
  assert.ok(katalog.artikel.length >= 40);
  const mitMarke = katalog.artikel.filter((a) => marke(a.bezeichnung));
  assert.ok(mitMarke.length >= 24, `nur ${mitMarke.length} Artikel mit erkannter Marke`);
  for (const a of mitMarke) {
    const h = HERSTELLER[marke(a.bezeichnung)];
    assert.ok(h?.url?.startsWith('https://'), `${a.sku}: Hersteller ohne Adresse`);
  }
});

/* ------------------------------------------------------------------ *
 * „Wird damit zusammen verbaut"
 * ------------------------------------------------------------------ */

const katalogProbe = {
  artikel: [
    { sku: 'A-1', gruppe: 'Dämmung' },
    { sku: 'A-2', gruppe: 'Dämmung' },
    { sku: 'A-3', gruppe: 'Zubehör' },
    { sku: 'B-1', gruppe: 'Kanal' },
    { sku: 'X-9', gruppe: 'Mörtel' },
  ],
};
const listeEins = { id: 'system/eins', art: 'system', kopf: { titel: 'Eins', skus: 'A-1, A-2, A-3' } };
const listeZwei = { id: 'system/zwei', art: 'system', kopf: { titel: 'Zwei', skus: 'A-3, B-1' } };

test('Mitverbaut kommt aus der Systemliste, nicht aus erfundenem Kaufverhalten', () => {
  const { artikel } = mitverbaut({ sku: 'A-1' }, katalogProbe, [listeEins]);
  assert.deepEqual(artikel.map((a) => a.sku), ['A-2', 'A-3'], 'Reihenfolge der Liste, ohne sich selbst');
});

test('Ein Artikel ohne Systemliste bekommt keinen Vorschlag', () => {
  // Der ganze Unterschied zur Vorlage: Hier wird nicht ersatzweise die
  // Gruppe, der Umsatz oder „Ähnliches" vorgeschlagen. Nichts ist richtig.
  const { artikel } = mitverbaut({ sku: 'X-9' }, katalogProbe, []);
  assert.equal(artikel.length, 0);
});

test('Steht ein Artikel in zwei Listen, werden beide vollständig gezeigt', () => {
  const { artikel, listen } = mitverbaut({ sku: 'A-3' }, katalogProbe, [listeEins, listeZwei]);
  assert.deepEqual(artikel.map((a) => a.sku), ['A-1', 'A-2', 'B-1'], 'ohne Doppelte, ohne Kappung');
  assert.equal(listen.length, 2, 'beide Listen werden auch benannt');
});

test('Eine SKU, die es im Katalog nicht gibt, erzeugt keine leere Karte', () => {
  const liste = { id: 'system/drei', art: 'system', kopf: { titel: 'Drei', skus: 'A-1, GIBT-ES-NICHT' } };
  const { artikel } = mitverbaut({ sku: 'A-2' }, katalogProbe, [liste]);
  assert.deepEqual(artikel.map((a) => a.sku), ['A-1']);
});

test('Jede Systemliste des Bestands erzeugt für jeden ihrer Artikel Mitverbautes', () => {
  // Gegenprobe am echten Bestand: Wäre die Verknüpfung nur im Kopf richtig
  // und in den Dateien nicht, meldete dieser Test nichts — deshalb zählt er
  // die Artikel, die tatsächlich in einer Liste stehen.
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
  const ordner = pfad('../inhalte/system');
  const listen = readdirSync(ordner)
    .filter((n) => n.endsWith('.md'))
    .map((n) => ({ id: `system/${n.replace('.md', '')}`, art: 'system', kopf: lesKopf(readFileSync(join(ordner, n), 'utf8')).kopf }));
  assert.ok(listen.length >= 4, `nur ${listen.length} Systemlisten`);
  let mitVorschlag = 0;
  for (const a of katalog.artikel) {
    const eigene = listen.filter((s) => String(s.kopf.skus).split(',').map((x) => x.trim()).includes(a.sku));
    const { artikel } = mitverbaut(a, katalog, eigene);
    if (eigene.length === 0) {
      assert.equal(artikel.length, 0, `${a.sku}: Vorschlag ohne Systemliste`);
    } else {
      assert.ok(artikel.length > 0, `${a.sku}: in einer Liste, aber ohne Mitverbautes`);
      assert.ok(!artikel.some((x) => x.sku === a.sku), `${a.sku}: schlägt sich selbst vor`);
      mitVorschlag++;
    }
  }
  assert.equal(mitVorschlag, 32, 'so viele Artikel stehen in mindestens einer Systemliste');
});

test('Keine stille Kappung: eine lange Liste wird vollständig gezeigt', () => {
  // Die Gegenprobe zu dieser Behauptung fehlte zuerst. Eine eingebaute
  // Kappung auf vier Artikel lief durch die gesamte übrige Testdatei —
  // alle Fälle dort waren kürzer als vier. Eine Zusage, die keine Probe
  // widerlegen kann, ist keine Zusage, sondern ein Kommentar.
  const katalog = { artikel: Array.from({ length: 9 }, (_, i) => ({ sku: `L-${i}`, gruppe: 'Probe' })) };
  const lang = { id: 'system/lang', art: 'system', kopf: { titel: 'Lang', skus: katalog.artikel.map((a) => a.sku).join(', ') } };
  const { artikel } = mitverbaut({ sku: 'L-0' }, katalog, [lang]);
  assert.equal(artikel.length, 8, 'alle acht übrigen Positionen, nicht die ersten vier');
});

test('Der Artikel in zwei Listen zeigt am Bestand beide vollständig', () => {
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
  const ordner = pfad('../inhalte/system');
  const listen = readdirSync(ordner)
    .filter((n) => n.endsWith('.md'))
    .map((n) => ({ id: `system/${n.replace('.md', '')}`, art: 'system', kopf: lesKopf(readFileSync(join(ordner, n), 'utf8')).kopf }));
  const doppelt = listen.filter((s) => String(s.kopf.skus).includes('POS-21382'));
  assert.equal(doppelt.length, 2, 'die Grundmauerschutzbahn steht in Grundleitung und Kellerwand');
  const a = katalog.artikel.find((x) => x.sku === 'POS-21382');
  const { artikel } = mitverbaut(a, katalog, doppelt);
  const erwartet = new Set(doppelt.flatMap((s) => String(s.kopf.skus).split(',').map((x) => x.trim())));
  erwartet.delete('POS-21382');
  assert.equal(artikel.length, erwartet.size, `${artikel.length} statt ${erwartet.size} Positionen aus beiden Listen`);
});

test('Die gebaute Artikelseite zeigt den Block nur, wenn eine Systemliste dahintersteht', () => {
  const ordner = pfad('../ausgabe/site/artikel');
  if (!existsSync(ordner)) return; // ohne Bau keine Aussage — und keine falsche
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));
  const listenOrdner = pfad('../inhalte/system');
  const inListe = new Set(
    readdirSync(listenOrdner).filter((n) => n.endsWith('.md'))
      .flatMap((n) => String(lesKopf(readFileSync(join(listenOrdner, n), 'utf8')).kopf.skus ?? '').split(',').map((x) => x.trim()))
      .filter(Boolean),
  );
  let mit = 0;
  let ohne = 0;
  for (const a of katalog.artikel) {
    const datei = join(ordner, `${a.sku}.html`);
    if (!existsSync(datei)) continue;
    const hat = readFileSync(datei, 'utf8').includes('Wird damit zusammen verbaut');
    assert.equal(hat, inListe.has(a.sku), `${a.sku}: Block ${hat ? 'steht da' : 'fehlt'}, Systemliste ${inListe.has(a.sku) ? 'vorhanden' : 'keine'}`);
    if (hat) mit++; else ohne++;
  }
  assert.ok(mit >= 30 && ohne >= 10, `${mit} mit Block, ${ohne} ohne — beide Fälle müssen im Bestand vorkommen`);
});
