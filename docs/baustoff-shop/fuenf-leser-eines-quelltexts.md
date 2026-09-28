# Fünf Leser eines Quelltexts, zwei davon konnten lesen

**14. September 2026, nachmittags.** Die Runde davor endete mit einem offenen
Punkt: Dieses Haus liest an fünf Stellen seinen eigenen Quelltext, und nur zwei
davon kennen reguläre Ausdrücke.

| Stelle | las mit | kennt Zeichenketten | kennt Muster |
|---|---|---|---|
| `src/entkommentieren.js` | Scanner | ja | ja |
| `src/testzerlegung.js` | Scanner | ja | ja |
| `src/zwillingssaetze.js` | Mustern | seit 14.09. vormittags | **nein** |
| `src/regelnamen.js` | Mustern | nein | **nein** |
| `src/codedubletten.js` | Mustern | nein | **nein** |

## Was die Musterleser taten

Gemessen, bevor etwas geändert wurde — der Satzleser gegen einen
vollständigen Gang durch die Quelle:

| | |
|---|---|
| Sätze, die er fand und die es nicht gibt | **415** |
| Sätze, die es gibt und die er übersah | **163** |
| betroffene Dateien | **58 von 255** |

Die Ursache ist dieselbe wie beim Apostroph am Vormittag, eine Ebene höher:
**Ein Anführungszeichen in einem regulären Ausdruck.** `/['"]/`,
`/^\s*\/\/(.*)$/` — für einen Musterleser beginnt dort eine Zeichenkette, und
ab dort liest er Code als Text und Text als Zwischenraum.

> **Wer Quelltext mit Mustern liest, liest ihn irgendwann falsch. Die Frage ist
> nur, an welchem Zeichen.**

Die beiden anderen Musterleser sind ebenfalls gemessen worden, und dort ist die
Antwort kleiner:

* `src/codedubletten.js`: **kein** Unterschied — 740 gegen 741 Rümpfe, dieselben
  Funde. Der Grund ist die Grenze von 50 Zeichen; was diese Datei falsch liest,
  ist kürzer.
* `src/regelnamen.js`: **drei** Regeln, die es nicht gibt — und alle drei stehen
  in der Tafel im Kopf **dieser Datei**, als Beispiele. Ein Verzeichnis, das
  seine eigene Erklärung mitzählt, meldet sich selbst als Bestand.

## Der eine Leser

`src/quelltext.js` geht einmal durch die Quelle und gibt jedes Stück mit seiner
Art heraus: `code`, `block`, `zeile`, `kette`, `muster`. Wer Sätze sucht, nimmt
die Kommentare und Zeichenketten; wer Code durchsucht, nimmt `code`; wer
Kommentare entfernt, lässt zwei Arten weg.

Aneinandergehängt ergeben die Stücke wieder **genau** die Quelle. Das ist
nicht Schönheit, sondern die Bedingung dafür, dass `entkommentiere` — das
Werkzeug, das den ausgelieferten `shop.js` schreibt — sich darauf stellen kann.
Gemessen über alle 256 Quelldateien: zeichengleich, und die Ausgabe des
Kommentarentferners ist **Zeichen für Zeichen dieselbe** wie mit seinem
eigenen Scanner.

Damit ist auch die zweite Doppelung weg: `src/entkommentieren.js` hatte einen
vollständigen Scanner, `src/testzerlegung.js` hat einen zweiten. Der erste
liest jetzt aus `quelltext.js`.

## Streng oder nachsichtig — beides wird gebraucht

`entkommentiere` schreibt aus, was der Kunde herunterlädt. Dort ist ein
unvollständiges Literal ein **Abbruch**: Ein Scanner, der rät, macht aus
gültigem Code Bruch, und das fiele erst im Browser des Kunden auf. Ein Prüfer,
der 255 Dateien nach Sätzen durchsieht, darf an einer kaputten nicht die ganze
Messung verlieren.

> **Dieselbe Lesart, zwei Antworten auf einen Fehler — und die Antwort gehört
> dem Aufrufer, nicht dem Leser.**

Deshalb `streng` als Schalter und nicht als zweite Fassung.

## Acht Sätze, die niemand sehen konnte

Mit dem richtigen Leser stieg die Zahl der Wiederholungen von 26 auf **34**.
Acht Sätze standen mehrfach und waren für den alten Leser unsichtbar. Alle acht
sind behoben, keiner durch eine Ausnahme:

| Satz | stand in |
|---|---|
| „nur N Quelldateien gelesen — die Messung sagt dann nichts." | 4 Prüfern |
| „N Texte/Seiten/Artikelseiten gemessen — darüber lässt sich nichts aussagen" | 5 Modulen |
| „Prüfer können nicht messen — das ist keine Entwarnung:" | 2 Werkzeugen |
| „Eine Messung ohne Gegenstand meldet Grün und hat nichts geprüft." | 2 Prüfern |
| „kein einziger Artikel gelesen — es wird nichts geschrieben." | 2 Erzeugern |
| „steht im Register und liegt nicht (mehr) im Bestand" | 2 Modulen |

**Drei der vier Abbruchsätze habe ich an diesem Tag selbst geschrieben** —
jeden beim Bau seines Prüfers, jeden abgeschrieben vom vorigen.

> **Wer einen Prüfer nach dem Muster des letzten baut, schreibt auch dessen
> Sätze ab.**

Und der achte Fund war der Verweis, mit dem ich am Vormittag eine
Wiederholung **behoben** hatte: „Warum leer ein Fehler ist und kein grüner
Lauf: `OHNE_FUNDSTELLEN` in `src/prueferurteil.js` — dort einmal." Ich hatte
ihn in beide Dateien geschrieben.

> **Die Behebung einer Wiederholung war selbst eine.**

## Was die Gegenprobe misst — und was sie nicht mehr misst

Die Gegenprobe, die dem Satzleser seit heute Vormittag die Zeilenregel wegnahm,
schlug nach dem Umzug **nicht mehr an**. Nicht, weil die Regel weg wäre,
sondern weil sie nicht mehr diejenige ist, die den Apostroph aufhält: Im neuen
Leser ist ein Kommentar ein Stück, **bevor** irgendein Anführungszeichen
gelesen wird. Die Reihenfolge hält, was vorher die Zeilenregel hielt.

Sie mutiert deshalb jetzt das, was diese Runde neu kann — die Erkennung
regulärer Ausdrücke —, und `test/quelltext.test.js` pinnt die übrigen Regeln
einzeln: Zeilenumbruch, Zeichenklasse mit Schrägstrich, Division gegen Muster,
geschachtelte Vorlagenliterale, streng gegen nachsichtig.

> **Eine Gegenprobe, die nach einem Umbau grün bleibt, sagt nicht „alles gut",
> sondern „ich messe etwas anderes als vorher".**

## Stand

* 256 Quelldateien, alle zeichengleich zerlegt
* `entkommentiere` Zeichen für Zeichen unverändert, `shop.js` parst
* Wiederholungen 26 → 34 (repariert gemessen) → **26** (acht behoben)
* Regelstellen 489 → **486** (drei Beispiele aus einer Erklärung)
* 55 Prüfer grün, 2 592 Testfälle, 300 Gegenproben

## Was diese Runde nicht erreicht hat

`src/testzerlegung.js` hat weiter seinen eigenen Scanner. Er ist nicht falsch —
er kennt Zeichenketten und Muster —, aber er ist der zweite, und
`pruefe-namen` zählt seine Ausfuhren (`endeDerZeichenkette`, `istMusteranfang`,
`endeDesMusters`) heute noch nicht als Doppelung, weil sie anders heißen. Eine
Doppelung, die sich hinter verschiedenen Namen versteckt, findet nur, wer die
Bauart vergleicht — und der Gestaltvergleich vom Vormittag endet bei 50 Zeichen.

`src/codedubletten.js` liest weiter mit Mustern. Gemessen ändert es heute
nichts; gemessen wurde aber nur der Bestand von heute.
