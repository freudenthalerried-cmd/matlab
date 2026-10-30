# Der Korb beantwortet, das Gebot gibt aus

*30. Oktober 2026. Fünf Tage ohne neue Preisliste haben gereicht, um die
Gruppe Kamin vollständig über die eigene Preisgrenze zu schieben. Der zweimal
geübte Handgriff hätte diesmal eine Preisauskunft mitgenommen.*

---

## Was passiert ist

`pruefe-preisalter` hält seit dem 6. September eine einfache Regel: Auf einen
Einkaufspreis, der älter ist als 90 Tage, darf kein Werbegebot ruhen. Gemeldet
wurde sie zweimal, und zweimal war die Antwort dieselbe Handarbeit — Positionen
aus dem Referenzwarenkorb nehmen:

| | Wann | Was |
|---|---|---|
| 1. | 06.09. | Zwei Positionen aus dem Dämmungskorb |
| 2. | 15.10. | Vier aus dem Kaminkorb; von sechs blieben zwei |
| 3. | 30.10. | **Die letzten zwei wären auch gefallen** |

Gemessen am 30. Oktober über alle neun Kaminartikel: der jüngste Preis
**95 Tage**, der älteste 127. Kein einziger unter der Grenze.

> **Der Korb wäre leer gewesen, und niemand hätte ihn geleert.**

## Warum derselbe Griff diesmal falsch gewesen wäre

Der Referenzwarenkorb tut zwei Dinge auf einmal, und das ist bis heute nicht
aufgefallen, weil sie nie in Widerspruch gerieten:

1. **Er trägt das Gebot.** Aus seinem Deckungsbeitrag rechnet das
   Kampagnenwerkzeug das Höchstgebot je Klick.
2. **Er beantwortet eine Frage.** Die Systemliste „Was kostet ein Kaminzug"
   nennt ihre Summe aus genau diesem Korb — seit dem 22. Oktober, und das war
   die Antwort auf die Weisung, der Shop solle für eine Maschine den Preis
   tragen.

Den Korb zu leeren hätte beides getroffen. Das Gebot zu Recht, die Auskunft zu
Unrecht:

> **Der Korb beantwortet eine Frage; das Gebot gibt Geld aus. Nur das zweite
> darf an einem alten Preis scheitern.**

Eine Preisauskunft, die auf einer 95 Tage alten Kalkulation steht, ist
unangenehm — eine, die gar nicht mehr dasteht, ist für den Kunden und für jede
Maschine schlechter. Die Seite nennt ihren Preisstand ohnehin dazu.

## Gebaut ist die Sperre eine Ebene höher

Die Zurückstellung sitzt jetzt dort, wo die Anzeigengruppen ausgewählt werden,
und nicht im Korb. Eine Gruppe, in deren Korb ein Preis über der Grenze liegt,
geht nicht in den ersten Anlauf:

```
Gate 29 auf Gruppenebene: 2 Anzeigengruppe(n) zurückgestellt, weil ihr
Referenzwarenkorb einen Einkaufspreis über 90 Tagen trägt:
  · Dämmung — 1 Position(en), älteste 95 Tage (POS-12575)
  · Kamin — 2 Position(en), älteste 95 Tage (POS-10837 POS-12476)
  Der Korb bleibt stehen: Die Systemliste nennt weiter ihre Summe.
  Zurück kommt die Gruppe mit der nächsten Preisliste, nicht von Hand.
```

Das ist dieselbe Entscheidung wie bei Gate 29 eine Ebene tiefer, wo seit dem
8. September ein einzelnes Keyword zurückgestellt wird, dessen Trefferliste
einen überalterten Preis enthält. Hier gilt sie für die ganze Gruppe.

**Der Unterschied zum Handgriff ist der Rückweg.** Eine herausgenommene
Position kommt nur zurück, wenn jemand daran denkt. Eine zurückgestellte Gruppe
kommt von selbst, sobald eine Preisliste da ist — gemessen beim nächsten Bau,
nicht erinnert.

## Was es kostet, und das steht hier, weil es wehtut

Beworben wird jetzt **eine** Anzeigengruppe statt drei: WDVS. Dämmung und
Kamin sind gesperrt, Kanal, Mörtel und Mauerwerk tragen die Werbekosten
ohnehin nicht. Die Messliste ist von 14 auf **11 Begriffe** gefallen.

> **Das ist der sichtbare Preis einer fehlenden Lieferantenliste** — und er ist
> richtig ausgewiesen: nicht als Fehler im Bau, sondern als Alter einer Datei.

Was bleibt: alle sechs Referenzwarenkörbe, alle vier Systemlisten mit ihren
Summen, alle 46 Artikelseiten mit ihren Preisen. Gesperrt ist das Geldausgeben,
nicht das Auskunftgeben.

## Zwei eigene Fehler beim Bauen

**Die bestehende Zurückstellung überschrieben.** Der erste Wurf zog die
Altpreisgruppen auch aus `spaeter` heraus — der Liste der Gruppen, die ihre
Werbekosten nicht tragen. Damit war die Datei der zurückgestellten Gruppen
leer, und drei Testfälle fielen um, die genau das halten. Zwei Gründe gehören
nebeneinander und nicht übereinander: `spaeter` heißt unverändert „trägt die
Kosten nicht", die Altpreissperre nennt nur die Gruppen, die sonst gelaufen
wären.

**Und die Uhr des Rechners gelesen.** Der erste Entwurf nahm `new Date()` aus
der Nachbarzeile mit. Im Haus gilt `geschaeftstag()` — der Befund vom
15. Oktober, als eine Probe grün war, solange der Kalender September zeigte.

## Ein dritter Fall, den der Test aufgedeckt hat

`test/kampagne.test.js` fährt den Lauf mit halber Kaufquote, um zu zeigen, dass
der Schalter wirkt. Dabei verdoppeln sich die Werbekosten je Verkauf auf 250 €,
und die einzige Gruppe, die so viel trägt, ist Dämmung — die jetzt gesperrt
ist. Der Lauf brach ab, und zwar mit der alten Meldung: *„Keine Gruppe trägt
250 € Werbekosten je Verkauf."*

Die stimmt nicht mehr. Dämmung trägt sie sehr wohl.

> **Das eine ist ein Urteil über das Geschäft, das andere über das Alter einer
> Datei.** Dieselbe Meldung für beide hätte die zweite Lage wie die erste
> aussehen lassen — und niemand hätte eine Preisliste geholt.

Der Lauf endet in diesem Fall jetzt mit einer eigenen Ziffer und einer eigenen
Meldung, die die betroffenen Gruppen samt Preisalter nennt.

## Gegenprobe 324

Sie nimmt die neue Bedingung zurück. Dann geht die gesperrte Gruppe wieder in
den ersten Anlauf, und `pruefe-preisalter` meldet, was es soll:

```
✓ pruefe-preisalter — Eine Anzeigengruppe, deren Korb einen überalterten
  Einkaufspreis trägt, geht wieder in den ersten Anlauf
      meldete rot an der erwarteten Stelle
```

## Zahlen des Tages

| | |
|---|---|
| Kaminartikel unter der Preisgrenze | **0 von 9**, jüngster 95 Tage |
| Beworbene Anzeigengruppen | 3 → **1** |
| Begriffe der Messliste | 14 → **11** |
| Referenzwarenkörbe, unverändert | 6 |
| Systemlisten mit Summe, unverändert | 4 |
| Gegenproben | 323 → **324** |
| Prüfer grün · Tests | 62 · **2795** |
