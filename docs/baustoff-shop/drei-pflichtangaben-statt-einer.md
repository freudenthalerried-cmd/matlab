# Drei Pflichtangaben statt einer

**1. September 2026.** Gestern habe ich die fehlende Produktadresse gefunden
und geschrieben: *„Am Feed fehlen jetzt nur noch die Kennungen."*

Das war wieder zu früh. Heute die restlichen Pflichtangaben von Google
Merchant durchgezählt, statt beim ersten Fund aufzuhören.

```
Zeilen 43 | brand 0 | description 0 | image 0
Felder einer Zeile: @context @id @type category name offers sku
```

## Die Marke, die auf jeder Seite stand und in keiner Feedzeile

`angebotsAuszeichnung` liest `artikel.hersteller`. Dieses Feld ist in **0 von
46** Katalogartikeln gesetzt — es gibt es dort gar nicht. Die Marke steckt in
der Lieferantenbezeichnung: „Mantelstein MSTS EZ 16-18 **SIKM**".

Und die Zuordnung von `SIKM` zu Schiedel? Die stand in `bin/website.mjs`, in
einer Tabelle namens `HERSTELLER` — also **im Bauwerkzeug, das den Feed nicht
baut.** Jede Artikelseite trug ihre Marke im JSON-LD, jede der 43 Feedzeilen
trug keine.

> **Die Seite weiß etwas, das der Feed nicht weiß, weil das Wissen im Werkzeug
> liegt statt im Modul.**

Dieselbe Bauart wie die fehlende Produktadresse eine Stunde davor, und wie
`EINHEITEN` und `GRUPPENSEITE` davor. Verlegt nach `src/hersteller.js`;
`angebotsAuszeichnung` leitet die Marke jetzt aus der Bezeichnung ab, wenn das
Feld fehlt.

Ergebnis: **23 von 43** Zeilen haben eine Marke. Die übrigen 20 sind teils
Ware ohne Marke („PVC Kanalbogen NW 100"), teils Namen, die die Tabelle nicht
belegen kann — Ravenit, Ökotherm, SunCore. Welcher Fall vorliegt, ist aus der
Bezeichnung nicht entscheidbar, und einen Hersteller zu **erraten** wäre bei
Baustoffen der teuerste Fehler: Er stünde als Zusicherung im Feed. Die Meldung
sagt deshalb, was zutrifft — *nicht bestimmbar*.

## Die Beschreibung

Ebenfalls Pflicht, ebenfalls nicht da. Sie ist die einzige der drei, die sich
aus dem Bestand bauen lässt:

```
Fassaden EPS 2 cm 0,5 m2. Warengruppe Dämmung. Verkaufseinheit m².
Preis netto für Unternehmer, Umsatzsteuer wird getrennt ausgewiesen.
```

Zusammengesetzt aus Katalogfeldern und aus nichts sonst. Kein Werbetext, keine
Verbrauchsangabe, keine Schichtdicke — dieselbe Regel wie auf der Artikelseite:
Was sich im Merkblatt des Herstellers ändert, wird nicht abgeschrieben.

## Das Bild — die einzige, die hier niemand schließen kann

`image_link` ist Pflicht. Der Shop führt Zeichnungen als eingebettetes SVG,
**keine Produktfotos**. Es gibt keine Datei, auf die ein Feed zeigen könnte.

Ein Platzhalter wäre keine Lösung, sondern ein Ablehnungsgrund mehr: Das Bild
muss die Ware zeigen. Also gemeldet statt gefüllt — und damit ist es eine
Beschaffungsaufgabe wie die GTIN. Herstellerfotos mit Nutzungsrecht, oder
eigene Aufnahmen.

**Das ist der eigentliche Ertrag dieser Stunde.** Der Auftraggeber hätte die
Kennungen beschafft, den Feed hochgeladen und wäre am Bild gescheitert — an
einer Aufgabe, die niemand auf seiner Liste hatte.

## Der Stand des Feeds, vollständig aufgezählt

```
43 Einträge sind veröffentlichbar, aber unvollständig:
  · GTIN/EAN — für Produktfeeds verlangt — bei 43 Artikeln
  · Marke — aus der Bezeichnung nicht bestimmbar; für Markenware verlangt — bei 20
  · Produktbild — für Produktfeeds verlangt, muss die Ware zeigen — bei 43 Artikeln
Einreichbar: nein
```

Gegenüber gestern: Adresse und Beschreibung sind geschlossen, zwei neue Lücken
sind sichtbar geworden. **Die Liste ist länger geworden und dabei zum ersten
Mal vollständig.**

Der Satz „nur noch die Kennungen" ist damit zum zweiten Mal falsch gewesen.
Ich schreibe ihn nicht wieder, bevor der Feed grün meldet.

## Was das für die Reihenfolge heißt

Die drei offenen Punkte am Feed haben **dieselbe Quelle**: eine Artikelliste
aus dem Poschacher-Kundenkonto. Sie trägt in aller Regel EAN, Herstellername
und oft auch einen Bildverweis je Position. Was bisher als *eine* Frage auf
der Liste des Auftraggebers stand, löst damit drei Punkte auf einmal — und
zusätzlich die Weisung, das Sortiment auf hundert Artikel zu erweitern.

Diese eine Anfrage ist der kürzeste Weg zum Werbeweg, den es gibt.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Marke nur aus dem Feld lesen (nicht aus der Bezeichnung) | erst nach Nachschärfen |
| Fehlendes Bild nicht mehr melden | ja |
| Beschreibung auch ohne Bezeichnung bauen | ja |
| `HERSTELLER`-Import aus `website.mjs` entfernt | ja |

Die erste ist wieder lehrreich: Meine Probe prüfte `herstellerNameAus()`
einzeln und den Fall mit ausdrücklichem Feld — aber nicht den Fall, um den es
geht: **kein Feld, Marke in der Bezeichnung.** Genau die Lage jedes einzelnen
Katalogartikels. Eine Probe, die die Bausteine prüft und nicht ihren
Zusammenbau, prüft den Fehler nicht, der behoben werden sollte.

## Stand

- 1.082 Tests, 0 rot; alle Prüfer grün
- Feed: Adresse und Beschreibung bei 43 von 43, Marke bei 23 von 43, Bild bei 0
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
