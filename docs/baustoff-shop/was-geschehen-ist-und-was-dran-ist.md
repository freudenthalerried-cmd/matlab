# Was geschehen ist — und was dran ist

**12. September 2026, abends. Runde 58.**

## Der Fund

Die Akte ist vollständig: Sie liest jeden Vorgang zurück, nennt zu jeder Zeile
den Beleg und zu jedem Angebot die Bindefrist. Sie sagt, **was geschehen ist.**

Gemessen an vier Vorgängen an vier verschiedenen Punkten der Betriebskette:

```
Vorgang 2026-0101  1. angebot                AN-2026-0101   Bindefrist: bindet noch 13 Tag(e)
Vorgang 2026-0102  2. angebot / 3. auftragsbestaetigung
Vorgang 2026-0103  4. angebot                AN-2026-0103   Bindefrist: VERFALLEN seit 9 Tag(en)
Vorgang 2026-0104  5. angebot / 6. auftragsbestaetigung / 7. lieferantenbestellung
```

Vier verschiedene Lagen, viermal dieselbe Auskunft: die Zeilen und ihre Belege.

> **Nichts in diesem Haus sagte, was als Nächstes zu tun ist.** Der Kunde hat
> angenommen — und niemand erinnerte daran, den Zahlungseingang zu prüfen. Die
> Ware ist bestellt — und niemand an das Lieferdatum, ohne das keine Rechnung
> entsteht.

Die einzige vorwärts gerichtete Aussage der ganzen Akte war die Bindefrist, und
die kam am selben Tag dazu.

Das ist dieselbe Familie wie der Fund eine Stunde davor: Der Posteingang kannte
den Eingang und nicht den Ausgang. Hier kennt die Akte die Vergangenheit und
nicht die nächste Pflicht.

## Woher der nächste Schritt kommt

**Nicht aus einer neuen Liste.** Die Schritte eines Geschäftsfalls führt
`SCHRITTE` in `src/betriebskette.js` seit dem 4. September, mit Werkzeug, Gate
und — wo es kein Werkzeug gibt — dem Grund dafür. Neu ist nur die Zuordnung:
**welches Papier welchen Schritt belegt.**

| Papier | belegt |
| --- | --- |
| `angebot` | Schritt `angebot` |
| `auftragsbestaetigung` | Schritt `annahme` — der Vertragsschluss |
| `lieferantenbestellung` | Schritt `lieferantenbestellung` |
| `rechnung` | Schritt `rechnung` |
| `absage` | Abzweig `absage` — der Fall verlässt die Kette |
| `gutschrift` | Abzweig `rechnung-falsch` |

Die beiden Arten ohne Blatt — `vermerk` und `uidabfrage` — stehen **nicht**
darin und dürfen es nicht: Sie belegen nichts, sie *sind* die Aufzeichnung.
`npm run betriebskette` hält das Register seit heute in beide Richtungen fest:
jedes Papier belegt einen Schritt, und jeder genannte Schritt existiert.

## Was die Akte jetzt sagt

```
  Vorgang 2026-0102 — 2 Eintrag/Einträge, Journal 2026
    Stand: zuletzt „annahme"
    Als Nächstes: Der Kunde zahlt; das Geld geht ein
           kein Werkzeug — das geschieht in der Welt
           Gate 21 — Kundenzahlungsziel null Tage, Vorkasse und EPS

  Vorgang 2026-0103 — 1 Eintrag/Einträge, Journal 2026
    Stand: abgeschlossen — verfallen
           Die Bindefrist läuft ab, ohne dass der Kunde annimmt
```

Und `npm run akte -- --offen` macht daraus eine **Arbeitsliste**: Sie zeigt nur
die laufenden Vorgänge. Die Akte zeigt weiter alles — sie ist die Auskunft über
einen Geschäftsfall; wer morgens wissen will, was zu tun ist, stellt die andere
Frage, und die abgeschlossenen Vorgänge stehen ihr im Weg, weil es mit der Zeit
die meisten sind.

## Die Stelle, an der ein falscher Rat Geld kostet

Steht nur das Angebot da und ist die Bindefrist abgelaufen, ist der nächste
Schritt **nicht** „der Kunde nimmt an".

> **Nimmt er am zwanzigsten Tag an, entsteht kein Vertrag zum Preis von damals
> (§ 862 ABGB)** — und Baustoffpreise bewegen sich.

„Als Nächstes: der Kunde nimmt an" wäre dann eine Arbeitsanweisung, die ins
Verlustgeschäft führt. Die Akte sagt stattdessen, was der Abzweig sagt: Der
Vorgang ist verfallen, und die Folge ist eine Entscheidung des Betreibers.
Dieselbe Fehlerrichtung wie bei der Bindefrist selbst — ein Angebot fälschlich
für verfallen zu halten kostet eine Rückfrage, umgekehrt kostet es Geld.

Ohne Geschäftstag wird gar keine Frist gerechnet: **unbekannt ist nicht
„verfallen"**, so wie es auch nicht „gültig" ist.

## Ausgang

| | |
| --- | --- |
| Neu | `src/vorgangsstand.js` — `PAPIERSCHRITT`, `papierschrittbefund()`, `vorgangsstand()` |
| `npm run akte` | nennt je Vorgang den Stand und den nächsten Schritt samt Werkzeug und Gate |
| `npm run akte -- --offen` | die Arbeitsliste: nur laufende Vorgänge |
| `npm run betriebskette` | hält das Papierregister in beide Richtungen |
| Testfälle | 2.426 → **2.433** |
| Gegenproben | 228 → **230** |

---

**Die Regel dieser Runde:** *Eine Aufzeichnung, die nur nach hinten sieht, ist
vollständig und trotzdem keine Hilfe — die nächste Pflicht steht nicht in den
Papieren, sondern in der Kette, zu der sie gehören.*
