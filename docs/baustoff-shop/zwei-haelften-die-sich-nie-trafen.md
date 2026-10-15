# Zwei Hälften, die sich nie trafen

**12. September 2026, abends. Runde 56.**

Zwei Funde, ein Thema: **das Blickfeld des Wächters.**

## Erster Fund: der Prüfer sah nie eine Akte

`npm run bestellprobe` baut seit gestern eine vollständige Akte in einem
Wegwerfordner — Bestellung, Angebot, Rechnung mit Durchschrift, Gutschrift,
Buchhaltungsauszug, Sicherung. Sie entsteht **mit den Werkzeugen dieses
Hauses**, und sie ist die einzige Akte, die es gibt: Die echte unter `ablage/`
ist leer, weil noch kein Geschäft stattgefunden hat.

`npm run pruefe-ablage` las bis heute abend nur das Verzeichnis.

> **Die Probe zeigt, dass die Werkzeuge eine Akte *bauen*. Der Prüfer zeigt,
> dass eine Akte *trägt*. Getroffen haben sie sich nie.**

Alle Regeln des Prüfers — drei Abgleiche, ein Dutzend Befunde — waren an von
Hand gebauten Beispielen gezeigt und noch nie an einer Akte, die die Werkzeuge
selbst erzeugt haben. Ein Prüfer, der nur Beispiele kennt, prüft Beispiele.

**Was jetzt gilt:** Steht `VORGANG_ABLAGE` auf einen Ordner außerhalb des
Verzeichnisses, nimmt `pruefe-ablage` ihn zusätzlich in seine drei Abgleiche.
Der Ortsbefund bleibt davon unberührt — er fragt, ob eine Datei mit Kundendaten
**im Verzeichnis** liegt, und ein Wegwerfordner in `/tmp` liegt dort nicht.

Die Bestellprobe hat dadurch eine dreizehnte Prüfung:

```
✓ Die Sicherung erreicht auch die Durchschriften in den Unterordnern
✓ Die gebaute Akte hält npm run pruefe-ablage stand
```

Geprüft wird dabei nicht nur, dass der Prüfer still blieb, sondern dass er die
Akte **angesehen** hat: Ein Prüfer, der nichts findet, weil er nichts liest,
sieht von außen aus wie ein bestandener Lauf.

## Zweiter Fund: die Sicherungskopie war für jede Sperre unsichtbar

`npm run sicherung` legt vor jedem Überschreiben eine datierte Kopie an, im
Unterordner `.sicherung` neben dem Original. Sie ist Byte für Byte dasselbe —
Namen, Anschriften, Beträge. Gemessen:

```
istJournal('journal-2026-2026-09-12T19-42-04.jsonl')          → false
istBeleg('RE-2026-0001-2026-09-12T19-42-04.txt')              → false
istBuchhaltung('buchhaltung-2026-09-2026-09-12T19-42-04.csv') → false
```

> **Keine der drei Sperren sah die Kopie der Datei, die sie bewacht.**

Der Ortsbefund fragt: *Liegt eine Datei mit Kundendaten außerhalb von
`ablage/`?* Für eine Sicherungskopie war die Antwort immer nein, gleich wo sie
lag. Und die Sicherung darf an einen anderen Ort zeigen (`SICHERUNG_ORDNER`) —
zeigte sie ins Verzeichnis, landete die ganze Akte im öffentlichen Bestand,
ohne dass eine Sperre auch nur hinsah.

**Was jetzt gilt:** Die drei Muster erkennen den Stempel. Er kommt aus
`src/sicherung.js` und wird nicht abgeschrieben — er steht dort jetzt als
`STANDSTEMPEL` und wird von beiden Seiten gelesen. Zwei Schreibweisen desselben
Stempels wären zwei Begriffe von „Stand dieser Datei", und genau daran ist
`src/sicherung.js` am 7. September schon einmal hängengeblieben.

## Die Unterscheidung, ohne die der erste Fund den zweiten bricht

Eine Kopie zählt für den **Ort**, nicht für den **Abgleich**:

| | |
| --- | --- |
| Ortsbefund | sieht die Kopie — sie trägt dieselben Daten |
| `durchschriftenbefund` | sieht sie **nicht** — eine Kopie der Durchschrift ist kein zweites Papier |
| `auszugsbefund` | sieht sie **nicht** — `auszugszeitraum` gibt für eine Kopie keine Periode zurück |

Ohne diese Trennung meldete jede gesicherte Akte sich selbst als doppelt
geführt. Dafür gibt es `istStandkopie()`, und die dreizehnte Prüfung der
Bestellprobe läuft absichtlich **nach** der Sicherung — damit die Kopien schon
dort liegen, wenn der Prüfer kommt.

## Nachgezogen

`auszugszeitraum` trug seit gestern ein **eigenes** Muster für denselben
Dateinamen, aufgeschrieben eine Runde nach `BUCHHALTUNGSMUSTER`. Zwei Muster
für einen Namen laufen genau so lange gleich, bis eines von beiden erweitert
wird — und erweitert wurde eines von beiden noch am selben Tag. Es liest jetzt
das Register.

## Ausgang

| | |
| --- | --- |
| Prüfungen der Bestellprobe | 12 → **13** |
| `pruefe-ablage` | sieht eine Probeakte aus `VORGANG_ABLAGE` |
| Die drei Muster | erkennen den Stand aus `.sicherung`, `istStandkopie` trennt ihn ab |
| Doppelte Muster | 1 → **0** |
| Testfälle | 2.419 → **2.421** |
| Gegenproben | 224 → **226** |

---

**Die Regel dieser Runde:** *Ein Prüfer, der nur Beispiele kennt, prüft
Beispiele — und eine Sperre, die die Kopie ihrer Datei nicht erkennt, bewacht
nur das Original.*
