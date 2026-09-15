# Ein Suchwort weniger, elf Stellen falsch

**2. September 2026.** `npm run messliste` meldet **32 Begriffe**. Die Akte
sagt an neun Stellen **33**, der Quelltext an zwei weiteren auch.

Die Ursache ist keine Nachlässigkeit, sondern eine gute Entscheidung vom Vortag.
Am 1. September ist „Kaminkopf Regenhaube" aus der Kampagne genommen worden:
Die Kaminkopfverkleidung führt der Shop nicht, und **ein Suchwort ist kein
Werbeversprechen.** Aus 33 wurden 32 — in genau einer Datei.

```
aac492c  33 eindeutige Begriffe   Paletten, die es nicht gibt
f712d0c  32 eindeutige Begriffe   Sechs bezahlte Klicks auf eine leere Trefferliste
```

## Warum das der Fall ist, für den es das Leitzahlregister gibt

Das Register trägt seit dem 1. September drei Zahlen und sagt über sich selbst:

> **Eine Zahl, die in acht Dokumenten steht, wird in keinem gepflegt — deshalb
> steht sie hier einmal und wird dort gemessen.**

Die Zahl der Begriffe stand in elf und war in keinem gepflegt. Sie stand nicht
im Register.

Vierter Eintrag also, mit derselben Bauart wie die anderen: `jetzt` **rechnet**
den gültigen Wert, statt ihn einzutragen, und die abgelöste 33 trägt ihre
Bedingung — „Kaminkopf", „erster Anlauf", „01.09.".

Eine Änderung am Vertrag war nötig: `jetzt(ziel)` bekam ein zweites Argument.
Die drei bisherigen Leitzahlen folgen aus `zielgroessen.json`; diese nicht — sie
steht in der **erzeugten** Messliste. Die dort schon gemachte Zusammenfassung
(Phrase und Exakt sind ein Begriff) wird nicht ein zweites Mal gemacht: Eine
zweite Zusammenfassung wäre ein zweiter Stand. Fehlt die Datei, bricht der
Prüfer mit Code 2 ab, statt eine ungemessene Leitzahl grün zu melden.

## Was der Prüfer fand: neun Stellen

| Datei | Zeile | Art |
|---|---|---|
| `PARAMETER.md` | — | Leitdokument, nannte die Zahl gar nicht |
| `pr-beschreibung.md` | — | dasselbe |
| `STATUS.md` | 416 | historisch — Bedingung ergänzt |
| `die-drei-groessten-risiken.md` | 76 | aktuelle Aussage — nachgezogen |
| `keyword-ohne-treffer.md` | 124 | historisch — Bedingung ergänzt |
| `messliste-fuer-das-laufende-modell.md` | 82, 139 | ein Lauf-Protokoll, eine aktuelle Aussage |
| `weg-zum-ersten-verkauf-nachgerechnet.md` | 59, 87 | aktuelle Aussagen — nachgezogen |

Dazu zwei Stellen im Quelltext, die der Prüfer bewusst nicht liest —
`src/offenepunkte.js` und `src/rollout.js` führten beide den Titel „Suchvolumen
der 33 Keywords im Liefergebiet messen" — den Stand vor dem 01.09. Der
Auftraggeber hätte in seiner Aufgabenliste eine Zahl gelesen, die es nicht
mehr gibt.

**Das Lauf-Protokoll in `messliste-fuer-das-laufende-modell.md` ist nicht
nachgezogen worden.** Es zeigt, was das Werkzeug an jenem Tag ausgegeben hat;
eine Abschrift zu ändern, damit sie zu heute passt, wäre das Fälschen eines
Protokolls. Sie trägt jetzt den Stand daneben.

## Zwei Befunde am Prüfer selbst

**Die Bedingung war zu weit.** Die erste Fassung nahm auch „1. September" und
„zurückgenommen" als Bedingung an. Beide stehen in dieser Akte auf zu vielen
Zeilen; eine Bedingung, die überall zutrifft, deckt alles und prüft nichts.
Eng gefasst auf „Kaminkopf", „erster Anlauf", „01.09.".

**Die Sichtweite von ±8 Zeilen hat eine Schwäche, die hier sichtbar wurde.**
`STATUS.md` ist eine einzige lange Tabelle aus unabhängigen Einträgen. Eine
Fundstelle blieb ungemeldet, weil acht Zeilen weiter — in einem **fremden**
Eintrag über ein anderes Thema — die Worte „ersten Anlaufs" standen. Der
Nachbar hat die Zeile gedeckt.

Die Stelle ist trotzdem berichtigt worden, weil sie eine aktuelle Aussage war.
Aber die Regel ist damit für Tabellendokumente nachweislich zu grob. Sie bleibt,
wie sie ist: Eine Sichtweite, die Zeilen zählt, ist grob, und die schärfere
Fassung müsste den Absatz erkennen. Das ist ein eigener Umbau und keine
Nebensache dieses Laufs — hier steht, dass er aussteht.

## Nachgezogen und gehalten

Die Zahl steht jetzt in beiden Leitdokumenten und wird an drei Stellen gemessen:

- `npm run pruefe-leitzahlen` — 19 Fundstellen in der Akte, alle gedeckt
- `npm run pruefe-schaufenster` — als 27. Kennzahl der PR-Beschreibung
- `npm run messliste` — die Quelle selbst

## Stand

| | |
|---|---|
| Begriffe der Messliste | **32** (33 bis 01.09.) |
| Leitzahlen im Register | 4 |
| Fundstellen der neuen Leitzahl | 19, alle gedeckt |
| Kennzahlen der PR-Beschreibung | 27 |
| Tests | 1234 |
| Gegenproben, die anschlagen | 17 von 17 |

Am Modell ändert sich dadurch nichts: Ein Begriff weniger verschiebt den Bedarf
von 2.500 bis 6.700 Suchanfragen je Monat nicht messbar. Was sich ändert, ist,
dass der Auftraggeber im Keyword-Planer die richtige Liste vor sich hat — und
dass die nächste Änderung an dieser Liste nicht wieder elf Stellen still falsch
macht.
