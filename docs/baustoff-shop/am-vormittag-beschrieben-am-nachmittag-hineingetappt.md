# Am Vormittag beschrieben, am Nachmittag hineingetappt

**10. September 2026, vierte Runde des Tages.** Die Runde davor hat ein
Register über die **Reichweite** der Textprüfer gebaut und mit einem
Schlusssatz geendet:

> *„Was nicht gemessen ist: `PREISAUSSAGEN` und `VORRATSWORTE` aus
> `aussagen.js` haben noch keine eigenen Umschreibungen. Das ist die nächste
> offene Zeile."*

Beim Nachtragen ist etwas Unangenehmeres herausgekommen.

## Der Befund über die eigene Arbeit

Dieselbe Messung, angewandt auf die beiden Regeln, die **ich am selben
Vormittag geschrieben habe**:

| Regel | entstanden | fing von 5 Umschreibungen |
|---|---|---|
| `GRENZAUSSAGEN` (`untergrenze.js`) | 10.09., früh | **1** |
| `MEHRLIEFERUNG` (`lieferungen.js`) | 10.09., vormittags | **0** |

`MEHRLIEFERUNG` entstand in der Runde, deren ganzer Gegenstand der Satz *„Ein
Prüfer, der aus einem Beispielsatz gebaut wird, erkennt den Beispielsatz"*
war. Sie ist aus den vier Sätzen gebaut, die an dem Morgen im Bestand standen,
und fing keine einzige Umschreibung:

> „Ihre Bestellung wird auf **zwei Fuhren** aufgeteilt." · „Die Ware kommt
> **in Etappen**." · „Wir liefern **in Teilmengen**." · „Jeder Lieferant
> schickt seine **eigene Fuhre**."

> **Die Falle am Vormittag beschrieben, am Nachmittag hineingetappt.**

Das ist keine Nachlässigkeit, sondern die Bauart: Wer ein Muster gegen
gefundene Sätze schreibt, schreibt es gegen gefundene Sätze. Dagegen hilft
keine Sorgfalt — nur eine zweite Messung, die nicht derselbe Kopf anstellt,
der das Muster geschrieben hat.

## Die beiden Register aus dem Schlusssatz

Auch sie, wie erwartet:

| Regel | fing | ging durch |
|---|---|---|
| `PREISAUSSAGEN` | 1 von 6 | „zu **denselben Konditionen** wie ein Baumeister" · „**Baumeisterkonditionen** für jeden" · „Einkauf **eins zu eins** weiter" · „zahlen Sie **nicht mehr als der Handwerker**" · „Aufschläge **entfallen**" |
| `VORRATSWORTE` | 2 von 5 | „**Sofort mitnehmen**" · „**Heute noch abholbar**" · „**Alles da**" |

Die Preiszeile ist die teure: Sie ist die Behauptung, die am 5. September aus
einer Anzeige *und* von der Startseite entfernt werden musste. Ein
Anzeigentext, dem „Einkaufspreis" beanstandet wurde, wählt als Nächstes
„zu denselben Konditionen" — und das ging durch.

## Eine Ebene höher

Der eigentliche Fund liegt nicht bei den vier Regeln, sondern beim Register
selbst. Es deckte vier Regeln ab und meldete **grün**, während vier weitere
gar nicht darin standen — zwei davon Stunden alt.

> **Ein Register über die Reichweite, das nicht jede Regel kennt, hat die
> Lücke, die es misst — eine Ebene höher.**

Dagegen hilft kein Vorsatz, sondern eine Aufzählung, die sich selbst
fortschreibt. `bin/umschreibungspruefung.mjs` liest jetzt aus, welche Module
die vier Kundentext-Werkzeuge laden, und aus diesen Modulen, was sie an
Mustern ausführen: **28 Musterausfuhren**. Jede muss in einer von zwei Listen
stehen:

- **`REGELQUELLEN`** — 15 Einträge. Acht sind Behauptungsregeln und zeigen auf
  ihre Umschreibungen; sieben sind es nicht und tragen den Grund
  (`SATZBEDINGUNG` ist eine Ausnahme statt eines Verbots; `ZEITZUSAGE` liest
  eine Form; `ABSICHTSWOERTER` gehört zur Suche und nicht zum Kundentext).
- **`FORMMUSTER`** — 12 Muster, die eine Form lesen: ein Datum, eine
  Summenzeile, einen Krümelpfad.

Was in keiner steht, ist ein Befund; was in einer steht und nicht mehr
gefunden wird, auch. Beim ersten Lauf hat genau das zugeschlagen:
`VORRATSWORTE` ist eine **Zeichenkettenliste** und keine RegExp — die
Suchfunktion kannte diese Bauform nicht und meldete vollständig über das, was
sie kannte. *Ein Suchlauf, der eine Bauform nicht kennt, ist genau so blind
wie ein Muster, das eine Formulierung nicht kennt.*

## Was geschlossen wurde und was offen bleibt

**Achtzehn Umschreibungen sind jetzt gefangen**, jede Erweiterung vorher über
110 Kundenflächen gemessen: **null Fehltreffer**, in jedem Fall.

Eine Lücke ist **bewusst offen geblieben**, und sie zeigt, wofür das Register
gut ist:

> „Eine Bestellung, mehrere **Anlieferungen**."

Das Wort steht auch in einer richtigen Auskunft — die Wissensseite zur
Lagerung rät *„Drei Anlieferungen sind allerdings teurer als eine"*, und das
handelt vom Bestellverhalten des **Kunden**, nicht von dem, was der Shop tut.
Der Unterschied liegt am Subjekt, und das sieht ein Muster nicht. Also steht
er als Lücke da, mit Grund, statt als Fehltreffer auf einer richtigen Seite.

Eine weitere Regel ist als offen **aufgeschrieben**: `abholung.ZUSAGE` hat
noch keine Umschreibungen. Der Unterschied zur Vorrunde ist, dass das jetzt
`npm run pruefe-umschreibung` sagt und nicht ein Schlusssatz in einem
Dokument, den der nächste Lauf lesen muss.

## Stand

- **`src/umschreibung.js`** — 13 Regeln, 54 Umschreibungen, 4 offene Lücken
  mit Grund. Dazu `REGELQUELLEN`, `FORMMUSTER` und `quellenbefund`.
- **`bin/umschreibungspruefung.mjs`** — findet die Musterausfuhren selbst,
  über RegExp, Musterregister **und** Wortlisten.
- **Vier Register erweitert:** `PREISAUSSAGEN` (+5 Muster), `VORRATSWORTE`
  (+4 Wörter), `MEHRLIEFERUNG` (+4 Formen), `GRENZAUSSAGEN` (+4 Formen).
- 7 neue Testfälle, 1 Gegenprobe (`reichweite-einer-jungen-regel`,
  angeschlagen): Sie setzt `MEHRLIEFERUNG` auf den Wurf vom Vormittag zurück.
- 2199 Testfälle, 149 Gegenproben, 48 Prüfer.
