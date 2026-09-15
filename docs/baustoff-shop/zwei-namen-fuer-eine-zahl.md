# Zwei Namen für eine Zahl

**11. September 2026, achtzehnte Runde.** Diesmal die Zahl, mit der jedes
Höchstgebot je Klick multipliziert wird.

## Der Befund

`bin/kampagne.mjs` rechnet das Höchstgebot einer Anzeigengruppe als
**Deckungsbeitrag des Referenzwarenkorbs × Kaufquote**. Die Kaufquote stand
dort als eigene Zahl:

```js
const kaufquote = argZahl('kaufquote', 0.02);
```

Dieselbe Zahl steht als Annahme `umsatzProSession` in
`src/empfindlichkeit.js` — mit Herkunft, Konfidenz und der Angabe, wann sie
sich klären lässt. Und mit dieser Zeile:

> *„DIESELBE GRÖSSE wie die Kaufquote der Kampagne (bin/kampagne.mjs) — **zwei
> Namen für eine Zahl**"*

Das stand in einem **Satz** und nicht in einem **Aufruf**.

Der Satz, der das entscheidet, steht in derselben Datei, siebzig Zeilen tiefer,
unmittelbar an der Gebotsrechnung — geschrieben am 28. August, als dort ein
nachgebauter Warenkorb stand:

> **Zwei Wege zu derselben Zahl bedeuten, dass einer davon irgendwann alt ist
> — und es ist immer der, den man beim Ändern vergisst.**

## Warum gerade diese Kopie zählt

Die Kaufquote ist nach dem eigenen Risikodokument **die Zahl, an der alles
hängt**: Unter 0,77 % trägt das Modell nicht einmal den billigsten Marktklick,
gerechnet wird mit 2 %, Faktor 2,6 dazwischen. Sie steht in den Kennzahlen, in
den Leitzahlen, in der Empfindlichkeitsrechnung und im Rollout-Plan — überall
als **Annahme**, die der Klickversuch erst prüfen soll.

Wird sie eines Tages berichtigt, bewegt sich all das mit. Die Gebote wären als
einzige stehengeblieben.

> **Das Gebot ist die einzige Stelle, an der eine Annahme noch am selben Tag zu
> einer Zahlung wird.**

Heute stimmen beide Zahlen überein — und genau dieser Zufall war das, was
niemand messen konnte.

## Die Kopien, gezählt

| Stelle | Art |
|---|---|
| `src/empfindlichkeit.js` | die geführte Annahme, mit Herkunft und Konfidenz |
| **`bin/kampagne.mjs`, Gebotsrechnung** | **abgeschriebene Zahl — behoben** |
| `bin/kampagne.mjs`, Aufrufzeile im Kopfkommentar | dritte Kopie — jetzt ohne Zahl |
| `bin/rollout.mjs`, `bin/werbeprobe.mjs` | Szenarienlisten (2 %, 1 %, 0,5 %) — keine Kopie, sondern der Zweck |

Die Aufrufzeile nennt die Zahl nicht mehr, statt sie mitzupflegen: *Eine
Kopie, die man nicht braucht, wird nicht nachgezogen, sondern entfernt.*

## Was die Probe dabei selbst kaputt gemacht hat

Der Prüffall führt `bin/kampagne.mjs` zweimal aus — einmal ohne Schalter,
einmal mit halbierter Quote, damit auch die Gegenrichtung belegt ist (der
Schalter muss weiterhin vorgehen; ohne ihn wäre die Annahme keine Annahme mehr,
sondern eine Festlegung).

Der erste Wurf ließ beide Läufe nach `ausgabe/kampagne/` schreiben. Der zweite
Lauf ersetzte damit `keywords.csv` — und rot wurde ein ganz anderer Prüfer, der
die Messliste gegen die Keywords hält.

> **Eine Probe, die das Erzeugnis verändert, prüft den Bestand nicht mehr, sie
> verschiebt ihn.**

Daraus folgte die zweite Änderung dieser Runde: `bin/kampagne.mjs` nimmt jetzt
`--nach <Ordner>`. *Ein Werkzeug, das nur an eine Stelle schreiben kann, lässt
sich nicht durchrechnen, ohne das Erzeugnis zu ändern.* Der Prüffall schreibt
in einen Wegwerfordner.

## Die Gegenprobe

Sie mutiert **die Kampagne**, nicht das Register — und schreibt ihr eine
**andere** Zahl in den Quelltext (0,03 statt 0,02). Das ist der Kern: Mit 0,02
stimmten die beiden zufällig überein. Eine Mutation, die den Zufall
beibehält, zeigt nichts.

Sie meldete rot an der erwarteten Stelle.

## Was diese Runde nicht gefunden hat

Auf dem Weg dorthin gemessen und in Ordnung: die sechs Referenzwarenkörbe
liegen zwischen 393 € und 2.150 € netto und damit alle über dem
Mindestbestellwert von 250 € — ein Gebot ruht also auf keinem Korb, den die
eigene Kasse zurückweisen würde. Und der Deckungsbeitrag kommt seit dem
28. August aus `berechneWarenkorb`, also aus derselben Rechnung wie im Shop.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2257 | **2258** |
| Gegenproben | 165 | **166** |
| Prüfer | 49 | 49 |

`npm test` grün (2258 bestanden, 3 übersprungen), `npm run pruefe-tests` (2261
Testfälle, 0 mit Verdacht), `npm run pruefe-ungerufen` grün, `npm run
pruefe-pruefer` (49 Prüfer, 1 abgebrochen — `pruefe-gebinde`). Die Gebote sind
unverändert: 4,19 € WDVS, 5,91 € Dämmung, 9,41 € Kamin.
