# Eine Hälfte umgelenkt

**Stand: 30. August 2026** · Ein Lauf mit drei Befunden, von denen ich den
dritten selbst verursacht habe. Betroffen:
`shop/bin/katalog-aus-rechnungen.mjs`, `shop/test/katalog-werkzeug.test.js`.

## Die Frage

Der vorige Lauf endete mit einem offenen Punkt: Der Weg in den Katalog führt
über `npm run katalog`, dessen Eingabe die **Positionstabelle aus Rechnungen**
ist — nicht die Artikelliste, um die der Auftraggeber gebeten wurde. *Ob die
Spaltenzuordnung passt, entscheidet sich an der Datei, die kommt.*

Das lässt sich vorwegnehmen: Die Datei, die kommt, ist beschrieben
(`sku;bezeichnung;einheit;ek_netto;…`). Also eine solche Datei geschrieben und
das Werkzeug darauf angesetzt.

## Erster Befund: null gelesen, Ausgang null

```
Positionen gelesen:       2
davon keine Handelsware:  0
Artikel im Katalog:       0
```

Kein Fehler, keine Warnung, Ausgang 0. Das Werkzeug sucht die Spalte `ArtNr`,
findet sie nicht, überspringt jede Zeile — und meldet das als Ergebnis.

Am Tag der Lieferantenliste liest sich das wie *„die Liste enthält keine
brauchbare Ware"* und nicht wie *„ich kann dieses Format nicht lesen"*. Der
Unterschied entscheidet, ob jemand die Liste beim Lieferanten reklamiert oder
das richtige Werkzeug sucht.

Jetzt prüft `leseCsv` die Pflichtspalten, bricht mit Ausgang 2 ab, nennt die
fehlenden **und** die gefundenen Spalten und sagt, wohin eine Artikelliste
gehört.

## Zweiter Befund: der Wächter rettete aus dem falschen Grund

Derselbe Lauf ohne `--pruefen` brach ab — mit:

```
Abbruch: 7 belegte Gewichte gingen verloren.
```

Der Katalog blieb heil. Aber der Grund war falsch: Es gingen nicht sieben
Gewichte verloren, es war **kein einziger Artikel gelesen** worden. Trüge der
Bestand keine belegten Gewichte, hätte das Werkzeug einen leeren Katalog über
den vollen geschrieben und dabei „geschrieben:" gemeldet.

> **Ein Erzeuger, dessen Ausgabe leer ist, hat nicht gearbeitet.**

Jetzt bricht er bei null Artikeln ab, bevor irgendetwas geschrieben wird.

## Dritter Befund: ich habe die Preisdatei zerstört

Beim Gegenproben der neuen Sperre habe ich das Werkzeug mit umgelenktem Ziel
laufen lassen — und für das **zweite** Ziel den falschen Namen benutzt:
`PREISE_ZIEL` statt `KATALOG_PREISE_ZIEL`. Das Werkzeug kennt den falschen
Namen nicht, nimmt still den Vorgabewert und schreibt dorthin.

Der Katalog ging in den Testordner. Die Preisdatei ging in den **Bestand**.
Und weil der Lauf keinen Artikel gelesen hatte, stand danach in
`preise/baustoff-preise.json`:

```
Einträge: 0
```

46 Einkaufskonditionen. Die Datei ist gitignoriert — sie ist der Kern der
Geheimhaltungsentscheidung vom 22. August, und genau deshalb holt sie kein
`git checkout` zurück.

**Wiederhergestellt mit einem Befehl:** `node bin/katalog-aus-rechnungen.mjs`
liest `preise/poschacher-positionen.csv` und erzeugt beide Dateien neu. Der
Katalog kam byteweise identisch heraus — `git status` meldet ihn nicht als
geändert, und das ist zugleich der Beleg, dass die Wiederherstellung
vollständig war.

Das ist der Verdienst einer Entscheidung, die damals aus einem anderen Grund
getroffen wurde: Die Preisdatei wird **abgeleitet**, nicht gepflegt. Wäre sie
von Hand geführt, wären 46 Konditionen weg gewesen — unwiederbringlich, an
einem Sonntagnachmittag, durch meine Unachtsamkeit.

### Was daran nicht meine Unachtsamkeit ist

Ein Werkzeug, das **eine** seiner beiden Ausgaben umlenken lässt und die
andere in den Bestand schreibt, ist eine Falle. Die beiden Dateien gehören
zusammen; sie entstehen im selben Lauf aus derselben Quelle, und die eine
ohne die andere ist wertlos.

Deshalb bricht das Werkzeug jetzt ab, wenn nur eines der beiden Ziele gesetzt
ist, und sagt dazu, warum:

```
Abbruch: Nur eines der beiden Ziele ist umgelenkt.
  KATALOG_ZIEL:        /tmp/…/x.json
  KATALOG_PREISE_ZIEL: (nicht gesetzt)

Die beiden Ausgaben gehören zusammen. Ein Lauf, der den Katalog
umlenkt und die Preisdatei in den Bestand schreibt, überschreibt
vertrauliche Daten, die kein git zurückholt.
```

Das hätte mich gestoppt. Der Testfall dazu beschreibt den Vorfall, damit
niemand die Sperre für Zierrat hält.

## Was die Proben halten

| Zusicherung | Gegenprobe |
|---|---|
| Eine Artikelliste wird als falsches Format abgewiesen | Spaltenprüfung entfernt → fällt |
| Ohne einen gelesenen Artikel wird nichts geschrieben, auch keine Preisdatei | Leerprüfung entfernt → fällt |
| Ein halb umgelenkter Lauf bricht ab | (neu, mit dem Vorfall im Kommentar) |

## Nachtrag zur Arbeitsweise

Die Regel dieses Projekts lautet, Gegenproben mit `.bak`-Kopien im
Scratchpad zu führen und **nie** mit `git checkout`. Sie hat hier gehalten,
was den Quelltext angeht — beide Dateien waren in Sekunden zurück.

Für **Daten** reicht sie nicht: Eine gitignorierte Datei liegt außerhalb
beider Netze. Was sie gerettet hat, war nicht die Vorsicht, sondern die
Ableitbarkeit. Das ist die Lehre, und sie gilt über diesen Fall hinaus:

> **Eine Datei, die sich aus ihrer Quelle neu erzeugen lässt, kann man
> verlieren. Eine gepflegte Datei nicht.**

Die vier Impressumsangaben, der Zahlungsanbieter, die Rechtstexte — alles,
was der Auftraggeber noch liefert — wird gepflegt und nicht abgeleitet. Für
das, was davon in `preise/` landet, ist am Liefertag eine Sicherung
einzurichten, bevor das erste Werkzeug darauf läuft.
