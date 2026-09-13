# Der Maßstab lag im Haus

**13. September 2026, dritte Runde des Tages.** Vormittags ist
`bestellschritt` entstanden: die kleinste Menge, in der ein Artikel bestellbar
ist — 1 für jedes Stück, jeden Sack, jeden Eimer, sonst die gelesene
Gebindegröße. Reichweite 45 von 46.

Angeschlossen wurde er an den Rechenkern und an die Oberfläche.

> **An den Leser nicht.**

## Gemessen

```
POS-53215  Rahmenschraube Zylinderkopf vz 7,5x182 mm lose  STK  0,67 €

Zeile:  „POS-53215   0,67 €   1,01 €"
  mit mengenschritt  →  [{ menge: 1.51 }]
  mit bestellschritt →  []   „1,01 € ÷ 0,67 € sind 1,5075 — kein ganzes
                              Gebinde zu 1 trifft diese Zeilensumme"
```

**Anderthalb Schrauben.** Und die Sperre dagegen lag seit dem Vormittag im
Haus.

`bin/anfrage-lesen.mjs` und `bin/vorgang.mjs` reichten weiter `mengenschritt`
herein — die Funktion, die die Gebindegröße aus der **Bezeichnung** liest und
sie bei Stück, Sack, Eimer, Karton, Dose und Rolle nicht findet. Das sind 28
von 46 Artikeln des Bestands, also genau die Lücke, die der Vormittag
geschlossen zu haben glaubte.

> **Ein Maßstab, der im Haus liegt und nicht angelegt wird, ist keiner.**

## Und der Prüfer sah es nicht

`npm run pruefe-rueckweg` gibt es seit gestern. Er geht den Weg hin und zurück
— für jeden Artikel und jede Menge, die die Oberfläche bilden kann. Er lief
grün.

Der Grund stand in einer Zeile seines eigenen Kerns:

```js
const schritt = gebinde || 1;
```

Wo kein Schritt bekannt war, rechnete der Sweep mit ganzen Einheiten weiter —
und **übersprang dabei die Gegenrichtung**, die Probe, dass eine Zeilensumme
zwischen zwei Gebinden nicht durchgeht. Mit `mengenschritt` traf das 28 von 46
Artikeln.

> **Eine Prüfung, die über eine nicht gefahrene Strecke grün meldet, ist die
> teuerste Sorte Grün.** Sie sagt nicht „ich weiß es nicht", sondern „es ist in
> Ordnung".

Dieselbe Familie wie der Rückfall `|| 1` in `shop-ui.js`, der gestern gefallen
ist: ein geratener Wert, der als Bequemlichkeit beginnt und als Auskunft endet.

## Was geändert wurde

**Drei Werkzeuge fragen jetzt nach dem Bestellschritt** —
`bin/anfrage-lesen.mjs`, `bin/vorgang.mjs`, `bin/rueckwegpruefung.mjs`.

**Der Sweep rät nicht mehr.** Ein Artikel ohne Bestellschritt wird
übersprungen, gezählt und **namentlich genannt**:

```
Rückweg der Anfrage — 9000 bestellbare Mengen über 46 Artikel hin und zurück gerechnet

  Dazu 45 Zeilensummen zwischen zwei Gebinden — sie dürfen nicht durchgehen.

  1 Artikel ohne Bestellschritt, nicht gefahren: POS-21382
  Ihre Bezeichnung nennt keine Gebindegröße, und ihre Einheit ist teilbar —
  geraten wird nichts, aber geprüft ist dort auch nichts.
```

Die Gegenrichtung stieg damit von 18 auf **45** Artikel.

**Und die Reichweite wird gemessen.** Die Untergrenze im Prüferregister steigt
von 2.000 auf **8.000**. Sie ist hier keine Schmuckzahl: 200 Mengen je Artikel
mit bekanntem Schritt — mit `bestellschritt` sind das 45 Artikel und 9.000
Mengen, mit `mengenschritt` wären es 18 und 3.600. **Wer den Maßstab
zurückdreht, bekommt nicht stillschweigend eine kleinere Prüfung, sondern ein
„zu wenig gemessen".**

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `der-leser-fragt-wieder-die-bezeichnung` | der Prüfer misst wieder nur die Artikel mit lesbarer Gebindegröße — `pruefe-pruefer` meldet die gefallene Zahl |
| `das-werkzeug-legt-den-massstab-nicht-an` | ein Werkzeug reicht wieder `mengenschritt` herein |

Die zweite misst die **Verdrahtung**, nicht ihr Ergebnis. Das ist Absicht: Dass
die heutigen Preise zufällig zu keiner gebrochenen Stückzahl führen, ist kein
Schutz — der Preis ändert sich, die Frage bleibt. Dieselbe Form wie die
Formelzählung von gestern.

## Drei Runden, dieselbe Bewegung

| Runde | was gefunden wurde |
|---|---|
| Rückweg der Anfrage | Die Menge kam aus gerundetem Geld zurück und war eine andere |
| Ganze Gebinde im Kern | Die Regel stand nur im Browser |
| Achtzehn von sechsundvierzig | Der Maßstab kannte nur die Messware |
| *diese* | Der Maßstab war gebaut und nicht angelegt |

Jede Runde hat eine Hälfte eines Paares in Ordnung gebracht und die andere
liegen lassen — und jede hat die nächste sichtbar gemacht, weil danach jemand
gefragt hat, **wie weit es trägt**. Das ist kein Zufall und keine Nachlässigkeit
allein: Es ist die Reihenfolge, in der ein Fehler dieser Art überhaupt sichtbar
wird.
