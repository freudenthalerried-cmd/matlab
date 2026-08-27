# Die Prüfkette ist geschlossen — und was jetzt wirklich offen ist

Stand: 2026-08-27, abends. Der Lauf davor hat `pruefe-pruefer` gebaut und
dabei eine Lücke ausdrücklich offen gelassen:

> Was `pruefe-pruefer` **nicht** abdeckt: die beiden Browserproben. Ein
> grünes Szenario kann trotzdem eine leere Seite gemessen haben.

Dieser Lauf schließt sie und zieht damit einen Strich unter einen ganzen
Tag Werkzeugarbeit.

## Zwei kleine Ergänzungen

**Erstens: die Browserproben zählen mit.** `pruefe-pruefer --mit-browser`
befragt auch `oberflaechenprobe` und `shopprobe` nach ihrem Umfang. Sie
bleiben aus dem Regellauf heraus, weil jedes Szenario einen Chromium-Start
kostet — zusammen gut eine Minute.

```
✓ pruefe-inhalte — 23 Inhaltsseiten      ✓ pruefe-geheimnis — 46 Artikel
✓ pruefe-seiten — 54 gebaute Seiten      ✓ pruefe-tests — 686 Testfälle
✓ pruefe-quellen — 6 Aussagen            ✓ oberflaechenprobe — 11 Szenarien
✓ pruefe-widerrufe — 123 Dateien         ✓ shopprobe — 23 Szenarien
```

**Zweitens: ein schwaches Szenario nachgeschärft.** Die Escape-Probe der
Vorschlagsliste prüfte, dass danach **null** Einträge dastehen. Das ist auf
einer Liste, die nie Einträge hatte, ebenso wahr. Sie zählt jetzt **vorher**
und erwartet acht.

> **Der Beweis gehört vor die Handlung.** Was hinterher weg ist, beweist
> nur dann etwas, wenn es vorher da war.

Damit trägt jedes der 34 Browserszenarien eine Erwartung, die auf einer
leeren oder unbearbeiteten Seite nicht erfüllbar ist.

## Was der Tag an Werkzeug gebracht hat

| | |
|---|---|
| `pruefe-widerrufe` | neu — widerrufene Aussagen, die anderswo überleben |
| `interna.js` im Seitenbau | neu — Kalkulation und Konditionen auf Kundenseiten |
| Adressprüfung im Seitenbau | neu — prüft die ausgegebene Adresse statt der Kennung |
| `shopprobe` | neu — 23 Szenarien, davon 5 im 390-px-Rahmen |
| `pruefe-seiten` | neu — die Hälfte des Textes, die nie geprüft war |
| `inhalte/quellen.json` | neu — das erste echte Quellenregister |
| `pruefe-pruefer` | neu — die Frage vor jedem Befund |
| `gewichte.py` | neu — Positionsgewichte mit Summenprobe |

Und an Funden, die ohne diese Werkzeuge nicht aufgefallen wären:

| Fund | gefunden von |
|---|---|
| 41 tote Verweise in der Mehrseitenfassung | der Auftraggeber, dann die Adressprüfung |
| Rohmarge und Lieferantenskonto auf der AGB-Seite | `interna.js` |
| **keine Zeichensatzangabe** in der Einzeldatei | `shopprobe` |
| 82 px Seitwärtsrollen auf der AGB-Seite | die Rahmenprobe |
| Bedienelemente unter 44 px | die Rahmenprobe |
| Versatz um eins in der Tastaturbedienung | die Tastaturprobe |
| Fracht auf 3 statt 15 Belegen | das Nachlesen der Belege |
| 118,50 € nicht gerechnete Nebenkosten | dasselbe |
| Handelsspanne ohne Preisstand | `pruefe-seiten` |

## Was jetzt offen ist — und warum

Die Prüfkette ist damit an einem Punkt, an dem weitere Arbeit an ihr
Selbstzweck wäre. Was den Shop weiterbringt, ist etwas anderes.

### Beim Auftraggeber, weil es eine Ausgabe oder eine E-Mail auslöst

| | |
|---|---|
| **Artikelpreisliste bei Poschacher** | der einzige Hebel, der den Katalog um eine Größenordnung wachsen lässt |
| **Zahlungsanbieter** | ohne ihn endet die Kasse bei der Rechnung |
| **vier Impressumfelder** | E-Mail, Telefon, UID, Gewerbewortlaut |
| **Domain und Hosting** | Empfehlung liegt vor: `shop.freudenthaler-bau.at` |
| **Rechtstexteanbieter** | AGB Punkt 10 hat bis heute keine Fundstelle |
| **Repository auf privat** | 44 von 46 Einkaufspreisen sind rückrechenbar |
| **Handelsspanne öffentlich?** | steht auf drei Seiten; Vorschlag: Preisvorteil statt Spanne nennen |
| Lagerhaus-Vertrag, Paketdienst | beides Verträge |

### Ohne Rückfrage machbar

| | |
|---|---|
| **Gewichtsauslesung** | zwei ungeklärte Reste; jeder saubere Beleg bringt Artikelgewichte |
| **Gate 20 mit Nebenkosten** | hängt an den Gewichten (Palettenzahl) |
| **62 ungelesene Lagerhaus-Seiten** | davon 12 für das Sortiment des Shops relevant |
| **Herstellermerkblätter** | 22 von 46 Artikeln ohne Merkblattverweis — Seiten gesperrt |
| **390-px-Layout von Warenkorb und Kasse** | braucht Fernsteuerung statt `--dump-dom` |

> **Die erste Zeile jeder Spalte ist dieselbe Sache aus zwei Richtungen:**
> Der Katalog wächst entweder über eine Preisliste (eine E-Mail) oder gar
> nicht. Alles andere ist Pflege dessen, was da ist.

## Was dieser Tag gelehrt hat

Sechs Prüfer sind heute entstanden, und fünf Fehler in Prüfern. Beides
gehört zusammen:

> **Jeder Prüfer wurde gebaut, weil an dieser Stelle einmal etwas
> schiefgegangen war — und jeder war danach selbst eine neue Stelle, an der
> etwas schiefgehen konnte.** Ein Werkzeug, das Fehler findet, ist kein
> Ort, an dem keine Fehler wohnen.

Der Unterschied zum Morgen ist nicht, dass die Werkzeuge jetzt fehlerfrei
wären. Er ist, dass die Frage *„hat der Prüfer überhaupt etwas
angesehen?"* nicht mehr davon abhängt, dass jemand daran denkt.

687 Testfälle grün. 8 Prüfer mit belastbarem Umfang. 34 Browserszenarien,
jedes mit einem Beweis, dass es etwas gesehen hat.
