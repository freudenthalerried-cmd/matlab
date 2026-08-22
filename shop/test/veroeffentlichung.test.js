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
  const lauf = spawnSync(process.execPath, [werkzeug], { encoding: 'utf8', env: { ...process.env, SHOP_NAME: '', SHOP_BEZIRKE: '' } });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /0 veröffentlichbar, 9 zurückgehalten/, 'der Platzhalterkatalog geht nicht hinaus');
  assert.match(lauf.stdout, /Firmenname/);
  assert.match(lauf.stdout, /Liefergebiet/);
  assert.match(lauf.stdout, /Probelauf/);
  assert.equal(existsSync(zielordner), false, 'es entsteht kein Ausgabeordner');
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

test('auch mit vollständigen Firmendaten bleibt der Feed leer, solange Preise Platzhalter sind', () => {
  const lauf = spawnSync(process.execPath, [werkzeug], {
    encoding: 'utf8',
    env: { ...process.env, SHOP_NAME: 'Muster e.U.', SHOP_BEZIRKE: 'Ried im Innkreis, Schärding' },
  });
  assert.equal(lauf.status, 0);
  assert.match(lauf.stdout, /0 veröffentlichbar/, 'die Preissperre gilt unabhängig von den Firmendaten');
  assert.ok(!lauf.stdout.includes('Firmenname'), 'die Firmenlücke ist geschlossen');
});
