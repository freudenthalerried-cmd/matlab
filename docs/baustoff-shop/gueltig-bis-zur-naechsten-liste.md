# „Gültig bis zur nächsten Liste"

**6. September 2026, morgens.** Diesmal von der anderen Seite gelesen: nicht als
Prüfer, sondern als das, wofür dieser Shop gebaut ist — als Assistent, der
`llms.txt` bekommt und daraus eine Auskunft macht. 133 Zeilen, alle 46 Artikel
mit Preis, Einheit, Warengruppe.

Und dann von dort auf eine Artikelseite. Dort steht, seit es Artikelseiten
gibt:

```
Preisstand   2026-04-22   gültig bis zur nächsten Liste
```

**Auf allen 46.**

---

## Der Satz sagt zweierlei, und beides hält nicht

**Erstens behauptet er eine Gültigkeit.** Der Preis stehe fest, bis der
Lieferant eine neue Liste herausgibt. Verbindlich wird der Preis aber gar nicht
hier: Das tut das **Angebot**, und `erzeugeAngebot` bindet 14 Tage ab
Angebotsdatum — mit einer ausdrücklichen Begründung im Quelltext:

> *„Ein Angebot ohne Bindefrist bindet nach § 862 ABGB für eine angemessene
> Zeit, und ‚angemessen' entscheidet im Streitfall jemand anderer."*

Der Betrieb hat sich also Gedanken über die Bindung gemacht — und auf der
Seite, auf der der Kunde den Preis liest, stand etwas anderes.

**Zweitens knüpft er die Gültigkeit an ein Ereignis, das dieser Betrieb nicht
beobachten kann.** `data/lieferanten.json` führt `preisrhythmus: null`.
`pruefe-preisalter` schreibt seine eigene Grenze deshalb ausdrücklich als
Schätzung an:

> *„Der Preisrhythmus des Lieferanten ist unbekannt und aus den Rechnungen
> nicht ableitbar. Ein Quartal ist die übliche Fortschreibung von
> Baustoffpreislisten; die Zahl gehört ersetzt, sobald der Lieferant seinen
> Rhythmus nennt."*

Die „nächste Liste" ist genau das Ereignis, von dem der Shop nicht weiß, wann
es eintritt. Und die Frage danach steht seit Tagen als eine von fünf im Brief
an den Lieferanten.

> **Zwei Aussagen über denselben Preis, und die schwächere stand dort, wo der
> Kunde entscheidet.**

---

## Und die Zahl, die dahinter steht

`npm run pruefe-preisalter`, am selben Tag:

```
Jüngster Preis 20 Tage, ältester 137, Median 55.
Grenze: 90 Tage (gesetzt).

7 über der Grenze, aber ohne Gebot darauf — nachfragen, nicht sperren:
   137 T  Zubehör    Prima Dosierpistole Metall Lite
   103 T  Kanal      Grundmauerschutz 20 1,5 m
   …
```

Der Prüfer ist gut gebaut: Er wird nur rot, wenn ein **Anzeigengebot** auf einem
überalterten Preis ruht — sonst wäre er ein Sperrwerk statt einer Messung. Aber
seine Schwelle schützt das **Werbebudget**.

> **Der Kunde sieht dieselben sieben Preise, und ihm sagt niemand etwas.**

Der Schaden ist nicht der Preis selbst — den halten wir. Der Schaden liegt eine
Stufe tiefer: Gate 20 verlangt einen positiven Deckungsbeitrag je Bestellung,
und gerechnet wird er gegen eine Grundlage, die in einem Fall vier Monate alt
ist. *Ein alter Einkaufspreis ist die Marge von gestern, ausgewiesen als die von
heute* — der Satz steht wörtlich unter der Ausgabe des Prüfers.

---

## Was jetzt dasteht

Die Bildunterschrift heißt nicht mehr „gültig bis zur nächsten Liste", sondern
**„Stand der Preisgrundlage"** — eine Beschreibung statt einer Zusage. Darunter,
auf jeder Artikelseite:

> **Was der Preisstand bedeutet.** Er nennt den Tag, von dem die Grundlage
> dieses Preises stammt. Verbindlich wird der Preis nicht hier, sondern mit dem
> Angebot: Das bindet **14 Tage** ab Angebotsdatum. Bis dahin ist die Zahl eine
> Auskunft und keine Zusage.

Und auf den sieben Seiten, deren Grundlage über der eigenen Grenze liegt,
zusätzlich:

> **Diese Grundlage ist 137 Tage alt** und damit älter als die selbst gesetzte
> Grenze von 90 Tagen. Der Preisrhythmus des Lieferanten ist uns nicht bekannt
> — die Frage steht in der offenen Anfrage an ihn. Vor einer
> Auftragsbestätigung wird dieser Preis nachgesehen.

Die Zahl 14 steht jetzt als `BINDEFRIST_TAGE` in `src/beleg.js` und nicht mehr
als Vorgabewert im Kopf einer Funktion: **Die Seite muss dieselbe Zahl nennen
wie das Papier, das sie verbindlich macht.** Ein Testfall hält beide
aneinander.

---

## Geprüft in beide Richtungen

Drei Fälle, gegen das gebaute Erzeugnis:

1. Keine der 46 Seiten trägt noch die alte Zusage.
2. Jede der 46 nennt die Bindefrist, und zwar mit der Zahl aus `beleg.js`.
3. Die Altersmarke steht **genau** dort, wo die Grundlage über der Grenze
   liegt — nicht dort, wo sie es nicht tut, und sie nennt das gemessene Alter.

Der dritte Fall verlangt außerdem, dass es überhaupt einen Artikel über der
Grenze gibt. Sonst prüfte er nur noch die **Abwesenheit** der Marke und bliebe
grün, während die Marke kaputt wäre. *Sinkt das Alter eines Tages unter die
Grenze — weil der Lieferant neue Preise nennt —, wird dieser Fall rot und
verlangt eine Entscheidung. Das ist gewollt: Dann ist die Marke unbenutzt, und
jemand muss sagen, ob sie bleibt.*

Gegenprobe `preisstand-ohne-alter` schaltet die Marke ab und verlangt, dass es
auffällt.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — 3 Testfälle gegen das Erzeugnis |
| Neue Ausfuhren | `BINDEFRIST_TAGE` |
| Neue Gegenproben | `preisstand-ohne-alter` |
| Geänderte Seiten | 46 (Bildunterschrift und Absatz), davon 7 mit Altersmarke |
| Neue Gates | keine |

## Was offen bleibt

- **Der Preisrhythmus des Lieferanten** bleibt unbekannt und damit auch, ob die
  90 Tage die richtige Grenze sind. Die Frage ist gestellt, das Stellen der
  Frage ist freigabepflichtig.
- **Die Altersmarke ist eine Auskunft, keine Sperre.** Sieben Artikel sind
  weiterhin bestellbar. Das ist die richtige Reihenfolge — erst sagen, dann
  sperren, und gesperrt wird, was Gate 20 reißt.
- **Die Gebietsfrage an den Lieferanten** und die sieben Punkte in
  `npm run startklar` — alle beim Auftraggeber.
