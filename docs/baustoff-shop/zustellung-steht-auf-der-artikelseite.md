# Die Zustellung steht jetzt auf der Artikelseite — und der erste Entwurf log

**28. August 2026.** Seit heute früh nennt der Produktfeed die Zustellkosten
je Artikel. Die Artikelseite, die derselbe Kunde zuerst sieht, verwies
weiterhin nur auf die Frachtseite. **Der Maschinenkanal war ehrlicher als die
Kundenseite** — das ist die falsche Reihenfolge.

Jetzt steht auf jeder Artikelseite:

| | |
|---|---|
| Zustellung | **83,00 €** netto je Lieferung, inkl. Kranentladung |
| Ware | 1,93 € je m², netto |
| gleich viel wert | **44 m²** — ab hier übersteigt die Ware die Zustellung |

Gerechnet mit `fracht()`, derselben Funktion wie Warenkorb und Feed. Ein Weg
zur Zahl, wie seit heute Vormittag überall.

## Der erste Entwurf war irreführend

Er verglich die Zustellung mit dem Preis **je Einheit** und meldete deshalb
bei fast jedem Artikel: *„Allein bestellt kostet die Zustellung mehr als die
Ware."*

Das stimmt für **einen** Quadratmeter Dämmplatte und für nichts sonst. Wer
100 m² bestellt, hat 193 € Warenwert und 83 € Fracht — ein ganz normales
Verhältnis im Baustoffhandel.

> **Eine Zahl, die für die kleinstmögliche Bestellung stimmt, ist keine
> Warnung, sondern eine Fehlinformation** — sie beschreibt einen Fall, den es
> nicht gibt.

Der Fehler ist die zweite Ausprägung derselben Sache an einem Tag: Am
Vormittag verglich der Feed die Fracht mit dem Artikel, hier die Seite. Der
Unterschied: Im Feed **ist** die Zahl der Preis für eine Ein-Positions-
Bestellung und damit richtig; auf der Seite stand daneben ein Satz, der aus
ihr eine Bewertung machte.

Ersetzt durch die Zahl, die der Kunde wirklich braucht: **ab welcher Menge
der Warenwert die Zustellung übersteigt.** Aufgerundet — bei 43 m² läge er
noch darunter. Aus denselben zwei Zahlen gerechnet, ohne Bewertung.

Beispiele aus dem Bestand: Kanalrohr 8 Stück, Klebespachtel 135 kg,
Fassaden-EPS 44 m².

## Geprüft

- Jede der 46 Artikelseiten nennt Zustellung und Schwelle
- Die Schwelle ist von Hand nachgerechnet (83,00 ÷ 1,93 = 43,0 → **44**)
- Der irreführende Satz darf nicht zurückkommen — eigene Probe über alle
  Seiten
- Mutation (abrunden statt aufrunden): zwei Proben fallen

765 Tests, `pruefe-seiten` 58 Seiten / 263 Absätze / 0 Verdacht, `shopprobe`
29 Szenarien.

## Nebenbei: das dritte Einstiegsdokument

`phase1-nischen.md` — im Arbeitsloop namentlich als Pflichtlektüre genannt —
begann mit „Bewertung gegen die harten Gates: ≥ 32 % Rohmarge". Nach der
Berichtigung von `PARAMETER.md` hätte ein Lauf zwei Sätze weit gelesen und
zwei Widersprüche gefunden. Die Seite trägt jetzt denselben Vorspann wie die
anderen beiden: historisch, gehört zum Radon-Modell, die Begründungen bleiben
brauchbar. Damit sind alle drei Dokumente, die der Loop zuerst liest, auf
Stand.
