# Ein Cent daneben, und eine andere Ware

**13. September 2026.** `npm run anfrage-lesen` gibt es seit dem 3. September.
Er ersetzt das Abtippen einer eingegangenen Anfrage — die eine Stelle, an der
ein Tippfehler falsche Ware auf eine Baustelle bringt. Über sich selbst trägt
er seither diesen Satz:

> „Ein Leser, der bei Abweichung rät, ist schlimmer als das Abtippen: Er hat
> die Autorität einer Maschine und die Verlässlichkeit einer Vermutung."

Geprüft war daran die **Abweichung**. Stimmen die Summen im Text nicht mit der
Nachrechnung überein, gibt er nichts zurück, sondern den Grund.

> **Nicht geprüft war der Fall, in dem die Summen stimmen und die Menge
> trotzdem eine andere ist.**

## Gemessen

Der Artikel `POS-53402`, *Capatect Kantenschutz mit Gewebe Carbon 11,5 13,5 cm
**2,5 m***, wird in Stangen zu 2,5 m abgegeben und kostet **0,95 €** je
laufendem Meter. Ein Kunde bestellt über die Oberfläche 121 Stangen, also
302,50 LFM. Die Positionszeile des Anfragetexts lautet dann:

```
              13,5 cm 2,5 m           POS-53402   0,95 €     287,38 €
```

Durch `npm run anfrage-lesen` gedreht, mit dem echten Katalog und dem echten
Text:

```
bestellt 302,5  ->  gelesen [{"sku":"POS-53402","menge":302.51}]
gelesen: true | grund: null
```

**302,51 laufende Meter.** Das sind 121,004 Stangen — eine Menge, die es nicht
gibt und die niemand liefern kann. Von hier aus läuft sie weiter: ins Angebot,
in die Auftragsbestätigung, in die Lieferantenbestellung.

## Warum die Nachrechnung nichts sah

Die Menge kommt aus `Zeilensumme ÷ Einzelpreis`. Das ist richtig und war gut
begründet: Bei langen Artikelnamen bricht der Text um, und die Menge steht dann
auf einer anderen Zeile als die Artikelnummer — Einzelpreis und Zeilensumme
stehen dagegen immer mit ihr zusammen.

Beide sind aber auf **Cent gerundet gedruckt**. Die Teilung gibt die Menge
deshalb nur bis auf `0,005 ÷ Einzelpreis` zurück, und bei 0,95 € je Einheit
sind das 0,0053 — mehr als der Rundungsschritt der Menge selbst:

```
287,38 ÷ 0,95 = 302,5052…   →  auf zwei Nachkommastellen: 302,51
```

Und die Gegenprobe am Ende, die alle Positionen gegen die Summen im Text hält:

```
302,51 × 0,95 = 287,3845 €   →  auf Cent gerundet: 287,38 €
```

**Dieselbe Zahl, die im Text steht.** Der Fehler ist kleiner als ein Cent in
Geld und trotzdem eine andere Ware. Eine Summenprobe kann ihn nicht sehen; sie
misst Geld, und in Geld ist er nicht da.

Über den ganzen Bestand gemessen: **100 Mengen, die die Oberfläche wirklich
bilden kann**, auf zwei Artikeln — `POS-53402` (0,95 €, Gebinde 2,5 LFM) und
`POS-53215` (0,67 €, Stückware). Ganzzahlige Mengen sind durchweg in Ordnung;
getroffen wird, was halbe Schritte hat und billig ist.

## Was es auflöst

Nicht die Zeile. Sie enthält die Auskunft nicht mehr — sie ist gedruckt und
gerundet. Der Katalog enthält sie:

> **Von allen Mengen, die dieselbe Zeilensumme ergeben, ist nur ein ganzes
> Vielfaches des Gebindes überhaupt lieferbar.**

Zwei benachbarte Vielfache trennt bei diesem Artikel ein Unterschied von
2,5 × 0,95 = **2,38 €** an Zeilensumme — weit mehr als der gedruckte Cent. Die
Antwort ist also eindeutig, sobald man nach ganzen Gebinden fragt.

`lesePositionen` bekommt deshalb seit heute `schrittFuer(sku)` hereingereicht,
genau wie `rechne` schon vorher: **Dieser Leser soll keinen zweiten Katalog
kennen.** Damit rastet die geteilte Menge auf das nächste ganze Gebinde ein.

Zwei Sperren stehen daneben, weil ein Einrasten eine Annahme ist:

1. **Ist die Antwort eindeutig?** Kostet ein ganzes Gebinde weniger als einen
   Cent, kann die gedruckte Zeile zwei Vielfache nicht auseinanderhalten. Dann
   wird nicht gerundet, sondern gesagt.
2. **Stellt die eingerastete Menge die gedruckte Zeilensumme wieder her?**
   Trifft kein ganzes Gebinde sie auf den Cent, ist die Zeile nicht die dieses
   Shops — oder der Preis hat sich geändert. Beides gehört angesehen, nicht
   überschrieben. Ohne diese zweite Sperre würde aus **jeder** beliebigen
   Zeilensumme stillschweigend eine Bestellmenge; das wäre genau das Raten, vor
   dem der Leser warnt.

Wo kein Gebindeschritt bekannt ist — Stückware ohne Packungsangabe —, bleibt es
bei der Teilung auf zwei Nachkommastellen. Dann gibt es nichts, woran zu runden
wäre, und geraten wird nichts.

## Der Prüfer

Neu: `npm run pruefe-rueckweg`. Er geht den Weg hin und zurück — für **jeden**
Artikel des Katalogs und **jede** Menge, die die Oberfläche daraus bilden kann:

```
Rückweg der Anfrage — 9200 bestellbare Mengen über 46 Artikel hin und zurück gerechnet
  Dazu 18 Zeilensummen zwischen zwei Gebinden — sie dürfen nicht durchgehen.
```

Beide Richtungen, und die zweite ist die wichtigere: Eine Fassung, die **jede**
Zahl auf das nächste Gebinde rundet, bestünde die erste Richtung mühelos. Der
Prüfer legt deshalb je Artikel eine Zeilensumme genau zwischen zwei Vielfache
und verlangt, dass sie **nicht** übernommen wird.

Die Positionszeile wird dabei absichtlich **nachgebaut und nicht aus dem
Belegbauer geholt**. Käme sie aus derselben Funktion, prüfte die Probe nur
noch, dass eine Formatierung sich selbst gleicht — und die Rundung, um die es
geht, geschieht *vor* dem Formatieren.

Er läuft im Schnelllauf mit (49 Prüfer statt 48) und kostet dort nichts
Messbares: 9200 Rundwege in unter einer Zehntelsekunde.

## Zwei Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `der-leser-rastet-nicht-mehr-ein` | die Menge wird wieder bloß geteilt und gerundet — `pruefe-rueckweg` meldet `menge-kommt-anders-zurueck` |
| `der-leser-raet-beim-krummen-betrag` | die zweite Sperre fällt weg — `pruefe-rueckweg` meldet `krummer-betrag-wird-uebernommen` |

Und im Testfall selbst steht die Gegenrichtung, damit die Strecke nicht leer
ist: Derselbe Sweep über einen **blindgestellten** Leser muss rot werden. Liefe
er auch dann grün, deckte er eine Strecke ab, auf der es nichts zu finden gibt.

**Eine Beobachtung am Rande, die festgehalten gehört:** Der erste Anlauf hängte
die zweite Gegenprobe an `npm test`. Sie schlug nicht an — aber nicht, weil die
Mutation folgenlos wäre, sondern weil eine Mutation an `src/anfragelesen.js`
zuerst den **Frischewächter** rot macht: Die gebauten Erzeugnisse sind danach
älter als ihre Quelle. Eine Gegenprobe über den Testlauf trifft an einer
Quelldatei des Seitenbauwerks also zuverlässig den falschen Befund. Beide
Proben dieser Runde hängen deshalb am Prüfer selbst — und laufen in einer
Sekunde statt in hundert.

Gemessen: 2460 Testfälle grün, 3 übersprungen, 0 rot. Schnelllauf 49 Prüfer.

## Was dieser Fund über die Prüfungen sagt

Die Summenprobe des Lesers ist nicht falsch — sie ist **grobkörniger als die
Sache, die sie schützt**. Sie misst in Cent, und die Ware wird in Stangen
geliefert. Zwischen beiden liegt ein Bereich, in dem eine Aufzeichnung richtig
aussieht und eine andere Lieferung meint.

> **Eine Prüfung, deren Einheit gröber ist als die des Gegenstands, hat einen
> blinden Streifen — und der ist genau so breit wie der Unterschied.**

Dieselbe Frage ist an andere Stellen zu stellen, an denen aus Geld eine Menge
zurückgerechnet wird. In diesem Bestand ist es genau diese eine; gefunden wurde
sie, weil der Rückweg zum ersten Mal als Ganzes gemessen wurde statt in seinen
Hälften.
