# Die Startseite sprang ins Leere

**Stand: 30. August 2026** · Zwei Befunde aus einem Zensus über alle 81
gebauten Seiten. Betroffen: `shop/bin/website.mjs`,
`shop/test/website.test.js`.

## Erster Befund: ein Sprungverweis ohne Ziel

Gestern kam an jede Seite ein „Zum Inhalt springen" — der Verweis, mit dem
jemand, der mit der Tastatur bedient, die Kopfleiste überspringt. Gezählt
wurde, dass er da ist. Nicht gezählt wurde, ob er irgendwo hinführt:

> **80 von 81 Seiten hatten ein Ziel. Die Startseite nicht.**

Die Ursache steht in einer Zeile:

```js
koerper.replace('<p class="krume">', '<div id="inhalt" …></div><p class="krume">')
```

Der Anker wurde vor die Brotkrume gesetzt. Jede Seite hat eine Brotkrume —
außer der Startseite, denn von der Startseite führt kein Weg zurück. Also
kein Ersatz, kein Fehler, keine Meldung: `replace` ohne Treffer gibt den
Text unverändert zurück. Die eine Seite, die jeder Besucher zuerst sieht,
war die einzige, auf der die gestrige Verbesserung nichts tat.

Das ist dieselbe Fehlerklasse wie schon dreimal in dieser Woche: **eine
Regel, die auf die Mehrheit passt, und eine Ausnahme, die niemand zählt.**
Neun ausgesuchte Seiten hätten neunmal grün gemeldet.

### Der zweite Anlauf war auch falsch

Die erste Behebung setzte den Anker bei fehlender Brotkrume an den Anfang
des Körpers. Damit gab es ein Ziel — vor dem Sprungverweis selbst. Der
Sprung übersprang also nichts: Kopfleiste, Suchfeld und Menü blieben
dahinter, und der Verweis behauptete trotzdem, sie zu überspringen.

Der Anker gehört hinter `</header>`. Das ist auf allen 81 Seiten dieselbe
Stelle, mit und ohne Brotkrume, und braucht keine Fallunterscheidung. Fehlt
die Kopfleiste, bricht der Bau ab, statt zu raten.

Geprüft wird deshalb jetzt die **Reihenfolge**, nicht die Existenz:
Sprungverweis vor `</header>` vor Anker, auf jeder gebauten Seite.

## Zweiter Befund: drei Seiten mit nichts darauf

Derselbe Zensus, andere Frage: Wie viel eigenen Inhalt trägt jede Seite —
ohne Kopfleiste, Brotkrume und Fußzeile, und ohne JavaScript?

| Seite | eigener Inhalt |
|---|---|
| `warenkorb.html` | **43 Zeichen** — „Warenkorb. Der Warenkorb braucht JavaScript." |
| `kasse.html` | **53** |
| `suche.html` | **214** |
| die nächstdünnere Seite | 1.173 |
| Median der übrigen 78 | 3.334 |

Zwischen 214 und 1.173 liegt kein Übergang, sondern eine Kante. Und alle
drei standen in der `sitemap.xml`.

Eine Sitemap ist keine Inhaltsangabe, sondern eine Behauptung: *Diese Seiten
lohnen die Aufnahme.* Für einen Warenkorb, der je Besucher anders aussieht
und ohne Skript leer ist, stimmt sie nicht — und sie stimmt am wenigsten für
den Zweck, für den dieser Shop gebaut wird: Ein Sprachmodell, das der Sitemap
folgt, holt sich dreimal eine Seite, die ihm nichts sagt.

Die drei tragen jetzt `<meta name="robots" content="noindex,follow">` und
stehen nicht mehr in der Sitemap: 78 statt 81 Einträge. `follow`, nicht bloß
`noindex` — die Verweise auf diesen Seiten sollen weiterverfolgt werden, nur
die Seite selbst gehört nicht in den Index.

## Was die Proben jetzt festhalten

Drei Zusicherungen, alle als Zensus über die gebauten Seiten, keine
Stichprobe:

| Zusicherung | Gegenprobe |
|---|---|
| Jede gebaute Seite steht in der Sitemap **oder** trägt `noindex` | Bedienseiten wieder aufgenommen → fällt |
| Keine Seite mit eigenem Inhalt trägt `noindex` | `noindex` entfernt → fällt |
| Der Sprungverweis hat auf jeder Seite ein Ziel hinter der Kopfleiste | alte Ersetzung wiederhergestellt → fällt |

Die zweite ist die wichtigere von den ersten beiden, obwohl sie den
harmloseren Fall beschreibt. Eine Seite, die versehentlich in der Sitemap
steht, kostet einen Crawler einen Abruf. Ein `noindex` an der falschen Seite
nimmt sie aus **jeder** Suche — still, ohne Fehlermeldung, auf unbestimmte
Zeit. Deshalb steht die Grenze in beide Richtungen: unter 500 Zeichen gehört
`noindex` hin, ab 500 Zeichen darf keines stehen.

Und die Ausnahmeliste ist namentlich festgeschrieben (`kasse`, `suche`,
`warenkorb`). Wächst sie, fällt der Test — eine vierte Seite ohne Inhalt ist
ein Befund, keine Konfiguration.

## Was offen bleibt

Die 500-Zeichen-Grenze ist an der gemessenen Kante gezogen, nicht an einer
Norm. Sie hält, solange zwischen der dünnsten Inhaltsseite (1.173) und der
dicksten Bedienseite (214) so viel Platz ist. Rückt eine echte Seite darunter,
ist die Grenze nachzumessen und nicht zu verschieben: Eine Inhaltsseite mit
400 Zeichen ist selbst der Befund.
