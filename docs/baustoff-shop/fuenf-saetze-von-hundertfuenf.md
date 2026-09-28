# Fünf Sätze von hundertfünf

**14. September 2026.**

## Der Anlass

`npm run pruefe-dubletten` meldet seit Wochen, wo die Gleichheit der
Artikelseiten sitzt. Der größte Block heißt „Lieferung": **93 von 124 Wörtern**
stehen auf jeder der 46 Seiten. Darunter stand ein Rat:

> *„Das ist eigener Text; keine Lieferantenliste macht ihn kürzer — **nur ein
> Absatz, der je Artikel etwas anderes sagt**."*

Der Kopf derselben Funktion erklärt, warum es sie gibt:

> *„Bis zum 5. September stand hier, was den Anteil senke, sei die Artikelliste
> des Lieferanten. Das war nie gemessen und ist falsch."*

Und daneben der Satz, der daraus folgte:

> **Eine Gesamtzahl sagt, wie viel gleich ist. Sie sagt nicht, wessen Gleichheit
> es ist — und damit auch nicht, wer sie ändern kann.**

Die Berichtigung vom 5. September hat die Zuschreibung je Abschnitt widerlegt —
und durch eine neue ersetzt, die genauso ungemessen war.

> **Dieselbe Zuschreibung, eine Ebene tiefer — und wieder nicht gemessen.**

## Die Messung

Gezählt wurde nicht in Wörtern, sondern in **Sätzen**: Welche Sätze stehen
wörtlich auf allen 46 Seiten?

| Abschnitt | Sätze insgesamt | auf jeder Seite |
|---|---|---|
| Kopf und Preistafel | 170 | **3** |
| **Lieferung** | **105** | **5** |
| Technische Kennwerte | 12 | 0 |
| Wofür dieser Artikel nicht gedacht ist | 12 | 0 |

Und die fünf im größten Block:

1. „Die Frachtsätze stehen unter **Lieferung**." — ein Verweis
2. „Warum die Fracht getrennt ausgewiesen wird … steht unter **Warum es keine Gratislieferung gibt**." — ein Verweis
3. „Die Fahrt kostet dasselbe, ob ein Sack draufsteht oder eine Palette …" — die Eigenschaft des Frachtmodells
4. „Der Mindestbestellwert beträgt 250,00 € netto … (Quelle, Stand)" — die Bedingung samt Beleg
5. „Wer mehrere Artikel desselben Lieferanten sammelt, erreicht die Grenze gemeinsam …" — die Regel dazu

Zwei Verweise und drei Bedingungen. Keine davon kann je Artikel etwas anderes
sagen, weil keine davon je Artikel etwas anderes **ist**.

> **Ein Satz, der eine Bedingung nennt, ist auf allen Seiten gleich, weil die
> Bedingung auf allen Seiten gilt.** Ihn in 46 Fassungen zu schreiben, sagt
> nichts Neues — es sagt dasselbe schlechter.

Der Anteil sänke durch einen **zweiten Lieferanten mit anderen Sätzen**, nicht
durch andere Worte. Das ist der Satz, nach dem jemand handeln kann.

## Was daraus wurde

Ein Urteil, das nur dasteht, ist am nächsten Tag eine Behauptung — genau wie
die beiden, die es ablöst.

> **Ein Satz über eine Messung, den niemand hält, ist die nächste ungemessene
> Zuschreibung.**

Deshalb steht jeder geteilte Satz jetzt in `GETEILTE_SAETZE` mit seinem Grund,
und `pruefe-dubletten` hält die Liste **in beide Richtungen**:

- Ein neuer Satz, der auf allen Seiten auftaucht, wird gemeldet. Er ist
  entweder eine Bedingung und gehört begründet — oder er ist Füllung und
  gehört weg.
- Ein Eintrag, dessen Satz verschwunden ist, wird ebenso gemeldet.

Geführt wird der **Anfang** des Satzes, nicht der ganze: Drei der fünf tragen
eine Zahl oder ein Datum aus den Daten, und die wandern.

### Die Liste hat sofort berichtigt, wer sie schreibt

Mein erster Entwurf trug sechs Einträge. Der Prüfer meldete in derselben
Minute vier Befunde: Ein Eintrag — „Preis netto …", aus dem Gedächtnis geraten
— traf keinen Satz, und **drei Sätze in „Kopf und Preistafel" hatten keinen
Eintrag**: die Erklärung des Preisstands und der zweiteilige Vorbehalt, dass
der ausgewiesene Preis keine Zusage ist.

> **Eine Liste, die in beide Richtungen gehalten wird, berichtigt den, der sie
> schreibt.**

## Und eine Berichtigung, die eine Stelle nicht erreicht hatte

Derselbe Schlussabsatz nannte die sechs Fassungen der „Technischen Kennwerte"
*„lauter Platzhaltersätze statt Kennwerten"*. Genau dieser Satz ist am
**13. September** im offenen Punkt `artikelliste` berichtigt worden — die
Fassungen sagen ausdrücklich, warum dort keine Kennwerte stehen, und verweisen
auf das Merkblatt des Herstellers.

Die Berichtigung erreichte den offenen Punkt. Den Prüfer, **aus dessen Zahl sie
stammte**, erreichte sie nicht.

> **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**

Zum wievielten Mal dieser Satz in diesem Bestand steht, ist selbst eine Angabe:
Er trägt Runden vom 8., 11., 13. und heute vom 14. September.

## Was geändert wurde

| Datei | was |
|---|---|
| `src/seitenaehnlichkeit.js` | neu: `gemeinsameSaetze()`, `saetzeVon()`, `GETEILTE_SAETZE` (8 Einträge), `geteiltebefund()` |
| `bin/dublettenpruefung.mjs` | druckt die geteilten Sätze aus, hält sie gegen die Liste; beide Schlusssätze berichtigt |
| `test/seitenaehnlichkeit.test.js` | vier Testfälle, beide Gegenrichtungen |

Eine Gegenprobe, rot gesehen: `ein-geteilter-satz-braucht-keinen-grund-mehr`.

## Offen

Die Sätze werden Zeichen für Zeichen verglichen. Zwei Sätze, die dasselbe
anders sagen, gelten damit als verschieden — und das ist hier die richtige
Härte: Genau solche Fassungen sollen sichtbar werden und nicht als Gleichheit
durchgehen. Für eine Seite, die einmal von mehreren Händen geschrieben wird,
wäre es die falsche; dann bräuchte es ein Maß für „dasselbe anders gesagt", und
das ist keine Zeichenkette mehr.
