/**
 * Der Brief an den Rechtstexteanbieter — und die Sperre davor.
 *
 * **Der Anlass, 5. September 2026.** `npm run pruefe-sperren` hat gemeldet:
 * `darfBeauftragtWerden` — **keine einzige Probe ruft sie auf.**
 *
 * Sie wurde nur mittelbar berührt: `test/fremdtext.test.js` prüft am fertigen
 * Brief, dass er ohne Rückantwortadresse `versandfaehig: false` trägt. Das
 * ist die rote Richtung über einen Umweg. Die Sperre selbst hat niemand
 * angefasst, und **dass der Brief je hinausdarf, hat niemand gezeigt.**
 *
 * Der Auftrag ist einer der wenigen Ausgänge dieses Hauses an einen Dritten.
 * Eine Sperre davor, von der niemand weiß, ob sie aufgeht, hieße: Der
 * Auftraggeber gibt die Rechtstexte frei, und der Brief bleibt liegen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { darfBeauftragtWerden, erzeugeRechtstexteauftrag } from '../src/rechtstexteauftrag.js';

/** Was der Brief mindestens braucht: Absender, Antwortweg, Firmenbuch, Sitz. */
const betreiber = {
  firma: 'Testbetrieb e.U.',
  email: 'office@testbetrieb.at',
  telefon: '+43 7238 1234',
  firmenbuchnummer: 'FN 123456x',
  plz: '4310',
  ort: 'Ried in der Riedmark',
};

const inhalt = {
  pflichttexte: [{ id: 'datenschutz', abWann: 'besuch', grundlage: 'Art. 13 DSGVO', warum: 'gilt ab Aufruf' }],
  agbGliederung: [{ nr: 1, titel: 'Geltungsbereich', hinweis: 'nur Unternehmer' }],
  datenschutzGliederung: ['Verantwortlicher'],
  websiteVerarbeitung: [{ was: 'Warenkorb', befund: 'bleibt im Browser' }],
  b2b: { entfaellt: ['Widerruf'], bleibt: ['Gewährleistung'] },
  datenfluesse: [],
  offeneImpressumsfelder: [],
};

test('Mit vollständigem Absender darf der Auftrag hinaus', () => {
  const f = darfBeauftragtWerden(betreiber);
  assert.equal(f.darf, true, f.gruende.join(' | '));
  assert.deepEqual(f.gruende, []);
});

test('Der fertige Brief trägt dieselbe Erlaubnis', () => {
  // Die Sperre grün und der Brief trotzdem gesperrt wäre die schlimmere
  // Fassung des Fehlers: eine Prüfung, deren Ergebnis unterwegs verloren geht.
  const e = erzeugeRechtstexteauftrag({ betreiber, ...inhalt });
  assert.equal(e.versandfaehig, true, JSON.stringify(e.gruende));
  assert.ok(e.text.includes(betreiber.firma), 'der Absender steht nicht im Brief');
  assert.ok(!e.text.includes('FEHLT'), 'ein versandfähiger Brief trägt keine sichtbare Lücke');
});

/**
 * Jeder der fünf Gründe einzeln. Zusammen mit dem grünen Fall oben ist damit
 * beides gezeigt: dass sie hält und dass sie nachgibt.
 */
test('Jede fehlende Pflichtangabe hält den Auftrag an — einzeln', () => {
  const faelle = [
    ['email', /E-Mail/],
    ['telefon', /Telefon/],
    ['firma', /Firmenname/],
    ['firmenbuchnummer', /Firmenbuch/],
    ['ort', /Sitz/],
  ];
  assert.equal(faelle.length, 5, 'weniger Fälle als Gründe wären eine halbe Prüfung');
  for (const [feld, muster] of faelle) {
    const f = darfBeauftragtWerden({ ...betreiber, [feld]: '' });
    assert.equal(f.darf, false, `ohne ${feld} müsste der Brief liegen bleiben`);
    assert.equal(f.gruende.length, 1, `${feld}: ${f.gruende.join(' | ')}`);
    assert.match(f.gruende[0], muster);
  }
});

test('Ohne jede Angabe nennt die Sperre alle fünf Gründe', () => {
  const f = darfBeauftragtWerden();
  assert.equal(f.darf, false);
  assert.equal(f.gruende.length, 5, f.gruende.join(' | '));
});
