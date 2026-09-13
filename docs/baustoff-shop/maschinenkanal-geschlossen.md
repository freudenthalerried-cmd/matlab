# Der Maschinenkanal: eine Lücke gefüllt, ein Widerspruch behoben, eine Liste nachgereicht

**28. August 2026.** Die Weisung nennt die Auffindbarkeit über KI-Systeme als
Kanal. Drei Befunde, alle in derselben Ecke, alle ohne fremde Hilfe zu
schließen.

## 1. Der Produktfeed hatte zwei Lücken — eine war hausgemacht

`npm run veroeffentlichung` meldete bei allen 43 einreichbaren Artikeln zwei
fehlende Angaben: **GTIN/EAN** und **Versandkosten**.

Die GTIN gibt es nicht; sie steht auf keiner der fünfzehn Rechnungen und kommt
nur vom Lieferanten. Die Versandkosten dagegen kennt dieses Vorhaben seit dem
25. August genau — Pauschale je Lieferung, dazu Kranentladung je Hub für
palettierte Ware. Sie fehlten nicht, weil sie unbekannt waren, sondern weil
der Aufrufer sie nicht durchgereicht hat.

Der Feed nimmt jetzt einen Satz **je Artikel** statt einer Zahl für den
ganzen Katalog. Der Grund ist die Ware: Eine Palette Dämmplatten kostet mehr
Zustellung als ein Karton Dübel; eine einzige Zahl wäre für die eine Hälfte zu
hoch und für die andere zu niedrig. Gerechnet wird nichts nach — die Sätze
kommen aus derselben Datei, die der Warenkorb liest.

**Ausgewiesen wird die Zustellung einer Bestellung mit genau diesem Artikel.**
Für eine Bestellung mit mehreren Positionen ist das zu hoch; die Pauschale
fällt nur einmal an. Trotzdem ist es die richtige Zahl für diesen Kanal, und
zwar aus demselben Grund wie überall sonst hier: **Die unangenehme Zahl steht
vorne.** Dass eine Dämmplatte für 1,93 € netto 83 € Zustellung kostet, ist
keine Panne der Ausgabe — es ist der Grund, warum dieser Shop keine
Frei-Haus-Schwelle hat.

Stand jetzt: **43 einreichbar, eine offene Angabe** (GTIN), und die braucht
den Lieferanten.

## 2. Zwei Ausgänge sagten zwei verschiedene Dinge

Die Artikelseite zeichnete `PreOrder` aus, der Feed `InStock` — beide aus
derselben Datenlage, beide ohne Absicht.

> **Zwei Ausgänge mit zwei Wahrheiten sind schlimmer als ein falscher
> Ausgang.** Der falsche fällt auf; der Widerspruch erst beim Kunden.

Und die gefährlichere Angabe stand ausgerechnet im Maschinenkanal: Ein
Assistent, der `InStock` liest, sagt einem Kunden, er könne das jetzt kaufen.
Kaufen kann er nichts — die Kasse löst nichts aus, weil kein Zahlungsanbieter
gewählt ist.

Jetzt eine Konstante `VERFUEGBARKEIT` für beide Ausgänge, auf `PreOrder`.
Sobald die Kasse Bestellungen auslöst, ändert sich ein Wort, und beide folgen.

Der Test dazu liest **die gebaute Artikelseite** und vergleicht sie mit dem
Feed. Niemand hatte die beiden Ausgänge je nebeneinander gelesen; genau das
tut er jetzt bei jedem Lauf. Gegenprobe: Weicht einer der beiden ab, fällt er.

## 3. `llms.txt` nannte keinen einzigen Artikel

Die Datei führte Wissensseiten, Systemlisten und sieben Gruppenseiten — und
hörte dann auf. Für den Kanal, für den sie gemacht ist, war das die falsche
Auslassung:

> Wer einen Assistenten fragt, wo er in Oberösterreich XPS in 80 mm bekommt,
> wird über den **Artikel** gefunden oder gar nicht.

Neu: ein Abschnitt mit allen 46 Artikeln — Preis netto je Einheit, Gruppe,
Gewicht wo belegt, Vermerk „palettiert" —, dazu ein Satz über die Fracht im
selben Absatz wie der Preis. Ein Preis ohne die Angabe „netto" ist in diesem
Kanal eine Falle: Der Assistent vergleicht ihn mit einem Bruttopreis und lässt
den Shop teurer aussehen, als er ist.

Die Datei sagt außerdem, ob sie vollständig ist. Heute lautet die Zeile „Jeder
geführte Artikel steht in dieser Liste"; sobald ein Artikel ohne
kalkulierbaren Einkaufspreis dazukommt (Gate 24), steht dort seine Anzahl.
Eine Auslassung, die sich selbst beziffert, ist keine Lücke mehr — und der
Test lässt eine stille Kürzung auffallen (gegengeprobt mit einer Liste, die
nach zehn Artikeln abbricht).

## Was der Kanal weiterhin nicht hat

- **GTIN/EAN** für alle Artikel — kommt vom Lieferanten, gehört zur ohnehin
  offenen Artikelpreisliste.
- **Herstellermerkblätter** für 22 von 46 Artikeln. Heute erneut geprüft:
  `baumit.at`, `schiedel.com`, `isover.at`, `synthesa.at` antworten mit
  **403 auf den CONNECT des Ausgangsproxys** — eine Sperre der Umgebung, kein
  Hängen wie bei den Schriften. Der gestrige Fund ändert daran nichts, und
  diesmal ist es nachgesehen statt angenommen.
- **Bilder für Produktfeeds.** Der Shop zeichnet Schemata als SVG; Feeds
  verlangen Rasterbilder. Ein Foto wäre ein fremdes Werk.

## Stand

- 721 Tests grün (vorher 714; +7)
- `veroeffentlichung`: 43 veröffentlichbar, **eine** offene Angabe statt zwei
- `llms.txt`: 96 Zeilen statt 43, alle 46 Artikel mit Preis
- `pruefe-inhalte` 24/355/0, `pruefe-seiten` 57/216/0, `pruefe-widerrufe` 131
  Dateien/48 Fundstellen sauber
- `shopprobe` 28 Szenarien, `oberflaechenprobe` 11, Website 81 Seiten ohne
  toten Verweis
- `pruefe-geheimnis` unverändert: 44 von 46 Einkaufspreisen rekonstruierbar —
  offene Entscheidung des Auftraggebers, nicht neu durch diese Änderung
