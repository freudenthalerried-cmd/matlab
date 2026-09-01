# Die Leitzahl war vom falschen Zahlweg

**1. September 2026, fünfte Runde.** Die Kennzahlenseite der letzten Stunde
rechnete den nötigen Monatsumsatz aus `zielgroessen.json` und schrieb
**43.395,77 €** hin. In der PR-Beschreibung, in `PARAMETER.md`, im
Gate-Register und in vier weiteren Dokumenten steht seit dem 25. August
**45.356 €**.

Zwei Zahlen für dieselbe Sache. Beide gerechnet, beide aus derselben Funktion,
beide richtig — für verschiedene Zahlwege.

| Zahlweg | nötiger Monatsumsatz | Bestellungen |
| --- | ---: | ---: |
| Vorkasse | 40.160 € | 62 |
| **EPS** | **43.396 €** | **67** |
| Kreditkarte | 45.356 € | 70 |
| Rechnungskauf | 52.842 € | 82 |

Die 45.356 € sind die **Kartenzahl**. Sie wurde am 25. August gerechnet, als
`marge-25-prozent.md` entstand — dort steht sogar ausdrücklich „Zahlung per
Karte" darüber. Am **27. August** hat Gate 21 entschieden: **EPS und Vorkasse ab
Start, keine offene Rechnung.**

> **Die Leitzahl des Geschäftsmodells ist zwei Tage älter als die Entscheidung,
> die sie bestimmt.**

Sie war nie falsch. Sie **wurde** es, an dem Tag, an dem ein Gate den Zahlweg
festlegte — und von da an stand sie in jedem Dokument, das jemand zuerst
aufschlägt.

## Warum es niemandem auffiel

Drei Gründe, und der dritte ist der unangenehme.

**Erstens: Die Zahl war plausibel.** 45.356 € und 70 Bestellungen sind keine
absurden Größen. Nichts an ihnen sieht falsch aus.

**Zweitens: Sie ging in die vorsichtige Richtung.** Der wahre Bedarf liegt
**1.960 € im Monat niedriger** und bei **drei Bestellungen weniger**. Wer
vorsichtig rechnet, prüft nicht nach — das ist die Sorte Fehler, die man behält.
Bemerkenswert nur, weil dieses Vorhaben bisher über zwanzig Befunde in die
*optimistische* Richtung hatte; dies ist der erste in die andere.

**Drittens, und darum geht es: Es gab einen Prüfer, und er sah nicht hin.**
`npm run pruefe-schaufenster` misst seit dem 1. September die Kennzahlen der
PR-Beschreibung gegen das Verzeichnis. Vierundzwanzig Stück: Artikel, Seiten,
Wissensseiten, Systemlisten, Gruppen, Rechtsseiten, Gates, Testfälle,
Oberflächenszenarien, Shopszenarien, Prüfer, Browserproben, Feedeinträge, GTIN,
Listenpreisabstand, Median, Kampagnen, drei Höchstgebote, rekonstruierbare
Einkaufspreise.

Seitenzahlen, Testfälle, Gebote, GTIN-Lücken. **Nicht die Zahl, um die es
geht.**

> **Ein Prüfer, der alles misst außer der Leitzahl, meldet grün über ein
> Geschäftsmodell, das er nie angesehen hat.**

Das ist dieselbe Familie wie der Belegprüfer, der heute Vormittag den falschen
Katalog las, und wie die Kennzahlenseite, die ohne Daten eine glatte Nullbilanz
zeigte. Und wie in beiden Fällen war der Fehler **kein Absturz**, sondern ein
Ergebnis, das aussah wie eines.

## Was jetzt gilt

Zwei Kennzahlen mehr im Schaufensterabgleich — **26 statt 24**: der nötige
Monatsumsatz und die Bestellungen im Monat, beide aus
`noetigerUmsatz(zielgroessen, ziel.zahlweg)`, also mit dem Zahlweg, der in den
Zielgrößen steht.

Gemessen wird auf **ganze Euro**, weil die Beschreibung ganze Euro nennt.
Dieselbe Lehre wie beim Medianabstand: Ein Prüfer, der genauer misst, als die
Aussage gemacht wird, meldet 43.395,77 gegen 43.396 und hat recht, ohne dass
jemand etwas davon hat.

Die drei Spalten der Beschreibung, jetzt mit EPS:

| | 20 % Marge | **25 % Marge** | mit 3 % Skonto |
| --- | ---: | ---: | ---: |
| nötiger Monatsumsatz | 67.826 € | **43.396 €** | **37.343 €** |
| Bestellungen im Monat | 105 | 67 | 58 |

Die Tragfähigkeitsgrenze des Werbeanteils bleibt bei 18 % und 23 %. Gerechnet
sind es mit EPS 18,9 % und 23,9 %; die Beschreibung rundet ab, und abgerundet
ist bei einer Grenze die richtige Richtung.

**Nicht angetastet**: `marge-25-prozent.md` behält seine Kartentabelle. Sie ist
korrekt und sagt selbst, womit sie rechnet — sie hat nur einen Nachtrag
bekommen, der auf die entschiedene Zahl zeigt. Eine richtige Rechnung wird nicht
dadurch falsch, dass sich die Voraussetzung geändert hat; sie wird zur Rechnung
von vorgestern, und das gehört danebengeschrieben statt wegradiert.

## Was das über die Prüfer sagt

Zwölf Prüfer, über tausend Testfälle. Und die eine Zahl, an
der das ganze Vorhaben hängt, stand vier Tage lang ungemessen in dem Dokument,
das der Auftraggeber zuerst liest.

> **Man baut Prüfer für das, was man zu prüfen gewohnt ist.** Dateien, Seiten,
> Muster, Zeichenketten — Dinge, die sich zählen lassen. Die Zahl, die
> entscheidet, ist keine davon.

Die Frage für den nächsten Lauf ist deshalb nicht mehr „welche Datei liest
niemand", sondern:

> **Welche Zahl steht in mehr als einem Dokument — und rechnet sie irgendwer
> nach?**

Erste Kandidaten aus derselben Familie: der Deckungsbeitrag je Warengruppe
(209,40 / 295,42 / 410,94 €, in drei Dokumenten), der Bezugswarenkorb von 650 €
(in acht), und die 0,77 % Kaufquote am Marktboden (in vier). Alle drei sind
gerechnet — und keine davon wird gemessen.
