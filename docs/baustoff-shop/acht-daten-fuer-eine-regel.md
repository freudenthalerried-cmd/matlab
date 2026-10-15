# Acht Daten für eine Regel

**10. September 2026, vierzehnte Runde.** Auf jeder der 46 Artikelseiten steht
seit dem 6. September dieser Satz:

> „Verbindlich wird der Preis nicht hier, sondern mit dem Angebot: Das bindet
> 14 Tage ab Angebotsdatum (**Quelle: eigene Belegvorlage nach § 862 ABGB,
> Stand: 2026-05-26**). Bis dahin ist die Zahl eine Auskunft und keine Zusage."

Belegt werden soll damit die **Bindefrist** — `BINDEFRIST_TAGE = 14` aus
`src/beleg.js`, beschlossen am 6. September. Das Datum daneben war der
**Preisstand des Artikels**: der Tag, an dem der Lieferant zuletzt seine Liste
für diese eine Ware geschrieben hat.

## Die Messung

Alle Quellenangaben des gebauten Auftritts, nach Form gezählt:

| Stempel | Vorkommen | verschiedene Stände |
|---|---:|---:|
| Lieferung und Fracht | 71 | 1 |
| **eigene Belegvorlage nach § 862 ABGB** | **46** | **8** |
| eigene Entscheidung (Mindestbestellwert) | 20 | 1 |
| Positionsgewicht auf dem Lieferschein | 4 | ohne Datum |
| eigene Lieferantenrechnungen | 2 | 1 |
| Liefergebiet · Nebenkosten · Gebindegröße | je 1 | je 1 |
| **gesamt** | **146** | |

> **Sieben von acht Stempeln nennen im ganzen Auftritt genau einen Stand. Der
> achte nennt acht — und er ist der einzige, dessen Tatsache eine Regel unseres
> eigenen Papiers ist.**

Eine Regel hat ein Beschlussdatum, keins je Ware. Auf der ältesten Artikelseite
(Preisstand 2026-04-22) sah die Bindefrist 141 Tage alt aus, auf der jüngsten
(2026-08-17) 24. Und nachschlagen ließ sich weder das eine noch das andere: Der
Preisstand steht in der Preisliste des Lieferanten, die Bindefrist in unserer
Belegvorlage. **Der Beleg zeigte auf die falsche Akte.**

## Warum keiner der 48 Prüfer das gesehen hat

`pruefe-quellen` liest `inhalte/quellen.json` — die Fundstellen der
handgeschriebenen Inhaltsseiten. `pruefe-zahlen` hält 30 Zahlen derselben
Seiten gegen ihre Fundstelle. Beide sehen nur, was ein Redakteur geschrieben
hat.

Diese 146 Stempel stehen in keiner Datei unter `inhalte/`. Sie entstehen erst
beim Bauen, in Vorlagen des Seitenbauwerkzeugs.

> **Ein Beleg, den erst der Bau anhängt, wird von keinem Redaktionsprüfer
> gelesen.**

Dieselbe Lücke wie am 5. September, als eine interne Gate-Nummer auf zwanzig
Kundenseiten stand, weil die Interna-Prüfung den Rumpf las und nicht die
fertige Seite. Damals war es der Zeitpunkt der Prüfung, hier ist es ihr Ort.

## Was jetzt gilt

`src/quellenstempel.js` führt alle acht Stempel — je mit der **Tatsache**, die
er belegt, und der **Herkunft seines Standes**. Aus der Herkunft folgt die
Prüfung:

| Standform | Bedeutung |
|---|---|
| `einer` | eine Setzung oder ein Bestand: genau ein Datum im ganzen Auftritt |
| `viele` | hängt an der einzelnen Ware — **verlangt einen Grund** |
| `ohne` | die Fundstelle trägt ihr Datum selbst (ein Lieferschein) |

Heute nutzt kein Eintrag `viele`, und genau deshalb steht die Form im Register:
Sie ist die bequeme Antwort auf jeden Befund über abweichende Stände. Ohne
Begründungszwang wäre der erste Eintrag, der sich nicht halten lässt, morgen
umgestellt statt berichtigt.

Und die Gegenrichtung, die den Fund gemacht hätte: **ein Stempel auf einer
Seite, den das Register nicht führt.** Wer eine neue Quellenangabe in eine
Vorlage schreibt, trägt sie ein oder wird gemeldet.

Die Zahl selbst steht jetzt mit ihrem Datum in **einem** eingefrorenen Paar:

```js
export const BINDEFRIST = Object.freeze({ tage: 14, stand: '2026-09-06' });
```

Wer die Frist ändert, hat die Zeile mit dem Datum vor Augen — und ein Testfall
hält das Paar zusätzlich fest, damit sich nicht die eine Hälfte ändern lässt,
ohne dass die andere auffällt. Das ist der Unterschied zu einer zweiten
Konstante daneben: *Zwei Konstanten laufen auseinander, ein Paar nicht.*

## Nebenbefund, der keiner war

Beim Nachmessen fielen elf Artikelseiten auf, deren maschinenlesbares
`priceValidUntil` in der Vergangenheit liegt — bis zu 51 Tage. Das sah nach
einem zweiten Fund aus und ist keiner: Die Auszeichnung kommt aus der eigenen
90-Tage-Grenze, und **auf genau denselben elf Seiten** steht im Klartext „Diese
Grundlage ist 107 Tage alt und damit älter als die selbst gesetzte Grenze".
11 = 11, ohne eine einzige Abweichung in beide Richtungen. Beide Kanäle sagen
dasselbe, und beide sagen die Wahrheit.

Was dabei doch veraltet ist, ist eine **Zahl in einer Begründung**: Der
Kommentar, der diese Auszeichnung am 6. September einführte, nennt „sieben der
46 Artikel". Vier Tage später sind es elf. Eine handgeschriebene Zahl im
Fließtext einer Begründung läuft mit — berichtigt.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2234 | **2244** |
| Gegenproben | 158 | **159** |
| geführte Quellenstempel | 0 | **8** (146 Vorkommen) |
| Prüfer | 48 | 48 |

`npm test` grün (2244 bestanden, 3 übersprungen), `npm run pruefe-tests` (2247
Testfälle, 0 mit Verdacht), `npm run pruefe-seiten` (82 Seiten, 0 mit
Verdacht), `npm run shopprobe` (57 Szenarien), `npm run oberflaechenprobe` (11
Szenarien), `npm run pruefe-pruefer` (48 Prüfer, 1 abgebrochen —
`pruefe-gebinde` seit dem Verlust der Poschacher-Positionsdatei).

Die Gegenprobe `beleg-mit-fremdem-stand` setzt den Preisstand zurück in die
Vorlage und verlangt, dass die Abweichung auffällt — gemessen an den gebauten
Seiten, nicht an der Vorlage. Sie meldete rot an der erwarteten Stelle.
