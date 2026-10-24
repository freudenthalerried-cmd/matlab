# Gemessen: kein Platzhalter. Behauptet: bestätigt.

**9. September 2026.** Die Bereitschaftsliste — das Werkzeug, das entscheidet,
ob dieser Shop online darf — meldete:

```
✓ Kein Platzhalterpreis im Katalog
    jeder Einkaufspreis ist bestätigt
```

Kein einziger ist bestätigt. Seit Gate 30 vom 8. September sind **46 von 46
Einkaufspreisen `rekonstruiert`**, aus der gebauten Ausgabe zurückgerechnet,
weil die Preisdatei verloren war.

Gemessen hat der Punkt `ekIstPlatzhalter`. Behauptet hat er etwas anderes.

> **Der Prüfer hat gemessen, dass kein Platzhalter da ist, und daraus
> geschlossen, dass jeder Preis belegt ist. Das ist nicht dieselbe Aussage.**

---

## Gate 30 hatte die beiden ausdrücklich getrennt

Am Tag zuvor, wörtlich: *Ein zurückgerechneter Preis ist **kein Platzhalter** —
„Platzhalter" hieße, die Zahl sei nicht der Preis; sie ist es, auf den Cent.
Der Mangel liegt im **Beleg**, nicht im Wert.*

Genau diese Trennung hat der Satz wieder eingeebnet — einen Tag später, in dem
Werkzeug, das die Frage stellt.

`ekQuelle` steht an jedem der 46 Katalogartikel. Die Bereitschaftsliste hat es
nie gelesen.

---

## Der Punkt bleibt grün, und das ist die Entscheidung

Naheliegend wäre, daraus einen offenen Punkt zu machen. Das wäre falsch: Was
der Punkt misst — kein Platzhalter im Katalog — ist erfüllt, und die
**Verkaufspreise stimmen**. Ein offener Punkt hieße, der Shop dürfe wegen
einer Zahl nicht online, die richtig ist. Gate 30 hat den Beleg als eigenen
offenen Punkt geführt, nicht als Sperre, und dabei bleibt es.

Geändert ist der **Satz**. Er sagt jetzt, was gemessen wurde:

```
✓ Kein Platzhalterpreis im Katalog
    kein Platzhalter — aber nur 0 von 46 Einkaufspreisen sind belegt,
    der Rest ist zurückgerechnet (Gate 30)
```

Abgeleitet aus `ekQuelle`, damit er sich mit den wieder eingelesenen
Rechnungen von selbst ändert — und nicht erst, wenn jemand daran denkt.

### Gehalten wird die Regel, nicht das Beispiel

Vier neue Testfälle, einer davon ist die Regel selbst: Für **jeden** Zustand
von `ekQuelle` — `rekonstruiert`, `ausListe`, `anfrage`, fehlend — darf in der
Meldung nicht „belegt" stehen. Ein Testfall, der nur den heutigen Fall prüft,
wäre wieder nur ein Beispiel.

**Gezeigt, dass sie anschlägt:** Mit dem alten Satz wieder eingesetzt sind
**2 von 23** Testfällen rot, danach 23 grün. Eine Gegenprobe im Register gibt
es nicht — `startklar` endet mit offenen Punkten planmäßig rot, und an einem
planmäßig roten Prüfer lässt sich nichts zeigen. Deshalb der Nachweis von Hand
und hier aufgeschrieben, statt ihn zu behaupten.

---

## Und die Liste der nächsten Schritte führte einen erledigten

Im selben Dokument, im Abschnitt „Was als Nächstes gebraucht wird":

```
| Mindestbestellwert entscheiden | eine Entscheidung |
  palettierte Bestellungen unter ~114 € … (Gate 20) |
```

**Gate 25 hat ihn am 3. September entschieden** — 250 € netto Warenwert je
Lieferung, in der Kasse statt bei der Auslösung. Sechs Tage lang stand er
daneben als etwas, das der Auftraggeber noch entscheiden muss.

Die Zeile darüber ist durchgestrichen, weil sie entschieden wurde. Diese nicht.

> **Eine Liste offener Punkte, die einen geschlossenen führt, kostet den Leser
> genau die Zeit, die sie sparen soll.**

Nachgetragen mit Datum, Gate und Begründung. Der Rest der Tabelle stimmt: Alle
übrigen acht Zeilen stehen auch auf der Bereitschaftsliste oder sind dort als
nicht feststellbar geführt.
