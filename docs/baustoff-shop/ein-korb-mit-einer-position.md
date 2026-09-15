# Ein Korb mit einer Position

**6. September 2026, mittags.** Über `WARENKOERBE` in `bin/kampagne.mjs` steht
seit dem 1. September, wozu es sie gibt:

> *„Die großen Belege bestehen aus acht bis zwölf Positionen, nicht aus einer
> teuren. Wer je Artikel bietet, bietet auf den Ein-Sack-Kunden — und der ist
> bei keinem Klickpreis bezahlbar. **Gerechnet wird deshalb auf die Bestellung,
> die eine Suche tatsächlich auslöst.**"*

Direkt darunter stand:

```js
'Dämmung': {
  umfang: '100 m²',
  positionen: [{ sku: 'POS-12575', menge: 100, was: 'Perimeterdämmung XPS 80 mm' }],
},
```

**Eine Position.**

---

## Gezählt gegen die eigenen Systemlisten

Jede Anzeigengruppe hat eine Systemliste, und die sagt, aus welchen Positionen
das Bauteil besteht und welche davon der Shop führt:

| Gruppe | Positionen | davon geführt | im Korb |
|---|---|---|---|
| WDVS | 10 | 9 | **5** |
| Kamin | 10 | 9 | **5** |
| Kanal | 8 | 5 | **4** |
| Dämmung | 7 | 4 | **1** |

> **Die Regel steht über der Liste, und die Liste hält sie nicht.**

Die Kellerwand-Liste nennt vier geführte Positionen — Perimeterplatte, Kleber,
Dosierpistole und Grundmauerschutzbahn — und schreibt zu zweien davon die Menge
selbst hin: *„eine je Baustelle"*, *„Fläche + Überlappung"*. Im Korb lag die
Platte allein.

---

## Wohin der Fehler zeigt

Der Deckungsbeitrag des Korbs trägt das Gebot. Ein zu kleiner Korb ergibt ein
zu kleines Gebot:

> **Verlorene Auktionen, nicht verbranntes Geld.** Das fällt in keiner
> Abrechnung auf.

Dieselbe stille Richtung wie beim Ausschluss, der gestern das Verkaufsargument
traf. Nach dem Nachtragen der Positionen, die die Systemlisten selbst
beziffern:

| Gruppe | Gebot vorher | nach dem Nachtragen | nach dem Preisalter |
|---|---|---|---|
| Kamin | 8,22 € | **9,41 €** | **9,41 €** |
| Dämmung | 5,91 € | 6,73 € | **5,91 €** |
| WDVS | 4,19 € | 4,19 € | 4,19 € |
| Kanal | 1,38 € | 1,38 € | 1,38 € |

**Kamin hat 14 % unter dem geboten, was seine eigene Systemliste hergibt.** Bei
Dämmung stand dieselbe Erhöhung da — und ist im selben Lauf wieder gefallen.
Warum, steht unten.

Und eine Stufe schärfer: Drei Gruppen sind **zurückgestellt**, weil ihr
Deckungsbeitrag 125 € Werbekosten je Verkauf nicht trägt. Diese Entscheidung
ist auf demselben Korb gerechnet. Kanal bleibt auch nach der Prüfung
zurückgestellt — seine einzige fehlende Position ist auf der eigenen Liste als
fremdes Gewerk gekennzeichnet.

---

## Und dann wurde ein zweiter Prüfer rot

Im Gesamtlauf, unmittelbar danach:

```
✗ pruefe-preisalter
  POS-12294  Prima Dosierpistole Metall Lite
      137 Tage alt (Grenze 90) — und auf diesen Preis ruht ein Gebot
  POS-21382  Grundmauerschutz 20 1,5 m
      103 Tage alt (Grenze 90) — und auf diesen Preis ruht ein Gebot
```

Beide Artikel hatte **ich** eine Stunde vorher in den Korb gelegt. Sie standen
bis dahin unter „über der Grenze, aber ohne Gebot darauf — nachfragen, nicht
sperren". Mit dem vollständigeren Korb ruht ein Gebot darauf, und dieselbe
Regel, die sie vorher durchgehen ließ, sperrt sie jetzt.

> **Zwei richtige Regeln, die sich treffen — und die vorsichtige gewinnt.** Ein
> zu kleiner Korb kostet Auktionen; ein Korb auf einer alten Marge setzt Geld
> auf eine Zahl von vorgestern.

`pruefe-preisalter` nennt selbst die beiden Auswege und den falschen:

> *„Den Preis beim Lieferanten nachziehen, oder den Artikel aus dem
> Referenzwarenkorb nehmen. Der falsche wäre, die Grenze hochzusetzen."*

Der erste braucht den Lieferanten und ist freigabepflichtig. Also der zweite —
**aber diesmal mit Grund im Korb**, und das ist der Unterschied zum Zustand von
heute früh: Damals fehlten die Positionen, weil niemand daran gedacht hatte.
Jetzt fehlen sie, weil eine Regel es verlangt, und der Korb sagt es. Sie kommen
zurück, sobald der Preis nachgezogen ist.

**Der Korb der Gruppe „Dämmung" trägt damit weiter eine von vier Positionen** —
und das ist jetzt eine Aussage über den Preisstand und nicht mehr über die
Sorgfalt.

---

## Was nachgetragen wurde und was nicht

**Nachgetragen ist nur, was die Systemliste selbst beziffert:**

| Gruppe | Position | Menge | Quelle |
|---|---|---|---|
| Kamin | Thermo-Trennstein | 1 | „1 je Zug, am Kopf" |
| ~~Dämmung~~ | ~~Grundmauerschutzbahn~~ | ~~110 m²~~ | *wieder heraus, 103 Tage* |
| ~~Dämmung~~ | ~~Dosierpistole~~ | ~~1~~ | *wieder heraus, 137 Tage* |

**Elf Positionen bleiben draußen, jede mit Grund im Korb selbst.** Die Gründe
haben zwei Formen, und beide sind dieselbe:

- **Menge hängt an einem Verbrauchswert**, der im Merkblatt des Herstellers
  steht und nicht im Katalog — Armierungsmörtel, Oberputz, Perimeterkleber.
  Dieser Shop schreibt technische Kennwerte nicht ab.
- **Menge hängt am Bauwerk**, das der Korb nicht kennt —
  Gewebeanschlussleisten (Fenster und Türen), Dünnbettmörtel und Fugenmasse
  (Gesamthöhe des Zuges).

Dazu zwei Bedingungen statt Mengen: Rondellen *„bei versenkter Setzung"*,
Zuluftplatte *„nur raumluftunabhängig"*.

> **Eine geratene Menge im Korb ergäbe ein geratenes Gebot.**

---

## Der Prüfer

`npm run pruefe-koerbe`, einunddreißigster Prüfer. Jede Korbzeile nennt seither
ihre Position in der Systemliste, und er hält beides gegeneinander — **in beide
Richtungen**:

- Jede geführte Position liegt im Korb oder trägt einen tragfähigen Grund.
- Keine Korbposition steht in der Systemliste nicht.
- Kein Grund steht für etwas, das im Korb liegt.
- Eine Systemliste ohne Korb ist ein Fund und kein stilles Bestehen.

Gegenprobe `korb-ohne-die-halbe-bestellung` nimmt eine Position wieder heraus.
**Auch sie musste eine Stunde nach ihrem Eintrag nachgezogen werden:** Ihr
Suchtext war die Zeile der Dosierpistole — und die ist im selben Lauf aus dem
Korb gefallen. *Eine Gegenprobe, deren Mutation nicht mehr ankommt, prüft
nichts;* der Gegenprobenlauf hat es gemeldet, wie schon am 5. September.
Mutiert wird jetzt der Thermo-Trennstein, der aus demselben Grund drinbleiben
durfte, aus dem die anderen beiden gehen mussten: 73 Tage statt 103 und 137.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | `pruefe-koerbe` (31 ohne Browser) |
| Neue Gegenproben | `korb-ohne-die-halbe-bestellung` |
| Neue Testfälle | 8 (`test/warenkorbdeckung.test.js`) |
| Geänderte Gebote | Kamin +14 % (8,22 → 9,41 €); Dämmung unverändert, siehe Preisalter |
| Neue Gates | keine — Gate 15 unverändert, es rechnet auf einem vollständigeren Korb |

## Was offen bleibt

- **Zwei Preise sind zu alt für ein Gebot.** Grundmauerschutz (103 Tage) und
  Dosierpistole (137) liegen mit Grund außerhalb des Korbs. Der richtige Ausweg
  ist der Preis, nicht der Korb — und der braucht den Lieferanten. **Das Gebot
  der Gruppe „Dämmung" ist so lange zu niedrig, und zwar wissentlich.**
- **Die Verbrauchswerte** (Kleber, Armierung, Oberputz, Perimeterkleber) sind
  der Grund, aus dem vier Positionen draußen bleiben. Sie stehen in den
  Herstellermerkblättern; die sind aus dieser Umgebung gesperrt und stehen als
  offener Punkt in der PR-Beschreibung. **Mit ihnen würden die Gebote weiter
  steigen** — die heutige Zahl ist die untere.
- **„Mörtel" und „Mauerwerk" haben keine Systemliste**, also auch keine
  Deckungsprüfung. Sie sind zurückgestellt; ob ihr Ein-Positionen-Korb den
  Rückstellungsbeschluss trägt, ist damit **nicht** geprüft. Der ehrliche Weg
  wäre eine Systemliste für beide — das ist eine Inhaltsarbeit und keine
  Prüferarbeit.
- **Die Gebietsfrage an den Lieferanten** und die sieben Punkte in
  `npm run startklar` — alle beim Auftraggeber.
