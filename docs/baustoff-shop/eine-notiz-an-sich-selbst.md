# Eine Notiz an sich selbst

**5. September 2026, nachts.** In den offenen Punkten stand er Runde um Runde,
zuletzt heute in drei Berichten hintereinander:

> *„Der Vorbehalt zum Liefergebiet steht in `areaServed` nicht dabei."*

**Ein offener Punkt, der in jedem Rundenbericht steht und in keiner Prüfung,
ist ein Vorsatz.** Diese Runde misst ihn.

---

## Was gemessen wurde

`src/liefergebiet.js` trägt seit dem 26. August:

```js
vorbehalt:
  'Das tatsächliche Liefergebiet des Lieferanten ist unbekannt — aus fünfzehn '
  + 'Rechnungen nicht ableitbar, weil die Frachtpauschale nicht nach Entfernung '
  + 'staffelt. Beim Lieferanten zu erfragen; bis dahin gilt diese Liste als die '
  + 'engere der beiden.'
```

Dagegen die Ausgabe desselben Tages:

| Wo das Gebiet steht | Wie |
|---|---|
| **81 von 81** gebauten Seiten | Fußzeile: „Liefergebiet: Perg, … — regional, nicht österreichweit" |
| `lieferung.html` | Preistafel: „Liefergebiet · 5 Bezirke · Perg, …" |
| `llms.txt` | zweimal, einmal davon: „Anfragen aus anderen Bezirken werden **nicht angenommen**" |
| JSON-LD | `areaServed` auf jeder Artikel- und Organisationsauszeichnung |

Und der Vorbehalt? In **keiner** davon. Er steht in genau einer Ausgabedatei —
`shop.js`, dem Bündel, als Quelltext, den niemand liest.

> **Fünf Bezirke werden dem Kunden und jeder Maschine als Tatsache genannt. Die
> Grundlage ist eine Annahme, und die Annahme steht im Rechenkern.**

Die Annahme ist dabei die freundliche: *unsere Liste sei die engere der
beiden.* Stimmt sie nicht — liefert der Lieferant nur nach Perg —, dann sagt
der Shop in vier Bezirken zu, was er nicht halten kann. Genau darum ist die
Gebietsfrage eine der fünf offenen Fragen an den Lieferanten.

---

## Dieselbe Seite löst denselben Fall zwei Zeilen tiefer

Auf `lieferung.html` stand die Gebietszeile **unqualifiziert** — und direkt
darunter:

> *„Welcher Artikel als palettierte Ware gilt, ist **geschätzt**: Die Einstufung
> folgt aus der Warengruppe und nicht aus einer Angabe des Lieferanten. …
> Aufgelöst wird das mit der Palettenfrage an den Lieferanten."*

Für **7,50 € Kranentladung** steht die Unsicherheit da. Für die Zusage, auf der
der ganze Shop ruht, nicht.

*Dieselbe Gestalt wie am Mittag bei der Frachtschranke: Die Datei, in der der
Fehler steht, löst denselben Fall an anderer Stelle bereits richtig.*

---

## Was jetzt dasteht

Auf `lieferung.html`, in derselben Form wie die Palettenschätzung:

> Das Liefergebiet ist **unsere Entscheidung**, und ob unser Lieferant in alle
> fünf Bezirke zustellt, ist nicht bestätigt … Innerhalb dieser Bezirke sagen
> wir zu, und wenn der Lieferant nicht hinkommt, erfahren Sie es vor der
> Bestellung und nicht danach.

In `llms.txt`, weil ein Assistent diese Datei zitiert und nicht liest:

> Das Gebiet ist unsere Entscheidung, nicht die Zusage des Lieferanten.

**In `areaServed` nicht** — und das ist die Antwort auf den offenen Punkt, wie
er drei Runden lang formuliert war: `areaServed` ist eine **Ortsliste** und
kein Satz. Ein Vorbehalt gehört dorthin, wo Sätze stehen. Die Liste selbst
bleibt die vorsichtige (fünf Bezirke statt „Österreich"), und die Seite, auf
der sie steht, trägt den Vorbehalt.

---

## Der Prüfer, damit es nicht beim Vorsatz bleibt

`npm run pruefe-vorbehalte`, dreißigster Prüfer. Er hält ein Register gegen den
Bestand, **in beide Richtungen**:

- Jeder Eintrag nennt Ausgabedateien, in denen sein Kern vorkommt — oder einen
  tragfähigen Grund, warum keine.
- Jedes Feld `vorbehalt:` in `src/`, das in keinem Eintrag steht, ist ein Fund.

Zwei Einträge heute. Der zweite ist `src/gebiet.js` — die Bezirksliste des
Radonvorsorgegebiets aus Sekundärquellen. Sie steht **ohne Ausgabe, mit
Grund**: Ihr Vorbehalt ist richtig verdrahtet (*„wandert in jede Auskunft"*,
seit dem 16. August, mit Testfall), sie hat nur keine Auskunft, weil
`vorsorgeauskunft` außerhalb der Tests niemand ruft. *Er hat keine Ausgabe,
weil es keine Auskunft gibt, nicht weil er vergessen wurde* — und dieser
Unterschied ist genau das, was ein Register mit Pflichtgrund festhält.

### Der erste Lauf fand die Prüfdatei selbst

```
✗ src/vorbehalt.js trägt ein Feld „vorbehalt:" und steht in keinem Eintrag
```

Die Fundstelle war die **Meldung**, die den Fund beschreibt:

```js
text: `${q.datei} trägt ein Feld „vorbehalt:" und steht in keinem Eintrag`
```

> **Ein Prüfer, der ein Wort sucht, findet den Satz, in dem er das Wort
> erklärt.** Dieselbe Familie wie das Flächenregister, das sich selbst
> mitzählte.

Gesucht wird seither nach einem **Feld** und nicht nach einem Wort: am
Zeilenanfang, wie eine Eigenschaft in einem Objektliteral dasteht. Das ist eine
Annahme über die Schreibweise dieses Bestands; sie steht im Kopfkommentar,
damit jemand sie widerlegen kann.

---

## Und das Leserregister meldete sich, wie es soll

Der Gesamtlauf danach:

```
✗ bin/vorbehaltspruefung.mjs fasst ausgabe/ an und steht in keinem Eintrag
```

Der neue Prüfer liest die gebaute Ausgabe — er **muss** es, sein Befund ist ja
gerade, ob ein Vorbehalt sie erreicht. Das Register verlangt dafür einen
Eintrag mit Grund, und er hat ihn bekommen: Er weigert sich **nicht** über
einem veralteten Erzeugnis, sondern läuft im Gesamtlauf hinter dem Bauschritt
und nennt die Zahl der Ausgabedateien, aus denen er geurteilt hat. *Ein Abbruch
wäre hier kein Schutz, sondern ein Schweigen.*

Dritter Prüfer an einem Tag, den dieses Register ohne Zutun gefunden hat.

---

## Nachtrag um 00:06 — die Regel von heute Nachmittag hat sich gemeldet

Sechs Stunden nach ihrem Einbau, beim ersten Mitternachtswechsel:

```
✗ der Kopf sagt „Stand: 2026-09-05", das Verzeichnis wurde am 2026-09-06 angefasst
```

Genau der Fall, für den `stand-abgeloest` gebaut wurde, und er ist beim ersten
Gelegenheit eingetreten — nicht durch Vergessen, sondern weil die Arbeit über
Mitternacht lief. Kopf auf `2026-09-06` gezogen. *Die Dokumente dieser Runde
tragen weiter den 5. September: Sie beschreiben, wann gearbeitet wurde. Der
Kopf beschreibt, wann zuletzt angefasst wurde. Das ist nicht dasselbe, und
deshalb misst der Prüfer den Eingriff und nicht den Text.*

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | `pruefe-vorbehalte` (30 Prüfer ohne Browser) |
| Neue Gegenproben | `vorbehalt-erreicht-niemanden` |
| Neue Testfälle | 9 (`test/vorbehalt.test.js`) |
| Neue Gates | keine — Gate 23 (Liefergebiet) gilt unverändert |

## Was offen bleibt

- **Die Gebietsfrage an den Lieferanten** bleibt offen und ist
  freigabepflichtig: Sie ist eine Anfrage an Dritte. Sie steht als eine der
  fünf Fragen in `npm run pruefe-anfrage`.
- **Die Sammeldeckung im Kopf (`kopfwiderruf`)** deckt nach Wortvorkommen statt
  nach Gegenstand — offen seit zwei Runden.
- **`PARAMETER.md` trägt ein Kopfdatum ohne Prüfer** — bewusst nicht gebaut,
  siehe `zuerst-lesen-und-zuerst-falsch.md`.
