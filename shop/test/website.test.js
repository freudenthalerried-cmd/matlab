import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
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
  const seiten = alleInhalte();
  assert.ok(seiten.length >= 24, `nur ${seiten.length} Inhaltsseiten gefunden`);
  for (const s of seiten) {
    const saetze = String(s.kopf.kurz).split(/(?<=[.!?])\s+/).filter(Boolean);
    assert.ok(saetze.length <= 3, `${s.datei}: Kurzfassung hat ${saetze.length} Sätze`);
    assert.ok(String(s.kopf.kurz).length >= 80, `${s.datei}: Kurzfassung zu knapp`);
  }
});

test('Fragen und Kurzfassungen bleiben Fließtext, keine Listen', () => {
  // Der Fehler, der zuerst nur in der llms.txt sichtbar wurde.
  const seiten = alleInhalte();
  assert.ok(seiten.length >= 24, `nur ${seiten.length} Inhaltsseiten gefunden`);
  for (const s of seiten) {
    for (const feld of ['frage', 'kurz', 'titel']) {
      assert.equal(typeof s.kopf[feld], 'string', `${s.datei}: „${feld}" ist keine Zeichenkette`);
    }
    assert.doesNotMatch(String(s.kopf.frage), /,\S/, `${s.datei}: fehlendes Leerzeichen nach Komma`);
  }
});

test('Jede Frage ist als Frage formuliert', () => {
  const seiten = alleInhalte();
  assert.ok(seiten.length >= 24, `nur ${seiten.length} Inhaltsseiten gefunden`);
  for (const s of seiten) {
    assert.match(String(s.kopf.frage), /\?$/, `${s.datei}: „frage" endet nicht auf ein Fragezeichen`);
  }
});

test('Kein Kopfblock verspricht eine Gattung, die es nicht gibt', () => {
  const gruppen = new Set(
    JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8')).artikel.map((a) => a.gruppe),
  );
  const seiten = alleInhalte();
  assert.ok(seiten.length >= 24, `nur ${seiten.length} Inhaltsseiten gefunden`);
  for (const s of seiten) {
    if (!s.kopf.gruppe) continue;
    assert.ok(gruppen.has(s.kopf.gruppe), `${s.datei}: Warengruppe „${s.kopf.gruppe}" gibt es im Katalog nicht`);
  }
});

test('Jede Warengruppe des Katalogs hat eine Seite', () => {
  const gruppen = new Set(
    JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8')).artikel.map((a) => a.gruppe),
  );
  const beschrieben = new Set(alleInhalte().filter((s) => s.art === 'gruppen').map((s) => s.kopf.gruppe));
  assert.equal(gruppen.size, 7, 'sieben Warengruppen — sonst prüft die Schleife nichts');
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
  assert.ok(katalog.artikel.length >= 46, `nur ${katalog.artikel.length} Artikel im Katalog`);
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
  assert.ok(katalog.artikel.length >= 46, `nur ${katalog.artikel.length} Artikel im Katalog`);
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

/* ------------------------------------------------------------------ *
 * llms.txt — der Kanal, für den der Shop gebaut ist
 * ------------------------------------------------------------------ */

test('llms.txt nennt jeden bepreisten Artikel, nicht nur die Gruppen', () => {
  const datei = pfad('../ausgabe/site/llms.txt');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const txt = readFileSync(datei, 'utf8');
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));

  assert.match(txt, /^## Artikel$/m, 'ohne Artikelabschnitt ist die Datei für diesen Kanal wertlos');
  const fehlend = katalog.artikel.filter((a) => !txt.includes(`/artikel/${a.sku}.html`));
  assert.deepEqual(fehlend.map((a) => a.sku), [], 'Artikel ohne Zeile in llms.txt');

  // Jede Artikelzeile trägt den Preis mit Einheit und die Angabe netto —
  // ein Preis ohne beides ist in diesem Kanal eine Falle: Der Assistent
  // vergleicht ihn mit einem Bruttopreis und lässt den Shop teurer aussehen.
  const zeilen = txt.split('\n').filter((z) => z.includes('/artikel/'));
  assert.equal(zeilen.length, katalog.artikel.length);
  for (const z of zeilen) {
    assert.match(z, /\d+,\d{2} € je .+, netto/, `Zeile ohne vollständige Preisangabe: ${z.slice(0, 70)}`);
  }
});

test('llms.txt sagt, was es verschweigt', () => {
  const datei = pfad('../ausgabe/site/llms.txt');
  if (!existsSync(datei)) return;
  const txt = readFileSync(datei, 'utf8');
  // Entweder es fehlt nichts — dann steht das da — oder die Zahl der
  // fehlenden Artikel steht da. Eine Liste, die schweigend kürzt, ist die
  // Fehlerklasse, die dieses Vorhaben am häufigsten gemacht hat.
  assert.ok(/Jeder geführte Artikel steht in dieser Liste\.|Nicht in dieser Liste: \d+ Artikel/.test(txt),
    'die Liste sagt nicht, ob sie vollständig ist');
  assert.match(txt, /Frei-Haus-Schwelle/, 'die Fracht gehört in denselben Absatz wie der Preis');
});

/* ------------------------------------------------------------------ *
 * Der Stärkenvergleich
 * ------------------------------------------------------------------ */

test('die Vergleichstafel rechnet den Zentimeterpreis, ohne die Stärke zu erfinden', () => {
  const datei = pfad('../ausgabe/site/gruppe/daemmung.html');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const html = readFileSync(datei, 'utf8');
  assert.match(html, /Was ein Zentimeter Stärke kostet/);

  // Zwei Stichproben aus dem Bestand, von Hand nachgerechnet:
  // 16,00 € je m² bei 100 mm = 1,60 € je cm; 2,81 € bei 30 mm = 0,94 €.
  assert.match(html, /100 mm<\/td>\s*<td>16,00 €<\/td>\s*<td>1,60 €<\/td>/);
  assert.match(html, /30 mm<\/td>\s*<td>2,81 €<\/td>\s*<td>0,94 €<\/td>/);

  // Und die Platte ohne ablesbare Stärke bekommt keinen gerechneten Preis.
  assert.match(html, /Isover[^<]*<\/a><\/td>\s*<td>—<\/td>\s*<td>10,69 €<\/td>\s*<td>—<\/td>/);
});

test('die Tafel sagt, was sie nicht vergleicht', () => {
  const datei = pfad('../ausgabe/site/gruppe/daemmung.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  // Ein Preisvergleich ohne diesen Satz liest sich als Empfehlung — und
  // führte genau zu dem Fehler, vor dem die Wissensseite warnt: EPS bis zum
  // Boden durchgezogen, weil es billiger war.
  assert.match(html, /Preisvergleich, keine Bauteilempfehlung/);
  assert.match(html, /nur innerhalb derselben Plattenart/);
  assert.match(html, /geschätzt wird sie nicht/);
});

test('nur Gruppenseiten mit ausdrücklichem Vermerk bekommen die Tafel', () => {
  // Sie ist für Platten gebaut. Auf Rohren oder Sackware wäre „je cm" eine
  // Zahl ohne Bedeutung — und eine Zahl ohne Bedeutung wird trotzdem
  // verglichen.
  const ordner = pfad('../ausgabe/site/gruppe');
  if (!existsSync(ordner)) return;
  const mitTafel = readdirSync(ordner).filter(
    (d) => d.endsWith('.html') && readFileSync(join(ordner, d), 'utf8').includes('Was ein Zentimeter Stärke kostet'),
  );
  assert.deepEqual(mitTafel, ['daemmung.html']);
});

/* ------------------------------------------------------------------ *
 * Keine Spanne auf der Kundenseite
 * ------------------------------------------------------------------ */

test('keine gebaute Seite nennt die Handelsspanne', () => {
  // Weisung des Auftraggebers vom 28. August: keine Spanne ausgeben. Bis
  // dahin stand sie im ersten Satz der Startseite, in der Preistafel und auf
  // zwei Wissensseiten — jeweils mit begründeter Ausnahme vom Interna-Prüfer.
  // Die Ausnahmen sind weg; diese Probe hält den Zustand fest, damit die Zahl
  // nicht über einen neuen Absatz zurückkommt.
  //
  // Was ausdrücklich erlaubt bleibt: der Abstand zum Listenpreis („25 % unter
  // dem Listenpreis des Lieferanten"). Das ist die Ersparnis des Kunden und
  // nicht unser Ertrag — dieselbe Kalkulation von der anderen Seite.
  const wurzel = pfad('../ausgabe/site');
  if (!existsSync(wurzel)) return; // ohne Bau keine Aussage — und keine falsche
  const verboten = /Handelsspanne|Rohmarge|Zielmarge|Gewinnspanne|Spanne von \d/;
  const gefunden = [];
  const gehe = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const p = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) { gehe(p); continue; }
      if (!eintrag.name.endsWith('.html')) continue;
      const treffer = verboten.exec(readFileSync(p, 'utf8'));
      if (treffer) gefunden.push(`${eintrag.name}: „${treffer[0]}"`);
    }
  };
  gehe(wurzel);
  assert.deepEqual(gefunden, [], 'die Spanne steht wieder auf einer Kundenseite');
});

test('der Preisvorteil steht weiterhin da', () => {
  // Die Gegenprobe: Wer die Spanne entfernt und dabei die Ersparnis mit
  // entfernt, hat die Seite nicht diskret gemacht, sondern stumm.
  const index = pfad('../ausgabe/site/index.html');
  if (!existsSync(index)) return;
  const html = readFileSync(index, 'utf8');
  assert.match(html, /unter dem Listenpreis des Lieferanten/);
  assert.match(html, /im Median/);
});

/* ------------------------------------------------------------------ *
 * Die Zustellung dieses einen Artikels
 * ------------------------------------------------------------------ */

test('jede Artikelseite nennt die Zustellung in Euro und die Menge, ab der sie sich lohnt', () => {
  const ordner = pfad('../ausgabe/site/artikel');
  if (!existsSync(ordner)) return; // ohne Bau keine Aussage — und keine falsche
  const seiten = readdirSync(ordner).filter((d) => d.endsWith('.html'));
  assert.ok(seiten.length >= 46, `nur ${seiten.length} Artikelseiten`);
  for (const datei of seiten) {
    const html = readFileSync(join(ordner, datei), 'utf8');
    assert.match(html, /<span class="k">Zustellung<\/span>/, `${datei}: keine Zustellungsangabe`);
    assert.match(html, /ab hier übersteigt die Ware die Zustellung/, `${datei}: keine Mengenschwelle`);
  }
});

test('die Schwelle wird gerechnet, nicht behauptet', () => {
  // 83,00 € Zustellung bei 1,93 € je m² sind 44 m² — aufgerundet, weil 43
  // noch darunter lägen. Von Hand nachgerechnet, damit die Probe die Zahl
  // prüft und nicht nur ihr Vorhandensein.
  const datei = pfad('../ausgabe/site/artikel/POS-12566.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  assert.match(html, /83,00 €/);
  assert.match(html, /<span class="w">44 m²<\/span>/);
});

test('die Zustellung wird nicht mit dem Einheitenpreis verglichen', () => {
  // Der erste Entwurf meldete bei fast jedem Artikel „die Fracht kostet mehr
  // als die Ware" — richtig für einen Quadratmeter, falsch für jede echte
  // Bestellung. Der Satz darf nicht zurückkommen.
  const ordner = pfad('../ausgabe/site/artikel');
  if (!existsSync(ordner)) return;
  const seiten = readdirSync(ordner).filter((d) => d.endsWith('.html'));
  assert.ok(seiten.length >= 46, `nur ${seiten.length} Artikelseiten`);
  for (const datei of seiten) {
    assert.doesNotMatch(readFileSync(join(ordner, datei), 'utf8'),
      /Zustellung mehr als die Ware/, `${datei}: der irreführende Vergleich ist zurück`);
  }
});

/* ------------------------------------------------------------------ *
 * Die Auskunft „was hier möglich ist" kommt aus den Daten
 * ------------------------------------------------------------------ */

test('Startseite und llms.txt sagen aus den Daten, ob bestellt werden kann', () => {
  // Der teure Fehler wäre nicht der falsche Satz, sondern der **eingefrorene**:
  // ein „Bestellen ist noch nicht möglich", das stehenbleibt, wenn der
  // Auftraggeber die drei Punkte geschlossen hat. Diese Probe lässt den
  // echten Bau zweimal laufen — einmal auf dem Bestand, einmal mit einer
  // vollständig beantworteten Betreiberdatei — und verlangt, dass die
  // Auskunft kippt.
  const ablage = mkdtempSync(join(tmpdir(), 'bau-bereit-'));
  const betreiberVoll = join(ablage, 'betreiber.json');
  const echt = JSON.parse(readFileSync(pfad('../data/betreiber.json'), 'utf8'));
  writeFileSync(betreiberVoll, JSON.stringify({
    ...echt,
    email: 'office@example.at', telefon: '+43 1 234', uid: 'ATU12345678',
    gewerbewortlaut: 'Handelsgewerbe',
    zahlungsanbieter: 'Beispiel', rechtstexteFundstelle: 'Kanzlei',
    domainZeigtAufShop: true, repositoryPrivat: true,
  }, null, 2));

  const lauf = spawnSync(process.execPath, [pfad('../bin/website.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, WEBSITE_AUSGABE: ablage, STARTKLAR_BETREIBER: betreiberVoll },
  });
  assert.equal(lauf.status, 0, lauf.stderr);

  const llmsBereit = readFileSync(join(ablage, 'site', 'llms.txt'), 'utf8');
  const startBereit = readFileSync(join(ablage, 'site', 'index.html'), 'utf8');
  assert.match(llmsBereit, /Bestellen ist möglich/);
  assert.ok(!llmsBereit.includes('Bestellen ist noch nicht möglich'));
  assert.ok(!startBereit.includes('kein laufender Shop'),
    'die Vorschauwarnung gehört weg, sobald nichts mehr offen ist');

  // Und die Gegenrichtung am Bestand: Solange die drei Punkte offen sind,
  // steht die Absage da — samt dem, was fehlt.
  const llmsJetzt = readFileSync(pfad('../ausgabe/site/llms.txt'), 'utf8');
  assert.match(llmsJetzt, /Bestellen ist noch nicht möglich/);
  assert.match(llmsJetzt, /ein Zahlungsanbieter/);
  rmSync(ablage, { recursive: true, force: true });
});
