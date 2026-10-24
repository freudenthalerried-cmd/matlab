/**
 * Die Form der Betreiberangaben.
 *
 * **Der Befund, 4. September 2026.** `pruefeBetreiberdaten` prüft seit dem
 * 26. August, ob die Pflichtangaben des Impressums **dastehen**. Ob sie
 * stimmen, prüft nichts — und zwei von ihnen tragen weiter als das Impressum:
 * Die UID steht nach § 11 UStG auf jeder Rechnung über 400 €, die
 * Firmenbuchnummer trägt die Offenlegung nach § 25 MedienG.
 *
 * `uidPruefzifferStimmt` gibt es seit dem 27. August. Sie bewacht die UID des
 * **Kunden**. Die **eigene** hat sie nie gesehen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { FORMREGELN, pruefeBetreiberform } from '../src/betreiberform.js';
import { ZULIEFERUNGEN } from '../src/zettel.js';
import { IMPRESSUMSFELDER } from '../src/rechtstexte.js';

const betreiber = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/betreiber.json', import.meta.url)), 'utf8',
));

test('jede Formregel nennt ein Beispiel und einen Grund', () => {
  assert.ok(FORMREGELN.length >= 5, `nur ${FORMREGELN.length} Regeln`);
  const felder = new Set(IMPRESSUMSFELDER.map((f) => f.feld));
  const zettelfelder = new Set(ZULIEFERUNGEN.map((z) => z.feld));
  for (const r of FORMREGELN) {
    /*
     * **Erweitert am 10. September.** Bis dahin musste jede Formregel ein
     * Impressumsfeld betreffen — was stimmte, solange alle es waren. Die Regel
     * für `antwortzeitWerktage` betrifft keine Pflichtangabe nach § 5 ECG,
     * sondern eine **Zusage an den Kunden**, die der Shop selbst macht. Was der
     * Fall verlangt, ist deshalb nicht „steht im Impressum", sondern „wird
     * irgendwo verlangt": im Impressum oder auf dem Zettel der Zulieferungen.
     * Eine Formregel für ein Feld, das nirgends verlangt wird, prüft die Form
     * von etwas, das niemand einträgt.
     */
    assert.ok(felder.has(r.feld) || zettelfelder.has(r.feld),
      `${r.feld}: wird weder im Impressum noch auf dem Zettel verlangt`);
    /*
     * **Gelockert am 10. September, mit Grund.** Die Untergrenze von vier
     * Zeichen war eine Faustregel aus den Anschriftsfeldern: Sie sollte den
     * faulen Platzhalter („x") abfangen. Für eine Zahl ist sie sinnlos — das
     * Beispiel für eine Antwortzeit in Werktagen ist eine Ziffer, und länger
     * zu schreiben hieße, ein falsches Beispiel zu geben. Was wirklich
     * schützt, steht zwei Zeilen tiefer: Das Beispiel muss seiner eigenen
     * Regel genügen. Ein Platzhalter tut das nicht.
     */
    const zahlbeispiel = Number.isFinite(Number(r.beispiel));
    assert.ok(r.beispiel && (String(r.beispiel).length >= 4 || zahlbeispiel),
      `${r.feld}: ohne Beispiel`);
    assert.ok(r.warum && r.warum.length >= 80, `${r.feld}: ohne belastbaren Grund`);
    // Das Beispiel muss seiner eigenen Regel genügen — sonst führt es in die Irre.
    assert.ok(r.pruefe(r.beispiel), `${r.feld}: das Beispiel „${r.beispiel}" scheitert an der eigenen Regel`);
  }
});

test('eine falsch getippte UID fällt auf', () => {
  // ATU12345675 trägt die richtige Prüfziffer, ATU12345678 nicht.
  assert.equal(pruefeBetreiberform({ uid: 'ATU12345675' }).sauber, true);
  const falsch = pruefeBetreiberform({ uid: 'ATU12345678' });
  assert.equal(falsch.sauber, false);
  assert.equal(falsch.maengel[0].feld, 'uid');
  // Leerzeichen und Kleinschreibung sind kein Fehler, sondern Schreibweise.
  assert.equal(pruefeBetreiberform({ uid: 'atu 1234 5675' }).sauber, true);
});

test('eine Firmenbuchnummer ohne FN und ohne Prüfbuchstaben fällt auf', () => {
  assert.equal(pruefeBetreiberform({ firmenbuchnummer: 'FN 347938z' }).sauber, true);
  assert.equal(pruefeBetreiberform({ firmenbuchnummer: '347938' }).sauber, false);
  assert.equal(pruefeBetreiberform({ firmenbuchnummer: 'FN 347938' }).sauber, false);
});

test('eine leere Angabe ist kein Formfehler, sondern ein offener Punkt', () => {
  const e = pruefeBetreiberform({ uid: '', telefon: '   ' });
  assert.equal(e.sauber, true);
  assert.equal(e.geprueft, 0);
  assert.equal(e.offen, FORMREGELN.length);
  // Sonst gäbe es zwei Prüfungen über dieselbe Sache, die einander widersprechen.
});

test('der Bestand hält, soweit er gefüllt ist', () => {
  const e = pruefeBetreiberform(betreiber);
  assert.deepEqual(e.maengel, []);
  assert.ok(e.geprueft >= 1, 'keine gefüllte Angabe geprüft — dann sagt dieser Fall nichts');
});

test('PLZ, E-Mail und Telefon werden grob geprüft', () => {
  assert.equal(pruefeBetreiberform({ plz: '4312' }).sauber, true);
  assert.equal(pruefeBetreiberform({ plz: '431' }).sauber, false);
  assert.equal(pruefeBetreiberform({ email: 'office@bauversand.com' }).sauber, true);
  assert.equal(pruefeBetreiberform({ email: 'office.bauversand.com' }).sauber, false);
  assert.equal(pruefeBetreiberform({ telefon: '+43 7238 12345' }).sauber, true);
  assert.equal(pruefeBetreiberform({ telefon: 'Anruf genügt' }).sauber, false);
});
