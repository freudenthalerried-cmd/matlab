# Vom Klick bis zur Rechnung

**11. September 2026. Runde 35.**

## Was gemessen wurde

`npm run bestellprobe` fährt seit dem 4. September den Weg vom Klick bis zum
Angebot: Kasse im Browser, Empfangsskript in PHP, Zeile in der Ablage,
Posteingang, Beleg. Sechs Prüfungen, alle grün.

Dabei baut sie die Seiten mit einer **Betreiberdatei des Tages X** — der Weg
ist heute aus, und die Probe prüft, was an dem Tag geschieht, an dem er an
ist. Die **Belege** ließ sie gegen die echte Datei laufen: eine ohne E-Mail,
ohne Telefon, ohne UID.

> **Eine Probe mit zwei Ständen desselben Betriebs prüft keinen von beiden
> ganz.**

Aufgefallen ist es nicht, weil das Angebot beides nicht braucht. Die Rechnung
schon: Die UID des Ausstellers ist Pflichtangabe nach § 11 Abs 1 Z 6 UStG.

## Was geändert wurde

**Ein Stand.** Die Belege laufen jetzt gegen dieselbe Datei wie der Bau.

**Und ein siebter Schritt: die Rechnung.** Die Betriebskette führt neun
Schritte; das Angebot ist der dritte, die Rechnung der achte. Sie hat seit
gestern ein Werkzeug, und das bricht heute zu Recht ab. Mit der Betreiberdatei
des Tages X fällt die Sperre — und damit läuft die **Papierkette zum ersten
Mal ganz durch**:

```
✓ Der Klick legt die Bestellung in den Warenkorb
✓ Das Empfangsskript nimmt sie an und vergibt eine Nummer
✓ Die Ablage liegt außerhalb des Webverzeichnisses
✓ In der Ablage: B-2026-0001, Musterbau GmbH, Positionsliste
✓ Der Stempel nennt den Geschäftstag
✓ Aus dem Journal entsteht über posteingang und vorgang ein Angebot
✓ Am Tag X entsteht aus derselben Bestellung eine Rechnung nach § 11 UStG
```

Geprüft wird dabei nicht, dass irgendein Papier herauskommt, sondern dass es
die Pflichtangaben trägt: Lieferdatum, Steuersatz und die UID des Ausstellers
— letztere gegen die Zahl aus `betreiberAmTagX` und nicht gegen eine zweite
Fassung derselben Zahl.

## Was die Probe ausdrücklich nicht beweist

Die Kette hat neun Schritte, und drei davon geschehen **in der Welt**:
Zahlungseingang, Bestellung beim Lieferanten, Lieferung auf die Baustelle. Die
Probe setzt Lieferdatum und Zahlungseingang selbst — in der Wirklichkeit
stellt sie der Betreiber fest, und genau deshalb sind es Argumente und keine
Vermutung.

> **Was hier durchläuft, ist die Papierkette. Die Betriebskette sagt weiter,
> wo sie die Welt braucht — und dort steht sie unverändert still.**

Die Ausgabe der Probe sagt das jetzt in zwei Zeilen mit.

## Ausgang

| | |
| --- | --- |
| Prüfungen der Bestellprobe | 6 → **7** (Mindestmaß mitgezogen) |
| Betreiberstände in einem Lauf | 2 → **1** |
| Schritte der Papierkette, in einem Befehl belegt | Klick → **Rechnung** |
| Testfälle | 2358 grün |
| Gegenproben | 200 → **201** |

## Was daraus offen bleibt

Nichts Neues. Die drei Schritte in der Welt bleiben, was sie sind — und die
Rechnung bleibt gesperrt, bis die UID kommt. Neu ist nur, dass der Weg
dahinter **einmal gefahren** worden ist statt bloß gebaut.

---

**Die Regel dieser Runde:** *Zwei Stände desselben Betriebs in einem Lauf sind
kein Vergleich, sondern eine Lücke mit zwei Hälften.*
