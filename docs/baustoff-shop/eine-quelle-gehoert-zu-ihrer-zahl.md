# Eine Quelle gehört zu ihrer Zahl

**10. September 2026**

Die Redaktionsprinzipien dieses Shops sind selbst eine Seite, und einer ihrer
drei Sätze lautet: **jede Zahl mit Herkunft.** Ein Satz, der irgendwo steht —
dieser Bestand hat mit solchen Sätzen Erfahrung. Also die Frage: Wird er
gemessen?

---

## Zuerst: was gemessen wurde, und was dabei herauskam

**`npm run pruefe-inhalt` misst ihn** — über 24 handgeschriebene Inhaltsseiten,
379 Absätze, null Verdacht. Nicht gemessen wird er auf den **46 erzeugten
Artikelseiten**, und dort stehen die Preise.

Der erste Versuch, die Regel dorthin zu tragen, ergab **415 Sätze mit Zahl ohne
Quellwort** — und war Unsinn. Die Treffer waren Navigation, Krümelpfade,
Kachelraster und Tabellenzellen, die mein grobes Auspacken zu „Sätzen"
zusammenklebte. Eine Regel für Fließtext auf ein Kachelraster angewandt misst
das Auspacken, nicht die Seite.

> **Eine Zahl, die aus einer schlechten Messung kommt, ist keine Auskunft,
> sondern eine Behauptung mit Ziffern.** Sie steht deshalb hier und in keinem
> Befund.

Drei genauere Messungen später war das Ergebnis: **Die Seiten sind in Ordnung.**

- Der Einstufungsblock nennt Herkunft, Gewicht und Betrag mit Quelle und Stand
  — auf allen 26 Seiten, die ihn tragen.
- Alle 27 gebauten Flächen, die den Kranbetrag nennen, tragen Quelle und Stand.
- Die Lieferseite, die die Frachtsätze mit *„nicht aus einer Annahme"*
  einleitet, sagt zwei Absätze weiter ausdrücklich: *„Welcher Artikel als
  palettierte Ware gilt, ist **geschätzt** … Keine der 46 Einstufungen ist
  belegt."*

Der dritte Punkt sah zwei Messungen lang nach einem Befund aus, weil mein
Suchfenster von 220 Zeichen nicht bis zu dem Absatz reichte. **Er war keiner.**

---

## Der Befund, der übrig blieb

Die Abhilfe zum Befund vom 5. September — *Kranentladung für 285 Gramm* — war,
dem Kunden **Herkunft, Gewicht und Betrag der Schätzung** zu nennen. Sie steht
da. Behauptet hatte sie **niemand**:

| Wer hinsah | Was er verlangte |
|---|---|
| `flaechenbefund` | irgendwo in der Datei die Worte „aus der Warengruppe" |
| `test/sperrguteinstufung.test.js` | **eine** von 46 Seiten, und nur den ersten Halbsatz |
| — | die 7,50 €, die der Kunde je Position zahlt: **nichts** |

> **Eine Abhilfe, die nur der Erzeuger kennt, hält so lange wie seine Vorlage.**

`blockquellenbefund` hält seither jede Zahl des Blocks gegen ihre Quelle: das
Gewicht gegen das Positionsgewicht auf dem Lieferschein, den Betrag gegen
Quelle **und** Stand — ein Frachtsatz altert. Gemessen: 26 Blöcke, 29 Zahlen
mit Quellenpflicht.

---

## Zwei eigene Fehler, beide von der Gegenprobe gefunden

**Die Quelle des Gewichts sprang für den Betrag ein.** Die erste Fassung prüfte
gegen den ganzen Block, und der trägt zwei Quellen. Die Gegenprobe nahm dem
Betrag seine — der Prüfer blieb grün und fand die des Gewichts ein paar Zeilen
darüber.

> **Eine Quelle gehört zu ihrer Zahl, nicht zu ihrem Absatz.**

Gesucht wird seither der Satz, in dem die Zahl steht, und die Quelle darin.

**Und dann meldete der Prüfer sechsundzwanzig Fundstellen und endete mit null.**
Die neue Prüfung druckte ihre Meldungen und rührte den Ausgang nicht an; sie
stand nicht in der Zeile, die über rot und grün entscheidet. Gesagt hat es
wieder die Gegenprobe: *„meldete trotz Mutation grün"* — während die Meldungen
eine Zeile darüber standen.

> **Ein Befund, der niemanden aufhält, ist eine Bemerkung.**

---

## Was diese Runde nicht ist

Sie ist **kein Fund am Shop**. Die Seiten waren richtig, bevor ich hinsah, und
sie sind es danach. Was sich geändert hat, ist, dass es jetzt jemand misst —
und dass drei Messungen weniger wert waren als die vierte.
