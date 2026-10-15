# Der Versuch trägt die Absage, nicht die Zusage

**3. September 2026, spät.** Der Rolloutplan hat zwölf Etappen, und die letzte
hieß:

> **Klicks sammeln, bis die Kaufquote entschieden ist** — 45 Tage, Gate 20.

Sie ist die längste Etappe des Plans, sie verbraucht das gesamte Werbebudget,
und an ihr hängt die Entscheidung über das ganze Vorhaben.

Seit heute Abend steht als **erster** Punkt in `startklar()`, am Quelltext
gemessen: **Der Kunde kann keine Bestellung abschicken.** Kein `fetch`, kein
Formular, kein Beacon im ganzen Shop. Was ein bezahlter Klick auslösen kann,
ist eine Anfrage.

> **Ein Plan, der 45 Tage und das ganze Budget auf eine Größe setzt, die der
> gebaute Shop nicht erzeugen kann, misst nicht zu wenig — er misst etwas
> anderes.**

## Die Einschränkung stand da, nur nicht dort, wo entschieden wird

Sie stand seit dem 1. September im Kopfkommentar von `werbewirkung.js`:

> *„Der Shop kann heute gar nichts verkaufen, sondern nur Anfragen erzeugen
> (`startklar`). Eine Anfrage ist kein Verkauf, und der Weg von der einen zum
> anderen ist hier nicht gemessen."*

Und sie stand als Fußnote unter `npm run werbeprobe`. Sie stand **nicht** im
Plan — in dem Dokument, das der Auftraggeber liest, bevor er das Budget
freigibt. Dieselbe Familie wie der Lieferhinweis, der auf den falschen
AGB-Punkt zeigte: **eine Regel, die es gibt, an der einen Stelle, an der sie
zählt, nicht angewandt.**

## Die Rechnung

    Kaufquote = Anfragequote × Auftragsquote

Daraus folgt eine Unsymmetrie, und sie ist der ganze Punkt:

| Beobachtung | Was sie trägt |
|---|---|
| **keine Anfrage** nach 299 Klicks | schließt die Anfragequote von 1 % aus — **und damit die Kaufquote**, denn ohne Anfrage entsteht kein Auftrag |
| **Anfragen kommen** | misst die **Anfragequote**. Über die Kaufquote sagt das nichts, solange die Auftragsquote nicht gezählt ist |

Der Versuch bleibt also in der teuren Richtung voll gültig: Bleibt alles aus,
ist die Absage belastbar, und zwar für beide Quoten. Was er **nicht** kann, ist
eine Kaufquote bestätigen — dafür fehlt die zweite Zahl, und die entsteht nicht
in der Anzeigenstatistik, sondern im Postfach des Betreibers.

Genau das war die Falle: Ein Versuch, den man für beides hält, endet nach 45
Tagen mit einer Zahl, die wie ein Ergebnis aussieht und eine andere Frage
beantwortet.

## Was geändert wurde

**Die Etappe heißt jetzt, was sie misst:** „Klicks sammeln, bis die
**Anfragequote** entschieden ist". Ihr Ergebnissatz nennt die Unsymmetrie
ausdrücklich.

**Eine dreizehnte Etappe:** „Anfragen und daraus entstandene Aufträge
mitschreiben" — beim Auftraggeber, **neben** dem Versuch, gleiche Dauer,
beginnend mit dem ersten bezahlten Klick. Zwei Striche auf einem Zettel je
Anfrage genügen: eingegangen, beauftragt. Ohne sie ist die zweite Zahl nach 45
Tagen nicht mehr rekonstruierbar.

Der bestimmende Strang ändert sich dadurch nicht — **60 Tage, passt in die
Frist**, wie zuvor.

**`versuchsaussage()`** in `werbewirkung.js` rechnet die Folge aus, statt sie zu
kommentieren: `schliesstAnfragequoteAus`, `schliesstKaufquoteAus` (dasselbe, aus
dem genannten Grund) und `bestaetigtKaufquote` — das **in keinem Zweig** wahr
werden kann. Ein eigener Testfall hält das über drei verschiedene Lagen fest.
`npm run werbeprobe` druckt die drei Fälle aus.

## Drei Nebenbefunde

**1. Der neue Prüfer hat mich sofort erwischt.** `npm run pruefe-ungerufen`
(heute Abend gebaut) meldete beim nächsten Lauf:

```
✗ src/werbewirkung.js#versuchsaussage ruft außerhalb der Tests niemand
```

Ich hatte die Funktion geschrieben und an nichts angeschlossen — genau die
Fehlerklasse, für die der Prüfer eine Stunde vorher entstanden ist. Er hat
gewirkt, wie er sollte: nicht durch Hinsehen, sondern beim Lauf. Angeschlossen
ist sie jetzt an `npm run werbeprobe`.

**2. Eine Zahl, die als Wort dastand, war außerhalb jeder Messung.** Die
PR-Beschreibung sagte „die Kette aus **zwölf** Etappen". `pruefe-schaufenster`
sucht Ziffern; ein Wort findet es nicht. Die Zahl wurde mit der dreizehnten
Etappe falsch, und kein Prüfer hätte es gesagt. Jetzt steht sie als Ziffer da,
und zwei neue Kennzahlen (Etappenzahl und Gesamtdauer) werden aus derselben
Rechnung gemessen wie `npm run rollout` — 32 statt 30.

**3. Der Hauptfall wohnte im Werkzeug.** Tagesbudget, Klickpreis, Quote und
Frist standen als lokale Konstanten in `bin/rollout.mjs`. Damit die Messung
nicht ihre eigene zweite Rechnung aufmacht, sind sie nach `src/rollout.js`
gezogen (`HAUPTFALL`) — Modellannahmen gehören nicht in die Werkzeugplumpe.

Und eine Berichtigung an einem Testfall: „Der bestimmende Strang endet an der
**letzten Etappe der Liste**" stimmte nur, solange genau eine Etappe am
Schlusstag fertig wurde. Seit die Zählung neben dem Versuch läuft, sind es
zwei; geprüft wird jetzt, was gemeint war.

## Was offen bleibt

Ein **Bestellweg** ist damit nicht gebaut, und das ist bewusst so. Er bräuchte
einen Zahlungsanbieter (Ausgabe), eine Gegenstelle (Ausgabe) und meine Arbeit —
und würde Tag 0 um Wochen verschieben, während der Zweck des Versuchs gerade
ist, **schnell** zu entscheiden, ob der Kanal überhaupt trägt. Der Weg über die
Anfrage funktioniert heute: Warenkorb, Bezirk, fertig gerechneter Text ins
eigene Mailprogramm, Angebot zurück über `npm run vorgang`.

Was fehlt, ist keine Technik, sondern ein Zettel: die zwei Striche je Anfrage.

## Verweise

- `shop/src/rollout.js` — die umbenannte und die neue Etappe, `HAUPTFALL`
- `shop/src/werbewirkung.js` — `versuchsaussage()`
- [`neun-punkte-und-keiner-war-der-weg.md`](./neun-punkte-und-keiner-war-der-weg.md) — der Befund, auf dem dieser steht
- [`gebaut-geprueft-nicht-angeschlossen.md`](./gebaut-geprueft-nicht-angeschlossen.md) — der Prüfer, der mich hier erwischt hat
