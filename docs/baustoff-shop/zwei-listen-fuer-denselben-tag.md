# Zwei Listen für denselben Tag

**11. September 2026. Runde 34.**

## Was gemessen wurde

Die Runde davor hat `src/tagx.js` gebaut: die Angaben, die der Auftraggeber
noch schuldet, je mit einer Probe und mit dem, was daran hängt. Fünf Felder.

`bin/bestellprobe.mjs` schrieb sich seit dem **4. September** eine eigene
Betreiberdatei für denselben Tag — mit eigener Begründung im Kommentar:

```js
email: 'office@example.at',
rechtstexteFundstelle: 'Kanzlei X, Fassung vom 4.9.2026',
antwortzeitWerktage: 1,
```

Drei Felder gegen fünf. Und das dritte stand in der neuen Liste **gar nicht**.

> **Zwei Listen über denselben Tag sind zwei Antworten, sobald eine Angabe
> dazukommt.**

Nachgezählt an der Betreiberdatei selbst: **neun leere Felder**, fünf in der
Liste, **vier in keiner**.

## Die vier, und warum sie sich unterscheiden

| Feld | wohin es gehört |
| --- | --- |
| `antwortzeitWerktage` | **in die Liste** — es geht mit den Betreiberdaten in `shop.js` und steht nach dem Absenden in der Rückmeldung |
| `zahlungsanbieter` | ohne Bauwirkung: eine Entscheidung, die Geld kostet und im **Ablauf** wirkt, aber im gebauten Shop keine Zeile ändert |
| `domainZeigtAufShop` | ohne Bauwirkung: eine Bestätigung über die Welt, die man am Browser sieht und nicht am Bau |
| `repositoryPrivat` | ebenso — und die einzige, die `npm run startklar` **gegen** die Angabe misst |

Die zugesagte Antwortzeit ist dabei die interessanteste: Sie ist die einzige
Zusage, die dieser Shop über den **eigenen Betrieb** macht — „wir melden uns
innerhalb von N Werktagen". Eine Zusage über den eigenen Betrieb ist teurer
als eine falsche Zahl, und sie stand in der kleineren der beiden Listen.

## Was geändert wurde

**Eine Liste.** `bin/bestellprobe.mjs` nimmt jetzt `betreiberAmTagX`. Kommt
eine siebte Voraussetzung dazu, fährt die Probe sie mit, ohne dass jemand
daran denkt.

Dabei fiel gleich die nächste doppelte Zahl auf: Die Probe prüfte ihre eigene
Rückmeldung gegen `/1 Werktag/` — die Zahl, die sie selbst eingesetzt hatte.
Mit der gemeinsamen Liste kommt sie von dort, und eine zweite Fassung
derselben Zahl wäre genau die Sorte Fehler, wegen der die Listen zusammengelegt
wurden.

**Und die Gegenrichtung:** `betreiberbefund` fragt jedes leere Feld der
Betreiberdatei, wo es hingehört — offene Angabe oder begründet ohne
Bauwirkung. Ein Feld in beiden Listen ist ein Befund, eine Angabe ohne Feld
auch. Und eine **volle** Betreiberdatei meldet sich ausdrücklich als nicht
sauber:

> *Kein leeres Feld mehr — dieser Befund prüft nichts, und das wäre eine gute
> Nachricht: Dann ist der Tag X da.*

Das ist die einzige Meldung dieses Bestandes, die man sich wünscht.

## Ausgang

| | |
| --- | --- |
| Listen für den Tag X | 2 → **1** |
| offene Angaben mit Probe und Wirkungsort | 5 → **6** |
| leere Felder ohne Platz | 4 → **0** |
| Testfälle | 6 neu, 2358 grün |
| Gegenproben | 199 → **200** |

## Was daraus offen bleibt

Nichts Neues. Die Unterscheidung aus der Runde davor hat eine dritte Stufe
bekommen: **Vier Angaben kosten einen Anruf, zwei kosten Geld** (Rechtstexte,
Zahlungsanbieter), **und zwei sind Bestätigungen über die Welt**, die niemand
liefern kann, sondern nur feststellen.

---

**Die Regel dieser Runde:** *Wer eine Liste baut, muss zuerst nachsehen, ob es
sie schon gibt — sonst hat er nicht eine Liste verbessert, sondern eine
zweite.*
