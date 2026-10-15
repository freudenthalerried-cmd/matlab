# Die Warnung erreichte alles außer der Stelle, an der entschieden wird

**9. September 2026.** Nach Gruppen-, Wissens- und Startseite die
**Artikelseiten** — 46 Stück, die meistbesuchte Fläche des Shops und das Ziel
der bezahlten Anzeigen.

Die Systemtreue — *die Schichten eines Aufbaus gehören zu einem System* —
stand an diesem Morgen an drei Stellen:

| Fläche | seit |
|---|---|
| die Kasse (`shop.js`), als Warnung im Warenkorb | 8. September |
| `llms.txt`, für den Assistenten | 9. September, vormittags |
| `wissen/wdvs-systemaufbau.html` | länger |

Und auf **keiner einzigen der 46 Artikelseiten**.

> **Die Warnung erreichte die Maschine und den Warenkorb, nicht die Stelle, an
> der entschieden wird.**

Wer über eine Anzeige auf „Mantelstein MSTS EZ 16-18 SIKM" kommt, legt ihn
dort in den Warenkorb. Die Seite nannte den Hersteller im Merkblattverweis und
verlinkte die Systemliste — sie sagte nicht, dass diese Position eine
**Schicht** ist und dass ein Austausch die geprüfte Zusammenstellung verlässt.

---

## Was jetzt dort steht

Auf zehn Artikelseiten, abgeleitet aus `einordnung` und nicht geschrieben:

> **Mantelstein des Systems Schiedel Österreich.** Die Schichten eines Aufbaus
> gehören zu **einem** System: Wer diese Position mit der gleichen Schicht
> eines anderen Herstellers ersetzt, verlässt die geprüfte Zusammenstellung.
> Welche Zusammenstellung geprüft ist, steht in den Systemunterlagen des
> Herstellers.

**Nur dort, wo es zutrifft.** Dübel, Rondellen, Kantenschutz und Zubehör
tragen eine eigene Zulassung und bekommen den Satz nicht — von ihnen eine
Systemtreue zu verlangen hieße, eine zu behaupten, die es dort nicht gibt.
`POS-18110` (Mantelsteinkleber) bekommt ihn auch nicht: Sein System ist
unbekannt und steht als offene Frage beim Lieferanten.

---

## Die Regel, in beide Richtungen

`artikelseitensystembefund` an `pruefe-systemtreue`, hinter derselben
Frischeprüfung: **Jede systemgebundene Schicht muss ihr System auf ihrer
eigenen Seite nennen.**

- **10 von 10** Artikelseiten gelesen, 0 Meldungen.
- Fehlt eine gebaute Seite, meldet die Regel `artikelseite-fehlt` statt zu
  schweigen — *eine fehlende Seite ist kein Beleg dafür, dass der Satz dort
  steht.*
- Ein Artikel ohne Schicht oder ohne erkennbares System wird nicht verlangt;
  ein eigener Testfall hält diese Grenze.

**Gezeigt, dass sie anschlägt:** den abgeleiteten Satz abgeschaltet und neu
gebaut — **zehn Meldungen**, jede mit Nummer, Schicht und System:

```
✗ POS-10837 ist Mantelstein des Systems Schiedel Österreich und sagt es
  auf seiner eigenen Seite nicht — dort wird die Schicht ausgewählt,
  und dort landen die Anzeigen
```

---

## Zwei Verdachtsmomente, die keine waren

Beim Lesen der Artikelseite fiel mir zweierlei auf, und beides hielt der
Prüfung nicht stand:

**„Lieferantennummer" ohne Wert.** Im ausgelesenen Text stand die
Beschriftung ohne Zahl daneben — auf 46 von 46 Seiten. Im Markup ist es kein
leeres Feld, sondern eine **Unterzeile**: Beschriftung „Artikelnummer", Wert
„10837", Erläuterung „Lieferantennummer". Dieselbe Form wie „Gewicht — liegt
uns nicht belegt vor".

**Die Beträge bei „Abgabe ab".** Achtzehn Zeilen nennen Menge und Betrag;
nachgerechnet stimmen alle achtzehn auf den Cent, und jede Menge ist der
tatsächliche Mengenschritt.

> **Ein Verdacht, der sich nicht bestätigt, gehört genauso aufgeschrieben wie
> einer, der sich bestätigt** — sonst sieht die nächste Runde dieselbe Stelle
> an und misst sie noch einmal.
