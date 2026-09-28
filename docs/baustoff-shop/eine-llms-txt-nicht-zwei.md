# Eine `llms.txt`, nicht zwei

**Stand: 30. August 2026** · Befund und Behebung aus einem Lauf des
Arbeitsloops. Betroffen: `shop/bin/veroeffentlichung.mjs`,
`shop/src/maschinenlesbar.js`, `shop/test/veroeffentlichung.test.js`.

## Der Befund

Gestern stand hier der Satz, `robots.txt` sei an zwei Stellen entstanden und
der kürzere Weg habe gewonnen. Die Behebung schaltete `robots.txt` auf eine
Quelle um. Dieselbe Frage an die Nachbardatei zu stellen, lag nahe — und
`llms.txt` hatte denselben Fehler, nur mit umgekehrtem Vorzeichen.

Zwei Erzeuger:

| Wer | Was dabei herauskam |
|---|---|
| `bin/website.mjs` (der Bau) | 15.687 Bytes, 113 Zeilen, sieben Abschnitte, 46 Artikelzeilen |
| `bin/veroeffentlichung.mjs` | **149 Bytes, 8 Zeilen** — Name, ein Satz, Liefergebiet, Nettohinweis |

Die kurze Fassung war kein Rest und kein Entwurf: Sie rief dieselbe Funktion
`llmsTxt()` auf, aber mit `seiten: []`. Also ohne Artikelliste, ohne „Was hier
möglich ist", ohne „Was wir nicht führen" — genau die drei Abschnitte, für die
dieser Shop überhaupt gebaut wird. Eine Datei, deren einziger Zweck es ist,
einem Sprachmodell zu sagen, was es hier gibt, hätte in der veröffentlichten
Fassung nichts davon gesagt.

Bei `robots.txt` war gestern die Fassung des Veröffentlichungswerkzeugs die
richtige und die ausgelieferte die falsche. Bei `llms.txt` ist es umgekehrt.
Das ist der eigentliche Punkt: **Welche der beiden Fassungen gerade besser
ist, ist Zufall. Dass es zwei gibt, ist der Fehler.**

## Die Entscheidung

Veröffentlicht wird, was der Bau erzeugt — nicht eine zweite Fassung davon.

Der Grund ist nicht Ästhetik, sondern Prüfbarkeit. Alle Prüfer dieses
Projekts messen `ausgabe/site/`: `pruefe-seiten`, `pruefe-inhalte`,
`pruefe-preise`, `rahmenzensus`, `pruefe-geheimnis`. Was das
Veröffentlichungswerkzeug daneben selbst erzeugte, hat nie ein Prüfer
angesehen. Eine Datei, die niemand misst, geht irgendwann falsch hinaus, ohne
dass es auffällt — hier war es die Artikelliste, morgen wäre es der Preis.

Umgesetzt in drei Schritten:

1. `bin/veroeffentlichung.mjs` liest `ausgabe/site/robots.txt` und
   `ausgabe/site/llms.txt` und legt sie unverändert in das Veröffentlichungs-
   verzeichnis.
2. Fehlt eine der beiden Dateien, **bricht das Werkzeug ab** (Ausgang 2) mit
   dem Hinweis `zuerst npm run website`. Es erfindet keinen Ersatz. Ein
   Werkzeug, das bei fehlender Vorarbeit still eine Notfassung schreibt, ist
   der Fehler von heute in neuer Verpackung.
3. `llmsTxt()` ist aus `src/maschinenlesbar.js` gelöscht. Eine Funktion, die
   niemand mehr aufruft, ist eine Einladung, sie wieder aufzurufen.

## Die drei Zusicherungen sind nicht verschwunden

An `llmsTxt()` hingen drei Testfälle. Sie mit der Funktion zu löschen, wäre
bequem und falsch gewesen — geprüft wurde ja etwas Richtiges, nur am falschen
Gegenstand. Sie zeigen jetzt auf die **ausgelieferte** Datei:

- Die erste Zeile ist eine Überschrift, das Liefergebiet steht drin, und der
  Satz zu den Nettopreisen für Unternehmer auch.
- Jede Artikelzeile ist genau **eine** Zeile und beginnt mit `- [`. Diese
  Zusicherung ist die wichtigere von beiden: Ein Zeilenumbruch aus einem
  Artikelnamen würde die Gliederung sprengen, und die Namen kommen aus einer
  fremden Preisliste. Geprüft an 46 Zeilen statt an einem erfundenen Beispiel.
- Fehlt der Bau, sagen beide Tests nichts — statt etwas Falsches. Ein Test,
  der ohne Vorarbeit grün wird, weil er nichts findet, ist schlimmer als
  keiner.

Dazu ein vierter: *das Werkzeug erfindet keine zweite Fassung der
ausgelieferten Dateien.*

## Die Grenze dieser Probe

Sie steht so auch im Testfall selbst, damit der nächste Lauf sie nicht für
mehr hält, als sie ist:

> Sie liest den Quelltext, nicht das Ergebnis.

Schöner wäre, das Werkzeug schreiben zu lassen und die geschriebenen Dateien
zu vergleichen. Das ist gesperrt: `--schreiben` bricht ab, solange bei 43 von
46 Artikeln die GTIN fehlt — die Feedsperre, die genau dafür da ist. Bis der
Auftraggeber die Artikelkennungen liefert, ist „liest das Werkzeug die gebaute
Datei?" die einzige Frage, die sich beantworten lässt.

Der erste Wurf dieser Probe prüfte nur, dass die alten Aufrufe `llmsTxt(` und
`robotsTxt(` nicht mehr im Quelltext stehen. Die Gegenprobe — Aufruf wieder
einsetzen, ohne das Lesen zu entfernen — hätte ihn überlebt: Ein Werkzeug, das
beides täte, wäre durchgekommen. Die Probe verlangt jetzt zusätzlich, dass für
**beide** Namen ein `readFileSync(join(gebaut, …))` dasteht und dass die
Abbruchprüfung über beide Namen läuft. Der zweite Wurf fiel dann zunächst um,
weil die Abbruchmeldung eine Vorlage ist und der gesuchte Text im Quelltext
`ausgabe/site/${datei} fehlt` lautet, nicht `ausgabe/site/llms.txt fehlt`.

## Was das für den Liefertag heißt

Nichts, was aufhält — aber eine Reihenfolge: `npm run website` steht **vor**
`npm run veroeffentlichung`. Vorher war die Reihenfolge gleichgültig, weil das
zweite Werkzeug sich selbst behalf. Genau diese Gleichgültigkeit war der
Fehler; sie ist jetzt eine Abbruchbedingung.

## Wiederkehrendes Muster

„Zwei Wege zur selben Ausgabe, und der kürzere gewinnt" — fünfter Fall in vier
Tagen (Fracht und Deckungsbeitrag, Preis an vier Stellen, Verfügbarkeit,
`robots.txt`, jetzt `llms.txt`). Der Weg, ihn zu finden, ist inzwischen
mechanisch: Von jeder ausgelieferten Datei fragen, wer sie erzeugt, und wenn
die Antwort mehr als einen Namen enthält, ist der Befund schon da.

Offen bleibt dieselbe Frage für den Katalogfeed: `katalogFeed()` hat heute nur
einen Aufrufer, aber die Artikeldaten darin entstehen an anderer Stelle als
die der Artikelseiten. `npm run pruefe-preise` hält vier Ausgaben gegeneinander
— den Feed noch nicht, weil er ungeschrieben bleibt. Am Tag der GTINs ist das
die erste Prüfung, die nachzuziehen ist.
