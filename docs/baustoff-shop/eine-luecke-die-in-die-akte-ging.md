# Eine Lücke, die in die Akte ging

**11. September 2026. Runde 38.**

## Der Fund

Die Durchschrift, die seit der Runde davor in der Akte liegt, wurde zum ersten
Mal gelesen. Auf der abgelegten **Rechnung** stand:

```
Lieferung 1 — Direktlieferung, [[ Lieferzeit Lieferung 1 — FEHLT ]]
Lieferdatum: 2026-09-09
```

Zwei Zeilen desselben Belegs, und sie widersprechen einander. Die Ware **ist**
geliefert — ihr Tag steht oben, und er ist die Angabe, die § 11 Abs 1 Z 4 UStG
verlangt. Die Lieferzeit ist eine Zusage über die Zukunft und auf einer
Rechnung gegenstandslos.

> **Eine Lücke, die auf dem falschen Beleg steht, ist schlimmer als keine
> Angabe: Sie behauptet, hier fehle etwas.**

Die Zeile bedient alle drei Belegarten. Auf dem Angebot ist die Lückenmarke
richtig — die Lieferzeit des Lieferanten ist eine der fünf offenen Fragen an
ihn, und eine erfundene Zahl wäre schlimmer. Auf der Rechnung ist sie eine
Behauptung über einen Mangel, den es nicht gibt. Seit heute nennt die Zeile
dort den **Liefertag**.

## Der eigentliche Fund

Dass dieses Papier überhaupt in der Akte lag, ist der schwerere Teil. Das
Werkzeug sagt seit dem 4. September über sich:

> *Ein Beleg mit einer sichtbaren Lücke wird nicht abgelegt. `[[ … FEHLT ]]`
> heißt: Eine Pflichtangabe ist offen. Sieben Jahre lang stünde dann ein
> unvollständiges Papier in der Akte, und die Lücke wäre nicht mehr die
> Erinnerung an eine offene Frage, sondern ein Mangel im Beleg.*

Die Sperre stand im Zweig für Angebot und Auftragsbestätigung. Die
Rechnungsstufe kam am 11. September dazu — **an anderer Stelle derselben
Datei**, und die Sperre kam nicht mit.

> **Eine Regel, die an zwei von drei Stellen steht, ist keine Regel über
> Belege, sondern eine über zwei Zweige.**

Dieselbe Familie wie der Journalbetreff vom Vormittag, und derselbe Grund:
Die dritte Stelle entstand später, und niemand ging die Liste der Regeln
durch, die für die beiden anderen gelten. Sie steht deshalb ab jetzt
**einmal** (`sperreLuecken`) und wird von beiden Zweigen gerufen.

Gemessen fällt sie sofort: Eine Rechnung an einen Kunden ohne UID —
unterhalb von 10.000 € keine Pflichtangabe nach § 11 Abs 1 Z 2 UStG, aber vom
Beleg als Lücke gezeigt — ging bis heute in die Akte und geht jetzt nicht mehr.

## Der dritte Fund, aus dem eigenen ersten Wurf

Die Sperre stand zuerst **hinter** der Nummernvergabe. Sie hielt die Rechnung
auf — und ließ eine gezogene Rechnungsnummer zurück, die kein Papier je tragen
wird.

> **§ 11 Abs 1 Z 5 UStG nimmt eine Nummer nicht zurück.** Für einen Mangel,
> den der Betreiber in einer Minute behebt, wäre eine dauerhafte Lücke im
> fortlaufenden Kreis geblieben — und eine Lücke im Nummernkreis ist gegenüber
> dem Finanzamt erklärungsbedürftig.

Geprüft wird jetzt **vor** der Nummer, an dem Beleg, der ohne sie gebaut ist.
Ausgenommen ist genau eine Lücke: die Rechnungsnummer selbst. Sie ist an
dieser Stelle absichtlich offen — dieselbe Ausnahme, die zwei Absätze weiter
oben schon für die Freigabegründe gilt.

## Ausgang

| | |
| --- | --- |
| Lieferzeitlücke auf der Rechnung | `[[ … FEHLT ]]` → **geliefert am …** |
| Lückensperre beim Ablegen | 2 von 3 Belegarten → **eine Regel, alle drei** |
| Nummernvergabe bei Mangel | Nummer verbraucht → **keine gezogen** |
| Bestellprobe | prüft die Durchschrift jetzt auch auf Lückenmarken |
| Testfälle | 2.372 |
| Gegenproben | 206 → **208** |

Eine Gegenprobe war dabei zu berichtigen: `bezugsweg-auf-dem-kundenbeleg`
zitiert die Zeile, die diese Runde umgebaut hat, wörtlich. Der Prüfer, der
jede Mutation daraufhin ansieht, ob ihr Suchtext überhaupt noch vorkommt, hat
es im selben Lauf gemeldet — *eine Mutation, die nicht mehr ankommt, prüft
nichts und sieht grün aus.*

---

**Die Regel dieser Runde:** *Wer einen dritten Zweig aufmacht, erbt die Regeln
der ersten beiden — oder er schreibt auf, welche er nicht erbt.*
