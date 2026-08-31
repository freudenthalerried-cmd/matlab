import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';


const werkzeug = fileURLToPath(new URL('../bin/veroeffentlichung.mjs', import.meta.url));
const zielordner = fileURLToPath(new URL('../veroeffentlichung', import.meta.url));

/**
 * **Berichtigt am 30.08.** Hier standen drei Testfälle für `llmsTxt()` —
 * eine zweite Fassung der Datei, die `bin/veroeffentlichung.mjs` selbst
 * erzeugte. Sie ist weg: Veröffentlicht wird jetzt, was der Bau erzeugt.
 *
 * Die Zusicherungen wandern mit, statt zu verschwinden — sie zeigen jetzt
 * auf die **ausgelieferte** Datei statt auf eine Funktion, die niemand mehr
 * aufruft.
 */
test('die ausgelieferte llms.txt nennt Firma und Liefergebiet', () => {
  const datei = fileURLToPath(new URL('../ausgabe/site/llms.txt', import.meta.url));
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const txt = readFileSync(datei, 'utf8');
  assert.match(txt.split('\n')[0], /^# .+/, 'die erste Zeile ist die Überschrift');
  assert.match(txt, /Lieferung regional \(Bezirk /);
  assert.match(txt, /Nettopreise für Unternehmer/);
});

test('die ausgelieferte llms.txt bleibt einzeilig, wo sie einzeilig sein muss', () => {
  // Fremdtext aus einem Artikelnamen darf die Gliederung nicht sprengen:
  // Jede Artikelzeile ist genau eine Zeile.
  const datei = fileURLToPath(new URL('../ausgabe/site/llms.txt', import.meta.url));
  if (!existsSync(datei)) return;
  const zeilen = readFileSync(datei, 'utf8').split('\n');
  const artikel = zeilen.filter((z) => z.includes('/artikel/'));
  assert.ok(artikel.length >= 40, `nur ${artikel.length} Artikelzeilen`);
  for (const z of artikel) {
    assert.ok(z.startsWith('- ['), `Artikelzeile ohne Listenform: ${z.slice(0, 50)}`);
    assert.ok(!z.includes('\r'), 'Zeilenumbruch mitten in einer Zeile');
  }
});

test('das Werkzeug erfindet keine zweite Fassung der ausgelieferten Dateien', () => {
  // Der eigentliche Befund vom 30.08.: robots.txt und llms.txt entstanden an
  // zwei Stellen und unterschieden sich. Jetzt gibt es nur noch einen
  // Erzeuger, und dieses Werkzeug liest ihn.
  //
  // **Die Grenze dieser Probe steht dabei:** Sie liest den Quelltext, nicht
  // das Ergebnis. Das Schreiben ließe sich schöner prüfen, ist aber durch
  // das Feedtor gesperrt — `--schreiben` bricht ab, solange bei 43 Artikeln
  // die GTIN fehlt. Bis dahin ist die Frage „liest das Werkzeug die gebaute
  // Datei?" die einzige, die sich beantworten lässt; ein erster Wurf, der
  // nur das Fehlen der alten Aufrufe prüfte, überlebte die Gegenprobe.
  const quelle = readFileSync(werkzeug, 'utf8');
  assert.ok(!quelle.includes('llmsTxt('), 'llmsTxt wird wieder aufgerufen');
  assert.ok(!quelle.includes('robotsTxt('), 'robotsTxt wird wieder aufgerufen');
  for (const datei of ['robots.txt', 'llms.txt']) {
    assert.ok(quelle.includes(`readFileSync(join(gebaut, '${datei}')`),
      `${datei} wird nicht aus dem Bau gelesen`);
  }
  // Und der Abbruch, wenn der Bau fehlt — eine Schleife über beide Namen,
  // die Meldung steht als Vorlage im Quelltext.
  assert.match(quelle, /ausgabe\/site\/\$\{datei\} fehlt/, 'kein Abbruch, wenn der Bau fehlt');
  assert.match(quelle, /for \(const datei of \['robots\.txt', 'llms\.txt'\]\)/,
    'die Abbruchprüfung deckt nicht beide Dateien');
});

test('der Probelauf schreibt nichts und benennt die Lücken', () => {
  // Die frühere Fassung prüfte „0 veröffentlichbar, 9 zurückgehalten". Das
  // war die Zahl des Radon-Platzhalterkatalogs und brach, sobald das
  // Werkzeug den echten Katalog bekam — obwohl die Zusicherung selbst
  // („es geht nichts hinaus, was nicht hinausgehen darf") unverletzt war.
  // Geprüft wird deshalb die Eigenschaft, nicht der Zählerstand.
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8', env: { ...process.env, SHOP_NAME: '', SHOP_BEZIRKE: '' } });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /Einreichbar: nein/, 'ohne GTIN ist nichts einreichbar');
  assert.match(lauf.stdout, /Liefergebiet: Perg/, 'das Gebiet kommt aus der Entscheidung, nicht aus der Umgebung');
  assert.match(lauf.stdout, /Vorbehalt/, 'und trägt den Vorbehalt mit');
  assert.match(lauf.stdout, /Probelauf/);
  assert.equal(existsSync(zielordner), false, 'es entsteht kein Ausgabeordner');
});

test('der Firmenname kommt aus den Betreiberdaten, nicht mehr aus der Umgebung', () => {
  // Seit dem 26. August steht er in data/betreiber.json. Zwei Quellen für
  // denselben Namen sind eine zu viel — die Entität braucht überall
  // dieselbe Schreibweise.
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8', env: { ...process.env, SHOP_NAME: '', SHOP_BEZIRKE: '' } });
  assert.ok(!lauf.stdout.includes('Firmenname (SHOP_NAME)'), 'die Firmenlücke ist geschlossen');
});

test('mit --schreiben bricht es ab, solange der Feed nicht einreichbar ist', () => {
  // Bis zum 26. August hing der Abbruch allein an den Firmenangaben. Seit die
  // aus betreiber.json kommen und das Liefergebiet entschieden ist, wäre die
  // Sperre leergelaufen — und hätte einen Feed geschrieben, den die Plattform
  // als Ganzes ablehnt.
  const lauf = spawnSync(process.execPath, [werkzeug, '--schreiben'], {
    encoding: 'utf8',
    env: { ...process.env, SHOP_NAME: '', SHOP_BEZIRKE: '' },
  });
  assert.equal(lauf.status, 1, 'Abbruch statt halber Veröffentlichung');
  assert.match(lauf.stderr, /Es wird nichts veröffentlicht/);
  assert.match(lauf.stderr, /nicht einreichbar/, 'der Grund ist der Feed, nicht mehr die Firmenangabe');
  assert.equal(existsSync(zielordner), false, 'auch hier entsteht nichts');
});

test('auch mit vollständigen Firmendaten bleibt der Feed nicht einreichbar', () => {
  // Die Sperre hängt an den Daten, nicht an den Firmenangaben. Früher war
  // es die Preissperre (alle Preise Platzhalter); heute sind die Preise
  // bestätigt, und es ist die fehlende GTIN. Die Zusicherung ist dieselbe:
  // Vollständige Firmendaten machen einen unvollständigen Feed nicht
  // einreichbar.
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SHOP_NAME: 'Muster e.U.', SHOP_BEZIRKE: 'Ried im Innkreis, Schärding' },
  });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /GTIN/, 'die fehlende Artikelkennung wird benannt');
  assert.match(lauf.stdout, /Einreichbar: nein/);
  assert.ok(!lauf.stdout.includes('Es fehlen Angaben'), 'die Firmenlücken sind geschlossen');
});

test('Gate 22 hält die Beipackartikel aus dem Feed', () => {
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SHOP_NAME: 'Muster e.U.', SHOP_BEZIRKE: 'Perg' },
  });
  assert.match(lauf.stdout, /Gate 22/, 'der Grund wird genannt, nicht nur die Zahl');
});

test('Eine abweichende SHOP_BEZIRKE-Einstellung wird gemeldet, nicht befolgt', () => {
  // Das Liefergebiet stand an drei Stellen und an keiner verbindlich: als
  // Zeichenkette in einer Anzeigenzeile, als Umgebungsvariable beim Feedbau,
  // und im Rechenkern gar nicht. Jetzt gilt die Entscheidung — eine
  // abweichende Einstellung ist ein Befund, keine Konfiguration.
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SHOP_BEZIRKE: 'Ried im Innkreis, Schärding' },
  });
  assert.match(lauf.stdout, /Widerspruch zwischen Einstellung und Entscheidung/);
  assert.match(lauf.stdout, /Liefergebiet: Perg/, 'ausgerufen wird die Entscheidung');
  assert.ok(!/Liefergebiet: Ried im Innkreis/.test(lauf.stdout));
});

/* ------------------------------------------------------------------ *
 * Der Rückfall auf den Platzhalterkatalog — der Zustand einer frischen
 * Arbeitskopie, und bis zum 31.08. der einzige ungeprüfte Zweig
 * ------------------------------------------------------------------ */

/**
 * `preise/` liegt außerhalb des Repositories. Wer klont, hat die Datei
 * **nicht** — der Rückfall auf `data/artikel.json` ist damit nicht der
 * Ausnahmefall, sondern der Normalfall jeder frischen Arbeitskopie. Geprüft
 * war er trotzdem nie: Jede bisherige Probe lief in der einen Lage, in der er
 * nicht greift.
 *
 * Der Dateikopf verspricht ausdrücklich, das Werkzeug „meldet das" und tue
 * „nichts Falsches". Beides steht ab hier unter Probe.
 */
const ohnePreise = (...argumente) => spawnSync(
  process.execPath, [werkzeug, ...argumente],
  {
    encoding: 'utf8',
    env: {
      ...process.env,
      VEROEFFENTLICHUNG_PREISE: '/nicht/vorhanden/baustoff-preise.json',
      SHOP_NAME: '', SHOP_BEZIRKE: '',
    },
  },
);

test('Ohne Preisdatei sagt das Werkzeug, dass es den Platzhalterkatalog vor sich hat', () => {
  const lauf = ohnePreise();
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.match(lauf.stdout, /Radon-Platzhalterkatalog/);
  assert.match(lauf.stdout, /die Preisdatei des Baustoffkatalogs fehlt/);
  // Und es gibt sich nicht als der echte aus.
  assert.ok(!/Baustoffkatalog aus den Lieferantenrechnungen/.test(lauf.stdout),
    'das Werkzeug nennt den Rückfall wie den echten Katalog');
});

test('Aus dem Platzhalterkatalog wird kein einziger Eintrag veröffentlichbar', () => {
  // Die Sperre, auf die sich der Dateikopf beruft: Platzhalterpreise werden
  // zurückgehalten. Ohne diesen Fall stünde die Behauptung „es tut dann
  // nichts Falsches" ungeprüft da.
  const lauf = ohnePreise();
  assert.match(lauf.stdout, /Feed:\s+0 veröffentlichbar, \d+ zurückgehalten/);
  assert.match(lauf.stdout, /Einkaufspreis ist Platzhalter/);
  assert.match(lauf.stdout, /Einreichbar: nein/);
});

test('Auch im Rückfall wird mit --schreiben nichts geschrieben', () => {
  const lauf = ohnePreise('--schreiben');
  assert.equal(lauf.status, 1, 'der Abbruch muss sich auch im Ausgangscode zeigen');
  // Auf **stderr**, nicht auf stdout. Dieselbe Unterscheidung, die zwei Tage
  // zuvor `pruefe-pruefer` in die Irre geführt hat: Der Bericht geht nach
  // stdout, die Weigerung nach stderr. Wer nur einen Strom liest, sieht
  // entweder den Grund nicht oder den Bericht nicht.
  assert.match(lauf.stderr, /Abbruch: Es wird nichts veröffentlicht/);
  assert.ok(!/Abbruch/.test(lauf.stdout), 'der Abbruch steht doppelt da');
});

test('Mit Preisdatei bleibt es beim echten Katalog', () => {
  // Gegenrichtung: Der Rückfall darf nicht der neue Normalfall werden. Ohne
  // die Preisdatei sagt diese Probe nichts — dann prüft sie es auch nicht.
  const preisPfad = fileURLToPath(new URL('../../preise/baustoff-preise.json', import.meta.url));
  if (!existsSync(preisPfad)) return;
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8', env: { ...process.env, SHOP_NAME: '', SHOP_BEZIRKE: '' },
  });
  assert.match(lauf.stdout, /Baustoffkatalog aus den Lieferantenrechnungen/);
  assert.ok(!/Radon-Platzhalterkatalog/.test(lauf.stdout));
});
