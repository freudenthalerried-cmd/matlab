#!/usr/bin/env node
/**
 * Wirkt jede Weisung des Auftraggebers im Bestand — oder steht sie nur da?
 *
 *   npm run pruefe-weisungen
 *
 * **Der Anlass, 7. September 2026.** `npm run pruefe-auftrag` misst den
 * Ursprungsauftrag vom 9. August. Was der Auftraggeber **danach** angeordnet
 * hat — acht Weisungen, zwei davon haben frühere Arbeit vollständig
 * umgeworfen —, stand in einer Tabelle und in keinem Prüfer.
 *
 * > **Eine Weisung, die nur im Protokoll steht, ist ein Missverständnis mit
 * > Datum.**
 *
 * Drei Zustände: erfüllt, offen und geführt, vergessen. Der dritte ist der
 * Grund für diesen Prüfer.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  QUELLE, WEISUNGEN, KOPFZEILEN, weisungenAusParametern, weisungsbefund, quellenbefund,
} from '../src/weisungsstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const lies = (datei) => {
  try {
    return readFileSync(join(REPO, datei), 'utf8');
  } catch {
    return null;
  }
};

const parameter = lies(QUELLE);
if (parameter === null) {
  console.error(`Abbruch: ${QUELLE} gibt es nicht — ohne die Weisungen gibt es nichts zu halten.`);
  process.exit(2);
}

const weisungen = weisungenAusParametern(parameter);
if (!weisungen.length) {
  console.error(`Abbruch: in ${QUELLE} steht keine einzige Weisung — der Abschnitt heißt anders,`);
  console.error('und ein Prüfer, der nichts findet, meldet sonst zu Recht nichts.');
  process.exit(2);
}

const b = weisungsbefund({ weisungen, lies });

console.log(`\nWeisungsstand — ${b.weisungen} Weisungen aus ${QUELLE}\n`);
for (const w of WEISUNGEN) {
  const zeichen = w.offen ? '○' : '✓';
  const wo = (w.spuren ?? [w.offen]).map((s) => s.datei.replace(/^shop\//, '')).join(', ');
  console.log(`  ${zeichen} ${w.datum} ${w.stichwort}`);
  console.log(`      ${w.offen ? 'offen, geführt in' : 'wirkt in'} ${wo}`);
}
console.log(`\n  ${b.erfuellt} erfüllt, ${b.offen} offen und geführt, 0 vergessen\n`);

/*
 * **Die andere Richtung, seit dem 11. September 2026.** Bis dahin hielt
 * dieser Prüfer die Tafel gegen den Bestand und meldete „0 vergessen". Die
 * Zahl stimmte und sagte weniger, als sie klang: **Er misst die Tafel, nicht
 * das, was der Auftraggeber gesagt hat.** Fünf Weisungen standen in
 * Dokumenten, die sie im Wortlaut festhalten, und in keiner Zeile — darunter
 * die vom 3. September, die Überschrift der Startseite solle nicht bleiben.
 * Acht Tage später stand sie noch da.
 *
 * > **Ein Prüfer, der eine Liste gegen den Bestand hält, misst die Liste.**
 */
const DOKUMENTE = join(REPO, 'docs', 'baustoff-shop');
const dokumente = readdirSync(DOKUMENTE)
  .filter((n) => n.endsWith('.md'))
  .map((datei) => ({
    datei,
    kopf: readFileSync(join(DOKUMENTE, datei), 'utf8').split('\n').slice(0, KOPFZEILEN).join('\n'),
  }));

const q = quellenbefund(dokumente, weisungen, parameter);
console.log(`  ${q.quellen} Dokumente halten eine Weisung im Wortlaut fest, `
  + `${q.ausnahmen} mit Grund davon ausgenommen\n`);
/*
 * **Zusammengerechnet, nicht angehängt.** Der erste Wurf schob die neuen
 * Meldungen in `b.meldungen` — und `b.sauber` stand da schon fest. Der Prüfer
 * hätte den Fund ausgegeben und wäre grün geblieben; die Gegenprobe hat es in
 * der ersten Minute gezeigt.
 *
 * > **Ein Prüfer, der einen Fund ausgibt und grün endet, ist schlimmer als
 * > einer, der nichts findet: Man liest ihn und glaubt, es sei nichts.**
 */
const meldungen = [...b.meldungen, ...q.meldungen];

if (!meldungen.length) {
  console.log('Jede Weisung wirkt an einer Stelle — oder steht als offener Punkt in der Liste.');
  console.log('Der Unterschied zwischen „offen" und „vergessen" ist genau diese Zeile.');
  console.log('Und jedes Dokument, das eine Weisung im Wortlaut festhält, hat seine Zeile.');
  process.exit(0);
}

for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${meldungen.length} Meldung(en).`);
process.exit(1);
