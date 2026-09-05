import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WIDERRUFE, WIDERRUFSMERKMAL, SICHTWEITE, KOPFZEILEN,
  findeWiderrufe, pruefeBestand, kopfwiderruf, sichtfeld,
  BESTAENDE, AUSGENOMMEN, bestandsdateien,
} from '../src/widerruf.js';

const verzeichnis = fileURLToPath(new URL('../../docs/baustoff-shop/', import.meta.url));

test('eine widerrufene Aussage ohne Widerruf daneben wird gemeldet', () => {
  const text = [
    '# Ein Bericht',
    '',
    'Die Trennlinie verläuft entlang des Rohstoffs.',
    '',
    'Und sonst nichts.',
  ].join('\n');
  const funde = findeWiderrufe(text);
  assert.equal(funde.length, 1);
  assert.equal(funde[0].id, 'lagerhaus-rohstoff');
  assert.equal(funde[0].zeile, 3, 'die Zeile kommt aus der Fundstelle, nicht aus einem Zähler');
  assert.equal(funde[0].gedeckt, false);
});

test('dieselbe Aussage mit ihrem Widerruf daneben ist erlaubt', () => {
  const text = [
    '# Ein Bericht',
    '',
    'Die erste Fassung schrieb: die Trennlinie verläuft entlang des Rohstoffs.',
    '',
    '**Auch das hält nicht** — Planziegel stehen auf Anfrage, N+F-Ziegel nicht.',
  ].join('\n');
  const [fund] = findeWiderrufe(text);
  assert.equal(fund.gedeckt, true, 'ein Zitat mit Widerruf in Sichtweite bleibt zitierbar');
});

test('der Widerruf muss in Sichtweite stehen, nicht irgendwo in der Datei', () => {
  const weit = [
    'Die Trennlinie verläuft entlang des Rohstoffs.',
    ...Array.from({ length: SICHTWEITE + 3 }, (_, i) => `Füllzeile ${i}`),
    'Das ist widerlegt.',
  ].join('\n');
  assert.equal(findeWiderrufe(weit)[0].gedeckt, false, 'zwölf Zeilen weiter ist kein Widerruf daneben');
});

test('ein Widerruf deckt nur seine eigene Aussage', () => {
  // Der Grund für das eintragseigene Merkmal: In STATUS.md stand acht Zeilen
  // unter der alten Zuschlagsrechnung, dass *Gate 1* abgelöst wurde. Ein
  // beliebiges Berichtigungswort in der Nähe darf den Prüfer nicht beruhigen.
  const fremd = [
    'Das berührt Gate 1 (25 % Zuschlag = 20 % Rohmarge).',
    '',
    'Gate 1 ist inzwischen durch Gate 20 abgelöst.',
  ].join('\n');
  assert.equal(findeWiderrufe(fremd)[0].gedeckt, false);

  const eigen = [
    'Das berührt Gate 1 (25 % Zuschlag = 20 % Rohmarge).',
    '',
    'Gültig ist seit 25.08. die Lesart 25 % Marge.',
  ].join('\n');
  assert.equal(findeWiderrufe(eigen)[0].gedeckt, true);
});

test('ein Kopfvermerk im Zitatblock deckt die ganze Datei', () => {
  const zeilen = [
    '# Was 25 % Zuschlag bedeuten',
    '',
    '> **Überholt seit 25.08.:** gemeint ist Marge, nicht Zuschlag.',
    '',
    ...Array.from({ length: 40 }, (_, i) => `Füllzeile ${i}`),
    'Erstens: 25 % Zuschlag sind 20 % Rohmarge.',
  ];
  assert.equal(kopfwiderruf(zeilen.join('\n')), true);
  assert.equal(findeWiderrufe(zeilen.join('\n'))[0].gedeckt, true);

  const alsFliesstext = zeilen.map((z) => z.replace(/^> /, '')).join('\n');
  assert.equal(kopfwiderruf(alsFliesstext), false, 'ein Widerruf, der wie Fließtext aussieht, wird überlesen');
});

test('ein Kopfvermerk unterhalb der Kopfzeilen deckt nicht mehr', () => {
  const text = [
    '# Titel',
    ...Array.from({ length: KOPFZEILEN }, (_, i) => `Füllzeile ${i}`),
    '> **Überholt:** gemeint ist Marge.',
    '',
    'Erstens: 25 % Zuschlag sind 20 % Rohmarge.',
  ].join('\n');
  assert.equal(kopfwiderruf(text), false);
});

test('sichtfeld greift an den Rändern nicht daneben', () => {
  const text = Array.from({ length: 5 }, (_, i) => `Zeile ${i + 1}`).join('\n');
  assert.equal(sichtfeld(text, 1, 2), 'Zeile 1\nZeile 2\nZeile 3');
  assert.equal(sichtfeld(text, 5, 2), 'Zeile 3\nZeile 4\nZeile 5');
});

test('das Register ist vollständig ausgefüllt', () => {
  assert.ok(WIDERRUFE.length >= 5);
  const ids = new Set();
  for (const w of WIDERRUFE) {
    assert.ok(w.id && !ids.has(w.id), `doppelte oder fehlende Kennung: ${w.id}`);
    ids.add(w.id);
    for (const feld of ['these', 'statt', 'widerrufenAm', 'belegt']) {
      assert.ok(w[feld], `${w.id}: ${feld} fehlt`);
    }
    assert.match(w.widerrufenAm, /^\d{4}-\d{2}-\d{2}$/, `${w.id}: Datum ohne Form`);
    assert.ok(w.muster instanceof RegExp, `${w.id}: Muster fehlt`);
    assert.ok(w.muster.flags.includes('g'), `${w.id}: Muster ohne g — findet nur den ersten Treffer`);
  }
});

test('jeder Registereintrag findet seine eigene These wieder', () => {
  // Ein Muster, das die Aussage nicht mehr trifft, ist ein stiller Ausfall —
  // der Prüfer meldet dann nichts und wirkt wie ein Erfolg.
  assert.ok(WIDERRUFE.length >= 5, 'ein leeres Register würde diese Schleife stumm bestehen');
  for (const w of WIDERRUFE) {
    assert.ok(w.beispiel, `${w.id}: der ursprüngliche Wortlaut fehlt`);
    const treffer = findeWiderrufe(w.beispiel, { register: [w] });
    assert.equal(
      treffer.length, 1,
      `${w.id}: das Muster findet den widerrufenen Wortlaut nicht mehr — ein stiller Ausfall`,
    );
    assert.equal(treffer[0].gedeckt, false, `${w.id}: der blanke Wortlaut gilt als ungedeckt`);
  }
});

test('das Merkmal ist ohne g-Flag — sonst ist test() zustandsbehaftet', () => {
  assert.equal(WIDERRUFSMERKMAL.flags.includes('g'), false);
  assert.ok(WIDERRUFE.length >= 5, 'ein leeres Register würde diese Schleife stumm bestehen');
  for (const w of WIDERRUFE) {
    if (w.merkmal) assert.equal(w.merkmal.flags.includes('g'), false, `${w.id}: Merkmal mit g`);
  }
  const text = 'Das ist widerlegt.';
  assert.equal(WIDERRUFSMERKMAL.test(text), WIDERRUFSMERKMAL.test(text), 'zweimal dasselbe Ergebnis');
});

test('der eigene Bestand trägt jeden Widerruf mit', () => {
  const dateien = readdirSync(verzeichnis)
    .filter((n) => n.endsWith('.md'))
    .map((name) => ({ name, text: readFileSync(join(verzeichnis, name), 'utf8') }));
  const e = pruefeBestand(dateien);
  const offen = e.meldungen.map((m) => `${m.datei}:${m.zeile} (${m.id})`).join('\n  ');
  assert.ok(e.sauber, `widerrufene Aussagen ohne Widerruf:\n  ${offen}`);
  assert.ok(e.funde > 0, 'wenn nichts mehr gefunden wird, prüft der Prüfer nichts mehr');
});

/* ------------------------------------------------------------------ *
 * Die Reichweite des Prüfers
 * ------------------------------------------------------------------ */

/**
 * **Der Fund vom 31.08.**: Der Prüfer las nur `docs/baustoff-shop/` und war
 * grün — an einem Tag, an dem der Shop selbst an drei Stellen den am 27.08.
 * zurückgenommenen Satz trug, einer davon in einem Beitrag mit Stand
 * `2026-08-28`, also nach dem Widerruf geschrieben.
 *
 * Der Fehler war nicht das Muster und nicht das Register — beide hätten den
 * Satz gefunden. Der Fehler war, **wo hingesehen wurde**. Und weil die
 * Reichweite im Werkzeug stand, konnte keine Probe sie messen: Wer sie
 * zurückdrehte, drehte nichts rot.
 *
 * Diese Probe nennt die Bestände nicht selbst — sie prüft, dass jeder
 * genannte Bestand **erreicht** wird. Sonst wäre sie nur eine zweite Liste
 * derselben Zeilen.
 */
test('Der Prüfer liest jeden genannten Bestand, nicht nur die Akte', () => {
  const wurzel = fileURLToPath(new URL('../../', import.meta.url));
  const lies = (ordner) => readdirSync(join(wurzel, ordner), { withFileTypes: true })
    .map((e) => ({ name: e.name, verzeichnis: e.isDirectory() }));

  assert.ok(BESTAENDE.length >= 2, 'ein einziger Bestand wäre wieder die Aktenlage allein');
  const dateien = bestandsdateien(lies);
  assert.ok(dateien.length > 0, 'kein Bestand gelesen');

  for (const b of BESTAENDE) {
    const praefix = `${b.ordner.join('/')}/`;
    const treffer = dateien.filter((d) => d.startsWith(praefix));
    assert.ok(treffer.length > 0, `Bestand „${b.was}" (${praefix}) liefert keine Datei`);
  }

  // Die vier Bestände einzeln benannt, nicht über die Liste geschleift: Eine
  // Schleife über `BESTAENDE` prüft nur, dass jede genannte Zeile etwas
  // findet — nicht, dass die **richtigen** Zeilen dastehen. Wer den Aktenpfad
  // von `docs/baustoff-shop` auf `docs/archiv` umbiegt, fällt nur hier auf.
  assert.ok(dateien.some((d) => d.startsWith('docs/baustoff-shop/')), 'die Akte wird nicht gelesen');
  assert.ok(dateien.some((d) => d.startsWith('shop/inhalte/')), 'die Shoptexte werden nicht gelesen');
  assert.ok(dateien.some((d) => d === 'shop/bin/website.mjs'), 'das Bauwerkzeug wird nicht gelesen');
  assert.ok(dateien.some((d) => d === 'shop/src/liefergebiet.js'), 'der Rechenkern wird nicht gelesen');

  // Und das Register selbst bleibt draußen: Es muss den Satz führen dürfen.
  // Die Ausnahme wird **benannt** und nicht nur durchlaufen — eine leere
  // Ausnahmeliste ließe eine Schleife darüber grün durchlaufen und wäre
  // genau der Fall, den sie verhindern soll.
  assert.ok(AUSGENOMMEN.length > 0, 'ohne Ausnahme prüft die Schleife darunter nichts');
  assert.ok(!dateien.includes('shop/src/widerruf.js'),
    'das Register steht im eigenen Bestand — es meldet dann sich selbst');
  for (const t of AUSGENOMMEN) {
    assert.ok(!dateien.includes(t.join('/')), `${t.join('/')} steht im Bestand, obwohl ausgenommen`);
  }
});

/**
 * Eine Gegenprobe zur Zahl: Was das Werkzeug meldet, muss dem entsprechen,
 * was die Probe selbst abzählt. Eine Meldung, die ihre eigene Grundlage nicht
 * belegt, ist eine Behauptung — dieselbe Falle wie bei der Prüferprüfung.
 */
test('Die gemeldete Dateizahl entspricht dem abgezählten Bestand', () => {
  const wurzel = fileURLToPath(new URL('../../', import.meta.url));
  const lies = (ordner) => readdirSync(join(wurzel, ordner), { withFileTypes: true })
    .map((e) => ({ name: e.name, verzeichnis: e.isDirectory() }));
  const erwartet = bestandsdateien(lies).length;

  const lauf = spawnSync(process.execPath, [fileURLToPath(new URL('../bin/widerrufpruefung.mjs', import.meta.url))],
    { encoding: 'utf8' });
  const treffer = lauf.stdout.match(/^(\d+) Dateien,/m);
  assert.ok(treffer, `keine Dateizahl in der Ausgabe:\n${lauf.stdout}${lauf.stderr}`);
  assert.equal(Number(treffer[1]), erwartet,
    `das Werkzeug meldet ${treffer[1]} Dateien, abgezählt sind es ${erwartet}`);
  assert.equal(lauf.status, 0, `der Prüfer meldet etwas:\n${lauf.stdout}`);
});

/**
 * **Der Fund vom 01.09.:** `shop/shop-ui.js` liegt im Wurzelverzeichnis des
 * Shops und fiel durch alle vier Bestände — ausgerechnet die Datei, die im
 * Browser des Kunden läuft. Im Warenkorb stand dort seit dem 27. August der
 * zurückgenommene Satz über die Fracht auf jedem Beleg.
 *
 * Und selbst nach der Aufnahme meldete der Prüfer nichts: Das Muster kannte
 * nur die Formulierung „auf jedem **Beleg**", die Oberfläche sagte „auf jedem
 * unserer **Lieferantenbelege**".
 */
test('Die Oberfläche gehört zum Bestand, und das Muster kennt die Aussage', async () => {
  const wurzel = fileURLToPath(new URL('../../', import.meta.url));
  const lies = (ordner) => readdirSync(join(wurzel, ordner), { withFileTypes: true })
    .map((e) => ({ name: e.name, verzeichnis: e.isDirectory() }));
  const dateien = bestandsdateien(lies);

  assert.ok(dateien.includes('shop/shop-ui.js'),
    'die Oberfläche steht nicht im Bestand — sie läuft im Browser des Kunden');
  // Und der Wurzelbestand bleibt flach: node_modules und ausgabe gehören nicht
  // dazu, sonst misst der Prüfer fremden Code.
  assert.ok(!dateien.some((d) => d.includes('node_modules')), 'node_modules ist im Bestand');
  assert.ok(!dateien.some((d) => d.startsWith('shop/ausgabe/')), 'das Erzeugnis ist im Bestand');

  // Das Muster muss die **Aussage** finden, nicht eine Schreibweise.
  const fracht = WIDERRUFE.find((w) => w.id === 'fracht-auf-jedem-beleg');
  assert.ok(fracht, 'der Widerruf zur Fracht fehlt im Register');
  for (const satz of [
    'Das steht auf jedem unserer Lieferantenbelege, auch auf den großen.',
    'Die Frachtpauschale steht auf jedem Beleg.',
    'Sie steht auf allen fünfzehn Rechnungen.',
    'Der Betrag steht auf jeder Rechnung.',
  ]) {
    const muster = new RegExp(fracht.muster.source, fracht.muster.flags.replace('g', ''));
    assert.match(satz, muster, `nicht gefunden: „${satz}"`);
  }
  // Was die Aussage nicht ist, bleibt unbehelligt.
  for (const satz of ['Die Artikelnummer finden Sie oben rechts.', 'Auf jeden Fall geliefert.']) {
    const muster = new RegExp(fracht.muster.source, fracht.muster.flags.replace('g', ''));
    assert.doesNotMatch(satz, muster, `falscher Treffer: „${satz}"`);
  }
});


/* ------------------------------------------------------------------ *
 * Der Nachbareintrag deckt nichts
 *
 * Befund vom 2. September: In `STATUS.md` — einer einzigen langen Tabelle aus
 * Einträgen über verschiedene Dokumente — blieb eine überholte Zahl
 * ungemeldet, weil acht Zeilen weiter in einem **fremden** Eintrag zufällig
 * die Worte standen, die als Bedingung gelten.
 * ------------------------------------------------------------------ */

test('Eine Tabellenzeile sieht ihre Nachbarzeilen nicht', () => {
  const text = [
    'Ein Satz vor der Tabelle.',
    '',
    '| Datei | Befund |',
    '|---|---|',
    '| a.md | hier steht die Zahl |',
    '| b.md | hier steht das Wort berichtigt |',
  ].join('\n');
  const feld = sichtfeld(text, 5, 8);
  assert.ok(feld.includes('hier steht die Zahl'), 'die eigene Zeile fehlt');
  assert.ok(!feld.includes('b.md'), 'der Nachbareintrag deckt die Zeile');
});

test('Eine Tabellenzeile sieht Kopf und Einleitung ihrer Tabelle', () => {
  // Die Zeile allein wäre zu streng: In einer Rechentabelle steht die
  // Bedingung im Kopf oder im Satz davor („bei Kartenzahlung").
  const text = [
    'Gerechnet bei Kartenzahlung, Stand 25.08.',
    '',
    '| Marge | Umsatz |',
    '|---|---|',
    '| 20 % | 72.740 € |',
  ].join('\n');
  const feld = sichtfeld(text, 5, 8);
  assert.ok(feld.includes('Kartenzahlung'), 'die Einleitung der Tabelle fehlt');
  assert.ok(feld.includes('| Marge | Umsatz |'), 'der Tabellenkopf fehlt');
});

test('Fließtext sieht keine fremden Tabellenzeilen', () => {
  const text = [
    '| x | hier steht das Wort berichtigt |',
    '',
    'Hier steht die Zahl im Fließtext.',
  ].join('\n');
  const feld = sichtfeld(text, 3, 8);
  assert.ok(feld.includes('Zahl im Fließtext'));
  assert.ok(!feld.includes('berichtigt'), 'eine fremde Tabellenzeile deckt den Absatz');
});

/* ------------------------------------------------------------------ *
 * Und die gebaute Seite — 5. September 2026, abends
 *
 * `BESTAENDE` schließt `ausgabe/` mit Grund aus: Was ausgeliefert wird,
 * entsteht aus `inhalte/` und `bin/website.mjs`, und beide sind im Bestand.
 * Der Schluss ist richtig — **er war nur nie geprüft.**
 *
 * > **Ein Ausschluss mit gutem Grund ist trotzdem ein Ausschluss, und der
 * > Grund gehört gemessen, nicht geglaubt.**
 *
 * Erzeugungswege ändern sich: Seit dem 4. September trägt jede Seite Text,
 * den kein `inhalte/`-Dokument kennt, und seit heute wird ein Absatz beim
 * Zusammenbau angehängt.
 * ------------------------------------------------------------------ */

test('keine gebaute Seite trägt eine widerrufene Aussage', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const { nurText } = await import('../src/format.js');
  const wurzel = fileURLToPath(new URL('../ausgabe/site/', import.meta.url));

  const dateien = [];
  const geh = (d) => {
    for (const e of readdirSync(d)) {
      const v = `${d}${e}`;
      if (statSync(v).isDirectory()) { geh(`${v}/`); continue; }
      if (/\.(html|txt|js)$/.test(v)) dateien.push(v);
    }
  };
  geh(wurzel);
  // Ein leerer Lauf ist kein grüner.
  assert.ok(dateien.length >= 60, `nur ${dateien.length} Ausgabedateien — die Prüfung greift zu wenig`);

  const treffer = [];
  for (const d of dateien) {
    for (const fund of findeWiderrufe(nurText(readFileSync(d, 'utf8')), { sichtweite: 2, kopfzeilen: 0 })) {
      treffer.push(`${d.slice(wurzel.length)}: „${fund.fundstelle}" (${fund.eintrag.id})`);
    }
  }
  assert.deepEqual(treffer, [], 'widerrufene Aussagen auf einer ausgelieferten Seite');
});
