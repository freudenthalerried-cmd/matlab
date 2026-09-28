# Alle Zahlen stimmten

**4. September 2026, Abend.** `npm run pruefe-schaufenster` misst 32 Kennzahlen
der PR-Beschreibung gegen den Bestand. Heute Abend meldete er: *Alle 32
Kennzahlen stimmen mit dem Verzeichnis überein.*

In derselben Beschreibung stand:

> *Der Shop nimmt keine Bestellung entgegen, sondern erzeugt Anfragen.*

Sechs Runden davor entschieden, gebaut, geprüft, von Ende zu Ende gefahren.

> **Ein Zahlenwerk, das stimmt, macht aus einem überholten Satz keinen
> richtigen.** Die Zahlen wurden gemessen, weil sie sich leicht messen lassen;
> der Satz daneben sagt mehr über den Shop als jede von ihnen.

## Aussagen statt nur Zahlen

`src/schaufenster.js` führt jetzt neben den Kennzahlen ein zweites Register:
**Aussagen**, die aus dem Bestand entscheidbar sind. Jede trägt den Zustand,
den Satz, der dann dastehen muss, und den, der dann **nicht** dastehen darf.

| Aussage | gemessen an |
|---|---|
| Bestellweg gebaut | `bestellwegBefund` über den Quelltext, den der Browser bekäme |
| Bestellweg eingeschaltet | `bestellwegAktiv` über `data/betreiber.json` |

Zwei Zustände, nicht einer. Wer sie verwechselt, verspricht dem Leser einen
Shop, der Bestellungen annimmt, während das Empfangsskript nicht einmal
ausgeliefert wird.

Was sich **nicht** entscheiden lässt, gehört nicht in diese Liste, sondern
bleibt ungemessener Fließtext. Eine Aussage mit erfundener Messung wäre
schlimmer als keine.

## Zwei Fehler beim Einbauen, beide lehrreich

**Die selbstbezügliche Zahl zählte die neuen Prüfungen nicht mit.** Die
Beschreibung nennt die Anzahl der Kennzahlen, und ein Eintrag prüft genau
diese Angabe — damit die Liste nicht wachsen kann, ohne dass die Beschreibung
es sagt. Er zählte `liste.length + 1` und übersah die Aussagen.

> **Die Stelle, die es gibt, damit nichts unbemerkt aus der Prüfung fällt,
> hätte als Erste zwei neue Prüfungen verschwiegen.**

**Und mein eigener Satz über den Fehler war der Fehler.** Ich hatte
geschrieben: *„Alle 32 Zahlen stimmten, und daneben stand weiter ‚der Shop
nimmt keine Bestellung entgegen'."* Der Prüfer meldete prompt die überholte
Aussage — er kann ein **Zitat** des alten Satzes nicht von dem Satz selbst
unterscheiden.

Derselbe Fall wie beim Leitzahlprüfer, der eine abgelöste Zahl nur mit ihrer
Bedingung daneben durchlässt. Hier ist die Lösung einfacher: Der Satz wird
umschrieben statt zitiert. Ein Muster zu entschärfen, damit die eigene Prosa
durchkommt, wäre der falsche Ausweg — dann prüft niemand mehr diese Aussage.

## Die Beschreibung ist veröffentlicht

Die Quelle im Verzeichnis war seit Tagen aktuell; die **veröffentlichte**
Fassung auf GitHub stand noch auf dem Stand vom 1. September — 19 Prüfer,
13 Etappen, 25 Gates, und kein Wort vom Bestellweg.

> **Ein Schaufenster, dessen Preisschilder im Lager richtig sind, ist immer
> noch ein Schaufenster mit falschen Preisschildern.**

`npm run pruefe-schaufenster` misst die Datei im Verzeichnis; die
veröffentlichte Fassung kann er nicht sehen, und das bleibt so — ein Prüfer,
der ins Netz greift, wäre in dieser Umgebung ohnehin gesperrt. Was hilft, ist
die Gewohnheit: **Wer die Quelle ändert, veröffentlicht sie.** Heute ist beides
gleich.

Aufgenommen sind dabei die fünf Befunde des Tages, die der Auftraggeber kennen
sollte: die beiden Hälften des Bestellwegs, die drei gegen acht Formularfelder,
die Bereitschaftsliste zum zweiten Mal, die 63.082 Wegwerfverzeichnisse und die
geratenen Ports.

## Was das für den Auftraggeber ändert

Die Beschreibung, die er zuerst liest, sagt seit heute Abend, was der Shop
kann: Er hat einen Bestellweg, und der wartet auf zwei Angaben von ihm.
