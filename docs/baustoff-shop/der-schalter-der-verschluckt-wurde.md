# Der Schalter, der verschluckt wurde

**13. September 2026. Runde 69.**

Die Regel der Vorrunde lautete: *der Weg, den keine Probe fährt, ist der, auf
dem die Fehler liegenbleiben.* Diese Runde hat den letzten unbefahrenen Weg
genommen — die **Absage** — und dabei zwei Funde gemacht.

## Erster Fund: der eingetippte Grund kam nirgends an

Der Aufruf, den ein Betreiber schreiben würde:

```
$ npm run vorgang -- … --stufe absage --grund "Baustelle außerhalb des Liefergebiets" --ablegen
Abgelegt: absage als lfd. 1
```

Auf dem Brief stand:

> *Vielen Dank für Ihre Anfrage. Wir können sie derzeit nicht annehmen:*
> *· Eine Angabe fehlt oder ist nicht lesbar.*
> *Was Sie tun können: · Bitte ergänzen Sie sie und schicken Sie die Bestellung
> noch einmal.*

> **Der Kunde bekäme die Aufforderung, dieselbe Bestellung noch einmal zu
> schicken — und dieselbe Absage zurück.** Der Grund, den der Betreiber
> eingetippt hat, stand weder auf dem Papier noch im Journal.

**Das ist kein Fehler der Absage.** `src/absage.js` erfindet keine Gründe: Es
übersetzt die, die `darfVorgangLaufen` und `pruefeBestelldaten` ohnehin
ausrechnen, und gibt jedem einen Satz an den Kunden. Das ist sein ganzer Zweck.

Der Fehler war, `--grund` **stillschweigend fallen zu lassen** — ein Schalter,
den die Gutschrift verlangt und den die Absage nicht kennt.

> **Ein Werkzeug, das eine Angabe ignoriert, statt sie abzulehnen, lässt den
> Aufrufer glauben, sie sei angekommen.**

Jetzt:

```
Abbruch: `--grund` gehört zur Gutschrift, nicht zur Absage.
Die Absage erfindet keine Gründe: Sie übersetzt die, die der Bestand ausrechnet…
Ohne --grund aufrufen. Was der Brief sagen wird, steht vorher auf dem Bildschirm.
```

## Zweiter Fund: die halbe Zahl

Am 12. September kam der Abgleich „dieselbe Zahl steht zweimal" — einmal in
der Journalzeile, einmal auf dem Papier. Er verglich den **Brutto**betrag.

Gemessen an der Akte, die `npm run bestellprobe` baut:

| Papier | netto | brutto |
| --- | --- | --- |
| `auftragsbestaetigung` | 1.323,34 € | 1.588,01 € |
| **`lieferantenbestellung`** | **924,52 €** | **—** |
| `rechnung` | 1.323,34 € | 1.588,01 € |
| `gutschrift` | −1.323,34 € | −1.588,01 € |

> **Die Lieferantenbestellung trägt als einzige Zahl den Einkaufswert netto —
> und genau die wurde nie gegeneinander gehalten.** Wer sie in einem
> Texteditor in der Journalzeile ändert, bekam ein Journal, das sauber
> zurückliest.

Bei den übrigen Papieren ist der Nettobetrag die **Bemessungsgrundlage der
Umsatzsteuervoranmeldung**. Der Fund vom 12. September war damit zur Hälfte
abgesichert.

Neu: `nettobetrag-weicht-ab`. Gemeldet wird ohne den Betrag — ein Prüfer, der
Zahlen protokolliert, verlegt sie an einen dritten Ort.

## Die Probe fährt jetzt auch das Nein

```
Bestellprobe — 17 Prüfungen von Klick bis Sicherung
  …
  ✓ Die Absage geht als eigener Vorgang hinaus und nennt ihren Grund
  ✓ Ein Schalter, den die Absage nicht kennt, wird abgelehnt statt verschluckt
```

Die Absage bekommt einen **eigenen Vorgang**, und das ist keine Krücke: Seit
heute früh schließen Absage und Auftragsbestätigung einander aus (AGB Punkt 2),
und der Abzweig heißt „Der Fall kommt nicht zustande".

Geprüft wird dabei nicht der Wortlaut des Grundes, sondern dass der Brief
**einen nächsten Schritt** nennt und sagt, dass kein Vertrag zustande gekommen
ist. Eine Absage ohne nächsten Schritt ist bei einem Kunden, der schon bestellt
hat, teurer als bei einem Besucher.

Und der Buchhaltungsschritt zählt jetzt **drei** Papiere ohne Umsatz:
Auftragsbestätigung, Lieferantenbestellung und Absage.

## Ausgang

| | |
| --- | --- |
| Prüfungen der Bestellprobe | 15 → **17** |
| Papierarten mit Durchgang | 6 → **6 von 6, plus den Abzweig** |
| Neue Regel | `nettobetrag-weicht-ab` |
| `--stufe absage --grund` | wird abgelehnt statt verschluckt |
| Testfälle | 2.455 → **2.456** |
| Gegenproben | 249 → **251** |

---

**Die Regel dieser Runde:** *Ein Schalter, den ein Werkzeug nicht kennt, muss
abgelehnt werden — angenommen und weggeworfen ist er eine Zusage, die niemand
einlöst.*
