# Die Absage nach dem Vertrag

**13. September 2026. Runde 67.**

## Der Fund

Seit dem 12. September sagt `VORAUSGESETZT`, welches Papier welches andere
**braucht**. Die Gegenfrage stand nirgends: Welche dürfen nicht
**nebeneinander** liegen?

Gemessen an einem Vorgang mit Angebot und Auftragsbestätigung:

```
$ npm run vorgang -- … --stufe absage --grund "Kein Liefergebiet" --ablegen
Abgelegt: absage als lfd. 3

$ npm run akte
    Stand: abgeschlossen — abgesagt
```

Mit der Auftragsbestätigung ist der Vertrag geschlossen (AGB Punkt 2).

> **Was danach hinausgeht, ist keine Ablehnung eines Angebots, sondern ein
> Rücktritt** — und der Absagetext sagt dem Kunden wörtlich das Gegenteil:
> dass kein Vertrag zustande gekommen sei.

Der Brief beruft sich auf genau den Punkt der AGB, der ihn widerlegt.

## Und die Akte machte den Vertrag unsichtbar

`vorgangsstand` prüft die Abzweige zuerst — und der Abzweig gewann. Ein Fall,
aus dem eine **Lieferpflicht** besteht, stand als „abgeschlossen — abgesagt"
da und fiel damit von der Arbeitsliste (`npm run akte -- --offen`).

> **Der Vertrag wurde unsichtbar, weil der Brief, der ihn bestreitet, später
> kam.**

Die ehrliche Auskunft ist keine der beiden:

```
    WIDERSPRUCH: absage und auftragsbestaetigung liegen nebeneinander
    Stand: nicht feststellbar — die Akte widerspricht sich

1 Vorgang/Vorgänge tragen Papiere, die einander ausschließen.
Sie bleiben auf der Arbeitsliste: Ein Fall, dessen Stand nicht feststellbar
ist, gehört angesehen und nicht abgehakt.
```

## Die Sperre steht beim Brief

```
Abbruch: Zu Vorgang 2026-0800 liegt eine Auftragsbestätigung in der Akte.
Damit ist der Vertrag geschlossen (AGB Punkt 2). Eine Absage danach ist keine
Ablehnung, sondern ein Rücktritt — und der Text dieses Briefes behauptet dem
Kunden gegenüber, es sei kein Vertrag zustande gekommen.

Was bei einem Rücktritt gilt, steht auf keiner veröffentlichten Seite: Nachfrist
und Rückzahlung sind Rechtstexte und ein offener Punkt beim Auftraggeber.
Festhalten lässt sich der Vorgang mit: npm run vermerk -- --vorgang 2026-0800 --text "…"
```

Dieselbe Unterscheidung wie bei der Lieferantenbestellung: **Eine Zusage nach
außen lässt sich aufhalten.** Und dasselbe Schweigen wie beim Abzweig „der
Lieferant sagt ab" — was bei einem Rücktritt gilt, erfindet dieses Haus nicht.
Was es anbietet, ist der Vermerk: festhalten, was geschehen ist, ohne dem
Kunden etwas zu versprechen.

## Ein dritter Eintrag bei den Voraussetzungen

Beim Aufschreiben fiel auf, dass eine fehlte: **Die Gutschrift setzt ihre
Rechnung voraus.** Das Werkzeug prüft es (`storniere` braucht die Nummer), die
**Akte** wusste es nicht. Ohne Rechnung im selben Vorgang hebt eine Gutschrift
nichts auf — und in der Umsatzsteuervoranmeldung steht ein negativer Betrag
ohne Gegenstück.

| Papier | braucht |
| --- | --- |
| `lieferantenbestellung` | `auftragsbestaetigung` |
| `gutschrift` | `rechnung` |
| `rechnung` | `auftragsbestaetigung` |

| Papier | schließt aus |
| --- | --- |
| `absage` | `auftragsbestaetigung` |

Beide Register hält `npm run betriebskette` gegen `ARTEN`: Jede genannte Art
muss es geben, sie braucht ein **Blatt** — eine Art ohne Papier geht nicht
hinaus und widerspricht keiner anderen —, und jeder Grund muss tragen.

## Ausgang

| | |
| --- | --- |
| Neu | `SCHLIESST_AUS`, `widersprueche()` in `src/vorgangsstand.js` |
| `npm run akte` | meldet den Widerspruch und hält den Fall offen |
| `npm run pruefe-ablage` | neue Regel `papiere-widersprechen-sich` |
| `--stufe absage --ablegen` | bricht nach dem Vertragsschluss ab |
| `VORAUSGESETZT` | 2 → **3** (die Gutschrift braucht ihre Rechnung) |
| Testfälle | 2.451 → **2.454** |
| Gegenproben | 245 → **247** |

---

**Die Regel dieser Runde:** *Ein Register über das, was einander bedingt, ist
erst halb — die andere Hälfte ist das, was einander ausschließt, und sie fehlt
so lange unbemerkt, wie niemand beide Papiere zugleich schreibt.*
