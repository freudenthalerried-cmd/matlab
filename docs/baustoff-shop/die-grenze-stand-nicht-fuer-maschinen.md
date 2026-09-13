# Die Grenze stand überall — außer dort, wofür der Shop gebaut ist

**3. September 2026.** Gate 25 hat am Vormittag einen Mindestbestellwert von
250 € gesetzt. Er stand am Abend an sechs Stellen: im Warenkorb, in der Kasse,
im Anfragetext, auf der Lieferseite, in AGB-Punkt 5 und in `betreiber.json`.

Nicht in den beiden Dateien, für die dieser Shop überhaupt gebaut ist.

`llms.txt` sagte unter „Was hier möglich ist":

> **Möglich ist eine Anfrage.** Warenkorb füllen, Bezirk der Baustelle wählen,
> und die Kasse erzeugt eine fertig gerechnete Positionsliste […]

Ein Assistent, den jemand fragt *„kann ich dort 10 m² Dämmung anfragen?"*,
hätte daraus **ja** gelesen. Die Kasse sagt nein, und zwar bei jedem Korb unter
250 €.

> **Eine maschinenlesbare Datei, die mehr verspricht als die Kasse hergibt,
> erzeugt genau die Anfrage, die abgelehnt wird.**

Und die strukturierten Daten führten am Angebot jedes Artikels:

```json
"eligibleQuantity": { "minValue": 0.5, "unitCode": "MTK" }
```

Das ist die kleinste **Liefermenge** — eine halbe Quadratmeterplatte. Wie klein
der **Vorgang** sein darf, stand nicht da. schema.org führt dafür ein eigenes
Feld, und es war leer:

```json
"eligibleTransactionVolume": {
  "@type": "PriceSpecification",
  "minPrice": "250.00", "priceCurrency": "EUR", "valueAddedTaxIncluded": false
}
```

> **Ein Angebot, das seine Untergrenze nicht nennt, wird für Anfragen
> empfohlen, die es ablehnt.**

## Zwei Felder, zwei Fragen — und sie sind leicht zu verwechseln

| Feld | Frage | Wert hier |
|---|---|---|
| `eligibleQuantity.minValue` | Wie wenig **Ware** kann ich kaufen? | 0,5 m² (der Gebindeschritt) |
| `eligibleTransactionVolume.minPrice` | Wie klein darf der **Vorgang** sein? | 250 € netto |

Die beiden zu tauschen hieße, entweder 0,5 m² als Mindestbestellwert
auszuweisen oder 250 € als kleinste Liefermenge — beides Unsinn, und beides
sähe in der Auszeichnung gleich richtig aus. Ein Testfall hält deshalb
ausdrücklich fest, dass die Felder verschiedene Werte tragen.

## Warum das keine Formsache ist

Der Kanal, auf den dieses Vorhaben setzt, ist nicht die Suchanzeige, sondern
die Empfehlung: Ein Assistent nennt einen Anbieter, weil er dessen Preise,
Einheiten und Liefergebiet maschinenlesbar findet. Genau deshalb tragen die
Seiten Preisstand, Einheitscodes, `areaServed` und Frachtsätze.

Eine Empfehlung, die an der Untergrenze scheitert, ist teurer als keine. Der
Kunde hat gefragt, ein Assistent hat geantwortet, der Kunde hat den Korb
gefüllt — und dann sagt die Kasse nein. Das ist derselbe Ablauf wie vor Gate 25,
nur dass die Absage jetzt nicht mehr nach dem Ja des Kunden kommt, sondern nach
dem Ja einer Maschine.

## Was jetzt dasteht

`llms.txt`, dritter Punkt unter „Was hier möglich ist":

> **Mindestbestellwert 250,00 € netto Warenwert je Lieferung.** Darunter nimmt
> die Kasse keine Anfrage an und nennt den fehlenden Betrag. Bei mehreren
> Herstellern entstehen mehrere Lieferungen, und die Grenze gilt für jede
> einzelne.

Beide Angaben kommen aus `data/betreiber.json` — derselben Zeile, aus der auch
Kasse, Warenkorb und Lieferseite schöpfen. Fehlt sie, entfällt beides: Ein
Angebot, das eine Untergrenze behauptet, die niemand gesetzt hat, ist
schlechter als eines ohne.

## Geprüft

Vier Testfälle in `test/gate25.test.js`, zwei davon gegengeprobt:

1. `llms.txt` nennt Wort und Zahl. *(Gegenprobe: die Zeile abgeschaltet — der
   Fall fällt.)*
2. Jedes der 46 Angebote nennt seine Untergrenze, und zwar dieselbe.
   *(Gegenprobe: den Wert im Bauwerkzeug weggelassen — 46 Angebote gemeldet.)*
3. Die Untergrenze des Vorgangs ist nicht die des Gebindes; beide Felder
   stehen mit ihren eigenen Werten da.
4. Ohne hinterlegte Grenze — auch bei `0` oder einem negativen Wert — bleibt
   das Angebot ohne das Feld.

Damit steht Gate 25 an acht Stellen, und sieben davon kommen aus einer Quelle.
Die achte ist AGB-Punkt 5, der die Regel in Worten führt statt in Zahlen — dort
gehört keine Zahl hinein, die sich ändern kann.
