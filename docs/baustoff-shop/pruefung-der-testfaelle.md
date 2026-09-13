# Prüfung der eigenen Testfälle

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Werkzeug: `shop/bin/testpruefung.mjs`.

Beim Bau der Rückwärtsrechnung ist ein Testfall aufgefallen, der grün lief und
nichts prüfte: Seine Behauptung stand hinter einem `if`, das wegen eines
falschen Gruppennamens nie zutraf. Bei 213 Testfällen ist die Frage, wie viele
weitere sich so verstecken, nicht durch Lesen zu beantworten.

## Was geprüft wird

Drei Muster gelten als verdächtig:

1. **Ein Testfall ohne jede Zusicherung** — läuft grün, behauptet nichts.
2. **Alle Zusicherungen innerhalb eines `if`** — trifft die Bedingung nie zu,
   prüft der Fall nichts. Das war der Fall, der den Anlass gab.
3. **Eine Schleife über eine Liste ohne vorherige Längenzusicherung** — ist die
   Liste leer, läuft der Rumpf nie. Das ist die häufigste Form, und sie sieht
   besonders harmlos aus.

Der Prüfer versteht kein JavaScript. Er zählt Klammern und sucht Muster; was er
meldet, ist ein **Verdacht, kein Urteil**. Ein Werkzeug, das Urteile fällt,
führt nur dazu, dass man es ruhigstellt.

**Nachgewiesen, nicht behauptet:** Der Prüfer nimmt einen Ordner als Argument.
Gegen eine Probedatei mit allen drei Mustern findet er alle drei und lässt die
begründete Ausnahme in Ruhe. Ohne diesen Nachweis wäre der Prüfer selbst ein
Testfall, der nichts prüft — genau der Fehler, den er finden soll.

## Das Ergebnis

**Von 213 Testfällen waren 14 verdächtig.** Nach Abzug der Fehlalarme blieben
elf, alle aus der dritten Kategorie:

| Kategorie | Treffer |
|---|---|
| ohne Zusicherung | **0** |
| alles hinter einem `if` | **0** |
| Schleife ohne Längenzusicherung | 11 |
| Fehlalarm (Schleife über ein Literal) | 3 |

Die schlimmste Kategorie war ein Einzelfall — der bereits behobene. Das ist die
gute Nachricht.

Die elf übrigen sind entschärft, indem vor jeder Schleife zugesichert wird, dass
sie überhaupt läuft. Zwei Beispiele:

```
assert.ok(korb.teillieferungen.length >= 2,
          'sonst prüft die Schleife keinen zweiten Lieferanten');

assert.ok(lauf.protokoll.some((p) => p.stand !== 'automatisch'),
          'sonst prüft die Schleife nichts');
```

Beim zweiten ist die Zusicherung mehr als eine Formalie: Der Testfall
überspringt automatische Schritte mit `continue`. Wären alle Schritte
automatisch, liefe die Schleife zwar, prüfte aber trotzdem nichts. Eine
Längenzusicherung allein hätte das nicht gefunden.

## Die Ausnahme, die stehen bleibt

Ein Treffer ist **begründet abgelehnt**. In `auftragslauf.test.js` läuft eine
Schleife über `s.braucht` — die Voraussetzungen eines Arbeitsschritts. Drei der
zehn Schritte haben keine: Bestellungseingang, Datenprüfung und die Lieferung
selbst brauchen nichts aus der Welt. Eine Längenzusicherung wäre dort schlicht
falsch.

Stattdessen steht dort eine Zusicherung über alle Schritte zusammen:

```
assert.ok(SCHRITTE.some((s) => s.braucht.length > 0),
          'kein Schritt verlangt irgendetwas');
```

Der Prüfer akzeptiert die Ablehnung, wenn im Testfall die Zeile
`// pruefung: begruendet` samt Grund steht. Das ist Absicht: **Eine Ausnahme,
die man aufschreiben muss, wird seltener aus Bequemlichkeit gemacht als eine,
die man wegkonfiguriert.**

Heute steht dieser Vermerk genau einmal im ganzen Bestand.

## Was das über die Testfälle sagt

Zwei Dinge, und das zweite ist unangenehmer.

**Erstens:** Die Testfälle sind besser, als der Anlass befürchten ließ. Kein
einziger behauptet gar nichts, und der eine versteckte war ein Ausrutscher, kein
Muster.

**Zweitens:** Elf Schleifen liefen ungesichert, und keine davon wäre beim Lesen
aufgefallen. `for (const l of daten.lieferanten.lieferanten)` sieht richtig aus
und ist es auch — solange die Datei drei Lieferanten enthält. Verschwänden sie,
bliebe der Testfall grün und meldete, jeder Lieferant trage ein Land.

Das ist die eigentliche Lehre: **Grüne Tests sind eine Aussage über die
Testfälle, nicht über den Code.** Dasselbe hat schon die Namenskollision
gezeigt, bei der 155 Testfälle grün blieben, während `demo.html` gar nicht
startete. Beide Male half nicht mehr Sorgfalt, sondern ein Werkzeug, das die
Sorgfalt nicht braucht.

## Kein Gate, aber eine Gewohnheit

Der Prüfer läuft nicht automatisch bei `npm test`. Das ist eine Entscheidung:
Er meldet Verdachtsfälle, und ein Verdacht, der den Testlauf rot färbt, wird
binnen einer Woche stumpf gemacht. Er gehört von Hand aufgerufen, wenn
Testfälle dazukommen:

```
npm run pruefe-tests
```

Der Aufruf steht jetzt in `package.json` und in der README des Shops.
