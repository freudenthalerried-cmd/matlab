# Ein Feed, der auch mit GTIN abgelehnt worden wäre

**1. September 2026.** Seit Wochen steht in jedem Bericht derselbe Satz: *Der
Produktfeed ist nicht einreichbar, weil die GTIN fehlt.* Die Lückenliste sagte
das, die PR-Beschreibung sagte das, ich habe es fünfmal aufgeschrieben.

Heute in die Auszeichnung selbst hineingesehen:

```
Product-Felder: @context @type brand category name offers sku
Offer-Felder:   @type areaServed availability itemCondition price
                priceCurrency priceSpecification seller
```

**Keine Adresse.** Nicht im `Product`, nicht im `Offer`, nirgends.

`link` ist für einen Produktfeed eine **Pflichtangabe**. Ein Feed ohne sie
wird abgelehnt — genau wie einer ohne GTIN. Und die Lückenliste kannte das
Feld nicht.

> **Der Feed wäre an dem Tag, an dem die Kennungen eintreffen, als vollständig
> gemeldet worden — und trotzdem abgelehnt.**

Der Auftraggeber hätte 43 Kennungen beschafft, den Feed hochgeladen und die
Ablehnung bekommen. Die Arbeit wäre nicht umsonst gewesen, der Weg dorthin
schon.

Und ein Testfall hat es bestätigt statt gefunden: *„Mit GTIN ist derselbe Feed
einreichbar"* — grün, weil die Vorrichtung dieselbe Lücke hatte wie die
Wirklichkeit.

## Für den zweiten Kanal wiegt es genauso schwer

Dieser Shop wird ausdrücklich für die Auffindbarkeit durch Sprachmodelle
gebaut. Ein Modell, das die Auszeichnung einer Artikelseite liest, hatte
**keinen Verweis, den es zurückgeben konnte**. Es konnte sagen, dass es das
Fertigfußpaket zu 183,92 € netto gibt — aber nicht, wo.

Ein Produkt, auf das man nicht zeigen kann, ist für eine Auskunft nicht da.

## Abgestellt

`angebotsAuszeichnung` nimmt jetzt `seitenadresse` — eine Zeichenkette oder
eine Funktion je Artikel, dieselbe Form wie `versandkostenNetto` und aus
demselben Grund: Der Aufrufer kennt den Aufbau seiner Seiten, das Modul
erfindet ihn nicht.

| Ort | vorher | jetzt |
|---|---|---|
| `Product.@id` | fehlt | `https://bauversand.com/artikel/POS-12472.html` |
| `Offer.url` | fehlt | dieselbe Adresse |
| Lückenliste | kennt das Feld nicht | meldet es wie GTIN und Versandkosten |
| Feed (`veroeffentlichung.mjs`) | ohne Adresse | aus `betreiber.json`, sonst gemeldet |

**Nur absolute Adressen.** Was nicht mit `http` beginnt, gilt als nicht
vorhanden und wird gemeldet: Eine relative Adresse ist in einem Feed und in
einer maschinellen Auskunft wertlos, weil dort kein Dokument steht, auf das
sie sich beziehen könnte. Fehlt die Domain in den Betreiberdaten, wird nichts
erfunden — die Lücke wird gemeldet, und der Feed bleibt nicht einreichbar. Das
ist die richtige Reihenfolge.

## Und die kanonische Adresse, die auf keiner Seite stand

Beim selben Blick: **Keine der 81 Seiten trug ein `rel="canonical"`.**

Für einen Shop, der über Suche und maschinelle Auskunft gefunden werden soll,
sind `bauversand.com/`, `bauversand.com/index.html` und
`www.bauversand.com/…` drei Adressen mit demselben Inhalt. Welche zählt,
entscheidet dann der Indexer — und verteilt die Signale auf drei Seiten,
statt sie zu bündeln.

Jetzt trägt jede Seite ihre eigene, absolute Adresse. Die Startseite
kanonisiert auf die **Wurzel** und nicht auf `/index.html` — das ist die
Adresse, die jemand tippt und die in einer Anzeige steht.

Beides kommt aus `data/betreiber.json`, wie die Ziel-URLs der Anzeigen seit
dem 31. August. Drei Wege zu einer Adresse wären drei Gelegenheiten, sie
auseinanderlaufen zu lassen.

## Was jetzt noch am Feed fehlt

```
43 Einträge sind veröffentlichbar, aber unvollständig:
  · GTIN/EAN — für Produktfeeds verlangt — bei 43 Artikeln
Einreichbar: nein
```

Nur noch die Kennungen. Der Satz, den ich fünfmal geschrieben habe, stimmt ab
heute — vorher war er unvollständig, und zwar zugunsten des Plans.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Fehlende Adresse nicht mehr melden | ja |
| Relative Adresse als gültig zulassen | ja |
| Startseite auf `/index.html` kanonisieren | ja |
| `rel="canonical"` weglassen | ja |

## Stand

- 1.080 Tests, 0 rot; alle Prüfer grün
- 81 von 81 Seiten mit kanonischer Adresse
- 43 von 43 Feedeinträgen mit Produktadresse; einreichbar bleibt es an der GTIN
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
