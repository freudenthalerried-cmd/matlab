# Wo der Shop am wenigsten weiß, sieht seine Seite jeder anderen am ähnlichsten

**4. September 2026.** Die Dublettenprüfung von gestern Nacht nannte ein
ähnlichstes Paar — **0,96, POS-12467 / POS-12472** — und ließ es als Zahl
stehen. Diese Runde ist der Frage nachgegangen, warum ausgerechnet diese
beiden.

Es sind zwei von drei Kaminpaketen:

| Artikel | Bezeichnung |
|---|---|
| POS-12455 | SIK Zuluftplatte EZ 16-18 inkl. Befestigung |
| POS-12467 | SIKM Putztüranschlusspaket oben 18 |
| POS-12472 | SIKM Fertigfußpaket 18 |

Und sie sind zugleich die einzigen drei Artikel des Bestands, bei denen
`bauform()` **keine Form erkennt** und auf die Auffangform `teil` zurückfällt.

> **Das ist kein Zufall, sondern dieselbe Ursache zweimal.** Wo der Name kein
> Bauteil nennt, hat die Seite weder eine Zeichnung dieses Erzeugnisses noch
> ein Wort, das nur sie trägt.

## Der Befund: eine Lücke, die wie eine Angabe klang

`artikelBild()` trägt seit dem 30. August eine Regel, die genau richtig ist:

```js
const beschreibung = form === 'platte' && dickeMm(artikel?.bezeichnung) === null
  ? 'Schemazeichnung: Dämmplatte, Stärke nicht aus der Bezeichnung ablesbar'
  : `Schemazeichnung: ${BAUFORM_TEXT[form] ?? 'Bauteil'}`;
```

Die Zusage „Stärke maßstäblich" gilt nur, wenn die Stärke ablesbar war — sonst
sagt die Bildbeschreibung das.

**Die Auffangform hatte diese Regel nicht.** Sie meldete
`Schemazeichnung: Bauteil` — und das liest sich wie eine Aussage über den
Artikel, obwohl es das Gegenteil ist: Die Form war aus dem Namen nicht zu
bestimmen.

> **Eine Lücke, die wie eine Angabe klingt, ist schlimmer als eine sichtbare
> Lücke.** Genau dafür führt dieser Bestand seine `[[ … FEHLT ]]`-Marken auf
> den Belegen.

Es ist die Familie, die hier seit zwei Tagen alle paar Stunden auffällt: **eine
Regel, die es gibt, an einer Stelle nicht angewandt** — wie der Lieferhinweis,
der auf AGB-Punkt 6 statt 7 zeigte, und wie der Fehlt-Satz, den zwei von drei
Oberflächen richtig beugten.

## Was geändert wurde

**Die Bildbeschreibung sagt jetzt, dass sie ein Platzhalter ist:**

```
Platzhalter: Die Form dieses Artikels ist aus seiner Bezeichnung nicht ablesbar
```

**Und der Leser sieht es auch.** Eine Bildbeschreibung liest ein
Vorleseprogramm und sonst niemand; ein Bauleiter, der eine Zeichnung sieht,
hält sie für eine Zeichnung dieses Artikels. Unter der Zeichnung steht deshalb
auf genau diesen drei Seiten:

> Die Form dieses Artikels ist aus seiner Bezeichnung nicht ablesbar — die
> Zeichnung ist ein Platzhalter und kein Schema dieses Erzeugnisses. Was zum
> Paket gehört, sagt die Systemliste unten.

Zwei Testfälle halten das fest: einer an der Funktion (Auffangform ⇒
„Platzhalter", erkannte Form ⇒ weiterhin „Schemazeichnung: Sackware"), einer an
den **gebauten** Seiten — jeder Artikel mit Auffangform trägt den Hinweis, und
kein Artikel mit erkannter Form trägt ihn.

*(Der zweite Testfall suchte zuerst nach dem bloßen Wort `bildhinweis` und war
sofort rot: Die Formatvorlage steht im Kopf **jeder** Seite. Wer nach dem Wort
sucht, hält den Stil für den Inhalt.)*

## Die vierte Folge der Artikelliste

Die Frage an den Lieferanten nach der **Artikelliste aus dem Kundenkonto**
nannte bisher drei Folgen: GTIN, Marke und Bild für den Feed, dazu aktuelle
Preise gegen den 133 Tage alten Einstand. Seit gestern Nacht ist eine vierte
gemessen, und sie wiegt für den Klickkanal schwerer als die drei anderen:

> 62 % der Wörter einer Artikelseite stehen wortgleich auf allen 46. Die Seiten
> unterscheiden sich in einem Namen und vier Zahlen. 20 von 46 Artikeln tragen
> dieselbe Zeichnung wie ein anderer, und bei drei Kaminpaketen ist die Form
> aus dem Namen gar nicht ablesbar.

**Auf diese Seiten führt der bezahlte Klick.** Der Satz steht jetzt im Brief
(`npm run pruefe-anfrage`) und in der Liste der offenen Punkte, nicht nur in
einem Dokument.

## Und der Prüfer, der eine Prozentzahl für Tage hielt

Beim Gesamtlauf meldete `npm run pruefe-leitzahlen` eine abgelöste Zahl in
`STATUS.md`:

```
✗ Kette bis zur Entscheidung steht mit 57 ohne ihre Bedingung — gültig ist 60
```

Die Fundstelle war mein eigener Satz von gestern Nacht: „hob den gemeinsamen
Anteil **von 57 % auf 62 %**". Eine Prozentzahl aus der Dublettenmessung,
gelesen als Tageszahl des Rolloutplans — dessen Kette seit der Etappe
„Search Console einrichten und Indexierung bestätigen" **60 Tage** dauert und
nicht mehr 57.

> **Ein Prüfer, der eine Prozentzahl für eine Tageszahl hält, wird beim dritten
> Fehlalarm abgeschaltet** — und findet dann auch den echten nicht mehr.
> Dieselbe Lehre wie beim Geheimnisprüfer, der gestern `3,68` mitten in
> `153,68 €` fand.

Zwei Berichtigungen, beide nötig:

1. **Jede Leitzahl sagt jetzt, welche Einheit hinter ihrer Ziffer steht** —
   `euro`, `tage`, `prozent` oder ausdrücklich `null` für Stückzahlen, die
   nackt im Satz stehen. Eine Zahl mit **fremder** Einheit wird übersprungen.
   Die Prüfung ist bewusst schmal: Sie sieht nur, was unmittelbar hinter der
   Ziffer steht. Ohne Einheitszeichen bleibt die Zahl verdächtig — die sichere
   Richtung.
2. **Mein Satz trug seine Einheit nicht.** „von 57 auf 62 %" heißt „von 57 %
   auf 62 %", und erst so greift die neue Regel. Der Prüfer hatte insofern
   recht: Eine Zahl ohne Einheit ist mehrdeutig, und genau daran ist er
   gestolpert.

Ein Testfall hält beide Richtungen fest: Die Prozentzahl wird nicht mehr als
Tageszahl gemeldet, dieselbe Zahl **in Tagen** weiterhin schon, und ohne
erklärte Einheit ändert sich nichts.

## Was offen bleibt

Die drei Kaminpakete bleiben ohne Zeichnung ihres Erzeugnisses, und das ist
richtig so: Was in einem „Fertigfußpaket 18" steckt, weiß der Lieferant und
nicht dieser Shop. Erfunden wird hier nichts. Was fehlt, steht seit Tagen als
offener Punkt — und hat jetzt eine Folge mehr.

## Verweise

- `shop/src/bilder.js` — die Auffangform sagt, dass sie eine ist
- `shop/src/leitzahlen.js` — `EINHEITSZEICHEN`, `fremdeEinheit()`
- `shop/src/lieferantenanfrage.js`, `shop/src/offenepunkte.js` — die vierte Folge
- [`sechsundvierzig-mal-fast-dieselbe-seite.md`](./sechsundvierzig-mal-fast-dieselbe-seite.md) — die Messung, aus der diese Runde kommt
