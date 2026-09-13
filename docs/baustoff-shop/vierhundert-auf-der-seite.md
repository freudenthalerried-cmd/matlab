# Vierhundert stand auf der Seite, zweihundertfünfzig in der Kasse

**10. September 2026.** Die Wissensseite *„Warum es hier keine
Gratislieferung gibt"* sagte dem Kunden in einem hervorgehobenen Kasten:

> „Unter etwa **400 Euro** netto Warenwert lohnt eine Lieferung für keine der
> beiden Seiten."

Die Kasse nimmt seit dem 3. September ab **250 €** netto Warenwert je
Lieferung an. Siebenundsechzig gebaute Seiten nennen diese Zahl. Eine nannte
eine andere — ausgerechnet die, deren ganzes Thema die Lieferkosten sind.

Der Unterschied ist kein Rundungsfehler. Wer mit 300 € Warenwert liest, dass
sich das „für keine der beiden Seiten lohnt", legt auf, obwohl der Shop diese
Bestellung annimmt und an ihr verdient. **Die Seite schickt Kunden weg, die
die Kasse hereinlassen würde.**

## Woher die 400 kamen

Sie waren nicht erfunden. Sie sind der Nulldurchgang aus
`mindestwarenkorbFreiHaus` — nachgerechnet mit der Frachtpauschale von
75,50 € und **20 % Rohmarge**:

| Rechnung | Vorkasse | EPS | Karte |
|---|---|---|---|
| 20 % Rohmarge (Lesart bis 25.08.) | 377,50 € | **400,37 €** | 413,48 € |
| 25 % Marge (gilt seit 26.08.) | 302,00 € | 316,68 € | 324,83 € |

Der Quellenhinweis unter dem Kasten sagte es selbst: *Stand: 2026-08-25.* Am
**26. August** hat der Auftraggeber „25 %" als Marge vom Verkauf geklärt
(`marge-25-prozent.md`) und damit die Zeile darüber abgelöst. Die Zahl auf der
Kundenseite ist einen Tag älter als ihre eigene Grundlage.

> **Eine Zahl, die eine Entscheidung trägt, gehört an die Stelle, die sie
> entschieden hat — nicht in den Satz, der sie einmal hergeleitet hat.**

## Der Befund war schon einmal da

`gate25-mindestbestellwert.md` führt ihn am 3. September unter *„Drei Zahlen
für dieselbe Frage"* auf: Gate-20-Bericht 114 €, neue Entscheidung 250 €,
Lieferseite 400 €. Die **Lieferseite** wurde an dem Tag berichtigt und nennt
seither die Zahl aus `data/betreiber.json`. Die Wissensseite blieb stehen.

Am **6. September** hat ein späterer Lauf denselben Absatz angefasst — er nahm
den Rat zum Abholen heraus, weil er auf ein Lager zeigte, das es nicht gibt —
und ließ die 400 danebenstehen.

> **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**

Sieben Tage, zwei Bearbeitungen desselben Absatzes, kein Prüfer, der
nachrechnet, welche Zahl dort steht.

## Was jetzt misst

`src/untergrenze.js` hält jede **Grenzaussage** auf einer Kundenfläche gegen
`betreiber.mindestbestellwertNetto`. Drei Formen sind bekannt —
„Mindestbestellwert … Betrag", „ab … Betrag … Warenwert", „unter … Betrag …
Warenwert" —, und jede fängt **den Betrag** ein, nicht den Satz. Der erste
Entwurf las den ganzen Satz und meldete auf der Lieferseite die Frachttabelle
mit: 75,50 € und 7,50 € standen darin neben dem Wort *Mindestbestellwert*.

Gemessen wird in beiden Betriebsarten von `bin/inhaltspruefung.mjs`: am
Quelltext unter `inhalte/` (1 Aussage) und an den gebauten Seiten (69 Aussagen
auf 67 Seiten). Beide Umfänge tragen eine Untergrenze — ein Lauf ohne
Fundstelle meldet, dass er nichts gemessen hat, statt „sauber".

**Ohne Ausnahme über ein Berichtigungswort.** Im Verzeichnis darf eine
abgelöste Zahl stehen, wenn ihre Bedingung danebensteht; dort liest ein
Bearbeiter die Akte. Auf einer Kundenseite liest ein Bauleiter, was er
bestellen kann. Der Kasten, um den es geht, trägt einen sauber gesetzten
Berichtigungsvermerk — eine solche Ausnahme hätte den Fund **gedeckt** statt
gefunden.

## Der zweite Fund kam aus dem eigenen Berichtigen

Der neue Text der Wissensseite nannte die Quelle so, wie der Shop es überall
tut: *„Quelle: eigene Entscheidung, Gate 25, Stand: 2026-09-03."* Der Bau
wies ihn zurück — `src/interna.js`, erstes Muster: *Gate-Nummern sind die
interne Entscheidungsordnung. Für den Kunden sind sie eine Chiffre, für den
Wettbewerber eine Landkarte.*

Richtig gemeldet. Nur stand dieselbe Zeile längst auf **zwanzig**
Kundenseiten:

```
(Quelle: eigene Entscheidung, Gate 25, Stand: 2026-09-03).
```

Geschrieben von `mitMindestwert()` in `bin/website.mjs`, seit dem
5. September, auf jeder Seite mit Artikelkarten. Die Interna-Prüfung des Baus
hat sie nie gesehen: Sie liest `seite.html` — den **Rumpf**, wie ihn die
Seitenbauer abliefern. Geschrieben wird, was `rahmen()` daraus macht, mit
Kopf, Fuß und angehängtem Absatz.

> **Eine Prüfung, die das Modell liest statt die Ausgabe, prüft die eigene
> Absicht.**

Der Satz steht seit dem 30. August dreißig Zeilen weiter oben in derselben
Datei — er wurde für die toten Verweise geschrieben, nachdem der Auftraggeber
41 kaputte Adressen gemeldet hatte. Für die Interna galt er nicht.

Die Prüfung am Modell bleibt: Sie sieht `kurz` und `frage`, die nie in den
Fließtext geraten, und hält den Bau früher an. Daneben steht jetzt eine zweite
über die **fertige** Seite, vor dem Schreiben — nichts wird ausgegeben, was
sie nicht passiert hat. Über alle 82 gebauten Seiten meldete sie genau diese
zwanzig Stellen und sonst nichts.

## Was der Kunde jetzt liest

Der Kasten nennt die geltende Grenze und sagt, was vorher dastand. Der Absatz
davor ist mitberichtigt worden: Er behauptete, der Warenwert müsse „die
Fracht" decken — Fracht und Kranentladung stehen aber auf der Kundenrechnung.
Was **nicht** daraufsteht und trotzdem anfällt, sind Palette, Folierung und
die Gebühr des Zahlwegs. Genau daraus ist die Grenze gerechnet.

## Was dabei nicht behauptet wird

Die 250 € sind gerechnet, aber nicht belegt bis zur letzten Stelle: Die
Palettenzahl je Lieferung hängt an Gewicht und Packmaß, und der Katalog führt
Gewicht für 7 von 46 Artikeln. Das steht so in `data/betreiber.json` und
bleibt dort stehen. Was diese Runde geändert hat, ist nicht die Grenze,
sondern dass sie an jeder Stelle dieselbe ist — und dass es auffällt, wenn
nicht.

## Stand

- **`src/untergrenze.js`** — neu: `GRENZAUSSAGEN`, `betragAlsZahl`,
  `untergrenzenbefund`. 12 Testfälle, davon zwei gegen den Bestand.
- **`bin/inhaltspruefung.mjs`** — hält beide Umfänge gegen die hinterlegte
  Grenze; weigert sich (Ausgang 2), wenn keine hinterlegt ist.
- **`bin/website.mjs`** — Interna-Prüfung am Erzeugnis vor dem Schreiben;
  der angehängte Grenzabsatz nennt keine Gate-Nummer mehr.
- **`test/interna.test.js`** — ein Testfall liest die 82 geschriebenen
  Dateien und misst damit unabhängig vom Bauwerkzeug.
- **Drei Gegenproben**, alle angeschlagen: `untergrenze-auf-der-inhaltsseite`
  (9 s), `untergrenze-auf-der-gebauten-seite` (16 s),
  `gate-nummer-im-angehaengten-absatz` (5 s).
- 2174 Testfälle, 144 Gegenproben, 47 Prüfer.
