# Das Gesamtkostenbild — und was es mit dem Besucherbedarf macht

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/kostenbild.js`,
13 Testfälle.

Wareneinkauf, Fracht und Zahlungsgebühr waren einzeln gerechnet, aber nie
zusammengeführt. Diese Datei zieht die Kaskade einmal durch und dreht sie dann
um: nicht „wie viel bleibt bei 24.200 € Umsatz", sondern **„wie viel Umsatz
braucht es, damit am Ende die Zielgröße steht"**. Daran hängt die ganze
Planung, denn aus dem Umsatz folgen Bestellungen und aus den Bestellungen der
Besucherbedarf.

## Was von einer Bestellung übrig bleibt

Am durchgerechneten Referenzgebäude — 12 × 10 m, vier Durchführungen, mit
Drainage, Kartenzahlung, 10 % Werbekostenanteil:

```
Bruttobetrag                    3.900,20 €
− Umsatzsteuer 20 %               650,03 €
= Warenwert netto + Fracht      3.250,17 €
      davon Fracht (durchlaufend)  162,00 €

Warenwert netto                 3.088,17 €
− Wareneinsatz                  2.030,80 €
= Rohertrag                     1.057,37 €   (34,2 % Mischmarge)
− Werbung 10 %                    308,82 €
− Zahlungsgebühr 1,4 % + 0,25 €    54,85 €
= bleibt                          693,70 €   (22,5 %)
```

**Von 34,2 % ausgewiesener Mischmarge bleiben 22,5 %.** Das ist keine
Überraschung, sondern eine Rechnung, die bisher niemand aufgeschrieben hatte —
und sie erklärt, warum die Margenuntergrenze aus Gate 1 bei 32 % liegt und
nicht tiefer.

Ein Nebeneffekt, der leicht übersehen wird: Die Fracht ist margenneutral, weil
sie eins zu eins weitergegeben wird — aber sie steht im Bruttobetrag und damit
in der Bemessungsgrundlage der Zahlungsgebühr. **Man zahlt Gebühr auf
durchlaufende Fracht.** Bei 162 € Fracht sind das 2,72 € je Bestellung, im
Monat rund 100 €.

## Der nötige Umsatz, nach Zahlweg

Realistisches Szenario aus [`phase3-unit-economics.md`](./phase3-unit-economics.md):
35 % Rohmarge, 10 % Werbekostenanteil, 650 € Fixkosten, Warenkorb 650 € netto,
Zielgewinn 5.374 € vor Steuer, Umsatzquote 2 %.

| Zahlweg | Umsatz/Monat | Bestellungen | Sessions | Mehrumsatz |
|---|---|---|---|---|
| Vorkasse | 24.096 € | 38 | 1.900 | — |
| EPS | 25.225 € | 39 | 1.950 | +1.129 € |
| Karte 1,4 % | 25.875 € | 40 | 2.000 | +1.779 € |
| Karte 1,8 % | 26.419 € | 41 | 2.050 | +2.323 € |
| PayPal | 27.434 € | 43 | 2.150 | +3.338 € |
| B2B-Rechnungskauf | 28.150 € | 44 | 2.200 | +4.054 € |

Der Preis eines Zahlwegs lässt sich damit anders ausdrücken als in Gebühren:
**Der Rechnungskauf kostet 4.054 € Mehrumsatz im Monat und sechs zusätzliche
Bestellungen.** Das ist die verständlichere Größe, weil Bestellungen die knappe
Ressource sind — nicht Euro.

## Der Befund: Der Sessionbedarf in STATUS.md ist die untere Ecke

[`STATUS.md`](./STATUS.md) führt für den Shop **1.850 Sessions im Monat**. Diese
Zahl entsteht aus 37 Bestellungen bei 2 % Umsatzquote — also aus einer
Rechnung ohne Zahlungsgebühren und bei 35 % Rohmarge.

Beides ist die günstigste Annahme. Gate 1 lässt eine Rohmarge bis hinunter zu
**32 %** zu; das ist die Schwelle, unterhalb derer die Nische fällt, nicht die
erwartete Größe. Rechnet man an dieser Untergrenze:

| Rohmarge | Zahlweg | Umsatz/Monat | Bestellungen | Sessions |
|---|---|---|---|---|
| 35 % | Vorkasse | 24.096 € | 38 | 1.900 |
| 35 % | Karte | 25.875 € | 40 | 2.000 |
| **32 %** | Vorkasse | 27.382 € | 43 | 2.150 |
| **32 %** | Karte | 29.702 € | 46 | **2.300** |
| **32 %** | Rechnungskauf | 32.739 € | 51 | **2.550** |

**Der Sessionbedarf liegt also zwischen 1.900 und 2.550 im Monat, nicht bei
1.850.** Die dokumentierte Zahl ist der beste Fall, nicht der mittlere. Für
eine Kennzahl, an der die Reichweitenfrage und damit die zweite Freigabe hängt,
ist das ein Unterschied von bis zu 38 %.

`STATUS.md` trägt die Spanne jetzt ein.

### Eine Zahlengleichheit, die keine Bestätigung ist

Der ungünstigste Fall — 32 % Rohmarge mit Rechnungskauf — ergibt **2.550
Sessions**. Genau diese Zahl steht in
[`phase7b-messstrecke.md`](./phase7b-messstrecke.md), dort aber aus einer ganz
anderen Herleitung: aus der Messstrecke und ihren Abbruchquoten.

Das ist Zufall zweier Rundungen und **kein Beleg**. Zwei Wege, die zufällig auf
dieselbe Zahl fallen, bestätigen einander nicht — sie erhöhen nur die
Verwechslungsgefahr. Der Hinweis steht hier, damit ein späterer Lauf die beiden
Zahlen nicht für dieselbe hält.

## Kein neues Gate

Der Befund ändert keine Entscheidung. Gate 1 bleibt bei 32 %, Gate 3 bleibt bei
18–30 Monaten, die Modellwahl bleibt nach Gate 4 vertagt. Was sich ändert, ist
die Genauigkeit einer Planungsgröße — und die Erkenntnis, dass die
Zahlwegwahl aus [`zahlwege-und-gebuehren.md`](./zahlwege-und-gebuehren.md)
nicht nur eine Kostenfrage ist, sondern über 300 bis 650 zusätzliche Besucher
im Monat entscheidet.

Für die Entscheidung „Rechnungskauf gestuft einführen" ist das ein zweites
Argument: Er kostet nicht nur 871 € im Monat, er verlangt auch **sieben
zusätzliche Bestellungen und 300 zusätzliche Besucher**, um sich selbst zu
tragen. Ob er im Gegenzug genug zusätzliche Kunden bringt, ist genau die Frage,
die die Abbruchquote an der Zahlungsauswahl beantwortet.

## Was an dieser Rechnung unsicher bleibt

Die Kaskade ist arithmetisch geschlossen und geprüft; unsicher sind ihre
Eingangsgrößen, und zwar dieselben wie zuvor:

- **Rohmarge 35 %** — unbelegt, entscheidet sich an den dreizehn Anfragen (zwölf Hersteller, ein Großhändler).
- **Werbekostenanteil 10 %** — Annahme aus Phase 3, nicht gemessen.
- **Umsatzquote 2 %** — Annahme; im B2B-Fachhandel mit erklärungsbedürftigem
  Produkt eher optimistisch.
- **Warenkorb 650 € netto** — aus der Stückliste hergeleitet, Konfidenz mittel.

Verschiebt sich die Umsatzquote von 2 % auf 1 %, verdoppelt sich der
Sessionbedarf auf 3.800 bis 5.100. Das ist der empfindlichste Hebel der ganzen
Rechnung, und er ist derjenige, über den am wenigsten bekannt ist.
