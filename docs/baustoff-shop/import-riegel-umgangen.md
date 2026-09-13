# Der Muster-Riegel war umgehbar — vier erfundene Preise wären „bestätigt" geworden

Stand: 2026-08-17. Zwölftes Audit der Serie „vom Verhalten zur Erklärung",
zweites in der Vortragsschicht: `bin/import.mjs`, das Werkzeug, mit dem am
Tag der ersten echten Preisliste der Katalog gefüllt wird.

## Der Befund, vorgeführt statt vermutet

Der Kommentar im Werkzeug verspricht einen Riegel: Beispieldateien tragen
erfundene Einkaufspreise; würden sie geschrieben, stünde `ekQuelle` auf
`bestaetigt`, die Sperre in `bestellung.js` fiele weg, und der Shop hielte
erfundene Konditionen für echte. Der Riegel prüfte dafür den übergebenen
Dateinamen auf `muster|beispiel|demo`.

Er prüfte aber **das Argument, nicht den Pfad**. Die Sonde:

```
cd beispiel && node ../bin/import.mjs bahnen-de preisliste-bahnen.csv --schreiben
```

Der übergebene Name enthielt keinen der drei Marker — das Verzeichnis
`beispiel/` stand nur im Arbeitsverzeichnis, nicht im Argument. Ergebnis
des Probelaufs (am gesicherten Katalog, danach zurückgesetzt):

```
Mit bestätigtem Einkaufspreis: 4 von 4
Geschrieben: data/artikel.json (11 Artikel insgesamt)
_datenstand: GEMISCHT — einzelne Artikel tragen bestätigte Einkaufspreise …
```

Vier erfundene Preise als bestätigt im Katalog, der Datenstand von
PLATZHALTER auf GEMISCHT — exakt der Zustand, den der Kommentar
ausschließt. Von dort wäre die Kette weitergelaufen:
`darfAutomatischAusgeloestWerden` prüft `ekQuelle`, nicht die Herkunft.
Zwölftes Audit, zehnter Befund, und wieder in die optimistische Richtung —
diesmal nicht als zu gute Zahl, sondern als zu gute **Datenqualität**.

## Die Korrektur, dreifach

1. **Der Riegel prüft den aufgelösten Pfad** (`resolve(datei)`), nicht das
   Argument. Ein relativer Name aus `beispiel/` heraus trägt das
   Verzeichnis damit immer im geprüften Text.
2. **Die Musterdatei heißt jetzt `preisliste-muster-bahnen.csv`** (vorher
   `preisliste-bahnen.csv`). Zweite Verteidigungslinie: Auch eine an einen
   markerfreien Ort kopierte Datei bleibt gesperrt, solange niemand
   zusätzlich den Namen ändert. Nichts im Repo referenzierte den alten
   Namen.
3. **Fehlende Preislisten geben eine Meldung statt eines Stacktraces**,
   Exit 2 wie die übrigen Aufruffehler — derselbe Befund wie tags zuvor
   beim Auswertungswerkzeug.

## Die Gegenprobe — und was sie über die Gegenprobe lehrte

Der erste Testschnitt prüfte den Riegel mit der umbenannten Musterdatei —
und die Mutation (Riegel zurück auf das rohe Argument) **fiel nicht auf**:
Der neue Dateiname trägt den Marker selbst, der Test hielt über die
falsche Verteidigungslinie. Der Test wurde geschärft: eine Kopie mit
markerfreiem Namen in einem als `beispiel-` markierten Wegwerfverzeichnis;
nur der aufgelöste Pfad enthält dann den Marker. Danach: Mutation → 5
Testfälle fallen (der Mutationslauf schrieb dabei selbst in den Katalog —
auch das eine Bestätigung, wie scharf die Sonde ist; der Katalog wurde aus
der Sicherung wiederhergestellt). Fehlerbehandlung entfernt → 1 fällt.

Drei neue Kindprozess-Testfälle insgesamt: Riegel am aufgelösten Pfad,
Marker im Dateinamen der ausgelieferten Musterdatei, Meldung statt
Stacktrace. Dazu die bestehende Zusicherung, dass der Probelauf erlaubt
bleibt und nichts schreibt. Testbestand: **415, alle grün, Prüfer ohne
Verdacht.**

## Einordnung in die Serie

Die beiden Werkzeug-Audits (gestern `auswerten`, heute `import`) tragen
dieselbe Lehre wie die zehn Modul-Audits davor, nur eine Schicht höher:
Die gefährlichen Fehler sind nicht die lauten, sondern die stillen — eine
weggelassene Zeile, ein Riegel, der nur das prüft, was man ihm hinhält.
Offen als nächster Prüfwinkel: `build-demo.mjs` und `bin/testpruefung.mjs`,
die beiden letzten Betreiberwerkzeuge ohne Verhaltensaudit.
