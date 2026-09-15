# Ein Weg zur Zahl — die Nachbauten sind weg

**28. August 2026.** Das vorige Dokument endete mit einem Vorbehalt: „Der
saubere Weg wäre, das Kostenbild dort nicht mehr von Hand zu bauen. Das ist
ein größerer Umbau; bis dahin ist die Probe das Netz." Der Umbau war kleiner
als gedacht.

## Was ersetzt wurde

**`bin/kampagne.mjs`** rechnete Warenwert, Einkauf und Fracht selbst aus —
Zeile für Zeile dasselbe wie `berechneWarenkorb`, nur ein zweites Mal
aufgeschrieben. Jetzt ruft es den Warenkorb auf. Die Zahlen sind **exakt
dieselben** wie nach der gestrigen Notreparatur; das ist der Beweis, dass es
wirklich ein Nachbau war und keine andere Rechnung.

**`bin/veroeffentlichung.mjs`** legte für den Produktfeed Pauschale und
Sperrgutzuschlag selbst zusammen — dieselbe Regel, drittes Mal. Jetzt ruft es
`fracht()`. Ein Warenkorb aus einer Position ist ein Warenkorb: 83,00 € für
die palettierte Dämmplatte, 75,50 € für das Klebeband.

Damit gibt es für die Frachtregel **einen** Weg und für den Deckungsbeitrag
**einen** Weg.

## Was ausdrücklich bleibt

Zwei weitere Stellen rechnen Fracht, und beide zu Recht:

- **`src/kontrolle.js`** rechnet sie absichtlich unabhängig nach — sie liest
  den Bestellwert aus dem *gerenderten Bestelltext* zurück und legt die
  Konditionen darauf an. Ihr Zweck ist zu widersprechen.
- **`src/shopkern.js`** rechnet dieselbe Fracht mit **weniger Wissen**: Der
  Warenkorb im Browser kennt keine Einkaufspreise. Auch das ist dokumentiert
  und gewollt.

> **Nicht jeder zweite Rechenweg ist ein Fehler.** Die Frage ist, ob er
> widersprechen *soll*. Eine Kontrolle, die dasselbe Modul ruft wie der
> Prüfling, kontrolliert nichts; ein Werkzeug, das die Regel abschreibt statt
> sie zu rufen, ist irgendwann alt.

Der Unterschied steht jetzt an beiden Stellen als Begründung — vorher stand er
nur an einer.

## Warum das mehr ist als Aufräumen

Der Fehler von gestern war nicht, dass eine Zahl falsch war. Er war, dass eine
Änderung an einer Stelle **stillschweigend nicht** an der anderen ankam. Die
Kampagnengebote lagen deshalb um bis zu 29 % zu hoch, und niemand hätte es
gemerkt: Beide Zahlen waren plausibel, keine Probe verglich sie.

Nach dem Umbau ist der Vergleich nicht mehr nötig — aber die Probe bleibt
trotzdem stehen. Sie führt das Werkzeug aus und hält seine Ausgabe gegen die
Bibliothek; sollte jemand den Nachbau wieder einführen, fällt sie. Eine Probe,
die nach der Reparatur entfernt wird, lädt den Rückfall ein.

## Stand

- 736 Tests grün, `pruefe-tests` 735 Fälle / 0 Verdacht
- `pruefe-seiten` 57/216/0, `pruefe-inhalte` 24/355/0
- Kampagne: unveränderte Zahlen gegenüber gestern (WDVS 4,19 · Dämmung 5,91 ·
  Kamin 8,22 · Kanal 1,38 · Mörtel 1,85 · Mauerwerk 1,24 € max. Klick)
- Feed: 43 einreichbar, eine offene Angabe (GTIN)
