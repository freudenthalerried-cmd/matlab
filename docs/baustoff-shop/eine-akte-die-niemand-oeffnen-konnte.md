# Eine Akte, die niemand öffnen konnte

**12. September 2026. Runde 48.**

## Der Fund

Seit heute früh gehen alle fünf Papiere eines Geschäftsfalls in die Akte:
Angebot, Auftragsbestätigung, Rechnung, Absage, Lieferantenbestellung. Damit
gibt es zum ersten Mal etwas zu lesen — **und es gab keinen Weg, es zu lesen.**

> **§ 131 Abs 1 Z 5 BAO verlangt, dass zu jedem Geschäftsfall ein Beleg gehört
> und rückführbar bleibt. Rückführbar heißt: Jemand muss ihn finden.**

Ein Journal aus JSONL-Zeilen und ein Ordner voller Textdateien sind für den
Rechner rückführbar und für einen Menschen nicht. Wer bei einer Betriebsprüfung
oder einer Kundenrückfrage wissen will, was zu Vorgang 2026-0110 geschehen ist,
hätte `grep` gebraucht.

`vorgangsakte` gibt es seit dem Bau der Ablage am 4. September. Gerufen hat sie
außerhalb der Tests niemand — geführt mit dem Grund, sie setze eine
**abgeschlossene Akte** voraus. Den Grund gab es zu Recht; seit heute früh gibt
es die Akte.

## Was `npm run akte` zeigt

```
  Vorgang 2026-0171 — 1 Eintrag/Einträge, Journal 2026
      1. 2026-09-12  rechnung               RE-2026-0001         911,06 €
         Rechnung RE-2026-0001 zu Vorgang 2026-0171, 2 Position(en)
         Beleg: RE-2026-0001.txt (1119 Zeichen)
    aufzubewahren bis 31.12.2033 (§ 132 BAO)
```

Drei Dinge stehen bewusst nebeneinander:

- **Die Journalzeile** sagt, was aufgezeichnet ist.
- **Der Beleg daneben** ist das Papier. Fehlt er, steht hier `FEHLT` — derselbe
  Befund, den `npm run pruefe-ablage` meldet, nur an der Stelle, an der jemand
  die Akte tatsächlich liest.
- **Die Frist** kommt aus `aufbewahrungBis`, der zweiten Ausfuhr, die bis heute
  niemand gerufen hat.

## Was ausdrücklich nicht dasteht

Der **Inhalt** der Durchschriften.

> **Er trägt Namen, Anschrift und Beträge des Kunden. Ein Werkzeug, das ihn auf
> den Bildschirm schreibt, macht aus einer Übersicht eine zweite Kopie — und
> die liegt dann im Terminalpuffer, im Sitzungsprotokoll und im Zweifel in
> einer Bildschirmaufnahme.**

Dieselbe Regel, aus der das Journal seit dem 11. September nur den Betreff
trägt und nicht den Belegtext. Wer den Beleg lesen will, öffnet die genannte
Datei — der Weg dorthin steht da, der Inhalt nicht.

Die Zusicherung dazu steht im Testfall **vor** der über die Form: Wer die
Übersicht umbaut, soll zuerst lesen, was sie nicht enthalten darf. Das war
kein Stilfrage — der erste Wurf der Gegenprobe fiel an der Formzusicherung und
bewies damit nichts über die Anschrift.

## Und eine Weigerung statt einer leeren Liste

Ohne Ablage endet der Lauf mit Ausgang 2 und sagt, warum.

> **Ein leerer Bericht sähe aus wie eine Akte ohne Einträge. Das ist nicht
> dasselbe wie eine Akte, die es nicht gibt.**

## Ausgang

| | |
| --- | --- |
| `npm run akte` | neu — je Vorgang: Zeile, Beleg, Frist |
| ungerufene Ausfuhren | `vorgangsakte` und `aufbewahrungBis` sind weg |
| Testfälle | 2.399 |
| Gegenproben | 215 → **216** |

Was in `src/ablage.js` ungerufen bleibt, hat weiter seinen Grund: `storniere`
wartet auf eine stornierte Rechnung, `alsCsv` auf eine Buchhaltung, die etwas
abholt, und `pruefeAblagefelder` auf einen Eintrag, der an `haltefest`
vorbeigekommen ist — was das Werkzeug nicht zulässt.

---

**Die Regel dieser Runde:** *Aufbewahren heißt nicht ablegen, sondern
wiederfinden — und wer es wiederfindet, braucht nicht alles zu sehen.*
