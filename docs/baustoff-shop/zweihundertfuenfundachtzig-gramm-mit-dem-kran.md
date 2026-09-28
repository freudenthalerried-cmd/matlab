# 285 Gramm, mit dem Kran entladen

*5. September 2026. Runde 123.*

## Was auf der Seite steht

Vier Angaben, übereinander, auf der Seite des PVC-Kanalbogens NW 100:

```
[Marker]    palettiert, Kranentladung
Gewicht     0,285 kg   je Stück, aus dem Lieferschein
            Palettierte Ware. Sie wird mit dem Kran entladen …
Zustellung  83,00 €    netto je Lieferung, inkl. Kranentladung
```

> **Dreimal die Kranentladung und einmal das Gewicht, das ihr widerspricht.**
> Beide Angaben stehen dort, seit es die Seite gibt. Nebeneinandergehalten hat
> sie nie jemand.

## Woher die Einstufung kommt

Aus der **Warengruppe**. `bin/katalog-aus-rechnungen.mjs` setzt sie so:

> Wer in Dämmung, Kamin, Kanal oder Mauerwerk steht, ist Sperrgut. Alles
> andere nicht.

Keine der 46 Einstufungen stammt aus einer Angabe des Lieferanten — alle 46
tragen `sperrgutQuelle: "eingeschaetzt"`. Sie entscheidet **7,50 € je
Position** auf der Rechnung des Kunden, sie steht im Marker über dem Preis, im
Lieferabsatz und in der ausgewiesenen Zustellung.

Und wo eine Tatsache dagegenhält, hält sie **in jedem Fall** dagegen. Von den
sieben Artikeln mit belegtem Gewicht sind vier als Sperrgut geführt:

| Artikel | Gewicht je Stück |
|---|---|
| PVC Kanalbogen NW 100 30 grad | 0,285 kg |
| PVC Kanalbogen NW 100 45 grad | 0,285 kg |
| PVC Kanalabzweiger 100/100 | 0,64 kg |
| PVC Kanalrohr NW 100 1 m | 1,73 kg |

> **In den vier Fällen, in denen die Schätzung nachprüfbar ist, spricht die
> Tatsache dagegen — und die Schätzung kostet den Kunden Geld.**

Die naheliegende Ausrede lag nahe genug, dass ich sie zuerst aufgeschrieben
habe: *so etwas wird palettenweise bestellt.* Nachgesehen in den
Lieferantenpositionen: Auf der einen belegten Lieferung stehen **zwei bis drei
Stück je Position**, zusammen rund acht Kilogramm über alle vier
Kanalpositionen. Nach dem Modell des Shops hätte das 4 × 7,50 € = 30 €
Kranentladung gekostet. Für acht Kilogramm PVC.

**Die Ausrede stand schon in der Datei, bevor ich sie nachgeprüft habe.** Sie
ist der Grund, warum dieser Abschnitt hier steht: Ein Grund, den man
aufschreibt, weil er plausibel klingt, ist ein Grund, den man nicht geprüft
hat.

## Was nicht geändert wird — und warum

**Die Einstufung bleibt.** Ob der Lieferant einen Hub verrechnet, sagt der
Lieferant und nicht das Gewicht. Sie umzustellen hieße, eine unbelegte
Schätzung durch eine zweite zu ersetzen — und zwar in die Richtung, die den
Preis senkt: Läge ich falsch, zahlte der Shop die 7,50 € und hätte sie nicht
verrechnet.

> **Die Gebühr stehen zu lassen ist die Richtung, die den Shop überrascht und
> nicht den Kunden.** Das ist dieselbe Haltung wie überall hier — nur wirkt
> sie diesmal zugunsten der Vorsicht und zulasten des Preises.

Das Gewicht je Einheit entscheidet die Frage ohnehin nicht: Fünfhundert Bögen
sind eine Palette, fünf sind ein Paket, und die Kasse verrechnet die
Kranentladung je **Position**. Wonach der Lieferant zählt, ist seit dem
4. September ein eigener Befund (`wonach-ein-hub-zaehlt.md`) — dieser hier
liegt eine Stufe davor: **welche Ware überhaupt palettiert kommt.**

## Was geändert wird

**1. Die Seite sagt es dem Kunden.** Unter dem Lieferabsatz steht seit heute:

> Die Einstufung als palettierte Ware stammt aus der **Warengruppe Kanal** und
> nicht aus einer Angabe des Lieferanten. Dieser Artikel wiegt 0,285 kg je
> Stück — bei kleiner Menge kommt er ohne Palette, und die Entladung entfällt.
> Die Kranentladung ist mit 7,50 € je Position gerechnet und in der Zustellung
> unten enthalten; liegt die Schätzung zu hoch, ist die tatsächliche Lieferung
> um diesen Betrag günstiger.

Damit steht die Herkunft neben der Zahl — die Hausregel, die für Preise seit
Wochen gilt und für diese Einstufung nie galt. Nebenbei ist es der erste
Absatz des Lieferteils, der auf verschiedenen Seiten **verschiedene Dinge
sagt**: die Warengruppe, das Gewicht, den Betrag. Genau das war der offene
Punkt aus der Runde davor, und er ist hier nicht durch Kürzen gelöst worden,
sondern durch eine Angabe, die es je Artikel gibt.

**2. Ein Prüfer.** `npm run pruefe-sperrgut` hält die Einstufung gegen die
Tatsachen des Katalogs und verlangt für jeden Widerspruch einen Grund:

```
Sperrguteinstufung: 46 Artikel, 7 mit belegtem Gewicht
  Ohne belegte Einstufung   46 von 46
  Widersprüche zum Gewicht  4, davon 4 mit Grund
```

Drei Regeln, und keine davon stuft um: `leicht-und-sperrgut`,
`schwer-und-frei` (ab 25 kg, der üblichen Grenze für das Heben durch eine
Person) und `gruppe-widerspricht` — eine gespeicherte Einstufung, die der
eigenen Regel nicht folgt. Dazwischen wird **nicht geurteilt**: Ein Prüfer,
der den unentscheidbaren Fall entscheidet, erfindet.

**3. Eine Frage an den Lieferanten**, eine Stufe vor der bisherigen:

> Welche Artikel kommen bei Ihnen palettiert? Wir stufen das heute nach der
> Warengruppe ein. Auf Ihrem Lieferschein wiegt ein Kanalbogen NW 100 aber
> 0,285 kg je Stück, und wir haben zwei davon bestellt.

**4. Eine Liste weniger.** `SPERRGUT_GRUPPEN` stand zweimal — als Ausfuhr in
`src/artikelliste.js` und als eigenes `Set` in
`bin/katalog-aus-rechnungen.mjs`. Heute gleich, morgen vielleicht nicht. Jetzt
steht sie in `src/sperrguteinstufung.js`, und beide holen sie dort.

Gegenprobe `sperrgut-ohne-widerspruch` zieht einem der vier Fälle den Grund
ab. **53 Gegenproben für 32 Prüfer.**

## Die Lehre

> **Eine Schätzung, die einmal in eine Datei geschrieben wurde, sieht nach
> einer Woche aus wie eine Angabe.** `sperrgutQuelle: "eingeschaetzt"` stand
> von Anfang an daneben — im Katalog, wo es niemand liest. Auf der Seite, wo
> es um Geld geht, stand nur das Ergebnis.
