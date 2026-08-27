# Woher die Zahlen kommen — und ob ein späterer Lauf sie wiederfindet

Stand: 2026-08-27. Der Auftrag verlangt, Fortschritt so zu sichern, dass
ein späterer Lauf nahtlos anknüpfen kann. Für den Rechenkern ist das
erfüllt: Er liegt im Verzeichnis. Für die **Zahlen** war es das nicht.

## Die Lücke

Der ganze Katalog — 46 Artikel mit bestätigten Preisen — steht und fällt
mit `preise/baustoff-preise.json`. Diese Datei ist von `.gitignore`
gedeckt und existiert **nur in diesem Container**, der nach einer
Ruhezeit eingezogen wird. Fällt sie weg, erzeugt `npm run website` einen
Shop ohne Preise.

Persistiert war bisher:

| | Stand |
|---|---|
| die Auslesekette (`werkzeuge/`) | im Verzeichnis, mit Fallenbeschreibung |
| das Verfahren (`katalog-aus-rechnungen.md`) | ausführlich beschrieben |
| **welche fünfzehn Nachrichten** | **nirgends** |

Ein späterer Lauf hätte das Werkzeug gehabt und die Anleitung — und
hätte raten müssen, worauf er es anwendet.

## Die Angabe, die gefehlt hat

```
from:fakturierung@poschacher.at subject:Rechnung
```

Diese Suche liefert **genau fünfzehn** Nachrichten, April bis August
2026 — dieselben fünfzehn, aus denen der Katalog entstanden ist. Heute
nachgeprüft, nicht erinnert.

| | |
|---|---|
| Absender | `fakturierung@poschacher.at` (Rechnungsversand, keine Person) |
| Empfänger | die Geschäftsadresse des Auftraggebers |
| Zeitraum | 22.04.2026 bis 17.08.2026 |
| Anzahl | 15 |
| Anhang | je eine PDF-Rechnung |

Der Weg von dort zur Preisdatei steht in `werkzeuge/README.md`:
`entpacken.py` (PDFs aus der RAW-MIME-Nachricht), `pdftext.py`,
`positionen.py` mit Summenprobe je Beleg.

**Damit ist die Kette vollständig.** Geht die Preisdatei verloren, ist
sie in einem Lauf wiederherstellbar, und die Summenprobe sagt, ob sie
richtig wiederhergestellt wurde.

> Eine Zutatenliste ohne Bezugsquelle ist kein Rezept. Das Verfahren war
> beschrieben, das Werkzeug lag bereit — und die eine Zeile, mit der man
> anfängt, stand nirgends.

Der Suchausdruck ist keine vertrauliche Angabe: Er nennt keine
Konditionen, sondern nur, wo die Belege liegen. Er gehört deshalb ins
Verzeichnis und nicht nach `preise/`.

## Der Fund nebenbei: ein dritter Lieferant mit Konditionenblatt

Dieselbe Suche im Postfach hat eine Nachricht zutage gefördert, die
nichts mit Rechnungen zu tun hat und mehr wert ist als sie:

> **„Baustoff-Einkaufskonditionen 2025"**, 27.02.2025, vom
> **Lagerhaus Eferding** — *„Sie erhalten hiermit Ihre aktuellen
> Baustoff-Einkaufskonditionen für 2025. Die angeführten Rabatte …"*
> (Nachrichtenkennung `195472d3f5406188`, Anhang rund 5,5 MB)

**Das ist die Sorte Dokument, die dem Vorhaben seit Wochen fehlt.** Der
Poschacher-Rabatt musste artikelgenau aus fünfzehn Rechnungen
zurückgerechnet werden, weil kein Konditionenblatt vorlag — die Spanne
von 10 bis 88 % über das Sortiment ist das Ergebnis dieser Rückrechnung.
Hier liegt eine **Rabattstaffel im Original**, für einen weiteren
Lieferanten.

Und es ist derselbe Adressat, den die Radon-Analyse als dreizehnten
Kandidaten geführt hat: das Lagerhaus.

### Was das ändern kann — und was noch offen ist

| | |
|---|---|
| Lieferanten mit bestätigten Konditionen | bisher **einer** (Poschacher, rückgerechnet) |
| Lieferanten mit Platzhalterkonditionen | drei (Radon-Modell) |
| **neu greifbar** | **Lagerhaus Eferding, Konditionenblatt 2025** |

Zwei Vorbehalte, bevor daraus eine Zahl wird:

1. **Das Blatt ist von Februar 2025**, also über anderthalb Jahre alt.
   Konditionen werden jährlich neu ausgehandelt; die Sätze für 2026
   können abweichen. Es ist ein **Anhaltspunkt**, kein Preisstand — und
   muss im Katalog auch so gekennzeichnet werden.
2. **Es sind fremde Konditionen.** Sie gehören nach `preise/`, nicht ins
   Verzeichnis — dieselbe Trennlinie wie bei Poschacher, und dieselbe
   Einschränkung: `.gitignore` schützt die Datei, nicht die Rechnung
   dahinter (`rekonstruierbare-einkaufspreise.md`).

**Die Auswertung ist Arbeit für den nächsten Lauf** und braucht
niemanden zu fragen: Die Nachricht liegt im Postfach des Auftraggebers,
das Werkzeug liegt im Verzeichnis, und die Kennung steht oben.

Was sie beantworten soll, steht schon fest — nach Gate-17-Prinzip vor dem
Ergebnis aufgeschrieben:

- Deckt die Staffel Warengruppen ab, die Poschacher **nicht** günstig
  führt? Dort läge der eigentliche Gewinn: Gate 22 hat drei Artikel zu
  Beipack erklärt, weil der Vorteil fehlte.
- Ist der Satz bei Dämmung, Kanal und Systemware **besser oder
  schlechter** als der zurückgerechnete Poschacher-Satz?
- Nennt das Blatt **Frachtbedingungen und Skonto**? Poschacher: 75,50 €
  je Lieferung ohne Frei-Haus-Schwelle, 3 % bei 14 Tagen. Ein zweiter
  Weg mit anderer Fracht verschiebt Gate 20 für kleine Warenkörbe.

Ein zweiter belegter Lieferant wäre auch der erste Schritt heraus aus
einer Abhängigkeit, die bisher nirgends als Risiko geführt wird: **Der
gesamte Katalog hängt an einem einzigen Bezugsweg.**

## Nachtrag 27.08.: die Kennungen der übrigen Belege

Damit ein späterer Lauf nicht wieder suchen muss, stehen die
Nachrichtenkennungen hier — sie nennen keine Konditionen, nur Fundorte:

| Beleg | Kennung |
|---|---|
| Konditionenblatt Lagerhaus Eferding 2025 | `195472d3f5406188` |
| Rechnung Schachermayer 9116667544 (11.08.2026) | `19ff445f3435d98c` |

Die Poschacher-Rechnungen findet man weiterhin über den Suchausdruck oben;
**heute erneut nachgezählt: genau fünfzehn**, keine mehr. Der Katalog
schöpft sie vollständig aus (53 Artikelnummern, davon 7 Nebenkosten, 46
Artikel).

Die Schachermayer-Rechnung ist ausgewertet und für den Katalog ergebnislos
— eine Position, Aluminium-Flachstangen, kein Baustoff. Was sie stattdessen
hergegeben hat, steht in
[`dritter-lieferant-schachermayer.md`](./dritter-lieferant-schachermayer.md).

## Was sonst noch im Postfach steht

Die Suche hat außerdem gezeigt, dass es **Angebote** von Poschacher gibt
(Verkaufsleitung, April 2026, zum Bürozubau) und Rechnungen eines
Bauunternehmens zum eigenen Bauvorhaben. Für den Katalog geben sie wenig
her — für die Frage nach dem Liefergebiet und den Lieferzeiten
womöglich mehr. Auch das ist Arbeit ohne Anfrage an Dritte.
