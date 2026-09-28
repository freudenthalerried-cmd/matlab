# Die Prüfung, die sich selbst recht gibt

**31. August 2026.** Zweiter Prüfer, dieselbe Frage wie beim ersten: Welche
seiner Fundmeldungen hat er noch nie ausgesprochen? Bei `kontrolle.js` waren
es sieben. Bei `abgleich.js` sind es acht — und diesmal steht die Erklärung
im Dateikopf des geprüften Moduls selbst.

## Das Modul warnt vor genau diesem Fehler

`abgleich.js` legt die dreizehn AGB-Punkte neben die elf Ablaufschritte und
verlangt, dass jedes Versprechen eine Umsetzung hat und jedes Verhalten eine
veröffentlichte Grundlage. Sein Kopf sagt:

> „Der Fehler, der in diesem Projekt schon zweimal aufgetreten ist: Eine
> Prüfung vergleicht eine Erklärung mit sich selbst und geht immer auf."

Für die **Ziele** war das gelöst, und zwar vorbildlich: Die Module kommen als
Parameter herein. Nimmt man eines weg, fällt die Prüfung durch — zwei
Testfälle zeigen es.

Für die **Tafeln** war es nicht gelöst. `ZUORDNUNG`, `AGB_GLIEDERUNG`,
`SCHRITTE` und `SCHRITTE_OHNE_AGB` las die Funktion unmittelbar aus dem Modul.
Weil sie im Bestand zueinander passen, meldete sie **immer** „vollständig".

> **Die halbe Vorkehrung ist die gefährlichere.** Wer die Module hereinreicht
> und die Tafeln nicht, hat allen Grund zu glauben, das Problem sei erledigt.

## Die acht

| Mangel | was er verhindert |
|---|---|
| Zuordnung auf einen Punkt, den es nicht gibt | eine Umsetzung, die ins Leere zeigt |
| doppelt zugeordneter Punkt | zwei Antworten auf dieselbe Frage |
| unbekannte Art der Umsetzung | eine erfundene fünfte Art überspränge die Zielprüfung — der Punkt gälte als umgesetzt, ohne dass etwas nachgeschlagen wurde |
| Zuordnung ohne Begründung | „steht im Code" ohne zu sagen, warum |
| Art genannt, aber kein Ziel | dieselbe Lücke, eine Ebene tiefer |
| Klausel, die trotzdem ein Ziel nennt | eine Einordnung, die sich selbst widerspricht |
| AGB-Punkt ohne jede Zuordnung | **Versprechen ohne Umsetzung** — der Befund, für den das Modul gebaut wurde |
| Ablaufschritt ohne Grundlage und ohne Begründung | Verhalten ohne veröffentlichte Grundlage |

Dazu, im Schwestermodul `pruefeDatenfluesse`, ein neunter: ein Datenfluss, den
kein Punkt der Datenschutzerklärung deckt. Bei einer Auskunft nach Art. 13
DSGVO ist das der teuerste Fall der ganzen Liste — eine Übermittlung, über die
niemand informiert wurde.

## Was geändert wurde

Beide Prüffunktionen nehmen ihre Tafeln jetzt als zweites Argument, mit dem
Bestand als Vorgabewert. Jeder Aufruf ohne dieses Argument verhält sich wie
zuvor — und **das** ist die wichtigste der neun Gegenproben:

```js
assert.deepEqual(pruefeAbgleich(MODULE), pruefeAbgleich(MODULE, {}));
assert.deepEqual(pruefeAbgleich(MODULE), pruefeAbgleich(MODULE, { …der Bestand… }));
```

Die Tafeln hereinreichbar zu machen wäre wertlos, wenn der Bestand dabei aus
dem Blick geriete.

## Gegenproben

Neun Meldungen einzeln abgeschaltet, alle erkannt. Zu den Fällen jeweils die
Gegenrichtung: derselbe Schritt **mit** Begründung ist in Ordnung, derselbe
Datenfluss **mit** deckendem Punkt ebenso.

Zwei der neun Mutationen kamen im ersten Anlauf gar nicht an: Mein
Schleifenbefehl trennte die Felder an `|`, und die beiden Bedingungen mit
`||` zerfielen dabei. Beide meldeten Grün — die einer unveränderten Datei.
**Zum zweiten Mal an einem Tag dieselbe Falle**, und sie ist tückischer als
ein fehlgeschlagener Test: Eine Mutation, die nicht ankommt, sieht aus wie
eine, die der Test überstanden hat. Einzeln wiederholt, dann erkannt.

## Stand

`abgleich.js` und `kontrolle.js` stehen beide auf 100 % Zeilendeckung. Von den
beiden Modulen, deren Zweck das Melden von Befunden ist, hat keines mehr eine
Meldung, die es nie ausgesprochen hätte.

1002 Testfälle grün (vorher 992), `pruefe-tests` 1000/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 207/207.
