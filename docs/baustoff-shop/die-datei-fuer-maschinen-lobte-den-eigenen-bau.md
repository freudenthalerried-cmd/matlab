# Die Datei für Maschinen lobte den eigenen Bau

**10. September 2026, siebte Runde.** Sechs Runden am Prüfapparat, eine davon
mit negativem Ergebnis — Zeit, den Shop selbst anzusehen. Der Einstieg war die
Weisungsliste: sieben von acht Weisungen des Auftraggebers wirken, die achte
(Sortiment auf mindestens hundert Artikel) hängt an Daten des Lieferanten.
In ihrer Begründung stand eine gemessene Zahl, die auf etwas anderes zeigt.

## Der Fund

`llms.txt` ist die Datei, die dieser Shop für **Maschinen** schreibt — der
Kern der Weisung „für KI-Auffindbarkeit optimieren". Sie hat einen Abschnitt
*„Wie diese Seiten aufgebaut sind"* mit drei Sätzen über den eigenen Bau. Der
mittlere lautete:

> *„Technische Kennwerte werden nicht abgeschrieben, sondern beim Hersteller
> verlinkt."*

Gemessen an den gebauten Artikelseiten: **24 von 46 tragen den Verweis.** Auf
den übrigen **22** steht — offen und richtig —, dass kein Herstellermerkblatt
vorliegt und hier deshalb nichts steht statt einer erfundenen Kennwerttabelle.

Das ist eine gute Auskunft. Nur ist sie nicht die, die `llms.txt` ankündigt.
Ein Assistent, der die Datei liest und einem Bauleiter antwortet, zitiert den
Verweis für **alle** 46.

> **Eine Selbstbeschreibung ist eine Zusage wie jede andere — nur liest sie
> niemand nach, weil sie über den eigenen Bau spricht.**

Die anderen beiden Sätze desselben Abschnitts habe ich mitgemessen:

| Satz | Befund |
|---|---|
| „Preise tragen einen Preisstand und die Angabe netto oder brutto." | **stimmt** — 0 Ausnahmen auf 46 Artikelseiten |
| „Jede Seite beantwortet genau eine Frage; die Antwort steht in den ersten zwei Sätzen." | **nicht sauber messbar** — siehe unten |
| „Technische Kennwerte werden … beim Hersteller verlinkt." | **24 von 46** |

## Was ich ausdrücklich nicht gemessen habe

Der erste Satz — „jede Seite beantwortet genau eine Frage" — ließe sich
oberflächlich prüfen: Steht ein Fragezeichen im Kopf der Seite? Diese Messung
ergab **1 von 82** und ist Unsinn. Die Frage einer Artikelseite ist „was ist
das und was kostet es", und die steht dort beantwortet, ohne Fragezeichen. Ein
Befund daraus wäre eine Zahl aus einer schlechten Messung gewesen — dieselbe
Falle wie bei den 415 vermeintlichen Sätzen ohne Quelle am selben Vormittag.
Der Satz bleibt deshalb ungemessen und wird hier als ungemessen genannt.

## Die Abhilfe

Der Satz **folgt jetzt der Zahl**, wie `lieferungssatz` der Lieferantenzahl
und `abholungssatz` der Bestätigung des Lieferanten folgt:

- **alle Seiten mit Verweis** → der kurze Satz von früher, unverändert;
- **teils** → *„Auf 24 von 46 Artikelseiten steht der Verweis auf das Merkblatt
  des Herstellers; für die übrigen 22 liegt uns keine Adresse vor, und die
  Seite sagt das statt eine Kennwerttabelle zu erfinden."*;
- **keine** → der Satz nennt, dass für keinen Artikel eine Adresse vorliegt.

Kommen die Merkblattadressen — sie hängen an **Frage 1** an den Lieferanten,
die ohnehin gestellt ist —, wird der Satz von selbst wieder der kurze.
Niemand muss daran denken.

**Gemessen wird am Erzeugnis, nicht am Katalog.** Ob der Verweis auf der Seite
landet, hängt an der Marke in der Bezeichnung und an der bekannten Adresse —
zwei Schritte, die zwischen Katalog und Seite liegen. Ein Testfall zählt die
Verweise in den 46 gebauten Dateien und hält den Satz dagegen; ein Verweis
außerhalb des Abschnitts „Technische Kennwerte" zählt nicht mit.

## Stand

- `src/merkblattverweis.js` — neu: `merkblattsatz`, `merkblattdeckung`,
  `selbstbeschreibungsbefund`.
- `bin/website.mjs` — die Zeile in `llms.txt` ist abgeleitet statt geschrieben.
- 5 neue Testfälle, davon einer über die gebauten Seiten.
- 1 Gegenprobe (`selbstbeschreibung-fuer-alle-behauptet`, angeschlagen): Sie
  setzt den kurzen Satz zurück.
- 2209 Testfälle, 152 Gegenproben, 48 Prüfer.

**Was der Auftraggeber davon wissen muss:** Nichts zu tun. Die 22 fehlenden
Merkblattadressen sind Teil der ersten Frage an den Lieferanten, die seit dem
8. September auf der Liste steht.
