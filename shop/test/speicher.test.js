import test from 'node:test';
import assert from 'node:assert/strict';
import {
  neueAblage,
  naechsteNummer,
  haltefest,
  stelleRechnungAus,
  storniere,
  pruefeNummernkreis,
  pruefeAblagefelder,
} from '../src/ablage.js';
import { journalzeile, ausJournal } from '../src/speicher.js';
import { hatSteuerzeichen } from '../src/format.js';

const vollstaendig = {
  vollstaendig: true,
  fehlend: [],
  nettobetrag: 3250.17,
  bruttobetrag: 3900.2,
  text: 'Rechnung … Gesamtbetrag 3.900,20 €',
};

/** Eine Ablage mit Gedächtnis in ein Zeilen-Sammelbecken. */
function mitJournal() {
  const zeilen = [];
  const ablage = neueAblage({ schreibe: (e) => zeilen.push(journalzeile(e)) });
  return { ablage, zeilen, journal: () => zeilen.join('\n') };
}

test('Was durch die Ablage läuft, liest sich aus dem Journal identisch zurück', () => {
  const { ablage, journal } = mitJournal();
  haltefest(ablage, { art: 'uidabfrage', zeitpunkt: '2026-08-16T09:00', vorgang: 'V-1', text: 'UID gueltig' });
  const r = stelleRechnungAus(ablage, vollstaendig, { zeitpunkt: '2026-08-16', jahr: 2026, vorgang: 'V-1' });
  storniere(ablage, r.nummer, { grund: 'Irrtum', zeitpunkt: '2026-08-17', jahr: 2026 });

  const neu = ausJournal(journal());
  assert.deepEqual(neu.eintraege, ablage.eintraege);
  assert.deepEqual(neu.zaehler, ablage.zaehler);
  assert.equal(pruefeAblagefelder(neu).dicht, true);
});

test('Eine gezogene, nie festgehaltene Nummer bleibt nach dem Neuladen vergeben', () => {
  const { ablage, journal } = mitJournal();
  const gezogen = naechsteNummer(ablage, 'rechnung', 2026);
  assert.equal(gezogen, 'RE-2026-0001');

  const neu = ausJournal(journal());
  const kreis = pruefeNummernkreis(neu, 'rechnung', 2026);
  assert.equal(kreis.lueckenlos, false, 'die Lücke bleibt sichtbar und erklärungsbedürftig');
  assert.deepEqual(kreis.fehlend, ['RE-2026-0001']);

  assert.equal(naechsteNummer(neu, 'rechnung', 2026), 'RE-2026-0002', 'die Eins darf nie wieder vergeben werden');
});

test('Ohne Journal wäre dieselbe Nummer zweimal vergeben worden — der Beweis der Notwendigkeit', () => {
  const fluechtig = neueAblage();
  const erste = naechsteNummer(fluechtig, 'rechnung', 2026);
  const nachNeustart = neueAblage();
  const zweite = naechsteNummer(nachNeustart, 'rechnung', 2026);
  assert.equal(erste, zweite, 'genau das verbietet § 11 — und genau das verhindert das Journal');
});

test('Auch ein Journal ohne Vergabezeilen vergibt keine Nummer doppelt', () => {
  const { ablage, zeilen } = mitJournal();
  stelleRechnungAus(ablage, vollstaendig, { zeitpunkt: '2026-08-16', jahr: 2026, vorgang: 'V-1' });

  const nurEintraege = zeilen.filter((z) => JSON.parse(z).typ === 'eintrag');
  assert.equal(nurEintraege.length, 1, 'eine Eintragszeile bleibt übrig');

  const neu = ausJournal(nurEintraege.join('\n'));
  assert.equal(naechsteNummer(neu, 'rechnung', 2026), 'RE-2026-0002');
});

test('Erst das Journal, dann der Speicher: eine werfende Senke lässt nichts zurück', () => {
  const ablage = neueAblage({
    schreibe: () => {
      throw new Error('Platte voll');
    },
  });

  assert.throws(() => naechsteNummer(ablage, 'rechnung', 2026), /Platte voll/);
  assert.deepEqual(ablage.zaehler, {}, 'der Zähler ist nicht gestiegen');

  assert.throws(() => haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16' }), /Platte voll/);
  assert.equal(ablage.eintraege.length, 0, 'kein Eintrag im Arbeitsspeicher, den das Journal nie sah');
});

test('Ein mehrzeiliger Betreff bleibt eine Journalzeile und liest sich zeichengenau zurück', () => {
  const gift = 'Betreff\nmit Umbruch und Trenner;\tTab\u2028quer';
  const { ablage, zeilen, journal } = mitJournal();
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16', text: gift });

  assert.equal(zeilen.length, 1);
  assert.equal(hatSteuerzeichen(zeilen[0]), false, 'die Zeile selbst trägt kein einziges Steuerzeichen');

  const neu = ausJournal(journal());
  assert.equal(neu.eintraege[0].text, gift, 'bewahrt, nicht entschärft — § 131 BAO');
});

test('Ein Feld ohne Verzeichniseintrag macht das Laden zur Migrationsfrage', () => {
  const { ablage, zeilen } = mitJournal();
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16', text: 'x' });
  const beschaedigt = JSON.parse(zeilen[0]);
  beschaedigt.eintrag.storniert = false;

  assert.throws(() => ausJournal(JSON.stringify(beschaedigt)), /„storniert".*Migrationsfrage/);
});

test('Ein fehlendes Verzeichnisfeld macht das Laden ebenso zur Migrationsfrage', () => {
  const { ablage, zeilen } = mitJournal();
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16', text: 'x' });
  const beschaedigt = JSON.parse(zeilen[0]);
  delete beschaedigt.eintrag.bezugAuf;

  assert.throws(() => ausJournal(JSON.stringify(beschaedigt)), /„bezugAuf" fehlt.*Migrationsfrage/);
});

test('Eine gerissene Zeitfolge bricht das Laden ab', () => {
  const { ablage, zeilen } = mitJournal();
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16', text: 'eins' });
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16', text: 'zwei' });

  const ohneErste = zeilen.slice(1).join('\n');
  assert.throws(() => ausJournal(ohneErste), /Zeile 1: lfd 2 statt 1.*Zeitfolge/);
});

test('Unlesbares JSON und unbekannte Zeilentypen werden mit Zeilennummer abgewiesen', () => {
  // Mit ausgeglichener Klammer, sonst zählt der grobe Klammerzähler der
  // Testprüfung diesen Fall nicht mit — ungültiges JSON ist es so oder so.
  assert.throws(() => ausJournal('{kaputt}'), /Zeile 1: kein gültiges JSON/);
  assert.throws(() => ausJournal('{"typ":"kassensturz"}'), /Zeile 1: unbekannter Zeilentyp kassensturz/);
  assert.throws(
    () => ausJournal('{"typ":"nummernvergabe","art":"erfunden","jahr":2026,"nummer":"XX-2026-0001"}'),
    /unbekannte Vorgangsart erfunden/,
  );
});

test('Leerzeilen stören nicht — ein Journal endet mit einem Zeilenumbruch', () => {
  const { ablage, journal } = mitJournal();
  haltefest(ablage, { art: 'vermerk', zeitpunkt: '2026-08-16', text: 'x' });

  const neu = ausJournal(journal() + '\n');
  assert.equal(neu.eintraege.length, 1);
});

test('journalzeile nimmt nur die zwei bekannten Ereignistypen an', () => {
  assert.throws(() => journalzeile({ typ: 'schnappschuss' }), /Unbekannter Zeilentyp/);
  assert.throws(() => journalzeile(null), /Unbekannter Zeilentyp/);
});

test('Die wiederaufgebaute Ablage schreibt weiter ins Journal', () => {
  const { ablage, journal } = mitJournal();
  stelleRechnungAus(ablage, vollstaendig, { zeitpunkt: '2026-08-16', jahr: 2026, vorgang: 'V-1' });

  const zeilenDanach = [];
  const neu = ausJournal(journal(), { schreibe: (e) => zeilenDanach.push(journalzeile(e)) });
  stelleRechnungAus(neu, vollstaendig, { zeitpunkt: '2026-08-17', jahr: 2026, vorgang: 'V-2' });

  assert.equal(zeilenDanach.length, 2, 'Vergabe und Eintrag der zweiten Rechnung');
  assert.match(zeilenDanach[0], /RE-2026-0002/);
});

/* ------------------------------------------------------------------ *
 * Wachen am Journal, die der Testlauf bis zum 31.08. nie erreicht hat
 * ------------------------------------------------------------------ */

/**
 * **Gemessen, nicht vermutet.** Ein Deckungslauf über die ganze Testsuite
 * (`node --test --experimental-test-coverage`) hat fünf `throw`-Wachen in
 * `src/` benannt, die kein Testfall je auslöst. Zwei davon stehen hier.
 *
 * Sie sind keine Formsache: Das Journal ist die unveränderbare Aufzeichnung
 * der Vorgänge. Eine kaputte Zeile darf beim Laden **auffallen**, nicht
 * übersprungen werden — ein Journal, das sich stillschweigend lückenhaft
 * lädt, ist schlimmer als eines, das sich weigert.
 */
const journalZeile = (eintrag) => JSON.stringify({ typ: 'eintrag', eintrag: {
  lfd: 1, art: 'uidabfrage', nummer: null, zeitpunkt: '2026-08-16T09:00',
  vorgang: 'V-1', betragNetto: null, betragBrutto: null, text: 'x', bezugAuf: null,
  ...eintrag,
} });

test('Eine unlesbare Belegnummer im Journal wird gemeldet, nicht überlesen', () => {
  // `hebeZaehler` liest Jahr und laufende Nummer aus der Belegnummer, um den
  // Zähler nachzuziehen. Steht dort etwas anderes, wäre der Zähler still
  // falsch — und die **nächste** vergebene Nummer eine bereits vergebene.
  const kaputt = journalZeile({ art: 'rechnung', nummer: 'RE-zweitausend-x' });
  assert.throws(() => ausJournal(kaputt), /keine lesbare Belegnummer/);
  assert.throws(() => ausJournal(kaputt), /Zeile 1/);
});

test('Eine unbekannte Vorgangsart im Journal wird gemeldet, nicht überlesen', () => {
  // Die Gegenrichtung steht darunter: Eine bekannte Art muss durchkommen,
  // sonst prüfte dieser Fall nur, dass überhaupt etwas fliegt.
  assert.throws(() => ausJournal(journalZeile({ art: 'quittung' })),
    /unbekannte Vorgangsart quittung/);
  assert.doesNotThrow(() => ausJournal(journalZeile({ art: 'uidabfrage' })));
});
