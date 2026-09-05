/**
 * Die oberste Tafel — und ob sie noch stimmt.
 *
 * `docs/baustoff-shop/PARAMETER.md` rangiert nach eigener Aussage **über dem
 * Gate-Register**: Was dort steht, gilt. Genau deshalb ist es teuer, wenn dort
 * etwas Überholtes steht, und die Datei sagt das in ihrem eigenen Kopf — sie
 * trug bis zum 28. August eine Margenuntergrenze aus einem abgelösten Modell.
 *
 * **Am 3. September dasselbe eine Ebene kleiner.** Die Weisungstafel endete am
 * 28. August. Die Domainweisung vom 31. („bauversand.com verwenden") stand
 * nicht darin — obwohl sie in `data/betreiber.json` eingetragen war und beide
 * Bauwerkzeuge sie verwenden.
 *
 * > **Eine Entscheidung, die nur im Code ankommt, ist im Verzeichnis weiter
 * > offen.** Wer nachliest, was gilt, findet die abgelöste Empfehlung.
 *
 * Kein Prüfer konnte das sehen: Die Werkzeuge messen den Bestand gegen sich
 * selbst, und die oberste Tafel ist kein Bestand, sondern eine Ansage. Diese
 * beiden Testfälle sind die schmalste Brücke dazwischen, die sich messen
 * lässt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const lies = (name) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');

const parameter = lies('../../docs/baustoff-shop/PARAMETER.md');
const betreiber = JSON.parse(lies('../data/betreiber.json'));

/**
 * Die Angaben, unter denen der Shop nach außen auftritt.
 *
 * **Erweitert am 3. September 2026, und zwar aus gegebenem Anlass.** Der
 * Testfall prüfte bis dahin nur die Adresse. Am Vormittag desselben Tages kam
 * eine zweite Angabe dieser Art dazu — der Markenname —, und sie landete
 * **nicht** in der Weisungstafel. Ausgerechnet in der Datei, in die sechs
 * Stunden zuvor der Satz geschrieben worden war: „Diese Tafel ist ab jetzt der
 * Ort, an dem eine Weisung des Auftraggebers als Erstes landet."
 *
 * > **Eine Regel, für die es keine Messung gibt, hält bis zum nächsten Fall.**
 *
 * Deshalb eine Liste statt eines Sonderfalls, mit dem Grund an jedem Eintrag:
 * Wer eine dritte Auftrittsangabe einführt, trägt sie hier ein und merkt beim
 * Schreiben des Grundes, ob sie eine ist.
 */
const AUFTRITT = [
  {
    feld: 'domain',
    lesen: (b) => new URL(b.domain).host.replace(/^www\./, ''),
    warum: 'Die Adresse, unter der gebaut wird. Steht in Verweisen, Sitemap, llms.txt und den '
      + 'finalen URLs der Anzeigen — eine falsche hier kostet jeden Klick.',
  },
  {
    feld: 'marke',
    lesen: (b) => b.marke,
    warum: 'Der Name, unter dem der Laden auftritt: Logo, Seitentitel, Absender auf jedem Beleg, '
      + 'jede Organisation in den strukturierten Daten. Vier Fundstellen an einem Tag, und keine '
      + 'davon stand in der Weisungstafel.',
  },
];

test('die oberste Tafel nennt jede Angabe, unter der der Shop auftritt', () => {
  assert.ok(AUFTRITT.length >= 2, 'die Liste ist gefüllt — sonst prüft die Schleife nichts');
  const fehlend = [];
  for (const a of AUFTRITT) {
    assert.ok(a.warum.length >= 40, `${a.feld}: ohne belastbaren Grund kein Eintrag`);
    const wert = a.lesen(betreiber);
    assert.ok(typeof wert === 'string' && wert.length > 2,
      `betreiber.${a.feld} ist unbrauchbar: ${JSON.stringify(wert)}`);
    if (!parameter.includes(wert)) fehlend.push(`${a.feld} = „${wert}"`);
  }
  assert.deepEqual(fehlend, [],
    'diese Angaben verwendet der Bau, und die oberste Tafel kennt sie nicht');
});

/**
 * Der Stand darf nicht älter sein als die jüngste Zeile der Tafel.
 *
 * Die Weisungstafel führt Datumsangaben als `TT.MM.`, der Kopf einen Stand als
 * `JJJJ-MM-TT`. Wer eine Zeile ergänzt und den Stand stehen lässt, hinterlässt
 * eine Datei, die aktueller ist, als sie von sich behauptet — und genau danach
 * entscheidet ein späterer Lauf, ob er sie noch für gültig hält.
 */
test('der Stand der obersten Tafel ist nicht älter als ihre jüngste Weisung', () => {
  const stand = /Stand:\s*\*\*(\d{4})-(\d{2})-(\d{2})\*\*/.exec(parameter);
  assert.ok(stand, 'PARAMETER.md nennt keinen Stand im Kopf');
  const standTag = Number(`${stand[1]}${stand[2]}${stand[3]}`);

  // Nur die erste Spalte der Weisungstafel: `| 31.08. | …`
  const weisungen = [...parameter.matchAll(/^\|\s*(\d{2})\.(\d{2})\.\s*\|/gm)]
    .map((t) => Number(`${stand[1]}${t[2]}${t[1]}`));
  assert.ok(weisungen.length >= 5, `nur ${weisungen.length} Weisungszeilen — die Prüfung greift zu wenig`);

  const juengste = Math.max(...weisungen);
  assert.ok(
    standTag >= juengste,
    `Stand ${standTag} liegt vor der jüngsten Weisung ${juengste} — die Tafel ist weiter `
      + 'als ihr eigener Kopf',
  );
});
