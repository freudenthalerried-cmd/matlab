# Dreiundzwanzig gemeldete Stellen, dreiundzwanzig abgearbeitet

**28. August 2026.** `npm run pruefe-tests` meldete seit Tagen **23
Verdachtsfälle** und lief in jedem Statusbericht als „grün" mit. Er war nicht
grün. Er wurde nicht gelesen.

> **Ein Prüfer, dessen Meldungen niemand abarbeitet, ist teurer als keiner:**
> Er erzeugt das Gefühl, geprüft zu haben.

## Zuerst der Prüfer selbst: zwei Fehlalarme

Zwei Testfälle galten als „behauptet nichts — kein einziges assert", obwohl
sie zusammen zwölf Zusicherungen tragen. Ursache: `node:test` erlaubt
`test(name, options, fn)`, und der Prüfer nahm die **erste** geschweifte
Klammer nach dem Namen als Rumpf — also `{ skip: … }`.

Wer diesen Fehlalarm einmal abhakt, hakt beim nächsten Mal auch den echten
Treffer ab. Behoben: Ein Optionsobjekt wird übersprungen, der Rumpf ist die
Funktion. In der Probedatei steht die Schreibweise jetzt als eigener Fall;
mit der alten Fassung fällt die Selbstprobe um.

## Dann der echte Fund: ein Test, der nie gelaufen ist

`Die gemeldete Zeile trifft die echte Datei` prüfte, ob jede gemeldete
Zeilennummer im Text aufzuschlagen ist — an `kaminzug-aufbau.md`, einer Seite
**ohne einen einzigen Treffer**. Die Schleife lief null Mal. Der Test bestand
seit Tagen, ohne je eine Zeilennummer nachgeschlagen zu haben — genau die
Hohlheit, gegen die er geschrieben wurde.

Jetzt prüft er an der Probedatei, die absichtlich fehlerhafte Absätze trägt,
mit `assert.ok(treffer.length >= 3)` davor.

## Und dann die zwanzig Schleifen

Zwanzig Schleifen liefen über Listen aus dem Bestand — Katalog, Bezirke,
Zahlwege, Inhaltsseiten, Quellenregister —, ohne dass davor stand, wie lang
die Liste sein muss. Bei leerer Liste hätte jede davon **fehlerfrei nichts**
geprüft.

Jede trägt jetzt die Zahl, die sie erwartet: 46 Artikel, 7 Warengruppen, 5
Bezirke, 24 Inhaltsseiten, 30 Kundenwörter, 8 Quellen. Das ist kein
Formalismus, sondern eine zweite Wirkung: **Die Tests sagen jetzt, wie groß
der Bestand ist.** Wer eine Warengruppe entfernt, fällt auf.

Zwei Fälle sind begründet abgelehnt statt zugesichert — beide, weil die
gemeldete Schleife legitim leer sein darf (ein Bauteil ohne fremde Lage; ein
leerer Zahlwegtopf). Die Begründung steht im Testfall, wie es das Werkzeug
verlangt.

## Die Gegenprobe, zweiseitig

Mit **leerem Katalog**:

| | alte Fassung | neue Fassung |
|---|---|---|
| `Sperrgut ist als Einschätzung gekennzeichnet` | **besteht** | **fällt** |

Genau das ist der Unterschied zwischen einem Test und einem Ritual.

## Stand

- **`pruefe-tests`: 728 Testfälle, 0 mit Verdacht** (vorher 23)
- 729 Tests grün, `pruefe-inhalte` 24/355/0, `pruefe-seiten` 57/216/0
- `pruefe-widerrufe` 133 Dateien/48 Fundstellen, `pruefe-pruefer` 6, alle
  sauber

## Was das über die anderen Prüfer sagt

Die Meldungen standen offen da, in einem Werkzeug, das in jedem Bericht
genannt wurde. Niemand hat sie gelesen — ich eingeschlossen, über mehrere
Läufe hinweg, während ich in denselben Läufen neue Prüfer gebaut habe.

**Ein neuer Prüfer ist billiger als das Abarbeiten des alten, und er fühlt
sich nach mehr an.** Deshalb steht das hier: Vor dem nächsten neuen Werkzeug
gehört die Ausgabe der vorhandenen gelesen.
