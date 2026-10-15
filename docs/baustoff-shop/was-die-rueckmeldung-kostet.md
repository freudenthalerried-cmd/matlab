# Der Shop verspricht eine Rückmeldung — gerechnet hat sie niemand

**3. September 2026.** In der Kasse steht seit dem 2. September:

> Diese Liste ist eine Anfrage, keine Bestellung. Kopieren Sie sie in eine
> Mail — wir bestätigen Preis, Verfügbarkeit und Termin.

Der Kopf von `bin/aufwand.mjs` sagt dazu:

> Die Besucherstrecke ist gemessen: fünf Schritte vom Anzeigenklick bis zum
> fertigen Anfragetext. **Was danach kommt, macht ein Mensch** — elf Schritte
> in `auftragslauf.js`.

Die elf Schritte beginnen mit **„Bestellung geht ein"**. Bestellungen gibt es
nicht: Die Kasse löst keine aus, solange kein Zahlungsanbieter angebunden ist,
und das bleibt so bis mindestens Tag 11 des Plans.

Dazwischen liegt der Zustand, in dem der Shop tatsächlich ist — und in dem er
**den ganzen 45-tägigen Klickversuch verbringen wird**. Für diesen Zustand gab
es keine Zeile.

> **Der Shop verspricht in der Kasse eine Rückmeldung, und niemand hat
> gerechnet, was sie kostet.**

## Vier Schritte, fünfzehn Minuten

| Minuten | Schritt | |
|---:|---|---|
| 3 | Anfrage lesen und den Positionen zuordnen | |
| 5 | Verfügbarkeit und Tagespreis beim Lieferanten bestätigen | **wartet auf Dritte** |
| 5 | Angebot schreiben und senden | |
| 2 | Nachfassen, wenn keine Antwort kommt | |

Die Minuten sind **gesetzt, nicht gestoppt** — es hat noch keine Anfrage
gegeben. Sie stehen einzeln in `auftragslauf.js`, jede mit ihrer Herkunft, und
die erste beantwortete Anfrage ersetzt sie.

| Anfragen im Monat | eigene Arbeit |
|---:|---:|
| 4 | 1,0 h |
| 10 | 2,5 h |
| 20 | 5,0 h |
| 40 | 10,0 h |

Die Grenze des Auftrags liegt bei 20 Stunden im Monat — „nebenbei", nicht statt
des Baugeschäfts. Der Anfragebetrieb allein reißt sie nicht; er kommt aber zu
den 17,9 Stunden hinzu, die der Auftragslauf heute kostet, sobald beides
gleichzeitig läuft.

**Wie viele Anfragen kommen, ist nicht gemessen und nicht ableitbar.** Deshalb
steht dort eine Stufentabelle und keine Prognose — dieselbe Form wie die
Quotentabelle im Rolloutplan.

## Die Zusage hängt an einer fremden Antwort

Der wichtigere Teil ist nicht die Summe, sondern die zweite Spalte. **Ein
Schritt wartet auf einen Dritten**, und er liegt mitten zwischen der Anfrage
des Kunden und der eigenen Antwort: Verfügbarkeit und Tagespreis bestätigt der
Lieferant, nicht der Shop.

Damit ist keine Antwortzeit zusagbar, solange die Antwortzeit des Lieferanten
unbekannt ist — und sie ist eine der fünf Fragen an ihn.

Das erklärt eine Lücke, die bisher wie Nachlässigkeit aussah:
`betreiber.antwortzeitWerktage` steht auf `null`, `npm run startklar` führt
„Eine Antwortzeit ist zugesagt" als offenen Punkt, und die Kasse nennt keine
Zahl. Das ist kein Vergessen, sondern die Folge einer Kette — und die Kette
stand nirgends. Jetzt steht sie in `anfrageaufwand()`, und ein Testfall hält
beides zusammen: **Solange ein Schritt auf Dritte wartet, muss
`antwortzeitWerktage` leer bleiben.**

Dieselbe Bauart wie der Befund vom 2. September („der billigste offene Punkt
sperrt das Gespräch, das neun schließt"): Zwei offene Punkte in zwei
verschiedenen Gruppen, und zwischen ihnen führte keine Linie.

## Warum das nicht bis zum Zahlungsanbieter warten kann

Der Klickversuch ist die längste Etappe des Plans und die einzige, die Geld
kostet. Was in diesen 45 Tagen entsteht, sind **Anfragen** — jede eine Mail,
die jemand beantworten muss, und jede mit einer Antwortzeit, die der Kunde
erwartet, weil die Kasse sie ihm ankündigt.

Ein Versuch, der Anfragen erzeugt und sie nicht beantwortet, misst nicht die
Kaufquote, sondern die Geduld der Anfragenden. Das wäre dieselbe Zweideutigkeit
wie die fehlende Indexierungsetappe von heute Nachmittag: zwei Befunde, die
gleich aussehen und verschiedene Ursachen haben.

## Geprüft

Vier Testfälle in `test/auftragslauf.test.js`:

1. Jeder Anfrageschritt trägt Minuten, ein `wartetAufDritte` und eine
   Herkunft von mindestens vierzig Zeichen.
2. Die eigene Arbeit je Anfrage ist die Summe der Schritte; null Anfragen
   ergeben null Stunden; eine negative Zahl bricht ab.
3. Ohne die Antwortzeit des Lieferanten ist keine zusagbar — **mit
   Gegenrichtung**: Eine Schrittliste ohne Warteschritt ergibt `zusagbar:
   true`. Ohne diese zweite Hälfte könnte das Feld fest auf `false` stehen und
   der Fall bliebe grün.
4. Die Betreiberdaten sagen keine Antwortzeit zu, solange keine zusagbar ist.

Der vierte hat beim ersten Anlauf seine einzige Zusicherung hinter ein `if`
gestellt („solange nichts zusagbar ist"), und `npm run pruefe-tests` hat ihn
sofort gemeldet: Sobald die Bedingung nicht mehr zutrifft, prüft der Fall
nichts und bleibt grün. Geprüft wird jetzt die **Folgerung** selbst — *wenn
eine Antwortzeit zugesagt ist, muss sie zusagbar sein* —, und dazu der heutige
Stand, damit die Folgerung nicht leer läuft. Beantwortet der Lieferant die
Frage, fällt der Fall und erinnert daran, dass die Zusage jetzt zu entscheiden
ist.
