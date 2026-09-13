import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  aufloesen, einzugsgebiet, genanntePfade, importe, liestOrdner, mussLaufen,
} from '../src/einzugsgebiet.js';
import { GEGENPROBEN } from '../src/gegenprobenregister.js';
import { PRUEFER } from '../src/pruefregister.js';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const lies = (p) => { try { return readFileSync(REPO + p, 'utf8'); } catch { return null; } };
const gibtEs = (p) => existsSync(REPO + p);

test('Einfuhren werden auch über mehrere Zeilen gefunden', () => {
  // Der erste Wurf suchte `import … from` in **einer** Zeile und fand bei
  // `bin/weisungspruefung.mjs` keine einzige — dort steht die Klammer über
  // vier Zeilen. Gesucht wird deshalb `from '…'`.
  const quelle = [
    "import { readFileSync } from 'node:fs';",
    'import {',
    '  EINS, ZWEI,',
    "} from '../src/zwei.js';",
    "export { drei } from './drei.js';",
    "const spaet = await import('./vier.js');",
  ].join('\n');
  assert.deepEqual(importe(quelle), ['../src/zwei.js', './drei.js', './vier.js']);
  // Eingebaute Module und Pakete bleiben draußen: Dieses Haus hat keine
  // Abhängigkeiten, und eine neue Node-Fassung ist kein Ereignis, das eine
  // Auswahl treffen kann.
  assert.ok(!importe(quelle).includes('node:fs'));
});

test('Pfade werden ohne node:path aufgelöst', () => {
  assert.equal(aufloesen('shop/bin/x.mjs', '../src/y.js'), 'shop/src/y.js');
  assert.equal(aufloesen('shop/bin/x.mjs', './y.mjs'), 'shop/bin/y.mjs');
  assert.equal(aufloesen('shop/src/a/b.js', '../c/d.js'), 'shop/src/c/d.js');
});

test('Genannte Dateien zählen mit — ein Prüfer urteilt über Daten', () => {
  const quelle = "export const QUELLE = 'docs/baustoff-shop/gate-register.md';\n"
    + "const daten = 'data/lieferanten.json';\nconst kein = 'Text ohne Endung';";
  assert.deepEqual(genanntePfade(quelle).sort(),
    ['data/lieferanten.json', 'docs/baustoff-shop/gate-register.md']);
});

test('Wer einen Ordner liest, hat kein aufzählbares Gebiet', () => {
  assert.equal(liestOrdner('const x = readdirSync(ordner);'), true);
  assert.equal(liestOrdner("execFileSync('git', ['ls-files'])"), true);
  assert.equal(liestOrdner("readFileSync('eine/datei.md')"), false);
});

test('Das Gebiet eines echten Prüfers enthält seine Quellen und seine Daten', () => {
  const g = einzugsgebiet('shop/bin/gatepruefung.mjs', lies, { gibtEs });
  assert.ok(g.dateien.has('shop/bin/gatepruefung.mjs'));
  assert.ok(g.dateien.has('shop/src/gatestand.js'), 'die Einfuhr fehlt');
  assert.ok(g.dateien.has('docs/baustoff-shop/gate-register.md'),
    'die Datei, über die er urteilt, fehlt');
});

test('Drei Gründe lassen eine Gegenprobe laufen, einer nicht', () => {
  const gebiet = { dateien: new Set(['shop/src/a.js']), offenesGebiet: false };
  const gebiete = new Map([['pruefe-x', gebiet]]);
  const probe = { pruefer: 'pruefe-x', datei: 'shop/src/b.js' };
  assert.equal(mussLaufen(probe, new Set(['shop/src/b.js']), gebiete).grund, 'eigene-datei');
  assert.equal(mussLaufen(probe, new Set(['shop/src/a.js']), gebiete).grund, 'einzugsgebiet');
  assert.equal(mussLaufen(probe, new Set(['shop/src/c.js']), gebiete).laufen, false);
  // Im Zweifel laufen: Eine Auswahl, die im Zweifel überspringt, schweigt im
  // Zweifel.
  assert.equal(mussLaufen(probe, new Set(), new Map()).grund, 'gebiet-unbekannt');
  assert.equal(mussLaufen(probe, new Set(),
    new Map([['pruefe-x', { dateien: new Set(), offenesGebiet: true }]])).grund,
  'liest-einen-ordner');
});

test('Gemessen am Bestand: die Auswahl trägt nur für ein Fünftel', () => {
  /*
   * **Die Zahl dieser Runde, und sie steht hier, damit sie nicht rutscht.**
   * Die Prüfer dieses Hauses lesen Verzeichnisse — sie halten Register gegen
   * die Wirklichkeit, und Wirklichkeit heißt: alle Dateien. Ihr Einzugsgebiet
   * **ist** das Verzeichnis, und deshalb kann eine Auswahl nach geänderten
   * Dateien die meisten Gegenproben nicht überspringen.
   */
  const gebiete = new Map(PRUEFER.map((p) => [
    p.name, einzugsgebiet(`shop/bin/${p.werkzeug}`, lies, { gibtEs }),
  ]));
  assert.ok(gebiete.size >= 55, `nur ${gebiete.size} Prüfer mit Gebiet`);

  const testgebiete = readdirSync(`${REPO}shop/test`)
    .filter((n) => n.endsWith('.test.js'))
    .map((n) => [`shop/test/${n}`, einzugsgebiet(`shop/test/${n}`, lies, { gibtEs })]);
  assert.ok(testgebiete.length >= 80, `nur ${testgebiete.length} Testdateien gelesen`);

  assert.ok(GEGENPROBEN.length >= 200, `nur ${GEGENPROBEN.length} Gegenproben`);
  const gruende = {};
  for (const p of GEGENPROBEN) {
    let urteil;
    if (p.pruefer === 'test') {
      const zeugen = testgebiete.filter(([, g]) => g.dateien.has(p.datei));
      const vereint = zeugen.length ? {
        dateien: new Set(zeugen.flatMap(([d, g]) => [d, ...g.dateien])),
        offenesGebiet: zeugen.some(([, g]) => g.offenesGebiet),
      } : null;
      urteil = mussLaufen(p, new Set(), new Map([['test', vereint]]));
    } else {
      urteil = mussLaufen(p, new Set(), gebiete);
    }
    gruende[urteil.grund] = (gruende[urteil.grund] ?? 0) + 1;
  }
  // **Ohne eine einzige geänderte Datei** laufen die meisten trotzdem. Das ist
  // kein Fehler der Auswahl, sondern die Bauweise dieses Bestands.
  assert.ok(gruende['liest-einen-ordner'] > GEGENPROBEN.length / 2,
    `nur ${gruende['liest-einen-ordner']} lesen einen Ordner — die Bauweise hat sich geändert`);
  assert.ok((gruende.unveraendert ?? 0) < GEGENPROBEN.length / 4,
    'die Auswahl trägt plötzlich mehr — dann gehört die Zahl im Dokument nachgezogen');
});
