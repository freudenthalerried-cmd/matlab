# Die eigene Korrektur hat die Handelsspanne verraten

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Vorgenommen war der systematische Abgleich, der sich aus dem Fund der Vorrunde
ergeben hatte: **Was in den AGB steht, muss im Ablauf vorkommen — und
umgekehrt.** Dreizehn AGB-Punkte gegen elf Ablaufschritte, Punkt für Punkt.

Der Abgleich hat drei Befunde geliefert. Der erste ist der teuerste, und er
stammt aus meiner eigenen Korrektur von vor zwei Runden.

## Befund 1: Das Angebot nannte den Einkaufswert

AGB-Punkt 5 — jetzt vorhanden, dazu unten — betrifft die Mindestbestellmenge.
Beim Nachsehen, wie der Shop sie dem Kunden mitteilt, stand das hier im
**Angebot an den Kunden**:

```
Warenwert netto            330,00 €
…
Hinweise:
  · Rohrhersteller Österreich: Mindestbestellwert 250 € netto Bestellwert,
    erreicht sind 231 €, es fehlen 19 €.
```

330 € Warenwert, daneben 231 € Einkauf. **Das sind 30 % Handelsspanne, in
Ziffern, mit dem Hersteller namentlich daneben.** Ein Einkäufer eines
Handwerksbetriebs braucht dafür keine Sekunde — und er verhandelt bei jedem
Folgeauftrag mit dieser Zahl.

Der Satz stammt aus
[`frachtschwelle-und-bestellwert.md`](./frachtschwelle-und-bestellwert.md).
Dort hieß es zur Begründung: *„Der Hinweis an den Kunden nennt den erreichten
Bestellwert, nicht nur den Fehlbetrag — ein Fehlbetrag ohne Bezugsgröße lässt
sich nicht nachrechnen."* Der Gedanke war richtig. Die Bezugsgröße war es
nicht: Sie gehört dem Betreiber, nicht dem Kunden. Und die Formulierung „der
Hinweis an den Kunden" stand damals schon da — ich habe sie geschrieben, ohne
nachzusehen, wohin dieser Hinweis tatsächlich geht.

**Umfang:** 1.005 von 1.533 durchgerechneten Angeboten enthielten einen
Einkaufswert. Betroffen war ausschließlich das Angebot — Auftragsbestätigung
und Rechnung tragen die Hinweise nicht.

### Behoben mit zwei Fassungen

`warenkorb.js` liefert jetzt beides getrennt:

| | |
|---|---|
| `hinweise` | was der Kunde lesen darf |
| `hinweiseIntern` | vollständig, für den Betreiber |

Der Hinweis an den Kunden nennt den Fehlbetrag in **seiner** Währung, dem
Warenwert:

> Rohrhersteller Österreich: Die Bestellmenge für diesen Hersteller ist noch zu
> klein. Es fehlen rund 28 € Warenwert netto.

Die 28 € sind die 19 € Fehlbetrag im Einkauf, hochgerechnet mit dem
Verkaufs-Einkaufs-Verhältnis dieser Gruppe. Der Kunde kann damit handeln — er
weiß, wie viel er zulegen muss — und nichts zurückrechnen: Er kennt weder das
Verhältnis noch die Schwelle.

Ein Hinweis, der nur den Fehlbetrag nennt, ohne Bezugsgröße, bleibt trotzdem
brauchbar, wenn der Fehlbetrag in der Größe angegeben ist, die der Kunde vor
sich hat. Das war der Denkfehler: nicht die fehlende Bezugsgröße, sondern die
falsche.

### Und ein Riegel, damit es nicht zurückkommt

`pruefeMargenleck(vorgang)` in `kontrolle.js` sucht die Beträge, die **nur der
Betreiber kennen darf**, in den Papieren, die **der Kunde bekommt**:
Wareneinsatz gesamt, Deckungsbeitrag, Einkaufswert je Lieferant — gegen
Angebot, Auftragsbestätigung und Rechnung.

Bewusst grob: Jede Schreibweise zählt, auch ein zufälliger Treffer. Ein
Fehlalarm kostet eine Minute Nachsehen; ein übersehener Betrag kostet die
Verhandlungsposition bei jedem Folgeauftrag.

Gegenprobe: den alten Hinweis wieder eingesetzt → **vier Testfälle fallen**.

## Befund 2: Zwei AGB-Punkte widersprachen einander

Punkt 3 versprach *„Reverse Charge bei innergemeinschaftlicher Lieferung"*.
Punkt 12 schließt Lieferungen außerhalb Österreichs aus — eingeführt in
[`ruegefrist-und-baustelle.md`](./ruegefrist-und-baustelle.md), vor zwei
Runden.

Damit kann der Fall, den Punkt 3 regelt, nicht eintreten. Schlimmer: Der Punkt
beschreibt die Steuerlage falsch herum. **Reverse Charge betrifft hier die
Eingangsseite**, nicht die Ausgangsseite — den innergemeinschaftlichen Erwerb
bei den ausländischen Herstellern im Reihengeschäft, wie in
[`beleg-und-reihengeschaeft.md`](./beleg-und-reihengeschaeft.md) hergeleitet.
Auf der Rechnung an den Kunden stehen immer 20 %.

Punkt 3 sagt das jetzt und verweist auf Punkt 12. Ein Testfall prüft, dass
jeder Querverweis zwischen AGB-Punkten auf einen vorhandenen Punkt zeigt — bei
zwei Einschüben in drei Runden ist eine Nummer schnell verschoben.

## Befund 3: Eine Ablehnung ohne veröffentlichte Grundlage

Der Shop weist Bestellungen zurück, die den Mindestbestellwert eines Herstellers
nicht erreichen. `bestellbar: false`, `darfBestaetigtWerden` verweigert die
Annahme — von Anfang an so gebaut.

**In keinem AGB-Punkt stand, dass es Mindestbestellmengen gibt.** Ein Kunde, der
231 € Drainagerohr in den Warenkorb legt, wurde abgewiesen, ohne dass die
veröffentlichten Bedingungen den Grund kannten.

Neuer Punkt 5. Er nennt auch, in welcher Größe die fehlende Menge ausgewiesen
wird — im Warenwert, nicht im Einkauf.

## Was der Abgleich nicht gefunden hat

Der Vollständigkeit halber, weil eine Prüfung ohne Fehlanzeigen verdächtig ist:

* **Punkt 9 schließt Nachnahme und Barzahlung aus.** `zahlung.js` führt beide,
  aber als Vergleichsgegenstand einer Auswertung, nicht als angebotenen Zahlweg
  — und die Anforderung `keinBarumsatz` markiert die Nachnahme dort als
  ungeeignet. Kein Widerspruch.
* **Punkte 10, 11, 13** (Gewährleistung, Rücknahme, Gerichtsstand) sind reine
  Vertragsklauseln ohne Entsprechung im Ablauf. Das ist richtig so.
* **Die vierzehntägige Bindefrist** des Angebots nach § 862 ABGB steht im
  Angebotstext, aber in keinem AGB-Punkt. Vertretbar, weil sie im Angebot selbst
  steht — vermerkt, nicht behoben.

## Geprüft

| | |
|---|---|
| neue Testfälle | 9 |
| Testfälle gesamt | 322, alle grün, 0 mit Verdacht |

Am gebauten Bündel nachgesehen, nicht nur an den Modulen: Der Warenkorb aus
2 × Drainagerohr ist `bestellbar: false`, der Kundenhinweis lautet „Es fehlen
rund 28 € Warenwert netto", der interne nennt weiterhin die 231 €, kein
Kundenbeleg enthält einen Einkaufswert, und die AGB führen dreizehn Punkte
samt dem neuen zur Mindestbestellmenge. Die Kennzahlentafel der Demoseite zeigt
beide Fassungen nebeneinander — sie ist die Sicht des Betreibers und zeigt
ohnehin Deckungsbeitrag und Mischmarge.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. 3.900,20 € brutto und 34,2 %
Mischmarge bleiben; alle Preise sind Platzhalter.

Die Lehre ist eine über Korrekturen. Der Fund der Frachtschwelle war richtig und
die Behebung war es auch — bis auf einen Satz, der beim Beheben nebenbei
entstanden ist und den niemand mehr geprüft hat, weil die eigentliche Sache
stimmte. **Eine Korrektur ist eine Änderung wie jede andere und verdient
dieselbe Gegenprobe.**
