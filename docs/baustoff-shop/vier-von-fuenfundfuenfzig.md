# Vier von fünfundfünfzig

**11. September 2026. Runde 27.**

## Was gemessen wurde

Der Haken vor dem Commit ruft vier Prüfer: die Mutationsprüfung, die
Frischeprüfung, `npm test` samt Testprüfer und den Schaufensterabgleich. Der
Bestand führt **fünfundfünfzig**.

Warum die anderen einundfünfzig draußen bleiben, stand nirgends. Zwei Gründe
gab es — „23 Sekunden, verdoppelte jeden Commit" —, und beide standen als
**Kommentar** in derselben Datei, deren eigener Kopfsatz lautet:

> *Eine Regel, die nur als Satz dasteht, gilt für den, der sie liest.*

Der Gesamtlauf über alles fährt sie. Er hat an diesem Tag **72 Minuten 33
Sekunden** gebraucht, und niemand fährt ihn zwischen zwei Commits. In ihm
standen drei Prüfer rot:

| Prüfer | was er meldete | rot seit | aufgehalten hat es |
| --- | --- | --- | --- |
| `pruefe-umschreibung` | drei Musterausfuhren ohne Einordnung | 25. August | nichts |
| `pruefe-punkte` | vier Zahlen ohne Messung und ohne Grund | 8. September | nichts |
| `pruefe-gebinde` | Weigerung: die Rechnungspositionen fehlen | 8. September | nichts |

Siebzehn Tage, und dazwischen liegen zwölf Runden mit Commits, die alle durch
den Haken gegangen sind.

> **Ein Prüfer, der rot ist und nichts aufhält, ist kein Prüfer, sondern eine
> Notiz.**

## Die Zahl, die entscheidet

Jeder Prüfer einzeln gestoppt:

| | |
| --- | --- |
| unter einer Sekunde | **47 von 55**, zusammen rund fünf Sekunden |
| über einer Sekunde | 8 Prüfer, zusammen **107 von 123 Sekunden** |

Die Grenze bei einer Sekunde ist nicht gegriffen, sondern die Stelle, an der
die Messreihe auseinanderfällt: Der langsamste der schnellen braucht 925 ms,
der schnellste der langsamen 1550 ms, und dahinter geht es auf 13, 15 und 35
Sekunden.

Damit ist die alte Begründung widerlegt, ohne dass sie je falsch gewesen wäre.
Sie hieß „das verdoppelt jeden Commit" und stimmte für den Schaufensterprüfer,
der 34 Sekunden kostet. Für die anderen dreiundvierzig stimmt sie nicht.

## Gate 38 — was unter einer Sekunde bleibt, läuft vor jedem Commit

Neu ist `npm run schnelllauf`: **43 Prüfer in 5,1 Sekunden**. Welche das sind,
rechnet er aus dem Prüferregister und der Ausnahmeliste aus — es gibt keine
zweite Aufzählung, die davon abweichen könnte.

Fünf Sekunden auf einen Commit, der mit `npm test` ohnehin gut vierzig kostet,
sind der Preis dafür, dass ein roter Prüfer nicht mehr siebzehn Tage rot
bleiben kann.

**Draußen bleiben acht**, jeder mit Grund und **mit der gestoppten Zeit**,
damit ein Grund, der sich auf die Laufzeit beruft, nachprüfbar bleibt:

| Prüfer | s | warum |
| --- | --- | --- |
| `pruefe-haken` | 35,2 | ruft den Haken auf, und der ruft `npm test` — im Haken keine Prüfung, sondern eine Schleife ohne Boden |
| `shopprobe` | 15,1 | Chromium-Start für 63 Szenarien |
| `pruefe-lesbar` | 13,8 | liest 379 Quelldateien mit dem Übersetzer ein |
| `rahmenzensus` | 8,8 | 82 Seiten in einem 390-px-Rahmen, wieder ein Browser |
| `oberflaechenprobe` | 3,6 | eigener Browserstart für elf Szenarien |
| `bestellprobe` | 2,7 | schreibt echte Zeilen in die Ablage |
| `pruefe-leitzahlen` | 1,6 | der Grenzfall — *eine Grenze, die ihren ersten Grenzfall hereinlässt, ist keine* |
| `abgleich-veroeffentlichung` | 0,7 | billig genug und trotzdem falsch am Platz: **ein Commit, der ohne Netz nicht gelingt, ist kein Commit mehr** |

## Eine Weigerung sperrt nicht

`pruefe-gebinde` endet seit dem Verlust von `preise/poschacher-positionen.csv`
mit **Ausgang 2** — die Weigerung, nicht der Befund. Beide Auswege wären
falsch:

* wie einen Fund behandeln → **jeder Commit dieses Bestandes ist für immer gesperrt**;
* verschweigen → ein Prüfer, der nichts tut und grün aussieht.

Der Schnelllauf meldet sie und lässt durch. Der Satz darüber steht mit:
*Das ist keine Entwarnung.*

## Die drei roten Prüfer sind grün

**`pruefe-umschreibung`.** `quellenstempel.QUELLENSTEMPEL` und die beiden
Register aus der Absage standen in keiner Einordnung. Alle drei lesen eine
**Form, die dieses Haus selbst schreibt** — einen Quellenstempel mit `^`
verankert, die Meldungen der eigenen Prüfer — und sind damit keine
Behauptungsregeln über Kundentext. Sie tragen jetzt `behauptung: false` mit
Grund.

**`pruefe-punkte`.** Die vier Zahlen waren Gate 35, Gate 36, § 132 BAO und ein
Tagesdatum. Der Freibrief dafür lautete auf **Ziffernfolgen**:
`['20','23','25','28','30']`.

> **Ein Freibrief, der auf eine Ziffernfolge lautet, muss jedem neuen Gate
> hinterhergetragen werden — und gilt außerdem für jede andere Zahl, die
> zufällig gleich aussieht.**

Ein Eintrag nennt jetzt entweder `zahlen` oder `form` — ein Muster, das die
Zahl **mit ihrem Hauptwort** liest: `/\bGate (\d+)\b/`, `/(?:§+|\bArt\.)\s*(\d+)/`,
der Tag vor einem Monatsnamen. „36" als Kennzahl bleibt meldepflichtig.

Der Prüfer hat dabei gleich mitgeteilt, dass die alte Liste auch zu viel
deckte: Die 28 aus **Art. 28 DSGVO** war gedeckt, weil es zufällig ein Gate 28
gibt. Und ein Freibrief für den HTTP-Status 403 stand noch da, obwohl sein
Punkt die Zahl seit einem Tag nicht mehr nennt — er ist gestrichen, denn
*ein Freibrief für eine Zahl, die nirgends steht, deckt nur noch die nächste,
die zufällig gleich aussieht.*

**`pruefe-gebinde`** bleibt die Weigerung. Die Datei ist verloren und kommt
ohne den Auftraggeber nicht zurück.

## Ausgang

| | |
| --- | --- |
| Prüfer vor jedem Commit | 4 → **47** (4 einzeln, 43 im Schnelllauf) |
| Kosten je Commit | + 5,1 s auf rund 40 s |
| rote Prüfer | 3 → 0, dazu eine begründete Weigerung |
| Testfälle | 11 neu, 2295 grün |
| Gegenproben | 5 neu (180 → 185) |
| Gates | 37 → **38** |

## Was daraus offen bleibt

Dieselbe Familie, eine Ebene weiter: **Das Prüferregister kennt drei Befehle
nicht, die es gibt.** `pruefe-pruefer`, `wegprobe` und `werbeprobe` stehen in
`package.json` und in keinem Registereintrag — während der Gesamtlauf zum
Schluss ausgibt, seine Liste komme „aus `src/pruefregister.js` und nicht aus
dem Gedächtnis". Auch hier fehlt die Gegenrichtung. Das ist die nächste Runde.

---

**Die Regel dieser Runde:** *Eine Prüfung, die man von Hand starten muss, ist
eine Prüfung, die nicht läuft.*
