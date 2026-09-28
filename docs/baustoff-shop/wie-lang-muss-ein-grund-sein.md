# Wie lang muss ein Grund sein? Das Haus kannte fünf Antworten

**14. September 2026, mittags.** „Derselbe Name für einen anderen Vertrag ist
schlimmer als zwei Fassungen" steht seit dem 8. September in den Runden dieses
Hauses. Seither ist der Satz am 11., am 13. und zweimal am 14. September
**durch Zufall** wiedergefunden worden: fünfmal `findeChromium` in zwei
Fassungen, viermal `argZahl`/`wahl` in zwei Verträgen, fünfmal `abbruch` in
drei Verträgen. Jedes Mal hat ihn ein Werkzeug gefunden, das nach etwas
anderem suchte.

> **Ein Satz, der viermal durch Zufall wiedergefunden wird, gehört gemessen.**

Gemessen: **976 exportierte Namen, 31 davon in mehr als einem Modul.**

## Die drei, die keine Sprache waren

Nicht jede Doppelung ist ein Fehler. Ein Haus darf eine Sprache haben:
`registerbefund` heißt in vier Modulen dasselbe, weil es dasselbe tut. Drei
Gruppen waren aber keine Sprache, sondern eine Verwechslung.

### 1. „Wie lang muss ein Grund sein?" — fünf Antworten, zwei Namen

| Name | Wert | Module |
|---|---|---|
| `GRUND_MINDESTLAENGE` | 150 | `korbtext`, `weisungsstand`, `verweise`, `zahlenherkunft` |
| `GRUND_MINDESTLAENGE` | **120** | `gatestand`, `ungerufen` |
| `MINDESTGRUND` | **60** | `vorbehalt` |
| `MINDESTGRUND` | **40** | `warenkorbdeckung`, `llmsdeckung` |
| — gar nicht benannt | **80** | `allaussage`, `codedubletten`, `regelnamen`, `zwillingssaetze`, … |

Keine dieser Zahlen ist je entschieden worden. Sie sind entstanden — jede beim
Bau ihres Registers, jede aus dem Gefühl des Tages.

> **Fünf Antworten auf eine Frage sind keine Genauigkeit, sondern die
> Abwesenheit einer Entscheidung.**

Und das Satzregister hatte den Fall bereits **gedeckt**. Es führte den Satz
„Wie lang eine Begründung mindestens sein muss…" als begründete Wiederholung,
mit dieser Begründung:

> „Die Zahl selbst ist bewusst je Register verschieden … Ihn zu
> vereinheitlichen hieße, sieben verschiedene Zahlen unter einen Namen zu
> zwingen."

Das war nie gemessen worden. Es ist die Sorte Grund, die plausibel klingt und
den Fall vom Tisch nimmt.

### 2. `KOPFZEILEN` — fünf Bedeutungen, einmal keine Zahl

| Modul | Wert | meint |
|---|---|---|
| `gatestand`, `statuskopf`, `zwillingssaetze` | 6 | die ersten Zeilen eines Dokuments |
| `weisungsstand` | 14 | so weit reicht der Kopf eines Weisungsdokuments |
| `widerruf` | 15 | so weit gilt ein Kopfvermerk für das ganze Dokument |
| `serverkopf` | — | **eine Liste von HTTP-Kopfzeilen** |

> **Ein Name, unter dem einmal eine Zahl und einmal eine Liste steht, ist kein
> Name, sondern eine Verwechslung mit Anlauf.**

### 3. `ohneKommentare` — drei Fassungen, und eine löschte Code

Drei Ausfuhren, drei Verträge: der vollständige Scanner in
`src/entkommentieren.js` (`{ text, entfernt, zeichen }`), eine Fassung für
PHP-Dateien in `src/geschaeftszeit.js` und zwei reguläre Ausdrücke in
`src/zwillingszahlen.js`. Die letzte kannte weder Zeichenketten noch Muster:

```
/^shop\//        /https?:\/\//        fehlerpfad.replace(/^\//, '')
```

Überall, wo ein `//` in einem Muster steht, hat sie **echten Code gelöscht** —
gemessen in **20 von 252 Quelldateien**, darunter `src/codedubletten.js`,
`src/zwillingssaetze.js` und `src/zwillingszahlen.js` selbst, jeweils an dem
Ausdruck, mit dem sie Kommentare entfernen.

> **Ein Leser, der Code löscht, macht aus einem Fund ein Schweigen.**

Für `pruefe-zwillinge` heißt das: Jede Zahl in einem gelöschten Stück war nicht
vorhanden. Mit dem richtigen Scanner meldete er sofort eine Fundstelle mehr.
(Sie war harmlos — ein Zitat in einem Kommentar innerhalb eines
Vorlagenliterals, also Text. Der Satz ist umformuliert, die Zahl steht nicht
mehr darin.)

## Was entschieden wurde

**Ein Boden für einen Grund, zwei Werte, und der Unterschied benannt.**
`src/grundmass.js`:

* `GRUND_MINDESTLAENGE = 150` — für einen Grund, der eine **Ausnahme im
  Quelltext** trägt. Wer eine Regel aussetzt, muss sagen, warum sie dort nicht
  gilt, was stattdessen gilt und woran man merkt, dass der Grund abgelaufen
  ist. Das sind drei Sätze.
* `KURZGRUND_MINDESTLAENGE = 40` — für einen Grund, der eine **fachliche
  Zuordnung** festhält.

Gemessen wurde vorher, was **ein einziger** Wert kostet — und die erste Messung
war zu eng. Sie lief über die Prüfer und meldete genau einen roten
(`pruefe-koerbe`). Über die Testreihen lief sie nicht, und dort fiel ein
zweites Register um.

> **Eine Messung, die nur die Prüfer fragt, hat die Hälfte der Register nicht
> gesehen** — viele werden von ihrem Testfall gehalten und von keinem Prüfer.

Betroffen sind zwei Register mit zusammen zwölf Gründen zwischen 90 und 171
Zeichen. Und die sind gut:

> „Nur bei versenkter Setzung — die Systemliste sagt es in derselben Zeile, und
> ob versenkt gesetzt wird, entscheidet die Dübelbemessung und nicht der Korb."

Dieser Satz ist bei 148 Zeichen fertig.

> **Ein Boden, der zum Auffüllen zwingt, misst die Länge und nicht den
> Gedanken.**

## Der Prüfer

`npm run pruefe-namen` zählt die exportierten Namen und hält sie gegen ein
Register mit Begründungszwang, in **beide** Richtungen. Gemessen werden nur
**Ausfuhren**: Ein örtlicher Helfer darf in jeder Datei `lies` heißen — er
verlässt sie nicht. Ein exportierter Name ist ein Versprechen nach außen.

Die Gegenprobe nimmt ihm die Konstanten weg und lässt ihn nur Funktionen
lesen. Er meldet dann nicht zu wenig, sondern **gar nichts** — die Sperrklinke
fällt, und der Lauf liest sich wie ein Erfolg. Genau die schwersten Fälle
dieses Tages waren Konstanten.

## Stand

| | |
|---|---|
| exportierte Namen | 976 |
| in mehr als einem Modul | 31 → **25** |
| begründet | 3 |
| Sperrklinke `NAMEN_HOECHSTENS` | **25** |

Aufgelöst: `GRUND_MINDESTLAENGE`, `MINDESTGRUND`, `KOPFZEILEN`,
`ohneKommentare`. 55 Prüfer grün, 2 582 Testfälle, 300 Gegenproben, zwei davon
neu und rot gesehen.

## Was diese Runde nicht erreicht hat

25 Doppelnamen bleiben, darunter `ARTEN`, `SCHRITTE`, `ZAHLMUSTER` (drei
verschiedene reguläre Ausdrücke unter einem Namen) und `registerbefund` in
Modulen, die noch keinen Grund tragen. Der Prüfer nennt sie beim Namen; die
Sperrklinke zieht sie über die nächsten Runden herunter.

Offen bleibt auch die Frage nach den **Lesern** selbst. Dieses Haus hat jetzt
fünf Stellen, die Javascript-Quelltext lesen — der Scanner in
`entkommentieren.js`, die Zerlegung in `testzerlegung.js` und die
Muster-Leser in `zwillingssaetze.js`, `codedubletten.js` und
`regelnamen.js`. Zwei davon kennen reguläre Ausdrücke, drei nicht. Heute ist
einer der drei auf den Scanner umgestellt; die anderen beiden lesen weiter mit
Mustern, und niemand hat gemessen, was sie dabei übersehen.
