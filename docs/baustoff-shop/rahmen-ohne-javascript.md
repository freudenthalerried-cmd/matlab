# Der Rahmen misst ohne JavaScript — und ich hätte es fast nicht gemerkt

> **Überholt seit 28.08.2026 — die Ursache war falsch zugeordnet.** Der
> Rahmen führt seine Skripte sehr wohl aus. Angehalten hat der Parser am
> Stylesheet von `fonts.googleapis.com`, das hinter dem Ausgangsproxy dieser
> Umgebung **hängt** statt zu scheitern; ein hängendes Stylesheet hält den
> Parser an, und das nachfolgende `<script src>` wird nie geparst. Ohne
> Proxyvariablen liefert derselbe Aufbau `shop=object, ready=complete`.
> Alles Weitere in [`rahmen-lief-doch.md`](./rahmen-lief-doch.md). Was unten
> steht, bleibt als Fehlergeschichte stehen — mit diesem Vorzeichen.

Stand: 2026-08-27. Der Lauf davor endete mit einer offenen Zeile:

> **Warenkorb- und Kassenseite im Rahmen:** Sie werden mit leerem Korb
> geladen; die Mengenfelder und der Entfernen-Verweis entstehen erst mit
> Inhalt und sind dort noch ungemessen.

Der Versuch, das zu schließen, hat eine Eigenschaft der eigenen Prüfumgebung
zutage gefördert, die **fünf bestehende Szenarien betrifft** — und beinahe
zwei neue erzeugt, die nie hätten fehlschlagen können.

## Der Plan und der erste Fehlschlag

Der Warenkorb liegt im `localStorage`. Unter `file://` ist der gesperrt,
also musste die Probe über HTTP messen. Dafür bekam sie einen eigenen
kleinen Dateiserver — dreißig Zeilen `node:http`, kein Fremdpaket. Der
Rahmen setzt den Korb in den Speicher und lädt dann die Warenkorbseite;
beide liegen auf demselben Ursprung.

**Das funktionierte, und die Seite blieb trotzdem leer.** Der Speicher war
nachweislich beschrieben — nachgelesen im laufenden Browser:

```
speicher=[{"sku":"POS-10095","menge":12}]   zeilen=0   menge=0
```

## Die Ursache: eingebettete Dokumente führen hier keine Skripte aus

Nach mehreren Fehlversuchen die Messung, die es klärt:

```
skripte=2   shop=undefined   tiefe=undefined   filter=0
```

**Beide `<script>`-Elemente sind da. Keines ist gelaufen.** Nicht einmal
die einzeilige Inline-Zeile `window.__SHOP_TIEFE__=false;`.

In diesem Headless-Chromium führt ein Dokument in einem `<iframe>` unter
`--virtual-time-budget` mit `--dump-dom` seine Skripte nicht aus. Das ist
keine Eigenschaft des Shops, sondern eine der Messung.

## Was das für die bestehenden fünf Rahmenszenarien heißt

**Sie messen die Seite ohne JavaScript.** Das war mir beim Bauen nicht
bewusst — und es ist zur Hälfte eine gute Nachricht:

| | |
|---|---|
| Seitwärtsrollen | **gültig** — entsteht aus CSS, nicht aus Skript |
| Größe von Navigation, Warenkorbknopf, Suchfeld | **gültig** — statisches Markup |
| Größe der Auswahlfelder in der Filterleiste | **wertlos** — die Leiste wird vom Skript gebaut und ist im Rahmen leer |
| Warenkorb, Kasse | **unmöglich** — beide Seiten sind ohne Skript leer |

Der Nebengewinn: Die fünf Szenarien belegen jetzt zusätzlich etwas, das
vorher niemand geprüft hatte — **die Seiten halten ihr Layout auch ohne
JavaScript.** Wer mit abgeschaltetem Skript kommt, bekommt eine Seite, die
nicht seitwärts wandert und deren Knöpfe groß genug sind.

## Die Falle, die beinahe eingebaut worden wäre

Die zwei neuen Szenarien für Warenkorb und Kasse prüften: *keine
Bedienelemente unter 44 Pixel.* Auf einer leeren Seite gibt es **null**
Bedienelemente, also auch null zu kleine. **Sie meldeten grün.**

Dagegen war eine Zusicherung eingebaut — „mindestens sechs Bedienelemente,
sonst war die Seite wohl leer". Auch die hat nicht gegriffen: Sie zählte
**alle** Bedienelemente der Seite, und allein die Kopfleiste bringt neun
mit. Die Gegenprobe mit leerem Korb lief grün durch.

> **Zwei Absicherungen, beide hohl, beide von mir gebaut** — und die zweite
> war ausdrücklich dazu da, die erste abzusichern. Eine Zahl, die immer
> stimmt, prüft nichts, auch wenn sie „mindestens" heißt.

Die beiden Szenarien sind **entfernt**. Ein Prüfer, der nicht durchfallen
kann, ist schlimmer als kein Prüfer: Er erzeugt Vertrauen, das er nicht
trägt.

## Was stattdessen gemessen wird

Die Bedienelemente des Warenkorbs misst jetzt ein Szenario in der
**Einzeldateifassung** — dort läuft das Skript nachweislich, das belegen
siebzehn andere Szenarien. Es legt einen Artikel in den Korb, wechselt zur
Warenkorbseite und misst:

```
anzahl=3  menge=40  weg=44  knopf=53  zuklein=1
```

Das ist die Gegenprobe, mit entfernter CSS-Regel. Das Mengenfeld war
**40 Pixel** hoch. Mit Regel: `zuklein=0`.

Der Preis dieser Lösung steht dabei: Die Einzeldateifassung wird im
Headless-Browser mindestens 500 Pixel breit aufgebaut. **Gemessen sind
damit die Höhen, nicht das 390-Pixel-Layout dieser beiden Seiten.** Das
bleibt offen und steht unten.

## Der Server bleibt

Auch wenn er den ursprünglichen Zweck nicht erfüllt hat: Die Rahmenproben
laufen jetzt über HTTP statt über `file://`. Das ist die Art, wie die
Seite später ausgeliefert wird, und es hat den `--allow-file-access-from-files`-Schalter
überflüssig gemacht.

> Ein Umbau, der sein Ziel verfehlt und die Sache trotzdem besser macht,
> ist kein verlorener Lauf. Er ist nur einer, dessen Bericht anders
> ausfällt als geplant.

## Stand

| | |
|---|---|
| `npm run shopprobe` | **23 Szenarien**, davon 5 im 390-px-Rahmen |
| Rahmenproben | über HTTP, ohne JavaScript — und das steht jetzt im Werkzeug |
| Bedienelemente im Warenkorb | gemessen, Gegenprobe schlägt fehl |
| entfernte Szenarien | 2, weil sie nicht durchfallen konnten |
| Testfälle | 681 grün |

## Was offen bleibt

| | |
|---|---|
| **390-px-Layout von Warenkorb und Kasse** | braucht einen Browser, der Skripte im Rahmen ausführt — oder eine Steuerung über das DevTools-Protokoll statt `--dump-dom` |
| echte Berührungen, Vorleseprogramme, Farbkontraste | unverändert ungeprüft |

Der erste Punkt ist lösbar: Chromium lässt sich über das
DevTools-Protokoll fernsteuern, dann entfällt `--virtual-time-budget` und
damit die Ursache. Das ist ein eigener Umbau der Probe und kein
Nebenbei-Schritt.
