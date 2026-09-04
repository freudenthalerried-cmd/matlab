/**
 * Kann ein Kunde von dieser Seite aus eine Bestellung abschicken?
 *
 * **Der Anlass, 3. September 2026.** `startklar()` führt neun Punkte, und alle
 * neun sind Zulieferungen des Auftraggebers: Impressum, Antwortzeit, Preise,
 * Platzhalter, Lieferzeit, Zahlungsanbieter, Rechtstexte, Domain, Repository.
 * Sind sie geschlossen, meldet das Werkzeug `startklar: true`.
 *
 * Drei Oberflächen lesen dieses Ja als **„Bestellen ist möglich"**: die
 * Startseite lässt ihren Vorschaukasten fallen, der Fuß aller 81 Seiten
 * wechselt auf den Normalsatz, die Kasse lässt ihre Absage weg, und `llms.txt`
 * schreibt Assistenten wörtlich „Bestellen ist möglich" hin.
 *
 * > **Keiner der neun Punkte ist der Bestellweg selbst.** Der Auftraggeber
 * > könnte alle schließen — und diese Seite kann danach genau so wenig eine
 * > Bestellung entgegennehmen wie vorher, weil dafür nichts gebaut ist.
 *
 * Der Shop ist ein Satz statischer Dateien. Er rechnet, und er erzeugt einen
 * Anfragetext, den der Kunde in sein **eigenes** Mailprogramm kopiert. Es gibt
 * keinen Aufruf, der irgendetwas irgendwohin schickt — nachgemessen und nicht
 * erinnert: `absendewege()` findet in `shop-ui.js` keinen.
 *
 * ## Warum `mailto:` hier nicht zählt
 *
 * Die Kasse bietet einen Mailverweis an. Er sendet nichts: Er öffnet das
 * Programm des Kunden mit vorbereitetem Text, und ob dort jemand auf „Senden"
 * drückt, erfährt dieser Shop nie. Was dabei herausgeht, heißt in jedem Text
 * dieses Hauses **Anfrage und ausdrücklich keine Bestellung**. Wer `mailto:`
 * in die Liste unten aufnähme, machte den Punkt grün, ohne dass eine einzige
 * Bestellung ankäme.
 *
 * ## In welche Richtung diese Messung irren darf
 *
 * Die Liste kennt vier Wege, auf denen eine Browserseite etwas hinausgibt. Sie
 * ist **nicht** die Aufzählung aller Möglichkeiten eines Browsers — die gibt es
 * nicht. Ein fünfter, hier ungenannter Weg führt dazu, dass der Punkt `offen`
 * bleibt, obwohl er erfüllt wäre.
 *
 * > **Das ist die richtige Richtung.** Eine Bereitschaftsprüfung, die im
 * > Zweifel „noch nicht" sagt, kostet eine Nachfrage; eine, die im Zweifel
 * > „fertig" sagt, kostet eine Bestellung, die niemand bekommt.
 */

/**
 * **Gate 26, entschieden am 4. September 2026: eigenes Empfangsskript auf dem
 * Hosting des Auftraggebers.**
 *
 * Der Anlass war nicht dieser Punkt selbst — er steht seit dem 3. September in
 * der Bereitschaftsliste. Der Anlass war der **Rolloutplan**: Er führte in
 * dreizehn Etappen bis zur gemessenen Anfragequote, und der Shop wäre danach
 * genauso wenig bestellfähig gewesen wie heute. Schlimmer noch, die Etappe
 * „Zahlungsanbieter" versprach „erst danach kann die Kasse etwas auslösen" —
 * zehn Tage Legitimationsprüfung und eine laufende Gebühr für einen Anbieter,
 * der nichts zu kassieren bekommt.
 *
 * > **Der einzige Punkt der Bereitschaftsliste, der nicht auf den Auftraggeber
 * > wartet, kam in keinem Plan vor.**
 *
 * Die Entscheidung ist deshalb hier fällig, vor jeder Zeile Code. Vier Wege
 * standen zur Wahl, drei sind ausgeschieden:
 */
export const GEWAEHLTER_WEG = Object.freeze({
  id: 'eigenes-empfangsskript',
  was: 'Ein Formular der Kasse schickt die fertig gerechnete Bestellung an ein kleines Skript '
    + 'auf demselben Hosting (All-Inkl, PHP). Das Skript legt sie ab und benachrichtigt den '
    + 'Betreiber per Mail.',
  warum: 'Es kostet nichts, es kommt ohne Dritten aus, und die Daten des Kunden bleiben beim '
    + 'Auftraggeber. Der Hoster steht ohnehin fest und kann PHP; ein Auftragsverarbeiter nach '
    + 'Art. 28 DSGVO entsteht dadurch nicht zusätzlich.',
});

/**
 * Die verworfenen Wege — mit dem Grund, damit niemand sie neu erwägen muss.
 *
 * Ein Register ohne die Abgelehnten sieht aus wie eine Entscheidung ohne
 * Alternative, und die nächste Runde fängt von vorne an.
 */
export const VERWORFENE_WEGE = Object.freeze([
  Object.freeze({
    id: 'mailto',
    was: 'Ein `mailto:`-Verweis mit vorbereitetem Text',
    warumNicht: 'Er sendet nichts. Er öffnet das Programm des Kunden, und ob dort jemand auf '
      + '„Senden" drückt, erfährt dieser Shop nie. Was dabei herausgeht, heißt in jedem Text '
      + 'dieses Hauses Anfrage und ausdrücklich keine Bestellung. Der Weg bleibt als Bequemlichkeit '
      + 'neben dem Kopiertext bestehen — er ist nur kein Bestellweg.',
  }),
  Object.freeze({
    id: 'formulardienst',
    was: 'Ein fremder Formulardienst (Formspree, Netlify Forms und Verwandte)',
    warumNicht: 'Er kostet ab dem ersten ernsthaften Aufkommen Geld und macht den Anbieter zum '
      + 'Auftragsverarbeiter nach Art. 28 DSGVO — mit Vertrag, Verzeichnis und der Frage, wo die '
      + 'Daten liegen. Beides ist eine Entscheidung des Auftraggebers und keine des Bauwerkzeugs.',
  }),
  Object.freeze({
    id: 'shopsystem',
    was: 'Ein fertiges Shopsystem mit eigener Bestellverwaltung',
    warumNicht: 'Es löst das Problem und wirft den ganzen Bestand weg: 81 gebaute Seiten, die '
      + 'Frachtrechnung, Gate 20 und 25, die Belegerzeugung, die Ablage. Der Aufwand steht in '
      + 'keinem Verhältnis zu einem Formular und dreißig Zeilen Empfangsskript.',
  }),
]);

/**
 * Was dastehen muss, bevor der Weg gebaut **und eingeschaltet** werden darf.
 *
 * Beides ist nicht dasselbe: Bauen kann man ihn heute, einschalten nicht. Die
 * Reihenfolge ist keine Vorsicht, sondern Art. 13 DSGVO — die Erklärung muss
 * die Übertragung **vor** der ersten Übertragung beschreiben.
 */
export const VORAUSSETZUNGEN = Object.freeze([
  Object.freeze({
    id: 'empfaengeradresse',
    feld: 'betreiber.email',
    warum: 'Ohne Empfänger benachrichtigt das Skript niemanden, und die Bestellung läge in '
      + 'einer Datei, in die keiner sieht. Die Adresse ist eine der vier offenen '
      + 'Impressumsangaben.',
  }),
  Object.freeze({
    id: 'datenschutzwortlaut',
    feld: 'rechtstexteFundstelle',
    warum: 'Der heutige Text sagt das Gegenteil dessen, was der Bestellweg tut: „wird nicht an '
      + 'den Server übertragen". Diese Zusage ist gemessen (`npm run pruefe-datenschutz`) und '
      + 'stimmt heute. Sie muss mit demselben Bau fallen, mit dem der Weg entsteht — sonst '
      + 'steht auf der Rechtsseite eine Unwahrheit, und zwar eine geprüfte.',
  }),
]);

/**
 * Die Wege, auf denen eine Browserseite Daten hinausgibt.
 *
 * Jeder Eintrag trägt seine Begründung — nicht als Höflichkeit, sondern damit
 * ein späterer Leser entscheiden kann, ob der Weg noch gemeint ist. Eine Liste
 * ohne Begründungen wächst um Einträge, die niemand mehr prüft.
 */
import { ohneKommentare } from './entkommentieren.js';

export const ABSENDEWEGE = Object.freeze([
  Object.freeze({
    name: 'fetch',
    muster: /\bfetch\s*\(/,
    warum: 'Der übliche Weg, einen Warenkorb an einen Server zu geben. Wo er steht, gibt es eine Gegenstelle, die eine Bestellung annehmen kann.',
  }),
  Object.freeze({
    name: 'XMLHttpRequest',
    muster: /\bXMLHttpRequest\b/,
    warum: 'Derselbe Vorgang in der älteren Schreibweise. Fehlte er hier, ließe sich der Bestellweg durch eine Stilfrage vor der Prüfung verstecken.',
  }),
  Object.freeze({
    name: 'sendBeacon',
    muster: /\bnavigator\.sendBeacon\s*\(/,
    warum: 'Schickt beim Verlassen der Seite und ohne Antwort. Für eine Bestellung eine schlechte Wahl — aber ein Absendeweg, und deshalb einer, den diese Prüfung sehen muss.',
  }),
  Object.freeze({
    name: 'Formular',
    muster: /<form\b|\.submit\s*\(/,
    warum: 'Der Weg ohne JavaScript: Ein Formular mit `action` schickt den Korb an eine Adresse. Er käme in Frage, sobald es eine Gegenstelle gibt.',
  }),
]);

/**
 * Welche Absendewege im Quelltext der Kundenoberfläche vorkommen.
 *
 * @param {string} quelltext  der Quelltext, den der Browser des Kunden bekommt
 * @returns {string[]} die Namen der gefundenen Wege, in der Reihenfolge der Liste
 */
export function absendewege(quelltext) {
  /**
   * **Ohne Kommentare gemessen — berichtigt am 4. September.**
   *
   * An dem Tag bekam `shop-ui.js` einen Kommentar, der erklärt, warum das
   * `fetch` **nicht** dort steht. Der Prüfer las ihn und meldete einen
   * Absendeweg; vier Testfälle wurden rot, und keiner davon zu Recht.
   *
   * > **Ein Wort über eine Sache ist nicht die Sache.** Dieselbe Familie wie
   * > die Gegenprobe, die den Kommentar über der Zeile traf statt der Zeile.
   *
   * Das Entkommentieren steht **hier** und nicht beim Aufrufer: Vier Stellen
   * rufen diese Funktion, und die fünfte würde es vergessen.
   */
  const text = ohneKommentare(String(quelltext ?? '')).text;
  return ABSENDEWEGE.filter((w) => w.muster.test(text)).map((w) => w.name);
}

/**
 * Der Befund für `startklar()`: Kann der Kunde eine Bestellung abschicken?
 *
 * `null` als Quelltext heißt **nicht** „nein", sondern „nicht nachgesehen".
 * Der Unterschied ist derselbe wie bei Domain und Repository: Ein Punkt, den
 * das Werkzeug nicht prüfen konnte, darf nicht als geprüft durchgehen.
 *
 * @param {string|null} quelltext
 * @returns {{moeglich: boolean|null, gefunden: string[], befund: string}}
 */
export function bestellwegBefund(quelltext) {
  if (quelltext === null || quelltext === undefined) {
    return {
      moeglich: null,
      gefunden: [],
      befund: 'der Quelltext der Kundenoberfläche wurde nicht mitgegeben — ungeprüft, nicht erfüllt',
    };
  }
  const gefunden = absendewege(quelltext);
  return {
    moeglich: gefunden.length > 0,
    gefunden,
    befund: gefunden.length
      ? `die Oberfläche gibt Daten hinaus (${gefunden.join(', ')}) — der Weg besteht`
      : 'die Oberfläche schickt nichts ab; die Kasse rechnet und erzeugt einen Anfragetext '
        + 'zum Kopieren. Ein Mailverweis zählt nicht: Er öffnet das Programm des Kunden, '
        + 'und was er trägt, ist eine Anfrage und ausdrücklich keine Bestellung',
  };
}
