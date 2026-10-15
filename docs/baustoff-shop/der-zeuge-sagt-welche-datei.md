# Der Zeuge sagt, welche Datei

**12. September 2026. Runde 43.**

## Der Hebel, den die Runde davor benannt hat

Der Gesamtlauf braucht 109 Minuten, davon 105 für die Gegenproben. Die Auswahl
nach geänderten Dateien trägt dort nicht — gemessen, mit Zahl: 142 von 210
Prüfern lesen ein ganzes Verzeichnis. Der eigentliche Grund für die 105
Minuten stand daneben:

> **57 der 213 Gegenproben haben `test` als Prüfer, und jede lässt dreimal die
> ganze Testreihe laufen.**

Dagegen hilft keine Dateiauswahl, sondern ein **Zeuge**: Wenn eine Gegenprobe
anschlägt, steht in der TAP-Ausgabe, welcher Testfall in welcher Datei rot
geworden ist. Wer das mitschreibt, fährt beim nächsten Mal genau diese Datei.

## Gemessen

Dieselbe Gegenprobe (`belegtext-in-der-akte`), zweimal gefahren:

| | |
| --- | --- |
| ohne Zeuge — dreimal die ganze Reihe | **123 s** |
| mit Zeuge — dreimal zwei Testdateien | **16 s** |

Der Zeuge schreibt sich dabei selbst: Beim ersten Lauf stand unter dem
Anschlag *„Zeuge: shop/test/ablage.test.js, shop/test/vorgangwerkzeug.test.js"*
— **zwei** Dateien, denn beide fangen diese Mutation. Genommen werden alle
roten, nicht die erste: Fängt den Fall mehr als eine, ist keine davon
entbehrlich.

## Warum das sicher ist

Die Frage bei jeder Abkürzung an einer Prüfung lautet: In welche Richtung geht
sie schief?

> **Fängt den Fall inzwischen ein anderer Testfall, meldet der Zeuge grün —
> die Gegenprobe sagt „schlägt nicht an", und jemand sieht nach. Das ist ein
> falscher Alarm und kein falsches Grün.**

Die Verwechslung in die andere Richtung kann nicht eintreten: Wird der Zeuge
rot, ist die Mutation gefangen worden. Und der Stand ist kein Gedächtnis, das
gepflegt werden müsste — er wird bei jedem Anschlag neu geschrieben, ein Zeuge,
dessen Datei es nicht mehr gibt, fällt beim Laden heraus, und fehlt er, läuft
die ganze Reihe.

Eine Regel steht ausdrücklich dagegen, dass er still verloren geht: **Ein Lauf
ohne genannte Testdatei löscht den bekannten Zeugen nicht.** Ein Werkzeug
schreibt „not ok" auch in seiner eigenen Ausgabe; ohne diese Regel fiele der
Stand dann auf „unbekannt" zurück, die ganze Reihe liefe wieder, und niemand
sähe, dass etwas verloren ging. Das ist die Gegenprobe dieser Runde.

## Was dabei nachzuziehen war

Der gesparte Vorlauf — seit dem 7. September zählt der „wieder grün"-Lauf
einer Probe als „vorher grün" der nächsten am selben Prüfer — verglich den
**Prüfernamen**. Mit Zeugen ruft nicht jede Testprobe dieselbe Datei.

> **Ein gesparter Lauf ist nur dann derselbe Lauf, wenn es derselbe Befehl
> ist.**

`vorlaufEntfaellt` vergleicht deshalb den Befehl; ohne Befehl bleibt es beim
Namen, also bei der alten Aussage. Gemeldet hat den nötigen Nachzug — wie
schon in der Runde davor — der Prüfer der Suchtexte: Die Gegenprobe
`vorlauf-vom-fremden-pruefer` zitiert genau die geänderte Zeile.

## Ausgang

| | |
| --- | --- |
| `src/zeugen.js` | neu — Zeuge lesen, Befehl bilden, Stand fortschreiben |
| `shop/zeugen.json` | neu, wächst mit jedem Anschlag |
| gemessen | 123 s → **16 s** an einer Probe |
| bekannte Zeugen | **2 von 59** |
| Testfälle | 2.394 |
| Gegenproben | 212 → **213** |

## Was offen bleibt

**Die anderen 57 Zeugen fehlen noch.** Sie entstehen nur, wenn ihre Gegenprobe
anschlägt, und das geschieht im vollen Lauf. Der nächste Gesamtlauf sammelt sie
ein und kostet dabei noch einmal die vollen 105 Minuten; der danach sollte
deutlich kürzer sein. **Diese Zahl ist eine Erwartung, keine Messung** — sie
steht hier, damit der nächste Lauf sie widerlegen kann.

---

**Die Regel dieser Runde:** *Eine Prüfung, die weiß, wer sie fängt, muss nicht
alle fragen.*
