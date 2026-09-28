# Für den Satz eine Datei, für die Zahl keine

**13. September 2026, sechste Runde des Tages.** Die Vorrunde hat den
Frachtsatz gegen fehlende Felder abgesichert. Beim Lesen derselben Zeilen fiel
auf, dass die Frachtzeile an **drei** Stellen gerechnet wird.

## Der Fund

```
src/preis.js:207      cent(regel.pauschaleNetto + sperrgutPositionen * (regel.sperrgutZuschlagNetto ?? 0))
src/shopkern.js:1168  runde(l.fracht.pauschaleNetto + sperrgutPositionen * l.fracht.sperrgutZuschlagNetto)
src/kontrolle.js:536  rund(regel.pauschaleNetto + sperrgut * (regel.sperrgutZuschlagNetto ?? 0))
```

`src/frachttext.js` liegt daneben. Es gibt diese Datei seit dem **5. September**,
und ihr Kopf sagt, warum:

> „Der Wortlaut stand zweimal: in `fracht()` in `preis.js` und in
> `kundenWarenkorb()` in `shopkern.js` … **Eine Probe, die zwei Fassungen
> vergleicht, ist besser als nichts und schlechter als eine Fassung.**"

> **Für den Satz an der Frachtzeile wurde ein eigenes Modul gebaut. Die Zahl
> daneben blieb stehen — an genau denselben zwei Stellen.**

Dazu kam seit gestern ein Bruch: `frachtsatzbefund` verlangt
`modell: "pauschale"` und hält den Bau an, wenn ein Satz ein anderes Modell
trägt. Beide Fassungen wussten davon nichts und hätten eine Staffel nach
Gewicht still als Pauschale gerechnet.

## Und ein Irrtum, der zur Lehre gehört

Die dritte Stelle, `kontrolle.js`, habe ich zuerst mitgenommen — und
zurückgenommen. Ihr Kopf sagt seit dem Bau:

> „Die zweite Rechnung — **bewusst anders gebaut als die erste**. … Sie ist
> unabhängig. Sie kennt weder `warenkorb.js` noch `preis.js`, sondern nur Text
> und die vier Grundrechenarten. … Ein Denkfehler, der in beide Richtungen
> gleich falsch ist, fällt dabei nicht auf."

Dieselbe Datei führt zwei weitere Wiederholungen mit derselben Begründung: den
Steuersatz und den Zahlenleser. Über letzteren steht: *„Ein Leser, der die
Schreibweise vom Schreiber bezieht, bestätigt jede Schreibweise, auch eine
falsche."*

> **Dieselbe Zeile an zwei Stellen ist eine Abschrift. Dieselbe Zeile an einer
> dritten kann die Kontrolle sein — und welche von beiden es ist, steht nicht
> im Code, sondern in seiner Begründung.**

Eine Regel „jede Formel genau einmal", mechanisch angewandt, hätte hier die
einzige unabhängige Gegenrechnung dieses Bestands beseitigt. Der Testfall
dieser Runde hält deshalb **beides** fest: `preis.js` und `shopkern.js` dürfen
die Formel nicht tragen, `kontrolle.js` **muss** sie tragen.

## Was geändert wurde

**`src/frachtsatz.js`** — die Zahl an einer Stelle, nach demselben Muster wie
`frachttext.js`: *eine Zahl aus drei Feldern und kein Wissen über den Einkauf.*
Es trägt `frachtbetrag()`, `FRACHTMODELL` und `frachtsatzbefund()` und darf ins
Browserbündel, weil keine Einkaufszahl darin steht.

Die Frei-Haus-Schwelle bleibt draußen: Der Browser ruft **ohne Bestellwert**,
und ohne Bestellwert gibt es keine Frachtfreiheit — kein Ausschluss, sondern
eine Nichtfeststellbarkeit. Genau das sagt der Satz aus `frachttext.js` dem
Kunden schon seit dem 5. September.

**Der `?? 0` ist weg.** Seit gestern verlangt `frachtsatzbefund` beide Zahlen
und hält den Bau an, wenn eine fehlt. Der Rückfall deckte damit einen Zustand,
den es nicht mehr gibt.

## Und die Rundung stand viermal

Beim Zusammenlegen fiel auf, dass auch die Rundungsregel mehrfach dasteht:
`cent` in `preis.js`, `rund` in `kontrolle.js`, `runde` in `shopkern.js`, `cent`
in `anfragelesen.js`. **Zwei davon mit `Number.EPSILON`, zwei ohne** — und das
ist kein Schönheitsfehler:

```
1,005  →  mit EPSILON 1,01   ohne 1,00
0,575  →  mit EPSILON 0,58   ohne 0,57
2,405  →  mit EPSILON 2,41   ohne 2,40
```

**Gemessen:** über zwei Millionen dreistellige Werte **31 Unterschiede**. Über
den echten Katalog — 46 Artikel, 400 bestellbare Mengen je Artikel, Ein- und
Verkaufspreis, also 36.800 Zeilensummen — **kein einziger.**

Das gehört so gesagt: Der Unterschied ist heute nicht im Geld. Er war nie ein
Fehler, den jemand bezahlt hat, und diese Runde repariert keinen Schaden. Sie
legt zusammen, was zusammengehört, bevor der erste Preis mit drei
Nachkommastellen entsteht.

> **Zwei Rundungsregeln für dieselbe Währung sind zwei Antworten auf eine
> Frage, und welche gilt, entscheidet der Aufrufer — ohne es zu wissen.**

`cent` steht jetzt in `format.js`. `preis.js` führt es weiter aus, damit die
sieben Module, die es von dort holen, es von dort holen können. `kontrolle.js`
behält seine eigene — **aus demselben Grund wie die Formel**.

## Und dabei ist die Seite kaputtgegangen

Das Zusammenlegen brauchte eine Zeile, damit die alten Aufrufer nichts ändern
müssen:

```js
export { FRACHTMODELL, frachtbetrag, frachtsatzbefund } from './frachtsatz.js';
```

Danach lief alles grün: der Bau, `npm test` mit 2.471 Fällen, der Schnelllauf
mit 49 Prüfern, die Bestellprobe mit 17 von 17. **Die Oberflächenprobe hing.**
Zwanzig Minuten, ohne eine Zeile Ausgabe.

Der Grund stand wörtlich in `demo.html`, Zeile 757: die Weiterausfuhr. Der
Bündelbauer ist ein Scanner ohne Parser — er entfernt `export ` **vor einer
Deklaration** und kannte die Weiterausfuhr nicht. Die Seite lud ein Modul, das
eine Datei `./frachtsatz.js` neben sich verlangte, die dort nicht liegt. **Kein
Skript, keine Oberfläche, kein Fehler — nur Warten.**

### Warum beide Syntaxprüfungen nichts fanden

Beide Bauwerke prüfen das fertige Skript mit `node --check`, und beide gingen
aus **verschiedenen** Gründen daran vorbei:

| | geprüft als | ausgeliefert als | warum es durchging |
|---|---|---|---|
| `ausgabe/site/shop.js` | `skript.mjs` — Modul | klassisches `<script src>` | in einem Modul ist `export` gültige Syntax |
| `demo.html` | `skript.mjs` — Modul | `<script type="module">` | syntaktisch in Ordnung; `--check` löst keine Einfuhren auf |

> **Eine Syntaxprüfung fragt, ob der Text ein Programm ist. Sie fragt nicht, ob
> es dasselbe Programm ist, das ausgeliefert wird.**

Gefunden hat es keine Prüfung, sondern ein **Zeitablauf**. Das ist der
schlechteste Fundweg, den dieser Bestand kennt: Er sagt nicht, was falsch ist,
und er sagt es erst nach zwanzig Minuten.

### Was jetzt fragt

`fremdeModulzeilen(quelle)` in `src/buendel.js`, gerufen von **beiden**
Bauwerken vor der Syntaxprüfung. Die Frage ist nicht „parst das?", sondern:

> **Ein fertiges Bündel ist geschlossen. Jede `import`- oder `export`-Zeile
> darin ist eine Zeile, die der Bauer nicht verstanden hat.**

`npm run build` bricht jetzt ab und nennt Zeile und Text. Und die Prüfung von
`shop.js` läuft seither gegen `skript.js` statt `skript.mjs` — geprüft wird, wie
ausgeliefert wird.

Die Weiterausfuhr selbst ist weg. Wer die drei Namen braucht, holt sie aus
`frachtsatz.js` — die ehrlichere Zeile: **eine Quelle für jede Zahl.**

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `das-buendel-traegt-wieder-eine-modulzeile` | der Wächter über geschlossene Bündel fällt weg |
| `die-frachtzahl-steht-wieder-zweimal` | `kundenWarenkorb` rechnet die Frachtzeile wieder selbst |
| `das-frachtmodell-wird-wieder-nicht-gelesen` | die Modellprüfung fällt weg |
| `die-fracht-faellt-wieder-auf-null` | `?? 0` kehrt zurück — die Kasse zeigt wieder frei Haus |
