# Geld genommen, bevor ein Vertrag bestand

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Punkt 2 der eigenen AGB lautet seit dem ersten Entwurf des Rechtstexte-Gerüsts:

> **Vertragsschluss** — Bestellung ist Angebot, Annahme durch
> Auftragsbestätigung.

Dieses Papier gab es nicht.

## Der Fund

`beleg.js` erzeugte Angebot und Rechnung. Dazwischen: nichts. Und der Ablauf in
`auftragslauf.js` sah so aus:

```
eingang → datenpruefung → uidPruefung → zahlung → bestellauslösung → …
```

Vom Zahlungseingang direkt zur Lieferantenbestellung. **Der Shop hätte Geld
genommen, bevor nach seinen eigenen Bedingungen ein Vertrag bestand.**

Besonders leicht zu übersehen war es, weil der Ablauf einen Schritt namens
`auftragsbestaetigung` führte — nur meinte der die Bestätigung, die der
**Lieferant an uns** schickt, nicht unsere an den Kunden. Zwei
gegenläufige Papiere unter einem Wort; der Schritt sah besetzt aus.

Der Widerspruch ist konkret, nicht akademisch:

* Nimmt man Geld ohne Annahme, hält man es ohne Rechtsgrund. Scheitert die
  Bestellung danach — Mindestbestellwert nicht erreicht, Ware nicht lieferbar —,
  muss zurückgezahlt werden, und das Geschäft war nie eines.
* Oder man liest die Zahlungsannahme als schlüssige Annahme. Dann steht sie im
  Widerspruch zum veröffentlichten AGB-Punkt 2, und im Streitfall gilt die für
  den Verwender ungünstigere Auslegung.

Beides ist vermeidbar, indem der Schritt existiert. Er kostet nichts.

## Die Behebung

**`erzeugeAuftragsbestaetigung()`** in `beleg.js`. Zwei Dinge stehen darin, die
in keinem anderen Beleg stehen:

**1. Wann der Vertrag zustande kommt** — ausdrücklich und mit Verweis auf die
AGB, damit die beiden Texte dasselbe sagen und nicht zwei Fassungen desselben
Vorgangs nebeneinander bestehen.

**2. Wann die Baustelle vollständig beliefert ist.**

```
Lieferzeiten je Hersteller, ab Bestellauslösung:
  Abdichtungsbahnen-Hersteller: 8 Werktage
  Rohrhersteller Österreich: 5 Werktage
  Zubehör- und Dichtsysteme: 4 Werktage

Vollständig auf der Baustelle: nach 8 Werktagen.
Bis dahin treffen die Teillieferungen einzeln ein; jede ist für sich zu prüfen.
```

Das ist die Zahl, die der Bauleiter für seinen Terminplan braucht, und sie stand
nirgends. Angebot und Rechnung nennen die Lieferzeit **je Lieferant** — drei
Zahlen, aus denen der Kunde selbst das Maximum bilden soll. Er bildet es nicht.
Im Streckengeschäft ist die längste Lieferzeit die einzige, die zählt: Vor ihr
kann niemand anfangen zu arbeiten.

Dazu **`darfBestaetigtWerden()`**. Die Annahme ist die Stelle, an der der Shop
sich bindet — sie darf nur erklärt werden, wenn die Bestellung beim Lieferanten
auch platzierbar ist. Der Fall aus
[`frachtschwelle-und-bestellwert.md`](./frachtschwelle-und-bestellwert.md) ist
genau dieser: 928 Teillieferungen wurden als bestellbar gemeldet, obwohl der
Lieferant sie zurückgewiesen hätte. **Wer so etwas bestätigt, hat einen Vertrag
geschlossen, den er nicht erfüllen kann** — schlimmer als eine abgelehnte
Bestellung.

## Die Reihenfolge ist der eigentliche Inhalt

```
… → uidPruefung → annahme → zahlung → bestellauslösung → lieferantenbestaetigung → …
```

**Erst binden, dann Geld nehmen, dann auslösen.** Der neue Schritt steht
bewusst vor der Zahlung; ein Testfall besteht auf dieser Reihenfolge und nicht
bloß auf der Existenz des Schritts. Ein zweiter besteht darauf, dass die eigene
Bestätigung und die des Lieferanten unterscheidbar benannt sind — der alte
`auftragsbestaetigung` heißt jetzt `lieferantenbestaetigung`.

Elf Schritte statt zehn, drei Minuten Handarbeit ohne Anbindung. Das ist
ehrlich: Ein Papier, das jemand schreiben muss, kostet Zeit, und der Trockenlauf
in [`trockenlauf-auftrag.md`](./trockenlauf-auftrag.md) soll den Aufwand nicht
kleiner aussehen lassen, als er ist.

## Was noch dazugehört

Die Bestätigung trägt **dieselben Lieferhinweise**, die der Kunde vor der
Bestellung auf dem Bildschirm gesehen hat — § 377 UGB, Empfangsvollmacht,
Rollenware, Teillieferungen (siehe
[`ruegefrist-und-baustelle.md`](./ruegefrist-und-baustelle.md)). Ein Hinweis,
der nur auf einem Bildschirm stand und in keinem Papier steht, ist im Streitfall
nicht mehr auffindbar.

Sie nennt außerdem die Lieferanschrift und kennzeichnet sie, wenn sie von der
Rechnungsanschrift abweicht. Und sie geht in die Ablage: ein Vermerk unter
derselben Vorgangsnummer, damit die Vorgangsakte den Vertragsschluss enthält und
nicht nur seine Folgen.

Die Vorgangsklammer prüft sie mit — `pruefeVorgangsklammer` sieht jetzt drei
Kundenbelege statt zwei, und ein Testfall verfälscht den Empfänger der
Bestätigung und besteht darauf, dass es auffällt.

## Geprüft

| | |
|---|---|
| neue Testfälle | 16 |
| Testfälle gesamt | 313, alle grün, 0 mit Verdacht |

Gegenprobe: Die Annahme-Freigabe versuchsweise auf „immer erlaubt" gesetzt → ein
Testfall fällt.

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: Die Demoseite zeigt
die Auftragsbestätigung als eigenen Beleg, nennt den Vertragsschluss mit Verweis
auf AGB Punkt 2, gibt die vollständige Lieferzeit an (5 Werktage bei einem
Warenkorb aus einer Quelle), hält die Annahme wegen der Platzhalterpreise an und
führt die Reihenfolge Annahme vor Zahlung über elf Schritte.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. 3.900,20 € brutto und 34,2 %
Mischmarge bleiben; alle Preise sind Platzhalter.

Bemerkenswert ist die Herkunft des Funds. Er kam nicht aus einer Prüfung des
Programms, sondern aus dem Vergleich zweier Dinge, die längst nebeneinander im
Repo lagen: einer Zeile in der AGB-Gliederung und einer Liste von Ablaufschritten
in einer anderen Datei. **Beide waren für sich richtig.** Gefehlt hat nur, sie
einmal nebeneinanderzulegen — dieselbe Art von Fund wie die Frachtschwelle, wo
eine Zahl aus dem Anschreiben und eine Zeile Code auf verschiedene Seiten
desselben Geschäfts zeigten.
