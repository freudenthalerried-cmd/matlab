/**
 * Stimmt, was `STATUS.md` über sich selbst sagt?
 *
 * **Der Anlass, 5. September 2026, spätabends.** `npm run pruefe-stand` zählt
 * seit dem 29. August, ob jede Arbeitsdatei im Statusdokument genannt ist.
 * Heute meldet es **338 von 338**. Drei Zeilen unter der Überschrift desselben
 * Dokuments steht:
 *
 * ```
 * Stand: 2026-08-30. **Dieses Dokument zuerst lesen.** 155 Arbeitsdateien
 * sind entstanden, …
 * ```
 *
 * > **Der Prüfer hält die Zahl in der Hand und vergleicht sie nicht mit der
 * > Zahl, die das geprüfte Dokument über sich selbst druckt.** 183 Dateien und
 * > sechs Tage Unterschied.
 *
 * Der Kopfkommentar des Prüfers nennt seine Grenze ausdrücklich: *„Es liest
 * keinen Inhalt und erkennt nicht, ob eine genannte Aussage noch stimmt."* Das
 * ist als allgemeine Aussage richtig und war als Begründung zu breit. Es gibt
 * eine kleine, scharf umrissene Teilmenge von Aussagen, die ohne jedes
 * Textverständnis prüfbar ist: **die Aussagen des Dokuments über genau das,
 * was der Prüfer ohnehin misst.**
 *
 * Und das ist keine Kleinigkeit an einer beliebigen Stelle. Das Dokument sagt
 * in derselben Zeile „Dieses Dokument zuerst lesen", und der Auftrag jedes
 * Laufs sagt es auch. Zwölf Zeilen tiefer warnt es vor sich selbst und
 * schließt mit: *„wer hier liest, prüft zuerst das Datum über dem Absatz."*
 *
 * > **Das oberste Datum war das falscheste.**
 *
 * ## Was hier geprüft wird und was nicht
 *
 * Nur der Kopf, und dort nur zwei Angaben — beide sind Aussagen über den
 * Bestand, den `pruefe-stand` zählt:
 *
 * | Angabe | Gemessen an |
 * |---|---|
 * | `Stand: JJJJ-MM-TT` | dem Tag, an dem das Verzeichnis zuletzt angefasst wurde |
 * | `N Arbeitsdateien` | der Zahl der Arbeitsdateien |
 *
 * **Datierte Absätze weiter unten bleiben unangetastet.** „Stand 29. August
 * 2026. … **Neun Prüfer**" ist heute falsch und trotzdem in Ordnung: Es trägt
 * sein Datum bei sich und beschreibt einen vergangenen Stand. Der Kopf trägt
 * seines auch — er behauptet damit aber, der Stand **des Dokuments** zu sein.
 *
 * ## Warum der Stand nicht gegen „heute" geprüft wird
 *
 * Ein Statusdokument darf von gestern sein, wenn gestern nichts geschehen ist.
 * Falsch wird es erst, wenn das Verzeichnis **nach** seinem Stand bearbeitet
 * wurde. Gemessen wird deshalb der jüngste Eingriff, nicht der Kalender:
 * der letzte Einspielungszeitpunkt des Ordners, und wenn Änderungen unverbucht
 * im Baum liegen, der heutige Tag. Ein Lauf, der etwas ändert, führt den Kopf
 * mit — ein Lauf, der nur nachsieht, muss nichts anfassen.
 */

/** Wie weit oben der Kopf endet. Was danach kommt, ist Fließtext mit eigenen Daten. */
export const KOPFZEILEN = 6;

/** `Stand: 2026-08-30` — die Form, in der der Kopf sein Datum trägt. */
export const STANDMUSTER = /^Stand:\s*(\d{4})-(\d{2})-(\d{2})\./m;

/** `155 Arbeitsdateien` — die Form, in der der Kopf seine Zahl trägt. */
export const ZAHLMUSTER = /(\d[\d.]*)\s+Arbeitsdateien/;

/** Aus `1.234` wird 1234 — der Kopf darf den Tausenderpunkt setzen. */
const zahl = (roh) => Number(String(roh).replace(/\./g, ''));

/**
 * Der Befund über den Kopf von `STATUS.md`.
 *
 * @param {object} eingabe
 * @param {string} eingabe.text        der volle Text des Statusdokuments
 * @param {number} eingabe.dateien     wie viele Arbeitsdateien gezählt wurden
 * @param {string} eingabe.zuletzt     `JJJJ-MM-TT` des jüngsten Eingriffs, oder ''
 *   wenn er sich nicht messen ließ
 */
export function kopfbefund({ text, dateien, zuletzt }) {
  const meldungen = [];
  const kopf = String(text ?? '').split('\n').slice(0, KOPFZEILEN).join('\n');

  // **Ein Abgleich über null Dateien ist kein Befund** — dieselbe Regel wie im
  // Prüfer selbst und in `lesbarkeitsbefund`.
  if (!Number.isInteger(dateien) || dateien <= 0) {
    meldungen.push({
      regel: 'nichts-gezaehlt',
      text: 'ohne gezählte Arbeitsdateien ist der Kopf mit nichts vergleichbar',
    });
    return { meldungen, sauber: false, stand: null, genannt: null };
  }

  const zahltreffer = kopf.match(ZAHLMUSTER);
  const genannt = zahltreffer ? zahl(zahltreffer[1]) : null;
  if (genannt === null) {
    meldungen.push({
      regel: 'kopf-ohne-zahl',
      text: `der Kopf (erste ${KOPFZEILEN} Zeilen) nennt keine Zahl der Form „N Arbeitsdateien"`,
    });
  } else if (genannt !== dateien) {
    meldungen.push({
      regel: 'zahl-abgeloest',
      text: `der Kopf nennt ${genannt} Arbeitsdateien, gezählt sind ${dateien}`,
    });
  }

  const standtreffer = kopf.match(STANDMUSTER);
  const stand = standtreffer ? `${standtreffer[1]}-${standtreffer[2]}-${standtreffer[3]}` : null;
  if (stand === null) {
    meldungen.push({
      regel: 'kopf-ohne-stand',
      text: `der Kopf (erste ${KOPFZEILEN} Zeilen) nennt kein Datum der Form „Stand: JJJJ-MM-TT."`,
    });
  } else if (!zuletzt) {
    // **Nicht messbar ist nicht grün.** Ohne den jüngsten Eingriff gibt es
    // keinen Vergleich, und ein Prüfer, der das verschweigt, urteilt nicht.
    meldungen.push({
      regel: 'stand-nicht-messbar',
      text: `der Kopf sagt „Stand: ${stand}", und wann das Verzeichnis zuletzt `
        + 'angefasst wurde, ließ sich nicht feststellen',
    });
  } else if (stand < zuletzt) {
    meldungen.push({
      regel: 'stand-abgeloest',
      text: `der Kopf sagt „Stand: ${stand}", das Verzeichnis wurde am ${zuletzt} angefasst`,
    });
  }

  return { meldungen, sauber: meldungen.length === 0, stand, genannt };
}
