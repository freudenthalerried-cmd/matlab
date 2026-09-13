# Einunddreißig Flächen, zwei geprüft

**5. September 2026, abends.** Der Sperrgutprüfer meldete seit heute früh:

```
Gebaute Flächen mit dem Wort   2, alle mit Herkunftsangabe
```

Gemessen sind es **31**: 25 Artikelseiten, `lieferung.html`, zwei
Wissensseiten, eine Gruppenseite, `llms.txt` und `shop.js`.

> **Der Prüfer, der zählt, wie viele Flächen er geprüft hat, zählte sein
> eigenes Register.**

Das ist wörtlich derselbe Fehler, den ich heute Mittag zwei Felder weiter oben
im selben Modul behoben habe — dort stand `davon ${HINGENOMMEN.length} mit
Grund`, die Länge des Ausnahmeverzeichnisses als Ergebnis der Prüfung. Beim
Beheben des einen ist das andere nicht aufgefallen.

---

## Warum es genau zwei waren

Das ist der zweite Teil und der interessantere. `HERKUNFTSMUSTER` suchte
`/aus der Warengruppe/` im **rohen Dateiinhalt**. Auf `llms.txt` und `shop.js`
trifft das. Auf einer Artikelseite steht dort:

```html
Die Einstufung als palettierte Ware stammt aus der
<strong>Warengruppe Dämmung</strong> und nicht aus einer Angabe des Lieferanten.
```

Ein Zeilenumbruch und eine Marke zwischen „aus der" und „Warengruppe". Das
Muster trifft nicht — obwohl die Auskunft vollständig dasteht.

> **Ein Muster, das auf zwei Textdateien passt, zerbricht an HTML — und
> deshalb führte das Register genau die zwei Textdateien.**

Hätte jemand das Register einfach um die Artikelseiten erweitert, wäre der
Lauf mit **25 Fehlmeldungen** rot geworden, an 25 Stellen, an denen alles
richtig steht. Nach dem zweiten Mal hätte jemand den Prüfer abgeschaltet.

Gesucht wird deshalb jetzt im **Text**, nicht im Markup.

### Die vierte Fassung, die keine wurde

Die Funktion dafür stand im Bestand bereits **dreimal**: als lokales `nurText`
in `seitenaehnlichkeit.js`, in `interna.js` und in `bin/inhaltspruefung.mjs`.
Sie steht jetzt einmal, in `format.js`.

Die dritte bleibt, wo sie ist, und zwar mit Grund: Sie **löst** Entitäten auf
(`&amp;` → `&`), statt sie zu entfernen — ein „&" mitten in einem Satz wäre
dort eine Wortgrenze. Das ist ein Unterschied in der Sache und keine
Nachlässigkeit; er steht jetzt aufgeschrieben statt nur da.

---

## Was die Messung gefunden hat

Von 31 Flächen tragen **28** die Herkunftsangabe. Drei sind hingenommen:

| Fläche | Warum |
|---|---|
| `wissen/warum-keine-gratislieferung.html` | erklärt die Fracht, stuft keinen Artikel ein |
| `wissen/baumeisterpreis.html` | nennt die Kranentladung als Kostenbeispiel |
| `gruppe/mauerwerk.html` | Etikett mit Verweis auf die Artikelseite |

Und **eine war ein echter Befund**: `lieferung.html` — die Seite, auf der der
Betrag steht (7,50 € netto je Hub), die in der FAQ-Auszeichnung von Google
zitiert wird und auf die **jede** Artikelseite verweist. Dort stand die
Kranentladung mit Zahl und ohne ein Wort darüber, dass die Einstufung
geschätzt ist.

Sie trägt es jetzt an beiden Stellen: in der FAQ-Antwort und in einem Absatz
unter der Preistafel.

*Vier Runden lang ist diese Auskunft nachgezogen worden — Artikelseite
(4. September), `llms.txt`, Kasse und Marker (5. September früh),
Anfragetext (5. September nachmittags) —, und jedes Mal war die Liste der
Flächen von Hand geschrieben. Die Seite mit dem Betrag darauf war in keiner.*

---

## Das Verzeichnis, das jetzt eine Ausnahmeliste ist

`FLAECHEN` (welche Dateien geprüft werden) ist zu `OHNE_HERKUNFT` geworden
(welche Dateien das Wort ohne die Herkunft tragen dürfen). Der Unterschied ist
die Beweislast: Vorher musste jemand eine Fläche **eintragen**, damit sie
geprüft wird; jetzt muss jemand sie **begründen**, damit sie es nicht wird.

Gehalten wird sie in beide Richtungen — eine Ausnahme, deren Datei das Wort
nicht mehr ohne Herkunft trägt, meldet `ausnahme-ohne-fall`. Dazu eine
Untergrenze: Findet die Sammlung weniger als zwanzig Flächen, ist der Lauf
leer und nicht sauber.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-sperrgut` misst statt aufzuzählen |
| Neue Gates | keine |
| Gegenproben | **62 für 35 Prüfer** (vorher 61) |
| Geprüfte Flächen | **31 statt 2** |
| Testfälle | 1617 |

## Was offen bleibt

- **Die JSON-LD-Beschreibung ist eine Schablone.** Alle 46 Artikelseiten
  tragen `"description": "<Name>. Warengruppe <Gruppe>. Verkaufseinheit <X>.
  Preis netto für Unternehmer, Umsatzsteuer wird getrennt ausgewiesen."` —
  neun Fassungen, und der Unterschied zwischen ihnen sind Name und Gruppe, die
  als eigene Felder direkt danebenstehen. Die sichtbare Seite trägt Preisstand,
  Abgabemenge, Gewicht und die Sperrgut-Qualifikation; die strukturierte
  Auskunft, für die dieses Vorhaben ausdrücklich optimiert wird, trägt keines
  davon. Aufgeschrieben statt gemacht — das ist eine eigene Runde.
- **Der Preisstand fehlt in der strukturierten Auskunft.** Jede
  menschenlesbare Fläche nennt ihn; `offers` hat weder `priceValidUntil` noch
  ein `validFrom` in der `priceSpecification`.
