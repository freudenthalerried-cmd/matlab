# Eine Kennung, die niemand nachgerechnet hat, ist keine Kennung

**31. August 2026.** Am kritischen Pfad zum Werbeweg weitergearbeitet. Das
siebente Glied — 43 Artikel ohne GTIN — ist die Auskunft, die nur der
Lieferant geben kann. Was ich vorbereiten kann, ist der Empfang: dass die
Kennungen **am Tag ihres Eintreffens** geprüft werden und nicht erst vom
Ablehnungsbescheid.

## Warum Vorhandensein nicht genügt

`artikelliste.js` las die Spalte `gtin` bereits und warnte, wenn sie leer war.
Was fehlte, war die Prüfung des Inhalts. Eine GTIN trägt eine Prüfziffer: Die
Ziffern werden von rechts abwechselnd mit 3 und 1 gewichtet, die Summe muss
auf null aufgehen. Deshalb ergibt ein Zahlendreher keine „ungefähr richtige"
Kennung, sondern eine falsche — und das ist ein anderer Fall als eine fehlende:

- Der Feed wird abgelehnt, mit einem Fehler, der nach einem Problem beim
  Hochladen aussieht statt nach einem in den Daten.
- Schlimmer: Die falsche Kennung kann eine **andere Ware** bezeichnen. Dann
  bewirbt der Shop einen Artikel und liefert einen anderen.

> **Eine falsche Kennung ist schlimmer als keine.** Deshalb ein Fehler, der
> die Zeile anhält, und keine Warnung, die sie durchlässt.

`istGtin()` prüft GTIN-8, -12, -13 und -14. Gerechnet wird auf der
Zeichenkette, nicht auf einer Zahl — führende Nullen sind bedeutungstragend.

Zweite Sperre im Feed: `maschinenlesbar.js` gibt nur eine **gültige** Kennung
aus. Der Katalog kann aus älteren Quellen stammen, die den neuen Einleser nie
gesehen haben.

## Die Gegenrechnung — und was sie im eigenen Haus fand

Den Prüfziffer-Algorithmus habe ich nicht gegen Beispiele geprüft, die ich
für richtig hielt, sondern gegen eine unabhängige Rechnung: 300 zufällige
Präfixe, zu jedem alle zehn möglichen Endziffern, und die Forderung, dass
genau eine davon akzeptiert wird. **3000 Fälle, keine Abweichung.**

Beim Ausführen fielen zwei Platzhalter aus der eigenen Testdatei durch:

```
9008811000001   →  richtig wäre 9008811000005
9001234567890   →  richtig wäre 9001234567896
```

Beide waren **erfunden statt gerechnet**. Sie sahen aus wie EANs und standen
in Zusicherungen, die belegen sollten, dass „mit GTIN der Feed einreichbar
ist". Google hätte diesen Feed abgelehnt.

Das ist der Fall, gegen den die Prüfung gebaut wurde, in klein — und er saß im
Prüfmittel selbst. Beide berichtigt; dazu eine Probe, die den eigenen
Quelltext liest und verlangt, dass **jede** dreizehnstellige Zahl darin eine
gültige Kennung ist (bis auf die eine, die ausdrücklich als ungültig geprüft
wird).

## Der Fund beim Gegenproben

Fünf Mutationen, vier sofort erkannt. Die fünfte — das Entfernen der
ausdrücklichen Ziffernprüfung `/^\d+$/` — blieb grün. Der erste Gedanke war,
die Zeile sei überflüssig: Ein Buchstabe fällt schon an der Arithmetik durch,
weil `Number('X')` NaN ergibt.

Nachgemessen stimmt das für Buchstaben und **nicht für Leerzeichen**:

```
ohne Ziffernprüfung:   "9 08811000005"  →  gültig
mit Ziffernprüfung:    "9 08811000005"  →  ungültig
```

`Number(' ')` ist null. Eine Kennung mit einer Leerstelle verrechnet sich
deshalb wie eine mit einer Null darin und geht als gültig durch. Genau die
Fehlerart, die beim Übertragen aus einer Tabelle entsteht.

> **Die tückische Fehlerart war nicht die, an die ich zuerst dachte.** Hätte
> ich die Mutation als „redundante Zeile" abgetan, wäre die Lücke geblieben —
> mit einer Probe daneben, die Grün meldet.

Zwei Testfälle dafür ergänzt, danach wird auch diese Mutation erkannt.

## Was das für den Liefertag heißt

Die Artikelliste aus dem Poschacher-Kundenkonto wird eine EAN-Spalte tragen.
`npm run artikelliste` liest sie, prüft jede Kennung und hält jede Zeile an,
deren Prüfziffer nicht aufgeht — mit Nennung der Artikelnummer und der
Kennung. Was durchkommt, ist rechnerisch gültig; was nicht, steht in der
Fehlerliste und nicht im Feed.

Der Feed bleibt bis dahin unverändert **nicht einreichbar**: 43 Artikel ohne
Kennung. Daran ändert diese Arbeit nichts — sie sorgt dafür, dass die
Auflösung dieses Punktes nicht an einer Ziffer scheitert, die niemand
nachgerechnet hat.

## Stand

1008 Testfälle grün (vorher 1002), `pruefe-tests` 1006/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 209/209. Kampagnen
unverändert pausiert; nichts an dieser Änderung löst Ausgaben aus.
