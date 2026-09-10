/**
 * Normbezüge — Nummer, Ausgabe, und wo die Ausgabe stehen darf.
 *
 * **Der Anlass, 10. September 2026.** Die dritte der vier Redaktionsregeln
 * lautet: *„Normen nur mit Nummer und Ausgabe. ‚Nach ÖNORM' ist wertlos:
 * Normen werden überarbeitet, zurückgezogen und ersetzt."* Gemessen wird
 * davon bis heute **die Hälfte**: `NORM_OHNE_NUMMER` in `inhaltspruefung.js`
 * meldet „nach ÖNORM" ohne Nummer. Die **Ausgabe** hat nie jemand
 * nachgeschlagen.
 *
 * > **Eine Regel, von der die Hälfte gemessen wird, ist zur Hälfte eine
 * > Zusage.**
 *
 * ## Was die Messung ergeben hat
 *
 * Der Bestand ist **in Ordnung** — vier Normen, jede mit ihrer Ausgabe. Aber
 * die Regel, wie sie dasteht, trifft ihn nicht:
 *
 * | Fall | Bestand | Regel wörtlich |
 * |---|---|---|
 * | Erstnennung im Vorspann, volle Angabe vier Zeilen darunter | `kanal-was-zusammengehoert` nennt ÖNORM B 2501 in der Antwort in zwei Sätzen und zitiert sie im nächsten Abschnitt mit `Ausgabe 2009-09-01` | wäre ein Verstoß |
 * | Wiederholung auf derselben Seite | „Ebenfalls nach ÖNORM B 2501, Abschnitt 5.7.1" | wäre ein Verstoß |
 * | Normenreihe | „die europäischen Normen der **Reihe** EN 12056" | eine Reihe hat keine Ausgabe |
 * | Zulassungsleitlinie | ETAG 004 | ist keine Norm und trägt keine Ausgabe in diesem Sinn |
 *
 * Eine Regel, die den richtigen Bestand als falsch meldete, würde
 * abgeschaltet statt befolgt. Gemessen wird deshalb, was ein Leser
 * tatsächlich braucht:
 *
 * > **Wer eine Norm zum ersten Mal auf einer Seite nennt, sagt in Sichtweite,
 * > welche Ausgabe gemeint ist.**
 *
 * Wiederholungen verkürzen; das ist Zitiergepflogenheit und keine Lücke.
 *
 * ## Der erste Wurf und was die Gegenprobe fand
 *
 * Die erste Fassung suchte die Ausgabe in einem **Zeichenfenster** hinter der
 * Nennung. Die Gegenprobe setzte eine erfundene Norm in den Vorspann — und
 * der Prüfer blieb grün: Im Fenster stand die Ausgabe der **anderen** Norm,
 * die vier Zeilen tiefer zitiert wird.
 *
 * > **Eine Ausgabe in der Nähe ist nicht die Ausgabe dieser Norm.**
 *
 * Gesucht wird deshalb die Ausgabe **an ihrem Namen**: irgendwo auf der Seite
 * muss `ÖNORM B 2501` mit einer Ausgabe unmittelbar dahinter stehen. Das ist
 * zugleich das, was ein Leser sucht, wenn er die Norm nachschlägt.
 */

/** Ein Normbezug mit Nummer. Ohne Nummer meldet `pruefe-inhalte` ihn schon. */
export const NORMBEZUG = /(?:ÖNORM|DIN|EN)\s+[A-Z]?\s?[0-9]{3,5}(?:-[0-9]+)?/g;

/** Die Ausgabe: `Ausgabe 2009-09-01` oder die Kurzform `:2009`. */
export const AUSGABE = /Ausgabe\s*\d{4}(?:-\d{2}){0,2}|:\s?\d{4}/;

/**
 * Eine **Reihe** hat keine Ausgabe — „die Normen der Reihe EN 12056" nennt
 * eine Familie und nicht ein Dokument.
 */
export const REIHE = /Reihe\s*$/;

/**
 * Wie nah die Ausgabe hinter dem Namen der Norm stehen muss.
 *
 * Vierzig Zeichen: `ÖNORM B 2501, Ausgabe 2009-09-01` und die üblichen
 * Einschübe. Nicht mehr — sonst deckt die Ausgabe der Nachbarnorm mit.
 */
export const NAHE = 40;

/**
 * Hält jede Erstnennung einer Norm gegen ihre Ausgabe.
 *
 * **Zulassungsleitlinien stehen nicht darin.** ETAG 004 ist keine Norm,
 * sondern eine europäische Zulassungsleitlinie; sie trägt keine Ausgabe in
 * diesem Sinn, und eine erfundene wäre schlimmer als keine. Der Bestand nennt
 * sie zweimal, beide Male als das, was sie ist.
 *
 * @param {{name: string, text: string}[]} seiten Kundenflächen, als Text
 * @param {number} mindestens Wie viele Erstnennungen der Bestand trägt
 */
export function normstellenbefund(seiten = [], mindestens = 3) {
  const meldungen = [];
  let geprueft = 0;
  for (const { name, text } of seiten) {
    const s = String(text ?? '').replace(/\s+/g, ' ');
    const gesehen = new Set();
    for (const treffer of s.matchAll(NORMBEZUG)) {
      const norm = treffer[0].replace(/\s+/g, ' ').trim();
      if (REIHE.test(s.slice(Math.max(0, treffer.index - 30), treffer.index))) continue;
      if (gesehen.has(norm)) continue;
      gesehen.add(norm);
      geprueft += 1;
      // Die Ausgabe **an ihrem Namen**, irgendwo auf der Seite: Eine
      // Wiederholung weiter unten darf die verkürzte Erstnennung decken.
      const beiName = new RegExp(
        `${norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}[^.!?]{0,${NAHE}}?`
        + `(?:${AUSGABE.source})`,
      );
      if (beiName.test(s)) continue;
      meldungen.push({
        regel: 'norm-ohne-ausgabe',
        wo: name,
        norm,
        text: `${name} nennt ${norm} und sagt nirgends, welche Ausgabe gemeint ist — `
          + 'Normen werden überarbeitet, zurückgezogen und ersetzt',
      });
    }
  }
  if (geprueft < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-normen',
      wo: '—',
      norm: null,
      text: `nur ${geprueft} Erstnennungen gefunden, erwartet mindestens ${mindestens} — `
        + 'ein Prüfer ohne Fundstellen meldet sauber über nichts',
    });
  }
  return { geprueft, meldungen, sauber: meldungen.length === 0 };
}
