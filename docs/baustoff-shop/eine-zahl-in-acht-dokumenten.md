# Eine Zahl in acht Dokumenten wird in keinem gepflegt

**1. September 2026, sechste Runde.** Die Frage vom Ende der letzten Stunde war:
*Welche Zahl steht in mehr als einem Dokument — und rechnet sie irgendwer nach?*
Anlass war der nötige Monatsumsatz, der vier Tage lang mit der Kartenzahl in der
Akte stand, obwohl Gate 21 den Zahlweg entschieden hatte.

Nach der Berichtigung stand **45.356 € immer noch an achtundzwanzig Stellen.**
Die meisten zu Recht — `marge-25-prozent.md` rechnet ausdrücklich mit Karte, das
Gate-Register erzählt die Entscheidung. Aber ohne Werkzeug ließ sich das eine
nicht vom anderen trennen.

`npm run pruefe-leitzahlen` trennt es jetzt. Drei Einträge, 274 Dateien, und die
Regel ist nicht Gleichheit:

> **Eine abgelöste Zahl darf stehen — wenn ihre Bedingung danebensteht.**
> „45.356 € (Karte)" ist richtig. „45.356 €" allein ist es nicht mehr.

Aufgenommen wird eine Zahl erst, wenn sie **gerechnet** ist, in **mehr als einem
Dokument** steht und eine **Entscheidung trägt**. Ein Prüfer, der jede Ziffer als
Behauptung liest, meldet jede Artikelnummer.

## Der erste Lauf: 102 von 103 gedeckt

Die erste Fassung hatte eine gemeinsame Bedingung je Leitzahl —
`karte|skonto|20 %|alte|damals|stand|seit dem` — und deckte damit **102 von 103
Fundstellen**. Eine Meldung, und die war falsch.

> **Ein Prüfer, dessen Freibrief überall gilt, meldet grün und hat nichts
> angesehen.**

Die Bedingung gehört an den **abgelösten Wert**, nicht an die Leitzahl: „Karte"
rechtfertigt die 45.356, „Zuschlag" die 72.740, „Skonto" die 38.786. Die weichen
Wörter — *alte*, *damals*, *Stand* — sind draußen; sie stehen in jedem zweiten
Absatz dieser Akte. Eine Probe hält das fest: keine Bedingung darf auf einen
gewöhnlichen Satz anspringen.

Die eine falsche Meldung war „zwischen 60 und **70** Bestellungen". Eine Spanne
ist keine Angabe; `inSpanne()` nimmt sie aus.

Danach: **17 echte Meldungen in acht Dateien.** Alle bereinigt — die meisten
durch ein einziges Wort an der richtigen Stelle.

Zwei davon waren mehr als Kosmetik, weil es **Lieferstücke** sind:

- **`zuschlag-seite.html`** — die Seite, die die PR-Beschreibung als *gültig*
  bezeichnet, nachdem die veröffentlichte Fassung zurückgezogen wurde. Sie zeigt
  45.356 € / 70 als den Stand und sagt zweihundert Zeilen weiter unten in einer
  Fußnote „Zahlung per Karte". Zugleich steht mitten darin: *„Entschieden: EPS
  und Vorkasse ab Start."* **Die Seite entscheidet EPS und rechnet mit Karte.**
- **`naechste-schritte.html`** — dieselbe Zahlenpaarung im Fließtext.

## Zwei Gegenproben liefen ins Leere

Und das war der lehrreiche Teil.

**Erste Gegenprobe:** In `PARAMETER.md` die alte Zahl wieder eingesetzt. Der
Prüfer meldete **nichts** — direkt daneben steht meine eigene Berichtigung, und
die enthält das Wort „Kreditkarte". Die Bedingung war in Sichtweite, der Fund
galt als gedeckt.

> **Ein Freibrief in Sichtweite deckt auch den, der ihn nicht verdient.** Die
> Regel kann nicht unterscheiden, ob eine Zahl zitiert oder behauptet wird.

**Zweite Gegenprobe:** Beide gültigen Vorkommen durch die alte ersetzt. Wieder
nichts — die gültige Zahl stand weiter unten in der Berichtigung, und die neue
Regel verlangte nur ihre *Anwesenheit*.

> **Anwesend ist nicht dasselbe wie führend.** Wer ein Dokument aufschlägt, liest
> die erste Zahl, nicht die vollständigste.

Erst die dritte Fassung greift: In einem **Leitdokument** — `PARAMETER.md` und
`pr-beschreibung.md` — muss der gültige Wert vorkommen, **und zwar vor jedem
abgelösten**. Die dritte Gegenprobe meldet jetzt: *„Die abgelöste Zahl steht in
Zeile 19, die gültige erst in Zeile 106."*

Drei Anläufe für eine Gegenprobe, die anschlägt. Das ist der eigentliche Ertrag
dieser Stunde — nicht der Prüfer, sondern die zwei Fassungen davor, die grün
meldeten und nichts konnten.

## Was die neue Regel sofort fand

Die **0,77 % Kaufquote am Marktboden** — das erste der drei größten Risiken, die
Zahl, unter der das Modell nicht einmal den billigsten Klick trägt — kam in
**keinem der beiden Leitdokumente** vor. Weder in `PARAMETER.md` noch in der
PR-Beschreibung.

Sie steht an achtundzwanzig Stellen der Akte und stand in keinem der beiden
Dokumente, die jemand zuerst aufschlägt. Jetzt in beiden.

## Was der Prüfer nicht kann

- **Er kennt drei Zahlen.** Der Bezugswarenkorb von 650 €, der Deckungsbeitrag je
  Warengruppe und die Frachtpauschalen stehen ebenfalls mehrfach und sind nicht
  aufgenommen. Jede weitere kostet einen Eintrag mit gerechnetem Wert — und die
  Ehrlichkeit, ihre abgelösten Werte zu nennen.
- **Er misst nicht den Quelltext.** Dieselben Zahlen stehen dort als Testfälle und
  Registereinträge; ein Prüfer, der seine eigene Prüftabelle meldet, hat sich
  selbst gefunden.
- **Er trennt Zitat und Behauptung nicht.** Die Reihenfolgeregel gilt nur in den
  zwei Leitdokumenten. Überall sonst deckt eine Bedingung in Sichtweite alles,
  was in Sichtweite steht.

## Die Frage für den nächsten Lauf

Zwei Stunden lang war es *„welche Datei liest niemand"*, dann *„welche Zahl
rechnet niemand nach"*. Beide sind beantwortet und beide haben etwas gefunden.
Die nächste liegt eine Ebene tiefer:

> **Welche Gegenprobe habe ich für bestanden gehalten, ohne sie anschlagen zu
> sehen?**

Heute waren es zwei von drei. Beide sahen aus wie eine Bestätigung, und beide
waren keine.
