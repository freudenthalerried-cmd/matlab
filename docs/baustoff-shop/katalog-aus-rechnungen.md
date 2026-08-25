# Der Katalog aus den Rechnungen — 46 Artikel, und was sie über den Shop sagen

Stand: 2026-08-25. **Die Poschacher-Rechnungen sind ausgelesen.** Nicht
teilweise, nicht geschätzt: fünfzehn Belege, siebzig Positionen,
sechsundvierzig verschiedene Handelswaren, jede mit Artikelnummer,
Einheit, Listenpreis, Rabattsatz und Betrag. Damit ist der Blocker
gefallen, an dem das ganze Modell hing.

> **Wo die Zahlen liegen.** Dieses Repository ist öffentlich. Die
> Einkaufskonditionen stehen deshalb **nicht** hier, sondern in
> `preise/` — einem Verzeichnis, das seit heute in `.gitignore` steht
> und nie mitgepusht wird. Dieses Dokument enthält die Struktur, die
> Methode und die Schlussfolgerungen; die Preise bleiben beim
> Auftraggeber.

## Wie das gelang — und warum es zweimal fehlschlug

Der Weg war länger als erwartet, und die Fehlschläge sind lehrreich.

**Erster Versuch:** Das Gmail-Werkzeug gibt Anhänge nicht heraus. Über
`messageFormat: RAW` kommt aber die vollständige MIME-Nachricht, aus
der sich die PDFs entpacken lassen. Das funktionierte.

**Zweiter Versuch:** Der Text im PDF blieb Binärmüll. Grund: Die
Font-Dictionaries lagen in einem komprimierten Objektstrom
(`/Type/ObjStm`) und waren im Rohbytes-Grep unsichtbar — ein
`grep /Font` fand null Treffer und legte den falschen Schluss nahe,
es handle sich um einen Scan.

**Was schließlich trug:** Die Rechnungen sind textbasiert. Jeder der
acht Subset-Fonts hat eine `/ToUnicode`-CMap; damit ist die
Zeichenzuordnung vollständig rekonstruierbar. Zwei weitere Hürden
mussten fallen: Ein Regex über den Inhaltsstrom verliert Text, weil
Glyphcodes Bytes wie `0x5D` (`]`) enthalten und einen naiven
TJ-Array-Regex vorzeitig beenden — erst ein zeichenweiser Tokenizer
brachte die Preisspalte zum Vorschein. Und die Seite ist per `cm` um
Faktor 0,12 skaliert und y-gespiegelt; ohne Mitführen der
Transformationsmatrix sind alle Koordinaten unbrauchbar.

## Die Kontrolle, die vier Fehler fand

Nach Gate-17-Prinzip stand die Prüfregel vor dem Ergebnis:

> **Die Summe der ausgelesenen Positionsbeträge muss bei jedem Beleg
> exakt dem ausgewiesenen Nettowarenwert entsprechen.**

Sie tut es bei allen fünfzehn. Auf dem Weg dorthin deckte sie **vier
echte Parserfehler** auf, die eine Sichtprüfung übersehen hätte:

| Fehler | Wirkung |
|---|---|
| mehrzeilige Positionen | Betrag stand zwei bis drei Zeilen tiefer und wurde der falschen Position zugeordnet |
| Gutschriften | abweichender Belegtitel, Positionen fielen ganz durch |
| ein PDF setzt jedes Zeichen einzeln | Bezeichnungen zerfielen in Buchstaben |
| Fußzeilentext | rutschte in die letzte Position jeder Seite |

Das ist dieselbe Lehre wie bei den Hohlheitsprüfern: Ein Ergebnis, das
plausibel aussieht, ist kein geprüftes Ergebnis. Ohne die Summenprobe
wären vier Artikel mit falschen Preisen in die Kalkulation gegangen.

**Eine fünfte Falle wurde erst danach gefunden.** Acht Positionen
tragen die Preisbasis „per 1000" — der Listenpreis gilt je tausend
Einheiten. Wer sie übersieht, rechnet für einen Sack Klebespachtel
das Tausendfache. Die Summenprobe fängt das *nicht*, weil der
ausgewiesene Betrag stimmt; nur der Stückpreis ist um drei
Zehnerpotenzen daneben. Aufgefallen ist es beim Durchsehen der
Kalkulationsliste, weil eine Klebespachtelmasse dort dreistellig je
Kilogramm stand.

## Was für ein Sortiment das ist

Der Bürozubau war ein **Wärmedämmverbundsystem mit Kaminanlage**. Das
prägt den Katalog vollständig:

| Warengruppe | Artikel | Beispiele |
|---|---|---|
| **WDVS-Komponenten** | 11 | Capatect Klebe- und Spachtelmasse 186 M und 190 FEIN, Glasgewebe, Kantenschutz, Gewebeanschlussleiste, Universaldübel, Rondellen, Putzgrund, PrimaPor-Reibputz, Baumit TextilglasGitter |
| **Dämmplatten** | 9 | XPS glatt 30/50/80/100 mm, XPS rau GK 80, Fassaden-EPS 2/3/5 cm, Isover TDPT 20 |
| **Kaminsystem Schiedel/SIKM** | 9 | Mantelstein, gedämmtes Rohr 133 cm, Fertigfußpaket, Putztüranschluss, Zuluftplatte, Thermo-Trennstein, Regenhaube, Fugenmasse, Mantelsteinkleber |
| **Kanal und Erdbau** | 6 | PVC-Kanalrohr NW 100, Bögen 30°/45°, Abzweiger, Schachtring 800, Grundmauerschutz |
| **Zubehör und Kleinteile** | 7 | Soudal-Schäume und -Perimeterkleber, Dosierpistole, Abdeckklebeband, Rahmenschrauben, PAE-Folie |
| **Mörtel und Putze** | 3 | Baumit ThermoMörtel 50, Baumit KlebeSpachtel, Ravenit Vergussmörtel |
| **Mauerwerk** | 1 | Ökotherm HL N+F 10/50/23,8 cm |

**Das ist ein Fassadensortiment, kein Baustoffkatalog.** Die Weisung
nannte als Beispiel „wenn jemand Spachtelmasse sucht" — Spachtelmasse
ist tatsächlich dabei, gleich in vier Varianten. „Flexkleber" ist es
nicht; der Flexkleber, an dem `erste-echte-zahlen.md` rechnet, stammt
aus der einzelnen Quarzolith-Rechnung, nicht von Poschacher.

## Erste Korrektur: Die Nebenkosten sind kleiner als gedacht

`erste-echte-zahlen.md` schloss aus **einer** Rechnung, Logistik und
Nebenkosten machten „knapp ein Fünftel des Rechnungsbetrags" aus.
Über alle fünfzehn Belege sind es **6,6 %**.

Die eine Rechnung war nicht repräsentativ — sie war eine
Kleinstlieferung, bei der die Pauschalen naturgemäß durchschlagen. Die
Aussage bleibt richtig, dass eine Baustoffrechnung kein Katalog ist
(sieben von dreiundfünfzig Artikelnummern sind Paletten,
Kranentladung, Frachtpauschale, Energiekostenzuschlag, Folierung), aber
das Gewicht war um den Faktor drei überschätzt. **Aus einem Beleg auf
einen Betrieb zu schließen war der Fehler**, nicht das Rechnen.

## Der zentrale Befund: Der Einkaufsvorteil ist extrem ungleich verteilt

Hier liegt die eigentliche Erkenntnis, und sie entscheidet über den
Zuschnitt des Shops.

Der Lieferant weist zu fast jeder Position einen **Listenpreis und
einen Rabattsatz** aus. Damit lässt sich für jeden Artikel ausrechnen,
wo der Shoppreis bei 25 % Marge relativ zum Listenpreis des Lieferanten
landet — und der Listenpreis ist der beste verfügbare Näherungswert für
das, was ein Kunde anderswo zahlt.

| | Artikel |
|---|---|
| Shoppreis **unter** dem Listenpreis | **39** |
| Shoppreis **auf oder über** dem Listenpreis | 3 |
| nicht berechenbar (Nettopreis ohne ausgewiesene Liste) | 4 |

**Median: rund 27 % unter Liste.** Die Spanne reicht von 84 % darunter
bis 20 % darüber — und diese Spanne ist die eigentliche Nachricht.

Das Muster dahinter ist eindeutig:

> **Tief ist der Rabatt bei Massen- und Systemware:** Kanalrohre und
> Formteile, Grundmauerschutz, Folien, Dämmplatten, Kaminbauteile,
> Klebe- und Spachtelmassen. Hier trägt der Baumeistereinkauf mühelos
> eine Handelsspanne.
>
> **Dünn ist er bei Kleinteilen und Zubehör:** Dosierpistole,
> Pistolenschaum, Rahmenschrauben. Hier liegt der Einkauf so nah am
> Listenpreis, dass **jede Marge den Artikel über den Listenpreis
> hebt.**

### Das dreht eine frühere Empfehlung um

`rechnung-zum-zuschlag.md` empfahl als dritte Stellschraube einen
gestaffelten Zuschlag: „wenig auf schwere, preisverglichene Massenware,
mehr auf Kleinteile, wo niemand vergleicht". Das ist die Lehrbuchregel
des Handels — und sie geht hier nicht auf, weil sie eine Bedingung
voraussetzt, die nicht erfüllt ist: dass man Kleinteile günstig
einkauft.

Der Auftraggeber kauft Kleinteile **nicht** günstig ein. Er kauft sie
als Baumeister mit 10 bis 25 % Rabatt, weil sie in seinen Lieferungen
Beiwerk sind. Daraus folgt:

> **Kleinteile gehören nicht als Suchartikel in den Shop.** Nicht weil
> die Marge zu klein wäre, sondern weil es keine gibt. Wer einen
> Pistolenschaum zum Listenpreis anbietet, verliert den Preisvergleich
> gegen jeden, der ihn im Sortiment führt — und gewinnt auch bei einem
> Klickpreis von null nichts.
>
> Ihr Platz ist der **Beipack**: im Warenkorb sichtbar, wenn jemand
> Dämmplatten kauft, aber nicht in Anzeigen, nicht im Produktfeed,
> nicht als Landeseite.

Die revidierte Staffelung, an den echten Konditionen statt an der
Lehrbuchregel:

| Gruppe | Kondition | Rolle im Shop |
|---|---|---|
| Kanal, Folien, Grundmauerschutz | sehr tiefer Rabatt | **Preisargument** — hier ist auch mehr als 25 % Marge tragbar |
| Dämmplatten, WDVS, Kamin | tiefer Rabatt | **Tragende Mitte** — 25 % Marge und noch deutlich unter Liste |
| Mörtel, Putze | mittlerer Rabatt | 25 % Marge, knapp unter Liste — mitführen, nicht bewerben |
| Kleinteile, Zubehör | dünner Rabatt | **kein Suchartikel**, nur Beipack |

## Zweite Korrektur: Der Warenkorb ist kleiner als der Referenzwert

Alle Modellrechnungen laufen auf einem Referenzwarenkorb von 650 €
netto. Die echten Belege sagen dazu:

| | |
|---|---|
| Median-Positionsbetrag | 47 € |
| kleinster Beleg | 18,74 € (eine Position) |
| größter Beleg | 1.934,42 € (zwölf Positionen) |
| Belege über 400 € | 5 von 13 Rechnungen |

**Das war eine Baumeister-Belieferung, kein Shopgeschäft** — die
kleinen Belege sind Nachlieferungen an eine laufende Baustelle, die
großen sind die Erstanlieferungen. Für den Shop ist die Verteilung
trotzdem lehrreich: Die großen Belege bestehen aus **acht bis zwölf
Positionen**, nicht aus einer großen. Der Warenkorb von 650 €, den
Gate 20 und die Klickpreisrechnung voraussetzen, entsteht also
realistisch — aber nur über einen **gefüllten Warenkorb**, nicht über
einen teuren Einzelartikel.

Daraus folgt für die Oberfläche: **Systemvollständigkeit schlägt
Einzelpreis.** Wer Dämmplatten sucht, braucht Dübel, Gewebe,
Kantenschutz, Spachtelmasse und Putzgrund dazu. Ein Shop, der das
Vollständige anbietet, kommt über die 400-€-Schwelle; einer, der
Einzelartikel listet, nicht.

## Was die Daten nicht hergeben

Ehrlich benannt, damit niemand mehr hineinliest, als drinsteht:

- **Keine GTIN.** Die Rechnungen führen Lieferanten-Artikelnummern.
  Für Google Shopping und den Produktfeed fehlen die Artikelkennungen
  weiterhin; sie müssen beim Hersteller oder Lieferanten erfragt werden.
- **Vier Artikel ohne Listenpreis.** Sie wurden zum Nettopreis
  fakturiert (Projekt- oder Aktionspreis). Für sie ist der Abstand zum
  Markt nicht berechenbar. Dass es Nettopreise sind und keine
  ungerabatteten Listenpreise, ist belegt: Fassaden-EPS 5 cm kommt in
  beiden Formen vor — einmal mit Liste und Rabatt, einmal netto — und
  der Nettopreis ist in beiden Fällen auf den Cent derselbe.
- **Zwei Positionen weichen um je drei Cent** von
  `Menge × Preis × Rabatt` ab. Das stammt aus der Rechnung selbst
  (gerundet dargestellter Rabattsatz), nicht aus der Auslese; die
  ausgewiesenen Beträge summieren sich exakt.
- **Vier Zeichen je Seite blieben unauflösbar**, ausschließlich in der
  statischen Fußzeile (Ligaturen ohne ToUnicode-Eintrag). Keine
  Rechnungsdaten betroffen. Sie wurden als `<?>` markiert statt geraten
  — eine feste Ersetzungstabelle wäre Erfindung gewesen.
- **Vier Monate, eine Baustelle.** April bis August 2026. Was der
  Auftraggeber sonst noch einkauft, steht hier nicht drin.
- **Preise altern.** Die Listenpreise sind Stand der jeweiligen
  Rechnung; die Rabattsätze sind vertraglich und stabiler, aber nicht
  ewig. Vor der Veröffentlichung im Shop gehört jeder Preis bestätigt.

## Was jetzt zu tun ist

1. **Sortiment schneiden** nach der Tabelle oben: Kleinteile raus aus
   den Suchartikeln, Dämmung und WDVS in die Mitte, Kanal und Folien
   als Preisargument.
2. **Systempakete bilden** statt Einzelartikel — sie sind der Weg über
   die 400-€-Schwelle und zugleich der Inhalt, den KI-Systeme
   beantworten können („was brauche ich für 100 m² WDVS?").
3. **GTIN beschaffen.** Ohne sie kein Google-Shopping-Feed. Das ist
   eine Anfrage an Lieferant oder Hersteller — also eine E-Mail an
   Dritte und damit eine Freigabe des Auftraggebers.
4. **Quarzolith- und Pramer-Rechnungen** auf demselben Weg auslesen;
   die Werkzeuge dafür stehen jetzt.
5. **Preise bestätigen lassen**, bevor eine Zahl in den Shop geht.

## Die Werkzeuge

Drei Python-Skripte, die den Weg wiederholbar machen — sie liegen
außerhalb des Repositories, weil sie auf Postfach und Preisdaten
zugreifen: `entpacken.py` (PDFs aus der RAW-MIME-Nachricht),
`pdftext.py` (PDF → Text über die ToUnicode-CMaps), `positionen.py`
(Text → Positionstabelle mit Summenprobe).
