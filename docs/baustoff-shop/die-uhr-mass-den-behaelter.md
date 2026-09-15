# Die Uhr maß den Behälter

**14. September 2026, siebte Runde.**

## Der Anlass

Beim Blick auf den Schnelllauf stand plötzlich eine Meldung da, die es seit
Tagen nicht gegeben hatte:

```
3 Prüfer über der Sekunde aus Gate 38 — sie gehören angesehen und entweder
beschleunigt oder mit Grund nach NICHT_IM_HAKEN:
  ! pruefe-inhalte — 1.8 s
  ! pruefe-widerrufe — 13.1 s
  ! pruefe-allaussagen — 3.8 s
```

Dreizehn Sekunden für einen Prüfer wäre ein Fund. Einzeln nachgemessen:

| Prüfer | im Lauf | allein |
|---|---|---|
| `pruefe-widerrufe` | 13,1 s | **0,75 s** |
| `pruefe-inhalte` | 1,8 s | **0,53 s** |
| `pruefe-allaussagen` | 3,8 s | **0,24 s** |

Keiner davon ist langsam. Der Behälter war beschäftigt — mit meiner eigenen
Arbeit in derselben Umgebung.

> **Eine Meldung, die bei Last erscheint und bei Ruhe nicht, sagt etwas über
> die Last.**

Und eine Meldung, die zufällig erscheint, wird gelesen wie keine — dieselbe
Lehre wie beim Prüfer, der Lärm macht: *er wird ruhiggestellt statt befolgt.*

## Was der Prüfer schon richtig machte

Sein eigener Kopf hatte den Fall vorweggenommen:

> *„Rot wird davon nichts: Ein langsamer Prüfer ist kein Fehler im Bestand, und
> eine Sperre über eine Laufzeit hielte irgendwann einen Commit auf, weil der
> Rechner gerade beschäftigt war. Gemeldet wird er."*

Die Entscheidung war richtig. Was fehlte, war eine Ebene tiefer: Nicht nur die
**Sperre** darf nicht an der Last hängen, sondern auch die **Meldung**.

## Der Griff

Wer über der Grenze liegt, wird **ein zweites Mal gemessen** — und nur wer
zweimal darüber liegt, steht in der Meldung. Beide Zahlen werden genannt; ihr
Abstand ist das Maß für die Last.

Der zweite Lauf kostet nur dort, wo der erste angeschlagen hat. Unter
künstlicher Last gemessen: Der Lauf dauerte 10,7 s statt 7,9 s — und meldete
**keinen** langsamen Prüfer mehr.

## Und die Prüfung machte zuerst denselben Fehler

Mein erster Testfall sicherte zu, dass bei ruhiger Maschine **keine** Meldung
kommt. Er fiel prompt um, als die Gegenprobe unter Last lief.

> **Wer eine wackelige Messung prüft, darf die Prüfung nicht auf dieselbe
> Wackelei stellen.**

Eine Zusicherung über die Abwesenheit einer lastabhängigen Meldung ist selbst
lastabhängig. Geprüft wird jetzt das **Verhalten** — am Quelltext, und an einer
Grenze, die so klein ist, dass jeder Prüfer sie reißt. Beides unabhängig davon,
was der Rechner sonst gerade tut.

## Die Naht senkt und hebt nicht

`SCHNELLLAUF_GRENZE_MS` setzt die Grenze für die Prüfung herunter — und kann
sie nicht heraufsetzen: `Math.min(1000, …)`.

> **Wäre die Grenze aus Gate 38 über eine Umgebungsvariable zu heben, wäre sie
> keine Entscheidung mehr, sondern eine Einstellung** — und ein langsamer
> Prüfer ginge durch, indem jemand die Zahl hochsetzt statt den Prüfer
> anzusehen.

Der Testfall dazu liest den Quelltext auf `Math.min` und ausdrücklich **nicht**
auf `Math.max`.

## Was geändert wurde

| Datei | was |
|---|---|
| `bin/schnelllauf.mjs` | `nachgemessen()`; gemeldet wird nur, wer zweimal über der Grenze liegt; beide Zahlen in der Meldung; `SCHNELLLAUF_GRENZE_MS` als senkende Naht |
| `test/schnelllaufzeit.test.js` | drei Testfälle, keiner lastabhängig |
| `test/haken.test.js` | die Zusicherung auf die Grenze folgt der neuen Schreibweise |

Eine Gegenprobe, rot gesehen: `die-zeitmeldung-wird-nicht-mehr-nachgemessen`.

## Offen

Gemessen wird weiter **Uhrzeit** und nicht Rechenzeit. Zwei Messungen fangen
den Fall ab, in dem der Rechner kurz beschäftigt ist; gegen eine Last, die
länger dauert als beide Läufe zusammen, helfen sie nicht. Rechenzeit eines
Kindprozesses gibt Node nicht heraus — wer es genauer will, braucht `/proc`
oder eine andere Sprache für die Messung, und das wäre ein Werkzeug für ein
Werkzeug.
