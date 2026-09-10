# Eine Stunde alt und schon nicht nachgezogen

**10. September 2026, achte Runde.** Die Runde davor hat den Satz in
`llms.txt` berichtigt: Technische Kennwerte werden **nicht** durchgehend beim
Hersteller verlinkt, sondern auf 24 von 46 Artikelseiten. Der Satz folgt jetzt
der Zahl.

Eine Stunde später stand derselbe Anspruch unberichtigt auf der Seite, die ihn
**aufstellt** — *„Wie dieser Shop seine Angaben prüft"*, die
Redaktionsprinzipien:

> *„Technische Kennwerte werden aus dem Datenblatt des Herstellers
> **übernommen und verlinkt** — nicht abgeschrieben, nicht aus dem Gedächtnis
> ergänzt."*

> **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle** — auch
> wenn beide Stellen denselben Satz tragen, beide von mir sind und eine Stunde
> auseinanderliegen.

## Der schwerere Teil: „übernommen"

Der Fehler ist größer als in `llms.txt`. Dort war der Verweis für die Hälfte
des Sortiments zu viel versprochen. Hier steht, die Werte würden **übernommen**
— und im Abschnitt „Was wir nicht tun" noch einmal: *„Wir verlinken sie und
**geben die Kennwerte wieder**."*

Gemessen über alle 82 gebauten Seiten: **keine einzige** trägt einen
Verbrauchswert, eine Schichtdicke oder eine Verarbeitungstemperatur.
Übernommen wird nichts, wiedergegeben nichts.

Und das Bemerkenswerte: **Die zweite Regel derselben Seite sagte es die ganze
Zeit richtig.**

> *„Zweitens: Eine Zahl ohne Herkunft ist keine Zahl. Verbrauchswerte,
> Schichtdicken und Verarbeitungsbedingungen stehen nur dann hier, wenn das
> zugehörige Merkblatt verlinkt ist. Fehlt der Beleg, fehlt der Wert — und die
> Seite sagt, dass er fehlt."*

Die Seite widersprach sich in ihrem eigenen Vorspann. Der Vorspann ist der
Teil, den ein Assistent zitiert und ein Leser überfliegt.

## Was der Prüfer selbst gefunden hat

Beim ersten Lauf der neuen Regel kam eine **zweite** Fundstelle heraus, von
der ich nichts wusste: `inhalte/gruppen/wdvs.md`, Abschnitt „Was hier nicht
steht" — *„Wir geben die Kennwerte wieder — wir schreiben die Richtlinie nicht
ab."* Auch berichtigt.

Zwei Seiten, dieselbe Zusage, keine davon eingelöst — und keine der beiden
wäre über die andere gefunden worden.

## Die Regel

> **Wer sagt, er gebe Kennwerte wieder, muss einen tragen.**

Solange keine Seite einen Verbrauchswert, eine Schichtdicke oder eine
Verarbeitungstemperatur führt, ist jede Übernahmebehauptung ein Befund. Sobald
eine Seite einen belegten Wert führt, schaltet sich die Regel **selbst ab** —
dann stimmt der Satz.

Die Verneinung bleibt still: *„Kennwerte werden **nicht** übernommen"* und
*„Technische Kennwerte schreiben wir **nicht** ab"* sind die richtige Auskunft
und stehen so auf denselben Seiten.

## Der Fehltreffer, der die Regel abgeschaltet hätte

Die erste Fassung von `KENNWERT` verlangte nur eine **Ziffer** in der Nähe des
Wortes. Damit zählte die Systemliste mit:

> „1 Klebemörtel · Fläche × **Verbrauch** je Auftragsart — **2** Dämmplatten …"

Eine Tabellenzelle mit einer Zeilennummer. Der Lauf meldete *„1 von 82 Seiten
tragen einen technischen Kennwert"* — und damit wäre die Übernahmebehauptung
**stillschweigend erlaubt** gewesen.

> **Ein Fehltreffer, der eine Regel abschaltet, ist teurer als einer, der
> meldet.**

Aufgefallen ist es nur, weil die Zahl in der Ausgabe steht und nicht stimmen
konnte. Verlangt wird jetzt eine Zahl **mit Einheit** — das, was einen
Kennwert ausmacht. Danach: 0 von 82, und die Regel greift.

## Und noch einmal ich selbst

Der Berichtigungsvermerk, den ich auf `wdvs.md` gesetzt habe, lautete zuerst
*„angekündigt war … — **versprochen** war die Wiedergabe"*. `pruefe-inhalte`
hat ihn gemeldet: „versprochen" steht seit heute Mittag im Register der
Erfolgszusagen, das ich selbst erweitert habe. Der fünfte Selbsttreffer an
diesem Tag, und jedes Mal derselbe Befund: **Der Apparat ist schneller als
seine eigene Bedienung.**

## Stand

- `src/merkblattverweis.js` — neu: `KENNWERT`, `kennwerteImBestand`,
  `UEBERNAHMEBEHAUPTUNGEN`, `uebernahmebefund`.
- `bin/inhaltspruefung.mjs` — die Regel läuft in beiden Betriebsarten, gegen
  die **gebauten** Seiten gemessen (ob ein Kennwert dasteht, entscheidet das
  Erzeugnis).
- Zwei Kundentexte berichtigt: `wissen/redaktionsprinzipien.md` (Vorspann,
  Kurzfassung, „Was wir nicht tun") und `gruppen/wdvs.md`.
- 4 neue Testfälle, 1 Gegenprobe
  (`uebernahme-ohne-einen-einzigen-kennwert`, angeschlagen).
- 2213 Testfälle, 153 Gegenproben, 48 Prüfer.
