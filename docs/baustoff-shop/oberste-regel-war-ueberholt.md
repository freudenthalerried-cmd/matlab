# Die oberste Regel war überholt — und hätte das laufende Modell verworfen

**28. August 2026.** Gestern die Statusseite, heute die Ebene darüber. Der
Arbeitsloop liest zuerst `PARAMETER.md`, und diese Datei sagt von sich selbst,
dass sie über dem Gate-Register rangiert. Genau dort stand:

> **Neue harte Untergrenze: 32 % Rohmarge.** Nischen darunter werden
> verworfen.

Das laufende Modell rechnet seit dem 22. August mit **25 % Marge** auf eigene
Baumeister-Einkaufspreise.

> **Ein späterer Lauf hätte nach der eigenen obersten Regel das Modell
> verwerfen müssen, an dem er gerade baut.**

Das Gate-Register hatte es richtig: „Gate 20 tritt an die Stelle von Gate 1."
Nur stand im Dokument, das über dem Register steht, das Gegenteil — und bei
Widerspruch gilt laut beiden Dateien die obere.

## Was jetzt in `PARAMETER.md` steht

Ein neuer Block gleich unter der Kopftabelle: **sechs Weisungen seit dem
9. August**, jede mit Datum, Folge und Fundstelle — von der Umstellung auf
Baumeisterpreise über die Klärung „25 % ist Marge, nicht Zuschlag" bis zu den
beiden Entscheidungen von heute (keine Spanne auf der Kundenseite, Sortiment
auf mindestens hundert Artikel).

Dazu ausdrücklich, **was davon die Zahlen weiter unten außer Kraft setzt**:
die Margenuntergrenze, Gate 2 und die Umsatzkaskade. Die alten Abschnitte
bleiben stehen, jeder mit seinem Vorspann — Fehlergeschichte in Sichtweite
ihrer Berichtigung, dieselbe Bauform wie im Widerrufsregister.

Unverändert gültig und ebenfalls benannt: Zielmarkt, Zielgröße, Zeithorizont,
Startbudget, kein eigenes Lager, B2B, die Freigaberegeln.

## Warum das kein Fall für den Widerrufsprüfer ist

Die Versuchung war, „32 % Untergrenze" ins Widerrufsregister aufzunehmen.
Dagegen spricht ein Unterschied, den es zu benennen lohnt:

| | |
|---|---|
| **Widerrufen** | Die Aussage war **falsch**. Sie darf überall stehen, aber nie ohne ihren Widerruf. |
| **Überholt** | Die Aussage war **richtig — für ein anderes Modell.** Sie gehört dorthin, wo dieses Modell beschrieben wird. |

Die 32 % stehen in fünfzehn Fundstellen über zehn Dateien, und in den
Phasendokumenten sind sie **nicht falsch**: Dort beschreiben sie das
Radon-Modell, das damals gebaut wurde. Falsch waren sie nur in den beiden
Dateien, die den **heutigen Stand** behaupten — `PARAMETER.md` und
`STATUS.md`. Beide sind berichtigt.

Ein Prüfer, der alle fünfzehn Stellen anmahnt, erzeugt vierzehn Fehlalarme
und wird abgeschaltet. **Nicht jede überholte Zahl ist ein Widerruf; die
Frage ist, ob das Dokument den heutigen Stand behauptet.**

## Zwei kleinere Funde derselben Art

- Die Überschrift des Registers lautete **„Die zweiundzwanzig Gates"**,
  während 24 darunter aufgeführt sind — Gate 23 und 24 kamen am 26. und 27.
  dazu. Eine Zahl in einer Überschrift ist auch eine Angabe.
- Die Dokumentzeile in `STATUS.md` sagte „nachgeführt auf 22 Gates" mit Datum
  26. August; jetzt „auf 24 Gates, Stand 28. August (am 26. waren es 22)".

## Stand

762 Tests grün, `pruefe-widerrufe` sauber, `pruefe-tests` 761 / 0. Am Code
wurde nichts geändert — dieser Lauf betraf ausschließlich die Dokumente, die
jeder spätere Lauf zuerst liest.
