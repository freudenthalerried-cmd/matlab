# Zuerst lesen, und zuerst falsch

**5. September 2026, spätabends.** Der Auftrag jedes Laufs beginnt mit einer
Anweisung: *„Lies zuerst `PARAMETER.md` und den jüngsten Phasenstand."*
`STATUS.md` sagt in seiner dritten Zeile dasselbe über sich: **„Dieses Dokument
zuerst lesen."**

In derselben Zeile stand:

```
Stand: 2026-08-30. **Dieses Dokument zuerst lesen.** 155 Arbeitsdateien
sind entstanden, mehrere davon korrigieren einander. Hier steht, was gilt.
```

Und in demselben Lauf meldete `npm run pruefe-stand`:

```
Standabgleich: 338 Arbeitsdateien gegen STATUS.md
338 von 338 Dateien sind in STATUS.md genannt.
```

> **183 Dateien und sechs Tage.** Der Prüfer hielt die richtige Zahl in der
> Hand und verglich sie nicht mit der Zahl, die das geprüfte Dokument drei
> Zeilen unter seiner Überschrift über sich selbst druckt.

---

## Die Begründung war schlüssig und zu breit

`bin/standpruefung.mjs` nennt seine Grenze im Kopfkommentar, seit es das
Werkzeug gibt:

> *„**Was es nicht kann.** Es liest keinen Inhalt und erkennt nicht, ob eine
> genannte Aussage noch stimmt. … Ein überholter Satz über eine genannte Datei
> bleibt Sache des Lesers."*

Als allgemeine Aussage stimmt das. Als Begründung für *diese* Lücke war sie zu
breit — und das ist der Befund der Runde, nicht die Zahl selbst.

> **Es gibt eine kleine, scharf umrissene Teilmenge von Aussagen, die ohne
> jedes Textverständnis prüfbar ist: die Aussagen des Dokuments über genau
> das, was der Prüfer ohnehin misst.**

Ein Prüfer, der zählt, kann seinen Zählwert gegen die gedruckte Zahl halten.
Dafür braucht er nichts zu verstehen. „Ich lese keinen Inhalt" hat hier nicht
eine Fähigkeit beschrieben, die fehlt, sondern eine Frage abgewehrt, die
gestellt war.

Dieselbe Gestalt wie an diesem ganzen Tag, zum zehnten Mal: *nicht ein
fehlender Prüfer, sondern ein Prüfer, dessen Reichweite kleiner ist als die
Reichweite der Regel, die er prüft.*

---

## Was das Dokument über sich selbst sagte

Zwölf Zeilen unter der falschen Zahl steht seit dem 29. August eine Warnung —
angebracht, nachdem `STATUS.md` eine Woche lang eine abgelöste Modellfrage als
offen führte:

> *„**Vorsicht bei diesem Dokument selbst.** … wer hier liest, prüft zuerst das
> Datum über dem Absatz."*

**Das oberste Datum war das falscheste.** Die Warnung schickt den Leser zu den
Absatzdaten und übersieht das Datum, unter dem sie selbst steht.

---

## Der Prüfer

`src/statuskopf.js`, angeschlossen an `pruefe-stand`. Geprüft wird der **Kopf**
— die ersten sechs Zeilen — und dort zwei Angaben, beide über den Bestand, den
der Prüfer zählt:

| Angabe | Gemessen an | Meldung |
|---|---|---|
| `N Arbeitsdateien` | dem Zählwert des Prüfers | `zahl-abgeloest` |
| `Stand: JJJJ-MM-TT` | dem jüngsten Eingriff ins Verzeichnis | `stand-abgeloest` |

Fehlt eine der beiden Angaben, ist das kein stilles Bestehen, sondern
`kopf-ohne-zahl` beziehungsweise `kopf-ohne-stand`.

### Warum nicht gegen den Kalender

Ein Statusdokument darf von gestern sein, wenn gestern nichts geschehen ist.
Falsch wird es erst, wenn das Verzeichnis **nach** seinem Stand bearbeitet
wurde. Gemessen wird deshalb der jüngste Eingriff: der letzte Einspielungstag
des Ordners `docs/baustoff-shop/`, und wenn unverbuchte Änderungen im Baum
liegen, der heutige Tag — sie sind genau die Arbeit, die der Kopf noch nicht
kennt. Ein Lauf, der etwas ändert, führt den Kopf mit; ein Lauf, der nur
nachsieht, muss nichts anfassen.

Lässt sich der jüngste Eingriff nicht feststellen, meldet der Prüfer
`stand-nicht-messbar` und wird rot. **Nicht messbar ist nicht grün** — sonst
hinge die Aussage an einem Werkzeug, dessen Ausfall wie Zustimmung aussähe.

### Was ausdrücklich unangetastet bleibt

Weiter unten steht „**Stand 29. August 2026.** … **Neun Prüfer**, die den
Bestand messen". Heute sind es 29. Der Satz ist trotzdem richtig
aufgeschrieben: Er trägt sein Datum bei sich und beschreibt einen vergangenen
Stand. Der Kopf trägt seines auch — er behauptet damit aber, der Stand **des
Dokuments** zu sein. Ein Testfall hält diese Grenze fest.

---

## Die Gegenprobe, und warum sie eine Ziffer verschiebt

Mutiert wird nicht die Zahl, sondern eine Ziffer **davor**: aus `339` wird
`1339`. Die Zahl selbst ändert sich jede Runde — ein Suchtext auf ihr wäre nach
der nächsten Runde nicht mehr auffindbar, und eine Gegenprobe, deren Mutation
nicht ankommt, prüft den unveränderten Bestand und meldet Grün.

Die zweite Angabe, das Datum, lässt sich auf diesem Weg **nicht** prüfen: Sobald
die Datei angefasst ist, gilt der heutige Tag als jüngster Eingriff, und ein
Stand von heute ist nie zu alt. Sie ist stattdessen in
`test/statuskopf.test.js` in beide Richtungen abgedeckt — zu alt meldet, nicht
zu alt meldet nicht.

---

## Sieben Zeilen weiter oben, und ein Widerruf fiel aus dem Fenster

Der Hinweiskasten, der jetzt unter dem Kopf steht, hat beim ersten Testlauf
etwas umgeworfen:

```
not ok — der eigene Bestand trägt jeden Widerruf mit
  widerrufene Aussagen ohne Widerruf:
    STATUS.md:775 (shop-subdomain-als-adresse)
```

Zeile 775 ist der Verzeichniseintrag zu `domainwahl.md`. Er empfahl
`shop.freudenthaler-bau.at` als Shopadresse — abgelöst am 31. August durch
`bauversand.com` — und sagte das nicht dazu.

**Warum er trotzdem sechs Tage lang grün war.** `kopfwiderruf` deckt eine
widerrufene Aussage im **ganzen** Dokument, wenn in den ersten fünfzehn Zeilen
ein Zitatabsatz mit einem Widerrufsmerkmal steht. Das Merkmal dieses Eintrags
enthält das Wort *abgelöst*. In Zeile 9 stand: *„…der beide Modelle **abgelöst**
hat"* — ein Satz über die **Modellfrage**.

> **Ein Wort in einem Absatz über etwas anderes hat eine Falschangabe 760
> Zeilen tiefer stillgestellt.** Mein Kasten schob den Satz auf Zeile 16, und
> damit fiel die Deckung weg, die nie zu diesem Eintrag gehört hat.

Der Eintrag trägt seine Berichtigung jetzt selbst. Nachgemessen:

```
findeWiderrufe(STATUS.md, { kopfzeilen: 0 })  →  0 ungedeckt
                          Kopfvermerk-Deckung →  0 Fundstellen
```

**`STATUS.md` braucht den Kopfvermerk nicht mehr.** Jede der 97 Fundstellen im
Bestand trägt ihre Berichtigung in Sichtweite.

*Die Sammeldeckung durch den Kopf bleibt eingebaut und ist damit weiter das,
was sie hier war: eine Deckung, die vom **Vorkommen eines Wortes** abhängt und
nicht davon, wovon der Satz handelt. Sie steht als offener Punkt unten — hier
wird sie nicht geändert, weil diese Runde vom Kopf handelt und nicht vom
Widerrufsprüfer, und weil zurzeit kein einziger Fund auf sie angewiesen ist.*

---

## Was das kostet

Die Zahl im Kopf muss von jetzt an in jeder Runde mitwachsen. Das ist eine
Ziffer in einer Datei, die die Runde ohnehin bearbeitet — und der Preis dafür,
dass sie stimmt. **Eine Zahl, die niemand nachrechnet, ist keine Auskunft,
sondern eine Behauptung mit Ziffern.**

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-stand` prüft jetzt auch den Kopf |
| Neue Gegenproben | `kopfzahl-abgeloest` (**71 für 35 Prüfer**) |
| Neue Testfälle | 10 (`test/statuskopf.test.js`) |
| Neue Gates | keine |

## Was offen bleibt

- **Die Sammeldeckung im Kopf (`kopfwiderruf`) deckt nach Wortvorkommen, nicht
  nach Gegenstand.** Heute hängt kein einziger Fund an ihr; sollte einer
  dazukommen, ist er auf dieselbe Weise zufällig gedeckt wie Zeile 775 es war.
  Der naheliegende Schnitt wäre, die Deckung an den Bezeichner des Eintrags zu
  binden statt an ein Merkmalswort. **Nicht gebaut** — diese Runde handelt vom
  Kopf des Statusdokuments, nicht vom Widerrufsprüfer.
- **`PARAMETER.md` trägt denselben Kopf** („Stand: **2026-09-03**") und keinen
  Prüfer. Dort gibt es aber nichts zu zählen, woran ein Datum hinge; die
  Weisungstafel ist der Bestand, und ihr jüngster Eintrag ist der 03.09. —
  richtig. Ein Abgleich wäre möglich (jüngster Eingriff in die Datei gegen ihr
  Kopfdatum) und ist **nicht gebaut**: Er würde jede Berichtigung eines Tippfehlers
  zu einer Standänderung erklären.
- **`suche.html`** ist weiterhin die letzte ungelesene Kundenfläche.
- **Der Vorbehalt zum Liefergebiet** steht in `areaServed` nicht dabei.
