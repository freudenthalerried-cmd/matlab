# Vier Plätze und eine Hoffnung

**14. September 2026, spätnachmittags.** Die Runde davor hat dem gemeinsamen
Quelltextleser ein Gedächtnis von vier Einträgen gegeben, weil drei Aufrufer
ihn in einer Schleife riefen und damit die Sekunde aus Gate 38 rissen. Am Ende
jener Runde stand ein Satz, den ich selbst geschrieben habe:

> Das Gedächtnis ist eine **Annahme über die Aufrufer**: Vier Einträge
> reichen, solange niemand zwei Dateien verschränkt liest. Nichts prüft das.
> Wer es tut, bekommt keinen Fehler, sondern die alte Laufzeit zurück.

Das ist die gefährlichste Sorte von Annahme, die dieser Bestand kennt.

> **Eine Annahme über den Aufrufer, die niemand misst, ist eine Hoffnung mit
> Laufzeitfolgen.**

## Was gemessen wird — und was ausdrücklich nicht

Nicht die Zeit. Zeit hängt an der Last der Maschine; am 13. September hat der
Schnelllauf drei Prüfer für langsam gehalten, weil der Behälter beschäftigt war
— mit meiner eigenen Arbeit. Dieselbe Falle wäre hier noch leichter zu stellen.

Gemessen wird die **Zahl der Zerlegungen**: wie oft der Leser auf einen Text
trifft, den er schon kennt, und wie oft nicht. Diese Zahl ist von der Last
unabhängig.

| Lauf | Treffer | Zerlegungen | Quote |
|---|---|---|---|
| `codedublettenbefund` über 256 Dateien | 597 | 196 | 75,3 % |
| `zerlege` über 173 Testdateien | 2 470 | 173 | 93,5 % |

Beide Zahlen sind **optimal**: 196 ist die Zahl der Dateien, die überhaupt
einen Funktionsrumpf tragen, 173 die der Testdateien. Jede Datei wird genau
einmal zerlegt.

Und genau das ist die Zusicherung, die jetzt dasteht — nicht „die Quote ist
hoch genug", sondern:

```
assert.ok(stand.fehlschlaege <= quellen.size,
  `… — eine Datei wurde mehrfach gelesen`);
```

Verschränkt ein Aufrufer eines Tages zwei Dateien, steigt diese Zahl über die
Zahl der Dateien, und der Testfall wird rot. Er meldet dann nicht „langsam",
sondern **was** langsam macht.

## Drei Testfälle, drei Zustände

* Derselbe Text, zweimal gefragt: eine Zerlegung, ein Treffer. Und `streng`
  teilt sich den Eintrag **nicht** mit `nachsichtig` — es sind zwei Fragen an
  denselben Text.
* Mehr Texte als Plätze: der älteste fällt heraus, der jüngste bleibt.
* Der echte Bestand: keine Datei zweimal.

Alle drei sind rot gesehen worden. Mit einem Gedächtnis von einem Platz fällt
der zweite; ohne Gedächtnis fallen alle drei. Die neue Gegenprobe schaltet es
ab — und der Grund, warum das eine Gegenprobe wert ist, steht in ihr:

> **Ohne das Gedächtnis kommt die alte Laufzeit zurück, und zwar ohne Fehler:
> Jeder Prüfer bleibt grün, nur langsam.**

## Ein Nebenbefund über das eigene Register

Die beiden neuen Auskunftsfunktionen ruft außerhalb der Tests niemand — und
`pruefe-ungerufen` hat das sofort gemeldet. Sie stehen jetzt mit Grund im
Register, und der Grund ist der interessante Teil:

> Ein Werkzeug, das dieselbe Zahl im Betrieb ausgäbe, meldete etwas, das
> niemand liest.

Eine Messung braucht nicht immer einen Prüfer. Sie braucht einen Ort, an dem
sie rot werden kann — und für eine Annahme über Aufrufer ist das der Testfall,
nicht der Bericht.

## Stand

* 55 Prüfer grün, 2 595 Testfälle, **302** Gegenproben
* keine Datei wird zweimal zerlegt — als Zusicherung, nicht als Hoffnung
* Schnelllauf 8,2 s

## Was diese Runde nicht erreicht hat

Die Annahme ist jetzt gemessen, **aber nur für zwei Aufrufer**: den
Dublettenvergleich und die Testzerlegung. `pruefe-tests` ruft `nurCode()` je
Testrumpf — 2 591 Mal, jedes Mal mit einem anderen Text —, und dort trifft das
Gedächtnis naturgemäß nie. Das kostet heute nichts, weil ein Rumpf kurz ist;
gemessen ist es nicht.

Und der Bestand hat weiter **28 offene Punkte**, von denen keiner mir gehört:
fünf brauchen eine Eintragung des Auftraggebers, zwölf eine Anfrage an Dritte,
neun seine Entscheidung, zwei sind von hier aus nicht feststellbar. Die
billigste davon kostet einen Klick — das Repository ist öffentlich, und aus
einer gebauten Artikelseite sind 44 von 46 Einkaufspreisen auf den Cent
rückrechenbar.
