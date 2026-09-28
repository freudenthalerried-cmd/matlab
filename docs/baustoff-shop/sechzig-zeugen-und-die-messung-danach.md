# Sechzig Zeugen, und die Messung danach

**12. September 2026. Runde 44.**

## Die Erwartung, die widerlegt werden sollte

Die Runde davor hat den Zeugen gebaut — den Mitschrieb, welche Testdatei eine
Gegenprobe fängt — und am Ende ausdrücklich hingeschrieben:

> *Der nächste Gesamtlauf sammelt sie ein und kostet dabei noch einmal die
> vollen 105 Minuten; der danach sollte deutlich kürzer sein. **Diese Zahl ist
> eine Erwartung, keine Messung** — sie steht hier, damit der nächste Lauf sie
> widerlegen kann.*

Er hat sie nicht widerlegt.

## Zwei Läufe, dieselben sechzig Proben

| | Dauer | Läufe gegen den Zeugen |
| --- | ---: | ---: |
| Einsammeln — jede Probe fährt die ganze Testreihe | **76 min 2 s** | 64 |
| Danach — jede Probe fährt ihren Zeugen | **10 min 35 s** | 172 |

**60 von 60 schlagen in beiden Läufen an.** Kein falscher Alarm, kein
verlorener Beweis: Was die ganze Reihe fing, fängt auch die Datei, die es
gefangen hat.

Eingesammelt sind **sechzig von sechzig** Zeugen — keine einzige Probe blieb
ohne Fundstelle. Fünfzig haben genau eine Zeugin, zehn deren zwei; genommen
werden alle roten Dateien, denn fängt den Fall mehr als eine, ist keine davon
entbehrlich.

## Was das für den Gesamtlauf heißt

Der letzte vollständige Lauf brauchte **109 Minuten, davon 105 für die
Gegenproben**, und der Löwenanteil davon waren genau diese sechzig. Zieht man
die gemessene Differenz ab, bleiben für den Gegenprobenteil rund **40 Minuten**
und für den ganzen Lauf rund **45**.

> **Das ist wieder eine Erwartung und keine Messung** — sie steht hier aus
> demselben Grund wie beim letzten Mal: damit der nächste Gesamtlauf sie
> widerlegen kann.

Der Unterschied zwischen 109 und 45 Minuten ist der zwischen „fährt niemand
zwischen zwei Runden" und „fährt man nebenher". Genau daran hing der Fund vom
Vortag: Zwei stumpfe Gegenproben standen zwölf Runden lang da, weil der Lauf,
der sie gesehen hätte, zu teuer war.

## Was den Lauf überlebt

Ein Sammellauf von anderthalb Stunden, den ein `SIGKILL` um alles bringt, wäre
ein schlechter Tausch. Der Zeugenstand wird deshalb erst am Ende in
`zeugen.json` geschrieben — eine Datei, die mitten im Lauf entsteht, wäre genau
die Bewegung, über der dieser Läufer nicht messen will —, **aber nach jedem
Anschlag in einen Mitschrieb unter `.sicherung/`**. Dieser Ordner steht in
`NICHT_HINEIN`: Der Baumabdruck sieht ihn nicht, derselbe Ort, an dem der
Mutationsschutz seine Zettel ablegt. Beim Start wird er übernommen, am Ende
gelöscht.

## Ausgang

| | |
| --- | --- |
| bekannte Zeugen | 2 → **60 von 60** |
| Testgegenproben, gemessen | **76 min → 10 min 35 s** |
| Anschläge | 60 von 60, in beiden Läufen |
| erwarteter Gesamtlauf | 109 min → **rund 45** (unbewiesen) |

---

**Die Regel dieser Runde:** *Eine Abkürzung ist erst dann eine, wenn beide
Wege gemessen sind — und der kurze dasselbe findet wie der lange.*
