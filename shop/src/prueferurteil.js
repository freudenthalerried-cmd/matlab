/**
 * Das Urteil über einen Prüferlauf — getrennt von dessen Ausführung.
 *
 * Warum getrennt: `bin/prueferpruefung.mjs` prüft die neun Prüfer darauf, ob
 * sie überhaupt etwas angesehen haben. Es war damit bis zum 30. August das
 * einzige Werkzeug im Bestand, das **selbst keine Probe hatte** — die
 * Entscheidung steckte in einer Schleife über Unterprozesse, und die lässt
 * sich nur mit echten Prüferläufen bewegen. Genau deshalb ist der Fehler,
 * den dieser Modulschnitt behebt, monatelang unbemerkt geblieben:
 *
 * > Ein abgebrochener Prüfer wurde als „keine Mengenangabe in der Ausgabe"
 * > gemeldet. Der Prüfer hatte seinen Grund genannt — auf stderr, das an das
 * > Terminal vererbt wurde und dieses Werkzeug nie erreichte. Auf dem
 * > Bildschirm stand die Antwort (`zuerst npm run build`) direkt über einem
 * > Urteil, das etwas anderes behauptete.
 *
 * Vier Ausgänge, und sie dürfen nicht ineinanderfallen:
 *
 *   `grün`        gelaufen, Menge genannt, Menge über dem Mindestmaß
 *   `zu-wenig`    gelaufen, aber zu wenig angesehen — zeigt er auf eine Probe?
 *   `ohne-menge`  gelaufen und stumm über den Umfang — dann ist er wertlos;
 *                 auch dann, wenn er redet, aber nicht an der Stelle, die
 *                 sein Registereintrag nennt
 *   `abbruch`     **nicht** gelaufen; er hat sich geweigert und gesagt, warum
 *
 * Der vierte ist der, den es vorher nicht gab. Er ist keine Verschärfung,
 * sondern eine Zuordnung: Ein Abbruch ist ein Befund über die Umgebung, kein
 * Befund über den Prüfer.
 */

/**
 * Ausgangscodes, mit denen ein Prüfer sagt, dass er gelaufen ist.
 *
 * 0 = ohne Treffer, 1 = mit Treffern. Alles andere ist ein Abbruch: Die
 * Proben verwenden 2, wenn sie sich weigern (veraltetes Erzeugnis, fehlende
 * Datei), und ein Absturz landet ebenfalls hier.
 */
export const GELAUFEN = [0, 1];

/**
 * Die letzten Zeilen, die ein Prüfer beim Abbruch geschrieben hat.
 *
 * Drei, nicht alle: Die Abbruchmeldungen im Bestand sind dreizeilig — Ursache,
 * betroffene Datei, Merksatz. Wer mehr nimmt, holt sich den Fortschrittsbericht
 * davor mit ins Urteil.
 */
export function abbruchgrund(text) {
  return String(text ?? '')
    .split('\n')
    .map((z) => z.trimEnd())
    .filter(Boolean)
    .slice(-3);
}

/**
 * Beurteilt einen einzelnen Prüferlauf.
 *
 * @param {{code:number, ausgabe?:string, fehlerstrom?:string}} lauf
 * @param {{muster:RegExp, mindestens:number, zweite?:boolean}} pruefer
 * @returns {{art:'grün'|'zu-wenig'|'ohne-menge'|'abbruch', zahl:number|null,
 *            code:number, grund:string[]}}
 */
export function beurteile(lauf, pruefer) {
  if (!GELAUFEN.includes(lauf.code)) {
    return {
      art: 'abbruch',
      zahl: null,
      code: lauf.code,
      grund: abbruchgrund(lauf.fehlerstrom),
    };
  }

  const treffer = String(lauf.ausgabe ?? '').match(pruefer.muster);
  if (!treffer) {
    return { art: 'ohne-menge', zahl: null, code: lauf.code, grund: [] };
  }

  // **NaN ist keine Menge, und `NaN < mindestens` ist falsch.** Nennt das
  // Register eine Klammer, die es im Muster nicht gibt, dann steht hier
  // `Number(undefined)` — und der Vergleich darunter macht daraus grün. Genau
  // so lief `pruefe-datenschutz` vom 2. bis 3. September: Sein Muster hat eine
  // Klammer, sein Registereintrag verlangte die zweite, und der Prüfer der
  // Prüfer meldete „✓ pruefe-datenschutz — NaN Zusagen über den Code".
  //
  // Ein Häkchen hinter einer Nichtzahl ist schlimmer als ein Kreuz: Es sagt
  // „nachgesehen", wo nichts gemessen wurde. Deshalb fällt der Fall in
  // `ohne-menge` — dieselbe Schublade wie ein Prüfer, der über seinen Umfang
  // schweigt, denn genau das tut er an der abgefragten Stelle.
  const zahl = Number(treffer[pruefer.zweite ? 2 : 1]);
  if (!Number.isFinite(zahl)) {
    return { art: 'ohne-menge', zahl: null, code: lauf.code, grund: [] };
  }
  return {
    art: zahl < pruefer.mindestens ? 'zu-wenig' : 'grün',
    zahl,
    code: lauf.code,
    grund: [],
  };
}
