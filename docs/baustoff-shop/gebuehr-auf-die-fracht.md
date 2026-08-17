# Die Gebühr auf die durchlaufende Fracht — ein Satz, den die Rechnung nicht kannte

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Selbstaudit nach der bewährten Richtung: vom Verhalten zur Erklärung.

## Der Fund

Im Kopf von `kostenbild.js` steht seit der ersten Fassung ein ausdrücklicher
Warnsatz: Die Fracht ist margenneutral, taucht aber im Bruttobetrag auf —
**„man zahlt Gebühr auf durchlaufende Fracht. Auch das ist ein Effekt, den
man leicht übersieht."**

Übersehen hat ihn: dieselbe Datei. `proBestellung` rechnete die Gebühr
korrekt auf den vollen `summeBrutto` samt Fracht. Die Kaskade
(`gebuehrenanteil`, `kaskade`, `noetigerUmsatz`) und die Monatshochrechnung
in `zahlung.js` (`wirkungAufMonat`) nahmen dagegen nur den Warenumsatz —
dieselbe Gebühr, zwei Bemessungsgrundlagen, und der Unterschied zeigte wie
bei der Frachtschwelle, der Brutto-UVP und dem Margenleck **in die
optimistische Richtung**. Das ist das vierte Mal, dass ein Zahlenfehler
dieser Art gefunden wird, und alle vier zeigten nach oben; keiner nach
unten. Das ist kein Zufall mehr, sondern ein Muster der eigenen Annahmen —
und der beste Grund, die Auditrichtung „wo steht, dass wir das dürfen?"
beizubehalten.

## Die Korrektur

`gebuehrenanteil(zahlwegId, warenkorbNetto, frachtProBestellungNetto = 0)`
streckt den Prozentsatz jetzt um den Frachtanteil:

```
Anteil = Prozentsatz × 1,2 × (1 + Fracht/Warenkorb) + Fixbetrag/Warenkorb
```

Kaskade, `noetigerUmsatz` und `wirkungAufMonat` reichen die Fracht je
Bestellung durch (`lage.frachtProBestellungNetto`, Standard 0 — bestehende
Aufrufer rechnen unverändert). Die geschlossene Lösung der Umkehrrechnung
bleibt erhalten, weil der Frachtanteil je Bestellung anfällt und sich wie
der Fixbetrag herauskürzt.

**Die Größenordnung, ehrlich benannt:** Bei 30 € Fracht je 650-€-Warenkorb
und Kartenzahlung sind es rund 0,50 € je Bestellung, unter einem Prozent am
nötigen Umsatz. Der Fund ist klein. Was nicht klein ist: Eine Kaskade, die
ihrer eigenen Kopfzeile widerspricht, ist an genau der Stelle unglaubwürdig,
an der sie Entscheidungen tragen soll — und der Warnsatz stand dort, weil
der Effekt beim Schreiben schon einmal fast übersehen worden war.

## Geprüft

| | |
|---|---|
| neue Testfälle | 4 |
| Testfälle gesamt | 395, alle grün, 0 mit Verdacht |

Der wichtigste neue Testfall hält Kaskade und Einzelbestellung am **echten
Referenzwarenkorb** gegeneinander: gleiche Eingaben, gleiche Gebühr, auf den
Cent. Genau dieser Vergleich hätte den Fund vom ersten Tag an verhindert.

Gegenproben an der Prüfung, beide sofort rot, danach zurückgenommen:

| Mutation | |
|---|---|
| die Fracht fällt wieder aus der Kaskaden-Grundlage | 3 Testfälle fallen |
| die Monatshochrechnung lässt die Fracht wieder aus | 1 Testfall fällt |

Demo neu gebaut und headless geprüft (Kaskaden-Anzeige rechnet mit
Standard 0 unverändert).

## Nachtrag: die kanonischen Zahlen halten — nachgerechnet, nicht behauptet

Eine Korrektur, die niemand aufruft, wäre nur eine Geste. Deshalb wurde der
Effekt am **echten Referenzkorb** in die Planungsgrößen durchgerechnet: Der
Referenzkorb trägt 162 € Fracht auf 3.088,17 € Warenwert (**5,2 %**), auf
den 650-€-Planungskorb skaliert ~34,10 € je Bestellung. Damit steigt der
nötige Umsatz je nach Zahlweg um 0,3–0,9 % (Kartenzahlung +98 €,
B2B-Rechnungskauf +251 € im Monat) — **Bestellungen und Sessionbedarf
ändern sich bei keinem der drei geprüften Zahlwege**, die Rundung fängt es
auf. Die kanonischen Planungszahlen bleiben also stehen; ein eigener
Testfall hält genau das fest und springt zuerst, falls eine Gebühr oder die
Fracht wächst.

## Kein Gate

Kein Gate ändert sich; die Referenzzahlen bleiben (als optimistisch
markiert), alle Preise Platzhalter. Nichts gesendet, nichts gekauft, keine
Ausgabe.
