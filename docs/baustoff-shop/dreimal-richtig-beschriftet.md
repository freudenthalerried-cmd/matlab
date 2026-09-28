# Dreimal richtig beschriftet und trotzdem nicht vergleichbar

Stand: 2026-08-29

## Der Fund

Zwei Artikel aus demselben Sortiment, beide mit „25 kg" im Namen:

| Artikel | Preis auf der Seite | Einheit | ein Sack kostet |
| --- | --- | --- | --- |
| Capatect Putzgrund weiß 25 kg | **2,77 €** | je kg | **69,25 €** |
| Baumit KlebeSpachtel 25 kg | **14,32 €** | je Sack | **14,32 €** |

Der teurere sieht fünfmal billiger aus.

Und das Ärgerliche daran: **Beschriftet ist alles korrekt.** Die Karte auf der
Gruppenseite sagt „2,27 € je kg, netto". Die Artikelseite sagt „Netto 2,77 €
je kg, für Unternehmer". Das Mengenfeld sagt „Menge in kg". Dreimal
hingeschrieben, dreimal richtig — und ein Bauleiter, der zwei Kacheln
nebeneinander sieht, liest trotzdem falsch.

> **Wer eine Zahl dreimal richtig beschriftet, hat noch keine vergleichbare
> Zahl geliefert.**

Der Fund kam aus einer anderen Richtung: Beim Nachsehen, ob im ausgelieferten
Datenblock noch Einkaufsdaten stehen, fiel `POS-13728` mit `gewichtKg: 1` bei
einem „25 kg"-Produkt auf. Der Verdacht war falsch — die Einheit ist
tatsächlich `KG`, ein Kilogramm wiegt ein Kilogramm, das Gewichtsregister ist
sauber. Die Zeile daneben war der eigentliche Befund.

## Was jetzt dasteht

**Auf der Artikelseite** der jeweils fehlende Preis, mit der Angabe, woher er
kommt:

```
Netto        2,77 €    je kg, für Unternehmer
Je Gebinde  69,25 €    netto, für 25 kg aus der Bezeichnung
```

und umgekehrt beim Sackpreis:

```
Netto       14,32 €    je Sack, für Unternehmer
Je Kilogramm  0,57 €   netto, aus 25 kg je Gebinde gerechnet
```

**Auf den Gruppenseiten Mörtel und WDVS** eine Tafel „Was ein Kilogramm
kostet", nach Kilopreis sortiert — dasselbe Muster wie die Stärkentafel der
Dämmgruppe. Der Bestand ordnet sich darin so:

| Artikel | Gebinde | je Gebinde | je kg |
| --- | --- | --- | --- |
| Capatect Klebe- und Spachtelmasse 186 M | 25 kg | 14,00 € | **0,56 €** |
| Baumit KlebeSpachtel | 25 kg | 14,32 € | **0,57 €** |
| Capatect Klebe- und Spachtelmasse 190 FEIN | 25 kg | 15,00 € | **0,60 €** |
| Ravenit Vergussmörtel | 25 kg | 36,25 € | **1,45 €** |
| Capatect PrimaPor K20 weiß | 25 kg | 56,75 € | **2,27 €** |
| Capatect Putzgrund weiß | 25 kg | 69,25 € | **2,77 €** |
| Schiedel Fugenmasse FM | 1,5 kg | 46,29 € | **30,86 €** |

Erst so sieht man, dass Capatect 186 M und Baumit KlebeSpachtel auf den Cent
gleich teuer sind — als Kachel nebeneinander sagen 14,00 € und 14,32 € nichts
darüber, weil die eine je Kilogramm und die andere je Sack gilt.

## Die Regel aus dem Plattenfehler gilt hier genauso

Am 28. August wurde eine Dämmplatte mit **60 cm Stärke** gezeichnet, weil die
erste Zahl mit „mm" die Plattenbreite war. Daraus die Regel: *Die erste Zahl
mit `mm` ist nicht die Stärke, sondern die erste Zahl mit `mm`.* Hier gilt sie
für Kilogramm, und sie ist scharf gefasst:

- **Genau eine** kg-Angabe im Namen. Zwei Angaben heißen, dass die Funktion
  nicht weiß, welche das Gebinde ist — sie gibt `null` zurück.
- **Grenzen 0,1 bis 50 kg.** Darüber ist es keine Gebindegröße dieses
  Sortiments; die Zahl meint dann etwas anderes.
- **Liter sind kein Gewicht.** „Baumit ThermoMörtel 50 **40 l**" und „Soudal
  Perimeterkleber B3 **750 ml**" bekommen keinen Kilopreis. Ihn zu rechnen
  hieße, eine Dichte zu erfinden.
- **Fläche und Länge auch nicht.** Ein Preis je m² lässt sich ohne
  Flächengewicht nicht in einen Kilopreis umrechnen.
- Und die Wortgrenze trägt Umlaute: `(?![\p{L}\d])` statt `\b`, aus demselben
  Grund wie bei `marke()` und `bauform()`.

Von 46 Artikeln bekommen deshalb **7** den zweiten Preis. Die Tafel sagt
darunter, wie viele fehlen und warum — eine Tafel, die schweigend kürzt,
sieht vollständig aus und ist es nicht.

## Geprüft und gegengeprobt

Zehn Testfälle, darunter zwei, die am **Bestand** rechnen: Jede Zeile der
Tafel muss sich aus ihrem eigenen Katalogpreis ergeben, und beide Fälle —
Kilopreis im Katalog und Gebindepreis im Katalog — müssen darin vorkommen.
Ohne die zweite Zusicherung wäre der Test grün, sobald die Erkennung nur noch
einen Fall trifft.

Gegengeprobt durch Verstümmeln:

| Eingriff | Ergebnis |
| --- | --- |
| Plausibilitätsgrenze ausgeschaltet | 1 Test fällt |
| Gebindepreis statt mal geteilt | 2 Tests fallen, einer davon am Bestand |

Dazu zwei Seitentests: Die Mörtel-Gruppenseite muss die Tafel tragen **und**
die ausgelassenen Artikel nennen; die beiden Artikelseiten müssen den jeweils
gerechneten Preis zeigen, nicht denselben zweimal.

## Was das nicht ist

Keine Bauteilempfehlung. In der Tafel stehen Klebespachtel und Oberputz
nebeneinander, und die gehören an verschiedene Stellen der Wand — der Satz
steht unter der Tafel. Ein Preisvergleich sagt, was ein Kilogramm kostet, und
nicht, welches Kilogramm gebraucht wird.
