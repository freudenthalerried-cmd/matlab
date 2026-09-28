# Der Brief ohne Datum

**13. September 2026. Runde 68.**

## Der Anlass: das sechste Papier

Die Betriebskette hat sechs Papierarten. `npm run bestellprobe` — der eine
Lauf, der den ganzen Weg mit echtem PHP, echtem Browser und echter Akte fährt
— fuhr fünf davon. Es fehlte ausgerechnet die **Lieferantenbestellung**: der
Schritt, an dem Geld aus dem Haus geht und den Gate 20 bewacht.

> **Damit hatte die eine Probe, die den ganzen Weg fährt, noch nie einen
> Einkaufswert in der Akte.** Die Regel vom 12. September — nur Rechnung und
> Gutschrift sind ein Umsatz, die Lieferantenbestellung trägt die **Ausgabe**
> — war im Durchgang nie geprüft worden, obwohl sie der gefährlichste Punkt
> des Buchhaltungsauszugs ist.

Fahrbar ist der Schritt überhaupt erst seit gestern: Ohne Auftragsbestätigung
in der Akte bricht er ab.

## Der Fund, beim ersten Durchlauf

```
✗ die gebaute Akte hält dem Prüfer nicht stand:
  ✗ LB-2026-9001-01.txt: der Zeitpunkt der Journalzeile steht nicht auf dem
    Papier — § 131 Abs 1 Z 2 BAO verlangt die Zeitfolge, und sie steht hier
    zweimal verschieden  [zeitpunkt-weicht-ab]
```

Nachgesehen: **Die Bestellung trägt kein Datum.** Nirgends auf dem Blatt.

Den Prüfer, der das meldet, gibt es seit dem 12. September, und er hatte
recht. **Gefragt hatte ihn nur nie jemand**, weil eine Lieferantenbestellung
in keiner durchgefahrenen Akte lag.

## Schwerer als die Formalie

Auf dem Blatt stand:

> *Gewünschte Lieferzeit: 6 Werktage **ab heute**. Bitte den Termin
> bestätigen — wir haben ihn dem Endkunden gegenüber zugesagt.*

„Heute" ist der Tag, an dem jemand das Blatt liest. Das Papier liegt sieben
Jahre in der Akte (§ 132 BAO).

> **Bleibt die Ware aus und fragt jemand, ab wann die sechs Werktage liefen,
> sagt das Papier es nicht.**

Und der Termin ist keine Nebensache: Die Auftragsbestätigung sagt ihn dem
Kunden gegenüber zu, und die Bestellung ist das Papier, mit dem er beim
Lieferanten angefordert wurde. § 212 UGB verlangt die Wiedergabe der
abgesendeten Geschäftsbriefe — ein Brief ohne Datum lässt sich keiner Frist
zuordnen.

## Was jetzt gilt

```
Bestellung 2026-9001-01
Bestelldatum: 2026-09-13

…
Gewünschte Lieferzeit: 6 Werktage ab Bestelldatum. Bitte den Termin
bestätigen — wir haben ihn dem Endkunden gegenüber zugesagt.
```

Das Datum wird **hereingereicht**, nicht im Beleg gelesen: Ein Papier, das
selbst auf die Uhr sieht, lässt sich nicht prüfen und nicht wiederholen —
dieselbe Regel wie bei Angebot, Bestätigung und Rechnung. Fehlt es, steht dort
die sichtbare Lückenmarke statt einer stillen Leerstelle.

## Die Probe fährt jetzt alle sechs

```
Bestellprobe — 15 Prüfungen von Klick bis Sicherung
  …
  ✓ Die Auftragsbestätigung schließt den Vertrag und nennt das Konto
  ✓ Die Ware wird beim Lieferanten bestellt, mit Durchschrift in der Akte
  ✓ Am Tag X entsteht aus derselben Bestellung eine Rechnung nach § 11 UStG
  …
  ✓ Der Auszug für die Buchhaltung zählt nur Umsätze, und sie heben sich auf
  ✓ Die gebaute Akte hält npm run pruefe-ablage stand
```

Der Buchhaltungsschritt prüft seither auch die **Gegenseite**: zwei Papiere
ohne Umsatz in der Akte — die Auftragsbestätigung und die
Lieferantenbestellung mit ihrem Einkaufswert. Zählte die zweite mit, stünde
der Einkauf mit umgekehrtem Vorzeichen in der Umsatzsteuervoranmeldung.

## Ausgang

| | |
| --- | --- |
| Prüfungen der Bestellprobe | 14 → **15** |
| Papierarten im Durchgang | 5 → **6** von 6 |
| `erzeugeBestellungen` | nimmt `datum` entgegen |
| Testfälle | 2.454 → **2.455** |
| Gegenproben | 247 → **249** |

---

**Die Regel dieser Runde:** *Ein Prüfer, den nie jemand mit dem Ernstfall
gefüttert hat, ist kein geprüfter Prüfer — und der Weg, den keine Probe fährt,
ist der, auf dem die Fehler liegenbleiben.*
