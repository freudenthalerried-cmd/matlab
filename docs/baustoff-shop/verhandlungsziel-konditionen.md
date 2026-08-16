# Die Zahl, mit der man in ein Konditionsgespräch geht

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/verhandlung.js`,
13 Testfälle.

Bisher lief die Rechnung in eine Richtung: Einkauf plus Zielmarge ergibt den
Verkaufspreis, gedeckelt bei der UVP. Für eine Konditionsverhandlung ist das
die falsche Richtung. Dort steht die Frage andersherum — *ich will zu einem
marktüblichen Preis verkaufen und dabei die Untergrenze halten, welchen Rabatt
brauche ich dafür?*

Der Anlass steht in
[`auswertungsbogen-hersteller.md`](./auswertungsbogen-hersteller.md): 35 %
Händlerrabatt erlauben nur 4,4 % Nachlass auf die UVP. Diese Datei dreht die
Rechnung um und liefert die Zahl, die ins Anschreiben gehört.

## Der Befund: Zehn Prozent Nachlass kosten 38,8 % Rabatt

Verkauft wird zu (1 − Nachlass) × UVP, eingekauft zu (1 − Rabatt) × UVP. Aus
der Margenbedingung folgt

```
Rabatt = 1 − (1 − Nachlass) × (1 − Marge)
```

und daraus diese Tabelle:

| Gewünschter Nachlass auf die UVP | für 32 % Marge | für 38 % Marge | für 42 % Marge |
|---|---|---|---|
| 0 % | 32,0 % | 38,0 % | 42,0 % |
| 5 % | 35,4 % | 41,1 % | 44,9 % |
| **10 %** | **38,8 %** | **44,2 %** | 47,8 % |
| 15 % | 42,2 % | 47,3 % | 50,7 % |
| 20 % | 45,6 % | 50,4 % | 53,6 % |

**Jeder Prozentpunkt Nachlass kostet mehr als einen Prozentpunkt Rabatt.** Zehn
Punkte Preisspielraum verlangen 6,8 zusätzliche Rabattpunkte bei 32 % Marge und
6,2 bei 38 %. Das ist kein Kleingedrucktes, sondern die Größenordnung, um die
eine Verhandlung geführt wird.

Für die Abdichtungsbahn, die nach
[`phase2-lieferantenlandkarte.md`](./phase2-lieferantenlandkarte.md) rund 38 %
tragen muss, lautet die Forderung bei zehn Prozent Nachlass also **44,2 %** —
nicht 38 %, und schon gar nicht die 35 % aus Gate 2.

## Was das für die Anschreiben heißt

Anschreiben A fragt heute nach dem Händlerrabatt und lässt die Antwort offen.
Das ist höflich und teuer: Wer nach einer Zahl fragt, ohne eine zu nennen,
bekommt die des Gegenübers.

**Die Staffel gehört ins Anschreiben**, nicht nur eine Zahl. Sie zeigt dem
Hersteller, dass die Forderung begründet ist, und sie macht die Antwort
vergleichbar:

> Für ein Sortiment, das im Onlinehandel mit üblichen Nachlässen von rund zehn
> Prozent auf die UVP arbeitet, ergibt sich daraus ein Bedarf von 38 bis 44 %
> Händlerrabatt, je nach Warengruppe.

**Kein neues Gate.** Gate 2 bleibt bei ≥ 35 %; das ist die Schwelle, unter der
gar nichts geht. Was hier dazukommt, ist das *Verhandlungsziel* — und das liegt
höher als die Schwelle. Der Unterschied zwischen beidem gehört benannt, damit
eine Zusage von 35 % nicht als Erfolg verbucht wird, wenn sie nur ein knappes
Bestehen ist.

Die Ergänzung ist in [`anschreiben-entwuerfe.md`](./anschreiben-entwuerfe.md)
unter „Was vor dem Versand zu klären ist" eingetragen. **Versendet ist nichts.**

## Der Rückwärtskatalog

Aus denselben Formeln entsteht je Artikel ein Zielpreis für den Einkauf — die
Liste, die man einer Verhandlung zugrunde legt. Bei zehn Prozent Nachlass, die
Abdichtung auf 38 %:

| Artikel | Gruppe | EK-Ziel | nötiger Rabatt | heutiger Platzhalter | Abstand |
|---|---|---|---|---|---|
| DR-100-050 | Drainage | 100,98 € | 38,8 % | 115,50 € | +14,52 € |
| DR-FT-SET | Drainage | 88,74 € | 38,8 % | 101,50 € | +12,76 € |
| DR-KS-100 | Drainage | 72,22 € | 38,8 % | 82,60 € | +10,38 € |
| DR-SL-100 | Drainage | 25,70 € | 38,8 % | 29,40 € | +3,70 € |
| AB-RD-375 | Abdichtung | 222,08 € | 44,2 % | 230,84 € | +8,76 € |
| AB-PR-010 | Abdichtung | 53,57 € | 44,2 % | 55,68 € | +2,11 € |
| ZB-DB-150 | Zubehör | 47,74 € | 38,8 % | 48,36 € | +0,62 € |
| ZB-MA-SET | Zubehör | 68,54 € | 38,8 % | 69,44 € | +0,90 € |
| ZB-RR-125 | Zubehör | 39,17 € | 38,8 % | 39,68 € | +0,51 € |

**Alle neun liegen über dem Ziel** — und das ist keine Aussage über den Markt,
sondern über die Platzhalter. Die heutigen Werte stammen aus angenommenen
Händlerrabatten von 30, 38 und 42 %; sie sind erfunden und tragen deshalb
`ekQuelle: "platzhalter"`. Die Spalte steht trotzdem da, weil sie zeigt, wie die
Auswertung aussehen wird, sobald echte Zahlen eintreffen.

Bemerkenswert ist die **Verteilung**, nicht die Höhe. Die vier Drainageartikel
liegen am weitesten daneben, das Zubehör fast auf dem Ziel. Das ist derselbe
Befund wie im Katalog des Funktionsmusters, wo die Drainage auf WARN steht —
nur diesmal in Euro statt in einer Ampel.

## Was diese Rechnung nicht klärt

**Wie viel Nachlass tatsächlich nötig ist.** Die zehn Prozent sind eine
Annahme; ob Handwerksbetriebe im Radonsegment überhaupt vergleichen, ist
ungemessen. Bei einem Produkt, das über eine Genehmigungsauflage gekauft wird
und nicht über einen Preisvergleich, könnte der nötige Nachlass deutlich kleiner
sein — dann fiele auch die Forderung.

Das ist ausdrücklich die optimistische Möglichkeit, und sie ist nicht
einzuplanen. Die Rechnung steht bewusst auf der vorsichtigen Seite: Wer 44 %
verlangt und 40 % bekommt, hat immer noch Luft. Wer 35 % verlangt und 35 %
bekommt, hat keine.

**Nebenabreden bleiben draußen.** Boni, Werbekostenzuschüsse und
Erstausstattungsrabatte können eine schwache Grundkondition verbessern, hängen
aber an Bedingungen, die im ersten Jahr niemand erfüllt. Sie gehören nicht in
den Rabattsatz — dieselbe Grenze wie im Auswertungsbogen.
