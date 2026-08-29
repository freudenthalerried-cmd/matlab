# Beinahe auf der falschen Zahl optimiert

Stand: 2026-08-29

## Der naheliegende nächste Schritt — und warum er nicht kommt

Nach der Bündelverschlankung lag die Frage nahe: Was ist im ausgelieferten
`shop.js` jetzt der größte Posten? Die Antwort sah eindeutig aus:

| Teil des Nutzdatenblocks | roh |
| --- | --- |
| **Zeichnungen** (`bilder`) | **39,2 KB** |
| Artikel | 14,9 KB |
| Seiten | 10,8 KB |
| Suchwörter | 2,0 KB |
| Rest | 1,1 KB |

Die 46 Schemazeichnungen machen **59 Prozent** des Datenblocks aus und ein
Drittel der ganzen Datei. Gebraucht werden sie zur Laufzeit nur an zwei
Stellen — im Warenkorb und in den Suchvorschlägen. Auf jeder statischen Seite
steht die Zeichnung ohnehin schon im HTML. Der Fall schien klar.

Vor dem Eingriff die Messung, die zählt:

| Teil | roh | **gezippt** |
| --- | --- | --- |
| Zeichnungen | 39,2 KB | **2,4 KB** |
| Artikel | 14,9 KB | 2,3 KB |
| Seiten | 10,8 KB | 3,9 KB |
| `shop.js` gesamt | 117,6 KB | **23,7 KB** |

**2,4 KB.** Die Zeichnungen bestehen aus denselben Pfaden mit anderen Maßen
und lassen sich außergewöhnlich gut packen — sie sind der am besten
komprimierbare Teil der ganzen Datei. Wer sie herauswirft, verliert die
Bilder im Warenkorb und spart **ein Zehntel** dessen, was die Rohzahl
verspricht.

Der Eingriff unterbleibt. Das ist der ganze Befund.

## Was die Messung nebenbei richtiggestellt hat

Für die Bündelverschlankung von vorhin hatte ich „60 Prozent weniger je
Seitenaufruf" notiert — gerechnet auf Rohbytes. Über die Leitung ist es mehr:

| Stand | roh | gezippt |
| --- | --- | --- |
| alle 22 Module, mit Kommentaren | 306 KB | **85,2 KB** |
| alle 22 Module, entkommentiert | 206 KB | 47,4 KB |
| fünf Module, entkommentiert | 118 KB | **23,7 KB** |

**72 Prozent weniger**, nicht 60. Beide Eingriffe haben sich gelohnt — nur
war die Zahl, mit der ich sie beschrieben habe, nicht die, die der Besucher
merkt.

Dass dieselbe Rohzahl den einen Eingriff unterschätzt und den anderen
überschätzt hätte, ist kein Zufall: Quelltext komprimiert mittelmäßig,
wiederholte SVG-Pfade außergewöhnlich gut. Eine Rohzahl sagt über den
Nutzen einer Optimierung schlicht nichts.

## Damit es nicht wieder passiert

Der Bauschritt nennt jetzt beide Zahlen:

```
Mehrseitenfassung: ausgabe/site/ (plus robots.txt, llms.txt, sitemap.xml)
  shop.js:         115 KB roh, 23.2 KB gezippt — je Besucher einmal, danach im Zwischenspeicher
Einzeldatei:       ausgabe/website.html (1412 KB roh, 105.9 KB gezippt, 31 KB je Artikel)
```

Ein Test führt den echten Bau aus und verlangt beide Angaben — samt der
Zusicherung, dass die gezippte Zahl kleiner als die halbe rohe ist. Sonst
misst der Bericht etwas anderes, als er behauptet.

Die 6-MB-Grenze für die Einzeldatei bleibt auf der **Rohgröße**, und das ist
Absicht: Sie ist die Datei, die jemand doppelklickt, nicht die, die ein
Server ausliefert.

## Notiert

Eine neue Regel für dieses Vorhaben, in einem Satz:

> **Vor jeder Optimierung die Größe messen, die beim Empfänger ankommt — nicht
> die, die im Ordner steht.**

Verwandt mit der Fehlerklasse „eine Zahl, die etwas anderes sagt, als sie
meint", aber hier war die Zahl richtig. Falsch war, was ich aus ihr
schließen wollte.
