# Ein Gebot auf die eigene Absage

**6. September 2026, morgens.** Weitergelesen als Maschine: von `llms.txt` in
die Kampagne. In `ausgabe/kampagne/keywords.csv` stand, Anzeigengruppe
„Dämmung", Gebot bis **5,91 € je Klick**:

```
EPS Fassadenplatten
Fassadendämmung EPS
```

Und auf der Landeseite dieser Anzeigengruppe, `gruppe/daemmung.html`, im
**zweiten Satz**:

> *„Die Fassadendämmplatte in Flächenstärke führen wir nicht — die geführten
> EPS-Stärken gleichen aus, sie dämmen die Fläche nicht."*

Geführt sind 2, 3 und 5 cm. Eine WDVS-Dämmung beginnt bei acht.

> **Der Shop bietet Geld dafür, dass jemand nach der Ware sucht, die er auf
> derselben Seite absagt.**

---

## Die Regel gab es, als Kommentar, seit fünf Tagen

Dieselbe Datei hat am 1. September ein Keyword **entfernt**, mit genau dieser
Begründung:

> *„‚Kaminkopf Regenhaube' ist am 01.09. entfallen. Der Shop führt die
> Kaminkopfverkleidung ausdrücklich nicht … Auf ein Wort zu bieten, das die
> eigene Suche nicht beantwortet, ist ein bezahlter Klick auf eine leere
> Trefferliste."*

Der Satz steht **zwei Blöcke unter** den beiden Wörtern, für die er genauso
gilt.

> **Eine Regel, die einmal von Hand angewandt und nie aufgeschrieben wurde,
> gilt für den einen Fall, an dem jemand hingesehen hat.**

Warum der Kaminfall gefunden wurde und dieser nicht: Bei „Kaminkopf" findet die
eigene Suche **nichts** — die Trefferliste ist leer, und das fällt auf. Bei
„Fassadendämmung" findet sie neun Dämmplatten. Sie sind nur nicht die, nach
denen gesucht wird.

---

## Warum die vorhandene Deckungsprüfung es durchließ

`ungedeckteWoerter` gibt es seit dem ersten Anlauf, und die Frage ist richtig:
*Sagt die Landeseite die Wörter des Keywords?* „Fassadendämmung" steht auf der
Seite — im Satz, der sie verneint, und in der Begriffstabelle darunter.

> **Der Prüfer fragte, ob das Wort auf der Seite steht. Er fragte nicht, in
> welchem Satz.**

Elfte Runde in vierundzwanzig Stunden mit derselben Gestalt: *ein Prüfer,
dessen Reichweite kleiner ist als die Reichweite der Regel, die er prüft.*

---

## Und der Grund stand im Verzeichnis, ausgeschrieben

`data/suchwoerter.json`, Eintrag `fassadendämmung`, seit dem 1. September:

> *„Steht seit 01.09. in der Begriffstabelle auf gruppe/daemmung und **ist
> Keyword des ersten Anzeigenanlaufs** — die Shopsuche fand es nicht."*

Die Kette, rückwärts gelesen: Die Anzeige bot auf ein Wort. Die eigene Suche
fand dazu nichts. Statt das Gebot zu prüfen, wurde das **Suchwort** ergänzt,
damit die Suche etwas findet.

> **Ein Suchwort, das aufgenommen wurde, weil eine Anzeige darauf bietet — und
> nicht, weil der Shop die Ware hat.**

Der Eintrag hat seinen wahren Grund die ganze Zeit mitgeschrieben. Es hat
niemand nachgelesen.

---

## Was jetzt gilt

**Die Regel.** `src/abgrenzung.js` liest die Abgrenzungssätze der Landeseite
(„… führen wir nicht", eng gefasst), bildet daraus Wortstämme und hält jedes
Keyword dagegen. Zurückgehaltene Keywords landen mit Satz und Grund in
`ausgabe/kampagne/keywords-verneint.csv` — genauso, wie ein Keyword ohne
Deckung seit jeher zurückgehalten wird.

```
Zurückgehalten — die Landeseite verneint das Wort: 2
  · Dämmung: „Fassadendämmung EPS" — die Seite sagt
    „die fassadendämmplatte in flächenstärke führen wir nicht"
```

**„Fassadendämmung EPS" steht absichtlich weiter in der Quelle.** Es wird nicht
von Hand gestrichen, sondern von der Regel zurückgehalten. *Gelöscht sieht man
der Liste nicht mehr an, dass die Regel arbeitet.*

**Was die Regel nicht fängt, steht dabei.** Aus „Fassadendämmplatte" wird der
Stamm `fassadendä`. „EPS Fassadenplatten" trägt ihn **nicht**, obwohl dasselbe
Bauteil gemeint ist. Dieses Wort ist von Hand entfernt worden, und die Grenze
steht im Kopf des Moduls und in einem Testfall — *wird dieser Fall eines Tages
rot, fängt die Regel mehr, und der Kommentar gehört nachgezogen.*

**Das Register kannte die teuerste Lücke nicht.** „Was wir nicht führen" hatte
23 Einträge — Drainage, Bitumen, Silikonputz, Dichtringe — und **keinen** für
die Fassadendämmplatte in Flächenstärke, obwohl zwei Seiten sie im Klartext
absagen. Ein Assistent, der `llms.txt` liest, sah 23 Ausschlüsse und darunter
nicht den einen, nach dem bei einer Fassade zuerst gefragt wird. Jetzt sind es
24.

**Der Grund im Suchwortregister ist berichtigt.** Das Suchwort bleibt — wer
nach „Fassadendämmung" sucht, soll auf der Gruppenseite landen und dort im
zweiten Satz die Wahrheit lesen. Es bleibt nur nicht mehr, weil eine Anzeige
darauf bietet.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Regeln | `abgegrenztesKeyword` in `src/abgrenzung.js` |
| Neue Ausgaben | `keywords-verneint.csv` |
| Neue Gegenproben | `gebot-auf-die-absage` |
| Neue Testfälle | 9 (`test/abgrenzung.test.js`) |
| Keywords | 100 → 96; Messliste 32 → 30 Begriffe |
| Neue Gates | keine — Gate 15 gilt unverändert, es misst jetzt weniger und richtigere Begriffe |

## Was offen bleibt

- **Zwei Schreibweisen desselben Bauteils, eine Regel.** Sie fängt eine. Die
  zweite steht gestrichen da, weil ein Mensch hingesehen hat. *Eine Regel, die
  die Hälfte fängt, ist besser als keine und schlechter, als sie aussieht.*
- **Die Begriffstabelle der Gruppenseite** nennt „Fassadendämmung" weiter als
  anderes Wort für „Fassaden EPS". Das ist vertretbar — die beiden Sätze
  darüber sagen, was gemeint ist —, aber es ist dieselbe Nähe, aus der der
  Fehler entstanden ist. **Nicht geändert**, weil eine Begriffstabelle das
  Kundenwort nennen soll und nicht das Katalogwort.
- **Die Gebietsfrage an den Lieferanten** und die sieben Punkte in
  `npm run startklar` — alle beim Auftraggeber.
