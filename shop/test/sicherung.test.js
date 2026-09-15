import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  BEREICHE, sichere, staende, zeitstempel, SICHERUNGSTIEFE,
} from '../src/sicherung.js';
import { wegwerfordner } from '../src/wegwerf.js';

/**
 * **Anlass ist der Vorfall vom 30.08.:** Ein Lauf mit halb umgelenkten
 * Zielen hat die vertrauliche Preisdatei geleert. Sie ließ sich aus ihrer
 * Quelle neu erzeugen — was nur ging, weil sie abgeleitet und nicht gepflegt
 * wird. Für gepflegte Angaben gibt es dieses Netz nicht, und genau die
 * liefert der Auftraggeber demnächst.
 */

const ordner = () => wegwerfordner('sicherung-');
const werkzeug = fileURLToPath(new URL('../bin/sicherung.mjs', import.meta.url));

test('was es noch nicht gibt, wird nicht gesichert', () => {
  // Kein leerer Stand, keine Datei „von nichts": Wo nichts steht, geht auch
  // nichts verloren.
  const o = ordner();
  assert.equal(sichere(join(o, 'fehlt.json')), null);
  assert.equal(existsSync(join(o, '.sicherung')), false);
});

test('vor dem Überschreiben liegt eine datierte Kopie daneben', () => {
  const o = ordner();
  const datei = join(o, 'preise.json');
  writeFileSync(datei, '{"a":1}');
  const kopie = sichere(datei, new Date('2026-08-30T15:42:07Z'));
  assert.match(kopie, /\.sicherung[/\\]preise-2026-08-30T15-42-07\.json$/);
  assert.equal(readFileSync(kopie, 'utf8'), '{"a":1}');
  // Und das Original ist unangetastet — gesichert wird kopiert, nicht
  // verschoben.
  assert.equal(readFileSync(datei, 'utf8'), '{"a":1}');
});

test('der Zeitstempel sortiert sich von selbst', () => {
  // Die Reihenfolge der Stände ergibt sich aus dem Namen; ohne das müsste
  // der Aufräumer Dateizeiten lesen und läge nach einem Kopiervorgang falsch.
  const frueh = zeitstempel(new Date('2026-08-30T09:00:00Z'));
  const spaet = zeitstempel(new Date('2026-08-30T15:42:07Z'));
  assert.ok(frueh < spaet);
  assert.ok(!/:/.test(spaet), 'Doppelpunkte ärgern Dateisysteme');
});

test('es bleiben zehn Stände, der älteste fällt', () => {
  const o = ordner();
  const datei = join(o, 'preise.json');
  for (let i = 0; i < SICHERUNGSTIEFE + 2; i++) {
    writeFileSync(datei, `{"lauf":${i}}`);
    sichere(datei, new Date(Date.UTC(2026, 7, 30, 9, i, 0)));
  }
  const vorhanden = staende(datei);
  assert.equal(vorhanden.length, SICHERUNGSTIEFE, `${vorhanden.length} Stände statt ${SICHERUNGSTIEFE}`);
  assert.equal(readFileSync(vorhanden.at(-1), 'utf8'), `{"lauf":${SICHERUNGSTIEFE + 1}}`);
  assert.equal(readFileSync(vorhanden[0], 'utf8'), '{"lauf":2}');
});

test('der Aufräumer fasst nur an, was er selbst angelegt hat', () => {
  // **Die gefährlichere Richtung.** Ein Aufräumer, der nach lockerem Muster
  // löscht, ist schlimmer als das Volllaufen, das er verhindert. Geprüft mit
  // Nachbarn, die ähnlich heißen.
  const o = ordner();
  const datei = join(o, 'preise.json');
  writeFileSync(datei, '{}');
  sichere(datei, new Date('2026-08-30T09:00:00Z'));
  const sicherungsordner = join(o, '.sicherung');
  const fremde = ['preise-von-hand.json', 'preise.json', 'andere-2026-08-30T09-00-00.json', 'notiz.txt'];
  for (const f of fremde) writeFileSync(join(sicherungsordner, f), 'fremd');
  for (let i = 1; i <= SICHERUNGSTIEFE + 3; i++) {
    sichere(datei, new Date(Date.UTC(2026, 7, 30, 10, i, 0)));
  }
  assert.ok(fremde.length >= 4, 'zu wenige Nachbarn für eine Aussage');
  for (const f of fremde) {
    assert.ok(existsSync(join(sicherungsordner, f)), `${f} wurde weggeräumt`);
  }
  assert.equal(staende(datei).length, SICHERUNGSTIEFE);
  assert.ok(readdirSync(sicherungsordner).length >= SICHERUNGSTIEFE + fremde.length);
});

/* ------------------------------------------------------------------ *
 * Das Werkzeug für den Tag der Lieferung
 * ------------------------------------------------------------------ */

test('npm run sicherung kopiert jede Datei des Ordners', () => {
  const o = ordner();
  for (const name of ['preise.json', 'positionen.csv', 'notiz.txt']) {
    writeFileSync(join(o, name), `Inhalt ${name}`);
  }
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SICHERUNG_ORDNER: o },
  });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.match(lauf.stdout, /3 Datei\(en\)/);
  for (const name of ['preise.json', 'positionen.csv', 'notiz.txt']) {
    assert.equal(staende(join(o, name)).length, 1, `${name} hat keinen Stand`);
  }
});

test('eine Sicherung von nichts wird als Fehler gemeldet', () => {
  // Sonst meldet ein leerer Ordner „Sicherung: 0 Dateien" und sieht aus wie
  // eine erledigte Sicherung — genau der Fehler, den der Katalogerzeuger
  // heute früh mit „Artikel im Katalog: 0" vorgemacht hat.
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SICHERUNG_ORDNER: ordner() },
  });
  assert.equal(lauf.status, 2);
  // **Seit dem 12. September sagt es der Schlusssatz**, nicht die Zeile über
  // den einen Ordner: Das Werkzeug sieht mehrere Bereiche an, und leer ist
  // erst, wenn keiner davon eine Datei hergegeben hat.
  assert.match(`${lauf.stdout}${lauf.stderr}`, /ist leer|Kein Bereich hat eine Datei hergegeben/);
  assert.match(lauf.stderr, /sieht aus wie eine Sicherung/);
});


/* ------------------------------------------------------------------ *
 * Die Vorgangsakte (12. September 2026)
 *
 * Bis heute sicherte dieses Werkzeug `preise/` — und nur die oberste Ebene.
 * ------------------------------------------------------------------ */

test('Die Bereiche nennen jeden Ordner mit Grund, und die Akte ist dabei', () => {
  assert.ok(BEREICHE.length >= 2, `nur ${BEREICHE.length} Bereich(e)`);
  for (const b of BEREICHE) {
    assert.ok(b.ordner && b.was, `${b.ordner}: Ordner oder Bezeichnung fehlt`);
    assert.ok((b.warum ?? '').length >= 80, `${b.ordner}: der Grund ist zu knapp`);
  }
  /*
   * **Der Fund dieser Runde.** Die Begründung dieses Moduls lautet: „Eine
   * Datei, die sich aus ihrer Quelle neu erzeugen lässt, kann man verlieren.
   * Eine gepflegte Datei nicht." Die Vorgangsakte ist weder erzeugt noch
   * gepflegt — sie ist **aufgezeichnet**, und § 132 BAO verlangt sie sieben
   * Jahre.
   */
  assert.ok(BEREICHE.some((b) => b.ordner === 'ablage'),
    'die Vorgangsakte steht in keinem Sicherungsbereich');
});

test('npm run sicherung erreicht auch die Dateien in Unterordnern', () => {
  /*
   * **Der eigentliche Schaden wäre still gewesen.** Hätte jemand das alte
   * Werkzeug auf `ablage/` gerichtet, hätte es das Journal gesichert und
   * **jede Durchschrift liegen gelassen**: Die Belege liegen in
   * `belege-2026/`, der Buchhaltungsauszug in `buchhaltung/`. Eine Sicherung,
   * die nur die oberste Ebene sieht, meldet trotzdem „gesichert".
   */
  const o = ordner();
  mkdirSync(join(o, 'belege-2026'), { recursive: true });
  mkdirSync(join(o, 'buchhaltung'), { recursive: true });
  writeFileSync(join(o, 'journal-2026.jsonl'), '{"typ":"eintrag"}\n');
  writeFileSync(join(o, 'belege-2026', 'RE-2026-0001.txt'), 'Rechnung');
  writeFileSync(join(o, 'buchhaltung', 'buchhaltung-2026-09.csv'), 'lfd;art\n');

  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SICHERUNG_ORDNER: o },
  });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.match(lauf.stdout, /3 Datei\(en\)/);
  for (const pfad of [
    join(o, 'journal-2026.jsonl'),
    join(o, 'belege-2026', 'RE-2026-0001.txt'),
    join(o, 'buchhaltung', 'buchhaltung-2026-09.csv'),
  ]) {
    assert.equal(staende(pfad).length, 1, `${pfad} hat keinen Stand`);
  }
});

test('ein Bereich, den es nicht gibt, wird genannt statt übergangen', () => {
  // Vor dem ersten Geschäftsfall gibt es `ablage/` nicht. Niemand soll eine
  // Sicherung für vollständig halten, die einen Bereich gar nicht gesehen hat.
  const o = ordner();
  writeFileSync(join(o, 'eine.json'), '{}');
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SICHERUNG_ORDNER: o },
  });
  assert.match(lauf.stdout, /1 von 1 Bereich\(en\) vorhanden/);
  // Und der Satz über die Grenze dieser Sicherung steht dabei.
  assert.match(lauf.stdout, /nicht gegen\s*\n?den Verlust des Rechners|Verlust des Rechners/);
});
