# Die Liste fragte die Werkzeuge — und schrieb selbst

**8. September 2026.** `src/offenepunkte.js` sammelt alles, was offen ist. Sein
Kopfkommentar sagt seit dem 1. September, warum es das Modul gibt:

> *Eine Liste, die von Hand fortgeschrieben wird, ist an dem Tag falsch, an dem
> jemand einen Punkt schließt und die Liste nicht anfasst. Deshalb dieselbe
> Bauart wie überall hier: Was ein Werkzeug weiß, wird gefragt; was keines
> weiß, steht hier **mit dem Grund**, warum keines es weiß.*

Das stimmt — für die **Punkte**. Es galt nicht für die **Sätze in den
Punkten**. Und dort stehen Zahlen.

---

## Der erste Fund: eine Aufgabe für drei Begriffe, die es nicht mehr gibt

Ein Punkt hieß:

> „Suchvolumen der **32** Keywords im Liefergebiet messen"

`npm run messliste` gibt seit dem 6. September **29** aus. Zwei Begriffe hat
die Landeseite verneint, einen hat Gate 29 am 8. September zurückgestellt, weil
er auf einen 104 Tage alten Einkaufspreis zeigte.

Der Schaden ist nicht die Zahl. Der Schaden ist die **Aufgabe**: Der
Auftraggeber soll beim Keyword-Planer Volumen für zweiunddreißig Begriffe
holen, und für drei davon läuft keine Anzeige mehr. Es ist der einzige Punkt
der Liste, der ihn nichts kostet und den er allein erledigen kann — und er war
zu groß.

> **Die Liste fragte die Werkzeuge, welche Punkte offen sind. Was in den
> Punkten steht, hat sie selbst geschrieben.**

---

## Der zweite Fund: zwei Punkte derselben Liste widersprachen einander

Der Punkt *Preisrhythmus* sagte in der Gegenwartsform:

> „`npm run preiswechsel` **findet** in acht mehrfach gekauften Artikeln über
> bis zu 32 Tage keinen einzigen Preiswechsel."

Drei Einträge weiter, im Punkt *Einkaufspreise wieder belegen*, stand:

> „`npm run preiswechsel` **misst seither nichts**."

Beides am selben Tag geschrieben, beides in derselben Liste, beides von mir.
Der zweite Satz ist der richtige: Die Rechnungspositionen sind beim
Neuaufsetzen des Behälters verlorengegangen, und das Werkzeug weigert sich
seither zu messen, statt über nichts grün zu melden.

> **Ein Werkzeug, dem die Grundlage fehlt, findet nichts — es sucht nicht.**
> Ein Satz in der Gegenwartsform behauptet die Suche.

Der Satz steht jetzt in der Vergangenheit, mit Datum, und sagt dazu, dass die
Grundlage weg ist. Die Beobachtung bleibt, was sie war; sie ist nur keine
laufende Messung mehr.

---

## Was daraus wurde

`npm run pruefe-punkte` hält beides gegen den Bestand:

**Sieben lebende Zahlen** mit je einem Muster, einem Punkt, in dem sie stehen
muss, und einer Quelle, aus der der Sollwert kommt — die Artikelzahl aus der
Katalogdatei, das belegte Gewicht aus derselben, der Mindestbestellwert aus
`data/betreiber.json`, die Preisaltersgrenze aus `src/preisalter.js`, die
Begriffe aus der Messliste. Gemessen wird an der Quelle, aus der auch der Shop
schöpft, nicht mit einer eigenen Rechnung daneben.

**Und alle übrigen Zahlen** brauchen einen Freibrief mit Grund: Gate-Nummern,
Datumsangaben, der HTTP-Status des gesperrten Netzausgangs, die Beträge der
zwei belegten Lieferungen. Ohne diese Liste hätte der Prüfer nur zwei
Möglichkeiten, und beide wären falsch — jede Zahl messen wollen, oder nur die
angeordneten ansehen und den Text ungeprüft wachsen lassen. In beide
Richtungen: Ein Freibrief, zu dem keine Zahl mehr steht, ist selbst ein Fund.

**Und jeder genannte Befehl** wird gegen seine Grundlage gehalten. Liegt sie
nicht da, muss der Satz es sagen — sonst meldet der Prüfer
`werkzeug-misst-nichts-mehr`.

---

## Eine Kleinigkeit am Rand, die keine ist

Der Prüfer liest die Messliste, und die entsteht aus `ausgabe/kampagne/`.
`bin/gegenprobenlauf.mjs` baute vor einer Probe `demo.html`, die Kampagne und
die Website — **die Messliste nicht**. Eine frisch gebaute Anzeigenliste neben
einer Messliste von gestern, und der Prüfer hätte die Aufgabenliste gegen eine
überholte Zahl gehalten.

Genau der Fehler, gegen den er gebaut ist, eine Ebene tiefer. Der Bau holt sie
jetzt mit, und der Prüfer besteht darauf: Ist die Messliste älter als die
Kampagne, misst er nicht, sondern sagt warum.
