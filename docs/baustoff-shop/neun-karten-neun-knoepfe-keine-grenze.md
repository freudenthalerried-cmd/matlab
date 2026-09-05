# Neun Karten, neun Knöpfe, keine Grenze

**5. September 2026, nachts.** `suche.html` stand seit Wochen als „die letzte
ungelesene Kundenfläche" in den offenen Punkten. Gelesen — und zwar im Browser,
mit einem Suchbegriff darin:

```
#suche?q=daemmung
  karten=9  legenknoepfe=9  nenntGrenze=false
```

Neun Artikelkarten, jede mit Mengenfeld und einem Knopf **„In den Warenkorb"**.
Und kein Wort über die Grenze, unter der die Kasse keine Anfrage annimmt.

> **Am 5. September, mittags, wurde genau dieser Fehler behoben** — für die 19
> Seiten mit Artikelkarten. Die Suchergebnisseite war nicht dabei.

---

## Warum die Regel diese Fläche nicht kannte

`mitMindestwert` in `bin/website.mjs` hängt den Satz an jede Seite, die eine
Karte trägt. Erkannt wurde das so:

```js
if (!html.includes('class="karte"')) return html;
```

Das misst den **gebauten Text**. Und es gibt genau eine Seite, deren
Kartenraster im gebauten Text leer ist:

```html
<div id="suche-ziel"></div>
```

Die neun Karten entstehen erst, wenn jemand tippt.

> **Die Regel gilt für Seiten mit Karten. Gemessen wurde an Karten, die schon
> dastehen — und die eine Fläche, deren Karten der Kunde selbst hervorruft,
> fiel heraus.**

Dieselbe Gestalt wie den ganzen Tag: *ein Prüfer, dessen Reichweite kleiner ist
als die Reichweite der Regel, die er prüft.* Diesmal war es keine Prüfung,
sondern die Regel selbst — die Stelle, die den Satz **anhängt**.

---

## Die erste Messung war grün, und sie war hohl

Das Szenario, mit dem ich messen wollte, sagte zuerst:

```js
nenntGrenze = /Mindestbestellwert/.test(document.body.textContent)
```

Es meldete **grün**. Der Grund steht seit dem 27. August im Kopfkommentar
derselben Datei, als Lehre Nummer zwei:

> *„**Geprüft wird nur der gerenderte Text** zwischen zwei Markern, nicht das
> ganze Dokument."*

`ausgabe/website.html` ist die Einzeldateifassung: 81 Seiten in einem Dokument,
die aktive in `#inhalt`, alle anderen in `<template>`. Das Wort steht dort
zehnmal. Ich habe über das ganze Dokument gesucht, während der Kunde eine Seite
sieht.

Der Unterschied, sichtbar gemacht — die Sonde gibt seither beides aus:

```
karten=9 legenknoepfe=9 nenntGrenze=false imGanzenDokument=true
```

> **Eine Zusicherung, die über das ganze Dokument sucht, wenn der Kunde eine
> Seite sieht, ist kein Prüfsatz, sondern ein Treffer.**

Die Warnung stand da. Sie war für den eingebetteten Quelltext geschrieben, und
gestolpert bin ich über die Nachbarseiten — dieselbe Falle, ein Schritt weiter.

---

## Behoben, und zwar zweimal

**Erstens die Regel.** `KARTENFLAECHEN` führt jetzt zwei Merkmale:
`class="karte"` und `id="suche-ziel"`. Das zweite ist eine **Kennung**, keine
allgemeine Regel — das ist ihm anzusehen, und es soll ihm anzusehen sein. Eine
Liste ist so vollständig, wie jemand daran gedacht hat, und der Befund dieser
Runde ist ja gerade, dass die erste Fassung eine Fläche nicht kannte.

**Zweitens die Messung, die nicht an dieser Liste hängt.** Ein neues Szenario in
`bin/shopprobe.mjs` geht **alle** Seiten der Einzeldatei durch und fragt bei
jeder dasselbe:

> Steht nach dem Laden ein Knopf „In den Warenkorb" auf der Seite? Dann steht
> die Grenze dazu.

```
seiten=81  mitKnopf=…  ohneGrenze=keine
```

Keine Liste, kein Register, kein Merkmal im Quelltext — die Frage wird an der
gerenderten Seite gestellt. Fügt jemand morgen eine Fläche hinzu, deren Karten
aus einer dritten Quelle kommen, meldet sich dieses Szenario und nicht die
Liste.

### Der Zeitstolperer, und warum er nicht grün gemeldet hat

Der erste Lauf über 81 Seiten meldete:

```
✗ Keine Fläche mit Legen-Knopf ohne die Grenze
    die Sonde ist nicht gelaufen — kein Marker in der Seite
```

`geheZu` wartet nach jedem Sprung 60 ms. Über 81 Seiten sind das 4,9 Sekunden,
und der Browser läuft mit einem Budget von 2,5 Sekunden virtueller Zeit — die
Sonde kam nie dazu, ihren Marker zu schreiben.

**Der Punkt ist nicht der Fehler, sondern die Meldung.** Eine Sonde, die nicht
zu Ende läuft, gilt in dieser Probe als **Fehlschlag** und nicht als bestanden.
Genau dafür gibt es den Marker, und hier hat er zum ersten Mal seinen eigenen
Zweck belegt. Der Seitenwechsel ist synchron (`hashchange` setzt `#inhalt` und
ruft `start()` in einem Zug); die Schleife wartet jetzt einen Tick statt 60 ms.

---

## Die Gegenprobe — und der 36. Prüfer

`korbflaeche-ohne-grenze` nimmt das Merkmal `id="suche-ziel"` wieder heraus,
baut neu und lässt die Browserprobe laufen. Sie meldete **rot an der erwarteten
Stelle**.

Damit hat `shopprobe` — 55 Szenarien, die teuerste Probe im Bestand — zum
ersten Mal überhaupt eine Gegenprobe. **72 Gegenproben für 36 Prüfer**, vorher
71 für 35.

---

## Zwei Regeln, die sich in die Quere kamen

Der Gesamtlauf danach wurde an einer Stelle rot, an der ich es nicht erwartet
hatte:

```
not ok — keine Seite mit eigenem Inhalt trägt noindex
  suche trägt noindex, hat aber 585 Zeichen eigenen Inhalt
```

Seit dem 30. August gilt: Eine Seite mit Substanz gehört in den Index, eine
ohne trägt `noindex`. Gemessen wird die Länge des eigenen Inhalts, Schwelle 500
Zeichen. `suche.html` hatte 214 — und der Absatz, den ich gerade angehängt
habe, ist 371 Zeichen lang.

**Beide Regeln haben recht, und die Seite bleibt `noindex`:** Eine
Suchergebnisseite gehört nicht in den Index, und die Grenze gehört auf jede
Fläche, auf der ein Korb gefüllt wird. Falsch war das **Maß**.

> **Ein Absatz, der auf zwanzig Seiten wortgleich steht, sagt nichts darüber,
> ob diese Seite Substanz hat.**

Der Mindestwerthinweis wird bei der Messung jetzt herausgeschnitten — mit
derselben Begründung, mit der die Brotkrume seit dem 31. August herausfällt:
Was die Seite nicht selbst schreibt, misst nicht ihren Inhalt. Ohne diesen
Schnitt entschiede eine Regel über Gate 25 mit darüber, welche Seiten in den
Index gehören.

**Und eine Mutation, die nicht mehr ankam.** Der Gegenprobenlauf meldete:

```
✗ pruefe-seiten — Eine Seite, auf der man einen Korb füllt, …
    Suchtext nicht gefunden: "  if (!html.includes('class=\"karte\"')) return html"
```

Genau die Zeile, die ich am Nachmittag zu `KARTENFLAECHEN.some(…)` gemacht
habe. Die Gegenprobe vom Mittag suchte sie noch im alten Wortlaut — und eine
Gegenprobe, deren Mutation nicht ankommt, prüft nichts. **Gemeldet hat es der
Lauf selbst und nicht ich**; dass ein nicht gefundener Suchtext ein Abbruch ist
und kein Achselzucken, steht seit dem 30. August in `bin/gegenprobe.mjs`.
Suchtext nachgezogen, Gegenprobe schlägt wieder an.

*Und eine Zahl mehr:* `pruefe-schaufenster` meldete „die Beschreibung sagt 53,
gemessen sind 55" — die Kennzahl der Shopszenarien in der PR-Beschreibung, im
selben Lauf nachgezogen. Der Prüfer hat getan, wofür es ihn gibt.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — 2 Szenarien in `shopprobe` (53 → 55) |
| Neue Gegenproben | `korbflaeche-ohne-grenze`, erste für `shopprobe` |
| Gegenproben gesamt | **72 für 36 Prüfer** |
| Neue Gates | keine — Gate 25 gilt unverändert, es stand nur nicht überall |

## Was offen bleibt

- **`suche.html` ist gelesen.** Was dabei sonst auffiel und **nicht** geändert
  wurde: Die Seite trägt `noindex,follow` (richtig — eine Suchergebnisseite
  gehört nicht in den Index), und ihr Suchfeld sitzt in der Kopfleiste, also
  auf jeder Seite. Beides ist in Ordnung.
- **Die Sammeldeckung im Kopf (`kopfwiderruf`)** deckt nach Wortvorkommen
  statt nach Gegenstand — offen seit der Runde davor.
- **Der Vorbehalt zum Liefergebiet** steht in `areaServed` nicht dabei.
