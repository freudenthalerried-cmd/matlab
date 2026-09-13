# Die Regel, die nur im Browser galt

**13. September 2026.** Die Vorrunde endete mit einem Nebenbefund: Die
Bestellprobe fuhr ihre ganze Papierkette über **40 m²** einer Platte, die es
nur zu 0,75 m² gibt. Berichtigt wurde die Probe. Die Frage dahinter blieb
stehen, und sie ist die größere.

## Gemessen

```
Artikel: XPS glatt SF 30 mm 0,75 m2 | Schritt 0,75
kundenWarenkorb([{ sku: 'POS-12569', menge: 40 }])
  →  Warenwert 209,20 €   offen: []
berechneWarenkorb(dasselbe)
  →  Warenwert 209,20 €   hinweise: []
```

40 m² sind 53⅓ Platten. **Beide Rechenkerne bepreisen sie wortlos.**

Die Regel „nur ganze Gebinde" steht im Browser, und zwar zweimal: am
Korbknopf der Artikelseite seit dem 29. August und am Mengenfeld im Korb seit
dem 5. September. Beide runden auf. Im rechnenden Kern stand sie nicht.

> **Eine Regel, die nur in der Oberfläche steht, ist keine Regel des Shops,
> sondern eine des Bildschirms.**

## Und seit gestern widersprachen sich zwei Hälften

Am 12. September hat `npm run anfrage-lesen` gelernt, auf ganze Gebinde
einzurasten — sonst las er aus einer gedruckten Zeilensumme eine Menge zurück,
die kein ganzes Stück ist. Seither gilt beides nebeneinander:

| | zu 40 m² einer Platte zu 0,75 m² |
|---|---|
| Die Kasse | zeigt 209,20 € und sagt nichts |
| `anfrage-lesen` | weigert sich, die Menge zu übernehmen |

**Der Shop nennt einen Preis für eine Menge, die er anschließend ablehnt.** Der
Widerspruch ist einen Tag alt und stammt aus der eigenen Berichtigung: Wer eine
Hälfte streng macht, macht die andere falsch, solange die Regel nicht an einem
Ort steht.

## Dreimal dieselbe Formel

`gebindezahl(menge, schritt)` in `src/gebinde.js` rechnet seit jeher genau das:

```js
const stueck = Math.ceil(Math.round((menge / schritt) * 1e6) / 1e6);
const gedeckteMenge = Math.round(stueck * schritt * 100) / 100;
```

`gedeckteMenge` **ist** die aufgerundete Menge. `shop-ui.js` hat sie trotzdem
zweimal von Hand nachgerechnet, Zeichen für Zeichen dasselbe. Drei Kopien einer
Formel — und die beiden handgeschriebenen entschieden, was der Kunde kauft,
während die hiesige nur anzeigte, was dahintersteckt.

Erklärt hat das ein Satz, der über `gebindezahl` stand:

> „Für die Anzeige gedacht, nicht für die Rechnung."

**Er hat die beiden Abschriften begründet statt verhindert.** Dieselbe Sorte
Satz wie der über den gesperrten Netzausgang am 10. September: eine Grenze, die
zu weit gezogen ist, deckt genau das, was sie ausschließt.

## Was geändert wurde

**Eine Stelle.** `gebindezahl` ist seit heute die Regel; beide Sprungstellen in
`shop-ui.js` rufen sie. Alle drei lieferten bis heute dieselbe Zahl — wer die
Rundung einmal ändert, bekommt sonst eine Korbzeile, die eine Stückzahl
anzeigt, und einen Korb, der eine andere Menge enthält.

**Der Kern sagt es.** `kundenWarenkorb` nennt eine Menge, die kein ganzes
Gebinde ist, in `offen` — mit der nächsten vollen Menge und der Stückzahl:

```
XPS glatt SF 30 mm 0,75 m2: 40 m² sind kein ganzes Gebinde — abgegeben wird
in Einheiten zu 0,75 m², die nächste volle Menge ist 40,5 m² (54 Stück).
```

**Gerundet wird dort nicht.** Die Menge des Kunden gehört ihm; ein Rechenkern,
der sie stillschweigend ändert, ist schlimmer als einer, der sie
stillschweigend bepreist. Das Aufrunden ist Sache der Oberfläche, die es
sichtbar tut und dem Kunden anzeigt.

**Und wo Ware wirklich bestellt wird, wird gesperrt.**
`darfAutomatischAusgeloestWerden` weigert sich jetzt:

```
Unlieferbare Menge (POS-12569: 40 ist kein ganzes Gebinde zu 0,75)
— der Lieferant gibt die Ware in ganzen Gebinden ab
```

Dieselbe Familie wie die Lieferzeit am 1. September: eine Bestellung, die beim
Lieferanten weder ausführbar noch zuordenbar ist. Die Sperren dieser Funktion
schützten bis heute das **Geld** (Zahlung, Marge, Konditionen) und seit dem
1. September die **Zustellung** (Telefon, Absenderfirma). Was fehlte, war die
**Ware**.

## Wo kein Gebinde bekannt ist, wird nichts geraten

`mengenschritt` liest Kilo, Quadratmeter und laufende Meter aus der
Bezeichnung. Ein Artikel in Säcken (`SCK`) ohne lesbare Packungsangabe hat für
dieses Haus kein Gebinde — dort gibt es nichts zu melden und nichts
aufzurunden. Das ist keine Lücke, sondern dieselbe Haltung wie überall hier:
Was die Bezeichnung nicht sagt, sagt sie nicht.

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `die-kasse-bepreist-die-halbe-platte` | der Kern schweigt wieder über eine unlieferbare Menge |
| `die-aufrundung-steht-wieder-zweimal` | die Oberfläche rechnet die Aufrundung wieder selbst |

Die zweite misst die **Formel**, nicht ihr Ergebnis: Wer sie neu hinschreibt,
bekommt heute dieselbe Zahl — und morgen nicht mehr. Genau deshalb zählt der
Testfall ihr Vorkommen statt ihren Wert.

Gemessen: Testfälle grün, Schnelllauf 49 Prüfer, Bestellprobe 17 von 17,
11 Browserszenarien der Oberflächenprobe unverändert.
