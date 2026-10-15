# Pfand ist keine Ausgabe

**4. September 2026.** In `data/lieferanten.json` steht seit dem 27. August
eine Rechnung, die den Mindestbestellwert und Gate 20 mitträgt:

> „Auf dem Beleg über 1.934 € netto: 6 Paletten (132,00) minus eine Rückgabe
> (−20,00) plus Folierung (6,50) = **118,50 nicht gerechnete Nebenkosten** —
> mehr als die Frachtpauschale selbst."

Die Zahlen stimmen alle. Die Rechnung nicht.

Sie verbucht den **Pfandbetrag** als Kosten. Die eine abgezogene Rückgabe
stammt aus einer früheren Lieferung; die sechs Paletten dieses Belegs kommen
erst später zurück — und dann mit 20,00 € je Stück.

> **Pfand ist keine Ausgabe, sondern eine Auslage.** Was kostet, ist die
> Differenz und die Fahrt, die es zurückbringt.

## Der Kreis geht auf

Über die fünfzehn Rechnungen von April bis August lässt er sich schließen:

| | Paletten | Betrag |
|---|---|---|
| hinaus (je 22,00 €) | 9 | 198,00 € |
| zurück (je 20,00 €) | 8 | −160,00 € |
| **offen** | **1** | **38,00 €** |

Acht von neun Paletten sind zurückgegangen. Was hängen bleibt, sind **2,00 €
je Palette** — und die Rückführungsfahrt: Am 27. Juli steht neben der Rückgabe
von sieben Paletten eine **Frachtpauschale Retour zu 80,26 €**, derselbe Satz,
den `lieferanten.json` als Retourfahrt führt.

```
7 × 2,00 € + 80,26 € = 94,26 €   →   13,47 € je Palette
```

Das ist die belastbare Zahl, und sie liegt zwischen den beiden falschen:
deutlich über den 2,00 € reiner Pfanddifferenz, weit unter den 22,00 €, die die
alte Begründung unterstellte. Für die sechs Paletten des zitierten Belegs also
rund **80,80 € statt 118,50 €**, dazu die Folierung.

## Die Richtung ist diesmal die andere

Fast jeder Befund dieses Vorhabens ging in die **optimistische** Richtung —
eine Angabe sah besser aus, als sie war: die Frachtschwelle, der Brutto-UVP,
die Gebührenbasis, der Verschnitt, der Produktfeed, die Bereitschaftsliste.

Dieser geht in die andere. Die Nebenkosten standen **zu hoch**, und der
Mindestbestellwert ruht damit auf einer zu pessimistischen Grundlage.

> **Auch das ist ein Fehler, nur ein ungefährlicherer: Er kostet Umsatz statt
> Marge.**

Eine zu hohe Untergrenze schickt Kunden weg, die getragen hätten. Bei 250 €
netto und einem Referenzwarenkorb von 650 € trifft das nicht viele — aber die
Begründung hält keiner Nachfrage stand, und eine Grenze, deren Begründung
fällt, fällt mit.

## Geändert wird die Begründung, nicht die Grenze

**Die 250 € bleiben.** Sie stehen als vorsichtige Zahl, und vorsichtig bleibt
vorsichtig; was zu einer Rechnung fehlt, ist die Palettenzahl je Lieferung, und
die ist ein offener Punkt. Aus einer korrigierten Nebenkostenzahl eine neue
Grenze zu rechnen hieße, die zweite unbelegte Annahme auf die erste zu setzen.

Berichtigt ist die Fundstelle in `lieferanten.json` — mit dem alten Wortlaut
davor, wie in dieser Akte üblich —, und die Zahl kommt ab jetzt aus
`palettenkreis()` statt aus einem Satz.

Der offene Punkt zur Palettenzahl trägt damit seit heute **drei** Folgen:

1. den Mindestbestellwert (Gate 25),
2. die Kranentladung — je Hub statt je Position, bis zu 22,50 € je Lieferung
   daneben (gestern gemessen),
3. die Nebenkosten je Palette — 13,47 € statt 22,00 €.

## Was der Beleg nicht sagt

Ob **jede** Rückführung eine eigene Fahrt kostet oder ob die Paletten meistens
bei der nächsten Lieferung mitgehen, sagt dieser eine Beleg nicht. Die 11,47 €
Fahrtanteil je Palette sind damit eine Obergrenze aus einer Beobachtung — sie
stehen im Register mit genau diesem Vorbehalt, nicht als Satz.

Und die eine noch offene Palette ist keine Aussage: Sie kann unterwegs sein,
beim Auftraggeber stehen oder bereits zurück und noch nicht abgerechnet.

## Verweise

- `shop/src/palettenkreis.js` — die vier Bewegungen, die Rückfahrt und die Rechnung
- `shop/test/palettenkreis.test.js` — sieben Proben; eine rechnet das Register aus den Rechnungen nach
- `shop/data/lieferanten.json` — die berichtigte Fundstelle
- [`ein-hub-ist-keine-artikelzeile.md`](./ein-hub-ist-keine-artikelzeile.md) — die zweite Folge derselben offenen Frage
- [`gate25-mindestbestellwert.md`](./gate25-mindestbestellwert.md) — die Grenze, deren Begründung hier berichtigt wird
