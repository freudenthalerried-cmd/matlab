# VBA-Makro Installation — Baustellen-Angebote-Sige-Gesamt 2026

Makro-Modul `BaustellenAngebote.bas` fuer die Datei
`E:\BauKG\Baustellen-Angebote-Sige-Gesamt 2026.xlsx`.

Behebt:

1. Einfuegen neuer Angebotszeilen verschiebt nur noch Spalten ab **I** —
   das Deckblatt in Spalten **A–H** bleibt unveraendert.
2. Datumsspalte **I** (`Suche`) wird einheitlich als `TT.MM.JJJJ`
   formatiert; `########`-Anzeigen durch zu schmale Spalte entfallen.

## Installation

1. Excel-Datei oeffnen.
2. `Alt+F11` druecken — VBA-Editor oeffnet sich.
3. Menue **Datei → Datei importieren…** → `BaustellenAngebote.bas` waehlen.
4. Menue **Datei → Speichern unter** → Dateityp
   **Excel Arbeitsmappe mit Makros (`*.xlsm`)**.
   (Die `.xlsx`-Version kann keine Makros speichern.)

## Bedienung

### Neue Angebotszeile einfuegen

- `Alt+F8` → `NeueAngebotszeileEinfuegen` → **Ausfuehren**.
- Dialog fragt nach Zeilennummer und Anzahl.
- Nur Spalten **I bis Ende** werden nach unten verschoben.
  Deckblatt (A–H) bleibt stehen.

Optional: Button anlegen
**Entwicklertools → Einfuegen → Schaltflaeche (Formular)** →
Makro `NeueAngebotszeileEinfuegen` zuweisen.

### Datumsformat reparieren

- Einmalig `Alt+F8` → `DatumsformatFixieren` → **Ausfuehren**.
- Wandelt Texte wie `14.04` oder `29.03` in echte Datumswerte um,
  formatiert die gesamte Spalte I als `TT.MM.JJJJ` und passt die Breite
  an (mind. 12).

## Konfiguration

Falls sich das Layout aendert, Konstanten am Anfang von
`BaustellenAngebote.bas` anpassen:

| Konstante          | Wert  | Bedeutung                                |
| ------------------ | ----- | ---------------------------------------- |
| `INSERT_START_COL` | `"I"` | erste Spalte, die verschoben wird        |
| `DATE_COL`         | `"I"` | Datumsspalte fuer Formatierung           |
| `HEADER_ROWS`      | `1`   | Kopfzeilen oberhalb der Datensatz-Zeilen |

## Hinweis zum Jahr

Bei unvollstaendigen Datumseingaben wie `14.04` verwendet das Makro
automatisch das **aktuelle Jahr** (`Year(Date)`). Voll ausgeschriebene
Daten (`02.03.2026`) werden unveraendert uebernommen.
