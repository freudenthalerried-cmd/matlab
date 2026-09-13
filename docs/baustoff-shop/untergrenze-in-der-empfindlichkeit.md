# Die Elastizität rechnete Betriebspunkte aus, die Gate 1 verbietet

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Siebentes Selbstaudit in der Richtung „vom Verhalten zur Erklärung", diesmal
an `empfindlichkeit.js` — dem Modul, dessen Rangfolge begründet, wofür das
erste Geld ausgegeben wird.

## Der Fund

In den `ANNAHMEN` stand seit der ersten Fassung ein Feld: die Rohmarge trägt
`untergrenze: 0.32` — die Gate-1-Schwelle, unter der die Nische fällt.
**Gelesen hat dieses Feld kein Code.** Dasselbe Muster wie beim toten Feld
`storniert` im Ablage-Journal: eine Deklaration ohne Verhalten.

Die Folge war diesmal inhaltlich: `elastizitaet('rohmarge', −10 %)` rechnete
den Besucherbedarf für 31,5 % Marge brav aus — **einen Betriebspunkt, den
Gate 1 verbietet.** Die berühmte Elastizität 1,75, mit der die Rangfolge der
Freigaben begründet wird, beschreibt eine Welt, in der die Nische längst
gefallen wäre. Der Leser musste das selbst wissen; die Ausgabe verschwieg es.

## Die Korrektur

Das Feld ist verdrahtet, in beiden Richtungen der Rechnung:

* **`elastizitaet`** weist jetzt aus, wenn der geprüfte Wert unter der
  Untergrenze liegt (`unterUntergrenze`, `hinweisGate`) — die Zahl bleibt
  stehen, aber sie trägt ihre Einschränkung selbst.
* **`kipppunkt`** nennt neben dem rechnerischen Kipppunkt des Modells auch
  den Punkt, an dem Gate 1 reißt — für die Rohmarge analytisch bei **8,6 %**
  Verschlechterung (0,35 → 0,32). Der Befund daraus: **Die Nische fällt an
  Gate 1 lange bevor die Kaskade rechnerisch kippt.** Der enge Korridor
  zwischen 35 % Basis und 32 % Untergrenze war bekannt; jetzt steht er in
  jeder Kipppunkt-Ausgabe statt nur in den Dokumenten.

Nebenbefund, gleich mitgezogen: `klaertDurch` der Rohmarge sprach noch von
„den zwölf Herstelleranfragen" — dreizehn sind es; der Nachführungslauf hatte
die Quelltexte nicht durchsucht, nur die Dokumente.

## Geprüft

| | |
|---|---|
| neue Testfälle | 2 |
| Testfälle gesamt | 401, alle grün, 0 mit Verdacht |

Gegenprobe: Das Untergrenzen-Feld wird wieder überlesen → **1 Testfall
fällt.** Demo neu gebaut und headless geprüft.

## Kein Gate

Kein Gate ändert sich; die Rangfolge der Freigaben bleibt (die Rohmarge ist
und bleibt die empfindlichste Größe — jetzt mit der zusätzlichen Aussage,
dass ihr Gate vor ihrem Kipppunkt liegt). Alle Preise Platzhalter; nichts
gesendet, nichts gekauft, keine Ausgabe.
