# Drei Proben rot seit dem Mittag

**3. September 2026, abends.** Beim Nachsehen der Bereitschaftsliste ist der
Browserlauf mitgelaufen, der sonst nicht Teil von `npm run alles` ist:

```
53 Szenarien (davon 10 im 390-px-Rahmen), 3 fehlgeschlagen.
```

Drei Szenarien der Kassenprobe waren rot, und alle drei mit demselben Befund:

```
✗ Mit Bezirk steht die gerechnete Anfrage im Textfeld
    fehlt im gerenderten Ergebnis: „UNVERBINDLICHE ANFRAGE"
    gerendert war: KEIN FELD
```

## Die Ursache

**Gate 25 vom selben Tag.** Seit dem Mittag nimmt die Kasse unter 250 € netto
Warenwert je Lieferung keine Anfrage mehr an und nennt stattdessen den
fehlenden Betrag. Das ist die beschlossene und richtige Wirkung.

Die drei Szenarien legten ein einziges Gebinde in den Korb:

| Szenario | Korb | netto |
|---|---|---|
| Mit Bezirk steht die gerechnete Anfrage im Textfeld | 0,5 m² EPS | 0,97 € |
| Ohne hinterlegte Adresse gibt es keinen Mailknopf | 0,5 m² EPS | 0,97 € |
| Der Anfragetext schreibt Mengen mit Komma | 5,25 m² XPS | 27,46 € |

Alle drei prüfen den **Anfragetext** — seinen Aufbau, seinen Mailknopf, seine
Mengenschreibweise. Keines prüft die Untergrenze. Sie sind nicht an einem
Fehler gescheitert, sondern daran, dass sie ihren Gegenstand seit dem Mittag
gar nicht mehr erreichten.

> **Eine Probe, die ihren Gegenstand nicht mehr erreicht, ist nicht falsch —
> sie ist stumm.** Und ihr Rot sagt nichts über die Sache, die sie prüfen soll.

## Warum es niemandem aufgefallen ist

`npm run alles` läuft in zwanzig Schritten und trägt in der Kopfzeile:

> Gesamtlauf — 20 Schritte (**ohne Browserproben**, mit `--mit-browser` dazu)

Die Browserproben brauchen einen Browserstart je Szenario und sind deshalb
ausgenommen. Der Gate-25-Lauf am Mittag endete mit „20 von 20 Schritten grün" —
und die drei roten standen daneben, ungefragt, sechs Stunden lang.

Das ist dieselbe Familie wie „ein Urteil nur am Bildschirm", nur einen Schritt
weiter außen: **nicht ein Prüfer ohne roten Ausgang, sondern ein roter Ausgang,
den der Sammellauf nicht abholt.**

## Was geändert wurde

Die drei Szenarien bekommen einen Korb, der die Grenze hält — nicht die Grenze
bekommt eine Ausnahme für Proben:

- Die beiden EPS-Fälle legen 150 m² statt eines halben Quadratmeters (289,50 €).
- Der Mengenfall behält seine **5,25 m²** — sie sind sein Gegenstand und stehen
  in seinem Namen — und hebt den Korb über eine **zweite** Position: einen
  Thermo-Trennstein zu 255,91 €. Eine größere Menge desselben Artikels hätte
  die Zahl verändert, die zu prüfen ist.

Danach: **53 Szenarien, 0 fehlgeschlagen**; `oberflaechenprobe` 11 von 11,
`wegprobe` fünf Schritte wie zuvor.

## Was offen bleibt

Der Sammellauf holt die Browserproben weiterhin nicht ab. Das ist eine
Abwägung: Sie brauchen ein Vielfaches der Zeit aller anderen Schritte zusammen.
Solange sie draußen bleiben, gilt die Regel, die dieser Befund kostet — **wer
an der Kasse etwas ändert, lässt `npm run shopprobe` laufen, bevor er
committet.** Gate 25 war genau so eine Änderung.

## Verweise

- `shop/bin/shopprobe.mjs` — die drei berichtigten Szenarien
- [`gate25-mindestbestellwert.md`](./gate25-mindestbestellwert.md) — die Grenze und ihr Grund
- [`ein-urteil-nur-am-bildschirm.md`](./ein-urteil-nur-am-bildschirm.md) — dieselbe Familie, eine Ebene tiefer
