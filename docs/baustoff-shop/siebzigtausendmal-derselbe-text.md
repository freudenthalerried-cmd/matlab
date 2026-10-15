# Siebzigtausendmal derselbe Text

**12. September 2026, nachts. Runde 60.**

## Der Anlass steht im eigenen Commit

Der Haken der Runde davor meldete beim Commit:

```
1 Prüfer über der Sekunde aus Gate 38 — sie gehören angesehen und entweder
beschleunigt oder mit Grund nach NICHT_IM_HAKEN:
  ! pruefe-ungerufen — 1,0 s
```

Gate 38 lautet: *Was unter einer Sekunde bleibt, läuft vor jedem Commit.* Der
Prüfer, der findet, welche Ausfuhr niemand ruft, stand darüber — und
**flackerte** um die Grenze: 843, 944, 1106 ms in drei aufeinanderfolgenden
Läufen. Eine Regel, die bei jedem Lauf anders ausgeht, wird weder erfüllt noch
aufgehoben; sie wird ignoriert.

## Wo die Zeit hinging

Gemessen, nicht geschätzt — 233 Dateien, 3,0 MB Quelltext:

| Abschnitt | |
| --- | --- |
| Module laden | 16 ms |
| Dateien lesen | 14 ms |
| Kommentare entfernen | 98 ms |
| **die Suche** | **519 ms** |

Und in der Suche eine einzige Zeile. Für jede ausgeführte Funktion wird jede
Datei danach befragt, ob sie den Namen ruft — und weil eine Datei ihn
**umbenannt** eingeführt haben kann (`eng as weit`), rief die innere Schleife
`ortsname(d.text, …)`. Diese Funktion las dabei jedes Mal **den ganzen
Dateitext** nach `import { … } from '…'` ab.

> **Rund 300 Ausfuhren × 233 Dateien — siebzigtausendmal derselbe Text.**

Der Aufwand wächst mit Funktionen × Dateien, und beide wachsen. Eine Grenze,
die dieser Bestand gerade noch hält, hält der von morgen nicht.

## Was geändert wurde

Die Einfuhren jeder Datei werden **einmal** gelesen und als Karte behalten
(`woher` → Name → Ortsname); `ortsname` schlägt nur noch nach. Dazu zwei
kleinere Dinge in derselben Schleife: Das Suchmuster je Name wird einmal gebaut
statt je Datei, und eine Datei, in der der Name als Zeichenkette überhaupt
nicht vorkommt, wird nicht zeilenweise durchsucht — `aufruf` verlangt ihn
wörtlich, der Vorfilter kann also nichts übersehen.

| | |
| --- | --- |
| vorher | 678 ms (direkt), 843–1106 ms über npm |
| nachher | **293–349 ms** |

## Der Beweis, dass nichts anderes herauskommt

Eine Beschleunigung, die nebenbei die Auswahl ändert, ist keine. Der Stand vor
der Änderung wurde aus `HEAD` geholt und beide Fassungen auf **denselben**
Eingabedateien gerechnet:

```
gleich: true | Einträge: 37
```

## Die Stelle, an der es lautlos hätte schiefgehen können

Die Reihenfolge. Wird derselbe Name aus **zwei** Quellen eingeführt — weil ein
Modul ihn weiterreicht —, gewinnt die erste Zeile der Datei:

```js
import { gleich as ausA } from '../src/a.js';   // maßgeblich
import { gleich as ausB } from '../src/b.js';   // b.js reicht a.js weiter
ausB();
```

Gerufen wird `ausB`, gesucht wird `ausA` — die Auskunft lautet „ungerufen", und
sie lautete vorher genauso. Eine Karte, die die Zeilenfolge verliert, gibt hier
die andere Antwort. Beide Fälle — die Reihenfolge und die Umbenennung selbst —
haben seit heute einen Testfall und eine Gegenprobe.

## Was offenbleibt

`npm` selbst kostet **rund 190 ms** je Aufruf (`node -e ""` braucht 24 ms,
derselbe Prüfer direkt 293 ms, über `npm run` 490 ms). Der Schnelllauf ruft die
Werkzeuge direkt; für die Grenze aus Gate 38 zählt also die direkte Zahl. Wer
einen Prüfer von Hand über `npm run` stoppt, misst eine Fünftelsekunde
Werkzeugkasten mit — das ist keine Eigenschaft des Prüfers.

## Ausgang

| | |
| --- | --- |
| `pruefe-ungerufen` | 678 ms → **293 ms**, Ergebnis nachweislich unverändert |
| Prüfer über der Sekunde | 1 → **0** |
| Testfälle | 2.435 → **2.437** |
| Gegenproben | 231 → **233** |

---

**Die Regel dieser Runde:** *Eine Auskunft, die in einer Schleife steht, wird
so oft geholt, wie die Schleife läuft — und was sich dabei nicht ändert, gehört
vor die Schleife.*
