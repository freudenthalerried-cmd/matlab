import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import {
  wettbewerbsstufe,
  pruefeMessung,
  werteClusterAus,
  werteSuchmessungAus,
  CLUSTER_MINDESTVOLUMEN,
  KUMULIERT_MINDESTENS,
} from '../src/suchauswertung.js';

const cluster = (gruppe, keywords, id = 'x') => ({ id, name: id, gruppe, keywords });
const kw = (volumen, kd = 10) => ({ begriff: `kw${volumen}-${kd}`, volumen, kd });

test('die Difficulty-Zuordnung folgt der vorab festgelegten Skalenteilung', () => {
  assert.equal(wettbewerbsstufe(0), 'niedrig');
  assert.equal(wettbewerbsstufe(29), 'niedrig');
  assert.equal(wettbewerbsstufe(30), 'mittel');
  assert.equal(wettbewerbsstufe(49), 'mittel');
  assert.equal(wettbewerbsstufe(50), 'hoch');
  assert.equal(wettbewerbsstufe(null), null);
  assert.equal(wettbewerbsstufe(Number.NaN), null);
});

test('ein Cluster besteht mit genau 200 Suchen und fällt mit 199', () => {
  assert.equal(werteClusterAus(cluster('A', [kw(200)])).bestanden, true);
  assert.equal(werteClusterAus(cluster('A', [kw(199)])).bestanden, false);
  assert.equal(CLUSTER_MINDESTVOLUMEN, 200);
});

test('der Wettbewerbsanteil ist volumengewichtet — ein Drittel ist die Grenze', () => {
  const genauEinDrittel = werteClusterAus(cluster('A', [kw(200, 10), kw(100, 60)]));
  assert.equal(genauEinDrittel.bestanden, true, 'genau ein Drittel hart umkämpft besteht noch');
  const drueber = werteClusterAus(cluster('A', [kw(190, 10), kw(110, 60)]));
  assert.equal(drueber.bestanden, false, 'über einem Drittel fällt der Cluster trotz Volumen');
  assert.equal(drueber.genugVolumen, true, 'der Grund ist der Wettbewerb, nicht das Volumen');
});

test('die Gruppe-C-Regel: nur Reichweiten-Cluster sind kein Bestehen', () => {
  const nurC = werteSuchmessungAus({
    cluster: [
      cluster('C', [kw(900)], 'c1'),
      cluster('C', [kw(800)], 'c2'),
      cluster('C', [kw(700)], 'c3'),
    ],
  });
  assert.equal(nurC.bestandene, 3);
  assert.ok(nurC.kumuliert >= KUMULIERT_MINDESTENS);
  assert.equal(nurC.pruefungB, false, 'drei bestandene C-Cluster über 2000 bestehen NICHT');
  assert.equal(nurC.radonseite, false);

  const mitRadonseite = werteSuchmessungAus({
    cluster: [
      cluster('A', [kw(900)], 'a1'),
      cluster('C', [kw(800)], 'c2'),
      cluster('C', [kw(700)], 'c3'),
    ],
  });
  assert.equal(mitRadonseite.pruefungB, true, 'derselbe Fall mit einem A-Cluster besteht');
});

test('die kumulierte Schwelle zählt nur bestandene Cluster', () => {
  const ergebnis = werteSuchmessungAus({
    cluster: [
      cluster('A', [kw(600)], 'a1'),
      cluster('B', [kw(700)], 'b1'),
      cluster('B', [kw(650)], 'b2'),
      cluster('C', [kw(150)], 'c1'),
    ],
  });
  assert.equal(ergebnis.bestandene, 3);
  assert.equal(ergebnis.kumuliert, 1950, 'der gefallene 150er-Cluster zählt nicht mit');
  assert.equal(ergebnis.pruefungB, false, '1950 verfehlt die 2000er-Schwelle');
});

test('die Messungsprüfung meldet fehlende Volumina und Difficulty-Werte', () => {
  const p = pruefeMessung({
    cluster: [
      { id: 'x', name: 'x', gruppe: 'A', keywords: [{ begriff: 'radon messen', volumen: null, kd: 10 }] },
      { id: 'y', name: 'y', gruppe: 'Z', keywords: [{ begriff: 'radonsperre', volumen: 50, kd: null }] },
    ],
  });
  assert.equal(p.vollstaendig, false);
  assert.equal(p.fehlend.length, 3, 'fehlendes Volumen, fehlende Difficulty, unbekannte Gruppe');
  assert.ok(p.fehlend.some((f) => f.includes('radon messen')));
  assert.ok(p.fehlend.some((f) => f.includes('radonsperre')));
  assert.ok(p.fehlend.some((f) => f.includes('Gruppe')));
});

test('die leere Messliste im Repo ist vollständig aufgebaut, nur ohne Werte', () => {
  const liste = JSON.parse(readFileSync(fileURLToPath(new URL('../data/messliste.json', import.meta.url)), 'utf8'));
  assert.ok(liste.cluster.length >= 5, 'mindestens fünf Cluster, damit drei bestehen können');
  const gruppen = new Set(liste.cluster.map((c) => c.gruppe));
  assert.ok(gruppen.has('A') && gruppen.has('B') && gruppen.has('C'), 'alle drei Gruppen der Inhaltslandkarte sind vertreten');
  const p = pruefeMessung(liste);
  assert.equal(p.vollstaendig, false, 'die Vorlage trägt noch keine Werte');
  assert.ok(liste._hinweis.includes('npm run suchvolumen'), 'der Hinweis nennt den Auswertungsweg');
});

test('das Werkzeug läuft über die Beispielmessung und trägt den Grenzbefund vor', () => {
  const werkzeug = fileURLToPath(new URL('../bin/suchvolumen.mjs', import.meta.url));
  const ausgabe = execFileSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  assert.ok(ausgabe.includes('FIKTIVE Beispielmessung'), 'der Hinweis auf die fiktive Vorlage erscheint');
  assert.ok(ausgabe.includes('Prüfung B: NICHT BESTANDEN'), 'die Beispielmessung zeigt bewusst einen Grenzbefund');
  assert.ok(ausgabe.includes('kumuliert ≥ 2000'), 'die fehlende Bedingung wird benannt');
  assert.ok(ausgabe.includes('✗ (Wettbewerb)'), 'der Reichweiten-Cluster fällt sichtbar am Wettbewerb');
  assert.ok(ausgabe.includes('Gate 17'), 'der Schlusssatz nennt Gate 17');
});
