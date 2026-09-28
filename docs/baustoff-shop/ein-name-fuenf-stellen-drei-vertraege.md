# Ein Name, fünf Stellen, drei Verträge

**14. September 2026, abends.** Die Runde davor hat die Dublettensuche gebaut
und mit einem offenen Punkt geendet:

> Zwei Funktionen, die dasselbe tun und sich in einem Variablennamen
> unterscheiden, sind für sie verschieden. Das ist die dritte Stelle an diesem
> Tag, an der ein Werkzeug an der Gleichheit von Zeichen endet.

Diese Runde schließt ihn. Die Suche vergleicht jetzt zusätzlich die
**Gestalt**: Jeder freie Bezeichner wird durch `#1`, `#2`, … ersetzt, in der
Reihenfolge seines ersten Auftretens. Was dabei herauskam, war nicht das, was
ich gesucht hatte.

## Was die Messung fand

Über 737 Funktionsrümpfe in 246 Quelldateien, Stand vor dieser Runde:

| | Stellen | Länge | gefunden von |
|---|---|---|---|
| `kundenwoerter` / `kundenformen` (`src/shopkern.js`) | 2 | 205 | Gestalt |
| `abbruch` (`bin/vermerk.mjs`, `bin/vorgang.mjs`) | 2 | 92 / 82 | Gestalt |
| `zahlAus` / `betragAlsZahl` (`src/schaufenster.js`, `src/untergrenze.js`) | 2 | 65 | Gestalt |
| `abbruch` (`bin/paketpruefung.mjs`, `bin/kopfzeilenpruefung.mjs`) | 2 | 58 | Zeichen — **nach** dem Senken der Schranke |

Die vierte Zeile ist der eigentliche Fund dieser Runde, und sie hat mit der
Gestalt nichts zu tun.

## Die Schranke, die knapp danebenlag

`MINDESTLAENGE` stand auf **60** Zeichen, gesetzt mit der Begründung: Unter
sechzig Zeichen ist ein gleicher Rumpf häufiger dieselbe triviale Antwort als
eine Kopie. `bin/paketpruefung.mjs` und `bin/kopfzeilenpruefung.mjs` trugen
dieselbe Funktion `abbruch`, Zeichen für Zeichen gleich — **58 Zeichen lang.**
Zwei unter der Schranke. Der Prüfer lief darüber grün und meldete null.

> **Eine Schranke, die einen Fund knapp verfehlt, ist kein Maß, sondern ein
> Zufall — und sie war gesetzt worden, ohne dass irgendetwas sie geprüft
> hätte.**

Sie steht jetzt auf **50**. Gemessen, was das kostet: zwei Gruppen gleicher
Gestalt kommen dazu, beide begründet, keine einzige zeichengleiche. Bei 45
kämen Befundfunktionen dazu, die nur den gemeinsamen Bau eines Befundobjekts
teilen — dort fängt die Messung an, das Hausmuster zu melden statt einer Kopie.

## Der Name, unter dem drei Verträge standen

Beide Wege zusammen zeigten auf denselben Namen. Nachgeschlagen ergab:
**fünf** Funktionen namens `abbruch`, in **drei** Verträgen.

| steht in | Aufruf | Vorspann „Abbruch:" | Ende |
|---|---|---|---|
| `bin/bestellprobe.mjs` | `(text, code = 2)` | vom Helfer | 2 |
| `bin/paketpruefung.mjs`, `bin/kopfzeilenpruefung.mjs` | `(...zeilen)` | **vom Aufrufer** | 2 |
| `bin/vermerk.mjs`, `bin/vorgang.mjs` | `(satz, nachsatz)` | vom Helfer | **1** |

Zwei der drei Unterschiede waren Zufall. Ob der Aufrufer das Wort „Abbruch"
selbst in seinen Text schreibt, entscheidet nichts — es entscheidet nur
darüber, ob es nach einem Umzug zweimal oder gar nicht dasteht. Dreizehn
Aufrufe schrieben es selbst.

> **Ein Name für drei Verträge ist schlimmer als drei Namen: Der Leser sieht
> den vertrauten Aufruf und liest den fremden Vertrag nicht nach.**

## Der eine Unterschied, der bleibt

Die **Endziffer**, und sie ist keine Geschmacksfrage. `src/prueferurteil.js`
liest sie seit Langem: `0` heißt „ohne Treffer", `1` heißt „mit Treffern",
alles andere heißt „gar nicht erst gemessen". Ein **Prüfer**, der mit `1`
abbricht, meldet damit einen Befund, den er nie erhoben hat — der Gesamtlauf
zählt ihn als gelaufen und rot statt als nicht messbar. `bin/vermerk.mjs` und
`bin/vorgang.mjs` sind keine Prüfer; dort ist `1` das gewöhnliche Scheitern.

Also gibt es in `src/werkzeugabbruch.js` **keine Vorgabe**: `abbruchmelder(code)`
verlangt die Ziffer, und sie steht in jedem Werkzeug einmal, oben, mit Namen —
`ABBRUCH_PRUEFER` oder `ABBRUCH_WERKZEUG` — statt fünfmal verstreut in einer
kopierten Zeile. Eine Ziffer ≤ 0 wird zurückgewiesen: Ein Abbruch mit `0` sagt
„alles in Ordnung", und ein Vertipper wäre still.

## Was die Messung nicht fand

Vier der fünf Stellen fand sie. Die fünfte, `bin/bestellprobe.mjs`, fand das
Nachschlagen des Namens: Ihr Rumpf ist 56 Zeichen lang und hat eine eigene
Gestalt, weil sie keinen Nachsatz kennt und die Endziffer als Parameter führt.

> **Die Messung hat nicht den Fund gemacht, sondern die Spur gelegt.** Wer sie
> für vollständig hält, hört beim vierten von fünf auf.

## Drei weitere Zusammenlegungen

**`kundenwoerter` / `kundenformen`** (205 Zeichen, `src/shopkern.js`): dieselbe
Schleife über die Suchwörter, einmal mit `wortstaemme`, einmal mit
`wortformen`. Beide reichen jetzt an `kundenwortteile()` weiter. Was stehen
bleibt, sind zwei Namen für zwei Verträge — und die stehen im Gestaltregister
mit Grund, denn sie wegzukürzen hieße, den Aufrufer die Zerlegungsfunktion
wählen zu lassen.

**`zahlAus` / `betragAlsZahl`** (65 Zeichen): der **dritte** Leser deutscher
Zahlen im Haus, und zwar mit einem anderen Vertrag als die beiden anderen:

```
                '1.250'      '0.75'
zahlAusText     1.25         0.75
deutscheZahl    1250         75
```

`zahlAusText` liest, was dieses Haus **schreibt** — Komma oder Punkt als
Dezimaltrennzeichen, nie ein Tausenderpunkt. `deutscheZahl` liest, was in
**Fließtext** steht. Wer sie verwechselt, bekommt keinen Fehler, sondern eine
Zahl: den Preis durch tausend. Beide stehen jetzt nebeneinander in
`src/format.js`, mit dem Unterschied dazwischen ausgeschrieben.

**`abbruch` × 5** → `src/werkzeugabbruch.js`, wie oben.

## Ein Eintrag, der sich selbst widerlegte

Ins Gestaltregister hatte ich `findeAnnahme` / `findeZahlweg` geschrieben —
zwei Suchen-oder-klagen über zwei Register, die ich für gestaltgleich hielt.
Der Prüfer meldete:

```
✗ `findeAnnahme`, `findeZahlweg` stehen als begründet gleiche Gestalt
  und sind keine mehr   [grund-ohne-gestalt]
```

Er hatte recht. Ihre Klagen lauten verschieden („Unbekannte Annahme" /
„Unbekannter Zahlweg"), und **Zeichenketten bleiben beim Nummerieren stehen** —
ein Rumpf, der `2` zurückgibt, und einer, der `1` zurückgibt, sind zwei
Antworten. Der Eintrag ist wieder heraus.

> **Ein Grund für etwas, das der Prüfer nicht meldet, ist selbst ein Befund.**
> Das Register musste beide Richtungen können, um seinen ersten Eintrag zu
> widerlegen — und das konnte es, weil die Regel von Anfang an mitgebaut war.

## Wo im Text der Code steht

Eine Unterscheidung musste der Nummerierer lernen, sonst hätte er den
eigentlichen Fund verfehlt: Im Zeichenkettenteil eines Schrägstrichliterals
steht **Text**, in `${…}` steht **Code**. `` `Abbruch: ${satz}` `` und
`` `Abbruch: ${text}` `` sind dieselbe Gestalt; `'Abbruch: eins'` und
`'Abbruch: zwei'` sind es nicht. Genau darin unterschieden sich die beiden
Abbruchmelder aus `vermerk` und `vorgang`.

## Eine Ausnahme, die heute nichts hält — und das steht auch so da

Eigenschaften hinter einem Punkt werden nicht nummeriert: `a.sku` und
`b.gruppe` sollen verschieden bleiben, weil der Name einer Eigenschaft der
Vertrag mit den Daten ist und nicht die Wahl des Schreibers. Ich habe das
zuerst als gemessene Notwendigkeit aufgeschrieben. Nachgemessen stimmt das
nicht:

| Schranke | mit Ausnahme | ohne |
|---|---|---|
| 50 (gesetzt) | 2 | 2 |
| 40 | 4 | 5 |
| 20 | 11 | 13 |

Bei der gesetzten Grenze ändert sie am Bestand **nichts**. Sie steht gegen den
Fehlalarm, der beim nächsten Senken käme — und sie steht mit dieser Messung im
Quelltext, damit niemand sie für gemessen hält, wo sie nur vorsorglich ist.

## Ein Grund gilt bis zu der Länge, für die er geschrieben wurde

Das Gestaltregister führt die Menge der **Namen**, nicht einen Namen — zwei
Rümpfe gleicher Gestalt heißen in der Regel verschieden, und genau deshalb fand
sie der Zeichenvergleich nicht. Dabei fiel eine Lücke auf: Ein Name bleibt
derselbe, während der Rumpf darunter wächst. Der Eintrag für `kundenwoerter` /
`kundenformen` ist für zwei Weiterreichungen von 58 Zeichen geschrieben — gegen
den Stand **vor** dieser Runde hätte er wortlos 205 Zeichen gedeckt. Darum steht
im Eintrag die gemessene Länge `bisZeichen`, und sie wird mitgeprüft:

```
✗ `kundenformen`, `kundenwoerter` sind auf 205 Zeichen gewachsen,
  begründet sind 58   [gestalt-groesser-als-begruendet]
```

## Stand

* 733 Funktionsrümpfe in 247 Quelldateien, gezählt ab 50 Zeichen
* zeichengleich ungeführt: **0** (Schranke 0), begründet: 2
* gestaltgleich ungeführt: **0** (Schranke 0), begründet: 2
* 53 Prüfer grün im Schnelllauf, 2554 Testfälle, 296 Gegenproben
* Zwei neue Gegenproben, beide rot gesehen:
  `der-gestaltvergleich-meldet-das-schon-beurteilte`,
  `ein-pruefer-bricht-wieder-mit-der-urteilsziffer-ab`

## Ein roter Befund, der keiner war

Zwischendurch meldete `pruefe-schaufenster` eine Kennzahl als veraltet:
*„Lieferantenbelege — die Beschreibung sagt 15, gemessen sind 16."* In der
Datei stand 15, in der Beschreibung stand 15. Der nächste Lauf war grün, die
sechs danach auch.

Der Grund war meiner: Ein voller Gegenprobenlauf lief im Hintergrund weiter,
weil ich ihn für eine Auflistung gehalten hatte. Er tut, was er soll — eine
Datei ändern, einen Prüfer laufen lassen, zurücklegen —, und ich maß währenddessen.

> **Ein Prüferlauf neben einem Gegenprobenlauf misst eine absichtlich kaputte
> Arbeitskopie. Die Zahl, die dabei herauskommt, gehört keinem Stand.**

Beim Abbrechen blieb kurz eine Mutation in `bin/website.mjs` und ein
abgeräumtes `ausgabe/site` zurück; der Lauf hat beides selbst wieder
hergestellt. Nachgesehen wurde es trotzdem — vor dem Commit, Datei für Datei.

## Was diese Runde nicht erreicht hat

Der Vergleich endet an der **Gestalt**. Zwei Funktionen, die dasselbe tun und
sich in der Reihenfolge zweier unabhängiger Zeilen unterscheiden, sind für ihn
verschieden — ebenso zwei, bei denen die eine eine Schleife und die andere ein
`map` nimmt. Das ist die nächste Stufe, und sie ist die erste, bei der ein
Fehlalarm teurer wäre als der Fund: Was verschieden aussieht und dasselbe tut,
darf man zusammenlegen; was gleich aussieht und Verschiedenes tut, darf man es
nicht.
