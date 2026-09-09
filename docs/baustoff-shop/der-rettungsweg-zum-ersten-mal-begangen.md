# Der Rettungsweg, zum ersten Mal begangen

**9. September 2026, nachmittags.** Der Behälter wurde neu gestartet. Am
8. September hat genau das die Preisdatei gekostet.

Sie steht zu Recht in `.gitignore` — sie trägt die Einkaufskonditionen — und
lag damit in **einer** Kopie, in einem Verzeichnis, das jederzeit neu
aufgesetzt wird. Zurückgeholt wurde sie damals aus der gebauten Ausgabe:
`shop.js` trägt die Verkaufspreise, und mit der Zielmarge lässt sich der
Einkauf zurückrechnen.

Diesmal war sie noch da. **Aber der Rettungsweg war seit dem 8. September nie
wieder begangen worden** — und seither haben zwölf Runden an der gebauten
Ausgabe gearbeitet, darunter zwei, die das Format der Artikelzeilen geändert
haben.

---

## Nachgeprüft statt angenommen

Preisdatei beiseite, `npm run preise-wiederherstellen`, verglichen:

```
Original 46 Preise | wiederhergestellt 46
Einkaufspreis identisch: 46 von 46
```

**Auf den Cent, alle sechsundvierzig.** Danach das Original byteweise
zurückgelegt und gegen die Sicherung geprüft.

> **Ein Rettungsweg, den man nicht begeht, ist eine Behauptung über einen
> Rettungsweg.**

Er hätte in diesen zwölf Runden brechen können, ohne dass es jemand erfährt —
gebraucht wird er genau in dem Moment, in dem er fehlt, und dann ist Nachsehen
zu spät.

---

## Und woran er hängt

An einer Datei, die versioniert ist: `ausgabe/site/shop.js`.

> **Gebaute Ausgaben versioniert man normalerweise nicht.**

Wer `ausgabe/` eines Tages in `.gitignore` schreibt, tut das Naheliegende und
Übliche — und kappt den einzigen Weg zurück zu den Einkaufspreisen. Nichts im
Bestand hätte widersprochen.

`rettungswegbefund` an `pruefe-preisalter` — dort, wo ohnehin über die
Einkaufspreise gewacht wird, denn ohne sie gibt es keinen Preis, dessen Alter
zu messen wäre. Geprüft wird **beides**:

| Regel | wann |
|---|---|
| `rettungsweg-fehlt` | die Datei ist weg |
| `rettungsweg-nicht-versioniert` | sie liegt da, ist aber nicht getrackt |

Das zweite ist der eigentliche Punkt. **Eine vorhandene, aber ungetrackte
Datei ist kein Rettungsweg, sondern dieselbe eine Kopie wie die Preisdatei
selbst.**

**Gezeigt, dass es anschlägt:** `shop.js` beiseite → `rettungsweg-fehlt` am
echten Bestand; die zweite Richtung über einen Testfall, weil sich eine
getrackte Datei nicht folgenlos untracken lässt. Ein vierter Testfall hält das
Register gegen das Rettungswerkzeug: Steht dort eine Datei, die
`preiswiederherstellung.mjs` gar nicht liest, führt das Register etwas, das
den Weg nicht trägt.

---

## Und der Haken hat mich erwischt

Der Commit blieb stehen:

```
Abbruch: npm run pruefe-tests hat einen Verdacht — der Commit bleibt stehen.
  preisdeckung.test.js Zeile 105
    → Schleife über `RETTUNGSWEG` ohne vorherige Längenzusicherung
```

**Mein eigener neuer Testfall**, der das Register gegen das Rettungswerkzeug
hält — geschrieben als Schleife, ohne zuzusichern, dass das Register nicht
leer ist. Genau die Lücke, für die diese Regel vor zwei Runden entstand, und
genau die Form, die ich damals zweimal selbst geschrieben hatte.

> **Diesmal ist sie nicht durchgegangen.** Vor zwei Runden fand der
> 39-Minuten-Gesamtlauf denselben Fehler, achtzehn Stunden und drei Commits
> später. Heute stand er am Tor.

Das ist der Unterschied zwischen einer Regel, die es gibt, und einer, die an
der Stelle steht, wo sie zuschlägt — 215 Millisekunden.

---

## Was das nicht löst

**Die Preisdatei liegt weiterhin in einer Kopie.** Der Rettungsweg macht den
Verlust überlebbar, nicht unmöglich — und er kostet jedes Mal denselben Preis
wie am 8. September: Aus `ekQuelle: "bestaetigt"` wird `"rekonstruiert"`, und
das lässt sich nur mit den Lieferantenrechnungen zurückholen.

`preise/poschacher-positionen.csv` deckt er gar nicht ab; sie ist seit dem
8. September verloren, und zwei Prüfer weigern sich seither zu messen.

Beides steht unverändert beim Auftraggeber: **die Preisdatei an einen zweiten
Ort, die Rechnungen wieder einlesen.**
