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
 * Der Satz, mit dem ein Prüfer sagt, dass er nichts angesehen hat.
 *
 * **Hierher gezogen am 14. September 2026, nachts.** Er stand wörtlich in
 * `src/normstelle.js`, `src/quellenstempel.js`, `src/untergrenze.js` und
 * `src/vorteilsangabe.js` — vier Prüfer, ein Satz, und gefunden hat ihn erst
 * der Satzvergleich, nachdem sein Leser repariert war.
 *
 * > **Ein grüner Lauf über null Fundstellen ist kein Befund, sondern eine
 * > Auskunft über den Prüfer.** Genau das sagt dieser Satz, und er gehört
 * > überall gleich zu lauten, weil er überall dasselbe heißt.
 */
export const OHNE_FUNDSTELLEN = 'ein Prüfer ohne Fundstellen meldet sauber über nichts';

/**
 * Der Abbruch, wenn zu wenige Quelldateien gelesen wurden.
 *
 * **Hierher gezogen am 14. September 2026, nachmittags.** Der Satz stand in
 * vier Werkzeugen, dreimal wortgleich und einmal mit „Suche" statt „Messung" —
 * und gefunden hat ihn erst der Satzleser, nachdem er reguläre Ausdrücke
 * gelernt hatte. Drei der vier habe **ich** an diesem Tag geschrieben, jeden
 * beim Bau seines Prüfers, jeden abgeschrieben vom vorigen.
 *
 * > **Wer einen Prüfer nach dem Muster des letzten baut, schreibt auch dessen
 * > Sätze ab.**
 */
export const zuWenigQuellen = (anzahl) => `Abbruch: nur ${anzahl} Quelldateien gelesen `
  + '— die Messung sagt dann nichts.';

/** Der Kopf über den Prüfern, die gar nicht messen konnten. */
export const NICHT_MESSBAR = 'Prüfer können nicht messen — das ist keine Entwarnung:';

/** Und der Satz darunter, wenn ein einzelner Prüfer keinen Gegenstand fand. */
export const OHNE_GEGENSTAND = 'Eine Messung ohne Gegenstand meldet Grün und hat nichts geprüft.';

/**
 * „37 Seiten gemessen — darüber lässt sich nichts aussagen."
 *
 * Derselbe Gedanke wie `OHNE_FUNDSTELLEN`, nur mit Zahl und Gegenstand: Eine
 * Stichprobe unter der Mindestgröße ist kein Befund.
 */
/** Der Abbruch, wenn ein Erzeuger keine einzige Zeile gelesen hat. */
export const OHNE_ARTIKEL = '\nAbbruch: kein einziger Artikel gelesen — es wird nichts geschrieben.';

/** „X steht im Register und liegt nicht (mehr) im Bestand." */
export const IM_REGISTER_NICHT_IM_BESTAND = 'steht im Register und liegt nicht (mehr) im Bestand';

export const nichtsAussagbar = (anzahl, einheit) => `nur ${anzahl} ${einheit} gemessen `
  + '— darüber lässt sich nichts aussagen';

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
/**
 * Der Ausgang des Prüferprüfers — aus seinen beiden Zählern.
 *
 * **Berichtigt am 12. September 2026.** Hier stand `gescheitert ? 1 :
 * (abgebrochen ? 2 : 0)`. Der Gedanke vom 8. September war richtig: Ein
 * Abbruch ist ein Befund über die **Umgebung** und keiner über den Prüfer.
 * Nur ist daraus eine Sperre geworden, die niemand vorhergesehen hat:
 *
 * > **Seit dem Verlust von `preise/poschacher-positionen.csv` bricht einer
 * > der einundsechzig Prüfer dauerhaft ab. Damit endete `pruefe-pruefer`
 * > **immer** mit Ausgang 2 — und seine Gegenprobe, sein einziger
 * > regelmäßiger Lauf, wurde bei jedem Gesamtlauf zurückgestellt: „Der Prüfer
 * > kann nichts messen."**
 *
 * Der Prüfer der Prüfer hatte damit selbst keinen Lauf mehr. Eine fehlende
 * Datei außerhalb des Verzeichnisses legte die Prüfung still, die alle
 * anderen Prüfungen bewacht.
 *
 * Gate 38 hat denselben Fall am 11. September anders entschieden, und diese
 * Entscheidung ist die jüngere: **Eine Weigerung wird gemeldet, aber sie ist
 * nicht der Ausgang.** Der Schnelllauf sagt dazu „Das ist keine Entwarnung"
 * und läuft weiter; genauso hier. Der Abbruch steht weiter mit Code und Grund
 * in der Ausgabe — verschwiegen wird nichts, nur nicht mehr alles andere
 * damit verdeckt.
 */
export function ausgang({ gescheitert = 0, abgebrochen = 0 } = {}) {
  void abgebrochen;
  return gescheitert ? 1 : 0;
}

/**
 * Die Begründung eines roten Schritts — aus seiner eigenen Ausgabe.
 *
 * **Der Anlass, 8. September 2026, nachts.** Ein Gesamtlauf meldete
 * `✗ oberflaechenprobe — Ausgang 1` und sonst nichts. Welches der elf
 * Szenarien gescheitert war, stand nirgends: Der Lauf hatte die Ausgabe des
 * Werkzeugs verworfen. Beim nächsten Bau war die Probe grün, und **der Grund
 * ist nicht mehr feststellbar** — genau das ist der Schaden.
 *
 * Vier Zeilen darüber macht derselbe Code es richtig: Der Zweig für Ausgang 2
 * nimmt die erste Zeile der Ausgabe als Grund mit. Die Regel dafür steht seit
 * dem 4. September im Gegenprobenläufer:
 *
 * > **Ein Urteil über einen Prüfer, das seine Begründung wegwirft, ist eine
 * > Anschuldigung.**
 *
 * Angewandt war sie dort, wo sie auffiel, und nicht im Zweig daneben.
 *
 * Gesucht werden zuerst die Zeilen, die ein Werkzeug dieses Hauses für einen
 * Fund benutzt — `✗` und `not ok` —, sonst die letzten Zeilen. Dieselbe
 * Reihenfolge wie im Gegenprobenläufer, und aus demselben Grund: Bei
 * `npm test` steht das ✗ auch in der Ausgabe geprüfter Werkzeuge.
 *
 * @param {string} ausgabe   stdout und stderr des Werkzeugs
 * @param {number} hoechstens  wie viele Zeilen mitgehen
 */
export function befundzeilen(ausgabe, hoechstens = 3) {
  const zeilen = String(ausgabe ?? '').trim().split('\n').filter((z) => z.trim());
  if (zeilen.length === 0) return [];
  const notOk = zeilen.filter((z) => z.startsWith('not ok'));
  const kreuze = zeilen.filter((z) => z.includes('✗'));
  const gefunden = notOk.length ? notOk : kreuze;
  return (gefunden.length ? gefunden : zeilen.slice(-hoechstens)).slice(0, hoechstens)
    .map((z) => z.trim());
}
