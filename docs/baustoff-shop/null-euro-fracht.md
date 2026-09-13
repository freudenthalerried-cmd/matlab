# Null Euro Fracht

**13. September 2026, fünfte Runde des Tages.** Die Vorrunde hat mit einer
Suche nach dem geratenen Rückfall begonnen und `GEWICHT[e.art] ?? 1` gefunden.
Diese fängt dort an, wo die aufgehört hat — bei `?? 0`.

## Der Fund

`src/shopkern.js`, in `oeffentlicherLieferant` — der Funktion, die entscheidet,
was von einem Lieferanten in den Browser des Kunden geht:

```js
lieferzeitWerktage: l.lieferzeitWerktage ?? null,
fracht: {
  pauschaleNetto: l.fracht?.pauschaleNetto ?? 0,
  sperrgutZuschlagNetto: l.fracht?.sperrgutZuschlagNetto ?? 0,
```

> **Drei Zeilen untereinander. Die erste sagt, Unbekanntes bleibt unbekannt.
> Die beiden darunter machen daraus null Euro.**

Gemessen an einem Lieferanten ohne hinterlegten Frachtsatz:

```
Kasse:  Warenwert 300,00 €   Fracht 0,00 €   offen: []
intern: Cannot read properties of undefined (reading 'freiHausAbNetto')
```

**Derselbe fehlende Wert bricht den internen Weg laut ab und macht auf dem
Kundenweg lautlos ein Geschenk.** Der Kunde liest frei Haus, der Betrieb zahlt
die Pauschale — bei Poschacher 75,50 € je Lieferung, bei den drei
Platzhaltern 12 bis 95 €.

## Der Satz stand schon da, zwei Zeilen weit

`src/beleg.js` trägt seit dem **30. August** diese Notiz:

> „**`?? 0` stand hier bis zum 30. August**, und das war die teuerste Zeile des
> Moduls: Eine unbekannte Lieferzeit wurde zu null Werktagen und damit zum
> optimistischsten aller möglichen Werte. … **Unbekannt plus bekannt ergibt
> unbekannt.**"

Damals ging es um Werktage auf der Auftragsbestätigung. Dieselbe Zeile, dieselbe
Richtung, zwei Wochen später im Nachbarmodul — und in demselben Objektliteral,
dessen erste Zeile die Lehre bereits befolgt.

Das ist das dritte Mal an diesem Tag, dass eine Berichtigung an einer Stelle
eine Regel aufstellt und die Nachbarzeile sie nicht kennt (`nummerAus` am
Morgen, `bestellschritt` am Mittag). Der Befund ist so verlässlich, dass er
selbst zur Suchmethode geworden ist.

## Und ein zweites Feld am selben Objekt

Alle vier Lieferanten tragen:

```json
"fracht": { "modell": "pauschale", … }
```

**Keine Zeile dieses Bestands hat `modell` je gelesen.**

Ein Feld, das ein Modell benennt, sagt: Es gibt mehr als eines. `fracht()` kann
genau eines — Pauschale je Lieferung plus Zuschlag je Sperrgutposition. Eine
Staffel nach Gewicht oder Entfernung würde sie **still falsch rechnen**: Sie
fände `pauschaleNetto` und nähme es, ohne zu bemerken, dass der Satz anders
gemeint war.

> **Ein Feld, das eine Wahl behauptet, die niemand trifft, ist eine Zusage an
> den nächsten Datensatz.**

## Was geändert wurde

**Aus der Null wird `null`.** `oeffentlicherLieferant` erfindet keine Fracht
mehr.

**Die Kasse weigert sich.** `kundenWarenkorb` wirft `Lieferant ohne
Frachtsatz: …` — dieselbe Sorte Weigerung wie die beiden Zeilen darüber
(`Unbekannte Artikelnummer`, `Artikel ohne Preis`). Ohne Frachtsatz lässt sich
keine Zeile nennen, und null wäre die optimistischste aller Annahmen.

**Neu `frachtsatzbefund(lieferanten)`** in `src/preis.js` — das Register
dessen, was diese Rechnung von einem Frachtsatz verlangt:

| Regel | Befund |
|---|---|
| `ohne-frachtsatz` | kein Satz hinterlegt — auf der Kundenseite würde daraus frei Haus |
| `fremdes-frachtmodell` | ein Modell, das `fracht()` nicht rechnen kann |
| `frachtsatz-unlesbar` | Pauschale oder Zuschlag ist keine Zahl ≥ 0 |
| `schwelle-unlesbar` | `freiHausAbNetto` ist weder positive Zahl noch `null` |

Die letzte Regel lässt `null` ausdrücklich zu: Poschacher hat **keine
erkennbare** Frei-Haus-Schwelle, und das ist ein Befund aus fünfzehn Rechnungen
und keine Lücke. `null` heißt hier „es gibt keine", nicht „wir wissen es
nicht" — der Unterschied ist derselbe wie oben, nur andersherum.

**Gerufen wird er im Bau**, an der Quelle und vor dem Zuschnitt fürs Bündel:
Was dort fehlt, fehlt in jeder Ausgabe. Dieselbe Stelle, an der seit gestern
das Gewichtsverzeichnis geprüft wird.

## Was das heute ändert

**Am Bestand nichts.** Alle vier Lieferanten tragen einen vollständigen,
lesbaren Frachtsatz mit dem Modell, das gerechnet wird. Der Fund ist latent —
und das gehört gesagt, bevor jemand die vier Regeln für eine Reparatur hält.

Was sich ändert, ist der **nächste** Lieferant. Der zweite Bezugsweg über das
Lagerhaus steht seit Wochen als offener Punkt; er kommt als Datensatz, und
dieser Datensatz wird vollständig sein oder den Bau anhalten.

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `die-fracht-faellt-wieder-auf-null` | `?? 0` kehrt zurück — die Kasse zeigt wieder frei Haus |
| `das-frachtmodell-wird-wieder-nicht-gelesen` | die Modellprüfung fällt weg |
