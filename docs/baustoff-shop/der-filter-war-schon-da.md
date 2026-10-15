# Der Filter war schon da

*15. Oktober 2026, auf Weisung des Auftraggebers: „mach weiter mit filter und
sortierung". Gebaut war beides. Angeboten die Hälfte.*

---

## Was gemessen wurde, bevor etwas gebaut wurde

Heute früh habe ich dem Auftraggeber aus dem Gedächtnis geantwortet und lag
falsch — ein Werkzeug, von dem er wusste, hatte ich für nicht vorhanden
erklärt. Diesmal zuerst nachgesehen:

| | |
|---|---|
| `SORTIERUNGEN` in `src/shopkern.js` | 4: Bezeichnung A–Z, Preis auf, Preis ab, Preisvorteil zuerst |
| `filtere()` wertet aus | `gruppe`, `suchtauglich`, `ohneSperrgut`, **`preisAb`**, **`preisBis`** |
| `filterwerte()` gibt zurück | Gruppen, `mitSperrgut`, **`preisMin`**, **`preisMax`** |
| Die Filterleiste bot an | Warengruppe, Sortierung, „nur mit Preisvorteil", „ohne palettierte Ware" |

Die letzte Zeile ist kürzer als die beiden darüber. `filtere` nimmt eine
Preisspanne seit dem ersten Tag, `filterwerte` rechnet Minimum und Maximum
**nur für diese beiden Felder** aus, und der Zustand in `baueRasterfilter`
trug sogar ein `preisBis: null` mit. Alles war da außer dem Bedienelement.

> **Ein Filter, den der Kern kann und die Oberfläche nicht anbietet, ist kein
> Filter.**

Dieselbe Familie wie die acht Bestellfeldgründe vom 13. September, die
sorgfältig geschrieben im Modul lagen und nie einen Kunden erreichten. Der
Fehler ist nie die fehlende Fähigkeit, sondern die Fähigkeit, die niemand
durchreicht.

## Gebaut wurde zuerst der Prüfer

Nicht die Preisspanne, sondern `npm run pruefe-filter` — denn die eigentliche
Lücke war nicht das fehlende Feld, sondern dass es wochenlang unentdeckt
bleiben konnte. `src/filterangebot.js` führt jede Fähigkeit des Kerns und zu
jeder entweder ein Bedienelement oder einen Grund, warum sie nicht angeboten
wird. Gehalten wird das Register in **drei Richtungen**:

1. Was der Kern kann und das Register nicht kennt. Ein neues Filterfeld in
   `shopkern.js` fällt damit auf, bevor jemand eine Leiste baut.
2. Was im Register steht und der Kern nicht kann. **Der gefährlichere Fall:**
   Ein Bedienelement, das einen Zustand setzt, den `filtere` nie ansieht,
   grenzt nichts ein — und der Zähler daneben sagt trotzdem eine Zahl.
3. Was das Register anbietet und die Oberfläche nicht baut.

Der erste Lauf meldete genau das, was ich vermutet hatte — und damit war es
gemessen und nicht behauptet:

```
✗ preisAb  [bedienelement-fehlt]
✗ preisBis [bedienelement-fehlt]
```

Die Felder sind seit dem 15. Oktober gebaut, mit Platzhaltern aus
`filterwerte` und damit aus dem Bestand. Ein Platzhalter mit einer erfundenen
runden Zahl wäre eine Preisangabe, die kein Artikel trägt.

**Kein `type=number`.** Wer hier einen Preis eintippt, schreibt „12,50", und
ein Zahlenfeld des Browsers verwirft das Komma je nach Spracheinstellung des
Geräts stillschweigend. Gelesen werden Komma und Punkt; `inputmode` holt die
Zifferntastatur trotzdem hervor.

## Drei Wege, auf denen eine Spanne schweigen würde

Die Regel des Hauses dazu ist alt und gilt hier wörtlich: **Die Grenze darf
greifen, schweigen darf sie nicht.** Eine Preisspanne kann auf drei Wegen
Karten wegnehmen, und für den Kunden sehen alle drei gleich aus — es stehen
weniger da als vorher.

| Fall | Was ohne Satz passiert |
|---|---|
| Spanne verdreht („ab 400, bis 2") | Das Ergebnis ist leer, und der Kunde liest die Auskunft daneben als Aussage über das Sortiment |
| Eingabe keine Zahl | Es filtert **nichts** — wer „zwölf" tippt, sieht alle Artikel und hält seine Grenze für angelegt |
| Artikel ohne Preis | Jede Grenze nimmt sie mit, zu Recht (null ist nicht null Euro) — aber still |

Der dritte ist der Grund, dass der Satzbau **im Kern** steht und nicht in der
Oberfläche. Er tritt nur ein, wenn ein Artikel keinen Preis hat, und im
Katalog von heute haben alle 46 einen. In `shop-ui.js` wäre er toter Code mit
einem Satz darin, den niemand liest und niemand prüft — *nicht gefahren ist
nicht grün*. Als `preisspannensatz` in `src/shopkern.js` ist er eine Funktion
über vier Zahlen und in jedem Fall fahrbar: acht Tests, darunter der
Gleichstand („ab 10, bis 10" ist eine Spanne und kein Widerspruch — dieselbe
Falle, die `referenzwert-schon-bei-gleichstand` an der Messwertgrenze
festhält).

## Vier eigene Fehler, jeden fand ein anderer Prüfer

Der Teil, der zählt:

**Eine Gate-Nummer im ausgelieferten CSS.** Mein Stilkommentar erklärte die
neue Zeile mit „Gate 34" — und CSS-Kommentare werden mitgeliefert.
`findeInterna` brach den Bau an 46 Artikelseiten ab: *„Gate-Nummern sind die
interne Entscheidungsordnung. Für den Kunden sind sie eine Chiffre, für den
Wettbewerber eine Landkarte."*

> **Gebaut war die Falle in genau dem Kommentar, der erklärt, dass eine Grenze
> reden muss.** Die Klasse heißt deshalb `f-grenze` und nicht `f-gate34`: Ein
> Name, der eine Nummer trägt, liefert sie mit.

**Eine doppelte Konstante.** `GRUND_MINDESTLAENGE = 150` steht in
`src/grundmass.js`; ich habe sie aus Gewohnheit hingeschrieben, mit dem
Kommentar „dieselbe Zahl wie in den übrigen Registern". `pruefe-namen` hat die
Dublette in derselben Minute gemeldet — *ein Maß, das zweimal dasteht, sind
zwei Gelegenheiten, es unterschiedlich zu ändern.*

**Eine Zahl aus einer Fehlermeldung abgeschrieben.** `pruefe-codedubletten`
verlangte einen Grund für die gestaltgleiche Signatur von
`filterangebotbefund` und `zuordnungsbefund` und nannte dabei 55 Zeichen. Ich
habe die 55 eingetragen. Nach dem Entfernen der doppelten Konstante war die
Stelle 61 Zeichen lang, und der Prüfer meldete das Wachstum statt es
durchzulassen: *eine Zahl, die man aus einer Fehlermeldung abschreibt, ist
keine Messung.*

**Die Eingabe des Kunden roh in einen Satz gesetzt.** Der Satz zitiert, was
eingetippt wurde (`„zwölf" ist keine Zahl`), und das ist Fremdtext im engeren
Sinn. `test/aussentexte.test.js` verlangte den Eintrag ins Verzeichnis der
textbauenden Funktionen, `test/fremdtext.test.js` die Probe gegen vergifteten
Text — und die zeigte, dass `textZeile` fehlte. Ohne es machte ein Umbruch in
der Eingabe aus einem Satz zwei, genau wie am 15. September beim Rückwegsatz.
Gekürzt wird jetzt auch: Vierzig Zeichen reichen, um die eigene Eingabe
wiederzuerkennen, und der Satz steht in einer Leiste, die bei 390 px nicht
seitwärts rollen darf.

Dazu kam `test/ausgangsinterna.test.js` mit der dritten Richtung: Jeder
kundennahe Ausgang schickt seinen Text durch `findeInterna`. Wer den Namen des
Lieferanten in das Preisfeld tippt, bekommt ihn zitiert zurück — kein Leck, er
hat ihn selbst eingetippt, aber die Probe ist scharf und soll es bleiben.

## Was jetzt gemessen ist

| | |
|---|---|
| Prüfer | 58 → **59** (`pruefe-filter`) |
| Gegenproben | 317 → **319** |
| Tests | 2719 → **2726** |
| Browserszenarien `shopprobe` | 63 → **66** |
| Fähigkeiten, die in der Leiste ankommen | **10 von 10** |

Die zwei neuen Gegenproben, beide gefahren und beide angeschlagen:
`filter-ohne-bedienelement` nimmt das Preisfeld wieder heraus,
`preisgrenze-ohne-wort` schaltet den Satzbau ab und lässt das Filtern stehen —
so verschwinden die Karten weiterhin, nur eben wieder stillschweigend.

## Was als Nächstes möglich ist, ohne Freigabe

Aus der Liste, die dem Auftraggeber am 15. Oktober genannt wurde, bleiben:

- **Artikelvergleich.** Zwei oder drei Artikel nebeneinander, mit den Maßen,
  die der Katalog führt. Die Gruppenseiten haben seit dem 11. September eine
  Vergleichstafel; sie vergleicht die Artikel **einer** Gruppe.
- **Mehr Inhalt.** 17 Wissensseiten stehen, und jede beantwortet eine Frage,
  die auf der Baustelle gestellt wird.
- **Das Sortiment über 46 Artikel hinaus.** Weisung vom 28. August: mindestens
  100. Das hängt an der Preisliste des Lieferanten und damit am Auftraggeber —
  mit 46 Artikeln auf Preisen, deren Median über der eigenen Altersgrenze
  liegt, wäre mehr Oberfläche nicht mehr Shop, sondern mehr Oberfläche.
