# Neun Fassungen für sechsundvierzig Artikel

**5. September 2026, abends.** Die Runde davor hat die Aufgabe aufgeschrieben
statt sie zu machen; dies ist der Lauf, der sie macht.

Gemessen über die 46 gebauten Artikelseiten ergibt das Feld `description` in
der JSON-LD **neun** verschiedene Fassungen — und die neun unterscheiden sich
ausschließlich im Wort hinter „Verkaufseinheit":

```
<Name>. Warengruppe <Gruppe>. Verkaufseinheit Stück. Preis netto für
Unternehmer, Umsatzsteuer wird getrennt ausgewiesen.
```

`<Name>` steht als `name` im selben Datensatz. `<Gruppe>` steht als
`category`. Der Schlusssatz steht als `valueAddedTaxIncluded: false`.

> **Die 46 Produktbeschreibungen für Maschinen sind eine Schablone mit
> eingesetztem Namen — und der Name steht darüber im Feld `name`.**

Das wiegt hier schwerer als anderswo. Die Weisung des Auftraggebers lautet
ausdrücklich, für die Auffindbarkeit durch Assistenten zu optimieren; `llms.txt`
gibt es aus keinem anderen Grund. Die `description` ist der eine Fließtext, den
ein Assistent zitiert, wenn er nach diesem Artikel gefragt wird.

---

## Die Regel hatte nur eine Hälfte

Über der Funktion stand seit Beginn:

> „Was hier steht, steht auch auf der Artikelseite. Was dort nicht steht, steht
> hier nicht: keine Verbrauchsangaben, keine Schichtdicken, keine
> Verarbeitungshinweise."

Die Hälfte ist richtig und bleibt. Die andere fehlte: **Was dort steht und
belegt ist, steht hier auch.**

Die Artikelseite trägt seit den letzten Tagen vier Angaben, die die
strukturierte Auskunft nicht kannte — jede davon geprüft, jede aus einem
Katalogfeld oder einer Funktion, die schon die Seite füttert:

| Angabe | woher |
|---|---|
| Abgabemenge („Abgabe ab 0,75 m²") | `mengenschritt()`, seit 29. August |
| Packungsgewicht | `packungsgewichtKg()`, seit heute Mittag |
| Sperrgut-Einstufung **mit ihrer Herkunft** | seit 4./5. September auf fünf Flächen |
| Preisstand | steht auf jeder menschenlesbaren Fläche |

Danach:

```
Fassaden EPS 5 cm 0,5 m2. Warengruppe Dämmung. Verkaufseinheit m², Abgabe ab
0,5 m². Palettierte Ware, Kranentladung je Hub — die Einstufung folgt aus der
Warengruppe und nicht aus einer Angabe des Lieferanten. Preisstand 2026-08-17.
Preis netto für Unternehmer, Umsatzsteuer wird getrennt ausgewiesen.
```

Erfunden ist daran nichts. **21 eigene Beiträge statt effektiv einem.**

---

## Der Preisstand, jetzt auch strukturiert

`offers.priceSpecification` trug Preis, Währung und den Umsatzsteuervermerk —
**kein Datum**. Jede menschenlesbare Fläche nennt den Preisstand; die
maschinenlesbare nannte einen Preis ohne Alter.

Ergänzt als `validFrom`, und ausdrücklich **nicht** als `priceValidUntil`: Der
Preisstand ist das Datum der Lieferantenliste, aus der der Preis stammt — „gilt
ab". Bis wann er gilt, hängt an der nächsten Liste und ist nicht bekannt. Die
Begründung dafür steht seit dem 31. August zwanzig Zeilen weiter oben in
derselben Datei und gilt unverändert.

---

## Der Prüfer, der acht richtige Fälle angeschwärzt hätte

Der erste Wurf der Prüfung verlangte, dass sich je zwei Beschreibungen
unterscheiden. Er meldete **acht Gruppen** — darunter XPS in 30, 50 und 80 mm:
alle 0,75 m², alle palettiert, gleicher Preisstand. Ihr Unterschied *ist* die
Dicke, und die steht im Namen.

Sie auseinanderzuschreiben hieße, Eigenschaften zu erfinden — und der
Kommentar in derselben Datei sagt, warum das der teuerste Fehler wäre: „erfundene
Eigenschaften lesen sich bei Baustoffen wie eine Zusicherung."

> **Ein Prüfer, der acht richtige Fälle anschwärzt, wird abgeschaltet — und
> meldet dann auch den echten nicht mehr.**

Dieselbe Lehre wie heute früh beim Wort „Listenpreis" (216 richtige
Fundstellen) und heute abend beim Herkunftsmuster über HTML (25 richtige
Seiten). Dreimal an einem Tag dieselbe Falle, und dreimal war der erste Entwurf
darin.

Geprüft wird deshalb nicht, dass sich je zwei unterscheiden, sondern dass jede
**etwas Eigenes** sagt: `nichts-eigenes` meldet eine Beschreibung, von der nach
Abzug von Name, Warengruppe, Verkaufseinheit und Standardsatz nichts übrig
bleibt. Die Zahl der verschiedenen Beiträge wird **berichtet, nicht bewertet** —
ob zwei Platten sich unterscheiden müssen, entscheidet der Katalog und nicht
dieses Werkzeug.

Angeschlossen an `npm run pruefe-dubletten`, der die sichtbaren Artikelseiten
seit jeher gegeneinander hält und die maschinenlesbare Auskunft danebenliegen
ließ.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-dubletten` sieht auch die JSON-LD |
| Neue Gates | keine |
| Gegenproben | **63 für 35 Prüfer** (vorher 62) |
| Eigene Beiträge je Beschreibung | **21 verschiedene** statt effektiv einem |
| Testfälle | 1625 |

## Was offen bleibt

- **`image` und `gtin` fehlen weiter** — beide in `npm run offenepunkte`
  geführt, beide lösen sich mit der Artikelliste des Lieferanten.
- **Die Sperrgut-Einstufung bleibt eine Schätzung.** Sie steht jetzt auf
  sechs Flächen als solche da, einschließlich der maschinenlesbaren.
- **Der Vorbehalt zum Liefergebiet** steht in `areaServed` nicht dabei. Er
  steht im Feed-Bericht und in `LIEFERGEBIET.vorbehalt`; ob eine
  `AdministrativeArea` ihn tragen kann, ohne eine Zusage daraus zu machen, ist
  offen.
