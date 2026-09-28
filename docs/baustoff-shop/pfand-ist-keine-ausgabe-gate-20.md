# Pfand ist keine Ausgabe — neun Tage später auch in Gate 20

**13. September 2026, achte Runde des Tages.** Die Frage, mit der diese Runde
begann: **Welches Register hält niemand gegen die Wirklichkeit?** Über alle 151
gefrorenen Register des Bestands gesucht, bei den Palettenkosten hängengeblieben
— und dort etwas Schärferes gefunden als ein ungehaltenes Register.

## Der Fund

`src/warenkorb.js` rechnet für jede Lieferung mit palettierter Ware eine
Nebenkosten-Untergrenze, und diese Zahl geht direkt in **Gate 20** — das Tor,
das entscheidet, ob eine Bestellung beim Lieferanten ausgelöst werden darf:

```js
const palette = Number(n.paletteOebbNetto ?? 0);   // 22,00 €
const folierung = Number(n.folierungNetto ?? 0);   //  6,50 €
```

Am **4. September** hat `src/palettenkreis.js` genau diese Rechnung widerlegt:

> „Die Zahlen stimmen alle, und die Rechnung trotzdem nicht: Sie verbucht den
> **Pfandbetrag** als Kosten. **Pfand ist keine Ausgabe, sondern eine
> Auslage.**"

Über fünfzehn Rechnungen gemessen: 9 Paletten hinaus zu je 22,00 €, 8 zurück zu
je 20,00 €. Was hängen bleibt, sind 2,00 € Differenz je Palette plus die
Rückführungsfahrt — einmal belegt mit 80,26 € für sieben Paletten:

```
7 × 2,00 € + 80,26 € = 94,26 €  →  13,47 € je Palette
```

Diese Berichtigung ist an **drei** Stellen angekommen: im Kopf von
`palettenkreis.js`, im Text der offenen Punkte, und im Feld `_gewicht` von
`data/lieferanten.json`.

> **Sie steht dort drei Zeilen unter der Zahl, die sie berichtigt — und der
> Rechenkern liest die Zahl.**

```json
"paletteOebbNetto": 22,
"paletteRueckgabeNetto": 20,
"folierungNetto": 6.5,
"kranentladungJeHubNetto": 7.5,
"_gewicht": "BERICHTIGT 04.09.: … Sie verbucht den PFANDBETRAG als Kosten …
             = 13,47 je Palette. Gerechnet in src/palettenkreis.js."
```

Neun Tage lang.

## Was sich dadurch ändert

Die Nebenkosten je Lieferung fallen von **28,50 €** auf **19,97 €**. Der
dokumentierte Befund vom 28. August kippt dabei:

| 50 m² Fassaden-EPS, 96,50 € Warenwert | Deckungsbeitrag |
|---|---|
| vor dem Einbau der Nebenkosten (28.08.) | +24,00 € |
| mit 22,00 € je Palette | **−4,50 €** |
| mit 13,47 € je Palette | **+4,03 €** |

> **Ein Befund, der auf einer berichtigten Zahl ruht, ist mit ihr zu
> berichtigen — auch wenn er dabei sein Vorzeichen wechselt.**

Die **Sache**, um die es am 28. August ging, gilt unverändert: Eine kleine
Palettenbestellung trägt ihre Nebenkosten nicht. Nur liegt die Grenze jetzt bei
rund **41 m²** statt bei rund 53. Der Testfall prüft sie dort, wo sie heute
liegt, und hält den alten Wert daneben fest.

## Der Einwand, und warum er nicht trägt

Naheliegend ist: Die 13,47 € teilen **eine** Fahrt durch **sieben** Paletten.
Eine Lieferung mit einer einzigen Palette, für die eigens zurückgefahren wird,
kostet 2,00 € + 80,26 €.

Das ist kein Einwand gegen die Zahl, sondern eine andere Annahme über den
Betrieb — und die belegte Beobachtung ist die gebündelte Rückfahrt: sieben
Paletten auf einer. Eine einzelne Palette aus einer einzelnen Lieferung fährt
mit dieser Fahrt zurück; ihr Anteil daran ist der Anteil, nicht die ganze Fahrt.

Was dagegen **kein** Argument ist: „22,00 € ist vorsichtiger". Diese Funktion
heißt Untergrenze und soll vorsichtig sein.

> **Eine Vorsicht, die eine Auslage als Ausgabe verbucht, ist keine Vorsicht,
> sondern ein Rechenfehler in die bequeme Richtung.**

## Und es wirkt bis in die Gebote

Der zulässige Klickpreis wird aus dem Deckungsbeitrag des Referenzwarenkorbs
gerechnet. 8,53 € weniger Nebenkosten je Lieferung heben ihn:

| Anzeigengruppe | vorher | jetzt |
|---|---|---|
| Kamin | 9,41 € | **9,58 €** |
| Dämmung | 5,91 € | **6,08 €** |
| WDVS | 4,19 € | 4,19 € |

WDVS bleibt, weil sein Referenzkorb keine palettierte Position trägt. Die
beiden anderen dürfen ab heute 17 Cent je Klick mehr bieten — gegen einen Markt
von 0,50 bis 2,50 € ist das nicht die Entscheidung, aber es ist der Unterschied
zwischen einer Zahl, die aus einer Messung kommt, und einer, die aus einem
Buchungsfehler kommt.

Aufgefallen ist es nicht beim Rechnen, sondern beim Prüfen: `pruefe-schaufenster`
hält die veröffentlichte Beschreibung gegen den Bestand und meldete zwei
veraltete Zahlen. **Eine Berichtigung, die in den Kennzahlen ankommt, ist eine,
die wirklich etwas geändert hat.**

## Und die alte Begründung stand noch daneben

Im Kopf derselben Funktion stand bis heute:

> „Die Rückgabegutschrift von 20,00 € wird **nicht** gegengerechnet. Sie fällt
> nur an, wenn die Palette tatsächlich zurückgeht; elf der fünfzehn Rechnungen
> lauten „Abholung Kunde" … Die vorsichtige Zahl ist hier die ehrliche."

Das Argument war nicht unvernünftig, aber es misst das Falsche: **nicht wer die
Ware holt, sondern was mit den Paletten geschieht.** `palettenkreis.js` hat die
Palettenpositionen selbst gezählt — und damit eine Messung an die Stelle einer
Vermutung gesetzt. Der Kopf ist mitberichtigt; eine Funktion, deren Rumpf und
deren Begründung auseinanderlaufen, ist der Fall, den diese Runde behandelt.

## Damit es nicht wieder auseinanderläuft

`palettenkreis` führt die **Belegpositionen** von Hand, `data/lieferanten.json`
führt die **Stückpreise**. Beide sagen 22,00 € hinaus und 20,00 € zurück — und
niemand hielt sie gegeneinander. Seit heute wirft `nebenkostenUntergrenze`,
wenn sie auseinandergehen:

```
Palettenpreise weichen ab: Datei 24/20, Belegkreis 22/20
```

Dieselbe Familie wie „PreOrder gegen InStock" am 28. August: Der Widerspruch
fällt nicht auf, weil beide Seiten für sich stimmen.

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `das-pfand-wird-wieder-als-ausgabe-gebucht` | der Kern nimmt wieder 22,00 € je Palette |
| `der-palettenkreis-driftet-von-der-datei` | die Preise werden nicht mehr gegeneinander gehalten |
