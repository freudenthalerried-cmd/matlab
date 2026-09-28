# Die Ablage konnte stornieren, der Betrieb nicht

**12. September 2026. Runde 49.**

## Der Fund

`src/ablage.js` kann seit dem 4. September stornieren: `storniere` zieht eine
Gutschriftnummer, negiert die Beträge und hängt den Eintrag mit `bezugAuf` an
die Rechnung. Geprüft, getestet, vollständig — und **außerhalb der Tests hat
sie niemand gerufen.**

Das war richtig, denn es fehlte das Entscheidende:

> **Ein Storno ohne Papier ist eine Journalzeile über einen Brief, den niemand
> geschrieben hat.** Der Kunde hat eine Rechnung in der Hand; was sie aufhebt,
> muss er ebenfalls in der Hand haben.

Seit gestern kann der Betrieb eine Rechnung stellen. Ab der ersten wird
irgendwann eine falsch sein — ein Steuersatz, eine Menge, eine Anschrift —, und
dann gilt § 131 Abs 1 Z 6 BAO: Der ursprüngliche Inhalt muss feststellbar
bleiben. **Eine falsche Rechnung wird nicht geändert, sondern aufgehoben.**

## Was gebaut wurde

`erzeugeGutschrift` in `src/beleg.js` und die sechste Stufe des Werkzeugs:

```
npm run vorgang -- … --stufe gutschrift --storniert RE-2026-0001 \
                     --grund "Falscher Steuersatz" --ablegen
```

| | |
| --- | --- |
| Pflichtangaben | dieselben wie bei der Rechnung — eine Gutschrift **ist** eine (§ 11 UStG) |
| Bezug | „Hebt auf: Rechnung RE-2026-0001 vom 2026-09-09" |
| Grund | steht auf dem Papier **und** im Journal |
| Beträge | negativ — gutzuschreiben ist, was bezahlt wurde |
| Leistungszeitpunkt | der der aufgehobenen Rechnung: Aufgehoben wird, was damals geliefert wurde |

**Was diese Fassung nicht kann:** eine Teilgutschrift. Sie bräuchte einen
zweiten Warenkorb mit den verbliebenen Positionen und ist nicht gebaut, weil
sie nicht gebraucht ist — *eine halbe Gutschrift, die aussieht wie eine ganze,
wäre schlimmer als keine.*

## Vier Sperren, und jede hat ihren Satz

- **Ohne Akte keine Gutschrift.** Die Stufe liest das Journal auch ohne
  `--ablegen`: *Eine Gutschrift zu einer Rechnung, die in keiner Akte steht,
  ist keine.*
- **Ohne Grund keine Gutschrift.** *Der Grund steht auf dem Papier und im
  Journal. Eine Gutschrift ohne Grund ist gegenüber dem Kunden und gegenüber
  dem Finanzamt dieselbe Auskunft: keine.*
- **Kein zweites Mal.** *Zweimal aufheben heißt einmal zu viel gutschreiben.*
- **Dieselbe Zahl wie die Rechnung.** Der Text entsteht aus dem Warenkorb der
  Anfrage, die Journalzeile aus dem Eintrag der Rechnung. Weichen sie ab,
  bricht der Lauf ab: *Beides kann richtig sein — dann ist es die falsche
  Anfrage zu dieser Rechnung.*

Die Reihenfolge ist die vom 11. September: **erst die Nummer, dann das Papier
damit, dann prüfen, dann ablegen.** `storniere` nimmt die gezogene Nummer
seither entgegen, statt eine zweite zu ziehen — dieselbe Ergänzung, die
`stelleRechnungAus` einen Tag zuvor bekommen hat, und aus demselben Grund.

## Was die Runde nebenbei aufgedeckt hat

Drei Register meldeten sich von selbst, und jedes hatte recht:

1. **`src/aussentexte.js`** — ein neuer Text an einen Kunden, der in keinem
   Ausgangsverzeichnis steht. Eingetragen, und beide Proben (Fremdtext und
   Interna) fahren ihn seither mit.
2. **`src/ungerufen.js`** — `storniere` steht nicht mehr unter den ungerufenen
   Ausfuhren. *Der Prüfer sagt es wörtlich: „ein Grund, der einen Zustand
   entschuldigt, den es nicht mehr gibt."*
3. **Eine Gegenprobe wurde mehrdeutig.** `kontrolle-margenleck` hängt an der
   Zeile `'Leistungsort Österreich, Steuersatz 20 %.'` — die steht jetzt
   zweimal in `beleg.js`. Sie mutiert seither **beide**: *Nur die erste zu
   treffen hieße, die Hälfte des Falls zu prüfen und die andere für sauber zu
   halten.*

Und ein Testfall, der sein Beispiel verloren hat: „eine unbekannte Stufe wird
abgewiesen" prüfte mit `--stufe gutschrift`. Die gibt es jetzt; geprüft wird
mit `mahnung`.

## Ausgang

| | |
| --- | --- |
| Stufen des Werkzeugs | 5 → **6**, und die Karte hat für jede einen Platz |
| Abzweige der Betriebskette | 3 → **4** (`rechnung-falsch`) |
| ungerufene Ausfuhren in `ablage.js` | 5 → **2** (`alsCsv`, `pruefeAblagefelder`) |
| Testfälle | 2.402 |
| Gegenproben | 216 → **217** |

---

**Die Regel dieser Runde:** *Wer etwas ausstellen kann, muss es auch aufheben
können — sonst bleibt als Ausweg nur das Ändern, und das ist genau das
Verbotene.*
