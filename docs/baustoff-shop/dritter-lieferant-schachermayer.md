# Ein dritter Lieferant, ein Artikel — und drei Zahlen, die etwas wert sind

Stand: 2026-08-27. Der Auftraggeber hat „viel mehr" Artikel verlangt. Der
Lauf davor hat nachgezählt und gezeigt, dass die fünfzehn
Poschacher-Rechnungen ausgereizt sind: 53 Artikelnummern, davon sieben
Nebenkosten, 46 im Katalog. Dieselbe Postfachsuche hat aber einen
**dritten Lieferanten mit einer Rechnung** zutage gefördert:
**Schachermayer**, Rechnung 9116667544 vom 11.08.2026.

Diese Runde hat sie ausgelesen. Das Ergebnis für den Katalog ist
**negativ**, und drei Nebenbefunde sind mehr wert als das, was gesucht
wurde.

## Was drinsteht: eine einzige Position

| | |
|---|---|
| Pos. 10 | **Alu Flachstangen AlMgSi0,5 F22, EN AW 6060 T66, 15 × 3 mm** |
| Menge | 4,5 kg zu 11,62 €/kg |
| Nettobetrag | 52,29 € |
| Kommission | „BÜROZUBAU" |

**Das ist kein Baustoff für diesen Shop.** Aluminium-Flachstangen gehören
in keine der sieben Warengruppen; sie sind Metallhalbzeug für den eigenen
Bürozubau. Ein Artikel, und der falsche.

> **Ein Lieferant ist nicht dasselbe wie ein Sortiment.** Schachermayer
> führt Beschlag, Werkzeug und Metall — ein großes Haus, aber neben dem
> Sortiment dieses Shops. Eine Rechnung beweist eine Geschäftsbeziehung,
> keinen Katalog.

Damit bleibt es bei **46 Artikeln**. Der Weg zu „viel mehr" führt
weiterhin über eine Artikelpreisliste des Baustofflieferanten, und die
setzt eine E-Mail voraus.

## Der erste Nebenbefund: 2 % sind nicht 3 %

Auf der Rechnung steht:

> **Zahlungsbedingungen: 14 Tage 2 % / 30 Tage netto**

Das Gate-Register sagte bis heute: *„Beide bekannten Lieferanten geben
3 % Skonto bei 14 Tagen."* Das stimmt für Poschacher und Pramer. Hier
steht ein dritter mit **2 %**.

| Lieferant | Skonto | Frist |
|---|---|---|
| Poschacher | 3 % | 14 Tage |
| Pramer | 3 % | 14 Tage |
| **Schachermayer** | **2 %** | **14 Tage** |

**Gate 21 bleibt unberührt** — es prüft die *Frist*, und die ist bei allen
dreien 14 Tage. Berührt ist die **Rechnung** dahinter: Die 3 % heben die
Rohmarge von 25 auf 27,25 %; 2 % heben sie nur auf 26,5 %. Solange der
Katalog aus einer Quelle kommt, ist das gegenstandslos. Sobald eine zweite
dazukäme, wäre das Skonto artikelabhängig und nicht mehr eine Zahl im
Modell.

> Die 3 % waren nie eine Branchenkonstante — sie waren zweimal dasselbe
> Ergebnis. Der Unterschied fällt erst auf, wenn ein dritter dazukommt.

Der Eintrag im Gate-Register ist entsprechend präzisiert: nicht widerrufen,
sondern eingegrenzt auf die beiden **Baustoff**lieferanten.

## Der zweite Nebenbefund: Fracht 17,90 €

| | Fracht |
|---|---|
| Poschacher | **75,50 €** je Lieferung, keine Frei-Haus-Schwelle |
| Lagerhaus Eferding | **41,66 €** Kleintransporter (gestaffelt) |
| Schachermayer | **17,90 €** auf dieser Rechnung |

**Diese drei Zahlen darf man nicht nebeneinanderstellen, ohne dazuzusagen,
was sie sind.** Poschachers 75,50 € gelten für palettierte Baustoffe mit
LKW und Kranentladung. Die 17,90 € hier stehen auf einer Lieferung von
4,5 Kilogramm Flachstangen — das ist ein Paket, kein Baustofftransport.

Der Vergleich taugt trotzdem für eine Aussage, und zwar für eine, die der
Shop schon macht: **Fracht ist kein Fixum der Branche, sondern eine
Eigenschaft der Ware.** Genau das steht auf
`wissen/warum-keine-gratislieferung` — jetzt mit einem dritten Beleg.

## Der dritte Nebenbefund: die Anschrift bestätigt Perg

Der Rechnungskopf lautet:

> Freudenthaler Bau GmbH, Marwach 5, **4312 RIED IN DER RIEDMARK**

Das ist eine **unabhängige Bestätigung** des Befunds aus `zwei-ried.md` —
diesmal nicht aus dem Firmenbuch und nicht aus `betreiber.json`, sondern
aus der Adressdatei eines Dritten, der Rechnungen dorthin schickt. Der
Irrtum „Ried im Innkreis" hätte sich elf Tage früher auflösen lassen, wenn
jemand eine Fremdrechnung angesehen hätte.

## Was die Auslesekette dabei über sich selbst gezeigt hat

Die drei Werkzeuge in `werkzeuge/` sind für Poschacher gebaut. Am fremden
Rechnungslayout getestet:

| Schritt | am fremden Layout |
|---|---|
| `entpacken.py` (MIME → PDF) | **läuft** |
| `pdftext.py` (PDF → Text mit Koordinaten) | **läuft**, sauber lesbar auf Anhieb |
| `positionen.py` (Text → CSV) | **läuft nicht** — feste X-Bereiche für Poschachers Spalten |

**Zwei Drittel der Kette sind allgemein, ein Drittel ist lieferantenfest.**
Das ist die richtige Aufteilung und keine Schwäche: Ein Rechnungslayout zu
parsen heißt, dieses Layout zu kennen. Für eine einzelne Position lohnt
kein zweiter Parser; bei einer Preisliste sähe es anders aus.

Behoben wurde dabei eine echte Falle in `entpacken.py`: Es suchte
ausschließlich nach Dateien namens `mcp-Gmail-get_message-*.txt`. Eine von
Hand danebengelegte Datei ergab kommentarlos **„neue PDFs: 0"** — ein
stiller Nullfund, dieselbe Sorte Fehler wie der `/Type/Page`-Nullfund vom
25. August. Jetzt wird jede `.txt` und `.json` im Ordner probiert, und ein
leerer Ordner meldet sich.

## Was daraus folgt

| | |
|---|---|
| Katalog | unverändert **46 Artikel** — Schachermayer liefert keinen davon |
| Gate 21 | unverändert gültig, Begründung präzisiert (2 % beim dritten Lieferanten) |
| Lieferanten mit belegten Konditionen | **drei** statt zwei, aber nur zwei mit Baustoffen |
| offen | die Artikelpreisliste — eine E-Mail, freigabepflichtig |

**Der Lauf hat gefunden, wonach er nicht gesucht hat, und nicht gefunden,
wonach er gesucht hat.** Das ist der Normalfall bei einer Postfachsuche
und der Grund, sie trotzdem zu machen: Der negative Befund ist eine
Antwort, und die drei Nebenzahlen stehen jetzt fest statt als Annahme.
