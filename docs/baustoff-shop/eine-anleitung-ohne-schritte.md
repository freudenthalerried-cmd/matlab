# Eine Anleitung ohne Schritte

**Stand: 30. August 2026** · Befund und Behebung aus einem Lauf des
Arbeitsloops. Betroffen: `shop/bin/website.mjs`, `shop/test/website.test.js`.

## Zwei Auszeichnungen, die der Inhalt nicht deckt

Der ganze Shop ist auf Auffindbarkeit durch Maschinen gebaut. Also die Frage
an die strukturierten Daten: **Sagt die Auszeichnung, was die Seite ist?**

Zweimal nein.

### `HowTo` ohne einen einzigen Schritt

Die vier Systemseiten trugen `"@type": "HowTo"`. Eine `HowTo` ohne `step` ist
keine Anleitung, sondern eine Typbehauptung — und Schritte hatten diese Seiten
nie, weil sie keine Arbeitsanleitung sind. Sie führen eine **Positionsliste**:
zehn Zeilen, was zu 100 m² Fassade gehört.

### `Question` an einem `Article`

Alle 24 Inhaltsseiten trugen ihre Frage so:

```json
"@type": "Article",
"mainEntity": { "@type": "Question", "acceptedAnswer": { … } }
```

Eine `Question` mit `acceptedAnswer` wird in genau zwei Seitenarten gelesen:
**`FAQPage`** — der Betreiber schreibt die Antwort — und **`QAPage`** — Leser
schreiben sie. Ein `Article` mit `mainEntity: Question` ist keines von beiden.
Auf einem `Article` sagt `mainEntity` nur „dieser Text handelt von X"; die
Frage-Antwort-Struktur wurde dort von niemandem als solche gelesen.

Das ist die teuerste Sorte Fehler für dieses Vorhaben: Die Antwort **stand**
da, sorgfältig geschrieben, an vier Stellen abgeglichen — in einer Form, die
kein Leser als Antwort erkennt.

## Behoben

**Die Frage.** Der Betreiber schreibt die Antwort selbst, also `FAQPage`. Der
Seitentyp ist jetzt `["Article", "FAQPage"]`, und `mainEntity` ist dort eine
**Liste** von Fragen, wie es die Auszeichnung verlangt.

**Die Positionsliste.** `HowTo` ist weg. Stattdessen trägt jede Systemseite
ihre Tabelle als `ItemList` unter `about`:

```json
"about": {
  "@type": "ItemList",
  "numberOfItems": 8,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Kanalrohr" },
    …
    { "@type": "ListItem", "position": 6, "name": "Gleitmittel",
      "disambiguatingDescription": "nicht im Sortiment" }
  ]
}
```

Damit steht das, wofür dieser Shop gebaut wird, zum ersten Mal
maschinenlesbar da: **was zu einem Bauteil zusammengehört**, in der
Reihenfolge der Liste, mit den Positionen, die es hier nicht gibt, und dem
Vermerk dazu. Der Vermerk ist keine Kür — ohne ihn liest eine Maschine
„bestellbar", und die Kennzeichnung von heute früh wäre auf der Seite sichtbar
und in den Daten unsichtbar.

`about` und nicht `hasPart`: Eine `ItemList` ist kein `CreativeWork`; unter
`hasPart` stünde sie am falschen Platz. Ein Detail, aber die ganze Sache
handelt davon, dass Auszeichnungen stimmen.

## Was die Proben halten

| Zusicherung | Gegenprobe |
|---|---|
| Keine Seite behauptet `HowTo` | alten Typ zurückgesetzt → fällt |
| Wer eine Frage-Antwort trägt, ist `FAQPage`, und `mainEntity` ist eine Liste | (dieselbe Probe) |
| Genau vier Seiten führen eine `ItemList`, jede Position mit Nummer und Namen | Liste abgeschaltet → fällt |
| Die Liste behält die Reihenfolge der Tabelle | Einheitstest |
| „nicht im Sortiment" wandert in `disambiguatingDescription`, nicht in den Namen | Einheitstest |
| Ohne Positionstabelle entsteht keine Liste | Einheitstest — sonst trüge jede Seite mit irgendeiner Tabelle eine |

Die letzte Zeile ist die, die eine Ausweitung verhindert: Die Regel greift ab
drei nummerierten Zeilen, und gemessen tragen genau die vier Systemseiten eine
Liste — keine Wissens- und keine Gruppenseite hat versehentlich eine bekommen.

## Was das nicht ist

Kein Versprechen auf ein Rich Result. `FAQPage` wird von Google seit 2023 nur
noch bei wenigen Seitenarten als Rich Snippet angezeigt. Darum geht es hier
auch nicht: Die Auszeichnung ist für **jeden** maschinellen Leser da, und der
Grund, sie zu berichtigen, ist nicht die Aussicht auf eine Sternchenzeile,
sondern dass sie vorher falsch war.

## Offen

`areaServed` der Organisation steht als Zeichenkette da
(`"Bezirk Perg, Urfahr-Umgebung, …"`). Sauber wären benannte
`AdministrativeArea`-Knoten. Das ist die nächste Stelle, an der die
Auszeichnung hinter dem zurückbleibt, was der Shop schon weiß — das
Liefergebiet ist im Rechenkern längst eine Entscheidung mit Bezirksliste.
