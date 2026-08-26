# Zwei Orte namens Ried

Stand: 2026-08-26. Eine Oberflächenprobe sollte prüfen, ob ein Formularfeld
in den Rechenkern durchgereicht wird. Sie hat stattdessen einen Irrtum
aufgedeckt, der seit dem 16. August in vier Dokumenten steht und einen
Marktbefund umdreht.

## Der Irrtum

Drei Arbeitsdokumente behaupten:

> **Die Ironie der Karte: Der Bezirk des Auftraggebers ist ausgenommen.**
> Ried im Innkreis ist kein Vorsorgegebiet. Ein Handwerksbetrieb aus dem
> Heimatbezirk unterliegt der Pflicht **im eigenen Bezirk nicht**.

Der Betriebssitz lautet aber, aus dem Firmenbuch und in
`shop/data/betreiber.json` festgehalten:

> Freudenthaler Bau GmbH, Marwach 5, **4312 Ried in der Riedmark**,
> Gewerbebehörde **Bezirkshauptmannschaft Perg**

**Ried in der Riedmark liegt im Bezirk Perg. Ried im Innkreis ist ein
anderer Bezirk, rund 150 Kilometer entfernt.** Die Zuordnung steht nicht
auf einer Vermutung: Die zuständige Gewerbebehörde *ist* die
Bezirkshauptmannschaft, und die heißt Perg.

Perg steht nicht auf der Ausnahmeliste. Der Heimatbezirk des Auftraggebers
ist also **Radonvorsorgegebiet** — genau umgekehrt.

## Was sich damit dreht

| | bisher behauptet | tatsächlich |
|---|---|---|
| Heimatbezirk | Ried im Innkreis | Perg |
| auf der Ausnahmeliste? | ja | **nein** |
| Neubau-Vorsorgepflicht im eigenen Bezirk | **gilt nicht** | **gilt** |
| Ansprache regional | „auf Ihren Baustellen gilt das" | „auch bei uns gilt das" |

Der Folgesatz war die Umkehrung des richtigen: *„Ein Inhalt, der die
Pflicht pauschal behauptet, wäre in Ried schlicht falsch und vor
Handwerkern sofort blamiert."* Richtig ist das Gegenteil — ein Inhalt, der
für den Heimatbezirk eine Ausnahme behauptet, wäre falsch, und zwar vor
genau den Leuten, die dort bauen.

**Die Richtung ist die vertraute.** Der Irrtum lag auf der bequemen Seite:
Er erzeugte eine erzählbare Pointe („die Ironie der Karte") und ersparte
die Aussage, dass die eigene Umgebung betroffen ist.

## Wie er entstanden ist und warum er so lange hielt

Es gibt in Oberösterreich zwei Bezirke, deren Namen mit „Ried" beginnen.
Die Gebietsauskunft brauchte am 16. August einen Beispielwert, jemand
setzte „Ried im Innkreis" ein, und ab da war der Beispielwert die
Behauptung: `gebietsauskunft-zwischenloesung.md` nennt ihn „den
Heimatbezirk des Betreibers", `gegenpruefung-bezirksliste.md` prüft ihn
gegen die amtliche Liste und bestätigt ihn — **richtig geprüft, falsche
Frage.** Die Gegenprüfung hat bestätigt, dass Ried im Innkreis ausgenommen
ist. Das stimmt. Es war nur nicht der Bezirk, um den es ging.

Drei Umstände haben ihn geschützt:

1. **Die Firmendaten kamen später.** `betreiber.json` entstand erst am
   26. August. Vorher gab es im Repo keine Stelle, an der der Sitz belegt
   stand — der Irrtum war nicht gegenprüfbar, weil die Gegenprobe fehlte.
2. **Die Testdaten trugen ihn mit.** Die Standardbaustelle aller Kundentests
   lautete „4910 Ried im Innkreis", die Oberfläche zeigte denselben Wert,
   und eine Oberflächenprobe hieß ausdrücklich *„Heimatbezirk ist die
   Ausnahme"*. Ein Testfall, der einen Irrtum benennt, macht ihn haltbar.
3. **Niemand hat nach der Postleitzahl gefragt.** 4910 gegen 4312 — die
   Ziffern standen die ganze Zeit nebeneinander in denselben Dateien.

## Was ihn aufgedeckt hat

Nichts davon war gesucht. Gestern wurde für Gate 23 die Standardbaustelle
der Tests ins Liefergebiet verlegt — von 4910 Ried im Innkreis auf 4312
Ried in der Riedmark, weil der alte Ort außerhalb liegt. Heute lief die
Oberflächenprobe über die geänderte Seite, und ein Szenario schlug fehl:

```
✗ Gebietsauskunft beim Laden (Heimatbezirk ist die Ausnahme)
    fehlt: „steht auf der Ausnahmeliste und ist kein Radonvorsorgegebiet"
    gerendert war: „Perg" steht nicht auf der Ausnahmeliste …
```

Der Testfall behauptete das eine, die Seite sagte das andere. Erst dieser
Widerspruch hat die Frage aufgeworfen, welcher Bezirk denn nun der
Heimatbezirk ist.

> **Eine Änderung an einer Stelle hat einen Irrtum an einer ganz anderen
> sichtbar gemacht.** Das ist kein Zufall, sondern der Nutzen von Proben,
> die den Zusammenhang prüfen statt einzelner Werte — und der Grund, warum
> ein fehlgeschlagener Testfall zuerst eine Frage ist und nicht eine
> Reparaturaufgabe.

## Was berichtigt wurde

| Datei | Änderung |
|---|---|
| `nachfragezahlen-pflichtgebiet-und-bestand.md` | Fund 3 und Folgerung 3 berichtigt, alter Wortlaut als Zitat erhalten |
| `gebietsauskunft-zwischenloesung.md` | der Beispielwert ist nicht der Heimatbezirk |
| `gegenpruefung-bezirksliste.md` | die Bestätigung gilt weiter, die Zuschreibung nicht |
| `STATUS.md` | die Zeile behauptete die Ausnahme im Überblick |
| `bin/oberflaechenprobe.mjs` | Szenario umbenannt und umgedreht; ein zweites prüft, dass der *andere* Ried sehr wohl auf der Liste steht |

Die alten Sätze bleiben als Zitat stehen. Ein stillschweigend korrigiertes
Dokument sieht aus, als wäre nie etwas gewesen — und der nächste Lauf
lernt nichts daraus.

## Was das für den Baustoff-Shop bedeutet

Wenig unmittelbar: Das Radonmodell und der Baustoff-Shop sind nach Gate 12
gleichrangig, aber getrennt. Zwei Dinge sind es trotzdem wert, festgehalten
zu werden.

**Erstens:** Das Liefergebiet des Shops — Perg, Urfahr-Umgebung, Freistadt,
Linz-Land, Linz — ist damit **vollständig Radonvorsorgegebiet.** Falls die
beiden Modelle je zusammengeführt werden, überschneiden sie sich nicht nur
geografisch, sondern in der Pflichtlage.

**Zweitens:** Die Verwechslung war im Testbestand als *Stolperstein
gewählt* („zwei Orte gleichen Namens") und hat trotzdem funktioniert. Wer
eine Falle absichtlich aufstellt, hält sich für gewappnet — das ist keine
Sicherung, sondern ihr Gegenteil.

## Der Formularfehler, um den es eigentlich ging

Er ist behoben und war der Anlass. Seit Gate 23 prüft der Rechenkern das
Liefergebiet über den Bezirk der Baustelle. Das Eingabefeld dafür gab es
in der Oberfläche längst — es speiste seit dem 16. August die
Radon-Gebietsauskunft —, **aber es ging nicht in die Bestelldaten.** Die
Kasse lehnte damit seit gestern jede Bestellung mit Baustelle ab, mit
„Bezirk der Baustelle fehlt", und keine Probe bemerkte es, weil keine je
eine Baustelle angehakt hatte.

Dazu kam ein zweiter Punkt: Dasselbe Feld beantwortet jetzt **zwei Fragen
zweier Modelle** — liegt der Bezirk im Radonvorsorgegebiet (Auskunft), und
liefern wir dorthin (Sperre). Sie stehen als zwei Zeilen untereinander,
nicht als ein Satz. Ein Satz, der beides zugleich beantwortet, wird für
eine Antwort gehalten.

**Elf Oberflächenszenarien, keines fehlgeschlagen** — vier davon neu:
Baustelle im Gebiet geht durch, Baustelle außerhalb wird abgelehnt und
nennt das Gebiet, die Auskunft trennt beide Modelle, und der andere Ried
steht sehr wohl auf der Ausnahmeliste.

Ein dritter Fund am Rande: Der Bündelbau meldete `Doppelt deklariert im
Bündel: schluessel`. Die Namenskollisionsprüfung, die dafür gebaut wurde,
hat gehalten — im Modul harmlos, im zusammengefügten Skript ein
SyntaxError.
