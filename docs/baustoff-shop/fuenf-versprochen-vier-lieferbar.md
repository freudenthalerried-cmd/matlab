# Fünf versprochen, vier lieferbar

*5. September 2026, nachmittags. Runde 129.*

## Der Fund

Die vier Systemlisten sind der inhaltliche Kern dieses Shops. Sie beantworten
„was muss ich bestellen, um X zu bauen", und ihre These steht auf einer
eigenen Wissensseite: **was fehlt, hält die Baustelle auf.** Deshalb führen
sie auch die Positionen, die dieses Haus **nicht** liefert, und kennzeichnen
sie.

`kellerwand-perimeter` sagte in der Zusammenfassung — dem Satz, den Google
und jeder Assistent als Antwort ausgibt:

> *Sieben Positionen bilden das Bauteil, **fünf davon aus unserem Sortiment**:
> Perimeterplatte, Kleber, Dosierpistole, Schutz- und Drainbahn und der obere
> Abschluss.*

Und zwanzig Zeilen weiter, unter der Positionsliste:

> *Drei der sieben Positionen führen wir nicht …*

Sieben minus drei ist vier. **Dieselbe Seite, zwei Zahlen.**

Die fünfte war der **obere Abschluss** — die Abschlussschiene. Die Tabelle
führt sie als *(nicht im Sortiment)*, und in derselben Zeile steht unter „wird
oft vergessen" ein **ja**.

> **Die Zusammenfassung versprach genau die Position, die die Liste selbst als
> fehlend kennzeichnet — und zwar die, von der die Seite sagt, dass sie am
> häufigsten vergessen wird.**

Ein Bauleiter, der den Vorspann liest und danach bestellt, hat die Schiene
nicht. Er merkt es an dem Tag, an dem die Dämmung oben abgeschlossen werden
soll — genau der Ablauf, den die verlinkte Wissensseite beschreibt.

## Zwei Formfehler daneben

**Die Fassadenliste kennzeichnete ihre Position 2 nicht in der Tabelle** —
und der naheliegende Ausweg war falsch. `fassade-100-qm` erklärt in einem
eigenen Abschnitt, warum die Flächendämmplatte nicht im Regal liegt; in der
Tabelle stand sie ohne Kennzeichnung, während die drei anderen Listen ihre
Lücken mit *(nicht im Sortiment)* markieren. Ich habe das nachgetragen — und
ein Testfall vom **30. August** hat es in derselben Minute abgewiesen:

```
fassade-100-qm.md Position 2 „Dämmplatten": als nicht geführt
gekennzeichnet, aber im Katalog
```

Er hatte recht. Dämmplatten führt dieses Haus sehr wohl — **nur nicht in
Flächenstärke**. Ein „nicht im Sortiment" hätte den Kunden von einer Ware
weggeschickt, die es gibt.

> **Eine Kennzeichnung, die zu viel behauptet, ist so falsch wie eine, die
> fehlt** — und die falsche Richtung ist die teurere.

Die Zeile trägt jetzt *(nicht in Flächenstärke)*, und das Lesewerkzeug
unterscheidet die beiden Fälle: `NICHT_GEFUEHRT` zählt gegen den Satz „N
führen wir nicht", `EINGESCHRAENKT` erfüllt nur die Forderung, dass jede Liste
ihre Grenzen kennzeichnet.

**Die Kellerwandliste behauptete eine Kennzeichnung, die nur einmal dastand.**
„Sie sind in der Tabelle als solche gekennzeichnet" — von den drei war eine
gekennzeichnet; die beiden anderen trugen „eigenes Gewerk" in der letzten
Spalte. Das ist etwas anderes: Die Kanalliste führt eine Position, die
**fremdes Gewerk und trotzdem im Sortiment** ist (die Grundmauerschutzbahn).
Wer beides gleichsetzt, verliert genau diese Unterscheidung.

## Was gebaut wurde

`npm run pruefe-systemlisten` hält jede Liste gegen das, was sie über sich
selbst sagt:

```
Systemlisten: 4 Listen mit 35 Positionen
7 davon ausdrücklich nicht im Sortiment und trotzdem aufgeführt.

  10 von 10 lieferbar, 9 Artikel — fassade-100-qm.md
   9 von 10 lieferbar, 9 Artikel — kaminzug.md
   5 von 8  lieferbar, 7 Artikel — kanal-dn100.md
   4 von 7  lieferbar, 8 Artikel — kellerwand-perimeter.md
```

*Die Fassadenliste steht mit „10 von 10" da, weil ihre eine Einschränkung
keine fehlende Position ist, sondern eine fehlende Stärke.*

Fünf Regeln, und keine davon urteilt über den Inhalt:

* `zahl-widerspricht` — „Sieben Positionen bilden …" gegen die Tabelle.
* `nicht-gefuehrt-zahl` — „Drei der sieben führen wir nicht" gegen die
  Kennzeichnungen. **Das ist die Regel, die den Fund gemacht hätte.**
* `sku-gibt-es-nicht` — ein Artikel der Kopfzeile fehlt im Katalog.
* `keine-position` / `alles-fremd` — eine Liste ohne Tabelle, oder eine, von
  der nichts lieferbar ist.

> **Geprüft wird nur, was die Seite über sich selbst sagt.** Ob eine
> Stückliste fachlich vollständig ist, entscheidet kein Prüfer — das
> entscheidet, wer den Kamin baut.

Gezählt werden im Prüferregister die **Positionen**, nicht die Listen: Eine
Liste, die zur Überschrift schrumpft, fiele bei einer Listenzählung nicht auf.

Zwei Testfälle halten den Zweck fest, den keine Zahl misst: Jede Liste muss
**mindestens eine gekennzeichnete Lücke** haben — eine Liste, die nur das
Regal zeigt, ist ein Angebot und keine Stückliste — und mindestens eine
lieferbare Position.

Gegenprobe `stueckliste-verzaehlt-sich` schreibt den Widerspruch zurück.
**58 Gegenproben für 34 Prüfer.**

## Warum das kein Tippfehler ist

Die Zahlen im Vorspann und im Fließtext sind **von Hand gezählt**, und beide
zählen dasselbe. Solange der Katalog aus fünfzehn Rechnungen stammt, ändert
sich wenig. Sobald die Artikelliste des Lieferanten kommt — sie steht als
offener Punkt und soll das Sortiment auf über hundert Artikel bringen —,
wandert genau diese Grenze bei jeder Liste:

> **Jede Position, die neu ins Sortiment kommt, macht zwei Sätze auf einer
> Systemseite falsch, und beide stehen weit auseinander.**

Das ist der Grund, warum hier ein Prüfer steht und nicht eine Berichtigung.

## Die Lehre

> **Der Satz, der die Seite zusammenfasst, wird am seltensten nachgerechnet
> und am häufigsten gelesen.** Er steht im Vorspann, in der Meta-Beschreibung
> und in `llms.txt`; die Tabelle darunter steht nur auf der Seite. Von den
> beiden war die Zusammenfassung falsch.
