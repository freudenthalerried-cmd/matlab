# Sechs Papierarten, zwei Umsätze

**12. September 2026. Runde 50.**

## Der Anlass

`alsCsv` — der Auszug für die Buchhaltung — gibt es seit dem Bau der Ablage am
4. September. Gerufen hat sie außerhalb der Tests niemand, geführt mit dem
Grund: *„eine Buchhaltung, die etwas abholt."*

> **Sie kommt mit der ersten Rechnung — und dann sofort.** Die
> Umsatzsteuervoranmeldung ist am 15. des zweitfolgenden Monats fällig (§ 21
> Abs 1 UStG). Ein Werkzeug, das erst danach gebaut wird, kommt zu spät —
> dieselbe Lehre wie beim Ablageort, der **vor** dem ersten Datensatz da sein
> musste.

`npm run buchhaltung -- --jahr 2026 --monat 9` schreibt ihn seit heute.

## Der Fund beim Bauen

Die Akte sammelt inzwischen **sechs Papierarten**. Ein Auszug, der alles
zusammenzählt, was einen Betrag trägt, meldet dem Finanzamt das Angebot mit.

Am gefährlichsten ist die **Lieferantenbestellung**. Sie trägt seit heute früh
einen Nettobetrag — den **Einkaufswert**:

> **Er ist kein Umsatz dieses Betriebs, sondern seine Ausgabe. Ohne
> Unterscheidung stünde er in der Voranmeldung, mit umgekehrtem Vorzeichen zur
> Wahrheit.**

`ARTEN` sagt deshalb seit heute, welche Art ein Umsatz ist:

| | |
| --- | --- |
| Rechnung, Gutschrift | **Umsatz** — die eine positiv, die andere negativ |
| Angebot, Auftragsbestätigung, Absage | ein Schritt davor oder daneben |
| Lieferantenbestellung | Ausgabe; die Vorsteuer steht auf **seiner** Rechnung, nicht auf unserer Bestellung |

Die Steuer wird nicht ein zweites Mal gerechnet: Was auf dem Beleg steht, ist
brutto minus netto.

## Und die dritte Dateiart

Der Auszug trägt Vorgangsnummern, Beträge und Betreffs einer ganzen Periode in
**einer** Datei. Die Sperre des Ablageorts kannte Journale und Durchschriften.

> **Eine dritte Dateiart, die dieselben Daten trägt und von keiner Regel
> erfasst ist, wäre der Fund vom 11. September noch einmal.**

`istBuchhaltung` und zwei Regeln — `auszug-im-verzeichnis`,
`auszug-am-falschen-ort` — stehen seit heute daneben, genau wie für die
Durchschrift.

Und wie bei `npm run akte` steht der **Inhalt** nicht auf dem Bildschirm: Auf
dem Schirm stehen die Summen, die Zeilen stehen in der Datei, und die liegt im
gesperrten Ordner.

## Zwei Weigerungen statt einer leeren Datei

- Kein Journal des Jahres: *Ohne abgelegten Geschäftsfall gibt es nichts
  abzuholen — und eine leere Datei an den Steuerberater sähe aus wie ein Monat
  ohne Umsatz.*
- Kein Eintrag in der Periode: Die Summen werden gezeigt, aber **keine Datei
  geschrieben**. *Eine leere CSV sähe aus wie ein geprüfter Monat ohne Umsatz.*

## Ausgang

| | |
| --- | --- |
| `npm run buchhaltung` | neu — Periode, Datei, drei Zahlen |
| `ARTEN` | um `umsatz` ergänzt, mit Grund je Art |
| Regeln des Ablageorts | 5 → **7** |
| ungerufene Ausfuhren in `ablage.js` | 2 → **1** (`pruefeAblagefelder`) |
| Testfälle | 2.404 |
| Gegenproben | 217 → **218** |

Die eine verbliebene ungerufene Ausfuhr wartet auf einen Eintrag, der an
`haltefest` vorbeigekommen ist — was das Werkzeug nicht zulässt. Das ist ein
Grund, der nicht verfällt.

---

**Die Regel dieser Runde:** *Ein Betrag sagt nicht, was er ist. Wer Beträge
addiert, muss vorher aufgeschrieben haben, welche zusammengehören.*
