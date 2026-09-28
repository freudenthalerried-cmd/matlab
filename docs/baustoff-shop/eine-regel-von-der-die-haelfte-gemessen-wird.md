# Eine Regel, von der die Hälfte gemessen wird

**10. September 2026, neunte Runde.** Die Redaktionsprinzipien sind die Seite,
auf der dieser Shop seine eigenen Regeln aufstellt — zwei Runden lang war sie
Fundstelle für Zusagen, die er nicht einlöst. Diesmal die dritte der vier
Regeln:

> *„Drittens: Normen nur mit Nummer und **Ausgabe**. ‚Nach ÖNORM' ist wertlos:
> Normen werden überarbeitet, zurückgezogen und ersetzt."*

Gemessen wurde davon **die Nummer**. `NORM_OHNE_NUMMER` in
`inhaltspruefung.js` meldet seit jeher „nach ÖNORM" ohne Ziffer — und trägt im
Quelltext sogar den Hinweis, dass `\bÖNORM` nie trifft, weil „Ö" für
JavaScript kein Wortzeichen ist. Die **Ausgabe** hat kein Prüfprogramm je
nachgeschlagen.

> **Eine Regel, von der die Hälfte gemessen wird, ist zur Hälfte eine Zusage.**

## Was die Messung ergeben hat

**Der Bestand hält sie.** Vier Normen auf den gebauten Seiten, jede mit ihrer
Ausgabe: `ÖNORM B 2501, Ausgabe 2009-09-01` und `ÖNORM B 6400, Ausgabe
2004-08-01`. Kein Fund.

Die **Regel** dagegen traf ihren eigenen Bestand nicht. Ein erster, wörtlicher
Anlauf hätte drei Stellen gemeldet, und alle drei sind richtig, wie sie sind:

| Fall | im Bestand | wörtlich genommen |
|---|---|---|
| Erstnennung im Vorspann, volle Angabe im nächsten Abschnitt | *„für den Regelfall nennt ÖNORM B 2501 aber Untergrenzen"* | Verstoß |
| Wiederholung auf derselben Seite | *„Ebenfalls nach ÖNORM B 2501, Abschnitt 5.7.1"* | Verstoß |
| Normen**reihe** | *„die europäischen Normen der Reihe EN 12056"* | eine Reihe hat keine Ausgabe |
| Zulassungsleitlinie | ETAG 004 | keine Norm, trägt keine Ausgabe in diesem Sinn |

Eine Regel, die den richtigen Bestand als falsch meldet, wird abgeschaltet
statt befolgt. Gemessen wird deshalb, was ein Leser wirklich braucht:

> **Wer eine Norm nennt, sagt an ihrem Namen, welche Ausgabe gemeint ist.**

Und ausdrücklich **nicht** gemessen: ETAG 004. Eine Ausgabe dafür kenne ich
nicht und kann sie von hier nicht nachschlagen — eine erfundene wäre schlimmer
als keine. Das steht so im Modul und auf der Seite.

## Der Fund der Gegenprobe

Die erste Fassung suchte die Ausgabe in einem **Zeichenfenster** hinter der
Nennung: 1200 Zeichen, „der Vorspann und der Abschnitt darunter". Klang
vernünftig. Die Gegenprobe setzte eine erfundene Norm in den Vorspann —
`ÖNORM B 5017`, die nirgends sonst vorkommt — und der Prüfer blieb **grün**.
Im Fenster stand die Ausgabe der **anderen** Norm, die vier Zeilen tiefer
zitiert wird.

> **Eine Ausgabe in der Nähe ist nicht die Ausgabe dieser Norm.**

Dieselbe Familie wie der Befund vom 10. September vormittags, als die Quelle
des Gewichts für den Kranbetrag einsprang: *eine Quelle gehört zu ihrer Zahl,
nicht zu ihrem Absatz.* Gesucht wird jetzt die Ausgabe **am Namen** — und das
ist zugleich das, was ein Leser sucht, der die Norm nachschlägt.

Beide Male hat es nicht das Lesen gefunden, sondern die Mutation. Die
Gegenprobe war vor der Zusage da, wie es die Hausregel verlangt.

## Was auf der Seite steht

Die dritte Regel sagt jetzt, was gemessen wird: Ausgabe beim ersten Nennen in
Sichtweite, Wiederholungen dürfen verkürzen, Reihe und Zulassungsleitlinie
tragen keine Ausgabe — *dort steht, was sie sind*. Mit dem Vermerk, dass bis
heute nur die Nummer gemessen war.

## Stand

- `src/normstelle.js` — neu: `NORMBEZUG`, `AUSGABE`, `REIHE`, `NAHE`,
  `normstellenbefund`.
- `bin/inhaltspruefung.mjs` — läuft in beiden Betriebsarten; im Seitenmodus
  über die **ganzen** Seiten, weil Normbezüge im Inhalt stehen und der in
  diesem Modus sonst herausgeschnitten ist. Der erste Lauf meldete dort
  „0 Erstnennungen" und wäre an der eigenen Untergrenze rot geworden — *ein
  Prüfer, der den falschen Ausschnitt liest, misst nicht zu wenig, sondern das
  Falsche.*
- `inhalte/wissen/redaktionsprinzipien.md` — dritte Regel geschärft.
- 10 neue Testfälle, 1 Gegenprobe (`norm-ohne-ihre-ausgabe`, angeschlagen).
- 2223 Testfälle, 154 Gegenproben, 48 Prüfer.
