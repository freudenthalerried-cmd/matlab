# Neun Zahlen, die einmal richtig waren

**1. September 2026.** Die Beschreibung von PR #14 ist das Erste, was der
Auftraggeber liest. Nachgemessen:

| stand dort | war |
|---|---|
| 616 Testfälle | 1.059 (beim Messen) |
| 77 Seiten | 81 |
| 23 Gates, Stand 26. August | 24 Gates, Stand 27. August |
| 3 Systemlisten | 4 |
| Median 27 % unter Liste | 26,7 % — nachträglich berichtigt, siehe `zwei-rechnungen-ein-median.md` |
| Kamin 8,79 € / Dämmung 6,48 € | 8,22 € / 5,91 € |
| „6 Suchkampagnen, importfertig" | 3 im ersten Anlauf, drei zurückgestellt |
| „Domain und Hosting" offen | bauversand.com bei All-Inkl, seit dem 31.08. entschieden |
| „11 Oberflächenszenarien" | 11 plus 50 Shopszenarien |

**Keine dieser Zahlen war je falsch.** Sie waren einmal richtig und sind es
nicht geblieben.

Das ist dieselbe Bauart wie der Seitenfuß mit dem festen „Vorschau ohne
Bestellmöglichkeit", den ich vor einer Stunde abgestellt habe: eine Aussage
ohne Quelle, die keinen Anlass hat, sich zu ändern. Nur stand sie diesmal
nicht im Verzeichnis, sondern nur auf GitHub — das einzige Artefakt dieses
Vorhabens ohne Quelle im Bestand, und ausgerechnet das meistgelesene.

> **Ein Zahlenwerk, das nur beim Schreiben stimmt, ist ein Schaufenster mit
> einem Preisschild von letztem Jahr.**

Die peinlichste Zeile ist „Domain und Hosting" unter „Was fehlt". Ich habe
die Domain am 31. August selbst eingetragen, ein Dokument darüber
geschrieben — und in der Liste, die der Auftraggeber abarbeiten soll, stand
sie am nächsten Tag weiter als offener Punkt.

## Was jetzt gilt

Die Beschreibung hat eine Quelle: `docs/baustoff-shop/pr-beschreibung.md`.
`npm run pruefe-schaufenster` misst **24 Kennzahlen** daraus gegen das
Verzeichnis — Artikel, Seiten je Art, Gates, Testfälle, Szenarien, Prüfer,
Feedeinträge, Artikel ohne GTIN, Listenpreisvorteil, Höchstgebote,
rekonstruierbare Einkaufspreise.

Jede Kennzahl bringt ein **Muster mit einer Fanggruppe** mit. Der Prüfer
liest die Zahl dort, wo sie steht, und vergleicht sie mit einer Messung.

### Drei Ausgänge statt zwei

| Befund | heißt |
|---|---|
| `veraltet` | die Zahl im Text stimmt nicht mehr — nachziehen |
| `anker` | das Muster findet in der Beschreibung nichts mehr |
| `ungemessen` | zu dieser Kennzahl gibt es keinen Messwert |

Der mittlere ist der, um den es geht. Wer den Satz umschreibt, in dem eine
Zahl steht, nimmt dem Prüfer den Halt — und **eine Wache ohne Halt ist eine
Vermutung.** Ein nicht gefundenes Muster ist deshalb ein Fehler und keine
übersprungene Zeile.

Der dritte ebenso: Ohne die ausdrückliche Prüfung wäre `undefined ===
undefined` grün gewesen. Eine Kennzahl ohne Messwert prüft nichts und sähe
aus wie eine bestandene.

### Genaue Zahlen und Untergrenzen

Die meisten Kennzahlen stehen still: 46 Artikel, 24 Gates, 81 Seiten. Die
Zahl der Testfälle tut das nicht — sie hat sich an diesem Vormittag dreimal
geändert. Eine Beschreibung, die dabei jedes Mal veraltet, macht den Prüfer
zum Dauerroten.

> **Ein Dauerroter wird abgeschaltet, nicht befolgt.**

Deshalb zwei Arten. `genau` für das Stille. `mindestens` für das Bewegliche:
Der Text nennt eine runde Untergrenze („über 1.000 Testfälle"), und gemessen
wird, dass sie **gilt** — und dass sie noch etwas sagt. Wer bei 5.000
Testfällen „über 1.000" schreibt, sagt nichts Falsches und trotzdem nichts
mehr; ab dem Doppelten meldet der Prüfer, dass die Untergrenze nachgezogen
gehört.

### Was er ausdrücklich nicht prüft

Die Prosa. Er hält 24 Zahlen fest, sonst nichts; eine überholte Einschätzung
findet er nicht. Das steht in seiner eigenen Ausgabe, damit ein grüner Lauf
nicht für mehr genommen wird, als er ist.

## Die Wache von vor einer Stunde hat gehalten

`npm run pruefe-schaufenster` war der zehnte Prüfer. Beim ersten Testlauf
danach:

```
not ok 14 - Jeder pruefe-Befehl steht im Register des Prüferprüfers
```

Die Probe, die ich in der Stunde davor gegen genau diese Auslassung
geschrieben hatte, ist beim ersten echten Anlass angesprungen — an einer
Auslassung, die ich selbst gemacht habe, zwei Stunden nachdem ich dieselbe
Auslassung gefunden hatte.

## Ein Fehler, den der Prüfer sofort gefunden hätte

Beim Hochladen habe ich zwei Sätze ergänzt, die in der Quelldatei nicht
standen — die Notiz über die neue Quelle und eine Tabellenzeile. Damit war
die Drift innerhalb einer Minute wieder da, in der Richtung, die ich gerade
abgestellt hatte. Nachgetragen.

**Wer eine Quelle einführt und dann am Erzeugnis weiterschreibt, hat keine
Quelle eingeführt, sondern eine zweite.**

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Seitenzahl in der Beschreibung auf 77 zurückgesetzt | ja — Prüfer rot |
| „81 Seiten" ausgeschrieben („Einundachtzig") | ja — Anker weg |
| fehlenden Messwert als grün gewertet | ja |
| Untergrenze: Prüfung auf „gilt noch" abgeschaltet | ja |
| Untergrenze: Prüfung auf „sagt noch etwas" abgeschaltet | ja |
| `pruefe-schaufenster` wieder aus dem Register genommen | ja |

## Stand

- 1.064 Tests, 0 rot
- 10 Prüfer ohne Browser, 3 Browserproben — alle grün
- PR-Beschreibung auf GitHub aus der Quelldatei gesetzt

Nichts an diesem Lauf löst Ausgaben aus.
