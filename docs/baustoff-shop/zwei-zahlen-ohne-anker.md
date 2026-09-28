# Zwei Zahlen ohne Anker

**7. September 2026.** Die Runde davor hat den Rolloutplan gegen seine Register
gehalten. Dieselbe Frage an die **PR-Beschreibung**, das zweite Papier, das der
Auftraggeber liest: `npm run pruefe-schaufenster` misst dort 34 Kennzahlen —
und wie vollständig ist diese Liste?

Nachgezählt: **105 Zahlen** stehen im Text, **47** davon berührt eines der 34
Muster. Der große Rest ist richtig so — Datumsangaben, Paragraphen,
Gate-Nummern und vor allem die **Geschichte**: „616 Testfälle", „77 Seiten",
„23 Gates" stehen in der Korrekturtabelle und beschreiben, was einmal falsch
war. Eine historische Zahl nachzuziehen wäre der Fehler.

Zwei Angaben blieben übrig, die **leben**:

| Zeile | Zahl | gemessen? |
|---|---|---|
| `Katalog \| 46 echte Artikel aus **15** Lieferantenbelegen` | 15 | nein |
| `Kampagne \| **6** Suchkampagnen gerechnet, 3 im ersten Anlauf` | 6 | nein |

Die **3** daneben war seit jeher gemessen, die **6** nicht.

> **Ein Prüfer, der nur die angeordneten Zahlen misst, ist so vollständig wie
> die Anordnung.**

---

## Beide sind ableitbar, und beide waren es schon

* Die Belegzahl schreibt der **Katalogerzeuger** selbst in `_datenstand`:
  *„Aus 15 Lieferantenbelegen, jüngster Stand 2026-08-17."* Sie steht damit in
  einer verfolgten Datei, obwohl die Rechnungen selbst unter `preise/` liegen
  und dort bleiben.
* Die Kampagnenzahl ist die Summe der beiden Kampagnendateien: die mit Budget
  und die zurückgestellten.

Zwei neue Muster, **36 Kennzahlen** statt 34.

**Der Prüfer hat sich beim ersten Lauf selbst gemeldet:** Er führt eine
Kennzahl über die Zahl seiner eigenen Kennzahlen, und die Beschreibung sagte
noch 34. *Eine Tafel, die sich selbst zählt, merkt es, wenn sie wächst.*

---

## Eine Gegenwart in einer historischen Zeile

Beim Durchgehen fiel eine dritte Stelle auf, und sie ist die interessantere.
In der Korrekturtabelle steht der Eintrag „Korbfläche ohne Grenze" — eine
Geschichte vom 5. September. Ihr letzter Satz beschreibt aber **den heutigen
Zustand**:

> *„…und ein Szenario, das nicht an dieser Liste hängt, sondern alle **81**
> Seiten durchgeht und an der gerenderten Seite fragt, ob zu einem Legen-Knopf
> die Grenze gehört."*

Das Szenario gibt es, es läuft, und es geht seit dem 6. September über **82**
Seiten. Die Zahl daneben — „die Einzeldateifassung trägt 81 Seiten" — ist
dagegen Geschichte und bleibt.

> **In einem Dokument, das Geschichte und Gegenwart mischt, ist der
> Gegenwartssatz in der historischen Zeile derjenige, den niemand nachzieht.**

Der Satz nennt jetzt keine Zahl mehr: *„sondern jede gebaute Seite durchgeht"*.
Was dort steht, kann nicht mehr ablaufen — und wer die Zahl wissen will, findet
sie zwei Zeilen weiter oben in der gemessenen Tafel.

---

## Geprüft

Drei neue Fälle in `test/schaufenster.test.js`: beide Muster greifen auf ihrer
Zeile, und beide greifen **nicht** auf einer Nachbarzeile mit derselben Zahl
(„aus 15 Rechnungen nicht ableitbar" ist keine Belegzahl). Ein Muster, das auch
die Nachbarzahl fängt, misst irgendetwas.

Gegenprobe `lebende-zahl-ohne-anker` verschiebt den Sollwert der Belegzahl um
eins und verlangt, dass sie wirklich gemessen wird und nicht bloß dasteht.
