# Die Warnung kam nach der Entscheidung

*Lauf vom 15. September 2026. Zehn Artikelkarten tragen jetzt ihre Systemmarke,
ein Prüfer hält sie in beide Richtungen, eine Gegenprobe. Und zwei gemessene
Lücken, von denen nur eine geschlossen wurde.*

---

## Die Frage von gestern, an drei Merkmalen gemessen

Gestern blieb offen: *Sagt die Gruppenkarte über die Ware dasselbe wie die
Artikelseite?* Gemessen an drei Angaben, die auf der Seite stehen:

| Angabe | Karten ohne sie |
|---|---|
| Systemzugehörigkeit | **10** |
| Kranentladung (palettiert) | **24** |
| Abgabemenge | **0** |

Die dritte Zeile ist eine Berichtigung an mir selbst. Der erste Durchgang
zählte 18 Karten ohne Abgabemenge — weil er nach der Wendung *„Abgabe ab"*
suchte und die Karte *„ab 55 m² · 65,45 €"* schreibt. Dieselbe Auskunft, andere
Länge; auf einer Karte ist das richtig so.

> **Ein Prüfer, der eine Schreibweise nicht kennt, meldet nicht zu wenig,
> sondern das Falsche.**

Derselbe Satz steht seit dem 3. September in `src/testzerlegung.js`, und er hat
diesmal mich getroffen — beim Messen, nicht beim Bauen, und deshalb hat er nur
eine Zeile Aufwand gekostet.

## Die Lücke, die geschlossen wurde

Die Kasse warnt seit dem 8. September, wenn ein Warenkorb Schichten zweier
Hersteller mischt (ETAG 004, ÖNORM B 6400). Die Artikelseite sagt es.
`llms.txt` sagt es seit dem 9. September. **Die Gruppenseite sagte es bei
keinem der zehn gebundenen Artikel.**

Und sie ist die Fläche, auf der die Entscheidung fällt: Dort steht ein
Baumit-TextilglasGitter zu 1,19 € neben einer Capatect-Klebespachtel, jedes mit
Mengenfeld und „In den Warenkorb" daneben, ohne Unterschied.

> **Eine Warnung, die erst in der Kasse kommt, kommt nach der Entscheidung.**

Seit heute trägt die Karte eine Marke neben „39 % unter Liste": `Baumit-System`,
`Capatect-System`, `Schiedel-System`. Kein Satz — auf einer Karte steht keiner
—, aber der Unterschied ist sichtbar, bevor die Menge eingetippt wird. Wer
klickt, liest auf der Artikelseite den ganzen Grund.

Der Systemname wird dafür gekürzt: `Synthesa (Capatect)` → `Capatect`. Genommen
wird der Name in der Klammer, sonst das erste Wort — und genau so nennt der
Kunde die Marke, und genau so steht sie in der Bezeichnung daneben.
Abschneiden hieße raten.

## Der Prüfer, in beide Richtungen

`kartensystembefund` hält jede Karte gegen die Einordnung des Artikels:

| Regel | Fall |
|---|---|
| `karte-ohne-system` | gebundene Schicht, Karte schweigt oder nennt die falsche Marke |
| `karte-behauptet-system` | keine gebundene Schicht, Karte trägt trotzdem eine Marke |
| `karte-fehlt` | die Karte ist nicht lesbar — nicht messbar ist nicht grün |

Die zweite Richtung ist die, die man vergisst. Dübel und Zubehör tragen eine
eigene Zulassung; eine Systemmarke auf ihnen wäre falsch. Und eine Marke, die
auf allen 46 Karten steht, liest nach dem dritten Mal niemand mehr — genau das
Argument, mit dem am 8. September `bruch-ohne-bruch` entstanden ist.

Gemessen: **46 Artikelkarten gelesen, 10 davon mit Systemmarke.**

## Die Lücke, die offen bleibt — und warum

24 Karten sagen nicht, dass für den Artikel Kranentladung anfällt. Das ist
gemessen und bleibt so.

Der Grund ist nicht Aufwand, sondern Wirkung: Die Angabe steht auf der
Artikelseite, im Warenkorb und auf der Lieferseite, und sie ändert am Preis auf
der Karte nichts — der Zuschlag hängt an der Lieferung, nicht am Artikel. Eine
Marke auf **mehr als der Hälfte** aller Karten unterscheidet nichts mehr; sie
ist dann kein Hinweis, sondern ein Muster im Hintergrund.

> **Eine Marke, die auf der Hälfte steht, sagt nichts über die andere Hälfte.**

Die Systemmarke steht auf 10 von 46 und unterscheidet deshalb etwas. Das ist
der ganze Unterschied zwischen den beiden Entscheidungen, und er ist gemessen
und nicht gefühlt.

## Was der Bestand dabei gemeldet hat

**`pruefe-saetze` hat wieder angeschlagen** — und zwar an einem Satz, den ich
geschrieben habe, *während* ich die Doppelung von gestern im Kopf hatte. „Die
Kasse warnt seit dem 8. September …" stand danach in `src/systemtreue.js` und
in `bin/website.mjs`. Zweiter Tag in Folge, derselbe Prüfer, derselbe Verfasser.

Das ist kein Ärgernis, sondern das Argument für den Prüfer: Wer einen Absatz
schreibt, der stimmt, kopiert ihn — und merkt es nicht.

**Die Gegenprobe schlug sofort an**, anders als gestern: Hier mutiert sie die
Einordnung im Bauwerkzeug, und `pruefe-systemtreue` baut die Seiten im selben
Lauf nicht neu — es liest sie, und der Gegenprobenläufer baut dazwischen.
Gegenproben 314 → **315**.

## Was dieser Lauf nicht erreicht hat

- **Die 24 Karten ohne Kranentladungshinweis** bleiben, mit dem Grund oben.
  Angesehen ist die Liste, entschieden ist die Zurückstellung — das ist nicht
  dasselbe wie „geprüft".
- **Die Systemmarke sagt nicht, was sie bedeutet.** Vier Wörter auf einer Karte
  können das nicht; der Satz steht eine Ebene tiefer. Ob ein Besucher klickt,
  weiß niemand.
- **Die Kaminschichten** sind nur zum Teil erfasst: Der Dünnbettmörtel
  `POS-18110` trägt keine Systemmarke in seiner Bezeichnung und ist deshalb
  nicht zuzuordnen — das steht seit dem 8. September als Eintrag mit Grund und
  ist ein offener Punkt beim Lieferanten.

## Die Frage für den nächsten Lauf

Die Karte warnt jetzt vor dem Mischen — aber hilft sie beim **Zusammenstellen**?
Wer eine Capatect-Klebespachtel in den Korb legt, sieht auf der Gruppenseite
nicht, welche der anderen Karten zum selben System gehören. Die Systemlisten
beantworten das auf einer eigenen Seite; die Fläche, auf der ausgewählt wird,
verweist nicht darauf.
