# Wo die Zahl nicht nur dasteht, sondern rechnet

*5. September 2026, mittags. Runde 128.*

## Die Aufgabe, die die letzte Runde aufgeschrieben statt gemacht hat

Vormittags stand am Ende von `dreiunddreissig-von-zweiunddreissig.md`:

> Das gehört gelöst … den Quelltext mitdurchsuchen und die Stellen, die eine
> abgelöste Zahl nennen **dürfen**, mit Pflichtgrund ausnehmen. Es ist keine
> Fünf-Minuten-Arbeit … **Aufgeschrieben statt gemacht** — und damit an der
> Stelle, an der ein späterer Lauf ihn findet.

Dies ist dieser Lauf.

## Warum es die Mühe wert ist

`pruefe-leitzahlen` durchsuchte die Akte und die Shoptexte. Der Grund stand im
Kopf der Datei:

> *… nicht der Quelltext: Dort stehen dieselben Zahlen als Testfälle und
> Registereinträge, und ein Prüfer, der seine eigene Prüftabelle meldet, hat
> sich selbst gefunden.*

Er stimmt — für zwei Dateien. Für die übrigen 250 stimmt er nicht, und dort
ist der Schaden größer:

> **In einem Dokument steht eine abgelöste Zahl falsch da. Im Quelltext
> rechnet sie.**

Genau so ist die Schwelle „33 von 33" entstanden: **Das Register kannte die
32 und wusste sogar, wann und warum die 33 abgelöst wurde.** Es hat nur nie
dort gesucht, wo sie stand.

## Wie viel es wirklich war

Die Sorge der letzten Runde — „die Kopfkommentare zitieren alte Zahlen
absichtlich und in Menge" — hat sich beim Nachzählen als übertrieben
erwiesen. Erster Lauf über `src/`, `bin/` und `test/`:

> **252 Dateien, 111 Fundstellen, 11 Meldungen in sechs Dateien.**

*Eine Sorge, die nicht nachgezählt wird, wächst.* Die Kopfkommentare erzählen
zwar viel Geschichte, aber sie tun es meist ohne die alte **Zahl** zu nennen —
und wo sie sie nennen, steht die Bedingung ohnehin danebe­n, weil sie erzählt
wird.

Von den elf:

| Fall | Zahl | was daraus wurde |
|---|---|---|
| `src/leitzahlen.js` erklärt die Wortgrenzen an „45.356" (der Zahl bei Kartenzahlung, vor Gate 21) | abgelöst | **erfundene Beispielzahl** |
| `src/rollout.js` erzählt vom Rechenfehler „bei einer Kette von 57" (vor der Etappe „Search Console", 3.9.) | abgelöst | Bedingung danebengeschrieben |
| `test/rollout.test.js`, derselbe Satz | abgelöst | Bedingung danebengeschrieben |
| `test/kennzahlen.test.js` erzählt von „33 von 33" (vor dem 1. September, als „Kaminkopf Regenhaube" noch in der Kampagne stand) | abgelöst | Bedingung danebengeschrieben |
| `test/leitzahlen.test.js`, sechs Stellen | abgelöst | **Ausnahme mit Grund** |
| `src/gegenprobenregister.js`, Mutationstext | abgelöst | **Ausnahme mit Grund** |

**Kein einziger echter Fund** — die 33 war der letzte, und sie ist vormittags
gefallen. Das ist das erwartbare Ergebnis eines Prüfers, der einen Tag zu spät
kommt; wert ist er trotzdem, was er künftig fängt.

## Die erfundene Beispielzahl

Der interessanteste der vier ist der erste. `src/leitzahlen.js` erklärt, warum
die Wortgrenzen von Hand geprüft werden, und veranschaulichte es an einer
**echten** Leitzahl:

> *`\b` trennt an Punkt und Komma und würde „45.356" in zwei Treffer
> zerlegen.*

Die 45.356 war der nötige Monatsumsatz **bei Kartenzahlung**, gerechnet am
25. August und zwei Tage später von Gate 21 abgelöst.

Die Zahl ist dort ein typografisches Beispiel und keine Angabe — sie hätte
jede sein können. Jetzt ist sie erfunden:

> **Eine Erklärung, die eine geführte Zahl ausborgt, wird eines Tages als
> Behauptung gelesen.**

Und der Prüfer hat seine eigene Veranschaulichung gemeldet, sobald er den
Quelltext lesen durfte. Das ist kein Fehlalarm, sondern der Beleg dafür, dass
die Regel bis in die Erklärung ihrer selbst gilt.

## Das Ausnahmeverzeichnis

`QUELLAUSNAHMEN` führt vier Einträge, **je Datei und je Leitzahl**:

* `gegenprobenregister.js` / `keyword-anzahl` — die Mutation, die „33 von 33"
  zurückschreibt (die Zahl vor dem 1. September, als „Kaminkopf Regenhaube"
  noch in der Kampagne stand).
* `gegenprobenregister.js` / `noetiger-monatsumsatz` — zwei Mutationen, die
  eine abgelöste Zahl in ein Dokument und in eine Quelldatei legen.
* `test/leitzahlen.test.js` / `noetiger-monatsumsatz` und `plan-gesamtdauer` —
  die Proben des Registers rechnen an echten abgelösten Werten vor.

**Nicht je Datei.** Das Gegenprobenregister hat siebenhundert Zeilen; es ganz
auszunehmen hieße, jede künftige abgelöste Zahl darin mit auszunehmen. Wer
eine Mutation mit einer weiteren Leitzahl schreibt, soll an dieser Stelle
darüber nachdenken müssen — und genau das ist eingetreten: Die Gegenprobe
dieser Runde brauchte den vierten Eintrag, und zwar erst, nachdem sie beim
ersten Anlauf rot lief.

In beide Richtungen gehalten: Eine Ausnahme ohne Meldung ist eine Erlaubnis
für etwas, das niemand mehr tut — und deckt beim nächsten Mal einen Fall, der
nichts mit ihr zu tun hat.

## Zwei Nebenbefunde beim Bauen

**Die Pfade passten nicht.** Der erste Anlauf trug `src/gegenprobenregister.js`
im Verzeichnis, der Prüfer meldet aber `shop/src/…`. Ergebnis: „3 Ausnahmen, 0
Meldungen davon gedeckt" — die Rückwärtsprüfung hat es sofort gezeigt. *Ein
Verzeichnis, dessen Schlüssel anders aussehen als die Meldungen, deckt nichts;
ohne die Gegenrichtung wäre es als grün durchgegangen.*

**Der Prüfer benannte seinen eigenen Umfang falsch.** Unter jeder Leitzahl
stand „— 76 Fundstellen in der Akte", während er 609 Dateien las. Jetzt: „in
Akte und Quelltext".

Gegenprobe `abgeloeste-zahl-im-quelltext` legt eine abgelöste Zahl in
`src/werbewirkung.js`. **57 Gegenproben für 33 Prüfer.**

## Der Stand

```
Leitzahlen — 5 im Register, 609 Dateien durchsucht
311 Fundstellen, davon 304 gültig oder mit Bedingung in Sichtweite.
4 Ausnahmen im Quelltext, 7 Meldung(en) davon gedeckt.
```

Vorher: 356 Dateien. **253 Dateien mehr, und die Zahl der offenen Meldungen
ist null.**

## Ein dritter Nebenbefund: die eigenen Bestandszahlen kollidieren

Seit dieser Runde zählt der Bestand **57 Gegenproben** und **33 Prüfer**. Beide
Zahlen sind abgelöste Leitzahlen: `plan-gesamtdauer` (60 Tage; 57 galt vor der
Etappe „Search Console") und `keyword-anzahl` (32 Begriffe; 33 galt, solange „Kaminkopf Regenhaube" in der
Kampagne stand). Jede Zeile, die den Stand nennt, wurde damit zur Fundstelle.

Es gibt keinen vernünftigen Satz, der die Bedingung einer Kettenlänge neben
eine Anzahl von Gegenproben schreibt. Und die Antwort ist dieselbe wie am
4. September, als eine Prozentzahl für eine Tageszahl gehalten wurde:

> **Ein Prüfer, der beim dritten Fehlalarm abgeschaltet wird, findet den
> echten nicht mehr** — also nicht die Regel lockern, sondern die Einheit
> lesen.

Neben den Einheitszeichen (€, %, Tage) liest der Prüfer jetzt **Zählwörter**:
Gegenproben, Prüfer, Testfälle, Artikel, Seiten, Schritte, Gates … Ein Wort,
das eindeutig etwas anderes zählt, deckt die Fundstelle.

**`Begriffe` steht mit Absicht nicht auf der Liste.** Genau das zählt
`keyword-anzahl` — ein Zählwort, das eine Leitzahl zählt, deckte die
Fundstellen zu, für die es den Prüfer gibt.

## Die Lehre

> **Ein Prüfer, der einen Bereich ausspart, spart ihn mit einem Grund aus —
> und der Grund altert wie jeder andere.** „Dort stehen dieselben Zahlen als
> Testfälle" galt für zwei Dateien und wurde auf zweihundertzweiundfünfzig
> angewandt. Das ist dieselbe Form wie Gate 27 gestern: eine Begründung, die
> einmal stimmte, angewandt auf einen Bereich, der inzwischen ein anderer ist.
