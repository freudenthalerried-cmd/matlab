import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { AUSGAENGE, KEIN_AUSGANG, NAMENSMUSTER, ungenannteAusgaenge } from '../src/aussentexte.js';

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
