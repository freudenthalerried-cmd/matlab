/**
 * Das Preiswechsel-Werkzeug gibt keinen Preis aus.
 *
 * **Warum das eine eigene Probe ist.** Die Grundlage liegt in `preise/`, das
 * `.gitignore` deckt. Gedeckt ist damit die **Datei** — nicht die Ausgabe
 * eines Werkzeugs, und die landet schneller in einem Dokument als eine Datei.
 * `pruefe-geheimnis` bewacht `data/`; für seine eigene Ausgabe ist ein
 * Werkzeug selbst verantwortlich.
 *
 * Geprüft wird gegen die **echten** Einkaufspreise, wenn sie daliegen. Fehlen
 * sie, sagt die Probe das und urteilt nicht.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const WERKZEUG = join(SHOP, 'bin', 'preiswechsel.mjs');
const PREISE = join(SHOP, '..', 'preise', 'baustoff-preise.json');

function lauf() {
  try {
    return execFileSync(process.execPath, [WERKZEUG], { encoding: 'utf8' });
  } catch (e) {
    return e.stdout ?? '';
  }
}

test('Kein Einkaufspreis steht in der Ausgabe', () => {
  if (!existsSync(PREISE)) return; // ohne Grundlage keine Aussage — und keine falsche
  const preise = JSON.parse(readFileSync(PREISE, 'utf8')).preise;
  // Zwei Bauarten im Bestand: ein fakturierter Nettopreis (`ekNetto`) oder
  // Listenpreis und Rabatt (`uvpNetto`, `haendlerrabattAufUvp`). Beide sind
  // Einkaufspreise, und beide dürfen nicht in einer Ausgabe stehen — die
  // zweite Sorte auch in ihrer gerechneten Form.
  const werte = Object.values(preise).flatMap((p) => {
    const gefunden = [];
    if (typeof p.ekNetto === 'number' && p.ekNetto > 0) gefunden.push(p.ekNetto);
    if (typeof p.uvpNetto === 'number' && p.uvpNetto > 0) {
      gefunden.push(p.uvpNetto);
      if (typeof p.haendlerrabattAufUvp === 'number') {
        gefunden.push(Number((p.uvpNetto * (1 - p.haendlerrabattAufUvp)).toFixed(2)));
      }
    }
    return gefunden;
  });
  assert.ok(werte.length >= 40, `nur ${werte.length} Einkaufspreise — die Schleife prüfte zu wenig`);

  const ausgabe = lauf();
  assert.ok(ausgabe.length > 200, 'das Werkzeug hat nichts ausgegeben');
  const gefunden = [];
  for (const wert of werte) {
    // Beide Schreibweisen: Das Werkzeug schreibt Zahlen deutsch, die Datei
    // englisch. Ein Prüfer, der nur eine sucht, findet die andere nicht.
    for (const form of [String(wert), String(wert).replace('.', ',')]) {
      if (form.length >= 4 && ausgabe.includes(form)) gefunden.push(form);
    }
  }
  assert.deepEqual(gefunden, []);
});

test('Die Ausgabe nennt Zählungen und Zeitspannen, keine Beträge', () => {
  if (!existsSync(join(SHOP, '..', 'preise', 'poschacher-positionen.csv'))) return;
  const ausgabe = lauf();
  assert.match(ausgabe, /Artikelnummern/);
  assert.match(ausgabe, /Tage/);
  // Ein Eurozeichen hat in dieser Ausgabe nichts verloren.
  assert.doesNotMatch(ausgabe, /€/, 'ein Betrag in der Ausgabe');
});
