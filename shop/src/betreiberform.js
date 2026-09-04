/**
 * Die **Form** der Betreiberangaben — nicht ihre Anwesenheit.
 *
 * **Der Befund, 4. September 2026.** `pruefeBetreiberdaten` prüft seit dem
 * 26. August, ob die zwölf Pflichtangaben des Impressums **dastehen**. Ob sie
 * stimmen, prüft nichts.
 *
 * Vier davon sind heute leer und werden als offener Punkt geführt. Die acht
 * gefüllten hat niemand angesehen — und zwei von ihnen tragen weiter als das
 * Impressum:
 *
 * | Angabe | wohin sie geht |
 * |---|---|
 * | **UID** | auf **jede** Rechnung über 400 € (§ 11 Abs 1 Z 3 UStG) |
 * | **Firmenbuchnummer** | ins Impressum und in die Offenlegung nach § 25 MedienG |
 *
 * > **Eine falsche UID auf einer Rechnung ist kein Schönheitsfehler.** Sie
 * > gefährdet den Vorsteuerabzug des Kunden — bei jedem betroffenen Beleg, so
 * > lange, bis es jemandem auffällt.
 *
 * Die Prüfung dafür gibt es seit dem 27. August: `uidPruefzifferStimmt` rechnet
 * die Prüfziffer der österreichischen UID nach. Sie bewacht die UID des
 * **Kunden** (Gate 7). Die **eigene** hat sie nie gesehen.
 *
 * Dieselbe Familie wie der Lieferhinweis, der auf den falschen AGB-Punkt zeigte,
 * und wie die Auffangform, die sich nicht als Platzhalter auswies: **eine Regel,
 * die es gibt, an der einen Stelle nicht angewandt.**
 *
 * ## Was hier geprüft wird und was nicht
 *
 * Die Form, nicht die Wahrheit. Ob `FN 347938z` **die** Nummer dieser
 * Gesellschaft ist, steht im Firmenbuch und nicht in einem regulären Ausdruck;
 * ob die UID zu ihr gehört, sagt das EU-Informationsaustauschsystem, und dessen
 * Netzausgang ist aus dieser Umgebung gesperrt.
 *
 * > **Was eine Formprüfung findet, ist der Tippfehler — und das ist die
 * > häufigste Art, wie eine richtige Zahl falsch auf ein Papier kommt.**
 */

import { uidPruefzifferStimmt } from './kunde.js';

/**
 * Die Formregeln, je Angabe eine.
 *
 * `beispiel` ist Pflicht: Eine Regel ohne Beispiel zwingt den, der sie
 * eintragen soll, zum Raten — und dieselbe Datei enthält vier Felder, die
 * genau darauf warten.
 */
export const FORMREGELN = Object.freeze([
  Object.freeze({
    feld: 'uid',
    beispiel: 'ATU12345675',
    pruefe: (wert) => uidPruefzifferStimmt(String(wert).toUpperCase().replace(/\s/g, '')),
    warum: 'Die österreichische UID trägt eine Prüfziffer. Sie steht nach § 11 Abs 1 Z 3 UStG '
      + 'auf Rechnungen über 400 € — ein Tippfehler dort gefährdet den Vorsteuerabzug des '
      + 'Kunden, und zwar so lange, bis es jemandem auffällt.',
  }),
  Object.freeze({
    feld: 'firmenbuchnummer',
    beispiel: 'FN 347938z',
    pruefe: (wert) => /^FN\s?\d{1,6}\s?[a-z]$/.test(String(wert).trim()),
    warum: 'Eine Firmenbuchnummer besteht aus „FN", bis zu sechs Ziffern und einem '
      + 'Prüfbuchstaben. Sie steht im Impressum und trägt die Offenlegung nach § 25 MedienG; '
      + 'ohne sie kann der Rechtstexteanbieter sie nicht schreiben.',
  }),
  Object.freeze({
    feld: 'plz',
    beispiel: '4312',
    pruefe: (wert) => /^\d{4}$/.test(String(wert).trim()),
    warum: 'Österreichische Postleitzahlen haben vier Ziffern. Die Anschrift ist Pflichtangabe '
      + 'nach § 5 ECG und steht zugleich als Absender über der Anschrift des Kunden.',
  }),
  Object.freeze({
    feld: 'email',
    beispiel: 'office@bauversand.com',
    // Bewusst grob: Eine Adresse, die dieser Prüfung genügt, kann trotzdem ins
    // Leere gehen. Was sie findet, ist die vergessene Klammer und das
    // fehlende @ — nicht die Frage, ob dort jemand liest.
    pruefe: (wert) => /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(String(wert).trim()),
    warum: 'Die E-Mail-Adresse ist die Rückantwortadresse für den Kunden, den Lieferanten und '
      + 'den Rechtstexteanbieter. Ohne sie hat die fertig gerechnete Kundenanfrage keinen '
      + 'Empfänger.',
  }),
  Object.freeze({
    feld: 'telefon',
    beispiel: '+43 7238 12345',
    pruefe: (wert) => /^\+?[\d\s/()-]{7,}$/.test(String(wert).trim()),
    warum: 'Die Telefonnummer ist nach § 5 ECG Teil der Angaben zur raschen Kontaktaufnahme. '
      + 'Geprüft wird nur, dass Ziffern und Trennzeichen dastehen — die Schreibweise ist frei.',
  }),
]);

/**
 * Prüft die **gefüllten** Angaben auf ihre Form.
 *
 * Leere Felder sind kein Formfehler, sondern ein offener Punkt — den führt
 * `pruefeBetreiberdaten` und nach ihm `startklar`. Zwei Prüfungen über
 * dieselbe Sache, die einander widersprechen, wären schlimmer als eine.
 */
export function pruefeBetreiberform(betreiber = {}, regeln = FORMREGELN) {
  const maengel = [];
  let geprueft = 0;
  for (const r of regeln) {
    const wert = betreiber[r.feld];
    if (typeof wert !== 'string' || wert.trim() === '') continue;
    geprueft += 1;
    if (!r.pruefe(wert)) {
      maengel.push({
        feld: r.feld,
        wert: wert.trim(),
        beispiel: r.beispiel,
        text: `${r.feld}: „${wert.trim()}" hat nicht die Form einer gültigen Angabe (${r.beispiel})`,
      });
    }
  }
  return { geprueft, offen: regeln.length - geprueft, maengel, sauber: maengel.length === 0 };
}
