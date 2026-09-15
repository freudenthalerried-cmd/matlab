# Ein Suchtext, der zweimal passt

**7. September 2026.** Die Runde davor endete mit einer Fußnote: Die Gegenprobe
zum Kassenpreis meldete beim ersten Anlauf grün, weil ihr Suchtext eine Zeile
traf, die in `shopkern.js` **zweimal** steht — einmal im Suchindex, einmal im
öffentlichen Artikel. Mutiert wurde der Suchindex, der in keiner Preisausgabe
landet, und der Prüfer meldete zu Recht grün.

Diese Runde geht der Fußnote nach, denn sie betrifft nicht eine Gegenprobe,
sondern das Werkzeug.

---

## Zwei Werkzeuge, eine Regel, ein Unterschied

Es gibt zwei Wege, eine Gegenprobe auszuführen:

| Werkzeug | wer ruft es | mehrfacher Treffer |
|---|---|---|
| `bin/gegenprobe.mjs` (`npm run gegenprobe`) | ein Mensch, einzeln | bricht ab — seit dem 31. August |
| `bin/gegenprobenlauf.mjs` (`npm run gegenproben`, in `npm run alles`) | niemand, unbeaufsichtigt | ersetzte still die erste Fundstelle |

Die Regel war also längst aufgeschrieben und wurde längst durchgesetzt — nur
von dem Werkzeug, bei dem ohnehin jemand zusieht.

> **Was der Mensch von Hand ausführt, war abgesichert; was allein läuft,
> nicht.**

Dieselbe Ungleichheit wie damals bei den Signalen. Und sie wiegt hier
schwerer als dort: Der Gesamtlauf ist die Instanz, die behauptet, jeder Prüfer
habe gezeigt, dass er anschlägt. Eine Probe, deren Mutation an der falschen
Stelle landet, meldet **grün** — und liest sich wie ein Prüfer, der nicht
anschlägt, obwohl er nichts falsch gemacht hat.

---

## Gemessen: 91 ersetzende Proben

Nachgezählt wurde über das ganze Register, mit der Regel, die auch das
Einzelwerkzeug anwendet:

- **91** Einträge der Art `ersetzen` — mit der Gegenprobe dieser Runde sind es 92,
- **null** davon mehrdeutig,
- **null** mit einem Suchtext, der gar nicht mehr passt.

Der eine Fall, der es gewesen wäre, ist der aus der Vorrunde — er trägt seit
gestern den Anker eine Zeile höher. Es war also kein Bestand von Blindgängern,
sondern eine offene Tür, durch die genau einmal jemand gegangen ist. Die
Sorte, die man schließt, bevor sie ein zweites Mal auffällt.

---

## Was jetzt gilt

**Der Läufer weigert sich.** Vor der Mutation zählt er die Fundstellen. Bei
mehr als einer mutiert er nicht, sondern schreibt in den Schrittbericht, wie
oft der Suchtext vorkommt, und urteilt `mehrdeutig` — dieselbe Antwort, die
das Einzelwerkzeug gibt, nur ohne Abbruch, damit die restlichen 95 Proben
weiterlaufen.

**Der Test misst das Register in Sekunden.** `suchtextbefund` in
`src/gegenprobenregister.js` liest jede Datei einmal und hält jeden Suchtext
gegen sie. Drei Regeln: `datei-fehlt`, `suchtext-passt-nicht`,
`suchtext-mehrdeutig`. Der volle Gegenprobenlauf braucht zwanzig Minuten und
findet dasselbe erst dort; `test/gegenprobenregister.test.js` kostet
Millisekunden und mutiert nichts.

**`alle: true` bleibt die Ausnahme.** Zwei Einträge tragen die Marke, und
beide zu Recht: `flaeche-nur-im-verzeichnis` (die Herkunftsangabe steht
zweimal in `website.mjs`, eine halbe Mutation ließe die Datei zu Recht
gedeckt) und `landeseite-verschweigt-luecke`. Die zweite nennt ihre Lücke
heute nur einmal — die Marke steht dort trotzdem, weil der Satz eine
Aufzählung begleitet: Kommt eine zweite Lücke dazu, soll die Probe beide
entfernen und nicht die halbe Seite stehen lassen. Das ist jetzt an der Marke
notiert, damit die nächste Runde sie nicht für überflüssig hält.

---

## Die Gegenprobe

Sie nimmt `alle: true` bei `flaeche-nur-im-verzeichnis` weg — bei genau der
Probe, deren Suchtext zweimal in `website.mjs` steht. Der Test muss dann
melden, dass dieser Suchtext **2-mal** vorkommt.

Damit prüft die Gegenprobe die Lage, die niemandem auffiel, an dem Eintrag,
an dem sie tatsächlich vorliegt — und nicht an einem erfundenen.
