# Werkzeuge: von der Lieferantenrechnung zum Katalog

Drei Python-Skripte, die aus PDF-Rechnungen eine Positionstabelle machen.
Sie sind der Grund, warum es überhaupt einen echten Katalog gibt
(`docs/baustoff-shop/katalog-aus-rechnungen.md`).

## Warum Python, wenn das Projekt sonst Node ohne Fremdpakete ist

Weil die Aufgabe eine andere ist. Der Shop rechnet; diese Skripte lesen
ein Binärformat. Sie kommen ebenfalls ohne Fremdpakete aus — kein pypdf,
kein poppler, beides war in der Umgebung nicht installierbar. Was sie
brauchen, steht in der Standardbibliothek: `zlib`, `re`, `email`,
`base64`.

Sie laufen nicht im Testlauf des Shops mit und sind kein Teil des
Bündels. Sie liegen hier, weil sie sonst nur in einem flüchtigen
Container existierten und beim nächsten Lauf neu geschrieben werden
müssten.

## Die Kette

```
entpacken.py    Gmail-RAW-Nachricht  →  PDF-Dateien
pdftext.py      PDF                  →  layouterhaltender Text
positionen.py   Text                 →  Positionstabelle (CSV) + Summenprobe
```

### entpacken.py

Das Gmail-Werkzeug gibt Anhänge nicht als Datei heraus. Über
`messageFormat: RAW` kommt die vollständige MIME-Nachricht; große
Antworten legt die Umgebung als JSON-Datei ab.

```
GMAIL_ROHDATEN=<ordner mit den JSON-Dateien> PDF_ZIEL=<zielordner> \
    python3 entpacken.py
```

Beide Pfade sind maschinenspezifisch und stehen deshalb in
Umgebungsvariablen, nicht im Quelltext.

### pdftext.py

```
python3 pdftext.py rechnung.pdf [ausgabe.txt]
```

Liest Objekte auch aus komprimierten Objektströmen (`/ObjStm`), löst die
`/ToUnicode`-CMaps der Subset-Fonts auf und führt die Textmatrix mit, um
Spalten zu erhalten. Ohne das kommt Binärmüll heraus — die Klammer-
Literale sind reine Glyphindizes des Subsets.

### positionen.py

```
python3 positionen.py <ordner mit .txt> <ausgabe.csv>
```

Erzeugt Zeilen mit `Rechnung;Datum;Pos;ArtNr;Bezeichnung;Menge;Einheit;
Einzelpreis;Preisbasis;RabattProzent;Betrag;Belegart` und prüft je Beleg:
**Die Summe der Positionsbeträge muss dem ausgewiesenen Nettowarenwert
entsprechen.** Diese Regel stand vor dem Ergebnis fest und hat vier echte
Parserfehler gefunden.

## Zwei Fallen, die schon zugeschnappt haben

**„per 1000".** Manche Positionen weisen den Listenpreis je tausend
Einheiten aus. Wer das übersieht, rechnet den Stückpreis um drei
Zehnerpotenzen falsch — und die Summenprobe merkt es **nicht**, weil der
ausgewiesene Betrag stimmt. Nur der Stückpreis ist daneben.

**Leerraum im Seitenobjekt.** Ein Erzeuger schreibt `/Type/Page`, ein
anderer `/Type /Page`. Eine Suche nach der Zeichenfolge ohne Leerzeichen
fand bei Pramer null Seiten und schrieb eine **leere Datei ohne
Fehlermeldung** — schlimmer als ein Absturz. Der Seitenfinder arbeitet
deshalb mit `/Type\s*/Page(?![a-zA-Z])`; der Lookahead hält den
Seitenbaum `/Type/Pages` heraus.

## Vertraulichkeit

Die Skripte sind harmlos, ihre Ausgabe ist es nicht. Positionstabellen
mit Einkaufspreisen und Rabattsätzen gehören nach `preise/` — dieses
Verzeichnis ist von `.gitignore` gedeckt, solange das Repository
öffentlich ist.
