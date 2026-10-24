# Ein Satz, den das Werkzeug nicht hielt

**11. September 2026. Runde 36.**

## Der Fund

Die Rechnungsstufe von Runde 31 druckte, wenn man sie ohne `--ablegen` ruft:

> *Mit `--ablegen` wird sie gezogen und der Beleg ins Journal geschrieben.*

Das stimmte nicht. Die Stufe endete vor der Ablage — **mit** `--ablegen` tat
sie genau dasselbe wie ohne, nur ohne diesen Satz.

> **Eine Zusage über den eigenen Betrieb ist teurer als eine falsche Zahl.**
> Wer sie liest, legt ab und sieht nicht nach.

Schlimmer noch: Der Lauf verlangte mit `--ablegen` die Rechnungsnummer als
Pflichtangabe — also genau dann, wenn er sie gleich selbst gezogen hätte.
Ablegen war damit nicht bloß wirkungslos, sondern unmöglich.

## Zwei weitere, die dabei herausfielen

**Der Nettobetrag.** `erzeugeRechnung` gab `bruttobetrag` zurück und
`nettobetrag` nicht — als einzige der drei Belegarten. Die Ablage schrieb
daraufhin `betragNetto: null`.

> **Von drei Belegarten führte ausgerechnet die eine, die in die
> Steuererklärung geht, ihren Nettobetrag nicht mit.**

Diese Spalte ist die Bemessungsgrundlage der Umsatzsteuervoranmeldung. Der
Steuerberater bekäme eine Zeile ohne die Zahl, um die es ihm geht.

**Der Belegtext in der Akte.** `stelleRechnungAus` schrieb `text:
rechnung.text` — den **ganzen** Rechnungstext ins Journal. `bin/vorgang.mjs`
schreibt seit dem 4. September bei Angebot und Auftragsbestätigung
ausdrücklich dazu, warum das nicht geht: *Was hier steht, steht sieben Jahre;
der volle Text enthält die Anschrift des Kunden ein zweites Mal und gehört in
den Beleg, nicht ins Journal.*

> **Eine Regel, die für zwei von drei Belegarten gilt, ist keine Regel über
> die Ablage, sondern eine über zwei Belegarten.**

Und ein Testfall sicherte das zu: `assert.equal(a.eintraege[0].text,
vollstaendig.text)`. Wieder einer, der ein Leck festhält.

## Was geändert wurde

Die Reihenfolge ist jetzt die eines Menschen: **erst die Nummer ziehen, dann
den Beleg damit bauen, dann prüfen, dann ablegen.** Vorher war sie unmöglich —
eine Rechnung ohne Nummer ist nach § 11 Abs 1 Z 3 UStG nicht vollständig, und
ohne Vollständigkeit wies `stelleRechnungAus` sie ab. Ein Kreis, aus dem kein
Aufrufer herauskam; deshalb hatte ihn auch nie einer betreten.

Gedruckt wird seither **der Beleg, der abgelegt wurde** — der erste Wurf
druckte die Fassung ohne Nummer und legte die mit ab. Zwei Papiere für einen
Geschäftsfall, und das gedruckte trug an der Stelle der Nummer eine
Lückenmarke.

Und die Nummer wird **einmal** gezogen: Der zweite Wurf verließ sich darauf,
dass der Beleg seine Nummer mitführt; er tut es nicht, und die Ablage zog
daraufhin eine zweite — gedruckt `RE-2026-0001`, im Journal `RE-2026-0002`.
Derselbe Fehler, gegen den der Absatz darüber geschrieben war, zwei Zeilen
später.

## Ausgang

| | |
| --- | --- |
| `--ablegen` bei der Rechnung | wirkungslos → **legt ab** |
| Nettobetrag im Journal | `null` → **gerechnet** |
| Belegtext im Journal | ganzer Text → **Betreff** |
| Nummern je Rechnung | 2 → **1** |
| Testfälle | 2359 grün |
| Gegenproben | 201 → **203** |

## Was daraus offen bleibt

Ein Rest, der jetzt sichtbar ist: `alsCsv` — der Auszug für die Buchhaltung —
steht im Ausgangsverzeichnis unter „an: Buchhaltung" und wird von keinem
Befehl erzeugt. Der Grund dafür lautet „eine Buchhaltung, die etwas abholt",
und der trägt vorerst: Solange keine Rechnung wirklich gestellt ist, gibt es
nichts abzuholen. Ab der ersten wird er zu prüfen sein.

---

**Die Regel dieser Runde:** *Ein Satz, den ein Werkzeug über sich selbst
druckt, ist eine Zusicherung — und gehört geprüft wie jede andere.*
