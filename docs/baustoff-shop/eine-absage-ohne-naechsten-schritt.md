# Eine Absage ohne nächsten Schritt

**10. September 2026, dreizehnte Runde.** Die Runde davor hat die Suche
gelehrt, die Fragen *vor* der Bestellung zu beantworten. Diese hier ging der
Gegenrichtung nach: Was sieht jemand, dem die Suche **nichts** antworten kann?

Vorweg das Ergebnis, weil es das ungewöhnlichere ist:

> **Diese Runde hat keinen Mangel gefunden.** Was hier eingebaut wurde, ist
> eine Verbesserung und wird auch so ausgewiesen — nicht die Behebung eines
> Fehlers.

## Zwei eigene Fehlmessungen, beide vor dem Schreiben berichtigt

**Erstens.** Ich habe die vierundzwanzig Wörter des Nicht-Sortiment-Registers
(`estrich`, `rigips`, `ytong`, `dachziegel` …) mit exakter Wortgleichheit gegen
den ausgelieferten Index gehalten und daraus „keine Antwort" gelesen. Die
Oberfläche vergleicht aber auf **Wortstamm**, nicht auf Gleichheit. Richtig
gemessen bekommen **alle vierundzwanzig** ihre redaktionelle Antwort. Der
Befund, den ich fast aufgeschrieben hätte, war meiner, nicht der des Shops.

**Zweitens.** Ich hatte den leeren Suchzustand als **stumm** notiert, bevor ich
`shop-ui.js` gelesen hatte. Er ist nicht stumm. Dort steht seit Langem:

> „Der Katalog umfasst 46 Artikel aus dem laufenden Einkauf. Was nicht darin
> steht, führen wir nicht — wir zeigen lieber nichts als etwas Erfundenes."

Und darunter, bei einem Vertipper, „Meinten Sie …". Beides richtig, beides
gemessen, beides durch Szenarien gehalten.

*Zum vierten Mal an zwei Tagen dasselbe Muster: **Eine Prüfung, die das Modell
im Kopf liest statt die Ausgabe, prüft die eigene Absicht.*** Der Unterschied
zu den drei Fällen davor ist nur, dass diesmal beide Fehlmessungen noch vor
dem ersten Zeichen Text aufgefallen sind.

## Was dann übrig blieb

Kein Mangel, aber eine Beobachtung. Von den vierundzwanzig Wörtern haben fünf
eine eigene redaktionelle Antwort mit Verweis („Dämmen ohne abzudichten …",
Kellerwand-System). Die übrigen **neunzehn** enden bei einem wahren, höflichen,
vollständigen Satz — und dort hört die Seite auf.

| | Wörter |
|---|---|
| eigene Antwort **mit** nächstem Schritt | 5 |
| ehrliche Absage **ohne** nächsten Schritt | **19** |

> **Eine ehrliche Absage ohne nächsten Schritt ist bei einem bezahlten Klick
> eine Sackgasse.** Der Klick kostet zwischen 4,19 € und 8,22 €; er ist
> bezahlt, bevor der Satz gelesen wird.

## Die Änderung

Der leere Suchzustand nennt jetzt zusätzlich, **was es gibt**:

> Das führen wir: Dämmplatten, Kaminsystem, Kanal und Erdbau, Mauerwerk,
> Mörtel und Putze, WDVS-Komponenten und Zubehör und Kleinteile.

Drei Festlegungen dazu, die wichtiger sind als der Absatz selbst:

1. **Keine Umleitung.** Das eingegebene Wort wird nicht heimlich auf ein
   Ersatzprodukt gelenkt. Der Kopf nennt weiterhin „Kein Treffer für
   ‚estrich'", die Absage bleibt stehen, die Gruppen stehen *daneben*.
2. **Aus dem Bestand, nicht aus einer Liste.** Die sieben Gruppen kommen aus
   den Gruppenseiten des ausgelieferten Suchindex. Fällt eine Gruppe aus dem
   Sortiment, verschwindet sie hier von selbst — *eine zweite, handgeführte
   Liste wäre genau die Sorte Zusage, die still veraltet.*
3. **Gemessen wird die ausgelieferte Seite.** Das neue Szenario tippt
   `estrich`, liest den Absatz und **folgt dem ersten Verweis**, statt nur
   seine Adresse zu lesen; geprüft wird die Überschrift der Seite danach.

Die Gegenprobe `absage-ohne-naechsten-schritt` löscht den Block nicht, sondern
lässt seinen Filter ins Leere greifen. So bleibt der Zweig stehen und die Liste
wird **still leer** — der Fehler, den niemand am fehlenden Code bemerkt. Sie
meldete rot an der erwarteten Stelle.

## Stand

| | vorher | nachher |
|---|---|---|
| Testfälle | 2234 | 2234 — *diese Runde hat keinen gebraucht* |
| Shop-Szenarien im Browser | 56 | **57** |
| Gegenproben | 157 | **158** |
| Prüfer | 48 | 48 |

Alle Läufe grün: `npm test` (2234 bestanden, 3 übersprungen), `npm run
shopprobe` (57 Szenarien, 0 fehlgeschlagen), `npm run oberflaechenprobe` (11
Szenarien), `npm run pruefe-pruefer` (48 Prüfer befragt, 0 ohne belastbaren
Umfang, 1 abgebrochen — `pruefe-gebinde`, seit dem Verlust der
Poschacher-Positionsdatei).

## Was das für den nächsten Durchlauf heißt

Eine Runde ohne Befund ist kein Leerlauf, aber sie ist auch kein Grund, einen
Befund zu erfinden. Zweimal an zwei Tagen ist der Weg über eine schnelle
eigene Nachbildung — einmal ein handgebauter Suchindex, einmal ein
handgebauter Wortvergleich — in eine falsche Anzeige gelaufen. **Wer prüfen
will, was der Besucher bekommt, muss lesen, was ausgeliefert wird**, und zwar
mit derselben Logik, mit der die Oberfläche es liest.
