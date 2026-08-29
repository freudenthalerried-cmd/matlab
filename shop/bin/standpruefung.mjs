#!/usr/bin/env node
/**
 * Findet Arbeitsdateien, die in `STATUS.md` nicht vorkommen.
 *
 *   npm run pruefe-stand
 *
 * **Warum es das gibt.** `STATUS.md` sagt von sich selbst: „Dieses Dokument
 * zuerst lesen. Hier steht, was gilt." Ein späterer Lauf richtet sich danach.
 * Genau deshalb ist eine Lücke darin teurer als eine Lücke sonstwo — sie
 * wirkt nicht auf einer Seite, sondern auf die nächste Arbeitsentscheidung.
 *
 * Zweimal in zwei Tagen ist das eingetreten:
 *
 * | Datum | Was dastand | Was gegolten hätte |
 * |---|---|---|
 * | 28.08. | `PARAMETER.md` forderte 32 % Rohmarge | Gate 20, Deckungsbeitrag in Euro |
 * | 29.08. | `STATUS.md` stellte Radon-Shop und Leadvermittlung gegenüber | Die Modellfrage ist seit dem 22. entschieden |
 *
 * Beide Male hat es ein Mensch beim Lesen gemerkt. Dieses Werkzeug merkt die
 * kleinere Schwester davon von selbst: **eine Arbeitsdatei, die entstanden
 * ist und die das Statusdokument nie erwähnt.** Am 29. August waren das 20
 * Dateien — der ganze Vortag, im Fließtext zusammengefasst und im
 * Verzeichnis nicht auffindbar.
 *
 * **Was es nicht kann.** Es liest keinen Inhalt und erkennt nicht, ob eine
 * genannte Aussage noch stimmt. Es beantwortet die Frage, die davor kommt:
 * *Weiß das Statusdokument überhaupt, dass es diese Datei gibt?* Ein
 * überholter Satz über eine genannte Datei bleibt Sache des Lesers.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HIER = dirname(fileURLToPath(import.meta.url));
const ORDNER = join(HIER, '..', '..', 'docs', 'baustoff-shop');
const STATUS = 'STATUS.md';

if (!existsSync(join(ORDNER, STATUS))) {
  console.error(`${join(ORDNER, STATUS)} fehlt — ohne Statusdokument keine Aussage.`);
  process.exit(2);
}

const status = readFileSync(join(ORDNER, STATUS), 'utf8');
const dateien = readdirSync(ORDNER)
  .filter((d) => d.endsWith('.md') && d !== STATUS)
  .sort();

// Ein Prüfer, dessen Voreinstellung nicht auf den Bestand zeigt, meldet
// „alles in Ordnung", weil er nichts gefunden hat.
if (dateien.length === 0) {
  console.error('Keine Arbeitsdatei gefunden — ein Abgleich über null Dateien ist kein Befund.');
  process.exit(2);
}

const ungenannt = dateien.filter((d) => !status.includes(d));

console.log(`\nStandabgleich: ${dateien.length} Arbeitsdateien gegen ${STATUS}\n`);
for (const d of ungenannt) console.log(`  ✗ ${d} — in ${STATUS} nicht genannt`);

console.log(`${dateien.length - ungenannt.length} von ${dateien.length} Dateien sind in ${STATUS} genannt.`);
if (ungenannt.length) {
  console.log(`${ungenannt.length} fehlen. Wer eine Datei anlegt und sie dort nicht einträgt,`);
  console.log('hat sie für den nächsten Lauf nicht angelegt.');
}
process.exit(ungenannt.length ? 1 : 0);
