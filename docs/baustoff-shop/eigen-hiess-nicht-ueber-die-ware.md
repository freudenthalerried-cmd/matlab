# „Eigen" hieß nicht „über die Ware"

**13. September 2026, vierte Runde des Tages.**

## Warum diese Runde woanders hinsieht

Drei Runden hintereinander am Zwillingsregister. Die offene Frage danach lautete,
ob die Messung Einheiten lesen kann — eine Frage an dasselbe Werkzeug.

Erst ein Blick auf die Liste der offenen Punkte: **28 Punkte, alle
auftraggeberpflichtig** — E-Mail, Kauf, Ausgabe, Entscheidung oder ein
Netzausgang, den diese Umgebung nicht hat. Einer trug einen Satz, der nicht
auftraggeberpflichtig ist:

> „Der Abschnitt „Technische Kennwerte" trägt auf allen 46 Artikelseiten nur
> sechs verschiedene Fassungen, die größte auf 22 — lauter Platzhaltersätze
> statt Kennwerten."

## Der erste Befund war eine Berichtigung an uns selbst

Nachgesehen, was in den sechs Fassungen steht:

> „Für diesen Artikel liegt uns kein Herstellermerkblatt vor. Wir tragen es
> nach, sobald wir es beim Lieferanten angefordert haben. Bis dahin steht hier
> nichts — **eine erfundene Kennwerttabelle wäre schlimmer als eine leere.**"

Das ist kein Platzhaltersatz. Das ist eine Auskunft mit ihrem Grund, und die
anderen fünf Fassungen nennen zusätzlich das Merkblatt des Herstellers.

> **Ein eigener Text, der beschrieben wird, wird auch beurteilt — und die
> Beurteilung war unfair.**

Der Satz im offenen Punkt ist berichtigt.

## Der eigentliche Befund

Die maschinenlesbare Beschreibung ist das, was ein Assistent und Google
Shopping lesen. `beschreibungsbefund` prüft sie seit dem 5. September mit einer
Zusicherung:

> *Jede Beschreibung nennt mindestens eine Angabe, die **kein anderes Feld** des
> Datensatzes trägt.*

Gemessen, was damit durchgeht — 46 Artikel, 21 verschiedene eigene Beiträge:

| Artikel | ihr **ganzer** eigener Beitrag |
|---|---|
| 8 | „Palettierte Ware, Kranentladung je Hub … Preisstand 2026-07-27" |
| 7 | „Palettierte Ware, Kranentladung je Hub … Preisstand 2026-06-25" |
| 5 | **„Preisstand 2026-08-12"** |
| 3 | **„Preisstand 2026-08-17"** |
| 3 | **„Preisstand 2026-05-26"** |

Ein Preisstand steht in keinem Nachbarfeld — und sagt über die Ware nichts.
„Palettierte Ware" sagt etwas über den **Versand** und gilt für jede
palettierte Ware gleich.

> **„Eigen" hieß: steht in keinem Nachbarfeld. Es hieß nicht: sagt etwas über
> die Ware.**

**21 von 46** Beschreibungen sagen über die Ware selbst nichts. Bei **13** davon
ist der ganze eigene Beitrag ein Datum.

### Die Verteidigung des Prüfers trägt — für einen Teil

Der Prüfer sagt in seinem eigenen Kopf, warum er **nicht** verlangt, dass sich
je zwei Beschreibungen unterscheiden:

> *„Der erste Wurf tat das und meldete acht Gruppen — darunter XPS 30, 50 und
> 80 mm, alle 0,75 m², alle palettiert, gleicher Preisstand. Ihr Unterschied
> ist die Dicke, und die steht im Namen. Sie auseinanderzuschreiben hieße,
> Eigenschaften zu erfinden."*

Das ist richtig, und es bleibt richtig. Nur trägt die Gruppe von acht neben den
drei XPS-Platten auch:

`Fassaden EPS 3 cm` · `Mantelstein MSTS EZ 16-18 SIKM` · `SIKM Rohr 133cm
gedämmt 18` · `Schachtring 800 300 80 mm` · `Ökotherm HL N+F 10 50 23,8 cm`

Eine Dämmplatte, ein Mantelstein, ein Kaminrohr, ein Schachtring und ein
Hohlblockziegel. Zwischen ihnen ist der Unterschied **nicht** die Dicke.

> **Ein Grund, der für drei Fälle trägt, deckt nicht die acht, die danebenstehen.**

## Was geändert wurde — und was ausdrücklich nicht

**Nicht geändert:** Es wurde keine Produkteigenschaft erzeugt. Der Katalog
stammt aus fünfzehn Rechnungen; er führt Bezeichnung, Gruppe, Einheit,
Sperrgut, Preisstand — und Gewicht für 7 von 46. Aus einer Bezeichnung
Kennwerte zu parsen hieße, sie zu erfinden, und der Prüfer hat recht: bei
Baustoffen ist das der teuerste Fehler.

**Geändert wurde die Messung.** `satzGehtUeber()` ordnet jeden Satz zu — *Ware*,
*Versand*, *Datensatz* — und `beschreibungsbefund` zählt, wie viele
Beschreibungen keinen Satz über die Ware tragen.

### Die Gate-Entscheidung: eine Sperrklinke statt einer Ampel

Dieser Befund ist heute bei 21 von 46, und die Abhilfe liegt beim Lieferanten
(offener Punkt `artikelliste`, freigabepflichtig). Zwei Möglichkeiten, und
beide sind falsch:

- **Rot melden.** Ein Prüfer, der für etwas rot ist, das dieser Loop nicht
  beheben kann, wird abgeschaltet — und meldet dann auch den echten Fall nicht
  mehr. Das steht als Lehre schon im Kopf desselben Prüfers.
- **Nur berichten.** Genau die Bauart, die diesen Bestand schon zweimal
  eingeholt hat: *„Eine Notiz, die sagt ‚dieselbe Größe', ist keine Prüfung,
  dass es dieselbe Zahl ist."*

> **Eine Zahl, die nur berichtet wird, ist eine Zahl, die steigen darf.**

Gewählt ist die dritte: `OHNE_WARENEIGENSCHAFT_HOECHSTENS = 21` ist eine
**Sperrklinke**. Steigt die Zahl, wird der Prüfer rot. Fällt sie, sagt er, dass
die Schranke nachgezogen gehört — sonst wäre eine erreichte Verbesserung wieder
aufgebbar, ohne dass es jemand merkt.

### Und die Zahl im offenen Punkt geht gegen den Bestand

Die 21 und die 13 stehen jetzt im Punkt `artikelliste`. Sie stehen dort **nicht
als Freibrief**, sondern als zwei von zehn lebenden Zahlen, die
`npm run pruefe-punkte` gegen `beschreibungsbefund` hält (vorher sieben).

Das ist die Lehre vom 8. September, angewandt statt zitiert: Damals stand im
Punkt „Suchvolumen der **32** Keywords", während das Werkzeug 29 ausgab — der
Auftraggeber hätte für drei Begriffe Zahlen geholt, für die keine Anzeige mehr
steht.

> **Die Liste fragte die Werkzeuge, welche Punkte offen sind. Was in den
> Punkten steht, hat sie selbst geschrieben.**

## Was geändert wurde

| Datei | was |
|---|---|
| `src/maschinenlesbar.js` | `satzGehtUeber()`; `OHNE_WARENEIGENSCHAFT_HOECHSTENS`; `beschreibungsbefund` zählt `ohneWareneigenschaft` und `nurDatensatz`, mit zwei neuen Regeln |
| `src/punktezahlen.js` | drei neue lebende Zahlen im Punkt `artikelliste` |
| `bin/punktepruefung.mjs` | misst sie am Katalog |
| `bin/dublettenpruefung.mjs` | berichtet die Zahl neben den eigenen Beiträgen |
| `src/offenepunkte.js` | die Beurteilung der Kennwertsätze berichtigt; die beiden Zahlen aufgenommen |
| `test/maschinenlesbar.test.js` | vier Testfälle, darunter der Katalog gegen die Sperrklinke |
| `test/punktezahlen.test.js` | die Lage trägt den Punkt `artikelliste` |

Zwei Gegenproben, jede rot gesehen:
`der-preisstand-gilt-wieder-als-wareneigenschaft` ·
`die-zahl-im-offenen-punkt-wird-wieder-nur-behauptet`

## Offen

Was die 21 senkt, ist eine Eigenschaft je Artikel, und die gibt es nur aus zwei
Quellen: die Artikelliste des Lieferanten (offener Punkt, freigabepflichtig)
oder die Merkblätter der Hersteller. Beides liegt außerhalb dieses Loops.

Was **hier** möglich wäre und bewusst unterblieben ist: die Bezeichnungen nach
Maßen zu durchsuchen — „750 ml", „100 m2", „133cm", „48 mm x 50 m" stehen in
ihnen. Ein Parser über 46 von Hand erfasste Namen ist aber keine Datenquelle,
sondern eine Vermutung mit Regeln. Bei einem Baustoff, dessen Bemessung an der
Steinfestigkeit hängt, ist eine falsch geparste Zahl teurer als eine fehlende.
Wer es dennoch tut, misst zuerst, wie viele der 46 Namen eindeutig sind — und
nicht, wie viele sich irgendwie lesen lassen.
