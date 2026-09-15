import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog } from '../src/warenkorb.js';
import { MARGENUNTERGRENZE } from '../src/preis.js';
import {
  noetigerEinkauf,
  noetigerRabatt,
  verhandlungsziel,
  spielraumAusRabatt,
  staffel,
  rueckwaertsKatalog,
} from '../src/verhandlung.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);

test('Der nötige Einkauf folgt unmittelbar aus Preis und Marge', () => {
  assert.equal(noetigerEinkauf(100, 0.32), 68);
  assert.equal(noetigerEinkauf(100, 0.38), 62);
  assert.equal(noetigerEinkauf(250, 0.40), 150);
});

test('Unsinnige Eingaben werden zurückgewiesen', () => {
  assert.throws(() => noetigerEinkauf(0, 0.32), /braucht einen Verkaufspreis/);
  assert.throws(() => noetigerEinkauf(100, 1.2), /zwischen 0 und 1/);
  assert.throws(() => noetigerRabatt(1.5), /zwischen 0 und 1/);
});

test('Ohne Nachlass entspricht der nötige Rabatt genau der Marge', () => {
  assert.ok(Math.abs(noetigerRabatt(0, 0.32) - 0.32) < 1e-12);
  assert.ok(Math.abs(noetigerRabatt(0, 0.38) - 0.38) < 1e-12);
});

test('Jeder Prozentpunkt Nachlass kostet mehr als einen Prozentpunkt Rabatt', () => {
  const ohne = noetigerRabatt(0, 0.32);
  const mitFuenf = noetigerRabatt(0.05, 0.32);
  const mitZehn = noetigerRabatt(0.10, 0.32);

  assert.ok(mitFuenf - ohne > 0.05 * 0.6, 'überproportional');
  // 10 % Nachlass verlangen 38,8 % Rabatt statt 32 %.
  assert.ok(Math.abs(mitZehn - 0.388) < 0.001, `${mitZehn}`);
});

test('Die Bahn braucht bei 10 % Nachlass über 44 % Rabatt', () => {
  const r = noetigerRabatt(0.10, 0.38);
  assert.ok(Math.abs(r - 0.442) < 0.001, `${r}`);
});

test('Rückwärts und vorwärts sind zueinander invers', () => {
  for (const nachlass of [0, 0.05, 0.10, 0.20]) {
    for (const marge of [0.32, 0.38, 0.42]) {
      const r = noetigerRabatt(nachlass, marge);
      const zurueck = spielraumAusRabatt(r, marge);
      assert.ok(Math.abs(zurueck.maxNachlass - nachlass) < 1e-9, `${nachlass}/${marge}`);
    }
  }
});

test('Das Verhandlungsziel rechnet UVP, Verkauf und Einkauf durch', () => {
  const z = verhandlungsziel({ gruppe: 'bahnen', zielmarge: 0.38, nachlassAufUvp: 0.10, uvpNetto: 200 });

  assert.equal(z.vkNetto, 180);
  assert.equal(z.ekNetto, 111.6);
  assert.ok(Math.abs(z.noetigerRabatt - 0.442) < 0.001);
  assert.ok(Math.abs(z.aufschlagGegenOhneNachlass - 0.062) < 0.001, 'der Preisspielraum kostet 6,2 Punkte');
});

test('Ohne UVP wird kein Preis erfunden', () => {
  const z = verhandlungsziel({ gruppe: 'rohr', zielmarge: 0.32, nachlassAufUvp: 0.05 });
  assert.equal(z.uvpNetto, null);
  assert.equal(z.vkNetto, null);
  assert.equal(z.ekNetto, null);
  assert.ok(z.noetigerRabatt > 0.32);
});

test('Ein zu schwacher Rabatt wird als solcher gemeldet', () => {
  const s = spielraumAusRabatt(0.30, 0.32);
  assert.equal(s.reicht, false);
  assert.equal(s.maxNachlass, 0);
});

test('Die Staffel fürs Anschreiben hat vier Stufen und steigt', () => {
  const s = staffel(0.32);
  assert.equal(s.length, 4);
  for (let i = 1; i < s.length; i++) {
    assert.ok(s[i].noetigerRabatt > s[i - 1].noetigerRabatt);
  }
  assert.ok(Math.abs(s[0].noetigerRabatt - 0.32) < 1e-12);
});

test('Der Rückwärtskatalog liefert je Artikel einen Zielpreis', () => {
  const r = rueckwaertsKatalog(katalog, { nachlassAufUvp: 0.10 });

  assert.equal(r.length, katalog.artikel.length);
  for (const z of r) {
    assert.ok(z.ekNetto > 0 && z.ekNetto < z.vkNetto, `${z.sku}`);
    assert.ok(z.vkNetto < z.uvpNetto, 'bei 10 % Nachlass liegt der Verkauf unter der UVP');
    assert.ok(z.noetigerRabatt > MARGENUNTERGRENZE);
  }
});

test('Je Gruppe lässt sich eine eigene Zielmarge setzen', () => {
  // Der Gruppenname muss zu data/artikel.json passen. Ein Testfall, der sich
  // hinter einem `if` versteckt, prüft bei einem Tippfehler gar nichts — die
  // erste Fassung dieses Falls hat genau das getan.
  const gruppen = new Set(katalog.artikel.map((a) => a.gruppe));
  assert.ok(gruppen.has('Abdichtung'), `Gruppen im Katalog: ${[...gruppen].join(', ')}`);

  const r = rueckwaertsKatalog(katalog, { nachlassAufUvp: 0.10, zielmargen: { Abdichtung: 0.38 } });
  const bahn = r.find((z) => z.gruppe === 'Abdichtung');
  const andere = r.find((z) => z.gruppe === 'Drainage');

  assert.ok(bahn, 'kein Abdichtungsartikel gefunden');
  assert.ok(andere, 'kein Drainageartikel gefunden');
  assert.ok(bahn.noetigerRabatt > andere.noetigerRabatt, 'die Bahn muss mehr tragen');
  assert.ok(Math.abs(bahn.noetigerRabatt - 0.442) < 0.001, `${bahn.noetigerRabatt}`);
});

test('Die Lücke zum heutigen Platzhalterpreis wird ausgewiesen, nicht verschwiegen', () => {
  const r = rueckwaertsKatalog(katalog, { nachlassAufUvp: 0.10 });
  assert.equal(r.length, katalog.artikel.length);
  assert.ok(r.some((z) => z.heutigerEk !== null), 'sonst bleibt die innere Prüfung ungenutzt');
  for (const z of r) {
    assert.notEqual(z.luecke, undefined);
    if (z.heutigerEk !== null) {
      assert.ok(Math.abs(z.luecke - (z.heutigerEk - z.ekNetto)) < 0.005, `${z.sku}`);
    }
  }
});
