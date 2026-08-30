# Der Fokus blieb auf der Artikelkarte stehen

Stand: 2026-08-29

## Gemessen im Browser, nicht im Stylesheet

Eine Frage, die kein Zensus über den Quelltext beantwortet: **Sieht ein
Tastaturkunde, wo er ist?** Gemessen wird sie, indem man ein Element
fokussiert und den berechneten Umriss vorher und nachher vergleicht.

Der Befund vor der Änderung, auf einer Gruppenseite:

```
Artikelkarte    || ohne: rgb(214,209,198) solid 1px || mit: rgb(214,209,198) solid 1px   <== GLEICH
Kopfnavigation  || ohne: none 0px                   || mit: rgb(16,16,16) auto 1px
Fließtextverweis|| ohne: none 0px                   || mit: rgb(16,16,16) auto 1px
Suchfeld        || ohne: none 0px                   || mit: rgb(156,86,15) solid 2px
```

**Die Artikelkarte sah mit Fokus genauso aus wie ohne.** Das Raster zeichnet
seine Zellen mit einer dünnen Zierlinie als `outline`, und die überschrieb
den Fokusring des Browsers. Wer mit der Tastatur durch 46 Karten geht, sah
nichts wandern — und die Karten sind der Hauptweg durch dieses Sortiment.

Alles andere war sichtbar, aber über den Vorgabering des Browsers. Das ist
kein Fehler, nur nicht entschieden.

## Was jetzt gilt

| Element | Fokus |
| --- | --- |
| Artikelkarte, Kachel | 3 px Ocker, nach innen versetzt |
| alles andere Bedienbare | 2 px Ocker, 2 px nach außen |

Dazu ein **Sprungverweis** „Zum Inhalt springen" als erstes Element jeder
Seite. Vor dem Inhalt stehen Logo, Suchfeld, Warenkorb und neun
Navigationsverweise; ohne diesen einen läuft ein Tastaturkunde sie auf jeder
Seite durch. Sichtbar wird er erst, wenn er den Fokus hat.

> **Berichtigt am 30.08.:** „auf jeder Seite" stimmte für den Verweis, nicht
> für sein Ziel. Der Anker hing an der Brotkrume, und die Startseite hat
> keine — dort sprang der Verweis ins Leere. 80 von 81. Das Szenario prüfte
> eine Seite mit Brotkrume und meldete grün. Behoben und als Zensus über alle
> 81 Seiten festgehalten:
> [`die-startseite-sprang-ins-leere.md`](./die-startseite-sprang-ins-leere.md).

## Zwei Berichtigungen an mir selbst

**Erstens ein falscher Kommentar.** Ich hatte geschrieben, die Zweitregel für
die Karten sei aus Vorrangsgründen nötig, weil die Zierregel „genauer
trifft". Das ist falsch: Der Universalselektor zählt für die Genauigkeit
nicht, beide Regeln sind gleich genau, und die spätere gewinnt.
Nachgemessen — ohne die Zweitregel wandert der Ring trotzdem. Sie bleibt
trotzdem, aus einem anderen und richtigen Grund: Das Raster baut ohne
Zwischenraum, ein Ring mit Abstand nach außen liefe in die Nachbarkarte
hinein. Der Kommentar sagt das jetzt.

**Zweitens die Grenze der Probe.** Das Szenario vergleicht den Umriss vor und
nach dem Fokussieren. Es beweist, dass sich **etwas** ändert — nicht, dass
wir es gestylt haben. Für die meisten Elemente hätte auch der Vorgabering
des Browsers gereicht; nachgemessen, indem beide neuen Regeln einzeln
entfernt wurden. Genau ein Element fällt ohne sie um, und das ist die
Artikelkarte, um die es ging. Die Zusicherung lautet also „Fokus ist
sichtbar", nicht „Fokus ist unsere Farbe" — und das ist die richtige
Zusicherung.

## Geprüft

Zwei Browserszenarien, 49 insgesamt:

| Szenario | prüft |
| --- | --- |
| Fokus | fünf Elementarten, jeweils Umriss vorher gegen nachher |
| Sprungverweis | Ziel vorhanden, ruhend bei −9999 px, fokussiert bei 0 px |

Gegengeprobt durch Entfernen des Sprungverweises: Das Szenario fällt.

**Nachtrag vom 30.08.:** „Ziel vorhanden" prüfte dieses Szenario an *einer*
Seite. Genau darin lag der Fehler — auf der Startseite gab es keines. Die
Reihenfolge Verweis → Kopfleiste → Ziel wird jetzt auf allen 81 gebauten
Seiten geprüft, nicht mehr an einem Beispiel.

## Was nicht nötig war

Für `prefers-reduced-motion` gibt es nichts zu tun — die Seiten enthalten
keine einzige Animation und keinen `transition`. Nachgezählt, nicht
angenommen.
