# Eine Karte ohne Abzweige

**11. September 2026. Runde 26.**

## Was gemessen wurde

`src/betriebskette.js` ist die Landkarte des Geschäftsfalls: neun Schritte von
der eingehenden Bestellung bis zur siebenjährigen Aufbewahrung, je Schritt das
Werkzeug und das Gate — und bei jedem Schritt ohne Werkzeug ein **Pflichtgrund**,
warum es keines gibt. Ihre eigene Regel steht in der ersten Zeile ihres Kopfes:

> Ein Schritt ohne Werkzeug und ohne Grund ist der Fund.

Der Prüfer meldete grün. Die Kette reicht zusammenhängend bis Schritt 4, die
Lücke beginnt bei der Zahlung, jede Lücke hat ihren Grund.

Und trotzdem fehlte etwas, das seit dem Vortag im Haus steht. Runde 25 hat
`npm run vorgang -- --stufe absage` gebaut — den Brief an den Kunden, dessen
Bestellung **nicht** zustande kommt. Dieses Werkzeug stand in keinem der neun
Schritte. Nachgezählt, am Stand vor dieser Runde:

```
$ grep -c absage src/betriebskette.js
0
```

Es konnte auch in keinem stehen. Der Kopf der Liste sagt, sie führe die
Schritte „in der Reihenfolge, in der sie eintreten" — und eine Absage tritt
nicht *nach* der Annahme ein, sondern **statt** ihrer.

> **Eine Karte, die nur den geglückten Weg kennt, meldet sich sauber und
> verschweigt jede Stelle, an der ein Kunde stehen bleibt.**

Es ist nicht die einzige Liste mit diesem Zuschnitt. `src/auftragslauf.js`
führt elf Schritte, `src/abgleich.js` hält sie gegen die dreizehn AGB-Punkte.
Auch dort endet jeder Fall mit der Buchung. **Drei Listen beschreiben den
Geschäftsfall, und keine kennt einen, der nicht zustande kommt.**

## Was geändert wurde

`ABZWEIGE` — eine zweite Tafel unter der Kette, mit derselben Pflicht und einer
Spalte mehr:

| Feld | Bedeutung |
| --- | --- |
| `ab` | der Schritt, nach dem der Abzweig möglich wird |
| `werkzeug` | der Befehl, oder `warumOhneWerkzeug` |
| `grundlage` | die **veröffentlichte** Regel, oder `warumOhneGrundlage` |

Die zweite Pflichtfrage ist der Ertrag. Ein Abzweig ohne Werkzeug ist Arbeit,
die aussteht. Ein Abzweig ohne veröffentlichte Regel ist ein Kunde, der die
Regel sucht und keine findet — **der teurere von beiden, weil er den trifft,
der schon gezahlt hat.**

Drei Abzweige, alle belegt, keiner erfunden:

**1. `absage`, nach dem Posteingang.** Werkzeug seit Runde 25. Grundlage: AGB
Punkt 2 — die Bestellung ist das Angebot, der Vertrag entsteht erst mit der
Auftragsbestätigung. Die einzelnen Gründe stehen in Punkt 1, 5 und 12.

**2. `angebot-verfaellt`, nach dem Angebot.** Grundlage: die Bindefrist von
vierzehn Tagen, die auf jedem Angebot mit Datum steht. Kein Werkzeug, und der
Grund trägt: *Der Ablauf einer Frist ist kein Ereignis im Rechner, sondern das
Ausbleiben eines Ereignisses.* Ein Werkzeug müsste täglich über die Ablage
laufen; nichts in diesem Haus läuft täglich. Die Folge ist auch keine
Nachricht, sondern eine Entscheidung des Betreibers — neu rechnen oder ziehen
lassen.

**3. `kann-nicht-geliefert-werden`, nach der Lieferantenbestellung.** Kein
Werkzeug **und keine Grundlage**. Die dreizehn AGB-Punkte regeln
Vertragsschluss, Lieferung, Zahlung, Gewährleistung und Gerichtsstand — keiner
sagt, was gilt, wenn die bestellte und **bezahlte** Ware nicht kommt. Rücktritt,
Nachfrist und Rückzahlung sind Rechtstexte, und die sind ein offener Punkt beim
Auftraggeber. Sie hier zu erfinden hieße, dem Kunden eine Regel zu versprechen,
die auf keiner veröffentlichten Seite steht.

Dass ein Werkzeug fehlt, ist bei diesem dritten Abzweig die **Folge** und nicht
der Fund: Was zu tun wäre, hängt davon ab, was die Regel sagt. Ein Werkzeug vor
der Regel wäre eine Zusage, die niemand geprüft hat.

## Die Gegenrichtung — der eigentliche Prüfer

Eine Liste, die nur sich selbst gegen sich selbst hält, bleibt grün, während die
Wirklichkeit davonläuft. Genau das ist am 10. September passiert.

`stufenbefund` liest deshalb die Zeile, mit der `bin/vorgang.mjs` seine
erlaubten Stufen aufzählt, und hält sie **in beide Richtungen** gegen die Karte:

* eine Stufe, für die die Karte keinen Platz hat → `stufe-ohne-platz`
* ein Platz in der Karte für eine Stufe, die es nicht gibt → `platz-ohne-stufe`

Mit dem Bestand von gestern gemessen — ohne den Abzweig `absage`:

```
stufe-ohne-platz: Das Werkzeug kennt die Stufe „absage" — die Karte führt sie
                  weder als Schritt noch als Abzweig
```

**Dieser Befund wäre am 10. September rot geworden.** Das ist der Grund, ihn zu
bauen: nicht die drei Abzweige von heute, sondern der vierte, den jemand morgen
baut, ohne an die Karte zu denken.

Findet sich die Zeile nicht oder ist sie leer, ist das ausdrücklich **kein
grünes Ergebnis**, sondern eine eigene Meldung (`stufen-nicht-lesbar`). *Ein
Prüfer, der nichts findet, hat nichts geprüft.*

## Eine Begründung, die sich selbst prüft

`warumOhneGrundlage` beim dritten Abzweig behauptet etwas über einen anderen
Teil des Hauses: dass keiner der dreizehn AGB-Punkte die Lieferunfähigkeit
regelt. Solche Sätze veralten still. Ein Testfall hält sie deshalb fest:

```js
assert.equal(AGB_GLIEDERUNG.length, 13);
assert.deepEqual(treffer.map((p) => p.nr), [],
  'Die AGB regelt die Lieferunfähigkeit jetzt — warumOhneGrundlage nachziehen.');
```

Sobald die Rechtstexte den Punkt bekommen, wird dieser Fall rot — **bevor die
falsch gewordene Begründung jemand liest.**

## Nebenbei: ein Prüfer, der eine Zeile prüfte, die es nicht gibt

Der neue Testfall oben enthält `/rücktritt|…/i.test(`…`)`, und daran ist
`npm run pruefe-tests` hängengeblieben:

```
betriebskette.test.js
  Zeile 169: ${p.titel} ${p.hinweis ?? ''}
    → nicht lesbar: kein Rumpf nach dem Namen gefunden
```

Der Prüfer suchte `\btest\(` — und **eine Wortgrenze steht auch zwischen dem
Punkt und dem Namen.** Jeder Aufruf von `RegExp.prototype.test` mit einem
Schablonentext und einem Beistrich danach galt ihm als Testfall; den Inhalt der
Schablone nahm er als dessen Namen.

Dass er sich hier meldete statt zu schweigen, ist sein Verdienst: Er sagt
„nicht lesbar" und endet rot, statt den Fall still zu überspringen. Die zweite
solche Zeile hat er aber nicht gemeldet — in `test/vorbehalt.test.js` fand er
zufällig eine geschweifte Klammer und **zählte sie wochenlang als geprüften
Testfall.** Gemessen: 2295 gezählte Fälle vorher, 2293 nachher, und beide
Wegfälle sind Methodenaufrufe.

> **Ein Prüfer, der eine Zeile prüft, die es nicht gibt, verdeckt die, die es
> gibt.**

Das Muster heißt jetzt `(?<![.\w$])test\(`. Festgehalten wird die Berichtigung
dort, wo dieser Prüfer sich selbst nachweist: in `test/probe/probe.test.js`
steht der Methodenaufruf nun **im Rumpf eines sauberen Falls**, und der
Werkzeugtest verlangt, dass der Schablonentext in keiner Meldung als Name
auftaucht.

## Ausgang

| | |
| --- | --- |
| Abzweige | 3, davon 1 mit Werkzeug, 1 ohne veröffentlichte Regel |
| neue Regeln im Prüfer | 5 für Abzweige, 3 für die Stufen |
| Testfälle | 10 neu (17 in der Datei), alle grün |
| Gegenproben | 3 neu (`abzweig-ins-leere`, `stufe-ohne-platz`, `methodenaufruf-als-testfall`), alle schlagen an |
| nebenbei berichtigt | `bin/testpruefung.mjs` zählte Methodenaufrufe als Testfälle |

## Was daraus offen bleibt

Kein neuer Punkt für den Auftraggeber — der einzige, den dieser Befund berührt,
steht längst auf der Liste: **die Rechtstexte**. Er hat nur ein Gesicht
dazubekommen. Bisher war er eine Formalität („AGB und Datenschutz müssen von
einem Anwalt kommen"). Jetzt ist benannt, welche Frage in ihnen fehlt: *Was
bekommt der Kunde, der bezahlt hat und dessen Ware nicht kommt?*

## Aufgenommen für die nächste Runde

Beim Prüferdurchgang dieser Runde ist `npm run pruefe-punkte` rot — mit fünf
Meldungen, von denen **keine einzige aus dieser Runde stammt**: Gate 35 und
Gate 36 stehen seit den Runden 21 und 23 in offenen Punkten, das Datum
„10. September" seit dem 10., und der Freibrief für den HTTP-Status 403 zeigt
auf einen Text, der ihn nicht mehr nennt.

Der Grund, warum das niemandem aufgefallen ist, wiegt schwerer als die fünf
Meldungen: **Der Haken vor dem Commit fährt `pruefe-tests` und `npm test`, aber
nicht die Prüfer.** Einer, der seit drei Tagen rot ist, hat drei Tage lang
nichts verhindert.

Der falsche Ausweg wäre, die vier Zahlen in die Freibriefliste zu schreiben und
weiterzugehen. Die nächste Runde misst zuerst, **welche der einundfünfzig
Prüfer gerade rot sind und welche der Haken überhaupt fährt** — und entscheidet
dann, was in den Haken gehört.

---

**Die Regel dieser Runde:** *Eine Landkarte, die nur den geglückten Weg kennt,
ist keine Landkarte, sondern ein Wunsch.*
