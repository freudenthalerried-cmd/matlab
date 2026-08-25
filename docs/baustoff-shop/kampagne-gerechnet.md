# Die Kampagne, gerechnet statt geplant

Stand: 2026-08-25. Weisung: *„erstelle shop und shopping kampagne"*. Der
Shop trägt seit heute den echten Katalog; diese Datei beschreibt die
Kampagne, die daraus entsteht. Sie ist **importfertig und pausiert** —
`npm run kampagne` erzeugt sie, geschaltet ist nichts.

`google-kampagne.md` vom 22. August war die Planung: Struktur,
Ausschlüsse, Budget, alles von Hand. Was ihr fehlte, waren die Zahlen.
Die liegen jetzt vor, und damit ändert sich der Charakter der Sache:
**Die Gebote werden nicht mehr geschätzt, sondern gerechnet.**

## Die Rechnung hinter jedem Gebot

Was ein Klick kosten darf, ist der Deckungsbeitrag der Bestellung mal
der Kaufquote. Beide Größen waren bisher Annahmen. Der
Deckungsbeitrag steht seit dem Auslesen der Rechnungen artikelgenau
fest; die Kaufquote bleibt eine Annahme (2 %) und ist der Parameter,
den die ersten 300 € Werbung messen sollen.

Der zweite Bruch mit der alten Planung: **Gerechnet wird auf die
Bestellung, nicht auf den Artikel.** Der Befund aus
`katalog-aus-rechnungen.md` war eindeutig — die großen Belege bestehen
aus acht bis zwölf Positionen, nicht aus einer teuren. Wer je Artikel
bietet, bietet auf den Ein-Sack-Kunden, und der ist bei keinem
Klickpreis bezahlbar.

Die Referenzwarenkörbe stehen offen im Werkzeug, damit sie
widersprechbar sind:

| Anzeigengruppe | Referenzwarenkorb | Warenwert netto | Deckungsbeitrag | **max. Klick** |
|---|---|---|---|---|
| **Kamin** | ein Kaminzug, Fertigfuß bis Regenhaube | 1.893,71 € | 439,44 € | **8,79 €** |
| **Dämmung** | 100 m² Perimeterdämmung XPS 80 mm | 1.395,00 € | 323,92 € | **6,48 €** |
| **WDVS** | 100 m² Fassadensystem, fünf Positionen | 903,05 € | 209,40 € | **4,19 €** |
| Kanal | 30 lfm DN 100 mit Formteilen und Schacht | 427,38 € | 97,57 € | 1,95 € |
| Mörtel | eine Palette | 402,80 € | 92,51 € | 1,85 € |
| Mauerwerk | eine Palette Planziegel | 392,96 € | 90,31 € | 1,81 € |

Dagegen der Markt: **0,50 bis 2,50 € je Klick** in Österreich, Bau und
Handwerk.

> **Die drei oberen Gruppen tragen mit Abstand.** Kamin, Dämmung und
> WDVS erlauben Gebote, die den Marktpreis um das Zwei- bis
> Dreieinhalbfache übersteigen. Das ist der Ertrag aus zwei Dingen
> zugleich: der Umstellung auf 25 % Marge und dem Rechnen auf den
> Systemwarenkorb statt auf den Einzelartikel.
>
> **Die drei unteren sind knapp.** Kanal, Mörtel und Mauerwerk liegen
> bei 1,81 bis 1,95 € — innerhalb der Marktspanne, aber ohne Puffer.
> Sie gehören geschaltet und beobachtet, nicht ausgebaut.

Der Unterschied zwischen oben und unten ist nicht der Rabatt, sondern
die **Bestellgröße**. Ein Kaminzug ist eine Entscheidung über 1.900 €,
eine Palette Mörtel über 400 €. Die Klickpreisrechnung belohnt genau
das, was auch Gate 20 belohnt.

## Zwei Regeln, die im Programm stehen statt im Dokument

Beides sind Empfehlungen, die vorher in Dokumenten standen. Eine
Empfehlung, die nur im Dokument steht, wird im Alltag umgangen.

**Erstens: Kein Artikel am Listendeckel bekommt eine Anzeige.** Der
Katalogbefund trennt die 46 Artikel in 39, deren Verkaufspreis unter
dem Listenpreis des Lieferanten bleibt, und drei, bei denen er ihn
erreicht. Für die drei — Dosierpistole, Rahmenschraube,
Pistolenschaum — gibt es keinen Preisvorteil zu bewerben. Sie sind im
Shop bestellbar, aber der Kampagnenbau lässt sie nicht in Keywords und
nicht in Anzeigen. Er meldet sie stattdessen ausdrücklich als Beipack.

**Zweitens: Kein Gebot ohne Deckung.** Läge das errechnete Höchstgebot
einer Gruppe unter dem unteren Marktpreis von 0,50 €, würde die Gruppe
gar nicht ausgegeben, sondern als unwirtschaftlich gemeldet. Bei den
jetzigen Zahlen greift die Sperre nicht — das ist der Unterschied zur
Rechnung vom 22. August, wo der Ein-Sack-Kunde bei 13 Cent lag.

## Was die Kampagne enthält

| Datei | Inhalt |
|---|---|
| `kampagnen.csv` | sechs Suchkampagnen, alle **pausiert**, Gebiet Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz-Land, Linz; Werbezeit Mo–Fr 6–18 Uhr |
| `anzeigengruppen.csv` | Höchstgebot je Gruppe, mit Referenzwarenkorb und Deckungsbeitrag als Begründung in der Zeile |
| `keywords.csv` | 108 Keywords, nur **Phrase und exakt** |
| `negative-keywords.csv` | 41 Ausschlüsse in vier Themen |
| `anzeigen.csv` | sechs responsive Suchanzeigen, sieben Überschriften und drei Beschreibungen je Gruppe |

Alles unter `shop/ausgabe/kampagne/`. **Einkaufspreise stehen in keiner
dieser Dateien.**

### Warum nur Phrase und exakt

Weitgehende Übereinstimmung ist bei dieser Marge der teuerste Fehler,
den man machen kann. Google entscheidet dabei selbst, welche Suchen
„verwandt" sind — und rechnet das gegen ein Budget, dessen Grenze bei
23 % Werbeanteil liegt.

### Die Keywords kommen aus zwei Quellen

**Gattungsbegriffe** (76) sind handverlesen: „XPS 80 mm",
„Perimeterdämmung druckfest", „Kanalrohr DN 100", „Schiedel Kamin". Sie
stehen bewusst nie allein als Gattung, sondern immer mit Maß, Menge
oder Fachanforderung — der Befund aus `erste-echte-zahlen.md` gilt
weiter: Auf „Dämmplatte" gewinnt die Baumarkt-Eigenmarke.

**Markenbegriffe** (32) kommen aus dem Katalog: „Capatect 186 M",
„Isover TDPT 20", „SIKM Fertigfußpaket". Hier vergleicht der Kunde
Gleiches mit Gleichem, und hier zählt der Einkaufsvorteil.

## Was beim Bauen schiefging — und was es lehrt

Der erste Wurf erzeugte Keywords direkt aus den Artikelbezeichnungen.
Das Ergebnis sah aus wie eine Keyword-Liste und war keine:

```
Baumit TextilglasGitter 1,1x
Capatect Glasgewebe M, Breite 110cm, orange
Capatect Kantenschutz mit Gewebe Carbon 11,5 13,5 cm 2,
```

Niemand tippt das. Das erste ist ein abgeschnittenes Maß, das zweite
eine Katalogzeile, das dritte beides. **Eine Keyword-Liste, die keiner
eingibt, ist teurer als keine** — sie kostet die Einrichtung, bringt
null Impressionen und sieht dabei nach einem gepflegten Konto aus.

Drei Lehren, alle im Programm verankert:

1. **Prüfen statt reparieren.** Es gibt jetzt eine Regel, die vor den
   Kandidaten feststeht: mindestens sechs Zeichen, höchstens fünf
   Wörter, kein abgeschnittenes Maß am Ende, keine Katalognummer. Was
   durchfällt, wird gemeldet, nicht notdürftig zurechtgebogen. Zwei
   Artikel schaffen es bis heute nicht in die Liste, und das steht im
   Bericht.

2. **Die Typkennung ist der Suchbegriff.** „Capatect Klebe- und
   Spachtelmasse 186 M" ist zu lang — aber „Capatect 186 M" wird
   gesucht, weil auf der Baustelle die Typnummer genannt wird. Die
   volle Bezeichnung ersatzlos zu verwerfen hätte genau die Begriffe
   weggeworfen, auf denen dieser Shop konkurrenzfähig ist. Beim
   Kürzen fiel zuerst das „M" weg — und „Capatect 186" trifft zwei
   verschiedene Produkte.

3. **`\b` kennt kein „ß".** Die Regel, die Farbangaben entfernt, traf
   „weiß" nie: JavaScripts Wortgrenze ist ASCII-basiert, „ß" gilt ihr
   nicht als Wortzeichen. **Genau dieselbe Falle** hatte schon die
   ÖNORM-Regel des Hohlheitsprüfers blind gemacht. Ein Fehler, der
   einmal gefunden wurde, kommt wieder, wenn er nicht als Muster
   verstanden wird — behoben ist er jetzt an beiden Stellen mit
   `\p{L}`-Lookahead.

Ein vierter Fund betraf nicht die Keywords: Der Testlauf importierte
das Werkzeug und führte damit `main()` aus — jeder `npm test` schrieb
nebenbei die Kampagnendateien neu. Eine Nebenwirkung, die man erst
bemerkt, wenn sie einmal etwas überschreibt, das man behalten wollte.

## Was noch fehlt, bevor ein Euro fließt

Unverändert gegenüber `google-kampagne.md`, mit einer Streichung:

| fehlt | Stand |
|---|---|
| ~~Firmendaten und UID~~ | **erledigt** — Freudenthaler Bau GmbH, FN 347938z, Baustoffhandel eingetragen |
| Domain und Hosting | entschieden, nicht eingerichtet (`domainwahl.md`) |
| Impressum, AGB, Datenschutz, Widerruf | Gerüst steht, Lücken sind ausgewiesen |
| Funktionierender Bestellabschluss | die Strecke endet bewusst vor der Zahlung |
| Zahlungsanbieter | offen |
| **GTIN je Artikel** | fehlt vollständig — ohne sie kein Shopping-Feed |

Die GTIN ist der einzige harte Blocker, der noch Arbeit ist und nicht
nur Entscheidung. Die Rechnungen führen Lieferanten-Artikelnummern,
keine Herstellerkennungen. Sie zu beschaffen heißt: eine Anfrage an
Lieferant oder Hersteller — eine E-Mail an Dritte und damit eine
Freigabe des Auftraggebers.

**Ohne GTIN läuft die Suchkampagne trotzdem.** Nur Google Shopping
nicht. Das ist ein vertretbarer Anfang: Die Suchkampagne ist ohnehin
der Kanal, in dem Markenbegriffe wirken, und Shopping war schon in der
Planung vom 22. August der ungünstigste Kanal, solange
Baumarkt-Eigenmarken danebenstehen.

## Die Abbruchregel, unverändert

Nach Gate-17-Prinzip vorab festgelegt und durch die neuen Zahlen nicht
gelockert:

> **Nach 300 € Werbeausgabe wird gerechnet.** Liegt die Summe der
> Deckungsbeiträge aller in dieser Zeit eingegangenen Bestellungen
> unter der Werbeausgabe, wird die Kampagne **abgeschaltet**, nicht
> optimiert.

Die fünf Prozentpunkte Puffer aus der Margenumstellung machen den Kanal
vertretbar. Sie sind keine Erlaubnis, ihn auszureizen.
