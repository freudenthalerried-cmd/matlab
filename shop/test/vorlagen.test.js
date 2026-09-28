/**
 * Die Vorlagen, die ein Mensch kopiert.
 *
 * **Befund vom 6. September 2026.** `npm run reichweite` nannte sieben
 * Dateien, die kein Prüfer öffnet. Fünf davon liegen in `beispiel/` — die
 * Vorlagen, die der Auftraggeber oder der Lieferant ausfüllt: die Artikelliste
 * mit EAN-Spalte, die Messung des Keyword-Planers, die Antworten der
 * Partnerrunde.
 *
 * > **Eine Vorlage, die niemand durch ihr Werkzeug schickt, ist eine
 * > Behauptung über ein Dateiformat.** Merkt es jemand, dann am Freigabetag,
 * > mit der ausgefüllten Datei in der Hand.
 *
 * Diese Probe schickt jede Vorlage durch das Werkzeug, für das sie gemacht
 * ist, und verlangt, dass sie angenommen wird. Sie prüft **die Form, nicht die
 * Zahlen**: Die Werte in den Vorlagen sind ausdrücklich erfunden und belegen
 * nichts.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { importierePreisliste } from '../src/import.js';
import { pruefeMessung, werteClusterAus } from '../src/suchauswertung.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const BEISPIEL = join(SHOP, 'beispiel');

test('die Artikelliste-Vorlage geht durch den Import', () => {
  const datei = join(BEISPIEL, 'artikelliste-muster.csv');
  assert.ok(existsSync(datei), 'die Vorlage fehlt — der Importweg verweist auf sie');

  const befund = importierePreisliste(readFileSync(datei, 'utf8'), 'Muster');
  assert.equal(befund.fehler.length, 0, `der Import weist die eigene Vorlage ab: ${befund.fehler.join(' | ')}`);
  assert.ok(befund.artikel.length >= 2, `nur ${befund.artikel.length} Zeilen erkannt`);
  // Die Spalten, die der Lieferant liefern soll, kommen auch an: Ohne sie
  // wäre die Vorlage formal in Ordnung und inhaltlich leer.
  const erste = befund.artikel[0];
  assert.ok(erste.sku, 'keine Artikelnummer erkannt');
  assert.ok(erste.bezeichnung, 'keine Bezeichnung erkannt');
  assert.equal(typeof erste.ekNetto, 'number', 'kein Einkaufspreis erkannt');
});

test('die Messungs-Vorlage geht durch die Suchauswertung', () => {
  const datei = join(BEISPIEL, 'messung-beispiel.json');
  assert.ok(existsSync(datei), 'die Vorlage fehlt — die Messliste verweist auf sie');

  const messung = JSON.parse(readFileSync(datei, 'utf8'));

  // Erste Frage: Ist die Vorlage vollständig ausgefüllt? Sie ist die Vorlage
  // für den **gefüllten** Zustand — eine Vorlage, die das Werkzeug wegen
  // fehlender Werte abweist, zeigt am Messtag nicht, wie es aussehen soll.
  const form = pruefeMessung(messung);
  assert.deepEqual(form.fehlend, [], 'das Werkzeug weist die eigene Vorlage ab');
  assert.equal(form.vollstaendig, true);

  // Zweite Frage: Lässt sie sich auch auswerten? Ob die *erfundene* Messung
  // besteht, sagt nichts — dass jeder Cluster ein gelesenes Volumen bekommt,
  // ist die Aussage dieser Probe.
  const cluster = (messung.cluster ?? []).map(werteClusterAus);
  assert.ok(cluster.length >= 3, `nur ${cluster.length} Cluster gelesen`);
  for (const c of cluster) {
    assert.ok(c.id, 'ein Cluster ohne Kennung');
    assert.equal(typeof c.summe, 'number', `Cluster „${c.id}" ohne gelesenes Volumen`);
  }
});

/**
 * **Die Gegenrichtung.** Eine neue Vorlage in `beispiel/` soll nicht
 * stillschweigend ungeprüft dazukommen — dieselbe Regel wie beim
 * Prüferregister: Eine Liste ist so gut wie der, der daran denkt, also wird
 * sie abgeleitet.
 */
test('jede Vorlage in beispiel/ wird von einer Probe angefasst', () => {
  const vorlagen = readdirSync(BEISPIEL).filter((d) => !d.startsWith('.'));
  assert.ok(vorlagen.length >= 4, `nur ${vorlagen.length} Vorlagen gefunden`);

  // Wer eine Vorlage anfasst, steht hier — Datei für Datei, mit der Probe,
  // die sie liest. `git grep` wäre die kürzere Fassung und die schlechtere:
  // Sie fände auch die Erwähnung in einem Kommentar.
  const gelesen = {
    'artikelliste-muster.csv': 'test/vorlagen.test.js',
    'messung-beispiel.json': 'test/vorlagen.test.js',
    'preisliste-muster-bahnen.csv': 'test/import-werkzeug.test.js',
    'recherche-beispiel.json': 'test/quellen.test.js',
    'antworten-beispiel.json': 'test/auswerten-werkzeug.test.js',
  };
  const ohne = vorlagen.filter((v) => !gelesen[v]);
  assert.deepEqual(ohne, [], 'diese Vorlagen schickt keine Probe durch ihr Werkzeug');

  // Und die Zuordnung wird nachgesehen, statt geglaubt: Wird eine Probe
  // umbenannt oder verliert sie ihre Vorlage, ist der Eintrag hier eine
  // Behauptung über eine Datei, die nichts mehr liest. Der Nachweis ist grob —
  // er sagt, dass der Name dort vorkommt, nicht dass er benutzt wird — und
  // genau darum ist er hier nur die zweite Zusicherung: Die erste ist, dass
  // die beiden Vorlagen oben tatsächlich durch ihr Werkzeug gehen.
  for (const [vorlage, probe] of Object.entries(gelesen)) {
    const datei = join(SHOP, probe);
    assert.ok(existsSync(datei), `${probe} gibt es nicht — die Zuordnung von „${vorlage}" ist alt`);
    assert.match(readFileSync(datei, 'utf8'), new RegExp(vorlage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${probe} nennt „${vorlage}" nicht mehr`);
  }
});
