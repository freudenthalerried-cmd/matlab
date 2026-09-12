# Ein Wächter und eine Auskunft

**12. September 2026. Runde 53.**

## Der Fund

Die Karte des Betriebs führt den Abzweig „das Angebot verfällt" seit dem
11. September **ohne Werkzeug**, und der Grund daneben lautet:

> *Der Ablauf einer Frist ist kein Ereignis im Rechner, sondern das Ausbleiben
> eines Ereignisses. Ein Werkzeug müsste täglich über die Ablage laufen und
> Datum für Datum vergleichen; nichts in diesem Haus läuft täglich.*

Der Satz stimmt. Nur trifft er einen **Wächter**, der von selbst anschlägt —
und nicht die **Auskunft**:

> **Wer die Akte aufschlägt, fragt genau das: Bindet dieses Angebot noch?**

Das ist keine Feinheit. Nimmt der Kunde am zwanzigsten Tag an, entsteht kein
Vertrag zum Preis von damals (§ 862 ABGB); die Bindefrist von vierzehn Tagen
steht auf jedem Angebot. Wer sie nicht nachrechnet, liefert zum alten Preis und
trägt die Differenz selbst — und Baustoffpreise bewegen sich.

Dieselbe Unterscheidung wie zweimal an diesem Tag: Bei der
Lieferantenbestellung war der Grund „das **Absenden** fehlt", und das war kein
Grund, kein Werkzeug zu haben. Hier ist es „ein **Wächter** fehlt".

## Was `npm run akte` jetzt sagt

```
  Vorgang 2026-0140 — 1 Eintrag/Einträge, Journal 2026
      1. 2026-08-20  angebot                AN-2026-0140         120,00 €
         Beleg: AN-2026-0140.txt (11 Zeichen)
         Bindefrist: bis 2026-09-03 — VERFALLEN seit 9 Tag(en)

Angebote: 1 binden noch, 1 verfallen (Stand 2026-09-12).
```

| | |
| --- | --- |
| Gerechnet wird | in Kalendertagen ab dem Angebotsdatum, wie es auf dem Papier steht |
| Der letzte Tag | zählt mit — am vierzehnten bindet es noch |
| Ohne lesbares Datum | *„aus diesem Zeitpunkt nicht zu rechnen"* — unbekannt ist nicht „gültig" |
| Die Frist selbst | kommt aus dem eingefrorenen Paar `BINDEFRIST` (14 Tage, Stand 6.9.), nicht aus einer Zahl daneben |

## Was unverändert gilt

**Das Ereignis bleibt aus.** Niemand wird benachrichtigt, nichts läuft täglich,
und die Folge des Ablaufs ist eine Entscheidung des Betreibers — neu rechnen
oder ziehen lassen. Geändert hat sich nur, dass er sie **treffen kann**, statt
sie zu übersehen.

## Die Richtung, in die der Fehler gehen darf

Die Gegenprobe dieser Runde lässt jedes Angebot als bindend erscheinen.

> **Ein Angebot fälschlich für verfallen zu halten kostet eine Rückfrage.
> Umgekehrt kostet es Geld.**

Deshalb steht die Zusicherung auf der Seite des Verfalls: Wer in der Akte
„bindet noch" liest, muss sich darauf verlassen können.

## Ausgang

| | |
| --- | --- |
| Abzweige ohne Werkzeug | 2 → **1** (`kann-nicht-geliefert-werden`, und dort fehlt die Regel) |
| `bindefrist()` | neu in `src/beleg.js`, vier Fälle geprüft |
| Testfälle | 2.409 |
| Gegenproben | 219 → **220** |

---

**Die Regel dieser Runde:** *Ein Grund, der gegen einen Wächter spricht,
spricht nicht gegen eine Auskunft — und die Frage stellt sich beim Aufschlagen
der Akte von selbst.*
