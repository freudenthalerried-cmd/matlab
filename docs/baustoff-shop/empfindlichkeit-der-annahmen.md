> **Achtung, Spannung zu STATUS.md.** Dieses Dokument kommt bei der Frage,
> welche Freigabe zuerst laufen sollte, zu einem anderen Ergebnis als
> [`STATUS.md`](./STATUS.md). Beide Begründungen sind gültig; sie messen
> verschiedene Dinge. Der Abgleich steht unten unter „Was das für die zwei
> Freigaben heißt".

# Welche der vier Annahmen zuerst gemessen gehört

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext:
`shop/src/empfindlichkeit.js`, 14 Testfälle.

Die ganze Planung ruht auf vier Zahlen: Rohmarge, Werbekostenanteil,
Umsatzquote und Warenkorb. Keine davon ist belegt. Was bisher fehlte, ist die
Frage, welche von ihnen am meisten wehtut, wenn sie danebenliegt — und damit
die Antwort darauf, wofür das erste Geld ausgegeben wird.

Gemessen wird die Wirkung auf den **Besucherbedarf**, nicht auf den Umsatz. Der
Umsatz ist eine Zwischengröße; die Besucher sind das, was tatsächlich
beschafft werden muss, und laut
[`kostenbild-und-sessionbedarf.md`](./kostenbild-und-sessionbedarf.md) der
Engpass des ganzen Modells.

## Die Rangfolge

Ausgangslage: 35 % Rohmarge, 10 % Werbekostenanteil, 650 € Warenkorb, 2 %
Umsatzquote, Kartenzahlung. Jede Annahme einzeln um zehn Prozent ins
Ungünstige verschoben:

| Annahme | Sessions | wird zu | Elastizität | Konfidenz |
|---|---|---|---|---|
| **Rohmarge** | 2.000 | 2.350 | **1,75** | unbelegt |
| Warenkorb netto | 2.000 | 2.250 | 1,25 | hergeleitet, mittel |
| Umsatzquote je Besuch | 2.000 | 2.223 | 1,11 | Annahme |
| Werbekostenanteil | 2.000 | 2.100 | 0,50 | Annahme |

Eine Elastizität von 1,0 hieße: proportional. Alles darüber verstärkt.

**Die Rohmarge ist der stärkste Hebel, und zwar deutlich.** Zehn Prozent
weniger Marge — von 35 % auf 31,5 % — kosten 350 zusätzliche Besucher im
Monat. Derselbe relative Fehler beim Werbekostenanteil kostet 100.

Der Grund ist die Bauform der Rechnung: Die Rohmarge steht im Nenner der
Deckungsbeitragsrate. Sie wirkt nicht linear, und ihre Wirkung wächst, je näher
man der Untergrenze kommt. Bei 32 % — der Schwelle aus Gate 1 — liegt ihre
Elastizität schon bei **1,96**.

## Ein zweiter Effekt beim Warenkorb, den man leicht übersieht

Der Warenkorb liegt mit 1,25 höher, als man erwartet. Proportional wäre 1,0:
halb so großer Warenkorb, doppelt so viele Bestellungen.

Der Rest kommt von der Zahlungsgebühr. Ihr Fixbetrag von 0,25 € verteilt sich
auf weniger Warenwert, also steigt der Gebührenanteil, also sinkt die
Deckungsbeitragsrate — und der nötige Umsatz steigt zusätzlich. **Ein kleinerer
Warenkorb schadet zweifach.**

Ein Testfall hält das fest, indem er den Vergleich mit dem Rechnungskauf zieht:
Der hat keinen Fixbetrag, und dort fällt der zweite Effekt weg.

Praktische Folge: Die Rollenbindung aus
[`phase4-sortiment-und-materialwert.md`](./phase4-sortiment-und-materialwert.md),
die den Warenkorb nach oben treibt, ist nicht nur ein Argument gegenüber dem
Kunden. Sie ist ein Beitrag zur Tragfähigkeit.

## Der Kipppunkt

Nur eine der vier Annahmen kann das Modell zum Kippen bringen:

| Annahme | Kipppunkt |
|---|---|
| Rohmarge | bei **11,6 %** — dort fressen Werbung und Gebühren den ganzen Rohertrag |
| Werbekostenanteil | keiner im geprüften Bereich bis +90 % |
| Umsatzquote | keiner — sie macht das Modell teurer, nicht untragbar |
| Warenkorb | keiner |

Das ist beruhigender, als es klingt: 11,6 % Rohmarge liegen weit unter dem, was
im Baustoffhandel überhaupt vorkommt, und Gate 1 zieht die Reißleine ohnehin
schon bei 32 %. Die anderen drei Annahmen können das Vorhaben nicht unmöglich
machen, sondern nur teuer.

Die Umsatzquote verdient trotzdem einen eigenen Satz: Halbiert sie sich von 2 %
auf 1 %, verdoppelt sich der Besucherbedarf auf rund 4.400. Kein Kipppunkt, aber
eine Verdopplung der schwierigsten Beschaffungsaufgabe.

## Was das für die zwei Freigaben heißt

Hier entsteht eine Spannung, und sie gehört ausgesprochen.

[`STATUS.md`](./STATUS.md) sagt: *„Muss eine zuerst, dann das Keyword-Werkzeug:
Es entscheidet über beide Modelle, während die Herstelleranfragen nur den Shop
betreffen."* Das ist ein Argument über **Reichweite** — eine Messung, die zwei
Entscheidungen klärt, ist mehr wert als eine, die eine klärt.

Diese Rechnung sagt: Für den Shop ist die **Rohmarge** die mit Abstand
empfindlichste Größe, und sie ist die einzige der vier, die überhaupt einen
Kipppunkt hat. Das ist ein Argument über **Wirkung**.

Beide stimmen. Sie widersprechen einander nur, wenn man sie für dieselbe Frage
hält:

| | Keyword-Werkzeug | Herstelleranfragen |
|---|---|---|
| Klärt | Suchvolumen → Gate 15, beide Modelle | Rohmarge → Gate 1, 2, 6, nur der Shop |
| Elastizität der geklärten Größe | — (klärt nicht die Umsatzquote) | 1,75 bis 1,96 |
| Kosten | 100–200 €/Monat | 0 € |
| Kippt das Modell? | nein | ja, als einzige |

Ein Punkt, der dabei aufgefallen ist und der in `STATUS.md` so nicht steht:
**Das Keyword-Werkzeug misst nicht die Umsatzquote.** Es misst Suchvolumen,
also wie viele Besucher überhaupt erreichbar sind — nicht, welcher Anteil von
ihnen bestellt. Die Umsatzquote von 2 % bleibt auch nach dieser Ausgabe eine
Annahme; sie klärt sich erst im laufenden Betrieb.

**Entscheidung: Die Empfehlung in `STATUS.md` bleibt, aber mit einem Zusatz.**
Die Herstelleranfragen kosten nichts und klären die empfindlichste Größe — sie
haben keinen Grund zu warten. Die Reihenfolgefrage stellt sich überhaupt nur,
wenn eine der beiden zurückgestellt werden soll, und das ist bei einer Freigabe
über 0 € nicht sinnvoll. `STATUS.md` trägt den Zusatz jetzt ein.

**Kein neues Gate.** Die Entscheidungsregel aus Gate 17 bleibt unverändert; hier
kommt nur eine Begründung dazu, warum die kostenlose Freigabe nicht auf die
kostenpflichtige warten sollte.

## Was diese Rechnung nicht kann

Sie misst die Empfindlichkeit **innerhalb** des Modells. Sie sagt nichts
darüber, wie wahrscheinlich eine Abweichung ist — und das wäre die zweite
Hälfte der Antwort.

Eine Rohmarge, die um zehn Prozent danebenliegt, ist wahrscheinlicher als ein
Warenkorb, der um zehn Prozent danebenliegt, weil die eine unbelegt und der
andere aus einer Stückliste hergeleitet ist. Diese Gewichtung steckt in der
Spalte „Konfidenz" und ist bewusst **nicht** in die Rangfolge eingerechnet:
Eine Zahl, die Empfindlichkeit und Wahrscheinlichkeit vermischt, sieht
belastbarer aus, als sie ist.

Wer beides zusammennimmt, kommt zum selben Ergebnis: Die Rohmarge ist zugleich
die empfindlichste und die am schlechtesten belegte der vier.
