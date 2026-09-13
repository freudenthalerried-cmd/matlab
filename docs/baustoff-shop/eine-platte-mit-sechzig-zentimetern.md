# Eine Dämmplatte mit 60 cm Stärke — und was ein Zentimeter kostet

**28. August 2026.** Zurück zur Ware. Beim Bau einer Vergleichstafel für die
Dämmgruppe fiel zuerst ein Fehler auf der Artikelseite auf.

## Der Fund

„Isover TDPT 20 1200 600 mm 8,64 m2" wurde als Platte mit **600 mm Stärke**
gezeichnet und so beschriftet. Die 600 sind die Plattenbreite; die Stärke
steckt in der Typkennung „TDPT 20" und ist als Maß nicht erkennbar.

Die Bildbeschreibung sagte dazu „Stärke maßstäblich" — für ein
Vorleseprogramm und für jedes Modell, das die Seite liest, war das die einzige
Angabe zum Bild.

> **Die erste Zahl mit „mm" ist nicht die Stärke, sondern die erste Zahl mit
> „mm".**

Behoben mit einer Plausibilitätsgrenze: Über 300 mm ist keine Plattenstärke,
die dieses Sortiment führt. Dann gibt `dickeMm()` **nichts** zurück, die
Zeichnung beschriftet sich mit „Platte", und die Bildbeschreibung sagt
„Stärke nicht aus der Bezeichnung ablesbar". Lieber keine Angabe als eine
erfundene — dieselbe Regel wie beim fehlenden Gewicht und beim fehlenden
Merkblatt.

Mitgenommen: Die Beschriftung las die Stärke bis dahin mit einem **zweiten**
Ausdruck aus derselben Bezeichnung. Deshalb stand „600 mm" unter einer Platte,
die längst mit der Voreinstellung gezeichnet war. Jetzt hat beides einen
Ursprung — dieselbe Lehre wie heute Vormittag bei Fracht und Deckungsbeitrag,
nur zwei Größenordnungen kleiner.

Die tatsächliche Stärke des Isover-Typs steht im Herstellermerkblatt.
`isover.at` ist aus dieser Umgebung gesperrt (403 am Ausgangsproxy, heute
nachgesehen), also bleibt sie offen — als Strich in der Tabelle, nicht als
Schätzung.

## Die Vergleichstafel

Neu auf der Dämmgruppe: **„Was ein Zentimeter Stärke kostet."** Ein Kunde
vergleicht Dämmplatten nicht nach dem Quadratmeterpreis — eine 3-cm-Platte für
2,81 € ist nicht billiger als eine 5-cm-Platte für 4,67 €.

| Platte | Stärke | je m², netto | je m² und cm |
|---|---|---|---|
| XPS glatt SF 100 mm | 100 mm | 16,00 € | **1,60 €** |
| XPS glatt SF 80 mm | 80 mm | 13,95 € | 1,74 € |
| XPS rau GK 80 mm | 80 mm | 15,00 € | 1,88 € |
| XPS glatt SF 50 / 30 mm | 50 / 30 mm | 8,72 / 5,23 € | 1,74 € |
| Fassaden EPS 5 / 3 / 2 cm | 50 / 30 / 20 mm | 4,67 / 2,81 / 1,93 € | 0,93–0,97 € |
| Isover TDPT 20 | — | 10,69 € | — |

Was die Tafel zeigt, sieht man ohne sie nicht: **XPS kostet über alle Stärken
konstant 1,74 € je Zentimeter**, die 100-mm-Platte fällt mit 1,60 € heraus —
sie ist die günstigste Art, XPS zu kaufen. Die raue Sockelplatte kostet 8 %
Aufschlag für die verputzbare Oberfläche.

**Zwei Zusagen macht die Tafel ausdrücklich nicht**, und beide stehen
darunter: Sie vergleicht nicht die Dämmwirkung — die steht im
Wärmeschutznachweis, nicht im Preis — und nicht über die Plattenart hinweg.
EPS ist je Zentimeter halb so teuer wie XPS und gehört trotzdem nicht dorthin,
wo XPS hingehört. Ohne diesen Satz liest sich die Tabelle als Empfehlung und
führt genau zu dem Fehler, vor dem die Wissensseite warnt: EPS bis zum Boden
durchgezogen, weil es billiger war.

Die Tafel erscheint nur, wo eine Gruppenseite sie ausdrücklich anfordert
(`vergleich: staerke`). Auf Rohren oder Sackware wäre „je cm" eine Zahl ohne
Bedeutung — und eine Zahl ohne Bedeutung wird trotzdem verglichen.

## Geprüft

- Zwei Stichproben in der Probe von Hand nachgerechnet (16,00 € bei 100 mm =
  1,60 €; 2,81 € bei 30 mm = 0,94 €)
- Die Platte ohne ablesbare Stärke bekommt keinen gerechneten Preis
- Nur `gruppe/daemmung.html` trägt die Tafel
- Neunte 390-px-Rahmenprobe: Die vierspaltige Tabelle steht im eigenen
  Scrollkasten, die Seite scrollt nicht seitwärts
- Mutation (Plausibilitätsgrenze entfernt): fünf Proben fallen

742 Tests grün, `pruefe-tests` 741 / 0, `pruefe-seiten` 58/217/0,
`shopprobe` 29 Szenarien (9 im Rahmen).
