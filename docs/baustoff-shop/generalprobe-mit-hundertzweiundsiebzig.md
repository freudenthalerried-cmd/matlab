# Generalprobe mit hundertzweiundsiebzig

**Stand: 30. August 2026** · Der ganze Liefertag einmal durchgespielt.
Betroffen: `shop/test/bilder.test.js`, `shop/test/shopkern.test.js`.

## Der Aufbau

Sechs Läufe haben die Werkzeuge für den Tag der Artikelliste gebaut: das
Einlesen, die Spartenzuordnung, die Trennung von Katalog und Konditionen, die
Sicherung, die Zeichnungen. Jedes für sich geprüft. Was fehlte, war der Weg
am Stück.

Also: eine Kopie des ganzen Shops in einen Sandkasten, eine erfundene
Artikelliste mit **126 Zeilen** über alle sieben Warengruppen, und dann der
Tag von vorn — einlesen, bauen, prüfen. Die echten Daten blieben unberührt;
beide Ziele umgelenkt, wie es die Sperre von heute Mittag verlangt.

## Was durchlief

| Schritt | Ergebnis |
|---|---|
| `npm run artikelliste --schreiben` | 126 neu, 46 bleiben, **172 Artikel** |
| `npm run website` | 207 Seiten, kein toter Verweis |
| `npm run pruefe-preise` | 172 Artikel, 0 Abweichungen |
| `npm run pruefe-seiten` | 207 Seiten, jede mit eigenem Absatz |
| `npm run rahmenzensus` | **207 von 207** Seiten ohne Seitwärtsrollen bei 390 px |
| `npm run pruefe-geheimnis` | Zielmarge in keiner Ausgabedatei |

Die Wachstumszahlen, weil sie später jemanden interessieren:

| | 46 Artikel | 172 Artikel |
|---|---|---|
| `shop.js` roh / gezippt | 120 KB / 24,7 KB | 263 KB / **31,5 KB** |
| `website.html` roh / gezippt | 1.444 KB / 109,5 KB | 3.882 KB / 182,9 KB |
| Seiten | 81 | 207 |

Der Zuwachs des Bündels ist der eingebettete Katalog. Gezippt bleibt er
tragbar; bei tausend Artikeln wären es rund 180 KB, und dann wäre die Frage
neu zu stellen, ob der Katalog in die Datei gehört oder nachgeladen wird. Bei
172 ist sie es nicht.

## Was umfiel

Vier Tests. Einer war der Sandkasten selbst (`docs/` nicht mitkopiert). Die
anderen drei waren **an den Bestand von 46 Artikeln gebunden** — und hätten
am Liefertag gefeuert, zwischen echten Befunden, unter Zeitdruck.

### „Achtzehn Wörter, die vorher nichts fanden"

Die Messung vom 27. August verlangte, dass jedes der achtzehn Kundenwörter
**ohne** Register stumm bleibt. Mit 172 Artikeln kommt „dämmplatte" in einer
Bezeichnung vor, und die Probe fiel.

Sie war nicht falsch — sie war eine Aussage über einen Katalog mit 46
Artikeln. Geprüft wird jetzt die **Zusage** statt der Momentaufnahme: Das
Register macht stumme Wörter hörbar und nimmt keinem Wort einen Treffer weg.
Die historische Zahl steht in der Fehlermeldung, falls eines Tages **keines**
der achtzehn mehr stumm ist.

### „Jeder Artikel bekommt die Form, die er hat"

Die Probe verlangte für **jeden** eingespielten Artikel eine von Hand
hinterlegte Sollform. Bei 126 neuen wären das 126 Handentscheidungen — an dem
Tag, an dem am wenigsten Zeit dafür ist, und für eine Zusage, die der Test
darunter ohnehin prüft: Jeder Artikel bekommt eine gültige Form und behauptet
kein Maß, das er nicht gelesen hat.

Zwei Änderungen: Die Einzelprüfung steht jetzt **vor** der Zählung — die
erste Meldung lautete vorher „für jeden Rechnungsartikel eine Sollform und
umgekehrt", jetzt „POS-70019 „Fassaden EPS 14 cm 0,5 m2": keine Sollform
hinterlegt — von Hand entscheiden". Und die Tafel muss den Bestand decken,
nicht jeden künftigen Artikel.

### „Acht Vertipper kommen an"

„spachtl" schlug mit 172 Artikeln „klebespachtel" vor statt
„spachtelmasse" — dieselbe Ware, ein anderes Wort, weil sich die Häufigkeiten
mit dem Katalog verschieben. Die Zusage lautet **„der Kunde kommt an"**, nicht
„das Wort lautet so"; wo mehrere Wörter dieselbe Ware nennen, stehen jetzt
alle da.

## Die Lehre

> **Eine Probe, die den Bestand misst, ist eine Zeitbombe mit bekanntem
> Zünddatum.**

Sie ist deshalb nicht falsch — die drei hier haben echte Befunde
festgehalten, und ohne sie wären die Messungen bloß Prosa in einem Dokument.
Falsch war, dass sie nicht **sagen**, dass sie den Bestand messen. Alle drei
tun es jetzt: im Kommentar und in der Fehlermeldung.

Der Unterschied zählt an genau einem Tag, und das ist der wichtigste des
Vorhabens. Wer dann eine rote Liste vor sich hat, muss ablesen können, welche
Zeile Arbeit bedeutet und welche nur sagt, dass der Katalog gewachsen ist.

## Was die Generalprobe nicht geprüft hat

- **Die Browserproben.** `shopprobe` und `oberflaechenprobe` starten je
  Szenario einen Chromium; über 207 Seiten wäre das ein Vielfaches der
  Laufzeit. Der Rahmenzensus lief und ist der aussagekräftigere von beiden,
  weil er jede gebaute Seite misst statt zehn ausgesuchte.
- **Echte Namen.** Die 126 Zeilen sind erfunden, nach dem Muster echter
  Baustoffbezeichnungen. Sie sagen etwas über die Mechanik und nichts über
  das Sortiment.
- **Die Warengruppen.** In der Probe stand die Gruppe in der Liste. Am
  Liefertag wird sie das wahrscheinlich nicht — dafür gibt es die
  Spartentabelle, und die ist leer, bis die echten Sparten bekannt sind.
