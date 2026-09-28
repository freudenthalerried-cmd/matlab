# Eine Schwelle, die niemand bestellen kann

Stand: 2026-08-29

## Der Fund

Auf jeder Artikelseite steht seit dem 28. August die Zahl, die ein Bauleiter
wirklich braucht: **ab welcher Menge der Warenwert die Zustellung
übersteigt.** Für die XPS-Platte stand dort:

> Zustellung 83,00 € · Ware 5,23 € je m² · **gleich viel wert: 16 m²**

83,00 ÷ 5,23 = 15,87, aufgerundet 16. Richtig gerechnet — und trotzdem eine
Zahl, mit der niemand etwas anfangen kann: **Die Platte wird in Einheiten zu
0,75 m² abgegeben. 16 m² gibt es nicht.** Lieferbar sind 16,5 m², also 22
Platten.

Das ist dieselbe Fehlerklasse wie der Preis, den man für nichts bekommt, nur
in der anderen Spalte: *eine Menge, die genannt und nicht bestellbar ist.*
Und wieder ist es eine Zahl, die ich selbst zwei Tage zuvor eingeführt habe —
mit einer Begründung, die auf halbem Weg stehen blieb.

## Wie es gefunden wurde

Nicht durch Nachdenken, sondern durch die Frage aus dem vorigen Lauf: **Wo
steht dieselbe Angabe noch?** Für die Fracht habe ich die vier Ausgaben
nebeneinandergelegt — Lieferseite, Artikelseite, Wissensseite, `llms.txt` —
und dabei fiel die Zeile daneben auf.

Die Fracht selbst war in Ordnung: 75,50 € plus 7,50 € Kranentladung ergeben
auf der Artikelseite 83,00 €, `llms.txt` verweist auf die Lieferseite statt
Zahlen zu wiederholen, und die Systemlisten nennen bewusst keine Mengen
(„Fläche + Verschnitt, **in Paketeinheiten**"). Der Befund lag in der Nachbar-
zeile.

## Was jetzt dasteht

| Artikel | Zustellung ÷ Preis | vorher | jetzt |
| --- | --- | --- | --- |
| XPS glatt SF 30 mm (0,75 m²) | 15,87 m² | 16 m² | **16,5 m²** (22 Platten) |
| Capatect Putzgrund (25 kg) | 27,26 kg | 28 kg | **50 kg** (2 Gebinde) |
| Fassaden EPS 2 cm (0,5 m²) | 43,01 m² | 44 m² | **43,5 m²** (87 Platten) |
| PVC Kanalrohr (Stückgut) | 7,68 Stück | 8 Stück | **8 Stück** |

Die letzte Zeile ist die Gegenprobe im Bestand: Ohne Gebindebindung bleibt es
bei der ganzen Zahl.

Bemerkenswert ist die dritte: **44 war lieferbar** — 44 m² sind 88 Platten —
und trotzdem falsch. Die Schwelle liegt bei 43,5 m². Eine halbe Platte zu
hoch ist kein Beinbruch, aber es ist eine Zahl, die niemand nachrechnen kann,
weil sie zweimal gerundet ist. Der alte Test bestand auf den 44; er trägt
jetzt die Berichtigung mit Begründung.

## Der Prüfer prüft es künftig selbst

`npm run pruefe-preise` hat eine vierte Frage bekommen: **Ist jede genannte
Menge ein Vielfaches der Gebindegröße?**

```
✗ POS-13728: die Schwelle 28 ist kein Vielfaches von 25 — nicht lieferbar
```

Gegengeprobt durch Zurückdrehen der Rundung: **9 Abweichungen** bei 15
Artikeln mit Gebindebindung — die übrigen sechs trafen zufällig ein
Vielfaches.

Das ist der Grund, warum der Prüfer besser ist als der Test, den ich sonst
geschrieben hätte: Sechs von fünfzehn Artikeln hätten auch mit dem Fehler
grün gemeldet. Eine Stichprobe hätte gut zwei Drittel Wahrscheinlichkeit
gehabt, ihn zu treffen — der Abgleich über den Bestand hat ihn sicher.

## Notiert

Zwei Sätze, die zusammengehören und heute beide entstanden sind:

> Ein Preis, den man für nichts bekommt, ist keine Auskunft.
> Eine Menge, die man nicht bestellen kann, auch nicht.

Beide entstehen auf dieselbe Weise: Eine Zahl wird richtig gerechnet und dann
in eine Einheit gerundet, die es im Sortiment nicht gibt. Die Gebindegröße
steht seit heute in `mengenschritt()` und muss überall dort hin, wo eine
Menge oder ein Betrag den Kunden erreicht.
