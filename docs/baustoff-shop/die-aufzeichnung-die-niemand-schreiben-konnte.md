# Die Aufzeichnung, die niemand schreiben konnte

**13. September 2026. Runde 64.**

## Der Fund

`ARTEN` führt die Vorgangsart `vermerk` seit dem 4. September. Vier Werkzeuge
nehmen inzwischen Rücksicht auf sie:

| | |
| --- | --- |
| `durchschriftenbefund` | verlangt für sie keine Durchschrift (12.9., `beleg: false`) |
| `npm run akte` | schreibt „kein Blatt — vermerk ist selbst die Aufzeichnung" |
| `alsCsv` | führt sie mit `umsatz: nein` |
| `PAPIERSCHRITT` | lässt sie ausdrücklich weg — sie belegt keinen Schritt |

> **Geschrieben hat nie eines einen.** Kein Werkzeug dieses Hauses konnte
> einen Vermerk in die Akte bringen.

Damit war alles, was in der Welt geschieht und **kein Papier erzeugt**, nicht
aufzeichenbar: Der Kunde ruft an und verschiebt. Der Lieferant sagt ab. Das
Geld geht ein. Die Baustelle ist nicht befahrbar.

§ 131 Abs 1 Z 5 BAO verlangt zu jedem Geschäftsfall einen Beleg; wo keiner
entsteht, tritt der Vermerk an seine Stelle. Die Akte hatte für genau die
Ereignisse keine Zeile, für die sie die **einzige** Quelle wäre.

## `npm run vermerk`

```
$ npm run vermerk -- --vorgang 2026-0110 --text "Kunde hat telefonisch auf Oktober verschoben"

Vermerkt zu Vorgang 2026-0110 als lfd. 2, 2026-09-13
  Kunde hat telefonisch auf Oktober verschoben

Kein Blatt und keine Durchschrift: Der Vermerk ist selbst die Aufzeichnung
(§ 131 Abs 1 Z 5 BAO). Abgeschlossen wird damit nichts — er hält fest, was
geschehen ist, und sagt nicht, wie es weitergeht.
```

## Zwei Sperren, beide aus einem gemessenen Grund

**Der Vorgang muss es geben.**

```
Abbruch: Zu Vorgang 2026-9999 steht nichts im Journal 2026.
Ein Vermerk gehört zu einem Geschäftsfall.
```

Ein Vertipper in der Vorgangsnummer erzeugte sonst eine Zeile, die zu keinem
Geschäftsfall gehört: Die Akte zeigte sie unter einem Vorgang, den sonst
nichts füllt, und der Fall, zu dem sie gehört hätte, stünde weiter ohne sie
da. Verlangt ist die Rückführbarkeit zum Geschäftsfall — nicht eine Zeile mit
einer Nummer darauf.

**Und er darf nicht länger sein als das, was durchkommt.**

`alsCsv` schneidet das Textfeld bei 200 Zeichen ab. Für einen Beleg ist das
harmlos: Dort steht ein **Betreff**, und das Papier daneben trägt den Inhalt.

> **Beim Vermerk ist der Text die Aufzeichnung selbst** — er würde auf dem Weg
> zum Steuerberater lautlos gekürzt, und gemerkt wird so etwas, wenn jemand
> Jahre später fragt, was damals vereinbart war.

Abgewiesen statt gekürzt: Was nicht hineinpasst, gehört in zwei Vermerke, und
dann steht beides vollständig da.

## Was dieses Werkzeug ausdrücklich **nicht** tut

Es **schließt keinen Vorgang ab.** Ein Vermerk hält fest, was geschehen ist,
und sagt nichts darüber, ob ein Fall erledigt ist. Der Abzweig *„Nach
Vertragsschluss und Zahlung sagt der Lieferant ab"* hat weiterhin keine
veröffentlichte Regel — Rücktritt, Nachfrist und Rückzahlung sind Rechtstexte
und ein offener Punkt beim Auftraggeber. Eine hier erfundene Regel wäre eine
Zusage an Kunden, die auf keiner Seite steht.

Es erzeugt auch **keine Durchschrift**: `ARTEN.vermerk` trägt `beleg: false`.
Ein Testfall besteht darauf, dass im Belegordner nichts entsteht.

## Ein Prüfer hat sofort widersprochen

Der erste Entwurf des Testfalls las `new Date().getFullYear()`.
`npm run pruefe-zeit` meldete: *„sieht 1-mal roh auf die Uhr und steht in
keinem Register"*.

Zu Recht, und nicht nur formal: Am 1. Jänner um 00:30 Uhr sagt die Rechneruhr
in UTC noch das alte Jahr, `geschaeftsjahr()` schon das neue. Ein Testfall,
der das Journal eines anderen Jahres sucht als das Werkzeug, schlägt genau
dann fehl, wenn niemand hinsieht. Er nimmt jetzt dieselbe Uhr wie das
Werkzeug.

## Ausgang

| | |
| --- | --- |
| Neu | `npm run vermerk`, `bin/vermerk.mjs` |
| Arten mit Werkzeug | 6 → **7** von 8 (`uidabfrage` bleibt: FinanzOnline und VIES sind gesperrt) |
| Testfälle | 2.441 → **2.445** |
| Gegenproben | 239 → **241** |

---

**Die Regel dieser Runde:** *Eine Art, auf die vier Werkzeuge Rücksicht
nehmen und die keines schreiben kann, ist kein Eintrag im Register, sondern
eine Lücke mit einem Namen.*
