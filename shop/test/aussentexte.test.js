import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  AUSGAENGE, KEIN_AUSGANG, NAMENSMUSTER, ungenannteAusgaenge, internabefund,
} from '../src/aussentexte.js';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

/** Alle exportierten Funktionen des Rechenkerns, aus dem Quelltext gelesen. */
function exportierteFunktionen() {
  const gefunden = [];
  for (const name of readdirSync(SRC)) {
    if (!name.endsWith('.js')) continue;
    const text = readFileSync(join(SRC, name), 'utf8');
    for (const t of text.matchAll(/^export function ([a-zA-Z0-9_]+)/gm)) {
      gefunden.push({ modul: `src/${name}`, funktion: t[1] });
    }
    // **Erweitert am 3. September.** Der Leser kannte nur `export function`.
    // Sechzehn Ausfuhren dieses Bestandes sind Pfeilfunktionen an einem
    // `export const` — darunter `textZeile`, also ausgerechnet die
    // Entschärfung, durch die jeder Ausgang läuft. Sie waren für das
    // Verzeichnis unsichtbar, und ein Verzeichnis, das eine Schreibweise
    // nicht kennt, führt sie auch nicht.
    //
    // Dritter Fall derselben Art: `\bÖNORM` traf nie wegen ASCII, das
    // Namensmuster kannte `Text` und nicht `Txt`. Ein Leser prüft die
    // Schreibweise, die sein Verfasser im Kopf hatte.
    for (const t of text.matchAll(/^export const ([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/gm)) {
      gefunden.push({ modul: `src/${name}`, funktion: t[1] });
    }
  }
  return gefunden;
}

test('Der Quelltext liefert überhaupt Funktionen — sonst prüft alles darunter nichts', () => {
  const alle = exportierteFunktionen();
  assert.ok(alle.length >= 100, `nur ${alle.length} exportierte Funktionen gefunden`);
});

test('Jede textbauende Funktion steht im Verzeichnis oder hat einen Grund', () => {
  // Der Kern dieser Datei. Ein von Hand geführtes Verzeichnis wächst mit der
  // Aufmerksamkeit, nicht mit dem Bestand — deshalb wird die Liste gegen den
  // Quelltext gehalten und nicht gegen die Erinnerung.
  const kandidaten = exportierteFunktionen().filter((f) => NAMENSMUSTER.test(f.funktion));
  assert.ok(kandidaten.length >= 15, `nur ${kandidaten.length} Kandidaten — das Muster greift zu eng`);
  const ungenannt = ungenannteAusgaenge(kandidaten);
  assert.deepEqual(
    ungenannt.map((u) => `${u.modul}:${u.funktion}`),
    [],
    'Eine textbauende Funktion, die niemand kennt, ist ein ungeprüfter Ausgang',
  );
});

test('Jeder Ausgang des Verzeichnisses existiert wirklich', () => {
  const alle = new Set(exportierteFunktionen().map((f) => `${f.modul}:${f.funktion}`));
  assert.ok(AUSGAENGE.length >= 8, `nur ${AUSGAENGE.length} Ausgänge`);
  for (const a of AUSGAENGE) {
    assert.ok(alle.has(`${a.modul}:${a.funktion}`), `${a.modul}:${a.funktion} gibt es nicht mehr`);
    assert.ok(a.an && a.form, `${a.funktion}: Empfänger oder Form fehlt`);
  }
});

test('Jeder Ausgang wird im Fremdtextverzeichnis auch angefasst', () => {
  // Eingetragen und geprüft sind zwei Dinge. Diese Probe hält sie zusammen.
  const fremdtext = readFileSync(new URL('./fremdtext.test.js', import.meta.url), 'utf8');
  assert.ok(AUSGAENGE.length >= 8, `nur ${AUSGAENGE.length} Ausgänge — die Schleife prüfte zu wenig`);
  for (const a of AUSGAENGE) {
    assert.ok(fremdtext.includes(a.funktion), `${a.funktion} steht im Verzeichnis, aber in keiner Probe`);
  }
});

test('Ein Nicht-Ausgang ohne Grund wird abgewiesen', () => {
  assert.throws(
    () => ungenannteAusgaenge([], AUSGAENGE, [{ funktion: 'x', warum: 'zu kurz' }]),
    /Ohne Grund/,
  );
  assert.throws(
    () => ungenannteAusgaenge([], AUSGAENGE, [{ funktion: 'erzeugeRechnung', warum: 'ein hinreichend langer, aber falscher Grund für diesen Eintrag hier' }]),
    /als Ausgang und als Nicht-Ausgang/,
  );
});

test('Eine neue textbauende Funktion fällt auf', () => {
  const neu = [{ modul: 'src/erfunden.js', funktion: 'erzeugeMahnung' }];
  assert.deepEqual(ungenannteAusgaenge(neu), neu);
});

/*
 * ## Drei Regeln, die das Verzeichnis gegen sich selbst halten
 *
 * **14. September 2026, nachts.** Alle drei standen als „nie gesehen" in der
 * Zählung der Regelnamen, und alle drei greifen erst, wenn jemand am
 * Verzeichnis arbeitet — genau dann also, wenn ein Fehler am leichtesten
 * durchgeht. Was sie bewachen: Kein Text, der an einen Kunden geht, verlässt
 * das Haus ungeprüft auf Interna.
 */
const ausgang = (funktion, an = 'Kunde') => ({ funktion, an, art: 'text' });

test('Ein Grund für einen Ausgang, den es nicht gibt', () => {
  const b = internabefund(['schreibA'], [ausgang('schreibA')],
    [{ funktion: 'gibtsNichtMehr', warum: 'x'.repeat(90) }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-ohne-ausgang'), JSON.stringify(b.meldungen));
});

/*
 * Und die Gegenrichtung: Ein Ausgang, der als ungeprüft begründet **und**
 * geprüft wird. Dann ist der Grund gegenstandslos — und ein Grund, der stehen
 * bleibt, deckt beim nächsten Mal etwas, das er nie decken sollte.
 */
test('Ein Ausgang, der begründet ungeprüft ist und trotzdem geprüft wird', () => {
  const b = internabefund(['schreibA'], [ausgang('schreibA')],
    [{ funktion: 'schreibA', warum: 'x'.repeat(90) }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'begruendet-und-geprueft'), JSON.stringify(b.meldungen));
});

test('Eine Probe, die einen Ausgang prüft, den kein Verzeichnis führt', () => {
  const b = internabefund(['schreibA', 'fremd'], [ausgang('schreibA')], []);
  assert.ok(b.meldungen.some((m) => m.regel === 'probe-ohne-ausgang'), JSON.stringify(b.meldungen));
});

test('Ohne Ausgang nach draußen prüft dieser Befund nichts — und sagt es', () => {
  const b = internabefund([], [ausgang('nurIntern', 'Ablage')], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['kein-ausgang-nach-draussen'],
    JSON.stringify(b.meldungen));
});
