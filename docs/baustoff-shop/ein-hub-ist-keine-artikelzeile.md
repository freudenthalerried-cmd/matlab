# Ein Hub ist keine Artikelzeile

**4. September 2026.** Die Frachtzeile im Warenkorb lautet:

> „Pauschale plus 3× Kranentladung"

Die Zahl davor kommt aus einer Zeile, die in `preis.js` und `shopkern.js`
gleich lautet:

```js
const sperrgutPositionen = positionen.filter((p) => p.sperrgut).length;
const frachtNetto = pauschale + sperrgutPositionen * sperrgutZuschlagNetto;
```

Gezählt werden **Artikelzeilen**. Der Lieferant fakturiert die Position als
**„Kranentladung pro Hub"**, und ein Hub ist das Anheben einer Palette.

## Zwei eigene Rechnungen entscheiden das

| Rechnung | Hübe | Paletten (geliefert / gutgeschrieben) | Sperrgut-Positionen | Modell rechnet | fakturiert |
|---|---|---|---|---|---|
| 262021644 | 5 | 7 / 1 | 4 | 30,00 € | **37,50 €** |
| 262027463 | 3 | 3 / 0 | 6 | **45,00 €** | 22,50 € |

**Rechnung 262027463 ist eindeutig:** sechs Sperrgut-Positionen, drei Hübe. Das
schließt die Zählung je Position aus, ohne dass man wissen muss, wonach sonst
gezählt wird. Der Kunde hätte **22,50 € zu viel** bezahlt.

Auf der anderen Lieferung kippt es: vier Positionen, fünf Hübe — **7,50 € zu
wenig**.

> **Ein Fehler, der sich im Mittel aufhebt, ist keiner, der sich aufhebt.** Er
> trifft jede einzelne Lieferung, und keine Bestellung ist ein Mittelwert.

## Was sicher ist und was nicht

**Sicher:** Die Zählung je Position ist widerlegt.

**Nicht sicher:** wonach dann. Die Palettenzeilen sind mehrdeutig. Auf
262021644 stehen sechs Paletten ÖBB, eine gutgeschriebene ÖBB-Palette (eine
Rückgabe) und eine Einwegpalette — je nach Lesart fünf, sechs oder sieben, und
keine davon ist die 5 der Hübe. Auf 262027463 gehen drei Paletten und drei Hübe
genau auf.

> **Zwei Beobachtungen, von denen eine mehrdeutig ist, ergeben keine Regel.**
> Sie ergeben eine **widerlegte** Regel — und das ist mehr, als vorher dastand.

## Warum trotzdem nichts umgestellt wird

Drei Wege standen zur Wahl, und zwei sind schlechter als der jetzige:

| | Auf 262021644 | Auf 262027463 |
|---|---|---|
| je Position (heute) | 7,50 € zu wenig | 22,50 € zu viel |
| **eine je Lieferung** | 30,00 € zu wenig | 15,00 € zu wenig |
| je Palette | nicht bestimmbar (fünf, sechs oder sieben?) | träfe genau |

Eine Pauschale von einem Hub je Lieferung unterschriebe **beide** Belege — sie
wäre die optimistische Richtung, und die ist in diesem Vorhaben schon mehrfach
die falsche gewesen. Eine Palettenregel gibt es nicht zu schreiben: Die
Palettenzahl hängt an Gewicht und Packmaß, und der Katalog führt Gewicht für
**7 von 46** Artikeln.

**Die Zählung je Position bleibt also stehen — aber nicht mehr als Rechnung.**
Der Warenkorb sagt es jetzt selbst:

> Pauschale plus 3× Kranentladung **(geschätzt je Sperrgut-Position)**

Das ist derselbe Umgang wie mit der fehlenden Lieferzeit auf dem Angebot: Die
Lücke steht sichtbar da, statt als Zahl aufzutreten, die sie nicht ist.

## Was der Befund an offenen Punkten ändert

Die Palettenfrage trug bisher **eine** Folge: den Mindestbestellwert aus
Gate 25. Sie trägt jetzt eine zweite, und die steht in Euro da — im offenen
Punkt und im Brief an den Lieferanten, beide aus derselben Rechnung:

> Auf den zwei belegten Lieferungen liegt das Modell um bis zu **22,50 € zu
> hoch** und um bis zu **7,50 € zu niedrig** — auf jeder einzelnen, nicht im
> Mittel.

Und der Brief fragt jetzt ausdrücklich mit: *„Richtet sich ein Hub nach der
Palette, oder wonach sonst?"*

Die Beträge stehen nicht als Text in den Dokumenten, sondern kommen aus
`hubbefund()` — ein Betrag, den ein Dokument von Hand trägt, ist der nächste,
der veraltet.

## Und noch eine Zahl ohne Beleg

Beim Nachsehen ist eine zweite aufgefallen, die dieselbe Ursache hat: **Alle 46
Artikel tragen `sperrgutQuelle: "eingeschaetzt"`.** Kein einziger ist belegt.
Von ihnen sind 25 als Sperrgut geführt, und jedes davon löst im Modell eine
Kranentladung aus.

Das ist kein neuer Fehler, sondern derselbe eine Stufe tiefer: Die Zahl der
Hübe ist falsch berechnet **aus** einer Menge, die selbst geschätzt ist. Die
Artikelliste des Lieferanten mit Verpackungseinheit und Packmaß löst beides —
sie steht als offener Punkt und hat damit die fünfte Folge.

## Verweise

- `shop/src/huebe.js` — die zwei Belege, ihr Grund und die Rechnung dazu
- `shop/test/huebe.test.js` — sieben Proben; eine rechnet das Register aus den Rechnungen nach
- `shop/src/offenepunkte.js`, `shop/src/lieferantenanfrage.js` — die zweite Folge der Palettenfrage
- [`die-zahl-aus-der-zeichenkette.md`](./die-zahl-aus-der-zeichenkette.md) — die Runde davor, dieselbe Frage an eine andere Zahl
