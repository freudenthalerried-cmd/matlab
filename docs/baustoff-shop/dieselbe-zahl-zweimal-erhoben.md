# Dieselbe Zahl zweimal erhoben

**9. September 2026, nachmittags.** Gesamtlauf nach fünf Runden: **44 von 48
Schritten grün, 39 Minuten.** Ein echter Befund:

```
✗ pruefe-schaufenster: Ausgang 1
    ✗ Prüfer ohne Browser [veraltet]
      die Beschreibung sagt 39, gemessen sind 40 (src/pruefregister.js)
```

Die PR-Beschreibung nennt die Zahl der Prüfer. Vorgestern waren es 39; die
Runde „Ein rundes Maß auf der Startseite" hat `pruefe-sinnbilder` dazugebaut
und die Beschreibung nicht nachgezogen.

**Das ist dieselbe Sorte wie vor sechs Runden** — damals „über 1.000
Testfälle" bei 2009. Und wieder hat es der Gesamtlauf gefunden, nicht der
Commit.

---

## Die Entscheidung war richtig gerechnet und an der falschen Zahl

Am Vormittag stand hier, gemessen und begründet:

> `pruefe-tests` **215 ms** → in den Haken.
> `pruefe-schaufenster` **22.955 ms** → bleibt draußen, es verdoppelte jeden
> Commit.

Die Rechnung stimmte. Nur habe ich nicht gefragt, **woraus** die 23 Sekunden
bestehen. Nachgemessen:

| | Dauer |
|---|---|
| `pruefe-schaufenster` vollständig | **24.763 ms** |
| dasselbe ohne den Testlauf | **677 ms** |

**97 % sind ein einziger Aufruf:** `node --test`, um die Zahl der Testfälle zu
zählen — unmittelbar nachdem der Haken `npm test` hat laufen lassen.

> **Dieselbe Zahl zweimal zu erheben kostet 24 Sekunden und bringt nichts.**

---

## Was daraus folgt

`--testfaelle=N` nimmt die Zahl entgegen, statt sie noch einmal zu erheben.
Der Haken hält die Ausgabe seines eigenen Testlaufs fest und reicht sie
weiter — **0,6 s statt 24.**

Zwei Sicherungen, damit die Abkürzung keine Lücke wird:

- **Ohne Angabe läuft er wie bisher.** Ein Lauf von Hand darf nicht davon
  abhängen, dass jemand eine Zahl mitgibt.
- **Eine unbrauchbare Angabe ist ein Abbruch**, kein stilles Zurückfallen auf
  den eigenen Lauf. Sonst sähe „die Zahl war Unsinn" aus wie „die Zahl war
  richtig". Nachgemessen: `--testfaelle=0` → Ausgang 2.

Erfinden lässt sie sich nicht: Der Haken gibt weiter, was der Testlauf eine
Zeile vorher gemeldet hat. Die Zahl stammt aus dem Lauf, der ohnehin über
denselben Bestand ging.

---

## Was der Lauf sonst sagt

**44 von 48 grün, einer nicht messbar** — `pruefe-gebinde`, seit dem
8. September ohne `preise/poschacher-positionen.csv`. *Was nicht gemessen
wurde, ist nicht geprüft.*

Die drei roten Gegenproben hängen alle am selben veralteten Wert: An einem
Prüfer, der schon vorher rot ist, lässt sich nichts zeigen. Mit der
nachgezogenen Zahl sind sie wieder messbar.

Alles andere hielt: 2651 Verweise, 82 Seiten im Telefonrahmen, 56
Shopszenarien, 31 Gates, 30 Zahlen der Inhaltsseiten gegen ihre Fundstelle,
und die vier Regeln der letzten fünf Runden — Gruppentexte, Paketgrößen,
Sinnbilder, Artikelseiten — liefen zum ersten Mal im Gesamtlauf mit und
meldeten nichts.
