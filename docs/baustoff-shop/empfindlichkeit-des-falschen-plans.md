# Die Empfindlichkeitsrechnung maß den falschen Plan

**1. September 2026.** Weiter auf der Suche nach dem, was den Werbeweg trägt.
`src/empfindlichkeit.js` gibt es seit Phase 3: Es rechnet, welche Annahme den
Besucherbedarf am stärksten treibt und wo das Modell kippt. Sauber gebaut,
geprüft, sechzehn Testfälle.

Zwei Befunde beim Hineinsehen.

## 1. Die Annahmen gehören zum verlassenen Modell

```js
{
  id: 'rohmarge',
  basis: 0.35,
  untergrenze: 0.32,
  herkunft: 'phase3-unit-economics.md; Gate 1 setzt die Untergrenze bei 32 %',
}
```

**35 % Rohmarge und Gate 1.** Der Auftraggeber rechnet seit dem 22. August mit
eigenen Baumeisterpreisen und **25 % Marge**; Gate 1 ist seither
gegenstandslos, PARAMETER.md sagt das ausdrücklich.

Eine Annahmenliste, die eine überholte Annahme führt, misst die
Empfindlichkeit des falschen Plans — und zwar in die günstige Richtung: 35 %
statt 25 % ist ein Drittel mehr Luft, als es gibt. Nachgerechnet mit 25 %:

| Annahme | Elastizität bei 35 % | bei 25 % |
|---|---|---|
| Rohmarge | ~1,6 | **2,24** |

Die Rohmarge wirkt im laufenden Modell **stärker**, nicht schwächer. Sie steht
im Nenner der Deckungsbeitragsrate; je kleiner sie ist, desto heftiger schlägt
jeder verlorene Punkt durch.

## 2. Eine Wache, die in die falsche Richtung sah

Der Grenzwertvergleich war fest verdrahtet:

```js
const unterUntergrenze = a.untergrenze != null && geprueft[annahmeId] < a.untergrenze;
```

Richtig für die Rohmarge, deren Grenze aus Gate 1 kam. Aber die **einzige
Grenze, die es im laufenden Modell gibt**, gehört zum Werbekostenanteil — 23 %
Tragfähigkeitsgrenze, dokumentiert in `marge-25-prozent.md` —, und der wird
schlechter, wenn er **steigt**. Ein fest auf „kleiner" gestellter Vergleich
hätte ihn nie ausgelöst.

Jetzt vergleicht `grenze` in der Richtung, in der die Annahme schlechter wird.
Die Rohmarge hat keine eigene Grenze mehr: An die Stelle von Gate 1 tritt
Gate 20, und das ist genau der rechnerische Kipppunkt, den die Rechnung
ohnehin ausweist. Eine zweite Schwelle daneben wäre ein zweiter Weg zur selben
Aussage.

## 3. Und niemand hat es je aufgerufen

Kein Werkzeug rief `elastizitaet` oder `kipppunkt` auf. Das Modul war
vollständig getestet und vollständig ungenutzt.

> **Eine Empfindlichkeitsrechnung, die niemand liest, ist eine Rechnung, die
> niemand gemacht hat.**

Neu: `npm run empfindlichkeit`. Und die Zielgrößen stehen jetzt in
`data/zielgroessen.json` statt in Fließtext und Testvorrichtungen — mit
Herkunftsnotiz je Zahl und einer Probe, die sie gegen `ZIELMARGE` des Katalogs
hält. Läuft die Zielrechnung auf einer anderen Marge als der Katalog, bricht
das Werkzeug ab: Dann plant das Modell einen Shop, den es nicht gibt.

## Was die Rechnung sagt

```
Besucherbedarf: 3350 je Monat

  Annahme               Elastizität   Besucher danach
  Rohmarge                    2.24              4100
  Warenkorb netto             1.19              3750
  Umsatzquote je Besuch       1.11              3723
  Werbekostenanteil           0.75              3600

  Rohmarge             kippt bei 56 % schlechter (Wert 0,110)
  Werbekostenanteil    kippt bis 90 % nicht; Grenze bei +130 %
```

Die Rangfolge ist die Handlungsanweisung: **Die Rohmarge zuerst schützen.**
Sie ist die einzige Annahme mit einer Elastizität über zwei — zehn Prozent
weniger Marge kosten 750 zusätzliche Besucher im Monat. Und sie ist die
einzige, die kippen kann.

Das verbindet sich mit dem Fund von vor drei Stunden: Der älteste
Einkaufspreis im Katalog ist 132 Tage alt. Ein veralteter Einstand ist genau
das — verlorene Rohmarge, an der stärksten Stelle des Modells.

## Die Brücke, die noch nie geschlagen wurde

Der Besucherbedarf und die Klicks, die das Werbebudget kauft, sind **dieselbe
Größe**. Sie standen in zwei Dokumenten nebeneinander, ohne je gegeneinander
gehalten zu werden. Jetzt rechnet das Werkzeug es aus:

```
Zielumsatz 43.395,77 € im Monat, 67 Bestellungen.
Bei 10,0 % Werbeanteil sind das 4.339,58 € Werbebudget je Monat
— für 3350 Besucher. Das Modell schreibt sich damit einen Klickpreis von
1,30 € vor. Der Markt liegt bei 0,50–2,50 €.

Der erste Anlauf ist mit 10 € Tagesbudget geplant, also 300,00 € im Monat
— ein 14-tel davon.
```

Zwei Dinge daran sind wichtig, und sie zeigen in verschiedene Richtungen.

**Das Modell ist in sich stimmig.** Der Klickpreis von 1,30 €, den es sich
selbst vorschreibt, ist keine Annahme, sondern eine Folge — und er liegt
mitten im Marktband. Das ist die erste unabhängige Plausibilitätsprobe des
ganzen Zahlenwerks, und sie fällt gut aus.

**Der erste Anlauf ist ein Versuch und kein Betrieb.** 300 € im Monat sind ein
Vierzehntel des Werbebudgets, das die Zielgröße braucht. Er kann den ersten
Verkauf bringen und die Kaufquote messen — die 3.000 € netto im Monat trägt er
nicht. Das ist keine Schwäche des Plans, aber es gehört gesagt, damit niemand
aus einem erfolgreichen ersten Anlauf auf einen tragfähigen Betrieb schließt.

## Und noch einmal derselbe Fehler in den Proben

Drei Testfälle wurden rot, als die Rohmarge auf 25 % ging:

```
✗ Ein kleinerer Warenkorb schadet zweifach     — erwartet > 1.2, ist 1.14
✗ Der Werbekostenanteil ist der schwächste Hebel — erwartet < 0.6, ist 0.75
✗ Nahe der Gate-1-Untergrenze …                 — Gate 1 gibt es nicht mehr
```

Die **Aussagen** stimmen alle drei weiter. Rot wurden sie an Schwellen, die
beim 35-%-Modell gemessen und abgeschrieben worden waren.

> **Eine Probe, die den Bestand misst, ist eine Zeitbombe mit bekanntem
> Zünddatum.** Diesmal war das Datum der Tag, an dem der Auftraggeber sein
> Modell wechselte — vor zehn Tagen.

Alle drei prüfen jetzt die Aussage statt der Zahl: überproportional statt
`> 1.2`; die **Rangfolge über alle Annahmen** statt `< 0.6`; den Verlauf über
drei Margenstufen statt zwei abgeschriebener Werte.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Grenze wieder an die Rohmarge (Gate-1-Wert 0,32) | ja |
| Richtungsvergleich wieder fest auf „kleiner" | ja |
| `zielgroessen.json` zurück auf 0,35 Rohmarge | ja — Probe **und** Werkzeug (Abbruch 2) |

Die dritte ist die wichtigste: Sie zeigt, dass die Marge jetzt an genau einer
Stelle steht und beide Wege dorthin führen.

## Stand

- 1.076 Tests, 0 rot; alle Prüfer grün
- neu: `npm run empfindlichkeit`, `data/zielgroessen.json`
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
