#!/usr/bin/env node
/**
 * Der Weg bis zur Entscheidung, als Kette gerechnet.
 *
 *   npm run rollout
 *
 * Zwölftes Ergebnis des Ursprungsauftrags. Es stand als *offen* im
 * Auftragsabgleich, mit der Begründung, eine Zeitachse ließe sich ohne
 * gemessene Kaufquote nicht ehrlich schreiben. Das gilt für einen Kalender
 * und nicht für einen Plan: Was sich rechnen lässt, ist die Kette der
 * Abhängigkeiten und die Länge des Strangs, der sie bestimmt.
 *
 * Die Zahlen kommen aus `data/zielgroessen.json`, `bin/kampagne.mjs`
 * (Tagesbudget) und `src/werbewirkung.js` (Abbruchschwelle). Nichts davon
 * steht hier noch einmal.
 */

import { rolloutplan, ETAPPEN, pruefeEtappen , HAUPTFALL } from '../src/rollout.js';
import { ZUSTAENDIGKEITEN } from '../src/offenepunkte.js';

const MARKT = [0.5, 1.5, 2.5];
const QUOTEN = [0.02, 0.01, 0.005];

// **Verschoben am 3. September** nach `src/rollout.js`: Der Hauptfall ist eine
// Modellannahme und keine Werkzeugeinstellung. Seit die PR-Beschreibung die
// Etappenzahl und die Gesamtdauer nennt, misst `pruefe-schaufenster` sie — und
// zwei Wege zur selben Zahl sind einer zu viel.
const HAUPT = HAUPTFALL;
const TAGESBUDGET = HAUPT.tagesbudget;
const FRIST = HAUPT.frist;

const tag = (n) => (n === 0 ? 'Tag 0' : `Tag ${n}`);
const artZeichen = { gerechnet: 'gerechnet', gesetzt: 'gesetzt', fremdbestimmt: 'Wartezeit auf Dritte' };

// Vor dem Rechnen die Form. Ein Plan, dessen Abhängigkeiten unbegründet sind,
// rechnet trotzdem — er rechnet nur etwas anderes, als er behauptet. Genau das
// war er bis zum 2. September: `lieferantengespraech` hing an nichts und
// begann an Tag 0, obwohl der Brief eine Rückantwortadresse braucht.
const formfehler = pruefeEtappen();
if (formfehler.length > 0) {
  console.error(`Abbruch: ${formfehler.length} Etappe(n) ohne belastbaren Grund.\n`);
  for (const f of formfehler) console.error(`  \u2717 ${f}`);
  console.error('\nEine fehlende Abhängigkeit verkürzt die Kette und sieht aus wie ein guter Plan.');
  process.exit(2);
}

const r = rolloutplan(HAUPT);

console.log(`Weg bis zur Entscheidung — ${ETAPPEN.length} Etappen, Frist ${FRIST} Tage`);
console.log(`Hauptfall: ${TAGESBUDGET.toFixed(2)} € Tagesbudget, ${HAUPT.klickpreis.toFixed(2)} € je Klick, `
  + `Kaufquote ${(HAUPT.quote * 100).toFixed(1)} % auszuschließen\n`);

console.log('Tag 0 ist nicht heute. Tag 0 ist der Tag, an dem der Auftraggeber');
console.log('den ersten Schritt auslöst — vorher steht die Kette still.\n');

// Wochen, weil der Auftrag einen Wochenplan verlangt — und Tage daneben, weil
// eine Etappe von einem Tag sonst eine ganze Woche zu füllen scheint.
const wochen = (e) => {
  const von = Math.floor(e.beginntTag / 7) + 1;
  const bis = Math.floor(Math.max(e.beginntTag, e.fertigTag - 1) / 7) + 1;
  return von === bis ? `Woche ${von}` : `Woche ${von}–${bis}`;
};

for (const e of r.plan) {
  const strang = e.imStrang ? '›' : ' ';
  const dauer = e.dauer === 0 ? 'sofort' : `${e.dauer} ${e.dauer === 1 ? 'Tag' : 'Tage'}`;
  console.log(`${strang} ${wochen(e).padEnd(13)} ${tag(e.beginntTag)}–${e.fertigTag}  ${e.titel}`);
  console.log(`               ${dauer} (${artZeichen[e.art]}) · ${ZUSTAENDIGKEITEN[e.zustaendig].titel}`);
  console.log(`               Gate: ${e.gate ?? e.warumKeinGate}`);
  console.log(`               ${e.ergebnis}`);
  for (const v of e.brauchtVor) {
    // Der Grund steht mit: Eine Abhängigkeit ohne ihn ist die Sorte Zeile, die
    // niemand prüft, weil sie plausibel aussieht.
    console.log(`               braucht vorher: ${v.etappe} — ${v.warum}`);
  }
  console.log('');
}

console.log(`Bestimmender Strang (›): ${r.strang.join(' → ')}`);
console.log(`Gesamt ${r.gesamt} Tage — ${r.passt ? 'passt in die Frist' : 'PASST NICHT in die Frist'}.`);
console.log(`Davon ${r.versuch.versuchstage} Tage der Versuch selbst, `
  + `${r.wartenImStrang} Tage Warten auf Dritte, ${r.arbeitImStrang} Tage Arbeit.\n`);

console.log('> Der Versuch ist die längste Etappe, und vor ihm liegt fast nur Warten.');
console.log('> Wer den Termin halten will, verkürzt keine Arbeit — er löst früher aus.\n');

console.log('Was die Frist trägt und was nicht:\n');
console.log('  Quote    Klickpreis   Schwelle   Versuch   gesamt');
for (const quote of QUOTEN) {
  for (const klickpreis of MARKT) {
    const v = rolloutplan({ ...HAUPT, quote, klickpreis });
    console.log(
      `  ${(quote * 100).toFixed(1).padStart(4)} %   ${klickpreis.toFixed(2).padStart(7)} €   `
      + `${String(v.versuch.schwelleKlicks).padStart(8)}   ${String(v.versuch.versuchstage).padStart(5)} T   `
      + `${String(v.gesamt).padStart(5)} T   ${v.passt ? '' : '← über der Frist'}`,
    );
  }
}

console.log('');
console.log('Lesart: Eine Kaufquote von 1 % lässt sich innerhalb der Frist bei jedem');
console.log('Marktklickpreis ausschließen. Eine von 0,5 % nur am unteren Rand des');
console.log('Marktes — sonst reicht die Zeit nicht, und der Versuch endet ohne Urteil.');
console.log('');
console.log('Was dieser Plan nicht kann:');
console.log('  · Die Wartezeiten auf Dritte sind Annahmen, keine Zusagen. Eine Terminzusage');
console.log('    des Lieferanten oder des Rechtstexteanbieters ersetzt sie sofort.');
console.log('  · Ein Verkauf beendet den Versuch früher als jede Schwelle. Die Tabelle');
console.log('    rechnet den Fall, in dem keiner kommt — das ist die teure Richtung.');
console.log('  · Reicht das gemessene Suchvolumen das Budget nicht aus, dauert jede Zeile');
console.log('    länger als angeschrieben. Deshalb steht die Messung vor dem Schalten.');

/**
 * **Ergänzt am 3. September**, aus demselben Anlass wie bei `startklar`: Der
 * Plan druckte „passt in die Frist" oder „über der Frist" und endete beide
 * Male grün. Eine Kette, die nicht mehr in neunzig Tage passt, ist ein Befund
 * und keine Fußnote.
 */
if (!r.passt && !process.argv.includes('--bericht')) {
  console.log(`\nDie Kette passt mit ${r.gesamt} Tagen nicht in die Frist von ${r.frist}.`);
  console.log('Mit --bericht endet dieser Lauf trotzdem grün.');
  process.exit(1);
}
process.exit(0);
