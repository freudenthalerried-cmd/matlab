# `npm run katalog` löschte die Gewichte — still, jedes Mal

**28. August 2026.** Der letzte Lauf endete mit dem Satz: *Vor dem nächsten
neuen Werkzeug gehört die Ausgabe der vorhandenen gelesen.* Also der Reihe
nach durch die Werkzeuge, die in dieser Session noch nie aufgerufen wurden.
Der zweite hat es gleich gezeigt.

## Was passiert ist

`npm run katalog` liest die Rechnungspositionen und schreibt
`data/katalog-baustoff.json` **neu**. Die sieben belegten Gewichte, die
`werkzeuge/gewichte.py` am 27. August eingetragen hatte, standen danach nicht
mehr drin. Ebenso der Hinweis, dass ein fehlendes Gewicht **unbekannt** und
nicht geschätzt ist.

Die Ausgabe des Werkzeugs meldete das nicht. Sie meldete „46 Artikel im
Katalog" und „geschrieben" — beides wahr.

> **Ein Erzeuger, der eine Datei neu schreibt, löscht alles, was ein anderes
> Werkzeug hineingeschrieben hat** — schweigend, weil er von dem anderen
> nichts weiß.

Aufgefallen ist es nur, weil ich nach dem Lauf zufällig `git status` gelesen
habe. Wäre der Lauf mit einem Commit zusammengefallen, hätte der Shop ab
sofort für jeden Artikel „Gewicht: —, liegt uns nicht belegt vor" angezeigt,
und der Warenkorb hätte drei Positionen ohne Gewicht gemeldet statt einer.

## Zwei Vorkehrungen statt einer

**1. Die Gewichte werden mitgeschrieben.** Der Erzeuger liest jetzt
`preise/gewichte-aus-rechnungen.json` — dieselbe Datei, die `gewichte.py`
erzeugt — und trägt `gewichtKg` samt `gewichtQuelle: "rechnung"` ein. Damit
ist die Kette vollständig und wiederholbar:

```
Rechnungs-PDFs → gewichte.py → preise/gewichte-aus-rechnungen.json
                             → npm run katalog → data/katalog-baustoff.json
```

Vorher hing das mittlere Glied an einer Handbewegung.

**2. Der Erzeuger bricht ab, wenn dabei etwas verlorenginge.** Vor dem
Schreiben vergleicht er die Zieldatei mit dem, was er erzeugt hat. Fehlt die
Gewichtsquelle, meldet er die sieben Artikel namentlich und beendet mit
Fehlercode 2, statt zu überschreiben. Eine Vorkehrung, die nur aus „wir lesen
die Datei mit" bestünde, hilft genau dann nicht, wenn jemand sie einmal nicht
zur Hand hat.

## Warum kein Test das gemerkt hat

Weil **keiner den Erzeuger je ausgeführt hat.** 729 Tests lasen die *Ausgabe*
des Werkzeugs — den Katalog — und fanden ihn in Ordnung, weil er in Ordnung
war, solange niemand das Werkzeug laufen ließ.

> **Ein Erzeuger, den keine Probe ausführt, wird von der Probe nicht geprüft
> — egal wie viele Tests seine Ausgabe lesen.**

Neu: `test/katalog-werkzeug.test.js` führt ihn wirklich aus. Damit das ohne
Nebenwirkung geht, sind Quelle und Ziele über die Umgebung überschreibbar
(`KATALOG_QUELLE`, `KATALOG_ZIEL`, `KATALOG_PREISE_ZIEL`,
`KATALOG_GEWICHTE`); jeder Lauf schreibt in einen frischen Ordner. Drei
Proben:

1. Die sieben Gewichte stehen im Ergebnis, jedes mit Quellenangabe.
2. Ein zweiter Lauf liefert dieselbe Datei — ein Erzeuger, dessen zweiter Lauf
   etwas anderes ergibt, hat einen Zustand, den niemand sieht.
3. Ohne Gewichtsquelle bricht er ab, und die Zieldatei bleibt unverändert.

Gegengeprobt: Gewichte nicht mitschreiben lässt zwei Proben fallen, den
Abbruch abschalten eine.

## Die anderen Erzeuger, nachgesehen statt vermutet

- **`bin/import.mjs`** (Preislisten-Import) schreibt `data/artikel.json` neu,
  **behält aber die Artikel fremder Lieferanten** — es ist ein Zusammenführen,
  kein Überschreiben. Kein Fehler.
- **`werkzeuge/gewichte.py`** schreibt nur sein eigenes Register, nicht den
  Katalog. Kein Fehler.
- **`bin/website.mjs`** und **`bin/veroeffentlichung.mjs`** schreiben
  ausschließlich in Ausgabeordner. Kein Fehler.

Der Fall war also einer, nicht vier. Er wäre trotzdem teuer geworden.

## Stand

- 732 Tests grün (vorher 729; +3), `pruefe-tests` 731 Fälle / 0 Verdacht
- `npm run katalog` meldet jetzt zusätzlich „Gewichte aus Belegen: 7 von 46"
- Der Katalog trägt seine sieben Gewichte und den Hinweis, dass die übrigen
  unbekannt sind
