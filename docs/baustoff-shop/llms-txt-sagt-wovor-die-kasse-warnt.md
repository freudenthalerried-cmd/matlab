# llms.txt sagt, wovor die Kasse warnt

**9. September 2026.** Seit gestern warnt die Kasse, wenn ein Warenkorb
Schichten zweier Hersteller mischt — Klebemörtel von Baumit, Gewebe von
Capatect. `llms.txt` sagte davon nichts.

Das ist die Datei, aus der ein Assistent eine Bestellliste zusammenstellt.
Er sieht die Kasse nie. Er sieht diese Zeilen:

```
- Baumit KlebeSpachtel 25 kg: 14,32 € je Sack, netto · Mörtel
- Capatect Glasgewebe M, Breite 110cm, orange 55 m2: 1,07 € je m², netto · WDVS
```

Zwei Zeilen, zwei Hersteller, kein Hinweis. Wer daraus einen Korb baut, baut
genau den, vor dem die Kasse eine Seite später warnt.

> **Eine Warnung an der Kasse erreicht nur den, der bis zur Kasse kommt.
> Wer die Liste liest, ist längst fertig.**

---

## Was jetzt dort steht

Der Vorspann von `## Artikel` trägt den Satz — **nicht als Prosa, sondern
aus `GEWERKE` erzeugt**, damit er die Gewerke nennt, deren Wissensseite die
Systemtreue tatsächlich behauptet, und nicht mehr:

> Bei WDVS und Kamin gehören die Schichten eines Aufbaus zu **einem** System:
> Wer den Klebemörtel des einen Herstellers mit dem Gewebe eines anderen
> kombiniert, verlässt die geprüfte Zusammenstellung (ETAG 004, ÖNORM B 6400).

Und jede systemgebundene Zeile nennt ihr System selbst:

```diff
- · Kamin · palettiert
+ · Kamin · Mantelstein des Systems Schiedel Österreich · palettiert
- · Abgabe ab 25 kg (14,00 €) · WDVS
+ · Abgabe ab 25 kg (14,00 €) · WDVS · Klebe- und Armierungsmörtel des Systems Synthesa (Capatect)
```

Der Vorspann allein hätte nicht gereicht. Ein Assistent, der zehn Zeilen
zitiert, zitiert den Vorspann nicht mit. **Die Auskunft muss in der Zeile
stehen, die weitergereicht wird.**

---

## Gemessen

`llmssystembefund(llms, artikel)` in `src/systemtreue.js` prüft beides und
hängt in `bin/systemtreuepruefung.mjs` **vor** den Ausgängen, hinter einer
Frischeprüfung des Erzeugnisses.

- **10 systemgebundene Schichten** gefunden, **0 Meldungen** — sauber.
- Absichtlich verfälscht (System-Zusatz aus den Zeilen entfernt):
  **2 × `schicht-ohne-system-in-llms`**, Ausgang 1.
- Gegenprobe `llms-txt-verschweigt-das-system` im Register:
  *meldete rot an der erwarteten Stelle.*
- `test/systemtreue.test.js`: 5 Tests dazu, 27 grün.

Die Regel greift nur, wenn eine Schichtrolle im Katalog von **zwei** Systemen
kommt. Sie stellt keine Behauptung auf, wo der Bestand keinen Konflikt hat.

---

## Ein Satz umgeschrieben, eine Gegenprobe blind

Der Vorspann, in den der neue Satz kam, war der Anker einer bestehenden
Gegenprobe. `palettiert-ohne-herkunft` sucht dort einen Textblock und ersetzt
ihn durch Leerstring. Nach meiner Änderung endete der Block anders — der
Suchtext kam nicht mehr vor.

Das hat kein Prüferlauf gefunden, sondern der Registertest:

```
✗ Jeder Suchtext trifft genau die Stelle, die gemeint ist
    palettiert-ohne-herkunft: der Suchtext kommt in shop/bin/website.mjs
    nicht vor — die Mutation käme nie an
```

Eine Gegenprobe wäre lautlos wirkungslos geworden: Der Läufer hätte nichts
mutiert, der Prüfer wäre grün geblieben, und die Meldung hätte „schlägt nicht
an" gelautet — ohne zu sagen, dass sie es gar nicht konnte.

> **Eine Gegenprobe hängt nicht an einer Regel, sondern an einem Satz. Wer
> den Satz umschreibt, entwaffnet die Probe — und merkt es nur, wenn jemand
> nachsieht, ob der Satz noch existiert.**

Der Suchtext ist nachgezogen; die Probe schlägt wieder an (11 s).

---

## Was offen bleibt

`POS-18110` (Mantelsteinkleber RMRTL Dünnbettmörtel) ist eine Schicht ohne
erkennbares System — geführt in `SYSTEM_UNBEKANNT` mit Begründung und dem
Weg, wie es sich klären ließe. Es steht in der Lieferantenanfrage. Bis dahin
nennt seine Zeile kein System, und das ist die ehrliche Auskunft.
