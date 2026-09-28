# Dieselbe halbe Auskunft, an drei Stellen

Stand: 2026-08-29

## Der Anlass

Der vorige Lauf hat den Produktfeed berichtigt: Er nannte 5,23 € je m² für
eine Platte, die es nur zu 0,75 m² gibt. Die Pflichtfrage danach lautet nicht
„ist der Feed jetzt richtig", sondern **„wo steht dieselbe halbe Auskunft
noch?"**

Sie stand an zwei weiteren Stellen, und die eine ist die wichtigste des
ganzen Vorhabens.

## Erstens: `llms.txt`

```
- [Isover TDPT 20 1200 600 mm 8,64 m2](…): 10,69 € je m², netto · Dämmung · palettiert
```

`llms.txt` ist die Datei, für die dieser Shop gebaut ist — der Kanal, über den
ein Assistent den Betrieb finden soll. Ein Assistent, der auf „was kostet die
Isover-Dämmplatte?" aus dieser Zeile antwortet, sagt **10,69 €**. Der Kunde,
der eine bestellt, bekommt eine Rechnung über **92,36 €**.

Das ist schlimmer als im Feed. Der Feed geht an eine Maschine, die Felder
kennt; `llms.txt` geht an ein Sprachmodell, das den Satz nimmt, wie er
dasteht.

Jetzt:

```
- [Isover TDPT 20 …](…): 10,69 € je m², netto · Abgabe ab 8,64 m² (92,36 €) · Dämmung · palettiert
- [XPS glatt SF 30 mm …](…): 5,23 € je m², netto · Abgabe ab 0,75 m² (3,92 €) · Dämmung · palettiert
- [PVC Kanarohr NW 100 1 m](…): 10,81 € je Stück, netto · Kanal
```

Die letzte Zeile ist die Gegenprobe im Bestand: **Stückgut bekommt keine
erfundene Mindestmenge.**

## Zweitens: die Artikelkarte

Die Kachel auf der Gruppenseite ist oft das Einzige, was ein Kunde von einem
Artikel sieht — er vergleicht sechs davon nebeneinander und klickt eine an.
Sie zeigte nur „5,23 € je m², netto".

Jetzt eine Zeile darunter: „ab 0,75 m² · 3,92 €". Damit steht auf der Kachel
beides — der Vergleichspreis und der Betrag, den eine Bestellung mindestens
kostet.

## Drei Stellen, ein Grund

| Ort | zeigte | zeigt jetzt |
| --- | --- | --- |
| Produktfeed (JSON-LD) | `price: 5.23` | dazu `referenceQuantity` und `eligibleQuantity` |
| `llms.txt` | „5,23 € je m², netto" | dazu „Abgabe ab 0,75 m² (3,92 €)" |
| Artikelkarte | „5,23 € je m², netto" | dazu „ab 0,75 m² · 3,92 €" |

Die Artikelseite selbst nannte es schon seit heute Vormittag. Genau das war
die Falle: **Ein Fehler, der an einer Stelle behoben ist, sieht behoben aus.**
Die drei Stellen, die ihn noch trugen, waren nicht vergessen worden — es hat
niemand nachgesehen, und der Bau hat nichts gemeldet, weil keine Prüfung nach
der Mindestmenge fragte.

Alle drei ziehen die Zahl aus derselben Funktion, `mengenschritt()`. Es gibt
keine vierte Fassung der Regel.

## Geprüft und gegengeprobt

826 Testfälle. Zwei neue, beide an der **gebauten Ausgabe** statt am Modell:

- `llms.txt` nennt bei Isover „Abgabe ab 8,64 m² (92,36 €)" und bei XPS
  „ab 0,75 m² (3,92 €)"; die Kanalrohr-Zeile nennt **keine** Mindestmenge;
  und die Zahl der Zeilen mit Mindestmenge liegt zwischen 12 und der
  Katalogzahl — sonst stimmte die Erkennung nicht.
- Die Dämmgruppe zeigt „ab 0,75 m² · 3,92 €", die Kanalgruppe **gar keine**
  solche Zeile.

| Gegenprobe | Ergebnis |
| --- | --- |
| Mindestmenge in llms.txt und Karte abgeschaltet | beide Testfälle fallen |

## Notiert

Fehlerklasse, neu formuliert: **eine Angabe, die an einer Stelle vollständig
ist und an drei anderen nicht.** Verwandt mit „zwei Wege zur selben Zahl",
aber nicht dasselbe — hier gibt es einen Weg zur Zahl, sie wird nur an drei
Stellen nicht mitgenommen.

Der Prüfstein dagegen ist billig und steht jetzt in beiden Tests: Nicht
prüfen, ob die Angabe *irgendwo* steht, sondern an **jeder** Stelle, an der
der Preis steht.
