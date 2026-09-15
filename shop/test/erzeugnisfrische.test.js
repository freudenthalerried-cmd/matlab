/**
 * Messen die Testfälle das Erzeugnis von heute?
 *
 * **Der Anlass, 8. September 2026, nachts.** Ein Abend voller roter Läufe, die
 * alle dasselbe waren und keiner davon ein Fehler im Bestand:
 *
 * | gemeldet | tatsächlich |
 * |---|---|
 * | `llms.txt` nennt die Rechtsseiten nicht | `ausgabe/site` war älter als die Quelle |
 * | ein Anzeigenwort wird nicht ausgeschlossen | dasselbe |
 * | die Abnahmeliste zeigt auf fehlenden Text | dasselbe |
 *
 * Jedes Mal habe ich den genannten Fehler gesucht, und jedes Mal war der
 * Bestand in Ordnung. **Fünfunddreißig Testdateien lesen `ausgabe/site`, und
 * keine einzige fragt, ob es auf dem Stand der Quelle ist.**
 *
 * Die Prüfer machen es seit dem 4. September richtig: `frischebefund` prüft,
 * und wer über einem veralteten Erzeugnis messen soll, **weigert sich** mit
 * Ausgang 2 und sagt, welche Quelldatei jünger ist.
 *
 * > **Die Prüfer weigern sich über einem veralteten Erzeugnis. Die Testfälle
 * > messen es** — und melden dann den falschen Fehler, mit voller Überzeugung.
 *
 * Ein Testfall kann sich nicht weigern; er kann nur bestehen oder scheitern.
 * Also scheitert dieser hier — **mit der richtigen Diagnose**, damit die
 * anderen Meldungen darunter als das gelesen werden, was sie sind: Messungen
 * an der Vergangenheit.
 *
 * Er steht in einer eigenen Datei, weil `node --test` die Dateien in
 * beliebiger Reihenfolge fährt: Wo er landet, ist nicht zu steuern — dass er
 * dasteht, schon.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ERZEUGNISSE, abbruchtext, frischebefund } from '../src/erzeugnisstand.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));

test('jedes Erzeugnis, das Testfälle lesen, ist auf dem Stand der Quelle', () => {
  const namen = Object.keys(ERZEUGNISSE);
  assert.ok(namen.length >= 3, 'ohne Erzeugnisse prüft die Schleife darunter nichts');

  const veraltet = [];
  for (const name of namen) {
    const stand = frischebefund(SHOP, name);
    // Fehlt das Erzeugnis ganz, ist das der Fall der einzelnen Testdatei: Sie
    // überspringt sich dann selbst. Hier geht es nur um „da, aber von gestern".
    if (stand.fehlt) continue;
    if (!stand.frisch) veraltet.push(abbruchtext(stand).join('\n    '));
  }

  assert.deepEqual(veraltet, [],
    'Testfälle unter dieser Zeile messen ein veraltetes Erzeugnis. Ihre Befunde '
    + 'beschreiben die Vergangenheit und nicht den Bestand:\n\n    '
    + `${veraltet.join('\n\n    ')}\n`);
});

test('der Ausgabeordner steht überhaupt da — sonst misst der Rest nichts', () => {
  // Ohne diese Zusicherung wäre die Datei darüber grün, wenn gar nichts gebaut
  // ist: `fehlt` überspringt, und übrig bliebe eine leere Liste.
  const gebaut = Object.keys(ERZEUGNISSE).filter((n) => existsSync(`${SHOP}${n}`));
  assert.ok(gebaut.length >= 1,
    'kein einziges Erzeugnis gebaut — zuerst npm run build und npm run website');
});
