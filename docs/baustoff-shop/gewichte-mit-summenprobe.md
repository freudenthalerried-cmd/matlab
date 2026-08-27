# Sieben Gewichte, vier saubere Belege — und zehn ungeklärte Reste

Stand: 2026-08-27. Der Lauf davor hat entdeckt, dass die Gewichte auf den
Rechnungen stehen, und sie **nicht** übernommen: Die Summenprobe schlug
bei elf von vierzehn Belegen fehl. Dieser Lauf hat die Auslesung gebaut,
die Probe verschärft — und das Ergebnis ist bescheiden und belastbar.

## Das Werkzeug: `werkzeuge/gewichte.py`

Es liest je Position das `Positionsgewicht`, hält die Summe gegen das
ausgewiesene `Gesamtgewicht` und **verwendet nur Belege ohne Rest**.

> **Keine Zahl ohne bestandene Summenprobe.** Ein Gewicht, dessen
> Gegenrechnung nicht aufgeht, ist eine Vermutung mit zwei Stellen hinter
> dem Komma.

Zwei Dinge musste es lernen, die der erste Anlauf falsch hatte:

1. **Positionen stehen auf mehreren Seiten.** Die großen Belege haben
   zwei; der Kopf wiederholt sich, und eine naive Auslesung zählt
   Positionen doppelt.
2. **Nebenkosten tragen Gewicht.** Eine Einwegpalette wiegt 20 kg, eine
   ÖBB-Palette 24 kg, und beide gehen ins Gesamtgewicht ein. Sie zählen
   für die Probe mit und **nicht** in den Artikelkatalog — eine Palette ist
   keine Ware.

## Das Ergebnis

| | |
|---|---|
| Belege mit Gesamtgewicht | 14 |
| **davon ohne Rest** | **4** (262018401, 262024862, 262029541, 262029542) |
| Artikel mit eindeutigem Gewicht je Einheit | **7** |
| Widersprüche zwischen Belegen | **0** |

Null Widersprüche ist die eigentlich gute Nachricht: Wo zwei saubere
Belege denselben Artikel führen, nennen sie dasselbe Gewicht. Die Daten
sind konsistent — die Auslesung ist es noch nicht überall.

| Artikelnummer | Gewicht | Artikel |
|---|---|---|
| 13550 | **24,000 kg** je Sack | Baumit ThermoMörtel 50, 40 l |
| 10095 | **1,733 kg** je Stück | PVC Kanalrohr NW 100, 1 m |
| 10134 | **0,643 kg** je Stück | PVC Kanalabzweiger 100/100 45° |
| 10115 | **0,285 kg** je Stück | PVC Kanalbogen NW 100 30° |
| 10116 | **0,285 kg** je Stück | PVC Kanalbogen NW 100 45° |
| 19333 | 1,000 kg je kg | Capatect PrimaPor K20 |
| 13728 | 1,000 kg je kg | Capatect Putzgrund |

Die letzten beiden sind ehrlicherweise **keine Information**: Bei einem
Artikel, der nach Kilogramm verkauft wird, ist das Gewicht je Einheit ein
Kilogramm. Sie stehen trotzdem im Katalog, weil sie für die Summe einer
Bestellung zählen.

## Was die fünf echten Gewichte sagen — und es ist mehr, als sie wiegen

**Die ganze Kanalgruppe ist leicht.** Rohr 1,73 kg je Meter, Bogen
0,285 kg, Abzweiger 0,643 kg.

Eine typische Kanalbestellung — 20 m Rohr, zehn Formteile — wiegt damit
rund **40 Kilogramm**. Das sind zwei Pakete.

| | |
|---|---|
| Höchstgewicht Post-Paket | 31,5 kg |
| Höchstgewicht GLS | 40 kg |
| typische Kanalbestellung | **rund 40 kg** |

Und Kanal ist ausgerechnet die Gruppe mit dem **größten Preisvorteil**:
81 bis 84 % unter Listenpreis, aus den Rechnungen zurückgerechnet.

> **Die Warengruppe mit dem besten Einkauf ist zugleich die, die in ein
> Paket passt.** Das ist der erste belegte Anhaltspunkt dafür, dass der
> Paketweg aus `paketversand-kleine-einheiten.md` kein theoretischer ist.

Belegt ist damit noch nichts über die Kosten: Die Pakettarife stammen aus
Suchauszügen und sind weiterhin **Hinweis, keine Fundstelle**. Belegt ist,
dass die Ware ins Paket passt.

## Die zehn Reste, und warum hier keine Regel steht

| Beleg | Rest |
|---|---|
| 262016265 | 25,80 kg |
| 262016266 | 0,45 kg |
| 262021644 | 120,00 kg |
| 262021645 | 1,11 kg |
| 262024863 | 24,00 kg |
| 262027463 | 262,80 kg |
| 262027464 | 470,40 kg (Retourbeleg) |
| 262029540 | 0,30 kg |
| 262030087 | 49,02 kg |
| 262030088 | 475,00 kg (Retourbeleg, keine Positionen erkannt) |

Zwei Beobachtungen, ausdrücklich als Beobachtungen:

- Bei 262016265 und 262024863 entspricht der Rest **genau dem Gewicht der
  ersten Position** — und beide Male trägt diese Position eine zweite
  Mengenzeile („2,00 RLL", „10,00 STK").
- Bei den Retourbelegen ist der Rest groß; dort stehen negative Mengen,
  die die Positionserkennung nicht sauber trifft.

**Daraus wird hier keine Regel.** Zwei Stichproben, ein einleuchtendes
Muster — das ist genau die Konstellation, die diese Woche schon zweimal zu
einer falschen These geführt hat (`lagerhaus-rabatte-gelesen.md`) und beim
dritten Mal bewusst nicht mehr aufgeschrieben wurde. Die Reste stehen als
Zahlen da; wer sie erklärt, erklärt sie mit mehr als zwei Belegen.

## Was im Shop davon zu sehen ist

- **Artikelseite:** eine Zeile „Gewicht" in der Preistafel. Wo es fehlt,
  steht `—` und „liegt uns nicht belegt vor" — nicht „0 kg".
- **Warenkorb:** das Gesamtgewicht der Bestellung, und daneben, wie viele
  Positionen **kein belegtes Gewicht** haben. Bei gemischten Körben steht
  „mindestens".

> Eine Summe über Artikel mit unbekanntem Gewicht ist eine Untergrenze,
> die wie eine Summe aussieht. Der Warenkorb sagt deshalb beides: was er
> weiß und wie viel er nicht weiß.

Ein Testfall hält fest, dass ein Artikel ohne belegtes Gewicht **nicht zu
null** wird, und ein zweiter, dass kein Katalogartikel ein Gewicht ohne
Quellenangabe trägt.

## Stand und nächster Schritt

| | |
|---|---|
| Gewicht im Katalog | **7 von 46 Artikeln**, alle mit `gewichtQuelle: "rechnung"` |
| Werkzeug | `werkzeuge/gewichte.py`, Summenprobe eingebaut |
| Rohdaten | `preise/gewichte-aus-rechnungen.json` (gitignore-gedeckt) |
| offen | zehn Belege mit Rest; Positionserkennung auf Retourbelegen |
| Gate 20 | weiterhin ohne Paletten- und Folierungskosten — die Palettenzahl hängt am Gewicht |

Der nächste Schritt ist die Positionserkennung auf den Belegen mit Rest.
Jeder zusätzliche saubere Beleg bringt Gewichte, und mit genug Gewichten
lässt sich die Palettenzahl je Lieferung schätzen — **als Spanne, nicht als
Zahl**, und damit endlich Gate 20 mit den vollen Nebenkosten rechnen.

681 Testfälle grün, 14 Shopszenarien grün.
