# Ein Preis, den man für nichts bekommt

Stand: 2026-08-29

## Der Befund

Der Produktfeed — der Kanal, auf dem der ganze Vertriebsplan ruht — nannte
für die XPS-Platte:

```json
"offers": { "price": "5.23", "priceCurrency": "EUR" }
```

5,23 € ist der **Quadratmeterpreis**. Die Platte wird in Einheiten zu 0,75 m²
abgegeben; die kleinste Bestellung kostet 3,92 €. **5,23 € bekommt man für
nichts.** Weder für eine Platte noch für eine bestellbare Menge.

In einem Preisvergleich ist das kein Detail. Es ist der Preis, mit dem der
Shop antritt, und er ist weder der Stückpreis noch der Bestellwert. Betroffen
sind 15 der 46 Artikel — alle mit Gebindebindung.

## Was schema.org dafür hat

Zwei Felder, und beide waren leer:

| Feld | Bedeutung | jetzt |
| --- | --- | --- |
| `priceSpecification.referenceQuantity` | worauf sich der Preis bezieht | je 1 m² (`MTK`) |
| `eligibleQuantity.minValue` | wie wenig man kaufen kann | 0,75 m² |

Dazu `UnitPriceSpecification` statt `PriceSpecification` — der Typ, der
genau „Preis je Einheit" bedeutet.

Die Einheiten des Katalogs werden dafür auf UN/CEFACT-Codes abgebildet:
`M2 → MTK`, `KG → KGM`, `LFM → MTR`, und alles stückweise Abgegebene — Sack,
Dose, Eimer, Karton, Rolle, Stück — auf `C62`. **Eine nicht abgebildete
Einheit bekommt keinen Code.** Einen zu raten hieße, einem Preisvergleich
eine Bezugsgröße unterzuschieben, die niemand geprüft hat; ein Test hält das
fest.

`npm run veroeffentlichung` zählt es jetzt mit:

```
Bezugsgröße:  43 von 43 Einträgen nennen, worauf der Preis sich bezieht
Mindestmenge: 15 Einträge geben ein Gebinde an (kleinste bestellbare Menge)
```

Käme später eine Einheit ohne Code dazu, nennt der Bericht sie beim Namen.

## Der zweite Fund: zwei Auszeichnungen für dasselbe Angebot

Beim Nachsehen, ob die Artikelseite dieselben Felder trägt, kam heraus: **Sie
baute ihr JSON-LD von Hand**, in `bin/website.mjs`, unabhängig von
`produktAuszeichnung()`. Zwei Beschreibungen desselben Angebots, und sie waren
bereits auseinandergelaufen — der Feed nannte seit heute Bezugsgröße und
Mindestmenge, die Seite nannte beides nicht.

Dieselbe Fehlerklasse wie im August, als die Verfügbarkeit im Feed
`PreOrder` und auf der Seite `InStock` war. Damals mit einer gemeinsamen
Konstante geheilt — aber nur dieses eine Feld. Der Rest blieb doppelt, und
die Doppelung hat prompt wieder zugeschlagen.

Jetzt kommt die Seite aus derselben Funktion. Was sie darüber hinaus trägt —
Liefergebiet, Verkäufer, Marke — steht **darunter und nicht anstelle**.

## Geprüft und gegengeprobt

824 Testfälle. Vier neue:

- Der Preis nennt seine Bezugsgröße als `MTK`, und die Mindestmenge ist
  0,75 m².
- Stückgut bekommt eine Bezugsgröße (`C62`), aber keine Mindestmenge.
- Eine unbekannte Einheit bekommt **keinen** geratenen Code.
- Seite und Feed zeichnen dasselbe Angebot aus — geprüft an der gebauten
  Seite, nicht am Modell.

| Gegenprobe | Ergebnis |
| --- | --- |
| Mindestmenge nicht gesetzt | 2 Testfälle fallen |
| Seite baut ihr Angebot wieder selbst | 1 Testfall fällt |

Die zweite Gegenprobe brauchte zwei Anläufe: Der erste entfernte nur die
äußere Übernahme und ließ `offers: { ...auszeichnung.daten.offers }` stehen —
der Test blieb grün, weil die Abhängigkeit dort saß, wo ich nicht hingesehen
hatte. **Eine Gegenprobe, die das Falsche verstümmelt, beweist nichts.**

## Was offen bleibt

Der Feed ist weiterhin **nicht einreichbar**: Bei 43 Artikeln fehlt die
GTIN/EAN, die Google für Produktfeeds verlangt. Das steht seit Tagen so im
Bericht und ändert sich nicht dadurch, dass der Preis jetzt richtig
ausgezeichnet ist — es ändert sich, wenn die Artikelliste des Lieferanten
kommt.
