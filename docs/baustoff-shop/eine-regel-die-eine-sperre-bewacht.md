# Eine Regel, die eine Sperre bewacht

**14. September 2026, abends.** Die Regelzählung ist an dem Punkt, an dem jede
weitere Stelle einen eigenen Testfall kostet. Diese Runde hat neun davon
geschrieben und dabei etwas gefunden, das kein Testfall lösen kann.

## Sieben Regeln, die jetzt gesehen sind

Ausgewählt nach einem Maßstab: **was der Kunde davon hat.**

* **`src/sitemapstand.js`** (2) — ein `lastmod`, das kein Datum ist, und eines,
  das nach heute liegt. Beides liest kein Mensch, sondern ein Crawler: Ein
  Datum in der Zukunft ist für ihn kein Tippfehler, sondern die Ansage „diese
  Seite ist neuer als alles, was du kennst".
* **`src/bestellfelder.js`** (2) — ein Feld ohne Beschriftung ist eine Zeile,
  die niemand ausfüllen kann; ein Feld **ohne Wirkung** ist eine Angabe, die
  der Beleg braucht und die niemand einfordert.
* **`src/anfragelesen.js`** (1 von 3) — eine Menge, die aus der erzeugten Zeile
  nicht zurückkommt.

## Und zwei, die kein Testfall zeigen kann

Die beiden anderen Regeln des Rückwegs — `menge-kommt-anders-zurueck` und
`krummer-betrag-wird-uebernommen` — ließen sich nicht zum Feuern bringen. Der
Grund ist nicht Nachlässigkeit, sondern ihr Gegenstand: **Sie bewachen ein
Paar.**

Der Rückweg schreibt eine Belegzeile und liest sie mit demselben Leser zurück,
den ein Kunde bekommt. Damit eine *falsche* Menge zurückkommt, müsste der
Leser sie annehmen — und er weist jede Zeilensumme ab, die um mehr als einen
halben Cent von einem ganzen Gebinde abweicht.

> **Eine Regel, die eine zweite Sperre bewacht, schweigt, solange die erste
> hält — und wird gebraucht, wenn jemand die erste lockert.**

Gemessen statt behauptet: Mit abgeschalteter Cent-Prüfung feuern **beide
sofort**. Sie stehen deshalb mit diesem Grund in `REGEL_GEPRUEFT` — den ersten
beiden Einträgen, die dieses Register überhaupt bekommt —, und die neue
Gegenprobe `der-leser-nimmt-jede-zeilensumme-hin` schaltet genau diese Sperre
ab.

Was dabei auf dem Spiel steht, sagt die Regel selbst: Kommt eine andere Menge
zurück, als bestellt wurde, **nennt der Beleg eine andere Ware als die
bestellte** — und in Geld ist der Unterschied kleiner als ein Cent. Auf der
Baustelle sind es Platten.

## Warum das kein Schlupfloch ist

Ein Register für „kann man nicht sehen" ist die Stelle, an der eine Zählung
weich wird. Zwei Dinge halten es hart:

1. Der Grund muss sagen, **warum nicht** — nicht, dass es mühsam wäre. Beide
   Einträge nennen die Sperre, die schweigen lässt, und die Messung, die zeigt,
   dass es ohne sie anders wäre.
2. Der Prüfer geht **beide Richtungen**: Wird eine dieser Regeln eines Tages
   doch gesehen, meldet er den Eintrag als gegenstandslos.

## Stand

| | |
|---|---|
| Regelstellen nie gesehen | 43 → **38** von 486 |
| begründet ungesehen | 0 → **2** |
| an einem Tag | 80 → 67 → 56 → 47 → 43 → 38 |
| Prüfer grün | 55 |
| Testfälle | 2 623 |
| Gegenproben | **306** |

## Was diese Runde nicht erreicht hat

36 Stellen bleiben ungesehen und ungeführt. Ob unter ihnen weitere sind, die
eine zweite Sperre bewachen, ist nicht gemessen — gefunden habe ich diese
beiden, weil ich versucht habe, sie zum Feuern zu bringen, und gescheitert
bin.

> **Eine Regel, die sich nicht zeigen lässt, ist entweder falsch oder sie
> bewacht etwas. Welches von beidem, sagt nur der Versuch.**
