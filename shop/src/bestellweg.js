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
 * Die Wege, auf denen eine Browserseite Daten hinausgibt.
 *
 * Jeder Eintrag trägt seine Begründung — nicht als Höflichkeit, sondern damit
 * ein späterer Leser entscheiden kann, ob der Weg noch gemeint ist. Eine Liste
 * ohne Begründungen wächst um Einträge, die niemand mehr prüft.
 */
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
  const text = String(quelltext ?? '');
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
