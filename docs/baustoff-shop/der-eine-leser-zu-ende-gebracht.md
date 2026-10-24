# Der eine Leser, zu Ende gebracht — und was er gekostet hat

**14. September 2026, nachmittags.** Die Runde davor hat den Gang durch den
Quelltext an einer Stelle zusammengelegt und zwei offene Punkte hinterlassen:
`src/testzerlegung.js` trug weiter einen zweiten Scanner, und der neue Leser
war teurer als die regulären Ausdrücke, die er ersetzte.

Beides ist erledigt, und beides hat etwas gezeigt.

## Der dritte Gang durch die Quelle

`src/testzerlegung.js` hatte nicht einen zweiten Scanner, sondern **zwei**
Stellen mit derselben Arbeit: `bisSchliessend()` sucht das Ende eines
Funktionsrumpfs und muss dafür Klammern in Zeichenketten, Kommentaren und
regulären Ausdrücken übergehen; `ohneZeichenketten()` blankt, was nicht läuft.
Beide kannten die Sonderfälle noch einmal selbst.

Beide lesen jetzt mit `src/quelltext.js`. Dafür trägt jedes Stück seit heute
seine Stelle (`von`) — die Regeln daneben rechnen mit Positionen im Rumpf, und
`zerlege()` liefert über alle 173 Testdateien **Zeichen für Zeichen dieselben**
Testfälle wie vorher.

## Was der alte Leser aus Versehen richtig machte

`ohneZeichenketten` hieß so, tat aber mehr: Es blankte auch **Blockkommentare**
— und zwar aus einem Irrtum heraus. Sein Musterleser hielt das `/` in

```
/* ------------------------------------------------------------------ */
```

für den Anfang eines regulären Ausdrucks (nach einem Zeilenumbruch beginnt dort
einer) und blankte bis zum nächsten `/`. Das traf den Kommentar — **und was
dahinter stand.**

> **Ein Werkzeug, das aus einem Irrtum heraus das Richtige tut, tut es beim
> nächsten Umbau nicht mehr.**

Beim Umstellen fiel es weg, und `pruefe-tests` meldete vier Schleifen, die er
vorher nicht gesehen hatte. Alle vier waren echt:

| Datei | Befund |
|---|---|
| `test/rechtstexte.test.js` | die Längenzusicherung stand **nach** der Schleife |
| `test/sortimentsluecke.test.js` | die innere Schleife über `l.listen` hatte gar keine |
| `test/shopkern.test.js` (2×) | zwei Schleifen über wahlfreie Felder, ohne Vermerk |

Zwei sind durch eine Zusicherung an der richtigen Stelle behoben, zwei tragen
jetzt `// pruefung: begruendet` mit dem Grund — ein Eintrag **darf** dort leer
sein, und eine Zusicherung je Eintrag wäre falsch und nicht bloß streng.

Die Funktion heißt jetzt `nurCode()` und sagt, was sie tut: Zeichenketten,
reguläre Ausdrücke **und** Kommentare werden zu Leerzeichen.

## Was der genauere Leser gekostet hat

Der Scanner braucht 1,7 ms je Datei, die beiden regulären Ausdrücke brauchten
0,02 ms. Das ist der Preis der Genauigkeit, und er ist in Ordnung — **einmal je
Datei.** Er war es dreimal nicht:

| Stelle | Aufrufe | vorher | nachher |
|---|---|---|---|
| `zwillingsbefund` | 6 geführte Zahlen × 256 Dateien = **1 536** | 1,7 s | |
| beide Messungen des Prüfers | 2 × 256 = **512** | 1,3 s | 0,69 s |
| `bisSchliessend` je Funktionsrumpf | **740** | 1,4 s / 2,3 s | 0,3 s |

> **Ein genauerer Leser ist teurer, und wer ihn in eine Schleife stellt,
> bezahlt die Genauigkeit je Durchgang.**

Die Wiederholung stand vorher schon da. Sie war nur billig genug, um niemandem
aufzufallen — dieselbe Lehre wie beim Riegel, der schon auseinandergelaufen
war, und beim Satz, der schon doppelt stand.

**Zwei Griffe, zwei verschiedene:**

1. Wo der Aufrufer die Wiederholung sieht, wird sie **aufgehoben**:
   `entkommentierteQuellen()` baut die Tafel einmal, beide Messungen bekommen
   sie gereicht.
2. Wo er sie nicht sieht — `bisSchliessend` wird tief unten je Rumpf gerufen —
   bekommt der Leser ein **Gedächtnis von vier Einträgen.** Vier reichen: Die
   Aufrufer arbeiten eine Datei zu Ende, bevor sie die nächste nehmen.

Ein größeres Gedächtnis hielte den ganzen Bestand im Arbeitsspeicher, ohne
einen weiteren Treffer zu bringen.

## Stand

| | |
|---|---|
| Scanner im Haus | 3 → **1** |
| `zerlege()` über 173 Testdateien | zeichengleich |
| `pruefe-zwillinge` | 1,7 s → **0,69 s** |
| `pruefe-codedubletten` | 1,4 s → unter 1 s |
| `pruefe-allaussagen` | 2,3 s → unter 1 s |
| Schnelllauf | 55 Prüfer grün |

2 592 Testfälle, 301 Gegenproben, eine davon neu und rot gesehen: Sie lässt die
Klammersuche wieder in Zeichenketten hineinzählen.

## Was diese Runde nicht erreicht hat

`src/codedubletten.js` und `src/regelnamen.js` lesen weiter mit Mustern, wo sie
nicht auf den Scanner angewiesen sind — `regelnamen` entkommentiert seit
heute Vormittag, sucht die Regelnamen darin aber mit regulären Ausdrücken.
Gemessen ändert das heute nichts; gemessen wurde aber nur der Bestand von
heute, und genau das ist bei jedem der letzten vier Funde die Stelle gewesen,
an der es beim nächsten Mal kippte.

Und das Gedächtnis ist eine **Annahme über die Aufrufer**: Vier Einträge
reichen, solange niemand zwei Dateien verschränkt liest. Nichts prüft das.
Wer es tut, bekommt keinen Fehler, sondern die alte Laufzeit zurück.
