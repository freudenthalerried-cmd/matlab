# Die Bestellung, die zweimal angeboten wurde

**12. September 2026, abends. Runde 57.**

## Der Fund

`npm run posteingang` liest das Journal der eingegangenen Bestellungen und
sagt, welche zu einem Angebot taugt. Es las das Journal — und sonst nichts.

Gemessen an einem Probejournal aus zwei Bestellungen, von denen die erste
längst Angebot, Auftragsbestätigung und Rechnung in der Akte hat:

```
Posteingang — 2 Bestellungen, 2 davon angebotsreif

  ✓ B-2026-0001  2026-09-04T16:40:00+00:00  Musterbau GmbH (Perg)
  ✓ B-2026-0002  2026-09-11T08:15:00+00:00  Musterbau GmbH (Perg)

Zum Weiterarbeiten:
  npm run posteingang -- --nummer B-2026-0001 --nach ../vorgaenge/B-2026-0001
```

Das Posteingangsjournal **wächst nur**: Jede eingegangene Bestellung steht für
immer darin, und jede stand hier für immer als „angebotsreif". Die Empfehlung
nimmt die erste Zeile.

> **Die Bestellung, die fertig ist, war die, die das Werkzeug vorschlug** — und
> zwar an jedem Tag danach wieder.

## Was daraus folgt

Wer der Empfehlung folgt, schneidet dieselbe Bestellung ein zweites Mal heraus
und macht daraus einen zweiten Vorgang:

- ein zweites **Angebot** über dieselbe Ware, an denselben Kunden,
- unter einer zweiten **Vorgangsnummer**,
- mit einer zweiten **Bindefrist**, die vierzehn Tage später abläuft.

Beide Papiere sind für sich tadellos. **Keine Sperre in `vorgang.mjs` sieht
etwas**, denn dort ist es der erste Vorgang dieser Nummer — dieselbe Lage wie
am 30. August bei den zwei Kunden in einem Geschäft, nur eine Stufe früher.
Welches der beiden Angebote gilt, entscheidet dann der Kunde.

Und die Auskunft, die fehlte, lag die ganze Zeit daneben: `B-2026-0001` wird zu
Vorgang `2026-0001`, und zu jedem abgelegten Papier steht in der Vorgangsablage
eine Zeile.

## Was jetzt gilt

Der Posteingang liest die Akte mit und trennt **drei** Zustände statt zwei:

```
Posteingang — 2 Bestellungen, 2 angebotsreif, 1 davon noch offen

  · B-2026-0001  …  Musterbau GmbH (Perg)
        schon bearbeitet — Vorgang 2026-0001, 3 Papier(e) in der Akte
  ✓ B-2026-0002  …  Musterbau GmbH (Perg)

Zum Weiterarbeiten:
  npm run posteingang -- --nummer B-2026-0002 --nach ../vorgaenge/B-2026-0002
```

| | |
| --- | --- |
| `bereit` | die **Angaben** taugen zu einem Angebot |
| `bearbeitet` | zu dieser Bestellung liegt ein Vorgang in der Akte |
| `offen` | beides zusammen: bereit und noch nicht bearbeitet |

Zwei Fragen, die bis heute eine waren. Gezählt werden **Papiere**, gelesen wird
kein Inhalt.

## Die Sperre steht hier und nicht in `vorgang.mjs`

```
$ npm run posteingang -- --nummer B-2026-0001 --nach …
Abbruch: Zu B-2026-0001 liegt schon Vorgang 2026-0001 in der Akte, mit 3 Papier(en).

Ein zweites Herausschneiden führt zu einem zweiten Angebot über dieselbe
Ware, unter einer zweiten Vorgangsnummer, an denselben Kunden.
Was abgelegt ist, zeigt: npm run akte -- --vorgang 2026-0001

Wenn die Arbeitsdateien verlorengegangen sind und der Vorgang weiterläuft:
  --erneut hebt diese Sperre auf.
```

Hier ist die Stelle, an der aus einer Zeile des Posteingangs zum **zweiten Mal**
ein Vorgang wird. In `vorgang.mjs` ist es der erste Vorgang dieser Nummer und
fällt deshalb nirgends auf.

`--erneut` gibt es, weil es den Fall gibt: Die beiden Arbeitsdateien sind
verlorengegangen, der Vorgang läuft weiter. Dann ist es kein zweites Angebot,
sondern dieselbe Vorlage noch einmal — und wer sie holt, weiß das und sagt es.

## Zwei Dinge, die absichtlich **keine** Befunde sind

**Ein Vorgang ohne Bestellung im Posteingang** ist eine Auskunft, kein Fehler:
Die Betriebskette führt den telefonischen Auftrag ausdrücklich als Weg, und wer
anruft, steht in keinem Journal. Gemeldet wird er trotzdem — sind es plötzlich
viele, ist entweder das Journal unvollständig heruntergeladen oder jemand hat
von Hand angelegt.

**Ein unlesbares Aktenjournal schließt den Posteingang nicht.** `ausJournal`
bricht streng ab, und dort ist das richtig (§ 131 BAO). Hier ist die Akte nur
die Auskunft darüber, was schon bearbeitet ist; wer den Posteingang deshalb gar
nicht mehr sähe, sähe auch die **neu eingegangenen** Bestellungen nicht. Gesagt
wird es laut, mit dem Satz, dass die Sperre damit wegfällt.

## Nachgezogen

Die Zuordnung `B-2026-0001` → `2026-0001` stand seit dem 4. September nur in
einer Zeichenkette der Bildschirmausgabe (`nummer.replace(/^B-/, '')`). Eine
Regel, die nur in einer Ausgabezeile steht, lässt sich nicht prüfen; sie heißt
jetzt `vorgangsnummerZu()` und hat Testfälle.

## Ausgang

| | |
| --- | --- |
| Zustände je Bestellung | 2 → **3** (bereit, bearbeitet, offen) |
| Neue Sperre | zweites Herausschneiden, aufhebbar mit `--erneut` |
| Neue Auskunft | Vorgänge ohne Bestellung im Posteingang |
| Testfälle | 2.421 → **2.426** |
| Gegenproben | 226 → **228** |

---

**Die Regel dieser Runde:** *Eine Arbeitsliste, die nur den Eingang kennt und
nicht den Ausgang, empfiehlt mit der Zeit immer dieselbe erledigte Aufgabe.*
