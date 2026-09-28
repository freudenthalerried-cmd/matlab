# Eine Zahl, die zweierlei heißen kann, wird abgewiesen — jetzt wirklich

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Selbstaudit nach der bewährten Richtung: vom Verhalten zur Erklärung, diesmal
am Preislisten-Import — der Strecke, über die die **erste echte
Lieferantendatei** ins System kommt, sobald eine Antwort auf die Anschreiben
eintrifft.

## Der Fund

Der Kopf von `import.js` verspricht: „bewusst streng bei den Werten: **Was
nicht eindeutig ist, wird abgewiesen statt geraten.** Ein falsch geratener
Einkaufspreis fällt erst bei der Jahresabrechnung auf."

Das Verhalten: `zahl('1.234')` lieferte **1,234** — die englische Lesart. In
einer deutschen oder österreichischen Preisliste ist `1.234` aber die
Tausendergruppe für 1234. Eine Rolle Abdichtungsbahn zu 1.234,00 €, in der
CSV als `1.234` geschrieben, wäre still zum Einkaufspreis von **1,23 €** in
den Katalog gewandert — um den Faktor 1.000 geschrumpft, ohne Fehler, ohne
Warnung. Dasselbe spiegelverkehrt bei `1,234`. Das Muster ist mit einem
Trenner und genau drei Nachziffern **objektiv mehrdeutig**; die eigene
Kopfzeile verlangt für genau diesen Fall die Abweisung.

Fünftes Selbstaudit, fünfter Widerspruch zwischen Erklärung und Verhalten.
Dieser hier hätte nicht die Planung, sondern **echte Katalogdaten**
getroffen — am ersten Tag, an dem eine echte Preisliste eingelesen wird.

## Die Korrektur

`zahl()` weist das mehrdeutige Muster jetzt ab (`/^[1-9]\d{0,2}[.,]\d{3}$/`
→ „Zahl nicht lesbar", die Zeile scheitert am Import statt zu schrumpfen).
Die Grenzen sind bewusst gezogen:

| Eingabe | vorher | jetzt | warum |
|---|---|---|---|
| `1.234` / `1,234` / `12.345` | geraten (englisch) | **abgewiesen** | Tausendergruppe oder Dezimalzahl — nicht entscheidbar |
| `0,500` / `0.500` | 0,5 | 0,5 | eine Tausendergruppe beginnt nie mit einzelner Null — eindeutig |
| `1.234,56` / `1,234.56` | richtig | richtig | wer beide Trenner setzt, hat sich erklärt |
| `1234.567` | richtig | richtig | vier Vorziffern ohne Gruppierung — eindeutig englisch |

Die Musterpreisliste im Repo verwendet durchgehend eindeutige Schreibweisen
und ist von der Verschärfung unberührt.

## Geprüft

| | |
|---|---|
| neue Testfälle | 2 |
| Testfälle gesamt | 398, alle grün, 0 mit Verdacht |

Gegenprobe an der Prüfung: Riegel entfernt → **2 Testfälle fallen**, darunter
der End-zu-End-Fall, in dem eine Importzeile mit `1.234` als Preis scheitern
muss statt zu schrumpfen. Demo neu gebaut und headless geprüft.

## Kein Gate

Kein Gate ändert sich; alle Preise bleiben Platzhalter. Nichts gesendet,
nichts gekauft, keine Ausgabe. Für den Tag, an dem die erste echte
Preisliste kommt, gilt jetzt beides: Der Bogen kann jede Antwort lesen
(Gate 17), und der Import kann keine mehrdeutige Zahl mehr verschlucken.
