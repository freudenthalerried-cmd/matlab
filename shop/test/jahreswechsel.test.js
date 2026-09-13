/**
 * Ein Geschäftsfall über den Jahreswechsel.
 *
 * **Der Fund, 13. September 2026.** Die Akte lief über die **Journale** und
 * darin über die Vorgänge. Ein ganz gewöhnlicher Fall — Angebot am
 * 20. Dezember, Annahme am 22., Rechnung am 15. Jänner — war damit zwei
 * Vorgänge:
 *
 * ```
 *   Vorgang 2026-0500 — 2 Eintrag/Einträge, Journal 2026
 *   Vorgang 2026-0500 — 1 Eintrag/Einträge, Journal 2027
 *     FEHLT: auftragsbestaetigung — rechnung liegt in der Akte, das Papier davor nicht
 *   2 Vorgang/Vorgänge laufen
 * ```
 *
 * Ein Fall, zweimal gezählt, mit einem Fehlalarm über den schwersten Befund
 * dieses Hauses — die Auftragsbestätigung stand zwei Zeilen weiter oben, nur
 * im Journal des Vorjahres. `npm run pruefe-ablage` wurde davon rot.
 *
 * Die Trennlinie: **Was an der Datei hängt, bleibt beim Jahr. Was am
 * Geschäftsfall hängt, gehört zum Vorgang.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { wegwerfordner } from '../src/wegwerf.js';
import { luecken } from '../src/vorgangsstand.js';
import { geschaeftsjahr } from '../src/geschaeftszeit.js';

const akteWerkzeug = fileURLToPath(new URL('../bin/akte.mjs', import.meta.url));
const vermerkWerkzeug = fileURLToPath(new URL('../bin/vermerk.mjs', import.meta.url));

const lauf = (werkzeug, args, umgebung) => {
  try {
    return {
      code: 0,
      aus: execFileSync(process.execPath, [werkzeug, ...args],
        { encoding: 'utf8', env: { ...process.env, ...umgebung } }),
    };
  } catch (e) {
    return { code: e.status ?? 1, aus: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

const zeile = (lfd, art, nummer, zeitpunkt, text) => JSON.stringify({
  typ: 'eintrag',
  eintrag: {
    lfd, art, nummer, zeitpunkt, vorgang: '2026-0500',
    betragNetto: 500, betragBrutto: 600, text, bezugAuf: null,
  },
});

/** Angebot und Vertragsschluss im Dezember, Rechnung im Jänner. */
function akteUeberDenJahreswechsel() {
  const akte = wegwerfordner('jahreswechsel-');
  writeFileSync(join(akte, 'journal-2026.jsonl'),
    `${zeile(1, 'angebot', 'AN-2026-0500', '2026-12-20', 'Angebot')}\n`
    + `${zeile(2, 'auftragsbestaetigung', null, '2026-12-22', 'Auftragsbestätigung')}\n`);
  writeFileSync(join(akte, 'journal-2027.jsonl'),
    `${zeile(1, 'rechnung', 'RE-2027-0001', '2027-01-15', 'Rechnung')}\n`);
  return akte;
}

test('Ein Fall über den Jahreswechsel ist ein Vorgang, nicht zwei', () => {
  const akte = akteUeberDenJahreswechsel();
  const e = lauf(akteWerkzeug, [], { VORGANG_ABLAGE: akte });
  assert.equal(e.code, 0, e.aus);

  const kopfzeilen = e.aus.split('\n').filter((z) => z.includes('Vorgang 2026-0500 —'));
  assert.equal(kopfzeilen.length, 1, `derselbe Geschäftsfall steht mehrfach da:\n${e.aus}`);
  assert.match(kopfzeilen[0], /3 Eintrag\/Einträge/);
  assert.match(kopfzeilen[0], /Journal 2026 und 2027/);
  assert.match(e.aus, /1 Vorgang\/Vorgänge laufen/);
});

test('Die Auftragsbestätigung des Vorjahres ist keine fehlende', () => {
  /*
   * Der Fehlalarm ist der schwerere Teil des Fundes: Ein Prüfer, der bei
   * einem gewöhnlichen Geschäftsfall rot wird, wird abgeschaltet — und mit
   * ihm die Regeln, die er sonst hält.
   */
  const akte = akteUeberDenJahreswechsel();
  const e = lauf(akteWerkzeug, [], { VORGANG_ABLAGE: akte });
  assert.doesNotMatch(e.aus, /FEHLT: auftragsbestaetigung/,
    `die Auftragsbestätigung steht im Vorjahr und gilt als fehlend:\n${e.aus}`);

  // Und die Regel selbst kennt keine Jahre — sie sieht Arten.
  const eintraege = [
    { art: 'auftragsbestaetigung', jahr: 2026 }, { art: 'rechnung', jahr: 2027 },
  ];
  assert.deepEqual(luecken(eintraege), []);
});

test('Der Stand kommt aus dem ganzen Fall, die Frist aus seinem jüngsten Jahr', () => {
  const akte = akteUeberDenJahreswechsel();
  const e = lauf(akteWerkzeug, [], { VORGANG_ABLAGE: akte });
  // Zuletzt „rechnung" — nicht „annahme", wie es das Journal 2026 allein sagt.
  assert.match(e.aus, /Stand: zuletzt „rechnung"/);
  // § 132 BAO rechnet ab Ablauf des Kalenderjahres; die späteste Frist deckt
  // jeden Beleg der Akte.
  assert.match(e.aus, /aufzubewahren bis 31\.12\.2034/);
});

test('Ein Vermerk findet den Vorgang auch im Journal eines anderen Jahres', () => {
  /*
   * Ein Angebot vom 20. Dezember, zu dem der Kunde im Jänner anruft: Der
   * Vermerk war unmöglich, weil gesucht wurde, wo geschrieben wird.
   * Geschrieben wird weiter ins laufende Jahr — der Vermerk entsteht heute,
   * und die laufende Nummer beginnt je Journal neu.
   *
   * Das Journal trägt hier **das Vorjahr** und nicht 2027: Gesucht wird im
   * laufenden Geschäftsjahr, und eine Probe, deren zweites Journal in der
   * Zukunft liegt, prüft den Fall nicht — sie fände den Vorgang im laufenden
   * Jahr und wäre auch dann grün, wenn nur dort gesucht würde.
   */
  const akte = wegwerfordner('vorjahr-');
  const vorjahr = geschaeftsjahr() - 1;
  writeFileSync(join(akte, `journal-${vorjahr}.jsonl`),
    `${JSON.stringify({
      typ: 'eintrag',
      eintrag: {
        lfd: 1,
        art: 'angebot',
        nummer: `AN-${vorjahr}-0500`,
        zeitpunkt: `${vorjahr}-12-20`,
        vorgang: `${vorjahr}-0500`,
        betragNetto: 500,
        betragBrutto: 600,
        text: 'Angebot',
        bezugAuf: null,
      },
    })}\n`);

  const e = lauf(vermerkWerkzeug,
    ['--vorgang', `${vorjahr}-0500`, '--text', 'Kunde fragt nach dem Liefertermin'],
    { VORGANG_ABLAGE: akte });
  assert.equal(e.code, 0, `der Vorgang steht im Journal eines anderen Jahres:\n${e.aus}`);
  assert.match(e.aus, new RegExp(`Vermerkt zu Vorgang ${vorjahr}-0500`));
});
