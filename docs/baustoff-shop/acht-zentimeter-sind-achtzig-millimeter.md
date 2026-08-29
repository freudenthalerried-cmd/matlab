# Acht Zentimeter sind achtzig Millimeter — die Suche wusste es nicht

Stand: 2026-08-29

## Die Messung

78 Wörter, wie sie ein Bauleiter tippt, gegen den Bestand. Die erste Runde
mit 40 Wörtern:

| | |
| --- | --- |
| Treffer | 32 |
| ohne Treffer | **8** |

Die acht aufgeschlüsselt — und das Aufschlüsseln ist die eigentliche Arbeit:

| Wort | Befund |
| --- | --- |
| `xps 8 cm` | **Fehler.** Der Shop führt XPS in 80 mm |
| `kaminrohr` | **Fehler.** Der Shop führt „SIKM Rohr 133cm gedämmt 18" |
| `rondellen` | **Fehler.** Mehrzahl von Rondelle |
| `sockelputz`, `estrich`, `schalungsstein`, `silikonputz`, `drainage` | **richtig.** Führen wir nicht |

Fünf von acht Fehlanzeigen waren korrekt. Ein Prüfer, der nur „acht Wörter
finden nichts" meldet, hätte zu fünf falschen Reparaturen geführt.

## Der Fund: cm und mm

`xps 8 cm` fand nichts. `eps 5 cm` fand etwas. Der Unterschied liegt nicht in
der Suche, sondern im **Katalog**:

| Warengruppe | Schreibweise im Katalog |
| --- | --- |
| Fassaden EPS | „2 cm", „3 cm", „5 cm" |
| XPS glatt/rau | „30 mm", „50 mm", „80 mm" |

Dieselbe Frage traf die eine Warengruppe und die andere nicht — je nachdem,
welche Einheit der Lieferant in den Artikelnamen geschrieben hat. Das ist
keine Eigenschaft der Ware, sondern ein Zufall der Bezeichnung.

**Beide Schreibweisen werden jetzt auf einen Stamm gebracht:** `8 cm` und
`80 mm` werden zu `80mm`, beim Indexieren wie beim Suchen. Die nackte Zahl
bleibt zusätzlich erhalten, damit „xps 80" weiter trifft.

```
xps 8 cm     → XPS rau GK 80 mm / XPS glatt SF 80 mm
xps 80 mm    → dieselben zwei
eps 50 mm    → Fassaden EPS 5 cm
eps 5 cm     → dasselbe
```

**Nur Zentimeter und Millimeter.** „1,1x50 m" ist ein Rollenmaß und
„0,5 m2" eine Fläche — daraus eine Länge zu machen hieße, eine Kante zu
erfinden. Und „Isover TDPT **20** 1200 600 mm" behält seine 20 als
Typkennung: Sie trägt keine Einheit, also ist sie kein Maß. Dieselbe Regel
wie beim Plattenstärkenfehler vom 28. August, nur in die andere Richtung.

## Elf Wörter aufgenommen, achtzehn ausdrücklich nicht

Die zweite Runde mit 38 weiteren Wörtern brachte 31 Fehlanzeigen. Jede
einzelne wurde gegen den Bestand entschieden:

**Aufgenommen** (die Ware ist da, das Wort fehlte): `kaminrohr`, `styrodur`,
`hartschaum`, `dübelteller`, `rondellen`, `abdeckband`, `malerband`,
`fensteranschluss`, `laibung`, `klebespachtelmasse`.

**Ausdrücklich nicht aufgenommen** (18 Wörter, jedes mit Begründung im
Register). Zwei Beispiele, an denen die Grenze sichtbar wird:

> `rauchrohr` — Das Ofenrohr vom Ofen zum Kamin führen wir nicht. Es auf das
> gedämmte Innenrohr zu lenken wäre die Verwechslung, die einen Kaminbrand
> nach sich zieht.

> `silikatputz` — Wir führen einen Oberputz (PrimaPor K20, Reibputz).
> Silikat-, Silikon- und Mineralputze sind eigene Systeme; jemanden auf den
> vorhandenen zu lenken wäre eine Empfehlung, keine Suche.

Das Register führt jetzt **47 Kundenwörter und 23 begründete Ablehnungen**.

## Ein Vorschlag, der durch die neue Ware schlechter wurde

Nach der Aufnahme von `klebespachtelmasse` schlug der Vertipper „spachtl"
nicht mehr *spachtelmasse* vor, sondern das neue, doppelt so lange Wort:
gleicher Abstand, und die Häufigkeit entschied zugunsten des längeren.

Die bequeme Lösung wäre gewesen, die Erwartung im Test anzupassen. Die
richtige ist eine Rangregel: **Bei gleichem Abstand gewinnt die ähnlichere
Länge.** Wer sieben Buchstaben tippt, meint eher ein kurzes Wort mit einem
Fehler als ein achtzehn Buchstaben langes. Die Häufigkeit entscheidet erst
danach.

Ebenso beim Prüfer für die Ablehnungen: Er verlangte eine Begründung von mehr
als zwanzig Zeichen oder die Form „Wie X" mit einem X aus derselben Liste.
Meine Ablehnungen trugen „Siehe silikatputz." — 18 Zeichen. Statt die
Längengrenze zu senken, nimmt die Regel jetzt beide Schreibweisen desselben
Verweises an. Das ist keine Lockerung, sondern dieselbe Regel.

## Geprüft

836 Testfälle. Drei neue: cm und mm finden einander in beide Richtungen,
Meter und Quadratmeter bleiben unberührt, und jedes der neuen Kundenwörter
führt zu **genau der gemeinten Ware** — nicht irgendwohin.

| Gegenprobe | Ergebnis |
| --- | --- |
| Maßvereinheitlichung abgeschaltet | 2 Testfälle fallen |

## Was offen bleibt

Die deutsche Mehrzahl kennt der Index weiterhin nicht; `rondellen` steht
jetzt als eigenes Wort im Register. Eine allgemeine Endungsregel wäre
verlockend und gefährlich: Sie träfe auch dort, wo zwei Wörter nur zufällig
gleich enden. Bis dahin gilt der Weg, den dieses Register ohnehin geht —
jedes Wort einzeln, mit Begründung.
