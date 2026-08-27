import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { istBelegt, pruefeQuelle, unabhaengig, werteRechercheAus, QUELLENARTEN } from '../src/quellen.js';

const video = (id, urheber) => ({ id, art: 'video', titel: `Video ${id}`, urheber, url: `https://y/${id}`, stand: '2025-06' });
const datenblatt = { id: 'd1', art: 'datenblatt', titel: 'Merkblatt X', urheber: 'Hersteller', stand: '2026-01' };
const norm = { id: 'n1', art: 'norm', titel: 'ÖNORM B 3346, Ausgabe 2020', urheber: 'Austrian Standards', stand: '2020' };

const verzeichnis = (...quellen) => Object.fromEntries(quellen.map((q) => [q.id, q]));

test('ein einzelnes Video belegt nichts — es zeigt nur die Richtung', () => {
  const v = verzeichnis(video('v1', 'Kanal A'));
  const e = istBelegt({ text: 'Zweilagig auftragen.', quellen: ['v1'] }, v);
  assert.equal(e.belegt, false);
  assert.match(e.gruende.join(' '), /zeigt die Richtung/);
});

test('zwei Videos desselben Kanals sind eine Quelle, nicht zwei', () => {
  const v = verzeichnis(video('v1', 'Kanal A'), video('v2', 'Kanal A'));
  const e = istBelegt({ text: 'Zweilagig auftragen.', quellen: ['v1', 'v2'] }, v);
  assert.equal(e.belegt, false, 'Wiederholung ist keine Bestätigung');
  assert.equal(e.unabhaengigeHinweise, 1);
});

test('zwei unabhängige Hinweise tragen eine Einordnung', () => {
  const v = verzeichnis(video('v1', 'Kanal A'), video('v3', 'Kanal B'));
  const e = istBelegt({ text: 'Zweilagig auftragen ist üblich.', quellen: ['v1', 'v3'] }, v);
  assert.equal(e.belegt, true);
  assert.equal(e.unabhaengigeHinweise, 2);
});

test('ein Kennwert braucht immer eine tragende Quelle — auch bei einigen Videos', () => {
  const v = verzeichnis(video('v1', 'Kanal A'), video('v3', 'Kanal B'), datenblatt);
  const ohne = istBelegt({ text: 'Verbrauch 1,2 kg/m².', kennwert: true, quellen: ['v1', 'v3'] }, v);
  assert.equal(ohne.belegt, false);
  assert.match(ohne.gruende.join(' '), /Zahlen brauchen Norm oder Datenblatt/);

  const mit = istBelegt({ text: 'Verbrauch 1,2 kg/m².', kennwert: true, quellen: ['d1'] }, v);
  assert.equal(mit.belegt, true, 'ein Datenblatt allein genügt');
});

test('eine tragende Quelle allein genügt für gewöhnliche Aussagen', () => {
  const v = verzeichnis(norm);
  assert.equal(istBelegt({ text: 'Der Untergrund muss tragfähig sein.', quellen: ['n1'] }, v).belegt, true);
});

test('eine Aussage ohne Quelle ist unbelegt und sagt das', () => {
  const e = istBelegt({ text: 'Behauptung.', quellen: [] }, {});
  assert.equal(e.belegt, false);
  assert.match(e.gruende.join(' '), /keine Quelle angegeben/);
});

test('unvollständige Quellenangaben werden einzeln benannt', () => {
  assert.equal(pruefeQuelle(norm).vollstaendig, true);
  const ohneNummer = pruefeQuelle({ art: 'norm', titel: 'ÖNORM', urheber: 'Austrian Standards', stand: '2020' });
  assert.match(ohneNummer.fehlt.join(' '), /Norm ohne Nummer/);
  const videoOhneLink = pruefeQuelle({ art: 'video', titel: 'V', urheber: 'Kanal', stand: '2025' });
  assert.match(videoOhneLink.fehlt.join(' '), /nicht nachprüfbar/);
  const ohneUrheber = pruefeQuelle({ art: 'datenblatt', titel: 'X', stand: '2026' });
  assert.match(ohneUrheber.fehlt.join(' '), /Urheber fehlt/);
});

test('Unabhängigkeit hängt am Urheber, nicht an der Zahl der Links', () => {
  assert.equal(unabhaengig(video('v1', 'Kanal A'), video('v2', 'Kanal A')), false);
  assert.equal(unabhaengig(video('v1', 'Kanal A'), video('v2', 'kanal a')), false, 'Schreibweise ändert nichts');
  assert.equal(unabhaengig(video('v1', 'Kanal A'), video('v2', 'Kanal B')), true);
});

test('die Quellenarten trennen tragende von Hinweisen', () => {
  const arten = Object.keys(QUELLENARTEN);
  assert.ok(arten.length >= 6, 'die Artenliste ist gefüllt');
  for (const art of ['norm', 'datenblatt', 'behoerde', 'eigen']) {
    assert.equal(QUELLENARTEN[art].tragend, true, `${art} trägt`);
  }
  for (const art of ['video', 'forum', 'haendler']) {
    assert.equal(QUELLENARTEN[art].tragend, false, `${art} trägt nicht`);
  }
});

test('eine Recherche ist erst verwendbar, wenn keine Aussage offen ist', () => {
  const recherche = {
    quellen: [video('v1', 'Kanal A'), datenblatt],
    aussagen: [
      { id: 'a1', text: 'Belegt.', quellen: ['d1'] },
      { id: 'a2', text: 'Offen.', quellen: ['v1'] },
    ],
  };
  const e = werteRechercheAus(recherche);
  assert.equal(e.belegt, 1);
  assert.equal(e.offen.length, 1);
  assert.equal(e.offen[0].id, 'a2');
  assert.equal(e.verwendbar, false, 'eine offene Aussage sperrt die ganze Recherche');
});

test('eine leere Recherche gilt nicht als verwendbar', () => {
  assert.equal(werteRechercheAus({ quellen: [], aussagen: [] }).verwendbar, false);
});

test('mit --probe läuft das Werkzeug über die Vorlage und trennt tragende von Hinweisquellen', () => {
  const werkzeug = fileURLToPath(new URL('../bin/quellenpruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug, '--probe'], { encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.match(lauf.stdout, /2× video \(Hinweis/, 'Videos werden als Hinweis geführt');
  assert.match(lauf.stdout, /1× datenblatt \(tragend/, 'das Datenblatt trägt');
  assert.match(lauf.stdout, /3 von 3 belegt/);
  assert.match(lauf.stdout, /VERWENDBAR/);
  assert.match(lauf.stdout, /Zusammenfassen ja, abschreiben nein/);
});

test('ohne Argument prüft das Werkzeug den Bestand, nicht die Vorlage', () => {
  // Die Voreinstellung zeigte auf die Vorlage mit erfundenen Quellen und
  // meldete „3 von 3 belegt". Ein Werkzeug ohne Bestand prüft die Vorlage
  // und meldet Grün.
  const werkzeug = fileURLToPath(new URL('../bin/quellenpruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.ok(!/FIKTIV/i.test(lauf.stdout), 'die Voreinstellung zeigt auf die Vorlage');
  const aussagen = Number((lauf.stdout.match(/Aussagen: \d+ von (\d+) belegt/) ?? [])[1] ?? 0);
  assert.ok(aussagen >= 5, `nur ${aussagen} Aussagen — zeigt die Voreinstellung auf den Bestand?`);
});

test('die Vorlage im Repo ist als fiktiv gekennzeichnet und vollständig belegt', () => {
  const pfad = fileURLToPath(new URL('../beispiel/recherche-beispiel.json', import.meta.url));
  const vorlage = JSON.parse(readFileSync(pfad, 'utf8'));
  assert.match(vorlage._hinweis, /VORLAGE/);
  assert.ok(vorlage.quellen.length >= 4, 'die Vorlage zeigt mehrere Quellenarten');
  assert.ok(
    vorlage.quellen.every((q) => q.stand && q.urheber),
    'jede Quelle der Vorlage trägt Urheber und Stand',
  );
  assert.equal(werteRechercheAus(vorlage).verwendbar, true, 'die Vorlage zeigt den erreichten Zustand');
});

test('eine kaputte Recherchedatei gibt eine Meldung, keinen Stacktrace', () => {
  const werkzeug = fileURLToPath(new URL('../bin/quellenpruefung.mjs', import.meta.url));
  const lauf = spawnSync(process.execPath, [werkzeug, '/gibt/es/nicht.json'], { encoding: 'utf8' });
  assert.equal(lauf.status, 1);
  assert.match(lauf.stderr, /nicht lesbar/);
  assert.ok(!lauf.stderr.includes('at '), 'kein Stacktrace');
});

/* ------------------------------------------------------------------ *
 * Das Quellenregister des Bestands
 * ------------------------------------------------------------------ */

test('das Register des Bestands ist verwendbar und keine Vorlage', () => {
  // Bis zum 27.08. gab es nur die Vorlage mit erfundenen Quellen — das
  // Werkzeug stand seit dem 25. bereit und hatte nie echte Eingabe gesehen.
  const register = JSON.parse(readFileSync(
    fileURLToPath(new URL('../inhalte/quellen.json', import.meta.url)), 'utf8'));
  const e = werteRechercheAus(register);
  assert.ok(e.aussagen >= 5, `nur ${e.aussagen} Aussagen — zeigt das Register auf den Bestand?`);
  assert.equal(e.belegt, e.aussagen, e.offen.map((o) => `${o.id}: ${o.gruende.join(', ')}`).join(' | '));
  assert.equal(e.verwendbar, true);
  for (const q of register.quellen) {
    assert.ok(!/FIKTIV/i.test(JSON.stringify(q)), `${q.id}: erfundene Quelle im Bestandsregister`);
    assert.equal(pruefeQuelle(q).vollstaendig, true, `${q.id}: ${pruefeQuelle(q).fehlt.join(', ')}`);
  }
});

test('jede Norm im Register trägt Nummer und Ausgabe', () => {
  const register = JSON.parse(readFileSync(
    fileURLToPath(new URL('../inhalte/quellen.json', import.meta.url)), 'utf8'));
  const normen = register.quellen.filter((q) => q.art === 'norm');
  assert.ok(normen.length >= 3, 'ohne Normen prüft diese Schleife nichts');
  for (const n of normen) {
    assert.match(n.titel, /\d/, `${n.id}: Norm ohne Nummer`);
    assert.match(String(n.stand), /^\d{4}/, `${n.id}: Norm ohne Ausgabejahr`);
  }
});

test('eine Herstellerseite trägt keine Aussage', () => {
  // Sie ist eine Werbeaussage und im Register ausdrücklich als Hinweis
  // geführt. Hinge eine Aussage allein daran, wäre sie unbelegt — und der
  // Prüfer würde sie melden.
  const register = JSON.parse(readFileSync(
    fileURLToPath(new URL('../inhalte/quellen.json', import.meta.url)), 'utf8'));
  const haendler = new Set(register.quellen.filter((q) => q.art === 'haendler').map((q) => q.id));
  assert.ok(haendler.size >= 3);
  for (const a of register.aussagen) {
    assert.ok(!a.quellen.every((q) => haendler.has(q)),
      `${a.id}: hängt nur an Herstellerseiten`);
  }
});
