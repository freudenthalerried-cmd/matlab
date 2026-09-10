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
 * ob die UID zu ihr gehört, sagt das EU-Informationsaustauschsystem — und
 * ec.europa.eu ist aus dieser Umgebung nicht erreichbar, am 10. September
 * gemessen. Bis dahin stand hier dieselbe Aussage ohne Messung dahinter.
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
  /*
   * **Aufgenommen am 10. September 2026.** Der Zettel für den Auftraggeber
   * fragt sieben Angaben ab und holt Form und Beispiel von hier. Bei zwei von
   * ihnen kam nichts zurück: Sie standen als Pflichtangabe auf jeder Liste und
   * hatten **keine Formregel**. Wer sie einträgt, hätte geraten, und ein
   * Zahlendreher oder ein Platzhalter wäre durchgegangen.
   */
  Object.freeze({
    feld: 'gewerbewortlaut',
    beispiel: 'Handel mit Waren aller Art',
    // Bewusst grob: Ob der Wortlaut dem Gewerberegisterauszug entspricht, sagt
    // nur der Auszug. Was diese Regel findet, ist der Platzhalter und das
    // einzelne Wort — „Gewerbe", „TODO", „Bau".
    pruefe: (wert) => {
      const w = String(wert).trim();
      return w.length >= 10 && /\s/.test(w) && !/^(todo|tbd|gewerbe|offen)$/i.test(w);
    },
    warum: 'Der Wortlaut des angemeldeten Gewerbes steht nach § 5 ECG im Impressum, und zwar '
      + 'so, wie er angemeldet wurde — abgeschrieben, nicht formuliert. Ein einzelnes Wort '
      + 'ist kein Wortlaut, und ein Platzhalter, der online geht, ist eine falsche Angabe '
      + 'über das eigene Gewerbe.',
  }),
  Object.freeze({
    feld: 'antwortzeitWerktage',
    beispiel: '2',
    pruefe: (wert) => {
      const n = Number(String(wert).trim());
      return Number.isInteger(n) && n >= 1 && n <= 10;
    },
    warum: 'Die Zahl geht als Zusage an den Kunden: „Wir melden uns innerhalb von N '
      + 'Werktagen." Null Werktage wäre keine Zusage, sondern ein Versprechen für denselben '
      + 'Augenblick; mehr als zehn ist keine Rückmeldung mehr, sondern ein Ausbleiben mit '
      + 'Datum. Geprüft wird die Spanne, nicht die Höhe — welche Zahl richtig ist, weiß der '
      + 'Betrieb.',
  }),
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
    /*
     * **Berichtigt am 10. September 2026.** Hier stand
     * `if (typeof wert !== 'string' …) continue`, und damit übersprang die
     * Schleife jede Zahl. Aufgefallen ist es beim Aufnehmen der Regel für
     * `antwortzeitWerktage`: Sie geht als Zusage an den Kunden — „wir melden
     * uns innerhalb von N Werktagen" —, und das Feld trägt eine **Zahl**.
     * Gemessen wurden 2, 0 und 99: alle drei durchgelassen, während „0" in
     * Anführungszeichen gemeldet wurde.
     *
     * > **Eine Prüfung, die nur für einen Typ greift, ist für den anderen
     * > keine.** Derselbe Satz wie beim Zahlungsvermerk, der nur im
     * > ungenutzten Zweig prüfte.
     *
     * Übersprungen wird seither nur das **Leere** — das ist kein Formfehler,
     * sondern ein offener Punkt, und den führt `startklar`.
     */
    if (wert === null || wert === undefined) continue;
    if (typeof wert === 'string' && wert.trim() === '') continue;
    geprueft += 1;
    if (!r.pruefe(wert)) {
      const gezeigt = typeof wert === 'string' ? wert.trim() : String(wert);
      maengel.push({
        feld: r.feld,
        wert: gezeigt,
        beispiel: r.beispiel,
        text: `${r.feld}: „${gezeigt}" hat nicht die Form einer gültigen Angabe (${r.beispiel})`,
      });
    }
  }
  return { geprueft, offen: regeln.length - geprueft, maengel, sauber: maengel.length === 0 };
}
