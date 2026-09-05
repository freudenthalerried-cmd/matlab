import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ABLAGEORT, istJournal, journalpfad, NOETIGE_SPERREN, ortsbefund } from '../src/ablageort.js';

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
