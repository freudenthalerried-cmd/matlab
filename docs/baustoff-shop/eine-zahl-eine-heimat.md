# Eine Zahl, eine Heimat

**11. September 2026, neunzehnte Runde.** Die Runde davor hat eine Zahl
gefunden, die zweimal im Bestand stand — die Kaufquote, mit der jedes
Höchstgebot multipliziert wird. Diese Runde hat nachgesehen, ob das ein
Einzelfall war. Es war keiner.

## Zwei weitere Funde

**Die Zielmarge.** `src/empfindlichkeit.js` führte die Rohmarge als Annahme
mit `basis: 0.25`. Die Herkunftszeile darunter sagte:

> *„PARAMETER.md und marge-25-prozent.md; **deckungsgleich mit ZIELMARGE in
> baustoffkatalog.js**"*

Wieder in einem Satz und nicht in einem Aufruf. Und diese Zeile ist die
einzige des Bestands, bei der genau das **schon passiert ist**: Bis zum
1. September stand dort `0.35` aus dem am 22. August verlassenen Radonmodell,
während der Shop längst mit 25 % rechnete. Neun Tage lang maß die
Empfindlichkeitsrechnung ein Drittel mehr Luft, als es gibt — und ausgerechnet
sie weist die Rohmarge als empfindlichsten Hebel aus.

> **Eine Zahl, die schon einmal stehengeblieben ist, bleibt an derselben Stelle
> ein zweites Mal stehen.**

25 % ist dabei nicht irgendeine Zahl, sondern die Weisung des Auftraggebers vom
25. August, die `pruefe-weisungen` führt, und sie bestimmt jeden
Verkaufspreis.

**Der Umsatzsteuersatz — in vier Fassungen.**

| Datei | gebunden an |
|---|---|
| `src/preis.js` — `UST_SATZ` | die Heimat |
| `src/shopkern.js` — `UST_SATZ_KUNDE` | Testfall gegen `preis.js` |
| `src/kontrolle.js` — eigenes Literal | Testfall liest ihren Quelltext, mit ausgeschriebener Begründung |
| **`src/kostenbild.js` — `UST`** | **`assert.equal(UST, 0.20)`** |

Die ersten drei sind ein Musterbeispiel: Die Belegkontrolle führt *bewusst*
eine eigene Zahl, damit sie nicht dasselbe liest wie das Geprüfte — eine
Kontrolle, die ihren Prüfling importiert, prüft sich selbst —, und ein Testfall
liest ihren Quelltext und hält das Literal dagegen.

Die vierte war die einzige ungebundene, und ihre Zusicherung verglich die Zahl
mit sich selbst.

> **Ein Testfall, der eine Zahl gegen dieselbe Zahl hält, hält nichts.**

Das wiegt: Mit diesem Satz wird die Zahlungsgebühr auf brutto gestreckt, und
daran hängt `noetigerUmsatz` — die Leitzahl, die zehn Werkzeuge lesen.

## Warum diesmal ein Register

An drei aufeinanderfolgenden Tagen dieselbe Bauart, jedes Mal durch Zufall
gefunden:

| Tag | Zahl | wo sie zweimal stand |
|---|---|---|
| 10.09. | Bindefrist 14 Tage | Belegvorlage und Artikelseite |
| 11.09. | Kaufquote 0,02 | Annahmenregister und Gebotsrechnung |
| 11.09. | Zielmarge 0,25 | Katalog und Annahmenregister |
| 11.09. | Umsatzsteuer 0,20 | vier Fassungen, drei gebunden |

> **Drei Funde durch Zufall sind kein Grund zu glauben, es seien die letzten.**

`src/zwillingszahlen.js` führt Zahlen, die **eine Heimat** haben: eine Ausfuhr,
die sie erklärt. Jedes weitere Vorkommen desselben Literals liest entweder
diese Heimat — dann steht dort kein Literal mehr — oder steht mit Grund im
Register. `npm run pruefe-zwillinge` hält das gegen 218 Quelldateien.

**Es ist ausdrücklich keine Jagd auf doppelte Literale.** `fixEuro: 0.25` ist
die Kartengebühr von 25 Cent und hat mit der Zielmarge nichts zu tun; genau
diese Verwechslung hat am 5. September den Geheimnisprüfer in die Irre geführt,
und sie steht dort im Kopf ausgeschrieben. Die Szenarienlisten des Rollouts
(`[0.02, 0.01, 0.005]`) sind der **Zweck** der Annahme und nicht ihre Kopie.
Beides steht als begründete Ausnahme im Register.

Drei Dinge musste der Prüfer über sich selbst lernen:

1. **Kommentare zählen nicht.** Dieser Bestand schreibt viele Sätze über seine
   Zahlen; gemessen wird der Code, nicht die Begründung.
2. **Ein Verzeichnis, das Quelltext zitiert, ist Quelltext.** Beim ersten Lauf
   meldete `zwillingszahlen.js` sich dreimal selbst — es trägt jede geführte
   Zahl im Feld `literal`. Dieselbe Eigenart hat schon den Gate-Prüfer über
   sich stolpern lassen.
3. **`0.025` ist nicht `0.02`.** Ein Muster ohne Grenzen zwingt Ausnahmen für
   Dinge, die nie eine Kopie waren.

## Ein Fund der bestehenden Prüfer, nebenbei

`npm run pruefe-leitzahlen` meldete die abgelöste Plandauer von 57 Tagen in
der Aktentabelle — gültig sind 60 Tage, seit am 3. September die
Search-Console-Etappe zwischen Upload und Schalten dazukam. Nachgesehen: ein **Fehltreffer** auf meinen eigenen Satz aus
der vierzehnten Runde, „496 mit der Zahl, 31 Beipack, **57** mit offenem
Listenpreis". Die 57 zählte Artikelkarten und nicht Tage.

Der Prüfer hat recht gehabt, den Satz nicht zu verstehen: Er führte seine Zahl
ohne Hauptwort.

> **Eine Zahl ohne ihr Hauptwort ist für einen Leser und für einen Prüfer
> dasselbe Problem.**

Berichtigt in beide Richtungen — erst der Satz („57 **Karten** mit offenem
Listenpreis"), dann das Zählwort im Register des Prüfers.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2258 | **2264** |
| Prüfer | 49 | **50** |
| Gegenproben | 166 | **168** |

`npm test` grün (2264 bestanden, 3 übersprungen), `npm run pruefe-tests` (2267
Testfälle, 0 mit Verdacht), `npm run pruefe-leitzahlen` grün (390 Fundstellen,
keine Meldung), `npm run pruefe-zwillinge` (13 Fundstellen), `npm run
pruefe-pruefer` (50 Prüfer, 1 abgebrochen — `pruefe-gebinde`). Preise, Gebote
und Leitzahlen sind unverändert: Alle vier Zahlen stimmten schon vorher
überein — geändert hat sich, dass es jetzt gemessen wird statt behauptet.
