# Die Liste, die noch nicht da ist

**Stand: 30. August 2026** · Neu: `shop/src/artikelliste.js`,
`shop/bin/artikelliste.mjs`, `shop/test/artikelliste.test.js`.

## Warum jetzt

Die letzten beiden Läufe haben festgestellt, dass für den Tag, auf den dieses
Vorhaben wartet, **kein Werkzeug bereitlag**:

- `npm run import` schrieb in den Platzhalterbestand des abgelösten
  Radon-Modells und hätte Einkaufspreise in ein öffentliches Verzeichnis
  getragen. Das Schreiben ist seither gesperrt.
- `npm run katalog` liest die Positionstabelle aus Rechnungen und meldete bei
  einer Artikelliste „0 Artikel". Es sagt seither, dass es das Format nicht
  kennt.

Beide sagen jetzt, was sie nicht können. **Sagen ist nicht Können.**

## Was gebaut wurde

`npm run artikelliste -- <lieferantId> <datei.csv> --stand=YYYY-MM-DD
[--schreiben] [--entfernen]`

Es liest die Liste in dem Format, um das der Auftraggeber gebeten wurde, und
schreibt die zwei Dateien, die getrennt bleiben müssen:

```
data/katalog-baustoff.json   öffentlich, ohne Preise
preise/baustoff-preise.json  lokal, gitignoriert
```

Ende zu Ende gemessen: Eine Liste mit zwei Artikeln geht durch, wird
zusammengeführt, geschrieben — und der Rechenkern liest sie anschließend mit
0,42 € Einkauf zu 0,56 € Verkauf und 8,90 € zu 11,87 €. Das sind die 25 %
Marge, und beide bleiben unter dem Listenpreis (Gate 22).

## Was es nicht entscheidet

Das ist der eigentliche Entwurf. Alles, was eine **Entscheidung** ist,
verlangt das Werkzeug, statt es zu raten:

| Angabe | Verhalten | Grund |
|---|---|---|
| **Warengruppe** | muss eine der sieben sein, sonst Fehler | Am 29.08. gemessen: Ein Regelwerk erkannte **0 von 16** Gruppen aus der Bezeichnung. Ein Artikel ohne gültige Gruppe steht auf keiner Seite |
| **Preisstand** | `--stand` ist Pflicht, `YYYY-MM-DD` | Die Liste trägt kein Datum je Zeile, und ein Preis ohne Stand verstößt gegen die eigene Regel |
| **Einheit** | muss ein bekanntes Kürzel sein | Der Gebindeteil rechnet danach; ein unbekanntes ergäbe stillschweigend falsche Mengen |
| **Sperrgut** | aus der Liste, wenn sie es sagt; sonst nach Gruppe geschätzt — mit `sperrgutQuelle` daneben | Niemand soll eine Einschätzung für eine Lieferantenangabe halten |
| **Wegfall** | wird gemeldet, entfernt wird nur mit `--entfernen` | Eine Liste kann das ganze Sortiment sein oder eine Ergänzung; das sieht man ihr nicht an |
| **GTIN** | wird übernommen, wenn vorhanden; sonst Warnung | Ohne sie bleibt der Produktfeed nicht einreichbar — das ist eine Tatsache, keine Sperre |

„Kein Fehler, sondern eine Warnung" gilt nur dort, wo der Shop ohne die
Angabe **funktioniert**. Gruppe, Einheit und Stand gehören nicht dazu.

## Die Sperren, die mitgekommen sind

Aus den Vorfällen der letzten Stunden, ohne dass sie hier noch einmal
passieren mussten:

- **Beide Ziele oder keines.** Wer `KATALOG_ZIEL` umlenkt und
  `KATALOG_PREISE_ZIEL` vergisst, schreibt die Konditionen in den Bestand.
  Genau das ist mir am Mittag passiert; das Werkzeug bricht ab.
- **Kein Schreiben ohne Ware.** Null gelesene Artikel heißt Abbruch, nicht
  „geschrieben: 0 Artikel".
- **Sicherung vor dem Überschreiben.** Beide Ausgaben bekommen eine datierte
  Kopie, wie seit einer Stunde auch der Katalogerzeuger.

## Die Proben

Dreizehn Testfälle, davon vier auf dem Werkzeug selbst. Drei Gegenproben:

| Eingriff | Ergebnis |
|---|---|
| Gruppenprüfung abgeschaltet | zwei Proben fallen |
| `ekNetto` in den öffentlichen Katalogsatz gelegt | zwei Proben fallen, darunter die am geschriebenen Bestand |
| Wegfall immer entfernt | die Zusammenführungsprobe fällt |

Die zweite ist die wichtigste: Sie prüft nicht die Absicht, sondern die
**Datei** — „steht `0.42` im geschriebenen Katalog?". Eine Trennung, die nur
im Kopf des Erzeugers besteht, ist keine.

## Was am Liefertag trotzdem zu tun bleibt

Das Werkzeug macht aus einer Liste einen Katalog. Es macht daraus **keinen
Shop**:

1. **Die Warengruppen müssen in der Liste stehen.** Stehen sie nicht drin —
   und das ist wahrscheinlich, denn der Lieferant gliedert nach seinen
   eigenen Sparten —, ist die Zuordnung von Hand zu treffen. Für ~20
   Sparten des Lieferanten auf sieben Warengruppen ist das eine Tabelle, für
   hunderte Artikel einzeln wäre es ein Tag Arbeit. Der Weg über die Sparten
   steht seit dem 29.08. als Empfehlung.
2. **Die Bilder.** Jede Zeichnung entsteht aus den Maßen der Bezeichnung; bei
   neuen Artikeln ist zu prüfen, ob das Maß erkannt wurde.
3. **Danach:** `npm run website && npm run pruefe-preise` — das Werkzeug
   schreibt es selbst ans Ende seines Berichts.

## Eine Einschränkung, die bleibt

Der Zusammenführungsteil vergleicht Artikel über `JSON.stringify`. Das ist
grob: Eine geänderte Feldreihenfolge gälte als Änderung. Für den Bericht
(„Geändert: 3") reicht es, für eine Aussage darüber, **was** sich geändert
hat, nicht. Solange die Liste vom selben Erzeuger kommt, ist die Reihenfolge
stabil; wenn nicht, ist der Vergleich feldweise nachzuziehen.
