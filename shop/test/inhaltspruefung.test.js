import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pruefeAbsatz, pruefeInhalt, inAbsaetze, GRENZWOERTER, ohneKopfblock, kopffelder, schneideQuelltext } from '../src/inhaltspruefung.js';

const absatz = (text) => ({ text, zeile: 1 });
const verdachtVon = (text) => pruefeAbsatz(absatz(text)).join(' | ');

test('eine Zahl mit Einheit braucht eine Quelle', () => {
  assert.match(verdachtVon('Der Verbrauch liegt bei 1,2 kg/m².'), /Zahl ohne Quelle/);
  assert.equal(
    verdachtVon('Der Verbrauch liegt bei 1,2 kg/m² — Quelle: [Merkblatt](https://x.at/m.pdf), Stand: 2026-08.'),
    '',
    'mit Quelle und Stand schweigt der Prüfer',
  );
});

test('ein Normbezug ohne Nummer wird gemeldet — auch der mit Umlaut', () => {
  // Der Umlaut ist der eigentliche Prüfpunkt: JavaScripts \b kennt „Ö" nicht
  // als Wortzeichen, weshalb die erste Fassung ÖNORM nie traf.
  assert.match(verdachtVon('Verarbeitung nach ÖNORM und sorgfältig.'), /ÖNORM.*ohne Nummer/);
  assert.match(verdachtVon('Verarbeitung nach DIN und EN gearbeitet.'), /DIN.*ohne Nummer/);
  assert.equal(verdachtVon('Verarbeitung nach ÖNORM B 3346, Ausgabe 2020.'), '', 'mit Nummer ist es belegt');
});

test('die Grenzen aus dem Prüfteam-Konzept werden erkannt', () => {
  assert.ok(GRENZWOERTER.length >= 4, 'die Grenzwortliste ist gefüllt');
  assert.match(verdachtVon('Radon ist gesundheitlich bedenklich.'), /Gesundheitsaussage/);
  assert.match(verdachtVon('Unsere Ausführung ist rechtssicher.'), /Rechtsauskunft/);
  assert.match(verdachtVon('Wir garantieren die Dichtheit.'), /Erfolgszusage/);
  assert.match(verdachtVon('Ihr Keller bleibt dauerhaft trocken.'), /Erfolgszusage/);
});

test('ein Preis braucht netto/brutto und einen Stand', () => {
  const ohne = verdachtVon('Der Sack kostet 12,90 €.');
  assert.match(ohne, /netto\/brutto/);
  assert.match(ohne, /ohne Stand/);
  assert.equal(verdachtVon('Der Sack kostet 12,90 € netto, Stand: 2026-08-22.'), '');
});

test('ein Blockzitat ohne Quelle ist fremder Text ohne Beleg', () => {
  assert.match(verdachtVon('> Spachtelmasse trägt man zweilagig auf.'), /Zitat ohne Quellenangabe/);
  assert.equal(
    verdachtVon('> Spachtelmasse trägt man zweilagig auf.\n> — Quelle: [Merkblatt](https://x.at/m.pdf)'),
    '',
  );
});

test('Überschriften und begründete Ausnahmen bleiben stumm', () => {
  assert.equal(verdachtVon('## Verbrauch je m² bei 2 mm Schichtdicke'), '', 'Überschriften tragen keine Behauptung');
  assert.equal(
    verdachtVon('<!-- pruefung: begruendet — Beispielsatz -->\nHier stünden 42 kg/m².'),
    '',
    'die aufgeschriebene Ausnahme wird geachtet',
  );
});

test('die Probedatei im Repo löst genau die erwarteten Verdachtsfälle aus', () => {
  const pfad = fileURLToPath(new URL('../inhalte/probe/probe.md', import.meta.url));
  const ergebnis = pruefeInhalt(readFileSync(pfad, 'utf8'), 'probe.md');
  assert.ok(ergebnis.absaetze >= 10, 'die Probedatei ist gefüllt');
  assert.equal(ergebnis.treffer.length, 7, 'sieben fehlerhafte Absätze, die sauberen bleiben stumm');
  const alle = ergebnis.treffer.flatMap((t) => t.verdacht).join(' | ');
  for (const muster of [/Zahl ohne Quelle/, /ohne Nummer/, /Gesundheitsaussage/, /Erfolgszusage/, /netto\/brutto/, /Zitat ohne Quellenangabe/, /Geltungsaussage/]) {
    assert.match(alle, muster);
  }
});

test('mit --probe läuft das Werkzeug über die Probedatei und meldet, ohne zu urteilen', () => {
  const werkzeug = fileURLToPath(new URL('../bin/inhaltspruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug, '--probe'], { encoding: 'utf8' });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /7 mit Verdacht/);
  assert.match(lauf.stdout, /nicht automatisch zu beheben/);
  assert.match(lauf.stdout, /ersetzt dieses Werkzeug nicht/, 'das Werkzeug benennt seine eigene Grenze');
});

test('ohne Argument prüft das Werkzeug den Bestand, nicht die Probedatei', () => {
  // Bis zum 27.08. zeigte die Voreinstellung auf die Probedatei. `npm run
  // pruefe-inhalte` meldete „1 Dateien, 15 Absätze" und sah aus wie ein
  // Durchlauf über den Shop. Ein Prüfer, dessen Voreinstellung nicht auf den
  // Bestand zeigt, wird mit der Voreinstellung aufgerufen.
  const werkzeug = fileURLToPath(new URL('../bin/inhaltspruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.equal(lauf.status, 0);
  const zahl = Number((lauf.stdout.match(/(\d+) Dateien/) ?? [])[1] ?? 0);
  assert.ok(zahl >= 20, `nur ${zahl} Dateien geprüft — die Voreinstellung zeigt nicht auf den Bestand`);
  assert.match(lauf.stdout, /0 mit Verdacht/, 'der eigene Bestand ist sauber');
});

test('mit --seiten prüft das Werkzeug die gebauten Seiten', () => {
  // Rund die Hälfte des Textes im Shop steht im Seitenbauwerkzeug, nicht in
  // inhalte/, und war nie durch die Regeln gelaufen.
  const werkzeug = fileURLToPath(new URL('../bin/inhaltspruefung.mjs', import.meta.url));
  const gebaut = fileURLToPath(new URL('../ausgabe/site', import.meta.url));
  if (!existsSync(gebaut)) return; // ohne Bau nichts zu prüfen
  const lauf = spawnSync(process.execPath, [werkzeug, '--seiten'], { encoding: 'utf8' });
  assert.equal(lauf.status, 0);
  const absaetze = Number((lauf.stdout.match(/(\d+) Fließtextabsätze/) ?? [])[1] ?? 0);
  assert.ok(absaetze >= 100, `nur ${absaetze} Absätze — die Seitenprüfung greift nicht`);
  assert.match(lauf.stdout, /0 mit Verdacht/);
});

test('ein unlesbarer Ordner gibt eine Meldung, keinen Stacktrace', () => {
  const werkzeug = fileURLToPath(new URL('../bin/inhaltspruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug, '/gibt/es/nicht'], { encoding: 'utf8' });
  assert.equal(lauf.status, 2);
  assert.match(lauf.stderr, /nicht lesbar/);
  assert.ok(!lauf.stderr.includes('at '), 'kein Stacktrace');
});

test('Absätze werden mit brauchbarer Zeilennummer zerlegt', () => {
  const teile = inAbsaetze('Erster Absatz.\n\nZweiter Absatz.\n\nDritter.');
  assert.equal(teile.length, 3);
  assert.equal(teile[0].zeile, 1);
  assert.ok(teile[1].zeile > teile[0].zeile, 'die Zeilennummer wächst');
});

// --- Kopfblock ------------------------------------------------------------
// Metadaten sind keine Behauptungen. Der Prüfer schlug auf jeder Seite an,
// deren Titel eine Menge nennt („Mengen für 100 m² Fassade") — und ein
// Prüfer, der überall anschlägt, wird abgeschaltet statt befolgt.

test('Der Kopfblock wird nicht als Aussage geprüft', () => {
  const text = '---\ntitel: Mengen für 100 m² Fassade\nstand: 2026-08-25\n---\n\nEin harmloser Satz.\n';
  const e = pruefeInhalt(text, 'probe.md');
  assert.equal(e.sauber, true, `unerwarteter Verdacht: ${JSON.stringify(e.treffer)}`);
});

test('Nach dem Kopfblock stimmen die Zeilennummern noch', () => {
  // Der Kopf wird durch Leerzeilen ersetzt, nicht entfernt — sonst zeigt
  // jeder Treffer auf die falsche Zeile, und das ist schlimmer als kein
  // Treffer: Es schickt den Prüfenden an die falsche Stelle.
  //
  // Geprüft wird gegen die **abgezählte** Zeile, nicht gegen einen zweiten
  // Lauf desselben Codes. Die frühere Fassung dieses Testfalls verglich mit
  // einem von Hand nachgebauten Text — beide Seiten liefen durch dieselbe
  // fehlerhafte Zählung und waren deshalb einig, obwohl beide danebenlagen.
  const kopf = '---\ntitel: Probe\nstand: 2026-08-25\n---\n';
  const text = `${kopf}\nEine Wand ist 5 m² groß.\n`;
  const erwartet = text.split('\n').indexOf('Eine Wand ist 5 m² groß.') + 1;
  const e = pruefeInhalt(text, 'a.md');
  assert.equal(e.sauber, false);
  assert.equal(e.treffer[0].zeile, erwartet, `erwartet Zeile ${erwartet}`);
});

test('Auch ein langer Kopfblock verschiebt die Zeilennummer nicht', () => {
  // Der Fehler, der das ausgelöst hat: `split(/\n\s*\n/)` fasst mehrere
  // Leerzeilen zu einem Trenner zusammen, das Weiterzählen unterstellte
  // aber genau eine. Je länger der Kopf, desto größer der Versatz — bei
  // einer echten Inhaltsdatei neun Zeilen.
  const kopf = `---\n${Array.from({ length: 9 }, (_, i) => `feld${i}: wert`).join('\n')}\n---\n`;
  const text = `${kopf}\n# Überschrift\n\nEin harmloser Satz.\n\nEine Wand ist 5 m² groß.\n`;
  const erwartet = text.split('\n').indexOf('Eine Wand ist 5 m² groß.') + 1;
  const e = pruefeInhalt(text, 'a.md');
  assert.equal(e.treffer[0].zeile, erwartet, `erwartet Zeile ${erwartet}`);
});

test('Die gemeldete Zeile trifft die echte Datei', () => {
  // Die Gegenprobe am Bestand: Was der Prüfer meldet, muss man aufschlagen
  // können. Gefunden wurde der Zählfehler genau so — eine neue Regel schlug
  // an, die Zeile wurde nachgeschlagen, und dort stand etwas anderes.
  const pfad = fileURLToPath(new URL('../inhalte/wissen/kaminzug-aufbau.md', import.meta.url));
  const text = readFileSync(pfad, 'utf8');
  const zeilen = text.split('\n');
  for (const t of pruefeInhalt(text, 'kaminzug-aufbau.md').treffer) {
    const dort = zeilen[t.zeile - 1] ?? '';
    assert.ok(dort.trim().length > 0, `Zeile ${t.zeile} ist leer, der Treffer zeigt ins Nichts`);
    assert.ok(
      t.auszug.startsWith(dort.trim().slice(0, 20)),
      `Zeile ${t.zeile} lautet „${dort.trim().slice(0, 40)}", gemeldet wurde „${t.auszug.slice(0, 40)}"`,
    );
  }
});

test('Ohne Kopfblock bleibt der Text unverändert', () => {
  const text = 'Kein Kopf hier.\n\nZweiter Absatz.\n';
  assert.equal(ohneKopfblock(text), text);
});

test('Ein Trennstrich mitten im Text ist kein Kopfblock', () => {
  const text = 'Erster Absatz.\n\n---\nnicht: metadaten\n---\n\nZweiter.\n';
  assert.equal(ohneKopfblock(text), text);
});

// --- Geltungsaussagen -----------------------------------------------------
// Der blinde Fleck aller übrigen Regeln: Sie hängen an einer Zahl, einer
// Normnummer oder einem Grenzwort. „Ein WDVS wird als System zugelassen"
// hat nichts davon — und ist die tragende Verkaufsaussage der Systemlisten.

test('Eine Aussage über Zulassung ohne Fundstelle wird gemeldet', () => {
  const e = pruefeAbsatz({ text: 'Ein WDVS wird als System geprüft und zugelassen.' });
  assert.equal(e.length, 1);
  assert.match(e[0], /Geltungsaussage/);
  assert.match(e[0], /zugelassen/);
});

test('Mit Fundstelle schweigt die Regel', () => {
  const e = pruefeAbsatz({
    text: 'Ein WDVS wird als System zugelassen — siehe [Systemunterlagen](https://example.at/s.pdf).',
  });
  assert.deepEqual(e, []);
});

test('Jedes Geltungswort wird einmal gemeldet, nicht je Vorkommen', () => {
  // „zugelassen … die Zulassung …" ist ein Verdacht, nicht drei. Ein Prüfer,
  // der denselben Absatz mehrfach anzeigt, wird überblättert.
  const e = pruefeAbsatz({ text: 'Zugelassen ist das System; die Zulassung gilt, weil zugelassen wurde.' });
  assert.equal(e.length, 1);
  const gemeldet = /Fundstelle: ([^—]+)—/.exec(e[0])[1].trim();
  assert.equal(gemeldet, 'Zugelassen, Zulassung', 'zwei verschiedene Wörter, jedes einmal');
});

test('„haftet" und „Haftung" sind im Baustofftext physikalisch', () => {
  // Beide Wörter standen im ersten Entwurf der Regel und meldeten am echten
  // Bestand ausschließlich Fehltreffer: Der Putzgrund stellt die Haftung
  // her, die Abdichtung haftet an der Wand. Ein Prüfer, der bei jeder
  // Verarbeitungsbeschreibung anschlägt, wird abgeschaltet statt befolgt.
  assert.deepEqual(pruefeAbsatz({ text: 'Der Putzgrund stellt die Haftung her, damit der Oberputz haftet.' }), []);
});

test('„zulässig" allein löst nichts aus', () => {
  // Es steht in diesen Texten fast immer dort, wo die Seite eine Frage
  // korrekt an die Bauordnung weiterreicht, statt sie selbst zu beantworten.
  assert.deepEqual(pruefeAbsatz({ text: 'Was im konkreten Fall zulässig ist, regelt die Bauordnung des Landes.' }), []);
});

// --- Kopfblock: zwei Felder sind Fließtext ---------------------------------
// `kurz` und `frage` sind keine Metadaten. Sie werden als Beschreibung der
// Seite ausgegeben — Kachel, Meta-Beschreibung, JSON-LD, llms.txt. Die
// Aussage stand damit ausgerechnet dort ungeprüft, wo maschinelle Leser sie
// abholen.

test('Fließtextfelder des Kopfblocks werden geprüft', () => {
  const text = '---\ntitel: Probe\nkurz: Die Komponenten sind als System geprüft und zugelassen.\n---\n\nEin harmloser Satz.\n';
  const e = pruefeInhalt(text, 'a.md');
  assert.equal(e.sauber, false, 'die Aussage im Kopf wird gefunden');
  assert.match(e.treffer[0].verdacht.join(' '), /Geltungsaussage/);
  assert.match(e.treffer[0].auszug, /^kurz: /, 'die Meldung sagt, in welchem Feld es steht');
  assert.equal(e.treffer[0].zeile, 3, 'und in welcher Zeile');
});

test('Titel und Kennungen bleiben ungeprüft', () => {
  // Der Grund für die Ausnahme des Kopfblocks gilt weiter: Ein Prüfer, der
  // bei „Mengen für 100 m² Fassade" anschlägt, wird abgeschaltet.
  const text = '---\ntitel: Mengen für 100 m² Fassade\nslug: mengen\nstand: 2026-08-26\n---\n\nEin harmloser Satz.\n';
  assert.equal(pruefeInhalt(text, 'a.md').sauber, true);
});

test('Kopffelder werden mit ihrer echten Zeile gelesen', () => {
  const felder = kopffelder('---\ntitel: T\nfrage: Ist das so?\nslug: s\nkurz: Kurz.\n---\n\nText.\n');
  assert.deepEqual(felder.map((f) => f.feld), ['frage', 'kurz']);
  assert.deepEqual(felder.map((f) => f.zeile), [3, 5]);
});

test('Treffer aus Kopf und Körper stehen in einer Reihenfolge', () => {
  const text = '---\ntitel: T\nkurz: Der Sack kostet 12,90 €.\n---\n\nWir garantieren einen dauerhaft trockenen Keller.\n';
  const e = pruefeInhalt(text, 'a.md');
  assert.equal(e.treffer.length, 2);
  assert.ok(e.treffer[0].zeile < e.treffer[1].zeile, 'aufsteigend, damit man die Datei einmal durchgeht');
});

test('Der Bestand ist auch im Kopfblock sauber', () => {
  // Die Gegenprobe, die den Fund überhaupt ausgelöst hat: Nach dem
  // Umschreiben der Fließtexte stand die alte Aussage noch in drei
  // Kopfblöcken — und genau die werden veröffentlicht.
  const wurzel = fileURLToPath(new URL('../inhalte/', import.meta.url));
  const offen = [];
  for (const art of ['wissen', 'gruppen', 'system']) {
    for (const datei of readdirSync(`${wurzel}${art}`).filter((d) => d.endsWith('.md'))) {
      const e = pruefeInhalt(readFileSync(`${wurzel}${art}/${datei}`, 'utf8'), datei);
      for (const t of e.treffer) if (t.auszug.startsWith('kurz:') || t.auszug.startsWith('frage:')) {
        offen.push(`${art}/${datei}:${t.zeile} ${t.verdacht.join('; ')}`);
      }
    }
  }
  assert.deepEqual(offen, []);
});

/* ------------------------------------------------------------------ *
 * Die Einheit endet, wo das Wort weitergeht
 * ------------------------------------------------------------------ */

test('eine Zahl vor einem Wort ist keine Zahl mit Einheit', () => {
  // „3 Lagen" ist kein Maß, „3 l" schon. Ohne Wortgrenze las die Regel das
  // erste als das zweite und verlangte eine Quelle für eine Aufzählung.
  assert.equal(verdachtVon('Schraffiert sind die 3 Lagen, die wir nicht führen.'), '');
  assert.equal(verdachtVon('Das Haus hat 5 Hauswände.'), '');
  assert.equal(verdachtVon('Wir haben 12 Monteure im Einsatz.'), '');
  assert.equal(verdachtVon('Die Liste nennt 7 Stück in 4 Schritten.'), '');
});

test('die echte Einheit wird weiterhin verlangt', () => {
  // Die Gegenprobe zur Wortgrenze: Sie darf die Regel nicht stumm machen.
  for (const satz of [
    'Der Sack wiegt 25 kg.',
    'Die Dose fasst 750 l.',
    'Der Verbrauch liegt bei 5 kg je Fläche.',
    'Das kostet 30 €.',
    'Die Verarbeitung braucht 5 °C.',
    'Die Bahn ist 50 cm breit.',
  ]) {
    assert.match(verdachtVon(satz), /Zahl ohne Quelle/, `„${satz}" wird nicht mehr bemängelt`);
  }
});

/* ------------------------------------------------------------------ *
 * Quelltextmarken
 * ------------------------------------------------------------------ */

test('der Text aus der Quelle wird herausgeschnitten, der eigene bleibt', () => {
  const { text, fehler } = schneideQuelltext(
    '<p>eigen A</p><!--quelltext--><p>aus der Quelle</p><!--/quelltext--><p>eigen B</p>',
  );
  assert.equal(fehler, null);
  assert.equal(text, '<p>eigen A</p><p>eigen B</p>');
});

test('mehrere Klammern auf einer Seite werden alle entfernt', () => {
  const { text } = schneideQuelltext(
    '<!--quelltext-->A<!--/quelltext-->M<!--quelltext-->B<!--/quelltext-->E',
  );
  assert.equal(text, 'ME');
});

test('eine unpaarige Marke ist ein Fehler und kein Sonderfall', () => {
  // Sonst liest der Prüfer stillschweigend zu viel oder zu wenig — und ein
  // Prüfer, der falsch liest, meldet nichts und wirkt dabei ruhig.
  const auf = schneideQuelltext('<!--quelltext-->A');
  assert.match(auf.fehler, /1 öffnende, 0 schließende/);
  const zu = schneideQuelltext('A<!--/quelltext-->');
  assert.match(zu.fehler, /0 öffnende, 1 schließende/);
  assert.equal(schneideQuelltext('<p>ohne Marken</p>').fehler, null);
});
