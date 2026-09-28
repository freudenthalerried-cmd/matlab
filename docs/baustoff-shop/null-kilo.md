# Null Kilogramm — und die Durchsicht aller Nullen

**31. August 2026.** Zum dritten Mal in drei Durchgängen dieselbe Fehlerform:
`?? 0` macht aus einer unbekannten Angabe nicht irgendeinen Wert, sondern den
günstigsten. Diesmal nicht gesucht, sondern beim Verfolgen des
Katalogunterschieds gefunden — und danach **einmal vollständig durchgesehen**,
damit es nicht ein viertes Mal einzeln auffällt.

## Der Fund

`src/import.js` schrieb:

```js
gewichtKg: gewicht ?? 0,
```

Ein Artikel ohne Gewichtsangabe wog danach null Kilogramm. Das ist schlimmer,
als es aussieht, denn der Warenkorb unterscheidet nach dem **Typ**:

```js
if (typeof p.gewichtKg === 'number') gewichtKg += p.gewichtKg * p.menge;
else ohneGewicht += 1;
```

`0` ist eine Zahl. Die Position galt damit als **belegt**. Nachgemessen:

| Feld im Artikel | Warenkorb sagt |
|---|---|
| `gewichtKg: 0` (heute) | `0 kg · aus den Lieferscheinen` |
| Feld weggelassen | `0 kg · 1 Position ohne belegtes Gewicht` |

Links eine Behauptung, rechts eine Lücke. Das Gewicht entscheidet, wie
geliefert wird — Palette, Kranhub, Sperrgutzuschlag —, und der Kunde muss
wissen, was auf seine Baustelle kommt.

Die drei anderen Einleser machen es richtig und sagen es sogar ausdrücklich:
`katalog-aus-rechnungen.mjs` schreibt in den Datenkopf „Wo das Feld fehlt, ist
das Gewicht UNBEKANNT und wird nicht geschaetzt". `artikelliste.js` und
`preisliste.js` setzen das Feld nur bei einem Wert über null. `import.js` war
der letzte, der eine Null einsetzte — und der älteste.

> **Vier Einleser, drei Haltungen zur Lücke und eine zur Null.** Wer als
> letzter umgestellt wird, ist der, den man beim Umstellen vergessen hat.

Ausdrücklich mitgeprüft: Auch eine **geschriebene** `0` in der Spalte gilt
jetzt als keine Angabe. Wer „0" einträgt, hat nicht gewogen; Ware ohne Masse
gibt es nicht.

## Die Durchsicht

Zwei Fundstellen in drei Tagen sind ein Muster, kein Zufall. Deshalb einmal
alle `?? 0`, `|| 0` und `?? 1` in `src/` und `shop-ui.js` angesehen — 22
Fundstellen. Die Frage an jede: **Ist die Null hier „nicht gesetzt" oder
„nicht bekannt"?**

| Sorte | Fundstellen | Urteil |
|---|---|---|
| Zähler und Summen, die bei null anfangen | 9 | in Ordnung — eine leere Summe ist null |
| Aufschläge, die es nicht geben muss (`sperrgutZuschlagNetto`) | 3 | in Ordnung: „nicht gesetzt" heißt hier wirklich „fällt nicht an" |
| Schwellen ohne Untergrenze (`mindestbestellwertNetto`) | 1 | in Ordnung — kein Mindestwert ist kein Mindestwert |
| Gewichte und Rangzahlen bei der Suche | 4 | in Ordnung — Vorgabewerte, keine Auskunft an den Kunden |
| Frachtpauschale (`l.fracht?.pauschaleNetto ?? 0`) | 2 | **angesehen, nicht geändert** |
| Gewicht beim Einlesen | 1 | **der Fund** |

Zur Frachtpauschale: Ein Lieferant ohne Frachtregel bekäme dort 0 € Fracht —
formal dieselbe Form wie der Gewichtsfall. Nachgesehen: **Alle vier
Lieferanten tragen eine vollständige Frachtregel**, samt Pauschale und
Sperrgutzuschlag; bei Poschacher steht sogar die Herleitung im Datensatz
(110,00 abzüglich 40 % plus 9,50 Energiekostenzuschlag). Die Null ist hier ein
Rückfall für Daten, die es immer gibt, keine stille Annahme über Daten, die
fehlen. Eine Änderung wäre eine Vorsichtsmaßnahme gegen einen Zustand, den
niemand herstellen kann — und sie würde die Fracht auf `null` setzen, was den
Warenkorb an anderer Stelle rechnen ließe. Bleibt, mit diesem Vermerk als
Begründung.

## Gegenproben

Vier Mutationen, jede gesichert und zurückgesetzt:

| Mutation | erkannt |
|---|---|
| `?? 0` zurück | ja — 3 rot |
| ausdrückliche `0` in der Spalte durchgelassen | ja |
| Gewicht gar nicht mehr übernommen | ja — 2 rot |
| Warenkorb zählt Lücken nicht mehr | ja |

Die dritte und vierte sind die Gegenrichtungen, ohne die die Berichtigung
selbst zur Lücke werden könnte: Ein angegebenes Gewicht muss durchkommen, und
was der Einleser weglässt, muss den Kunden **als Lücke erreichen** — sonst
prüfte die Probe nur eine Feldform statt der Auskunft, um die es geht.

## Warum es niemand gesehen hat

Dieselbe Antwort wie an den beiden Vortagen: `test/import.test.js` prüfte
Preise, Margen und Fehlerzeilen, aber nie eine leere Gewichtsspalte — und die
Kataloge, auf denen die Warenkorbproben rechnen, haben **keine einzige
fehlende Angabe**. Der echte Katalog hat 39 von 46.

## Stand

960 Testfälle grün (vorher 956), `pruefe-tests` 958/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 200/200.
