# Der Auszug, der lautlos alterte

**12. September 2026, abends. Runde 55.**

## Drei Dateiarten, zwei Abgleiche

In der Ablage liegen seit heute drei Arten von Dateien:

| | | geprüft auf |
| --- | --- | --- |
| `journal-2026.jsonl` | die Aufzeichnung | Ort, Form, Nummernkreis, Felder |
| `belege-2026/RE-2026-0001.txt` | die Durchschrift | Ort **und** Inhalt gegen das Journal, in beide Richtungen (seit 11.9.) |
| `buchhaltung/buchhaltung-2026-09.csv` | der Auszug | **nur den Ort** |

Die dritte ist die einzige, die das Haus **verlässt**. Sie geht zum
Steuerberater, und aus ihr entsteht die Umsatzsteuervoranmeldung — fällig am
15. des zweitfolgenden Monats (§ 21 Abs 1 UStG).

## Der erste Fund: er altert, und niemand sagt es

Gemessen an einem Probejournal. Auszug für September geschrieben, als zwei
Einträge vorlagen; dann kam die dritte Rechnung:

```
Journal hat jetzt 3 Einträge, der Auszug kennt 2
$ npm run pruefe-ablage
Keine Meldung.
```

Das Journal **wächst nur** (§ 131 BAO) — das ist seine Stärke und hier die
Ursache. Jeder Eintrag nach dem Schreiben fehlt im Auszug, und die Datei
behauptet weiter, sie sei der September.

> **Die Richtung ist die schlechtere von zwei: Ein veralteter Auszug meldet zu
> wenig Umsatz.** Das ist keine Ungenauigkeit, sondern eine zu niedrige
> Voranmeldung.

## Der zweite Fund: die Unterscheidung blieb auf dem Bildschirm

Am Vormittag hat `ARTEN` gelernt, welche Papierart ein **Umsatz** ist — die
Rechnung und die Gutschrift, die sie aufhebt. `npm run buchhaltung` rechnet
damit die Bemessungsgrundlage. In die Datei ging die Unterscheidung nicht mit:

```
lfd;art;nummer;zeitpunkt;vorgang;netto;brutto;bezug;text
1;rechnung;RE-2026-0001;…;2026-0101;759,22;911,06;;Rechnung an Muster GmbH
2;lieferantenbestellung;2026-0101-01;…;2026-0101;600,00;;;Bestellung Poschacher
```

Beide Beträge stehen in derselben Spalte `netto`.

> **Wer sie zusammenzählt — und genau dafür öffnet ein Steuerberater eine CSV —
> bekommt 1.359,22 € statt 759,22 €.** 79 % zu viel, und die Umsatzsteuer
> daraus wandert in die Voranmeldung.

Der Einkaufswert der Lieferantenbestellung ist die **Ausgabe** dieses Betriebs;
die Vorsteuer daraus steht auf der Rechnung des Lieferanten und nicht auf
dieser Bestellung. Dieselbe Familie wie der Zahlenpunkt am 2. September: Die
Datei war für sich richtig und wurde **beim Lesen** falsch.

## Was jetzt gilt

**Die CSV trägt die Spalte `umsatz`.**

```
lfd;art;umsatz;nummer;zeitpunkt;vorgang;netto;brutto;bezug;text
1;rechnung;ja;RE-2026-0001;…;759,22;911,06;;Rechnung an Muster GmbH
2;lieferantenbestellung;nein;2026-0101-01;…;600,00;;;Bestellung Poschacher
```

**`auszugsbefund` hält jeden Auszug gegen das Journal seiner Periode**, und
`npm run pruefe-ablage` ruft ihn. Vier Regeln:

| Regel | wann |
| --- | --- |
| `auszug-veraltet` | das Journal führt in der Periode Einträge, die der Auszug nicht kennt |
| `auszug-kennt-fremde-zeile` | der Auszug nennt eine laufende Nummer, die das Journal dort nicht führt — andere Periode, oder das Journal ist geändert (§ 131 Abs 1 Z 6 BAO) |
| `auszug-ohne-umsatzspalte` | der Auszug stammt von vor heute abend und ist nicht sicher zu lesen |
| `auszug-leer` | eine Datei, die in jeder Liste wie ein Auszug aussieht und keiner ist |

Verglichen werden **laufende Nummern**, nichts sonst — keine Beträge, keine
Namen, keine Betreffs; gemeldet werden Anzahlen und der Dateiname. Dieselbe
Regel wie bei `durchschriftenbefund` und `npm run akte`: Ein Prüfer, der den
Inhalt protokolliert, verlegt Kundendaten an einen dritten Ort. Und die Nummern
laufen je Geschäftsjahr neu, also bekommt jeder Auszug die Einträge **seines**
Jahres.

Am Probelauf, mit einer Ablage unter dem Verzeichnis:

```
✗ …/buchhaltung-2026-09.csv nennt keine Spalte `umsatz` — Umsatz und Einkaufswert
  stehen darin ununterscheidbar in derselben Spalte  [auszug-ohne-umsatzspalte]
✗ …/buchhaltung-2026-09.csv kennt 1 Zeile(n), das Journal führt in 2026-09 2 —
  1 Eintrag ist nach dem Auszug dazugekommen  [auszug-veraltet]
```

## Überschreiben bleibt erlaubt — und wird gesagt

Der Auszug ist **kein Beleg**: Er wird aus dem Journal gerechnet und darf
jederzeit neu entstehen. Anders als die Durchschrift, die mit `flag: 'wx'`
schreibt und einen zweiten Lauf abbricht. Was fehlte, ist der Satz darüber:

```
Ersetzt den vorigen Auszug dieser Periode, der 2 Zeile(n) kannte —
wer ihn weitergegeben hat, hat jetzt zwei Fassungen derselben Periode.
```

## Ausgang

| | |
| --- | --- |
| Abgleiche in der Ablage | 2 → **3** — jede Dateiart hat ihren |
| Neue Regeln | `auszug-veraltet`, `auszug-kennt-fremde-zeile`, `auszug-ohne-umsatzspalte`, `auszug-leer` |
| CSV | Spalte `umsatz` je Zeile |
| Testfälle | 2.411 → **2.419** |
| Gegenproben | 222 → **224** |

---

**Die Regel dieser Runde:** *Eine Datei, die aus einer anderen gerechnet wird,
ist ab dem Augenblick des Schreibens eine Behauptung — und die einzige, die das
Haus verlässt, braucht den Abgleich am dringendsten.*
