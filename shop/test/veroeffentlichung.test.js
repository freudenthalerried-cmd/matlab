import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { llmsTxt } from '../src/maschinenlesbar.js';

const werkzeug = fileURLToPath(new URL('../bin/veroeffentlichung.mjs', import.meta.url));
const zielordner = fileURLToPath(new URL('../veroeffentlichung', import.meta.url));

test('llms.txt trägt Name, Liefergebiet und Seiten — und markiert Lücken sichtbar', () => {
  const text = llmsTxt({
    name: 'Muster Baustoffe e.U.',
    beschreibung: 'Baustoffe für Handwerksbetriebe.',
    liefergebiet: { land: 'AT', bezirke: ['Ried im Innkreis', 'Braunau am Inn'] },
    hinweise: ['Alle Preise netto.'],
    seiten: [{ titel: 'Spachtelmasse', url: 'https://x.at/spachtelmasse', beschreibung: 'Verbrauch und Preise' }],
  });
  assert.match(text, /^# Muster Baustoffe e\.U\./);
  assert.match(text, /Liefergebiet: Ried im Innkreis, Braunau am Inn \(AT\)/);
  assert.match(text, /\[Spachtelmasse\]\(https:\/\/x\.at\/spachtelmasse\): Verbrauch und Preise/);
  assert.match(text, /Alle Preise netto\./);
});

test('ohne Liefergebiet steht keine erfundene Gebietszeile in llms.txt', () => {
  const text = llmsTxt({ name: 'Muster', liefergebiet: { bezirke: [] } });
  assert.ok(!text.includes('Liefergebiet:'), 'lieber keine Angabe als eine falsche');
});

test('Fremdtext im Namen wird auch hier entschärft', () => {
  const text = llmsTxt({ name: 'Muster\nZweite Zeile', liefergebiet: { bezirke: [] } });
  assert.equal(text.split('\n')[0], '# Muster Zweite Zeile', 'die Überschrift bleibt einzeilig');
});

test('der Probelauf schreibt nichts und benennt die Lücken', () => {
  // Die frühere Fassung prüfte „0 veröffentlichbar, 9 zurückgehalten". Das
  // war die Zahl des Radon-Platzhalterkatalogs und brach, sobald das
  // Werkzeug den echten Katalog bekam — obwohl die Zusicherung selbst
  // („es geht nichts hinaus, was nicht hinausgehen darf") unverletzt war.
  // Geprüft wird deshalb die Eigenschaft, nicht der Zählerstand.
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8', env: { ...process.env, SHOP_NAME: '', SHOP_BEZIRKE: '' } });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /Einreichbar: nein/, 'ohne Liefergebiet und GTIN ist nichts einreichbar');
  assert.match(lauf.stdout, /Liefergebiet/);
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

test('mit --schreiben bricht es ab, solange Pflichtangaben fehlen', () => {
  const lauf = spawnSync(process.execPath, [werkzeug, '--schreiben'], {
    encoding: 'utf8',
    env: { ...process.env, SHOP_NAME: '', SHOP_BEZIRKE: '' },
  });
  assert.equal(lauf.status, 1, 'Abbruch statt halber Veröffentlichung');
  assert.match(lauf.stderr, /Es wird nichts veröffentlicht/);
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
