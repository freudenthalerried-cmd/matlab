import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loeseVerweis, loeseVerwandt, marke, mitverbaut, HERSTELLER, positionsliste } from '../bin/website.mjs';
import { lesKopf } from '../src/markdown.js';
import { KORBSCHLUESSEL } from '../src/shopkern.js';
import { SUCH_CRAWLER, TRAININGS_CRAWLER } from '../src/maschinenlesbar.js';
import { LIEFERGEBIET } from '../src/liefergebiet.js';

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
  // 83,00 € Zustellung bei 1,93 € je m² sind 43,005 m². Von Hand
  // nachgerechnet, damit die Probe die Zahl prüft und nicht nur ihr
  // Vorhandensein.
  //
  // **Berichtigt am 29.08.:** Hier stand 44 m² — auf ganze Quadratmeter
  // aufgerundet. Die Platte wird in Einheiten zu 0,5 m² abgegeben; die
  // nächste lieferbare Menge ist 43,5 m², also 87 Platten. 44 war zwar
  // lieferbar, aber eine halbe Platte zu hoch: eine Schwelle, die niemand
  // nachrechnen kann, weil sie zweimal gerundet ist.
  const datei = pfad('../ausgabe/site/artikel/POS-12566.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  assert.match(html, /83,00 €/);
  assert.match(html, /<span class="w">43,5 m²<\/span>/);
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


/* ------------------------------------------------------------------ *
 * Die kleinste bestellbare Menge steht überall, wo der Preis steht
 * ------------------------------------------------------------------ */

test('llms.txt nennt bei Gebindeware die kleinste bestellbare Menge', () => {
  const datei = pfad('../ausgabe/site/llms.txt');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const txt = readFileSync(datei, 'utf8');
  const katalog = JSON.parse(readFileSync(pfad('../data/katalog-baustoff.json'), 'utf8'));

  // Ohne die Mindestmenge antwortet ein Assistent auf „was kostet die
  // Isover-Platte?" mit 10,69 € — der Kunde, der eine bestellt, bekommt eine
  // Rechnung über 92,36 €.
  assert.match(txt, /Isover TDPT[^\n]*Abgabe ab 8,64 m² \(92,36 €\)/);
  assert.match(txt, /XPS glatt SF 30[^\n]*Abgabe ab 0,75 m² \(3,92 €\)/);

  // Und die Gegenrichtung: Stückgut bekommt keine erfundene Mindestmenge.
  const rohr = txt.split('\n').find((z) => z.includes('PVC Kanalrohr NW 100'));
  assert.ok(rohr, 'die Zeile fehlt');
  assert.ok(!rohr.includes('Abgabe ab'), rohr);

  // Nicht jede Zeile trägt sie — sonst stimmte die Erkennung nicht.
  const mitAbgabe = txt.split('\n').filter((z) => z.includes('/artikel/') && z.includes('Abgabe ab'));
  assert.ok(mitAbgabe.length >= 12 && mitAbgabe.length < katalog.artikel.length,
    `${mitAbgabe.length} von ${katalog.artikel.length} Zeilen mit Mindestmenge`);
});

test('die Artikelkarte nennt die kleinste bestellbare Menge und ihren Preis', () => {
  const datei = pfad('../ausgabe/site/gruppe/daemmung.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  assert.match(html, /<span class="ab">ab 0,75 m² · 3,92&nbsp;€<\/span>/);
  assert.match(html, /<span class="ab">ab 0,5 m² · 0,97&nbsp;€<\/span>/);

  // Auf einer Seite ohne Gebindeware steht keine solche Zeile.
  const kanal = pfad('../ausgabe/site/gruppe/kanal.html');
  if (existsSync(kanal)) {
    assert.ok(!readFileSync(kanal, 'utf8').includes('class="ab"'),
      'Stückgut bekommt keine erfundene Mindestmenge');
  }
});


test('die Zustellschwelle nennt eine lieferbare Menge, keine gerundete', () => {
  const datei = pfad('../ausgabe/site/artikel/POS-12569.html');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const html = readFileSync(datei, 'utf8');
  // 83,00 € Zustellung ÷ 5,23 € je m² sind 15,87 m². Auf ganze Einheiten
  // gerundet wären das 16 m² — eine Menge, die es bei einer Platte zu
  // 0,75 m² nicht gibt. Lieferbar sind 16,5 m², also 22 Platten.
  assert.match(html, /gleich viel wert<\/span><span class="w">16,5 m²/);
  assert.ok(!html.includes('>16 m²<'), 'die gerundete, nicht lieferbare Menge');

  // Sackware ebenso: 75,50 € ÷ 2,77 € je kg sind 27,26 kg, lieferbar sind
  // zwei Gebinde zu 25 kg.
  const sack = pfad('../ausgabe/site/artikel/POS-13728.html');
  if (existsSync(sack)) {
    assert.match(readFileSync(sack, 'utf8'), /gleich viel wert<\/span><span class="w">50 kg/);
  }

  // Und Stückgut ohne Gebindebindung bleibt bei der ganzen Zahl.
  const rohr = pfad('../ausgabe/site/artikel/POS-10095.html');
  if (existsSync(rohr)) {
    assert.match(readFileSync(rohr, 'utf8'), /gleich viel wert<\/span><span class="w">8 Stück/);
  }
});


test('der Bauschritt nennt die übertragene Größe, nicht nur die rohe', () => {
  // Am 29.08. wäre beinahe eine Optimierung auf der falschen Zahl passiert:
  // Die Zeichnungen sind 39 KB roh und 2,4 KB gezippt. Wer nur die Rohgröße
  // sieht, wirft sie hinaus und spart nichts.
  const lauf = spawnSync(process.execPath, [pfad('../bin/website.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, WEBSITE_AUSGABE: mkdtempSync(join(tmpdir(), 'bau-groesse-')) },
  });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.match(lauf.stdout, /shop\.js:\s+\d+ KB roh, [\d.]+ KB gezippt/);
  assert.match(lauf.stdout, /website\.html \(\d+ KB roh, [\d.]+ KB gezippt/);

  // Und die gezippte Zahl muss kleiner sein als die rohe — sonst misst der
  // Bericht etwas anderes, als er behauptet.
  const [, roh, zip] = lauf.stdout.match(/shop\.js:\s+(\d+) KB roh, ([\d.]+) KB gezippt/);
  assert.ok(Number(zip) < Number(roh) / 2, `${zip} KB gezippt gegen ${roh} KB roh`);
});


test('llms.txt sagt auch, was der Shop nicht führt', () => {
  const datei = pfad('../ausgabe/site/llms.txt');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const txt = readFileSync(datei, 'utf8');
  const register = JSON.parse(readFileSync(pfad('../data/suchwoerter.json'), 'utf8'));
  const abgelehnt = register._nichtAufgenommen.filter((w) => w.antwort);
  assert.ok(abgelehnt.length >= 20, `nur ${abgelehnt.length} begründete Ablehnungen`);

  assert.match(txt, /^## Was wir nicht führen$/m,
    'ein Assistent ohne diese Angabe antwortet bei einem Baustoffhändler wahrscheinlich „ja"');
  for (const w of abgelehnt) {
    assert.ok(txt.includes(`**${w.wort}**`), `„${w.wort}" fehlt in llms.txt`);
  }

  // Und der Kundentext steht dort, nicht die redaktionelle Begründung.
  assert.ok(txt.includes('Drainagerohre führen wir nicht'));
  assert.ok(register._nichtAufgenommen.length >= 20,
    `nur ${register._nichtAufgenommen.length} Ablehnungen — die Schleife darunter prüfte fast nichts`);
  for (const w of register._nichtAufgenommen) {
    if (w.warum && w.warum.length > 40 && w.warum !== w.antwort) {
      assert.ok(!txt.includes(w.warum), `die Begründung zu „${w.wort}" steht im Kundenkanal`);
    }
  }
});


/* ------------------------------------------------------------------ *
 * Nichts wird von einem fremden Server geladen
 * ------------------------------------------------------------------ */

test('keine gebaute Seite lädt eine Datei von einem fremden Server', () => {
  // Bis zum 29.08. lud jede Seite drei Schriften von fonts.googleapis.com
  // und fonts.gstatic.com. Der Browser des Besuchers baut diese Verbindung
  // auf, bevor er irgendetwas gefragt wurde, und übermittelt dabei seine
  // IP-Adresse an einen Dritten (LG München I, 20.01.2022, 3 O 17493/20).
  //
  // Geprüft wird die **Einbindung**, nicht der Verweis: Ein <a href> auf das
  // Merkblatt des Herstellers wird erst auf Klick geladen und ist gewollt.
  const ordner = pfad('../ausgabe/site');
  if (!existsSync(ordner)) return; // ohne Bau keine Aussage — und keine falsche

  const seiten = [];
  const gehe = (o) => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(join(o, e.name));
      else if (e.name.endsWith('.html')) seiten.push(join(o, e.name));
    }
  };
  gehe(ordner);
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Seiten gefunden`);

  // Was der Browser **von sich aus** holt.
  const einbindungen = [
    /<link\b[^>]*\brel=["']?(?:stylesheet|preconnect|preload|dns-prefetch)[^>]*\bhref=["']https?:\/\/([^"'/]+)/gi,
    /<script\b[^>]*\bsrc=["']https?:\/\/([^"'/]+)/gi,
    /<(?:img|iframe|video|audio|source|embed)\b[^>]*\bsrc=["']https?:\/\/([^"'/]+)/gi,
    /@import\s+(?:url\()?["']https?:\/\/([^"'/)]+)/gi,
    /url\(\s*["']?https?:\/\/([^"')]+)/gi,
  ];
  const fremd = [];
  for (const datei of seiten) {
    const html = readFileSync(datei, 'utf8');
    for (const muster of einbindungen) {
      for (const treffer of html.matchAll(muster)) {
        fremd.push(`${datei.slice(ordner.length + 1)} → ${treffer[1]}`);
      }
    }
  }
  assert.deepEqual(fremd, [], 'fremde Einbindungen in gebauten Seiten');
});

test('die Herstellerverweise sind weiterhin da — der Test prüft nicht eine leere Seite', () => {
  // Gegenrichtung: Der Test oben wäre auch grün, wenn gar keine fremde
  // Adresse mehr vorkäme. Die Merkblattverweise sollen bleiben.
  const datei = pfad('../ausgabe/site/artikel/POS-13728.html');
  if (!existsSync(datei)) return;
  const html = readFileSync(datei, 'utf8');
  assert.match(html, /<a[^>]+href="https:\/\/www\.synthesa\.at/,
    'der Verweis auf das Merkblatt des Herstellers fehlt');
});


test('die Datenschutzseite nennt den echten Speicherschlüssel, nicht einen erfundenen', () => {
  // Der erste Wurf schrieb „fb.warenkorb" — frei erfunden, in einer
  // Rechtsseite. Der Schlüssel kommt jetzt aus dem Code.
  const datei = pfad('../ausgabe/site/rechtliches/datenschutz.html');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const html = readFileSync(datei, 'utf8');
  assert.ok(html.includes(KORBSCHLUESSEL), `der Schlüssel ${KORBSCHLUESSEL} steht nicht auf der Seite`);
  assert.match(html, /Was beim bloßen Besuch dieser Seite geschieht/);
  assert.match(html, /Keine Cookies/);
  assert.match(html, /keine Datei von einem fremden Server|Seit 29\.08\. lädt keine Seite/);
  // Und der offene Punkt bleibt sichtbar, statt beruhigend zu fehlen.
  assert.match(html, /Serverprotokoll/);
  assert.match(html, /noch nicht entschieden/);
});


test('jede Seite sagt, was ohne JavaScript nicht geht — und der Inhalt steht trotzdem da', () => {
  const wurzel = pfad('../ausgabe/site');
  if (!existsSync(wurzel)) return; // ohne Bau keine Aussage — und keine falsche
  const seiten = [];
  const gehe = (o) => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(join(o, e.name));
      else if (e.name.endsWith('.html')) seiten.push(join(o, e.name));
    }
  };
  gehe(wurzel);
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Seiten`);

  const ohneHinweis = [];
  const zuWenigText = [];
  for (const datei of seiten) {
    const html = readFileSync(datei, 'utf8');
    const name = datei.slice(wurzel.length + 1);
    if (!html.includes('<noscript')) ohneHinweis.push(name);

    // Und der Inhalt muss **ohne** das Skript dastehen. Gemessen wird an
    // einer Fassung ohne <script>: Was dann noch als Text übrig ist, ist
    // das, was ein Besucher ohne JavaScript liest.
    const stumm = html.replace(/<script\b[\s\S]*?<\/script>/g, '');
    const von = stumm.indexOf('<div class="huelle"');
    const bis = stumm.indexOf('<footer');
    const text = stumm.slice(von, bis).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    // Warenkorb, Kasse und Suche entstehen erst mit dem Skript — sie sagen
    // das selbst und sind hier ausgenommen.
    if (/^(warenkorb|kasse|suche)\.html$/.test(name)) continue;
    if (text.length < 800) zuWenigText.push(`${name}: ${text.length} Zeichen`);
  }
  assert.deepEqual(ohneHinweis, [], 'Seiten ohne Hinweis auf die Grenzen ohne JavaScript');
  assert.deepEqual(zuWenigText, [], 'Seiten, deren Inhalt erst das Skript erzeugt');
});


test('die ausgelieferte robots.txt trägt die entschiedene Krawlerregel', () => {
  // Bis zum 30.08. schrieb der Bau drei eigene Zeilen, während
  // npm run veroeffentlichung dieselbe Datei aus robotsTxt() erzeugte. Die
  // ausgelieferte Fassung erlaubte damit genau das Gegenteil der
  // Entscheidung aus ki-sichtbarkeit-konzept.md.
  const datei = pfad('../ausgabe/site/robots.txt');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const txt = readFileSync(datei, 'utf8');

  // Die Zusicherung steht **vor** den Schleifen: Wären die Listen leer,
  // liefen sie durch und meldeten Grün. `pruefe-tests` hat genau das
  // angemahnt, als sie hier unten stand.
  assert.ok(SUCH_CRAWLER.length >= 3 && TRAININGS_CRAWLER.length >= 3,
    'zu wenige Kennungen — die Schleifen prüften fast nichts');

  // Gefunden werden: ja.
  for (const bot of SUCH_CRAWLER) {
    const block = new RegExp(`User-agent: ${bot}\\nAllow: /`);
    assert.match(txt, block, `${bot} darf suchen dürfen`);
  }
  // Trainingsmaterial: nein.
  for (const bot of TRAININGS_CRAWLER) {
    const block = new RegExp(`User-agent: ${bot}\\nDisallow: /`);
    assert.match(txt, block, `${bot} ist nicht ausgeschlossen`);
  }
  assert.match(txt, /^Sitemap: https:\/\/[^\s]+\/sitemap\.xml$/m);
  // Und der allgemeine Eintrag bleibt: Wer nicht genannt ist, darf lesen.
  assert.match(txt, /User-agent: \*\nAllow: \//);
});

test('jede gebaute Seite steht in der sitemap — oder trägt noindex', () => {
  const sitemap = pfad('../ausgabe/site/sitemap.xml');
  const wurzel = pfad('../ausgabe/site');
  if (!existsSync(sitemap)) return;
  const xml = readFileSync(sitemap, 'utf8');
  const genannt = new Set([...xml.matchAll(/<loc>https:\/\/[^/]+\/(.*?)\.html<\/loc>/g)].map((m) => m[1]));

  const gebaut = new Set();
  const gehe = (o, vor = '') => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(join(o, e.name), `${vor}${e.name}/`);
      else if (e.name.endsWith('.html')) gebaut.add(vor + e.name.slice(0, -5));
    }
  };
  gehe(wurzel);
  assert.ok(gebaut.size >= 40, `nur ${gebaut.size} Seiten gebaut`);
  assert.deepEqual([...genannt].filter((k) => !gebaut.has(k)).sort(), [], 'in der sitemap, aber nicht gebaut');

  // **Ergänzt am 30.08.** Bis dahin verlangte dieser Test, dass *jede*
  // gebaute Seite in der Sitemap steht. Gemessen an allen 81 Seiten trugen
  // drei davon 43, 53 und 214 Zeichen eigenen Inhalt — Warenkorb, Kasse,
  // Suche, also Bedienoberflächen, die ohne Skript leer sind. Eine Sitemap
  // ist eine Behauptung: Diese Seiten lohnen die Aufnahme.
  //
  // Die Lücke bleibt trotzdem verboten. Wer nicht in der Sitemap steht, muss
  // ausdrücklich `noindex` tragen — Vergessen sieht sonst aus wie Absicht.
  const fehlend = [...gebaut].filter((k) => !genannt.has(k)).sort();
  assert.equal(fehlend.length, 3, `${fehlend.length} Seiten fehlen in der sitemap, erwartet sind drei`);
  assert.deepEqual(fehlend, ['kasse', 'suche', 'warenkorb'],
    'die Liste der ausgenommenen Seiten hat sich geändert — nachmessen');
  for (const id of fehlend) {
    const html = readFileSync(join(wurzel, `${id}.html`), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex,follow">/,
      `${id} steht weder in der sitemap noch trägt es noindex`);
  }
});

test('keine Seite mit eigenem Inhalt trägt noindex', () => {
  // Die Gegenrichtung, und die gefährlichere: Ein `noindex` an der falschen
  // Seite nimmt sie aus jeder Suche — still, ohne Fehlermeldung.
  const wurzel = pfad('../ausgabe/site');
  if (!existsSync(wurzel)) return;
  const gemessen = [];
  const gehe = (o, vor = '') => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(join(o, e.name), `${vor}${e.name}/`);
      else if (e.name.endsWith('.html')) {
        const html = readFileSync(join(o, e.name), 'utf8');
        const a = html.indexOf('<div id="inhalt"');
        const b = html.indexOf('<footer');
        assert.ok(a > 0 && b > a, `${vor}${e.name}: ohne Anker und Fußzeile ist der eigene Inhalt nicht abgrenzbar`);
        const eigen = html.slice(a, b)
          .replace(/<script[\s\S]*?<\/script>/g, '')
          .replace(/<p class="krume">[\s\S]*?<\/p>/, '')
          .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
        gemessen.push({ id: vor + e.name.slice(0, -5), laenge: eigen.length, noindex: html.includes('noindex') });
      }
    }
  };
  gehe(wurzel);
  assert.ok(gemessen.length >= 40, `nur ${gemessen.length} Seiten gemessen`);
  for (const s of gemessen) {
    if (s.noindex) assert.ok(s.laenge < 500, `${s.id} trägt noindex, hat aber ${s.laenge} Zeichen eigenen Inhalt`);
    else assert.ok(s.laenge >= 500, `${s.id} steht im Index, trägt aber nur ${s.laenge} Zeichen`);
  }
});

test('der Sprungverweis hat auf jeder Seite ein Ziel hinter der Kopfleiste', () => {
  // **Der Befund vom 30.08.:** Der Anker wurde vor die Brotkrume gesetzt —
  // das traf 80 von 81 Seiten. Die Startseite hat keine Brotkrume, also kein
  // Ziel; „Zum Inhalt springen" führte dort ins Leere. Die eine Seite, die
  // jeder Besucher zuerst sieht.
  //
  // Der zweite Anlauf setzte den Anker bei fehlender Brotkrume an den Anfang
  // und damit vor den Sprungverweis selbst: ein Ziel, das nichts
  // überspringt. Geprüft wird deshalb die Reihenfolge, nicht die Existenz.
  const wurzel = pfad('../ausgabe/site');
  if (!existsSync(wurzel)) return;
  const seiten = [];
  const gehe = (o, vor = '') => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(join(o, e.name), `${vor}${e.name}/`);
      else if (e.name.endsWith('.html')) seiten.push({ id: vor + e.name.slice(0, -5), html: readFileSync(join(o, e.name), 'utf8') });
    }
  };
  gehe(wurzel);
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Seiten`);
  for (const { id, html } of seiten) {
    const verweis = html.indexOf('href="#inhalt"');
    const kopfEnde = html.indexOf('</header>');
    const ziel = html.indexOf('id="inhalt"');
    assert.ok(verweis >= 0, `${id} hat keinen Sprungverweis`);
    assert.ok(ziel > kopfEnde && kopfEnde > verweis,
      `${id}: das Ziel liegt nicht hinter der Kopfleiste`);
  }
});


/* ------------------------------------------------------------------ *
 * Auszeichnung, die der Inhalt deckt
 * ------------------------------------------------------------------ */

const TABELLE = (zeilen) => '| # | Position |\n|---|---|\n'
  + zeilen.map((z, i) => `| ${i + 1} | ${z} |`).join('\n') + '\n';

test('die Positionsliste wird zur ItemList, in der Reihenfolge der Tabelle', () => {
  const liste = positionsliste(TABELLE(['Kanalrohr', 'Bögen', 'Abzweiger', 'Schachtringe']));
  assert.equal(liste['@type'], 'ItemList');
  assert.equal(liste.numberOfItems, 4);
  assert.deepEqual(liste.itemListElement.map((e) => e.position), [1, 2, 3, 4]);
  assert.deepEqual(liste.itemListElement.map((e) => e.name),
    ['Kanalrohr', 'Bögen', 'Abzweiger', 'Schachtringe']);
});

test('was nicht im Sortiment steht, bleibt in der Liste und trägt den Vermerk', () => {
  // Dieselbe Entscheidung wie auf der Seite: Eine Liste, die nur zeigt, was
  // im Regal liegt, ist ein Angebot und keine Positionsliste. Der Vermerk
  // gehört mit in die Auszeichnung, sonst liest eine Maschine „bestellbar".
  const liste = positionsliste(TABELLE(['Kanalrohr', 'Gleitmittel *(nicht im Sortiment)*', 'Bögen']));
  assert.equal(liste.itemListElement[1].name, 'Gleitmittel', 'die Klammer gehört nicht in den Namen');
  assert.equal(liste.itemListElement[1].disambiguatingDescription, 'nicht im Sortiment');
  assert.equal(liste.itemListElement[0].disambiguatingDescription, undefined);
});

test('ohne Positionstabelle entsteht keine Liste', () => {
  // Sonst trüge jede Seite mit irgendeiner Tabelle eine Positionsliste.
  assert.equal(positionsliste('Ein Absatz ohne Tabelle.'), null);
  assert.equal(positionsliste(TABELLE(['Eins', 'Zwei'])), null, 'zwei Zeilen sind keine Liste');
  assert.equal(positionsliste(undefined), null);
});

test('keine Seite behauptet eine Anleitung, die sie nicht hat', () => {
  // **Der Befund vom 30.08.:** Die vier Systemseiten trugen `HowTo` — ohne
  // einen einzigen `step`. Ein HowTo ohne Schritte ist eine Typbehauptung,
  // keine Anleitung. Was die Seiten wirklich führen, ist eine Positionsliste.
  const wurzel = pfad('../ausgabe/site');
  if (!existsSync(wurzel)) return;
  const seiten = [];
  const gehe = (o, vor = '') => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(join(o, e.name), `${vor}${e.name}/`);
      else if (e.name.endsWith('.html')) seiten.push({ id: vor + e.name.slice(0, -5), html: readFileSync(join(o, e.name), 'utf8') });
    }
  };
  gehe(wurzel);
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Seiten`);
  let mitListe = 0;
  let mitFrage = 0;
  for (const { id, html } of seiten) {
    const treffer = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    if (!treffer) continue;
    const daten = JSON.parse(treffer[1]);
    const typen = [daten['@type']].flat();
    assert.ok(!typen.includes('HowTo'), `${id} behauptet HowTo`);
    if (daten.mainEntity) {
      mitFrage++;
      assert.ok(Array.isArray(daten.mainEntity), `${id}: mainEntity einer FAQPage ist eine Liste`);
      assert.equal(daten.mainEntity[0]['@type'], 'Question');
      assert.ok(typen.includes('FAQPage'),
        `${id} trägt eine Frage-Antwort, ist aber keine FAQPage — dann liest sie niemand als solche`);
    }
    if (daten.about?.['@type'] === 'ItemList') {
      mitListe++;
      assert.equal(daten.about.numberOfItems, daten.about.itemListElement.length);
      assert.ok(daten.about.itemListElement.every((e) => e.name && e.position),
        `${id}: eine Position ohne Namen oder Nummer`);
    }
  }
  assert.equal(mitListe, 4, `${mitListe} Seiten mit Positionsliste, erwartet sind die vier Systemseiten`);
  assert.ok(mitFrage >= 20, `nur ${mitFrage} Seiten mit Frage-Antwort`);
});


test('das Liefergebiet steht in der Auszeichnung als Orte — aus der Entscheidung', () => {
  // **Der Befund vom 30.08.:** Die Startseite trug die Bezirke fest im
  // Quelltext, neben der Entscheidung in LIEFERGEBIET — zwei Wege zur selben
  // Angabe, und die Reihenfolge wich schon voneinander ab.
  //
  // Geprüft wird an allen gebauten Seiten: Wo ein Liefergebiet ausgezeichnet
  // ist, sind es benannte Orte, und die Namen sind genau die der Entscheidung.
  const wurzel = pfad('../ausgabe/site');
  if (!existsSync(wurzel)) return;
  const erwartet = LIEFERGEBIET.bezirke.map((b) => b.name);
  assert.ok(erwartet.length >= 3, `nur ${erwartet.length} Bezirke entschieden`);
  const seiten = [];
  const gehe = (o, vor = '') => {
    for (const e of readdirSync(o, { withFileTypes: true })) {
      if (e.isDirectory()) gehe(join(o, e.name), `${vor}${e.name}/`);
      else if (e.name.endsWith('.html')) seiten.push({ id: vor + e.name.slice(0, -5), html: readFileSync(join(o, e.name), 'utf8') });
    }
  };
  gehe(wurzel);
  let gesehen = 0;
  for (const { id, html } of seiten) {
    const treffer = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    if (!treffer) continue;
    const daten = JSON.parse(treffer[1]);
    for (const gebiet of [daten.areaServed, daten.offers?.areaServed]) {
      if (gebiet === undefined) continue;
      gesehen++;
      assert.ok(Array.isArray(gebiet), `${id}: areaServed ist keine Liste von Orten`);
      assert.deepEqual(gebiet.map((o) => o['@type']), erwartet.map(() => 'AdministrativeArea'));
      assert.deepEqual(gebiet.map((o) => o.name), erwartet,
        `${id}: die Bezirke weichen von der Entscheidung ab`);
      assert.equal(gebiet.length, erwartet.length, `${id}: ${gebiet.length} Orte statt ${erwartet.length}`);
      for (const ort of gebiet) {
        assert.equal(ort.address.addressCountry, LIEFERGEBIET.land);
      }
    }
  }
  assert.ok(gesehen >= 40, `nur ${gesehen} Auszeichnungen mit Liefergebiet`);
});
