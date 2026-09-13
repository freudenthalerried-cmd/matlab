# Der schmale Rahmen gilt jetzt für jede Seite, nicht für neun

Stand: 2026-08-29

## Was vorher galt

Die Shopprobe misst neun ausgesuchte Seiten in einem 390 px breiten
`<iframe>` — Startseite, AGB, eine Artikelseite, zwei Gruppenseiten, eine
Systemliste, eine lange Wissensseite, Warenkorb und Kasse. Diese Stichprobe
hat einen echten Fehler gefunden: „Geschäftsbedingungen" ist als Überschrift
437 px breit, die AGB-Seite rollte 82 px seitwärts.

Sie hat aber eine eingebaute Grenze: **Wer die zehnte Seite baut, misst sie
nicht.** Und genau das steht bevor. Das Sortiment soll auf mindestens hundert
Artikel wachsen; jeder Artikel bringt eine Seite mit, und niemand wird für
hundert Artikelseiten Szenarien von Hand schreiben.

## Was jetzt gilt

`npm run rahmenzensus` zählt keine Szenarien, sondern **liest den Bestand**:
Was in `ausgabe/site/` als `.html` liegt, wird gemessen. Heute sind das 81
Seiten; morgen sind es die, die dann dort liegen.

**Befund: 81 von 81 Seiten rollen bei 390 px nicht seitwärts.** Acht Seiten
tragen Tabellen bis 667 px Breite — alle acht stehen in einem eigenen
Scrollkasten, keine schiebt den Rumpf.

| Seite | breitestes Element |
| --- | --- |
| `wissen/kanal-was-zusammengehoert` | Tabelle bis 667 px |
| `system/fassade-100-qm` | Tabelle bis 603 px |
| `system/kanal-dn100` | Tabelle bis 597 px |
| `system/kaminzug` | Tabelle bis 566 px |
| `system/kellerwand-perimeter` | Tabelle bis 563 px |
| `rechtliches/agb` | Tabelle bis 483 px |
| `gruppe/daemmung` | Vergleichstafel bis 419 px |
| `wissen/kaminzug-aufbau` | Tabelle bis 394 px |

Laufzeit: rund neun Sekunden für 81 Seiten, sechs Chromium-Starts
nebeneinander. Der Zensus bleibt aus dem Regellauf heraus und läuft mit
`npm run pruefe-pruefer -- --mit-browser` mit.

## Zwei Messungen, und die zweite ist nicht überflüssig

**Erstens:** `scrollTo(9999, 0)`, danach `scrollX`. Das ist der Test, der
nicht lügt — anders als `scrollWidth`, der auch Inhalt zählt, der in einem
Scrollkasten liegt und dort hingehört.

**Zweitens:** Reicht etwas über 390 px hinaus, das **kein** scrollendes
Elternteil hat? Ob ein Elternteil scrollt, wird über den berechneten Stil
ermittelt (`overflow-x` ist `auto` oder `scroll`) und nicht über die Klasse
`.scroll` — sonst prüfte der Prüfer die eigene Schreibweise statt die
Wirkung.

Die zweite Messung ist der Schutz gegen die naheliegendste Scheinlösung. Wer
`overflow-x: hidden` auf Rumpf und Wurzel setzt, bringt Messung 1 für immer
zum Schweigen und **schneidet den Inhalt ab, statt ihn erreichbar zu machen**.
Genau das wurde durchgespielt:

| Zustand der Kaminzug-Seite | Messung 1 | Messung 2 |
| --- | --- | --- |
| unverändert | still | still |
| Tabelle aus dem Scrollkasten genommen | **18 px seitwärts** | **15 Elemente über der Kante** |
| dazu `html,body{overflow-x:hidden}` | still | **15 Elemente über der Kante** |

Die dritte Zeile ist der Grund, warum es Messung 2 gibt.

## Ein Fehler im Prüfer selbst, gefunden durch die Gegenprobe

Der erste Wurf maß in dieser Reihenfolge: erst `scrollTo(9999, 0)`, dann die
Kanten der Elemente. Die Gegenprobe meldete daraufhin **18 px
Seitwärtsrollen und null Elemente über der Kante** — ein Widerspruch, der
nicht sein kann.

Die Ursache: Das seitwärts gerollte Fenster verschiebt jede
`getBoundingClientRect()`-Kante um genau den Betrag nach links, den es
aufzudecken gilt. Die Übeltäter landeten rechnerisch bei 390 px und fielen
durch das Raster. Der Prüfer hätte in dieser Form jede Seite bestanden, deren
Rumpf tatsächlich rollt — also genau die Seiten, um die es geht.

Berichtigt: **erst messen, dann rollen.** Der Kommentar an der Stelle nennt
den Befund, damit die Reihenfolge nicht wieder vertauscht wird.

Das ist wieder dieselbe Fehlerklasse wie so oft in diesem Projekt: *eine
Prüfung, die das Modell liest statt die Ausgabe* — hier eine Prüfung, die
ihre eigene Wirkung auf die Messung nicht mitgerechnet hat. Aufgefallen ist
sie nur, weil die Gegenprobe vor der Zusage kam.

## Nebenbefund: eine Zahl, die etwas anderes sagt, als sie meint

Beim Nachzählen fiel auf: `npm run pruefe-seiten` meldet „58 Seiten geprüft",
gebaut werden aber 81. Das liest sich wie eine Abdeckungslücke von 23 Seiten
und ist keine. Die 23 — darunter 13 der 14 Wissensseiten — tragen
ausschließlich Text aus `inhalte/`, der zwischen den Quelltextmarken steht
und an der Quelle von `npm run pruefe-inhalte` geprüft wird
(`grenze-vom-dokument-auf-den-absatz.md`).

Richtig, aber nicht sichtbar. Der Prüfer sagt es jetzt selbst:

```
58 Seiten, 263 Fließtextabsätze geprüft, 0 mit Verdacht.
…
Gebaut sind 81 Seiten. Die übrigen 23 tragen keinen eigenen
Absatz — ihr Text steht in inhalte/ und wird dort von `npm run pruefe-inhalte` geprüft.
```

Eine Zahl ohne ihren Bezug ist keine Abdeckung. Wer sie liest, soll nicht
nachrechnen müssen, ob 23 Seiten fehlen.

## Eingetragen

Der Zensus steht in `bin/rahmenzensus.mjs`, hängt an `npm run rahmenzensus`
und ist im Prüferprüfer als dritte Browserprobe eingetragen — mit einem
Mindestmaß von 40 Seiten. Der Grund steht dort im Kommentar: Zeigt er eines
Tages auf einen leeren Ausgabeordner, meldet er „0 von 0 Seiten", und das
sähe ohne Mindestmaß wie Grün aus. Derselbe Schutz sitzt im Werkzeug selbst:
Ein Zensus über null Seiten endet mit Code 2, nicht mit einem Haken. Und jede
einzelne Messung verlangt eine gefundene Überschrift — eine Seite, die gar
nicht geladen hat, besteht sonst mühelos.
