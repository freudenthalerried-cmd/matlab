# Der Text neben den Daten

**4. September 2026.** Jede Anzeigengruppe trägt einen **Referenzwarenkorb** —
die Bestellung, auf die geboten wird. Er geht als Spalte nach Google, und aus
seinem Deckungsbeitrag folgt der zulässige Klickpreis: 4,19 € für WDVS, 5,91 €
für Dämmung, 8,22 € für Kamin. Diese drei Zahlen entscheiden, ob der Kanal
überhaupt bezahlbar ist.

Der WDVS-Korb sah so aus:

```js
WDVS: {
  text: '100 m² Wärmedämmverbundsystem: Kleber, Gewebe, Dübel, Putzgrund, Oberputz',
  positionen: [
    { sku: 'POS-11283', menge: 500 },   // Klebe- und Spachtelmasse, kg
    { sku: 'POS-50509', menge: 110 },   // Glasgewebe, m²
    { sku: 'POS-11082', menge: 6 },     // Universaldübel, Karton
    { sku: 'POS-13728', menge: 25 },    // Putzgrund, kg
    { sku: 'POS-53402', menge: 40 },    // Kantenschutz, lfm
  ],
},
```

**Im Korb liegt kein Oberputz.** Statt seiner liegt Kantenschutz darin, den der
Text nicht nennt.

Der Text beschreibt, wofür geboten wird. Die Positionen tragen die Zahl, mit
der geboten wird. Zwei Aussagen über dieselbe Sache, und eine davon falsch.

> **Ein Text, der neben den Daten steht, beschreibt sie irgendwann nicht mehr.**

Es ist derselbe Befund wie am 1. September, eine Zeile weiter: Damals stand
„Eine Palette Mörtel" über einem Korb aus vierzig Säcken — auch das ging als
Referenzwarenkorb nach Google, und auch dort war die Korrektur, die Menge
hinzuschreiben, die tatsächlich gerechnet wird. **Hinschreiben hilft einmal.**

## Der Text wird jetzt gebaut

Jede Position trägt ein `was` in der Sprache des Bauleiters; der Korb trägt
einen `umfang` — den Teil, den nur ein Mensch sagen kann. Der Text entsteht
daraus:

```
100 m² Wärmedämmverbundsystem: Kleber, Gewebe, Dübel, Putzgrund, Kantenschutz
Ein Kaminzug: Mantelsteine, gedämmtes Rohr, Fertigfußpaket, Putztüranschluss, Regenhaube
40 Sack Mörtel
```

Ein Korb aus einer Position liest sich als Ausdruck („40 Sack Mörtel"), nicht
als Liste — ein Doppelpunkt vor einem einzigen Wort liest sich wie ein
Formular. Eine Position ohne Klartext bricht den Bau ab.

Drei Testfälle halten es fest, und einer prüft **beide Richtungen**: Was im
Korb liegt, steht im Text — und nach dem Doppelpunkt steht nichts, was nicht im
Korb liegt. Genau daran ist der WDVS-Text gescheitert.

## Der zweite Teil: fünf Positionen gegen neun

Beim Nachsehen fiel auf, dass der Korb nicht nur falsch beschrieben, sondern
auch **kleiner** ist als die Baustelle, die der Shop selbst beschreibt. Die
Systemliste „Fassade dämmen — die Liste für 100 m²" führt neun Artikel:

| im Korb | nur auf der Systemliste |
|---|---|
| Kleber, Gewebe, Dübel, Putzgrund, Kantenschutz | zweite Klebemasse, Rondellen, Gewebeanschlussleisten, **Oberputz** |

Vier der neun fehlen — und drei davon sind genau die Positionen, die die
Systemliste selbst als „wird oft vergessen" markiert. Der Text nannte den
Oberputz, weil er dazugehört; nur lag er nie im Korb.

**Das Gebot ruht damit auf einer kleineren Baustelle, als der Shop beschreibt.**
Das ist die vorsichtige Richtung: Ein zu kleiner Korb ergibt einen zu niedrigen
Deckungsbeitrag und damit ein zu niedriges Gebot. Zu niedrig zu bieten kostet
Sichtbarkeit, zu hoch zu bieten kostet Geld.

**Aufgefüllt wird er trotzdem nicht.** Die fehlenden Mengen ergeben sich aus
Verbrauchswerten je Quadratmeter, und die veröffentlicht dieser Shop aus gutem
Grund nicht — die Systemseite sagt es selbst: *„Die Kennwerte gehören ins
technische Merkblatt des Herstellers und ändern sich mit jeder Überarbeitung."*
Wer sie hier für eine Gebotsrechnung setzt, setzt sie; und eine gesetzte Zahl
in einer Rechnung, die Geld freigibt, ist genau das, was dieses Vorhaben an
anderen Stellen ablehnt.

Geprüft wird deshalb die **Richtung**: Im Korb darf nichts liegen, was auf der
Systemliste fehlt. Umgekehrt darf die Liste mehr tragen — dann ist das Gebot zu
niedrig und nicht zu hoch. Mörtel und Mauerwerk haben keine Systemliste; sie
werden genannt, nicht übergangen.

## Was das für die Gebote heißt

Die drei geschalteten Anzeigengruppen (Kamin 8,22 €, Dämmung 5,91 €, WDVS
4,19 €) liegen alle deutlich über dem Marktband von 0,50 bis 2,50 €. Ein
Gebotsdeckel, der ohnehin nicht bindet, wird durch einen zu kleinen Korb nicht
gefährlich — er wird nur ungenauer.

Anders sähe es bei den drei zurückgestellten Gruppen aus (Kanal 1,38 €, Mörtel
1,85 €, Mauerwerk 1,24 €): Dort liegt der Deckel **im** Marktband, und ein zu
kleiner Korb entscheidet mit, ob die Gruppe überhaupt geschaltet wird. Kanal
hat eine Systemliste mit sieben Artikeln, der Korb trägt vier.

> **Die Ungenauigkeit trifft dort am härtesten, wo die Entscheidung knapp
> ist** — und dort steht sie heute schon auf „zurückgestellt, bis eine
> gemessene Kaufquote vorliegt".

## Verweise

- `shop/bin/kampagne.mjs` — `warenkorbText()` und die umgebauten Körbe
- `shop/test/kampagne.test.js` — vier neue Proben, davon zwei gegen genau diesen Fall
- `shop/inhalte/system/fassade-100-qm.md` — die neun Positionen
- [`dieselbe-spalte-zwei-groessen.md`](./dieselbe-spalte-zwei-groessen.md) — die Runde davor, dieselbe Frage an eine andere Zahl
