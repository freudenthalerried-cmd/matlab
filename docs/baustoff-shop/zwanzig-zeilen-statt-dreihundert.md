# Zwanzig Zeilen statt dreihundert

**Stand: 30. August 2026** · Der offene Punkt des vorigen Laufs, umgesetzt.
Betroffen: `shop/src/artikelliste.js`, `shop/bin/artikelliste.mjs`,
`shop/data/sparten.json` (neu), `shop/test/artikelliste.test.js`.

## Was offen war

Das Werkzeug für die Artikelliste steht seit einer Stunde. Es verlangt die
Warengruppe, statt sie zu raten — mit gutem Grund: Am 29. August erkannte ein
Regelwerk **0 von 16** Gruppen aus der Bezeichnung.

Nur wird die Liste des Lieferanten die sieben Gruppen dieses Shops nicht
kennen. Sie wird nach **seinen** Sparten gegliedert sein, denn er sortiert
sein Sortiment und nicht unsere Baustelle. Der offene Punkt lautete:

> Für ~20 Sparten des Lieferanten auf sieben Warengruppen ist das eine
> Tabelle, für hunderte Artikel einzeln wäre es ein Tag Arbeit.

## Der Unterschied, um den es geht

Vorher, mit einer Liste aus drei Sparten und elf Artikeln:

```
  ✗ Zeile 2: 80001 — für die Sparte „Waermedaemmverbundsysteme" …
  ✗ Zeile 3: 80002 — für die Sparte „Waermedaemmverbundsysteme" …
  ✗ Zeile 4: 80003 — für die Sparte „Waermedaemmverbundsysteme" …
  … acht weitere
```

Elf Zeilen mit drei Aussagen. Bei dreihundert Artikeln wären es dreihundert,
und die Arbeit bestünde darin, sie zu sortieren.

Nachher:

```
Offene Sparten (3) — nach data/sparten.json unter "sparten":

  "Waermedaemmverbundsysteme": "",     7 Artikel
  "Kaminsysteme": "",                  3 Artikel
  "Trockenbau": "",                    1 Artikel

  Erlaubt sind: Dämmung, Kamin, Kanal, Mauerwerk, Mörtel, WDVS, Zubehör
```

Drei Zeilen, nach Artikelzahl geordnet, **in der Form, in der sie in die
Tabelle gehören**. Kopieren, sieben Wörter einsetzen, noch einmal laufen
lassen.

Die Reihenfolge ist nicht Kosmetik: Wer oben anfängt, entscheidet zuerst
über die Sparte, die die meisten Artikel bewegt. Wer nach zehn Minuten
aufhört, hat den größeren Teil des Sortiments drin.

## Wie es funktioniert

Die Liste darf eine Spalte `gruppe` **oder** `sparte` tragen. Steht dort eine
der sieben Warengruppen, gilt sie unmittelbar. Steht dort etwas anderes,
entscheidet `data/sparten.json`:

```json
{ "sparten": { "Waermedaemmverbundsysteme": "WDVS", "Kaminsysteme": "Kamin" } }
```

Die Datei ist heute **leer** — die Sparten des Lieferanten sind nicht
bekannt, und erfundene Einträge wären schlimmer als keine. Sie trägt ein
`_beispiel`, damit die Form erkennbar ist, und den Hinweis, dass das Werkzeug
die echten Namen beim ersten Probelauf meldet.

## Vier Regeln, die dabei zu treffen waren

**Eine unzugeordnete Sparte erzeugt keine Fehlerzeile je Artikel.** Sie wird
gezählt und gebündelt gemeldet. Das ist der ganze Gewinn.

**Ein unbekannter Name in der `gruppe`-Spalte wird wie eine Sparte
behandelt.** Ob dort eine falsche Gruppe oder die Sparte des Lieferanten
steht, lässt sich nicht unterscheiden — und muss es nicht: Beides gehört in
dieselbe Liste offener Zuordnungen. Was zählt, ist, dass der Artikel nicht
durchrutscht.

**Ein Tippfehler in der Tabelle rutscht nicht durch.** Wer `"Trockenbau":
"Trockenbau"` einträgt, hat die Sparte zugeordnet — auf etwas, das es nicht
gibt. Das ist ein Fehler und keine offene Zuordnung, und es steht als
Testfall da.

**Ohne Tabelle bleibt der einfache Fall einfach.** Eine Liste, die die sieben
Gruppen selbst trägt, braucht keine Datei; fehlt `data/sparten.json`, läuft
alles wie zuvor.

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| Unzugeordnete Sparte wird „Zubehör" | drei Proben fallen |
| Fehlerzeile je Artikel statt Bündelung | drei Proben fallen, darunter die am Werkzeug |

Die erste ist die wichtigere. „Sonstiges" oder „Zubehör" als Auffangbecken
wäre die bequeme Lösung und die falsche: Ein Artikel in der falschen Gruppe
ist schlimmer als einer, der gar nicht erst eingelesen wird — er steht auf
einer Seite, auf der ihn niemand sucht, und niemand merkt es.

## Was am Liefertag jetzt noch zu tun ist

1. `npm run artikelliste -- poschacher <liste.csv> --stand=<datum>` — der
   Probelauf meldet die Sparten.
2. `data/sparten.json` füllen, ~20 Zeilen.
3. Denselben Aufruf noch einmal, dann mit `--schreiben`.
4. `npm run website && npm run pruefe-preise`.

Was dabei bleibt und nicht abnehmbar ist: **die Zuordnung selbst.** Welche
Sparte des Lieferanten zu welcher Aufgabe auf der Baustelle gehört, ist die
Entscheidung, für die es diesen Shop gibt.
