# Eine Klammer zu viel, und elf grüne Läufe

*5. September 2026. Runde 124.*

## Der Befund

```
$ npm run shopprobe

file:///…/shop/bin/shopprobe.mjs:982
}
^
SyntaxError: Unexpected token '}'
```

Dieselbe geschweifte Klammer zu viel steht in `bin/oberflaechenprobe.mjs`.
Beide seit dem **4. September, 12:21 Uhr** — nachgerechnet über die
Versionsgeschichte, indem jede Fassung durch den Übersetzer geschickt wurde.

> **64 Browserszenarien, und die beiden Dateien, die sie fahren, ließen sich
> nicht einmal einlesen.** Fünfzehn Stunden. Elf Gesamtläufe. Jeder grün.

Die beiden Dateien sind die Verhaltensproben dieses Shops: 11 Szenarien in der
Oberflächenprobe, 53 in der Shopprobe. Sie prüfen, was ein Mensch im Browser
sieht — Warenkorb, Suche, Tastaturbedienung, Umbruch bei 390 Pixel,
Gebietsauskunft, Kasse.

## Aus welcher Runde die Klammer stammt

Aus `d1e5eb9`, „Das Erzeugnis von gestern". Das war die Runde, die den
**Frischeschutz** eingebaut hat: die Weigerung, gegen ein veraltetes Erzeugnis
zu prüfen. Der eingefügte Block sieht so aus:

```js
{
  const stand = frischebefund(join(hier, '..'), 'demo.html');
  if (!stand.frisch) { … process.exit(2); }
}
}          ← eine zu viel
```

> **Die Runde, die verhindern sollte, dass eine Probe die Vergangenheit misst,
> hat dafür gesorgt, dass zwei Proben gar nichts messen.**

## Warum es fünfzehn Stunden gedauert hat

`npm run alles` holt die Browserproben **nicht** ab. Das ist eine bewusste
Entscheidung und steht seit dem 1. September im Prüferregister: Jede kostet
einen Chromium-Start, zusammen gut eine Minute. Mit `--mit-browser` kommen sie
dazu.

> **Der einzige Schutz davor, dass sie verrotten, war ein Schalter, den
> niemand umlegt.**

Und keine der anderen Prüfungen liest diese Dateien. `pruefe-tests` liest den
Quelltext der **Testdateien**, `pruefe-sperren` ebenfalls, `pruefe-ungerufen`
sucht Aufrufe. Ein Werkzeug in `bin/`, das der Regellauf nicht ausführt, wurde
von nichts angefasst.

## Was gebaut wurde

`npm run pruefe-lesbar` — die unterste Stufe:

```
Lesbarkeit: 254 Quelldateien mit dem Übersetzer eingelesen
1× .php, 61× .mjs, 192× .js
```

Geprüft wird mit dem **Übersetzer selbst** (`node --check`, `php -l`) und
nicht mit einem nachgebauten Leser. Was der Übersetzer nicht annimmt, ist
kaputt; was er annimmt, ist einlesbar. Eine zweite Meinung darüber wäre eine
zweite Fehlerquelle — dieselbe Überlegung wie bei der Klammerzählung in
`pruefe-tests`, die am 3. September einen Testfall übersprungen hat, weil sie
eine geschweifte Klammer in einer Zeichenkette mitzählte.

Zwei Eigenschaften machen die Prüfung aus:

1. **Sie erreicht jede Datei** — auch die, die aus Kostengründen aus dem
   Regellauf herausbleiben. Sie ist die einzige, von der das gilt.
2. **Sie steht ganz vorne.** Wer sie nicht besteht, ist kein Werkzeug, sondern
   Text; alles, was danach kommt, urteilt dann über etwas, das es nicht gibt.

Ein leerer Lauf ist auch hier kein grüner: Unter 200 gefundenen Dateien meldet
sie `zu-wenig-gefunden`. Dieselbe Regel wie `mindestens` im Prüferregister —
wer über nichts urteilt, urteilt nicht.

**Drei Sekunden gegen fünfzehn Stunden.**

## Und die Proben selbst?

Nach dem Flicken beide grün: 11 von 11 Szenarien in der Oberflächenprobe,
53 von 53 in der Shopprobe (davon 10 im 390-Pixel-Rahmen). Die Substanz war
in Ordnung — es ging wirklich nur um die eine Klammer. **Das ist die
unangenehmere Fassung des Befunds:** Wäre die Substanz kaputt gewesen, hätte
es fünfzehn Stunden lang genauso ausgesehen.

Gegenprobe `werkzeug-das-nicht-laedt` hängt die Klammer wieder an.
**54 Gegenproben für 33 Prüfer.**

## Die Lehre

Es ist der dritte Befund derselben Familie in acht Tagen, und diesmal in der
härtesten Form:

| Datum | Was verborgen blieb |
|---|---|
| 30.08. | Die Oberflächenprobe lief gegen ein veraltetes `demo.html` und meldete Grün |
| 03.09. | Drei von 53 Shopszenarien standen sechs Stunden rot, ohne dass ein Lauf es meldete |
| **05.09.** | **Beide Probendateien ließen sich nicht einmal einlesen** |

> **Was der Regellauf nicht anfasst, muss wenigstens gelesen werden.** Eine
> Probe, die nicht läuft, ist kein Risiko, solange jemand es weiß. Sie wird
> eines in dem Augenblick, in dem der Lauf daneben „alles grün" meldet.
