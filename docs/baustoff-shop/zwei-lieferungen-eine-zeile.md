# Zwei Lieferungen, eine Zeile

**Stand: 30. August 2026** · Befund und Behebung aus einem Lauf des
Arbeitsloops. Betroffen: `shop/src/kundenanfrage.js`, `shop/shop-ui.js`,
`shop/test/kundenanfrage.test.js`.

## Die Frage

Der Rechenkern gruppiert einen Warenkorb nach Lieferanten und rechnet je
Gruppe eine eigene Fracht — das Feld heißt `teillieferungen`, und die Struktur
ist seit dem ersten Tag darauf ausgelegt. Heute führt der Katalog **einen**
Lieferanten; alle 46 Artikel kommen von derselben Stelle. Also die Frage:

> Was steht im Anfragetext, wenn ein Korb Ware von zwei Lieferanten enthält?

Gemessen mit einem Korb, dessen zweiter Artikel auf einen anderen Lieferanten
umgehängt wurde.

## Der Befund

Der Rechenkern rechnete richtig — **zwei** Teillieferungen, 83 € und 12 €. Im
Text stand:

```
Warenwert             12,29 €
Zustellung            95,00 €
```

Eine Zeile. Kein Wort davon, dass die Ware in **zwei getrennten Lieferungen**
kommt, mit zwei Anfahrten und möglicherweise zwei Terminen. Ein Bauleiter, der
seine Baustelle plant, liest hier „eine Zustellung, 95 €" und disponiert
falsch.

Dazu die Oberfläche. In beiden Preistafeln — Warenkorb und Kasse — stand:

```js
['Fracht', eur(rechnung.frachtNetto), rechnung.teillieferungen[0].frachtGrund]
```

**Der Grund der ersten Teillieferung neben der Summe aller.** Bei zwei
Lieferanten erklärt „Pauschale plus 1× Sperrgutzuschlag" die 83 €, steht aber
an den 95 €. Eine Begründung an einer Zahl, die sie nicht erklärt, ist
schlimmer als keine.

## Warum jetzt und nicht später

Der Fehler kann heute niemandem passieren: Es gibt nur einen Lieferanten. Er
wird an dem Tag scharf, an dem die Artikelliste des Auftraggebers kommt — dem
Tag, auf den dieses ganze Vorhaben wartet, und an dem hundert andere Dinge
gleichzeitig zu tun sind.

> **Ein Fehler mit bekanntem Auslösetag ist kein latenter Fehler, sondern ein
> terminierter.**

## Behoben

**Im Text** trägt jede Teillieferung ihren eigenen Block und ihre eigene
Frachtzeile:

```
Lieferung 1 von 2
2 m²          Fassaden EPS 2 cm 0,5 m2       POS-12566   1,93 €     3,86 €

Lieferung 2 von 2
3 m²          Fassaden EPS 3 cm 0,5 m2       POS-12567   2,81 €     8,43 €

Warenwert             12,29 €
Zustellung 1          83,00 €   Pauschale plus 1× Sperrgutzuschlag
Zustellung 2          12,00 €   Pauschale plus 1× Sperrgutzuschlag
Zustellung gesamt     95,00 €
```

Dazu ein Satz im Abschnitt „Was diese Anfrage ist und was nicht": *Die Ware
kommt in 2 getrennten Lieferungen — je Lieferung eine Anfahrt, und die Termine
können auseinanderliegen.* Er steht dort und nicht bei den Hinweisen, weil er
dem Kunden etwas über seine Baustelle sagt und nicht über eine Lücke im
Werkzeug.

**In der Oberfläche** erklärt die Frachtzeile bei mehreren Lieferungen die
Aufteilung statt eines einzelnen Grundes: „2 getrennte Lieferungen: 83,00 € +
12,00 €".

**Bei einem Lieferanten bleibt alles wie es war.** Die Aufteilung ist die
Ausnahme; ein Korb aus einem Sortiment trägt keine Lieferungsnummern und kein
„gesamt". Auch das steht als Testfall da.

## Die Grenze, die dabei zu beachten war

Genannt wird die **Nummer**, nicht der Lieferant. Der Shop gibt den
Lieferantennamen nicht an den Browser weiter — die Begründung steht seit
langem in `oeffentlicherLieferant`:

> Geheim ist nicht die Geschäftsbeziehung, geheim sind die Konditionen.

Eine Aufteilung „Lieferung von Poschacher / Lieferung von …" hätte den Text
lesbarer gemacht und die Grenze verletzt. Ein eigener Testfall prüft, dass
weder ein Lieferantenname noch eine Lieferantenkennung im Anfragetext steht —
und er fällt, wenn jemand die Kennung einsetzt.

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| Aufteilung abgeschaltet | zwei Testfälle fallen |
| Lieferantenkennung statt Nummer | zwei Testfälle fallen, darunter die Geheimhaltung |

Dazu eine Probe, die nicht die Form prüft, sondern die Rechnung: **Die
genannten Teilfrachten müssen zusammen die Gesamtfracht ergeben.** Eine
Aufteilung, die nicht aufgeht, wäre schlimmer als gar keine.

## Was offen bleibt

Die Frei-Haus-Schwelle. Sie misst am Bestellwert, also am Einkauf, und der
Browser kennt keine Einkaufspreise — deshalb meldet der Text sie als offenen
Punkt statt sie zu prüfen. Bei **mehreren** Lieferanten hat jeder seine eigene
Schwelle, und die Zeile nennt bisher die eine, die gerade greift. Solange die
Schwelle ohnehin nicht prüfbar ist, ist das keine falsche Auskunft, sondern
eine unvollständige. Mit dem zweiten Lieferanten ist sie nachzuziehen.
