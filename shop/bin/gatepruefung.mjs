#!/usr/bin/env node
/**
 * Steht jede Gate-Entscheidung noch im Bestand — oder nur noch im Dokument?
 *
 *   npm run pruefe-gates
 *
 * **Der Anlass, 7. September 2026.** Ein Gate ist die stärkste Festlegung
 * dieses Vorhabens; achtundzwanzig gibt es, und alles Spätere baut auf ihnen
 * auf. Gemessen wurde an diesem Tag zum ersten Mal, wie viele davon überhaupt
 * eine Spur im Bestand haben.
 *
 * > **Eine Entscheidung, die nur im Protokoll steht, ist eine
 * > Absichtserklärung.**
 *
 * Geprüft wird die **Sache**, nicht die Nummer: Ein Prüfer, der in den Quellen
 * nach „Gate 25" sucht, misst, ob jemand die Nummer in einen Kommentar
 * geschrieben hat — und belohnt genau das.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  QUELLE, gatesAusRegister, gatebefund, registerkopfbefund,
} from '../src/gatestand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const lies = (datei) => {
  try {
    return readFileSync(join(REPO, datei), 'utf8');
  } catch {
    return null;
  }
};

const register = lies(QUELLE);
if (register === null) {
  console.error(`Abbruch: ${QUELLE} gibt es nicht — ohne das Register gibt es nichts zu halten.`);
  process.exit(2);
}

const gates = gatesAusRegister(register);
if (!gates.length) {
  console.error(`Abbruch: in ${QUELLE} steht kein einziges Gate — der Abschnitt heißt anders,`);
  console.error('und ein Prüfer, der nichts findet, meldet sonst zu Recht nichts.');
  process.exit(2);
}

const b = gatebefund({ gates, lies });

// **Ergänzt am 9. September 2026.** Der Prüfer zählte die Gates und hielt
// seine Zahl nie gegen die, die das Dokument über sich selbst druckt: Der
// Kopf sagte „Vierundzwanzig Entscheidungen", die Überschrift siebenunddreißig
// Zeilen tiefer „Die einunddreißig Gates". Die Meldungen gehen in denselben
// Topf, damit ein Kopfbefund denselben Ausgang 1 erzeugt wie ein fehlendes
// Gate — eine falsche Zahl im maßgeblichen Dokument ist kein kleinerer Fehler.
const kopf = registerkopfbefund({ text: register, gates: gates.length });
b.meldungen.push(...kopf.meldungen);

console.log(`\nGate-Stand — ${b.gates} Gates aus ${QUELLE}\n`);
console.log(`  ${b.mitSpur} mit nachgewiesener Spur im Bestand`);
console.log(`  ${b.ohneSpur} ohne Spur, mit Grund\n`);

if (b.meldungen.length === 0) {
  console.log('Jede Entscheidung wirkt an einer Stelle — oder sagt, warum sie es nicht tut.');
  console.log('Geprüft ist die Sache, nicht die Nummer: Eine Gate-Nummer im Kommentar wäre');
  console.log('nur die Behauptung, das Gate sei umgesetzt.');
  process.exit(0);
}

for (const m of b.meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${b.meldungen.length} Meldung(en).`);
process.exit(1);
