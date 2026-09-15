# Gesichert war nur die oberste Ebene

**12. September 2026. Runde 51.**

## Der Fund

`src/sicherung.js` trägt seinen Grund im Kopf:

> *Eine Datei, die sich aus ihrer Quelle neu erzeugen lässt, kann man
> verlieren. Eine gepflegte Datei nicht.*

Gesichert wurde nach diesem Satz genau **ein** Ordner: `preise/`. Seit gestern
liegt daneben die **Vorgangsakte** — Journal, Durchschriften,
Buchhaltungsauszüge —, und die fällt nicht unter „erzeugt" und nicht unter
„gepflegt":

> **Sie ist aufgezeichnet.** Ein Preis lässt sich nachrechnen, eine
> Konditionenliste neu anfordern. Eine gezogene Rechnungsnummer, eine abgelegte
> Durchschrift und der Tag ihrer Entstehung lassen sich aus nichts
> wiederherstellen — und § 132 BAO verlangt sie sieben Jahre.

Das ist keine Vorsicht auf Vorrat. Am 8. September ist
`preise/poschacher-positionen.csv` verloren gegangen; seither weigert sich ein
Prüfer dauerhaft, und gestern musste ein zweites Werkzeug abgespalten werden,
damit die Weigerung nicht die Hälfte der Prüfung mitnimmt.

## Der stille Teil des Schadens

Hätte jemand das alte Werkzeug einfach auf `ablage/` gerichtet, hätte es
gemeldet: *„1 Datei gesichert."* Und das wäre richtig gewesen — es liest nur
die **oberste Ebene**.

| | |
| --- | --- |
| `ablage/journal-2026.jsonl` | gesichert |
| `ablage/belege-2026/…` | **jede Durchschrift liegen geblieben** |
| `ablage/buchhaltung/…` | **liegen geblieben** |

> **Eine Sicherung, die das Wesentliche nicht sieht, meldet trotzdem
> „gesichert" — und der Schaden fällt erst auf, wenn jemand die Belege
> sucht.**

Für `preise/` war die flache Lesart nie falsch; dort liegt alles auf einer
Ebene. Sie war eine Annahme über **einen** Ordner, und sie ist mit dem zweiten
Ordner falsch geworden, ohne dass sich an ihr etwas geändert hätte.

## Was geändert wurde

- **Ein Register statt eines Ordners.** `BEREICHE` nennt `preise/` und
  `ablage/`, jeden mit seinem Grund — dieselbe Bauweise wie überall in diesem
  Bestand.
- **Rekursiv, ohne die Kopien.** `.sicherung` bleibt außen vor, alles andere
  wird mitgenommen.
- **Ein fehlender Bereich wird genannt, nicht übergangen.** Vor dem ersten
  Geschäftsfall gibt es `ablage/` nicht; der Lauf sagt das und zählt am Ende
  „1 von 2 Bereichen vorhanden". *Niemand soll eine Sicherung für vollständig
  halten, die einen Bereich gar nicht gesehen hat.*

## Was diese Sicherung nicht ist

> **Kein Schutz gegen den Verlust des Rechners.** Die Kopien liegen neben dem
> Original, im selben gesperrten Bereich. Das schützt gegen Überschreiben und
> versehentliches Löschen — nicht gegen eine kaputte Platte.

Der Satz steht unter jedem Lauf. Der Ort außerhalb ist Sache des Auftraggebers
und steht als offener Punkt: *„Die Ablage der Vorgänge ist gesichert — von hier
aus nicht feststellbar."*

## Ausgang

| | |
| --- | --- |
| gesicherte Bereiche | 1 → **2**, jeder mit Grund |
| Tiefe | oberste Ebene → **rekursiv** |
| fehlender Bereich | still → **genannt und gezählt** |
| Testfälle | 2.407 |
| Gegenproben | 218 → **219** |

---

**Die Regel dieser Runde:** *Eine Annahme über einen Ordner wird falsch, sobald
es einen zweiten gibt — und sie meldet es nicht.*
