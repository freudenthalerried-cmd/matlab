# Das Liefergebiet war ein Satz

**Stand: 30. August 2026** · Der Faden, den der vorige Lauf offengelassen hat.
Betroffen: `shop/src/maschinenlesbar.js`, `shop/bin/website.mjs`,
`shop/test/maschinenlesbar.test.js`, `shop/test/website.test.js`.

## Zwei Befunde in einer Zeile

Die Startseite zeichnete das Liefergebiet so aus:

```js
areaServed: 'Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land',
```

**Erstens: fest im Quelltext.** Daneben steht seit dem 26. August die
Entscheidung in `LIEFERGEBIET` — mit Bezirk, Bundesland und Begründung je
Zeile, mit Stand und Vorbehalt. Genau dafür wurde sie angelegt, nachdem das
Gebiet einmal an drei Stellen und an keiner verbindlich stand. Diese Zeile war
die vierte, und sie wich schon ab: In der Entscheidung steht **Linz-Land vor
Linz**, in der Auszeichnung umgekehrt.

Der Inhalt war noch gleich. Das ist der Zustand, in dem so eine Zeile immer
ist — bis zu dem Tag, an dem ein Bezirk dazukommt.

**Zweitens: ein Satz, wo eine Liste hingehört.** Für einen maschinellen Leser
ist `"Bezirk Perg, Urfahr-Umgebung, …"` eine Zeichenkette. Sie liest sich, als
sei nur das erste ein Bezirk, und sie lässt sich nicht gegen einen Ort
prüfen. Der Shop weiß es genauer, als er es sagte.

Dasselbe Textfeld stand auch im **Angebot jeder der 46 Artikelseiten** — dort
immerhin aus `LIEFERGEBIET` gebaut, aber ebenso als Satz.

## Behoben

`liefergebietOrte()` erzeugt aus der Entscheidung benannte Orte:

```json
"areaServed": [
  { "@type": "AdministrativeArea", "name": "Perg",
    "address": { "@type": "PostalAddress",
                 "addressRegion": "Perg", "addressCountry": "AT" } },
  …
]
```

Dieselbe Form, die `shippingDestination` im Angebot längst benutzt — die
Auszeichnung war an einer Stelle schon genau und an der anderen nicht.

Ist das Gebiet unbeziffert, entsteht **kein** Ort statt einer leeren Liste.
Eine leere Liste hieße „wir liefern nirgends"; die Lücke meldet
`liefergebietAngabe` an der Stelle, die dafür da ist.

## Die Probe

Ein Zensus über alle gebauten Seiten, nicht über eine ausgesuchte:

> Wo ein Liefergebiet ausgezeichnet ist, sind es benannte Orte, und ihre Namen
> sind **genau** die der Entscheidung — in derselben Reihenfolge, mit dem
> Landeskennzeichen aus `LIEFERGEBIET.land`.

Gemessen greift das auf 47 Auszeichnungen (46 Angebote plus die Organisation
der Startseite). Zwei Gegenproben:

| Eingriff | Ergebnis |
|---|---|
| die alte Zeichenkette zurückgesetzt | fällt |
| eine abweichende Bezirksliste eingesetzt (`Perg, Wels`) | fällt |

Die zweite ist die eigentliche: Sie prüft nicht die Form, sondern die
**Herkunft**. Eine Auszeichnung, die richtig geformt ist und die falschen
Bezirke nennt, käme sonst durch — und das ist der Fehler, der hier fünfmal
vorkam.

## Was das für Gate 23 heißt

Gate 23 verlangt, dass der Shop nur in das entschiedene Gebiet liefert. Der
Rechenkern hält das seit dem 26. August, die Kasse lehnt Bestellungen von
außerhalb ab, und die Veröffentlichung meldet eine abweichende
Umgebungsvariable als Widerspruch statt sie zu befolgen.

Was fehlte, war die Gegenrichtung: **dass ein Kunde von außerhalb es erfährt,
bevor er den Korb füllt.** Eine Suchmaschine und ein Assistent lesen jetzt
fünf benannte Bezirke statt eines Satzes. Das erspart nicht die Prüfung in der
Kasse — es erspart die Anfrage, die von vornherein keine werden konnte.

## Offen

`address` der Organisation nennt Ort und Land, aber keine Straße und keine
Postleitzahl. Die stehen in `data/betreiber.json` und gehören ins Impressum;
ob sie zusätzlich in die Auszeichnung sollen, entscheidet der Auftraggeber
zusammen mit den vier fehlenden Pflichtangaben. Bis dahin ist die kürzere
Angabe die richtige: Was noch nicht verbindlich ist, wird nicht ausgezeichnet.
