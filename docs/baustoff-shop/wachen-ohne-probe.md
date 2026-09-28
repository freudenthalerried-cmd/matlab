# Fünf Wachen, die nie ausgelöst haben — gemessen statt vermutet

**31. August 2026.** Zwei Durchgänge hintereinander endeten mit demselben
Satz: *Eine Wache, die keine Probe auslösen kann, ist eine Vermutung.* Erst
der Rückfall in `veroeffentlichung.mjs`, dann die beiden Grenzwächter in
`sprungziel`. Zweimal derselbe Befund heißt: einmal richtig durchzählen.

## Der erste Anlauf war der falsche

Die naheliegende Messung — alle `throw new Error` in `src/` sammeln und
nachsehen, welche Fehlermeldung in keiner Testdatei vorkommt — ergab:

```
76 throw-Wachen in src/, davon 70 von keiner Probe erwähnt
```

Das sah nach einem großen Befund aus und war eine schlechte Messung. Ein
`assert.throws(() => …)` ohne Textmuster prüft die Wache sehr wohl; mein Griff
zählte nur, wer die Meldung wörtlich zitiert.

> **Eine Messung, die das Falsche misst, meldet umso lauter, je falscher sie
> misst.** Siebzig klang nach Arbeit für eine Woche.

## Der zweite Anlauf misst, was passiert

`node --test --experimental-test-coverage` sagt zeilengenau, was der Testlauf
**ausführt**. Eine `throw`-Zeile gilt nur als erreicht, wenn sie geworfen hat.
Die Schnittmenge aus „nicht ausgeführt" und „ist ein `throw`" ist die
gesuchte Liste — und sie ist kurz:

| Wache | was sie verhindert |
|---|---|
| `preis.js:70` | Zielmarge außerhalb 0–1: Marge 1 ergibt Division durch null, also `Infinity` als Verkaufspreis |
| `buendel.js:50` | derselbe Name in zwei Modulen — im Bündel ein SyntaxError, der die ganze Seite stilllegt |
| `speicher.js:69` | unlesbare Belegnummer im Journal: der Zähler bliebe still falsch und vergäbe eine Nummer zweimal |
| `speicher.js:130` | unbekannte Vorgangsart beim Laden des Journals |
| `entkommentieren.js:161` | regulärer Ausdruck ohne Ende beim Entkommentieren des Bündels |

**Fünf von 76**, nicht siebzig. Der Bestand steht also weit besser da, als der
erste Griff behauptete — und die fünf sind es wert, einzeln angesehen zu
werden.

## Vier davon sind das ungeprüfte Geschwister eines geprüften

Das ist das Muster, nicht der Zufall:

- `buendel.js` prüft den **Ringschluss** seit langem; die **Namenskollision**
  daneben nicht — obwohl genau sie schon einmal zugeschlagen hat. Zwei Module
  trugen je eine Hilfsfunktion `EUR`, einzeln geladen harmlos, im
  zusammengefügten Skript ein SyntaxError. Die Tests blieben grün, weil sie
  die Module einzeln laden.
- `preis.js` weist **unsinnige Rabatte** in `einkaufspreis` seit langem ab;
  die **unsinnige Zielmarge** in `verkaufspreis` stand ohne Fall da.
- `entkommentieren.js` hat vier Abbrüche derselben Familie — Blockkommentar,
  Zeichenkette, Vorlagenliteral, regulärer Ausdruck. Keiner hatte eine Probe.
- `speicher.js` prüft die **gerissene Zeitfolge** und das **fehlende
  Verzeichnisfeld**; die Belegnummer und die Vorgangsart nicht.

Der reguläre Ausdruck ist der heikelste der fünf: Ein Schrägstrich ist mal
Division, mal Ausdrucksanfang. Verliest sich der Scanner, hält er den halben
Rest der Datei für einen Ausdruck und entfernt als „Kommentar", was Code war.
Das Erzeugnis wäre lauffähig aussehender Unsinn — deshalb Abbruch statt
Annahme, und deshalb gehört gerade hier eine Probe hin.

## Gegenproben

Jede der fünf Wachen entfernt, jede Datei gesichert und zurückgesetzt:

| entfernte Wache | erkannt |
|---|---|
| `preis.js` Zielmarge | ja |
| `buendel.js` Namenskollision | ja |
| `speicher.js` Belegnummer | ja |
| `speicher.js` Vorgangsart | ja |
| `entkommentieren.js` regulärer Ausdruck | ja |

Beim letzten schlug die erste Mutation fehl, weil mein Ersetzungsbefehl `\n`
als echten Zeilenumbruch schrieb statt als die zwei Zeichen im Quelltext — die
Mutation griff gar nicht, und die grüne Meldung galt einer unveränderten
Datei. Wiederholt mit richtiger Maskierung, dann erkannt. **Eine Gegenprobe,
die nicht angekommen ist, meldet Grün wie eine bestandene.**

Zu jeder neuen Probe die Gegenrichtung, damit die Wache nicht zu scharf wird:
Null Marge ist gültig (Verkauf zum Einkaufspreis), eine Division ist kein
regulärer Ausdruck, wiederholte Namen im Rumpf sind keine Doppeldeklaration,
und eine bekannte Vorgangsart muss durchkommen.

## Nachgemessen

```
unerreichte throw-Wachen in src/: keine
```

Zeilendeckung über `src/` 97,97 %. Die verbleibenden Lücken sind keine
Wachen mehr.

## Stand

977 Testfälle grün (vorher 969), `pruefe-tests` 975/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 204/204.
