# Ein Apostroph kippte den Leser

**14. September 2026, nachts.** Die Runde davor hat gemessen, dass
`pruefe-saetze` über der Sekunde aus Gate 38 liegt, und die Zeit genau
verortet:

| Muster | Zeit | Treffer |
|---|---|---|
| Blockkommentare | 3 ms | 2 050 |
| Zeilenkommentare | 3 ms | 3 967 |
| **Zeichenketten** | **1 088 ms** | 18 146 |

Sie hat den Griff ausdrücklich nicht getan, weil die schnellere Fassung auch
**anders** liest — 24 636 statt 18 146 Zeichenketten —, und eine Änderung, die
beides tut, ist zwei Änderungen. Diese Runde tut beide und misst sie getrennt.

## Warum es anders liest

Das alte Muster lautete `` /(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g ``. Es ist für
den einfachen Fall richtig und für einen einzigen nicht: `(?!\1)[\s\S]`
erlaubt den **Zeilenumbruch**. Eine einfach begrenzte Zeichenkette darf in
Javascript über keine Zeile gehen — ein Apostroph in einem Kommentar aber
schon.

```
/* Ein Satz mit Apostroph: der's trägt. */
const a = 'eins';
const b = 'zwei';

altes Muster liest:  "s trägt. */\nconst a = "   und   ";\nconst b = "
neues Muster liest:  'eins'                      und   'zwei'
```

> **Ein Apostroph in einem Kommentar kippt den Leser für den Rest der Datei:
> Ab dort liest er Code als Text und Text als Zwischenraum.**

Gemessen über den Bestand: **182 von 249 Quelldateien** laufen zwischen den
beiden Mustern auseinander; 43 tragen einen Apostroph in einem
Blockkommentar. Von 13 197 gelesenen Sätzen waren **2 244 Kunstprodukte** —
Sätze mit `//` mitten drin, Sätze, die in einer Codezeile beginnen.

**Und der Prüfer war grün.** Nicht, weil nichts zu finden war, sondern weil
sein Filter gegen Codezeichen (`[{};=<>]`) die meisten Kunstprodukte
wegwarf. Er las falsch und meldete nichts.

> **Ein Leser, dessen Fehler der Filter dahinter aufräumt, sieht aus wie ein
> Leser, der richtig liest.**

## Was er nicht las

Die zweite Hälfte des Kippens ist die teurere: Was der Leser für Zwischenraum
hielt, waren die **Zeichenketten selbst**. Mit dem reparierten Leser steigen
die Wiederholungen von 27 auf **38** — elf Sätze, die seit dem 88. Lauf in
mehr als einer Datei standen und die kein Prüfer sehen konnte.

Neun davon sind behoben, keiner davon durch eine Ausnahme:

| Satz | stand in | jetzt |
|---|---|---|
| „ein Prüfer ohne Fundstellen meldet sauber über nichts" | 4 Prüfern | `OHNE_FUNDSTELLEN` in `src/prueferurteil.js` |
| „die Sonde ist nicht gelaufen — kein Marker in der Seite" | 3 Browserproben | `SONDE_STUMM` in `src/browsersuche.js` |
| „Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit." | 3 Werkzeugen | `VERALTET_SATZ` in `src/erzeugnisstand.js` |
| Muster-Riegel (Satz **und** Bedingung) | 2 Werkzeugen | `src/musterpfad.js` |
| `KATALOG_ZIEL`-Sperre (Satz **und** Bedingung) | 2 Werkzeugen | `src/katalogziele.js` |
| „preise/poschacher-positionen.csv fehlt …" | 2 Werkzeugen | `POSITIONSLISTE_FEHLT` in `src/gebinde.js` |
| „Entweder eine Datei angeben oder den Mailtext hereinleiten." | 2 Werkzeugen | `OHNE_ANFRAGETEXT` in `src/anfragelesen.js` |
| Absatz über den Bestellweg-Schalter | 2 Werkzeugen | Verweis auf den Kopf, der ihn trägt |
| Absatz „Der Lastwagen wäre ohne Kran gekommen …" | 2 Modulen | Verweis auf `VERRECHNET_UND_BESTELLT` |
| Satz über die leere Voreinstellung | 2 Prüfern | Verweis auf `OHNE_FUNDSTELLEN` |

## Ein Riegel, der schon auseinandergelaufen war

Der wertvollste der neun ist der Muster-Riegel. `bin/import.mjs` und
`bin/preisliste.mjs` weigern sich beide über einer Musterdatei, weil deren
Preise erfunden sind. Derselbe Riegel — und **nicht dasselbe Muster**:

```
bin/import.mjs      /muster|beispiel|demo/i
bin/preisliste.mjs  /muster|beispiel|demo|probe/i
```

Eine Datei mit `probe` im Pfad kam durch den einen und nicht durch den
anderen. Was hier durchrutscht, steht danach als **bestätigter**
Einkaufspreis im Katalog.

> **Zwei Fassungen eines Riegels sind kein Riegel, sondern ein Riegel und
> eine Lücke — und welche von beiden gerade greift, entscheidet, welches
> Werkzeug man genommen hat.**

Genommen wurde die strengere. `src/musterpfad.js` trägt beides: das Muster und
den Satz.

Dieselbe Bauart beim `KATALOG_ZIEL`-Paar: Beide Werkzeuge schreiben Katalog
**und** Einkaufspreise, und wer nur eines umlenkt, überschreibt die
vertrauliche Datei im Bestand. Diese Sperre stand am 30. August aus einem
Schaden heraus in beiden — jetzt steht sie in `src/katalogziele.js`.

## Und die Zeit

| | vorher | nachher |
|---|---|---|
| Zeichenkettenmuster | 1 088 ms | 9 ms |
| ganzer Befund | 1 239 ms | 211 ms |

`pruefe-saetze` liegt wieder unter der Sekunde aus Gate 38 — als Nebenfolge
der Reparatur, nicht als ihr Zweck.

## Stand

* Wiederholungen: 27 → 38 (repariert gemessen) → **26** (neun behoben)
* Sperrklinke `WIEDERHOLUNGEN_HOECHSTENS`: 27 → **26**
* Der Haken für `27` im Zahlenregister ist heraus — der Prüfer hat beide
  Richtungen gemeldet: erst `haken-ohne-zahl`, dann
  `haken-ausserhalb-des-bandes`
* 54 Prüfer grün, 2 575 Testfälle (2 572 grün, 3 übersprungen), 299 Gegenproben, eine davon neu und rot
  gesehen

## Was diese Runde nicht erreicht hat

26 Wiederholungen bleiben. Ein Teil davon ist die Bauart „ein Modul und sein
Prüfer tragen denselben Absatz **nicht** im Kopf" — die Ausnahme für
Leitfragen greift nur in den ersten sechs Zeilen, und das bleibt so: Sie zu
weiten hieße, genau die kopierten Absätze zu decken, für die es diesen Prüfer
gibt.

Offen bleibt auch die Frage, ob der Satzleser noch weitere Stellen falsch
liest. Geprüft ist jetzt der Apostroph und das mehrzeilige
Schrägstrichliteral; ein regulärer Ausdruck im Quelltext (`/'[^']*'/`) trägt
Anführungszeichen, die keine sind, und niemand hat nachgesehen, was der Leser
daraus macht.
