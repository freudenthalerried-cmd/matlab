/**
 * Was auf der Befehlszeile steht — **an einer Stelle** gelesen.
 *
 * **Der Fund, 14. September 2026.** Die Messung nach doppeltem Code ist von
 * benannten Funktionen auf Pfeilfunktionen und Objektmethoden ausgedehnt
 * worden. Gefunden: **zwei Leser für dieselbe Sache, jeder zweimal.**
 *
 * | Name | steht in | liest |
 * |---|---|---|
 * | `argZahl` | `bin/messliste.mjs`, `bin/werbeprobe.mjs` | `--name <Zahl>`, bricht bei Unfug ab |
 * | `wahl` | `bin/posteingang.mjs`, `bin/vorgang.mjs` | `--name <Wort>`, gibt einen Ersatz zurück |
 *
 * Vier Kopien, zwei Verträge — und die beiden Verträge unterscheiden sich in
 * genau der Frage, die zählt: **Was tut ein Werkzeug, wenn hinter dem Schalter
 * Unfug steht?** `argZahl` bricht ab, `wahl` nimmt den Ersatz. Beides ist
 * richtig, aber nur an seiner Stelle: Eine Zahl, die keine ist, macht jede
 * Rechnung darunter falsch; ein Wort, das fehlt, hat eine sinnvolle Vorgabe.
 *
 * > **Vier Kopien sind vier Gelegenheiten, die Antwort auf dieselbe Frage
 * > unterschiedlich zu ändern.**
 *
 * Beide stehen jetzt hier, mit ihren Verträgen ausgeschrieben und
 * unterschiedlich benannt.
 */

/**
 * Der Wert hinter `--name` als **Zeichenkette**, sonst `ersatz`.
 *
 * Fehlt der Schalter oder folgt ihm nichts, gilt der Ersatz. Das ist die
 * richtige Antwort für eine Angabe, die eine brauchbare Vorgabe hat — ein
 * Ordner, ein Dateiname, eine Kennung.
 *
 * @param {string} name      ohne die beiden Striche
 * @param {*} [ersatz]       was gilt, wenn nichts dasteht
 * @param {string[]} [argv]  zum Prüfen; sonst die Befehlszeile
 */
export function argWort(name, ersatz = null, argv = process.argv.slice(2)) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : ersatz;
}

/**
 * Der Wert hinter `--name` als **Zahl** — oder ein Abbruch.
 *
 * **Warum hier abgebrochen wird und bei `argWort` nicht.** Eine Zahl, die
 * keine ist, macht jede Rechnung darunter falsch, und zwar still: `Number('x')`
 * ist `NaN`, und `NaN` rechnet sich durch jede Formel hindurch, ohne zu
 * klagen. Ein Ersatzwert verdeckte das.
 *
 * > **Ein unbrauchbarer Wert darf nicht durch eine stille Vorgabe ersetzt
 * > werden, wenn der Aufrufer ihn ausdrücklich genannt hat.**
 *
 * Fehlt der Schalter ganz, gilt der Vorgabewert — dann hat der Aufrufer nichts
 * genannt, und es gibt nichts zu beanstanden.
 *
 * @param {(grund: string) => void} [abbruch]  zum Prüfen; sonst Konsole und Ende
 */
export function argZahl(name, vorgabe, argv = process.argv.slice(2), abbruch = undefined) {
  const beenden = abbruch ?? ((grund) => { console.error(grund); process.exit(2); });
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return vorgabe;
  const wert = Number(argv[i + 1]);
  if (!Number.isFinite(wert)) {
    beenden(`--${name} braucht eine Zahl, bekommen: ${argv[i + 1]}`);
    return vorgabe;
  }
  return wert;
}
