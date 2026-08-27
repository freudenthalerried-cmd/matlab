# Die Fracht steht auf drei von fünfzehn Belegen — und 118,50 € fehlen im Modell

Stand: 2026-08-27. Der Lauf davor hat die Paketfrage beantwortet und dabei
zwei Lücken benannt: Der Katalog kennt **kein Gewicht**, und im
Streckengeschäft hat niemand das Paket in der Hand. Dieser Lauf ist den
Rechnungen noch einmal nachgegangen — und hat zwei Dinge gefunden, die
teurer sind als die Paketfrage.

## Erstens: Die Gewichte standen die ganze Zeit auf den Rechnungen

Jede Poschacher-Rechnung führt unter jeder Position eine Zeile:

```
1   21382     Grundmauerschutz 20/1,5 m       60,00 M2   4,450  ‐ 77,00 %
              Positionsgewicht:   25,80 Kg     2,00 RLL              61,38
…
Gesamtgewicht:   53,10 Kg
```

**Positionsgewicht je Zeile, Gesamtgewicht je Beleg.** Genau das Feld, das
gestern als „existiert nicht" aufgeschrieben wurde. Es existiert — nur hat
`positionen.py` es nie ausgelesen, weil es beim Bau des Katalogs um Preise
ging.

> Zum vierten Mal in dieser Woche: **Die Angabe war da, gesucht wurde
> anderswo.** Erst die Normen im eigenen Ablagefach, dann das
> Inhaltsverzeichnis des Konditionenblatts, dann die Anschrift auf der
> Fremdrechnung — und jetzt das Gewicht.

### Und warum es trotzdem noch nicht im Katalog steht

Ein erster Auslesedurchgang über alle fünfzehn Belege hat die
Positionsgewichte gesammelt und gegen das ausgewiesene **Gesamtgewicht**
gehalten — dieselbe Summenprobe, die beim Geld schon einmal einen stillen
Nullfund aufgedeckt hat.

**Sie schlägt bei elf von vierzehn Belegen fehl.** Und die Abweichungen
sind lehrreich:

| Beleg | ausgelesen | ausgewiesen | Differenz |
|---|---|---|---|
| 262016265 | 27,30 kg | 53,10 kg | **25,80** — genau das Gewicht der ersten Position noch einmal |
| 262021644 | 2.112,74 kg | 2.232,74 kg | **120,00** — sechs ÖBB-Paletten zu je 20 kg |

Die erste Zeile zeigt, dass das Positionsgewicht **nicht immer der
Zeilensumme entspricht**: Steht darunter eine zweite Mengenzeile
(„2,00 RLL"), bezieht es sich offenbar auf die Verpackungseinheit. Die
zweite zeigt, dass auch **Paletten wiegen** und in die Gesamtsumme
eingehen.

> **Die Gewichte kommen nicht in den Katalog, solange ihre eigene Probe
> fehlschlägt.** Eine Zahl, die man ausliest, ohne dass die Gegenrechnung
> aufgeht, ist eine Vermutung mit vier Stellen hinter dem Komma — und
> genau die Sorte Genauigkeit, die dieses Vorhaben an zwanzig Stellen als
> Fehlerquelle aufgeschrieben hat.

Was feststeht: **Die Daten sind vollständig vorhanden**, das Werkzeug muss
zwei Regeln mehr lernen (Verpackungseinheit, Paletten als eigene
Gewichtszeile), und die Summenprobe sagt danach selbst, ob es stimmt.

## Zweitens, und schwerer: Fracht steht auf drei von fünfzehn Belegen

Beim Durchsehen derselben Rechnungen fiel eine Zeile auf, die vorher nie
gelesen wurde: **`Versandart:`**.

| Versandart | Belege | Fracht berechnet? |
|---|---|---|
| **Abholung Kunde** | **11** | nein |
| Zustellung Dispo | 2 | **ja** |
| Retour durch Dispo | 1 | **ja** (80,26 €) |
| Retour durch Kunde | 1 | nein |

Das widerlegt eine Aussage, die seit dem 25. August in
`data/lieferanten.json` steht und von dort in mehrere Dokumente gewandert
ist:

> ~~„Die Frachtpauschale steht auf jedem Beleg, auch auf dem über
> 1.934 Euro. Das ist keine Annahme, sondern der Befund aus allen fünfzehn
> Rechnungen."~~

**Der Befund aus allen fünfzehn Rechnungen lautet anders: Der Auftraggeber
holt meistens selbst ab.** Am Lager Mauthausen, das auf jedem Beleg im
Kopf steht, samt Öffnungszeiten — auch das war die ganze Zeit lesbar.

### Was davon hält und was nicht

**Es hält:** Auf den beiden zugestellten Belegen ist die Pauschale
dieselbe — 110,00 € Liste minus 40 % = 66,00 €, plus 9,50 €
Energiekostenzuschlag, bei einem Nettowarenwert von 614 € genauso wie bei
1.934 €. **Eine Frei-Haus-Schwelle ist damit weiterhin nicht erkennbar**,
und Gate 20 bleibt richtig.

**Es hält nicht:** die Beweislast. Die Aussage stützt sich auf **zwei
Belege**, nicht auf fünfzehn. Zwei Punkte legen keine Kurve fest.

**Und es ändert die Lesart des ganzen Modells:** Die 75,50 € sind nicht
der Normalfall des Betriebs, sondern der Preis für Zustellung. Für den
**Shop** ändert das nichts — ein Shop liefert, sonst wäre er ein Lager mit
Website. Für die Kostenrechnung des Betriebs ändert es viel: Die
Frachtpauschale ist der Preis dafür, nicht selbst zu fahren.

Der Eintrag steht jetzt im Widerrufsregister (`fracht-auf-jedem-beleg`);
`npm run pruefe-widerrufe` meldet ab sofort jede Stelle, an der der alte
Wortlaut ohne seine Berichtigung wieder auftaucht.

## Drittens: 118,50 € Nebenkosten, die der Rechenkern nicht kennt

Der große Beleg (262021644, 16.06.2026) aufgeschlüsselt:

| | netto |
|---|---|
| Ware, fünf Positionen | 1.702,92 € |
| Frachtpauschale Mauthausen Lager | 66,00 € |
| Energiekostenzuschlag | 9,50 € |
| **Paletten ÖBB, 6 Stück à 22,00** | **132,00 €** |
| **Palettenrückgabe, 1 Stück** | **−20,00 €** |
| **Folierung** | **6,50 €** |
| Kranentladung, 5 Hübe à 7,50 | 37,50 € |
| **Nettowarenwert** | **1.934,42 €** |

Die Summe geht auf den Cent auf. Und der Rechenkern kennt davon **zwei
Positionen**: die Pauschale von 75,50 € und den Sperrgutzuschlag von 7,50 €
je Position.

> **Nicht gerechnet: 118,50 € — mehr als die Frachtpauschale selbst.**
> Paletten und Folierung sind auf diesem Beleg 6,1 % des Warenwerts. Gate 20
> prüft, ob eine Bestellung ihren Deckungsbeitrag trägt, und rechnet dabei
> zu optimistisch.

Das ist die vertraute Richtung: **eine Angabe, die anfällt und nicht
gerechnet wird.** Bisher war es die Zahlungsgebühr im Angebot und die
Fracht im Warenkorb; diesmal ist es die Palette.

### Warum daraus noch keine Formel wird

Die **Stückpreise** stehen fest und liegen jetzt in `lieferanten.json`
unter `nebenkosten`. Die **Stückzahl** steht nicht fest: Wie viele Paletten
eine Lieferung braucht, hängt an Gewicht und Packmaß — und das Gewicht ist
oben aus gutem Grund noch nicht im Katalog.

Eine erfundene Palettenzahl wäre schlimmer als keine. Die Kette ist
deshalb:

1. Gewichtsauslesung reparieren, bis die Summenprobe aufgeht
2. `gewichtKg` je Artikel in den Katalog, mit Quellenangabe
3. Palettenzahl je Teillieferung daraus schätzen — **als Spanne, nicht als Zahl**
4. Gate 20 mit den Nebenkosten neu rechnen

Bis dahin gilt: Der Rechenkern ist an dieser Stelle **nachweislich
optimistisch**, und das steht jetzt an der Quelle — in `lieferanten.json`,
nicht nur in diesem Bericht.

### Ein Nebenbefund für die Paketfrage

Die Kranentladung fiel auf dem großen Beleg **fünfmal bei fünf
Warenpositionen** an. Die Modellannahme „ein Zuschlag je Sperrgutposition"
trifft dort zu — belegt ist sie damit aus **einem** Beleg.

Und: Zwei Frachtartikelnummern mit gleichem Preis unterscheiden
**„Mauthausen Lager" (53265)** von **„Mauthausen Baustelle" (30667)**. Der
Lieferant trennt also zwischen Lieferung ans Lager und auf die Baustelle,
verlangt aber dasselbe. Für die Frage nach dem Liefergebiet ist das ein
Hinweis: Die Pauschale staffelt nicht nach Ziel.

## Stand

| | |
|---|---|
| Gewichtsdaten | **vorhanden** auf allen Belegen, Auslesung fehlerhaft, nicht übernommen |
| Frachtaussage | **berichtigt** an der Quelle und im Widerrufsregister |
| Nebenkosten | Stückpreise erfasst, Stückzahl offen, Gate 20 zu optimistisch |
| Gate 20 | bleibt gültig, rechnet aber zu günstig — die Richtung des Fehlers ist bekannt |

677 Testfälle grün, 13 Shopszenarien grün, 11 Oberflächenszenarien grün.
