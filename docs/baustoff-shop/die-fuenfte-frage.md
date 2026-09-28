# Die fünfte Frage, und drei Zahlen, die im Satz standen

**3. September 2026.** Gate 25 hat eine Stunde davor den Mindestbestellwert auf
250 € gesetzt und dabei offen gelassen, worauf er ruht:

> Die **Palettenzahl je Lieferung** ist weiter nicht ableitbar. Sie ist die
> eine Angabe, die diese Grenze von einer vorsichtigen Schätzung in eine
> Rechnung verwandeln würde — und sie steht in keiner der vier Fragen an den
> Lieferanten.

Ein offener Punkt, der eine getroffene Entscheidung trägt und in keinem
Register steht, ist kein offener Punkt, sondern eine Lücke im Rücken der
Entscheidung. Sie steht jetzt in `src/offenepunkte.js` — und war damit
augenblicklich rot:

```
1 Meldung(en):
  ✗ palettenzahl: offener Punkt, den keine Frage schließt
```

Das ist die Richtung, für die es `punkteOhneFrage` gibt: **Ein Punkt ohne
Frage bleibt nach dem Gespräch offen, und niemand merkt es, weil das Gespräch
stattgefunden hat.**

## Warum jetzt fünf Fragen und nicht mehr vier

Der Kopf von `lieferantenanfrage.js` begründet, warum es vier waren: Wer einem
Lieferanten zwölf Fragen schickt, bekommt keine Antwort — jede zusätzliche
Frage senkt die Wahrscheinlichkeit aller übrigen. Diese fünfte kostet den Platz
trotzdem zu Recht, und sie steht hinter der Frachtfrage, weil beide dieselbe
Lieferung betreffen: Wer zwei verwandte Fragen zusammen stellt, stellt
eigentlich eine.

> Wonach richtet sich die Zahl der Paletten je Lieferung, und ab welcher Menge
> kommt eine zweite dazu? Auf unserer Rechnung über 1.934 € netto stehen sechs
> Paletten zu je 22,00 € plus Folierung — für eine kleinere Bestellung können
> wir daraus nicht ableiten, womit wir rechnen müssen.

Wie beim Preisrhythmus zwei Tage davor steht die eigene Beobachtung in der
Frage: Sechs Paletten auf 1.934 € netto sind rund **322 € Einkauf je Palette**.
Ein einziger Beleg, und ausgerechnet bei voluminöser Leichtware kehrt sich das
Verhältnis um — 50 m² Fassaden-EPS sind 96,50 € und eine halbe Palette. Aus
einem Punkt lässt sich keine Regel ziehen; aus einem Punkt lässt sich eine
genauere Frage stellen.

## Drei Zahlen, die als Wort im Satz standen

Die fünfte Frage hat drei Stellen umgeworfen, an denen eine Menge **als Wort**
geschrieben stand:

| Stelle | Stand | jetzt |
|---|---|---|
| `bin/anfragepruefung.mjs` | „sperrt das Gespräch, das **acht** schließt" | die Länge der Liste |
| `src/rollout.js` | „Löst **acht** offene Punkte auf einmal" | ohne Zahl, dafür mit Aufzählung |
| `test/lieferantenanfrage.test.js` | `const ACHT = [ … ]` | `GRUPPE`, gegen das Register gehalten |

Die dritte ist die interessante. Die Probeliste war von Hand geschrieben, und
die Testfälle prüften die Fragen **gegen diese Liste**. Der neue Punkt fehlte
darin — also gingen sie auf, während `pruefe-anfrage` rot meldete.

> **Eine Probe, die ihre eigene Menge mitbringt, prüft ihre Menge.**

Dieselbe Familie wie der Prüfer der Prüfer am 1. September („8 Prüfer befragt",
während neun liefen) und wie der Abgleich, der bis zum 31. August seine eigenen
Tafeln las. Ein neuer Testfall hält die Probeliste jetzt gegen
`OHNE_WERKZEUG`: Jeder handgeführte Punkt der Gruppe „Anfrage" muss darin
vorkommen.

## Stand

`npm run offenepunkte` führt **18 Punkte in 4 Gruppen**, neun davon in der
Gruppe „Anfrage an Dritte". Alle neun werden von einer der fünf Fragen
geschlossen; der Brief selbst bleibt nicht versandfähig, solange
`betreiber.email` und `betreiber.telefon` leer sind — **der billigste offene
Punkt sperrt das Gespräch, das neun schließt.**
