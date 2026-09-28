# Der erste Satz, den ein Leser sieht, war zwei Modelle alt

**1. September 2026.** Der Auftragsabgleich von vorhin hat als offenen Punkt
notiert: *„Offen bleibt, README.md selbst nachzuziehen."* Nachgeholt.

`docs/baustoff-shop/README.md` ist die Datei, die ein Leser zuerst öffnet.
Ihr Kopf trug seit Wochen:

> „**Teilweise überholt.** Die Margenschwelle liegt bei **32 %** statt 28 %,
> und die Zielgröße ist **3.000 € netto** statt 3.000 € vor Steuer."

Ein Berichtigungsvermerk — und er ist **selbst überholt**. 32 % war Gate 1,
und Gate 1 ist seit dem 22. August gegenstandslos: An seine Stelle ist Gate 20
getreten, das keine Prozentschwelle mehr kennt, sondern den
Deckungsbeitrag je Bestellung in Euro prüft.

Ein Vermerk, der vor Überholtem warnt und dabei selbst überholt ist, ist
schlimmer als gar keiner. Wer ihn liest, glaubt, er sei jetzt auf Stand.

## Was geändert wurde — und was ausdrücklich nicht

**Geändert: der Kopf.** Er sagt jetzt, was das Dokument ist (Denkgrundlage vom
Projektbeginn), welches Modell es beschreibt (das am 22.08. verlassene), dass
der vorige Vermerk seinerseits falsch war, und wo der Stand steht:

| Frage | Datei |
|---|---|
| Was gilt? | `PARAMETER.md` |
| Wo steht das Vorhaben? | `STATUS.md` |
| Welche Gates? | `gate-register.md` |
| Was ist noch offen? | `npm run offenepunkte` |
| Was kann schiefgehen? | `die-drei-groessten-risiken.md` |
| Wie geht es weiter? | `weg-zum-ersten-verkauf-nachgerechnet.md` |

Alle sechs Verweise lösen auf; nachgeprüft.

**Nicht geändert: der Rumpf.** 230 Zeilen Rechnung und Begründung aus dem
Radon-Modell. Sie bleiben, wie sie sind.

> Was gültig bleibt, ist die **Denkweise**: die Rechnung rückwärts vom
> Gewinnziel, die Frage nach der Unabhängigkeit von der eigenen Person, die
> Aufstellung dessen, was sich automatisieren lässt. Die Zahlen gehören zum
> abgelösten Modell.

Das ist dieselbe Regel wie heute früh bei `schaufenster-drift.md` und beim
Vorgänger von `weg-zum-ersten-verkauf.md`: **Ein Dokument, das man
nachträglich glattzieht, ist keine Akte mehr.** Ein Kopf, der sagt, was das
Dokument ist, kostet nichts und nimmt niemandem etwas weg.

## Zwei Gegenproben, die ich beim Suchen gemacht habe

**Steht 32 % noch irgendwo als gültig?** Nachgezählt über alle Dokumente und
den Rechenkern: Die Treffer verteilen sich auf Dokumente des Radon-Modells,
die von ihrer Natur her historisch sind, und auf `PARAMETER.md` — dort steht
die Schwelle mit einem „**Überholt seit 22. August**"-Vermerk unmittelbar
daneben, an jeder einzelnen Stelle. Die Korrekturtabelle in `STATUS.md` führt
sie ebenfalls: *„32 % Rohmarge sind die Untergrenze → Abgelöst durch Gate 20."*

Der einzige Ort ohne Marker war der README-Kopf. Jetzt keiner mehr.

**Lösen die Verweise zwischen den Dokumenten auf?** 327 relative Verweise in
`docs/baustoff-shop/`, davon 7 auffällig — und alle sieben sind falsche
Treffer meiner Suche: vier sind Beispieltext in Codeblöcken (`[…](…)`), zwei
zeigen auf Shopinhalte (`xps-oder-eps`, `../lieferung`), die relativ zu
`shop/inhalte/` richtig sind, einer ist das Wort „Ziel" in einer Erklärung.

**Daraus kein Prüfwerkzeug.** Ein Verweisprüfer für die Akte bräuchte genug
Ausnahmen, um mehr Rauschen als Befund zu erzeugen — und bei 320 von 327
richtigen Verweisen misst er ein Problem, das es nicht gibt. Festgehalten
statt gebaut.

## Stand

- 1.096 Tests, 0 rot; 11 Prüfer grün
- Auftragsabgleich: Ergebnis 1 ist damit so weit erfüllt, wie es ohne den
  ersten Verkauf sein kann
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
