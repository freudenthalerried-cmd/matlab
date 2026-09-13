# Die eine Seite, die keine Maschine lesen konnte

**2. September 2026, spät.** Der Auftraggeber hat am 25. August verlangt, den
Shop für KI-Suchen zu optimieren. Was der Bau dafür trägt, ist gut belegt:
`Organization` auf der Startseite, `Product` auf jeder Artikelseite,
`Article` und `FAQPage` auf jeder Wissens-, System- und Gruppenseite,
`llms.txt` mit dem ganzen Sortiment.

Eine Seite trug nichts:

| Seite | Auszeichnung |
|---|---|
| `index.html` | Organization |
| `artikel/*.html` | Product |
| `wissen/*`, `system/*`, `gruppe/*` | Article + FAQPage |
| **`lieferung.html`** | **keine** |

Ausgerechnet die Seite mit den **Frachtsätzen** und dem **Liefergebiet** —
also den beiden Auskünften, nach denen ein Kaufinteressent zuerst fragt und
die ein Assistent als Erstes braucht: „Liefert ihr nach Perg?" und „Was kostet
die Zustellung?"

## Fünf Fragen, aus denselben Zahlen

Die Lieferseite trägt jetzt eine `FAQPage` mit den Fragen, die tatsächlich
gestellt werden. Die Antworten entstehen aus **denselben Werten** wie die
Preistafel darüber; eine zweite Fassung wäre eine zweite Wahrheit.

Was nicht dabei ist, ist der eigentliche Punkt: **keine Frage nach der
Lieferzeit.** Sie ist unbekannt, und eine erfundene Frist in einer
maschinenlesbaren Auszeichnung wäre schlimmer als in der Prosa — sie wird
zitiert und nicht gelesen. Eine Probe hält das fest.

## Was ich nicht ausgezeichnet habe, und warum

`shippingDetails` am einzelnen Angebot wäre naheliegend gewesen. Es ist
falsch: **Die Fracht fällt je Lieferung an, nicht je Artikel.** Eine
Auszeichnung „Versand 75,50 €" an jedem der 46 Artikel sagt für eine
Bestellung mit drei Positionen das Dreifache dessen, was der Warenkorb
verlangt. Für die Ein-Artikel-Bestellung wäre sie richtig, für jede andere zu
hoch — und eine Angabe, die in die teure Richtung falsch ist, ist kein
Kavaliersdelikt, wenn ein Assistent sie zitiert.

Schema.org kennt keine saubere Kennzeichnung „einmal je Auftrag". Also steht
die Auskunft dort, wo sie hingehört: auf der Lieferseite, als Satz, mit dem
Zusatz „je Lieferung und nicht je Artikel".

Ebenfalls nicht ausgezeichnet: eine Rücknahmeregel. Punkt 11 der AGB
(„Rücknahme angebrochener Gebinde und Rollenware") ist eine Gliederungszeile
mit dem Vermerk „Ausschluss empfehlenswert" — entschieden ist nichts. Eine
`hasMerchantReturnPolicy` wäre hier eine erfundene Zusage.

## Die zweite Frage: wer bewacht die Auszeichnung?

Beim Nachtragen fiel auf, dass **niemand** prüft, ob eine ausgezeichnete
Antwort dasselbe sagt wie die Seite.

> **Eine Auszeichnung, die mehr sagt als die Seite, ist eine Behauptung an
> eine Maschine.**

Dieselbe Familie wie `PreOrder` gegen `InStock` am 28. August und
„Kranentladung" gegen „Sperrgutzuschlag" von heute Abend: Beide Seiten stimmen
für sich, und der Widerspruch fällt beim Kunden auf.

`pruefe-seiten` hält jetzt jede **Zahl mit Einheit** einer ausgezeichneten
Antwort gegen den sichtbaren Text derselben Seite — 29 Antworten. Der Wortlaut
darf abweichen; die Sätze sind für verschiedene Leser geschrieben. Blanke
Zahlen bleiben außen vor: „2" steht auf jeder Seite, „7,50 €" nicht.

## Und der Befund, der dabei herausfiel

Die Gegenprobe dazu schlug nicht an. Der Prüfer **meldete** die eingesetzte
Zahl — und der Lauf blieb grün.

```js
  process.exit(0);   // ← ohne Bedingung
```

`pruefe-seiten` liest 81 gebaute Seiten, zählt die Absätze mit Verdacht,
druckt die Zahl und endete **immer** mit Null. Seit es diesen Modus gibt.

> **Ein Prüfer, der nicht rot werden kann, ist ein Bericht.**

Am 1. September stand derselbe Fehler in `pruefe-inhalte`, `pruefe-quellen`
und `pruefe-tests` und wurde dort behoben. Dieser Modus war übersehen worden —
und es ist nicht beim Lesen aufgefallen, sondern weil eine Gegenprobe
scheiterte, die etwas ganz anderes prüfen wollte.

Damit bekommt `pruefe-seiten` auch seine Gegenprobe zurück. Sie war am
1. September **zurückgezogen** worden, mit der Begründung, drei Mutationen
seien nicht angekommen und ein Prüfer dürfe dafür nicht beschuldigt werden.
Die Begründung war richtig und die Diagnose falsch: Die Mutationen kamen an,
der Prüfer meldete sie, und der Lauf endete grün.

## Stand

| | |
|---|---|
| Seiten mit maschinenlesbarer Auszeichnung | 81 von 81 |
| ausgezeichnete Antworten, gegen die Seite gehalten | 29 |
| Prüfer ohne Gegenprobe | 6 (vorher 7) |
| Tests | 1270 |
| Gegenproben, die anschlagen | 25 von 25 |
