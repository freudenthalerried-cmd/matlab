# Die Seite versprach eine Palette, die Rechnung kennt keine

**9. September 2026.** Vier Runden am Prüfwerk; diese eine wieder am Laden.
Gelesen habe ich die sieben **Gruppenseiten** — die Flächen, auf die die
Kopfleiste zeigt und über die ein Kunde ins Sortiment kommt.

Auf der Mörtelseite steht unter **Bestellhinweis**:

> „Mörtel wird palettenweise geliefert."

Alle drei Mörtelartikel sind `sperrgut: false`. **Auf keinen fällt ein Kranhub
an**, verkauft werden sie sackweise, und die Rechnung weist keine Palette aus.

> **Die eine Gruppenseite mit der stärksten Palettenaussage war die einzige
> Gruppe, in der kein Artikel als palettiert gilt.**

---

## Gemessen, nicht überflogen

Sieben Gruppentexte, jeder gegen die Einstufung seiner eigenen Artikel:

| Seite | palettiert | Aussagen über Lieferung |
|---|---|---|
| `daemmung.md` | 9 von 9 | 0 |
| `kamin.md` | 9 von 9 | 0 |
| `kanal.md` | 6 von 6 | 0 |
| `mauerwerk.md` | 1 von 1 | 5 |
| **`moertel.md`** | **0 von 3** | **2** |
| `wdvs.md` | 0 von 11 | 0 |
| `zubehoer.md` | 0 von 7 | 0 |

Die Einstufung entscheidet **7,50 € je Position** auf der Kundenrechnung. Sie
ist geschätzt — aus der Warengruppe, nicht aus einer Angabe des Lieferanten —,
und genau deshalb darf keine Fläche sie anders behaupten als die nächste.

**Sieben Gruppentexte sind von Hand geschrieben, und kein Prüfer hielt sie je
gegen den Katalog.**

---

## Was geändert ist

**Mörtel** sagt jetzt, was der Shop tut und was er nicht weiß:

> Wir rechnen Mörtel **nicht** als palettierte Ware ab: Auf die drei
> Positionen dieser Gruppe fällt kein Kranhub an, und bestellt wird sackweise.
> Diese Einstufung folgt aus der Warengruppe und nicht aus einer Angabe des
> Lieferanten — sie ist geschätzt, **in diese Richtung wie in die andere.** Ob
> er die Säcke trotzdem auf einer Palette anliefert, steht nicht fest; die
> Frage ist an ihn gestellt.

Der brauchbare Teil des alten Hinweises — eine angebrochene Palette lohnt
nicht — steht weiter da, jetzt als Mengenrat statt als Lieferzusage.

**Mauerwerk** stand richtig (1 von 1 palettiert), sagte es aber als Tatsache.
Die Artikelseite nennt seit dem 5. September die Herkunft der Schätzung, die
Gruppenseite nicht — dieselbe Lücke, die vor zwei Runden in `llms.txt` steckte,
eine Fläche weiter. Und sie schrieb „Stückzahl, **aufgerundet auf volle
Paletten**": eine Regel, die dieser Shop nicht anwendet — verkauft wird
stückweise, und die Kasse verlangt keine Palette.

---

## Die Regel, die es künftig hält

`gruppentextbefund` an `pruefe-sperrgut`: Sagt ein Gruppentext eine palettierte
Lieferung zu, muss mindestens ein Artikel dieser Gruppe so eingestuft sein.

**Gesucht wird die Zusage, nicht das Wort.** `moertel.md` rät unter
„Bodenfeuchte" richtig, die Säcke *auf der Palette* stehen zu lassen — ein
Lagerhinweis, keine Zusage. Ein Prüfer, der ihn meldete, machte Lärm, und ein
Prüfer, der Lärm macht, wird ruhiggestellt statt befolgt. Ein eigener Testfall
hält diese Grenze.

**Und ein Abbruch statt eines stillen Durchgangs:** Eine Gruppendatei ohne
Entsprechung im Katalog fände eine leere Artikelliste und ginge als „keine
Zusage" durch. Sie beendet den Lauf mit Ausgang 2. *Nicht messbar ist nicht
grün.*

---

## Das bestehende Register hat meine eigene Änderung gefangen

`OHNE_HERKUNFT` führt Flächen, die das Wort ohne Herkunftsangabe tragen
dürfen — mit Grund. `site/gruppe/mauerwerk.html` stand darin, weil das Etikett
kurz sein durfte, solange die Erklärung auf der Artikelseite stand.

Mit meiner Änderung trägt die Seite die Herkunft selbst. Der Prüfer meldete:

```
✗ site/gruppe/mauerwerk.html: als Ausnahme geführt, trägt das Wort
  aber nicht (mehr) ohne Herkunft  (ausnahme-ohne-fall)
```

> **Die zweite Richtung eines Registers meldet sich auch dann, wenn die
> Änderung eine Verbesserung war.** Ein Freibrief ohne Fall ist ein Freibrief,
> der beim nächsten Mal etwas deckt.

Eintrag gestrichen, mit dem Grund für die Streichung.

**Gezeigt, dass die neue Regel anschlägt:** Den alten Satz zurückgesetzt und
neu gebaut — `lieferaussage-ohne-einstufung`, „keiner der 3 Artikel dieser
Gruppe ist so eingestuft". 4 neue Testfälle, Gegenprobe
`die-gruppenseite-verspricht-eine-palette` im Register.
