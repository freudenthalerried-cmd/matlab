import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ABLAGEORT, belegname, belegordner, belegpfad, durchschriftenbefund, istBeleg, istJournal,
  journalpfad, NOETIGE_SPERREN, ortsbefund,
} from '../src/ablageort.js';

test('das Journal eines Jahres hat einen Pfad, und nur ein Jahr bekommt einen', () => {
  assert.equal(journalpfad(2026), 'ablage/journal-2026.jsonl');
  assert.throws(() => journalpfad('2026'), /Geschäftsjahr/);
});

test('ein Journal ist an seinem Namen zu erkennen, gleich wo es liegt', () => {
  assert.equal(istJournal('ablage/journal-2026.jsonl'), true);
  assert.equal(istJournal('irgendwo/tief/journal-2031.jsonl'), true);
  assert.equal(istJournal('journal.jsonl'), false, 'ohne Jahr ist es kein Geschäftsjahrjournal');
  assert.equal(istJournal('data/katalog-baustoff.json'), false);
});

test('eine .gitignore ohne die Sperre ist der Befund', () => {
  assert.ok(NOETIGE_SPERREN.length > 0, 'ohne nötige Sperre prüft diese Probe nichts');
  const b = ortsbefund({ gitignore: 'preise/\n', getrackt: ['a.js'], journaldateien: [] });
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen[0].regel, 'ort-nicht-gesperrt');
  // Der gesunde Zustand ist null Funde; die geprüfte Menge muss deshalb
  // mitgemeldet werden, sonst sieht „nichts gefunden" aus wie „nichts angesehen".
  assert.equal(b.geprueft, 1);
});

test('ein Kommentar in der .gitignore deckt nichts', () => {
  const b = ortsbefund({ gitignore: `# ${ABLAGEORT}/\n`, getrackt: [], journaldateien: [] });
  assert.equal(b.meldungen[0].regel, 'ort-nicht-gesperrt');
});

test('mit der Sperre und ohne Journal ist es still', () => {
  const b = ortsbefund({
    gitignore: `preise/\n${ABLAGEORT}/\n`,
    getrackt: ['shop/src/ablage.js'],
    journaldateien: [`${ABLAGEORT}/journal-2026.jsonl`],
  });
  assert.equal(b.sauber, true, JSON.stringify(b.meldungen));
});

test('ein getracktes Journal ist der Fall, der nicht mehr abzuwenden ist', () => {
  const b = ortsbefund({
    gitignore: `${ABLAGEORT}/\n`,
    getrackt: ['shop/ausgabe/journal-2026.jsonl'],
    journaldateien: ['shop/ausgabe/journal-2026.jsonl'],
  });
  const regeln = b.meldungen.map((m) => m.regel);
  assert.ok(regeln.includes('journal-im-verzeichnis'), JSON.stringify(regeln));
  // Es liegt zugleich am falschen Ort — beide Meldungen gehören genannt,
  // weil sie verschiedene Dinge verlangen: aufräumen und umziehen.
  assert.ok(regeln.includes('journal-am-falschen-ort'), JSON.stringify(regeln));
});

test('ein Journal außerhalb des Ortes ist der Fall vor dem Schaden', () => {
  const b = ortsbefund({
    gitignore: `${ABLAGEORT}/\n`,
    getrackt: [],
    journaldateien: ['shop/journal-2026.jsonl'],
  });
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'journal-am-falschen-ort');
});

/* ------------------------------------------------------------------ *
 * Die Zeile, die die Sperre aufhebt — 5. September 2026, abends
 *
 * `npm run reichweite` fand, dass `shop/.gitignore` von keinem Prüfer
 * geöffnet wird. Beim Nachziehen fiel das Schwerere auf: Die Prüfung suchte
 * die **Zeile**, nicht ihre **Wirkung**.
 *
 * > **Eine Sperre, die an ihrem Wortlaut geprüft wird und nicht an ihrer
 * > Wirkung, ist so gut wie die Zeile, die sie aufhebt.**
 * ------------------------------------------------------------------ */

test('eine Aufhebung hebt die Sperre auf — und fällt auf', () => {
  const mit = ortsbefund({ gitignore: `${ABLAGEORT}/\n` });
  assert.deepEqual(mit.meldungen.filter((m) => m.regel === 'ort-nicht-gesperrt'), []);

  // Genau der Fall: Die Zeile steht weiter da, und `includes` bleibt wahr.
  const aufgehoben = ortsbefund({ gitignore: `${ABLAGEORT}/\n!${ABLAGEORT}/\n` });
  const m = aufgehoben.meldungen.filter((x) => x.regel === 'ort-nicht-gesperrt');
  assert.equal(m.length, 1, JSON.stringify(aufgehoben.meldungen));
  assert.match(m[0].text, /wieder auf/);

  // Auch ohne Schrägstrich — git nimmt beide Formen.
  assert.equal(
    ortsbefund({ gitignore: `${ABLAGEORT}/\n!${ABLAGEORT}\n` })
      .meldungen.filter((x) => x.regel === 'ort-nicht-gesperrt').length,
    1,
  );
});

test('der Bestand steht: keine .gitignore hebt die Sperre auf', async () => {
  const { readdirSync } = await import('node:fs');
  const repo = fileURLToPath(new URL('../../', import.meta.url));
  const gefunden = [];
  const suche = (ordner) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      if (['node_modules', '.git', 'ausgabe'].includes(e.name)) continue;
      const voll = `${ordner}${e.name}`;
      if (e.isDirectory()) { suche(`${voll}/`); continue; }
      if (e.name === '.gitignore') gefunden.push(voll);
    }
  };
  suche(repo);
  // Ein leerer Lauf ist kein grüner.
  assert.ok(gefunden.length >= 2, `nur ${gefunden.length} .gitignore gefunden`);

  const zusammen = gefunden.map((d) => readFileSync(d, 'utf8')).join('\n');
  assert.deepEqual(
    ortsbefund({ gitignore: zusammen }).meldungen.filter((m) => m.regel === 'ort-nicht-gesperrt'),
    [],
  );
});


/* ------------------------------------------------------------------ *
 * Die Durchschrift (11. September 2026)
 *
 * Das Journal ist die Aufzeichnung, der Beleg ist der Beleg. § 132 BAO
 * verlangt beides sieben Jahre; bis heute schrieb `--ablegen` nur die Zeile.
 * ------------------------------------------------------------------ */

test('die Durchschrift heißt wie die Belegnummer, und ohne Nummer wie der Vorgang', () => {
  assert.equal(belegname({ art: 'rechnung', nummer: 'RE-2026-0001' }), 'RE-2026-0001.txt');
  // Die Auftragsbestätigung führt nach ARTEN bewusst keinen Nummernkreis —
  // rückführbar ist sie über den Vorgang (§ 131 Abs 1 Z 5 BAO).
  assert.equal(belegname({ art: 'auftragsbestaetigung', vorgang: '2026-0102' }), 'AB-2026-0102.txt');
  assert.throws(() => belegname({ art: 'auftragsbestaetigung' }), /Vorgangsnummer/);
  assert.throws(() => belegname({ art: 'erfunden', nummer: 'XX-2026-0001' }), /Unbekannte Vorgangsart/);
});

test('der Belegordner liegt in der Ablage und lässt sich umlenken', () => {
  assert.equal(belegordner(2026), 'belege-2026');
  assert.equal(belegpfad(2026, { art: 'rechnung', nummer: 'RE-2026-0001' }),
    `${ABLAGEORT}/belege-2026/RE-2026-0001.txt`);
  assert.throws(() => belegordner('2026'), /Geschäftsjahr/);
});

test('eine Durchschrift ist an ihrem Namen zu erkennen, gleich wo sie liegt', () => {
  assert.equal(istBeleg('ablage/belege-2026/RE-2026-0001.txt'), true);
  assert.equal(istBeleg('/tmp/AB-2026-0102.txt'), true);
  assert.equal(istBeleg('ablage/journal-2026.jsonl'), false);
  assert.equal(istBeleg('RECHNUNG.txt'), false);
  // Kein Kürzel aus ARTEN: keine Durchschrift.
  assert.equal(istBeleg('XX-2026-0001.txt'), false);
});

test('ein Eintrag ohne Durchschrift ist ein Befund — § 132 BAO verlangt den Beleg', () => {
  const b = durchschriftenbefund({
    eintraege: [{ lfd: 1, art: 'rechnung', nummer: 'RE-2026-0001', vorgang: '2026-0110' }],
    dateien: [],
  });
  assert.equal(b.sauber, false, 'ein Eintrag ohne Durchschrift blieb ohne Befund');
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'durchschrift-fehlt');
  assert.match(b.meldungen[0].text, /RE-2026-0001\.txt/);
});

test('eine Durchschrift ohne Eintrag ist die schwerere der beiden Richtungen', () => {
  const b = durchschriftenbefund({
    eintraege: [],
    dateien: [{ name: 'RE-2026-0001.txt', zeichen: 2400 }],
  });
  assert.equal(b.meldungen.length, 1, 'eine Durchschrift ohne Eintrag blieb ohne Befund');
  assert.equal(b.meldungen[0].regel, 'durchschrift-ohne-eintrag');
});

test('eine leere Datei zählt als fehlende Durchschrift', () => {
  const b = durchschriftenbefund({
    eintraege: [{ lfd: 1, art: 'rechnung', nummer: 'RE-2026-0001' }],
    dateien: [{ name: 'RE-2026-0001.txt', zeichen: 0 }],
  });
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'durchschrift-leer');
});

test('Journal und Durchschriften decken sich: keine Meldung', () => {
  const eintraege = [
    { lfd: 1, art: 'angebot', nummer: 'AN-2026-0102', vorgang: '2026-0102' },
    { lfd: 2, art: 'auftragsbestaetigung', nummer: null, vorgang: '2026-0102' },
    { lfd: 3, art: 'rechnung', nummer: 'RE-2026-0001', vorgang: '2026-0102' },
  ];
  assert.equal(eintraege.length, 3, 'drei Belegarten, zwei Namensregeln');
  const b = durchschriftenbefund({
    eintraege,
    dateien: eintraege.map((e) => ({ name: belegname(e), zeichen: 1800 })),
  });
  assert.equal(b.sauber, true, JSON.stringify(b.meldungen));
  assert.equal(b.geprueft, 6);
});

test('eine getrackte Durchschrift ist derselbe Fall wie ein getracktes Journal', () => {
  const b = ortsbefund({
    gitignore: NOETIGE_SPERREN.join('\n'),
    getrackt: ['ablage/belege-2026/RE-2026-0001.txt'],
    belegdateien: ['shop/RE-2026-0002.txt'],
  });
  const regeln = b.meldungen.map((m) => m.regel);
  assert.deepEqual(regeln, ['beleg-im-verzeichnis', 'beleg-am-falschen-ort']);
});


/* ------------------------------------------------------------------ *
 * Dieselbe Zahl, zweimal geschrieben (12. September 2026)
 *
 * Das Journal wächst nur, und eine gelöschte oder vertauschte Zeile deckt
 * `lfd` auf. Eine **geänderte** deckte nichts auf — bis es die Durchschrift
 * gibt, auf der dieselben Zahlen ein zweites Mal stehen.
 * ------------------------------------------------------------------ */

const PAPIER = [
  'Rechnung RE-2026-0001',
  'Ausstellungsdatum: 2026-09-11',
  'Lieferdatum: 2026-09-09',
  'Gesamtbetrag             911,06 €',
].join('\n');

const ZEILE = {
  lfd: 1,
  art: 'rechnung',
  nummer: 'RE-2026-0001',
  zeitpunkt: '2026-09-11',
  vorgang: '2026-0110',
  betragBrutto: 911.06,
};

test('Journalzeile und Durchschrift sagen dasselbe: keine Meldung', () => {
  const b = durchschriftenbefund({
    eintraege: [ZEILE],
    dateien: [{ name: 'RE-2026-0001.txt', zeichen: PAPIER.length, text: PAPIER }],
  });
  assert.equal(b.sauber, true, JSON.stringify(b.meldungen));
});

test('ein nachträglich geänderter Betrag im Journal fällt am Papier auf', () => {
  // Wer im Texteditor aus 911,06 die Zahl 91,06 macht, bekommt ein Journal,
  // das sauber zurückliest — die Form wächst ja weiter nur.
  const b = durchschriftenbefund({
    eintraege: [{ ...ZEILE, betragBrutto: 91.06 }],
    dateien: [{ name: 'RE-2026-0001.txt', zeichen: PAPIER.length, text: PAPIER }],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['betrag-weicht-ab'],
    'ein geänderter Betrag blieb unbemerkt');
  // Und der Betrag selbst steht **nicht** in der Meldung: Ein Prüfer, der
  // Kundendaten protokolliert, verlegt sie an einen dritten Ort.
  assert.ok(!b.meldungen[0].text.includes('91,06'));
  assert.ok(!b.meldungen[0].text.includes('911,06'));
});

test('ein geänderter Zeitpunkt fällt auf — § 131 Abs 1 Z 2 BAO verlangt die Zeitfolge', () => {
  const b = durchschriftenbefund({
    eintraege: [{ ...ZEILE, zeitpunkt: '2026-09-10' }],
    dateien: [{ name: 'RE-2026-0001.txt', zeichen: PAPIER.length, text: PAPIER }],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['zeitpunkt-weicht-ab']);
});

test('eine geänderte Nummer auf dem Papier fällt an der Journalzeile auf', () => {
  // Die andere Richtung: Der Dateiname stimmt weiter, der Text nicht mehr.
  const b = durchschriftenbefund({
    eintraege: [ZEILE],
    dateien: [{
      name: 'RE-2026-0001.txt',
      zeichen: PAPIER.length,
      text: PAPIER.replace('RE-2026-0001', 'RE-2026-0009'),
    }],
  });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['nummer-weicht-ab']);
});

test('ohne gelesenen Text bleibt es beim Namensabgleich', () => {
  // `dateien` ohne `text` ist der Fall der reinen Dateiliste — sie prüft
  // weiter, was sie prüfen kann, statt eine Abweichung zu behaupten.
  const b = durchschriftenbefund({
    eintraege: [{ ...ZEILE, betragBrutto: 1 }],
    dateien: [{ name: 'RE-2026-0001.txt', zeichen: 2400 }],
  });
  assert.equal(b.sauber, true);
});
