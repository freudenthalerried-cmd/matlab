# Zwei Schreibweisen einer Zahl

**13. September 2026, zehnte Runde des Tages.** Das Zwillingsregister führt
drei Zahlen und sagt über sich selbst:

> „Drei Funde durch Zufall sind kein Grund zu glauben, es seien die letzten."

Zwei Tage später führt es immer noch drei. Diese Runde sucht sie **systematisch
statt zufällig**: alle 58 benannten Zahlkonstanten des Rechenkerns, jede gegen
jede Quell- und Datendatei gehalten.

## Das Rauschen und die zwei Namen

Die meisten Treffer sind wertlos — `6`, `7`, `10`, `14`, `40` stehen überall
und meinen jedes Mal etwas anderes. Genau davor warnt das Register im eigenen
Kopf: *„Es ist keine Jagd auf doppelte Literale."*

Zwei Kandidaten blieben übrig, beide schmal und beide an Geld:

```
0.2   UST_SATZ_KUNDE   src/shopkern.js   ->  src/skonto.js
7.5   JE_HUB_NETTO     src/huebe.js      ->  data/lieferanten.json, bin/website.mjs
```

## Der Fund

`src/skonto.js`, Zeile 119:

```js
const { skontoSatz = SKONTO_SATZ, ust = 0.2, bearbeitungstage = 2 } = opt;
```

Der österreichische Normalsteuersatz, als unbenannter Vorgabewert in einer
Parameterliste. `src/skonto.js` führt `preis.js` bereits ein — für `cent`. Der
Steuersatz hätte eine Zeile mehr im Import gekostet.

Und die Beschreibung dieses Fehlers steht seit dem **30. August** im Bestand,
in der Nachbardatei, über der Konstante, die dort dasselbe war:

> „**Am 30.08. abgesichert.** Bis dahin stand die Zahl als `0.2` im Vorgabewert
> einer Parameterliste — **nicht falsch, aber unauffindbar** …"

> **Vierzehn Tage lang stand sie unauffindbar in der Nachbardatei weiter.**

## Warum niemand sie sah

Das Register vergleicht **Zeichenketten**. Es sucht `0.20`. In `skonto.js` und
in `shopkern.js` steht `0.2`.

```js
const muster = new RegExp(`(^|[^0-9.])${e.literal.replace('.', '\\.')}([^0-9]|$)`);
```

> **Zwei Schreibweisen derselben Zahl sind dieselbe Zahl. Ein Register, das
> Zeichen vergleicht statt Werte, führt genau die Zwillinge, die niemand
> versteckt hat.**

Die Vorrunde hatte die Suche auf `data/*.json` ausgedehnt, weil sie am
**Dateityp** endete. Sie endete auch an der **Schreibweise** — eine Ebene
tiefer, dieselbe Art von Grenze.

Über den ganzen Bestand gemessen, verbirgt diese Grenze genau drei
Fundstellen:

| Datei | steht als | Lage |
|---|---|---|
| `src/shopkern.js` | `0.2` | begründet: `UST_SATZ_KUNDE`, von zwei Testfällen gegen `UST_SATZ` gehalten |
| `src/skonto.js` | `0.2` | **unbegründet** — der Fund |
| `src/gegenprobenregister.js` | `0.2500` | zitiert Quelltext, steht ohnehin außerhalb |

## Was geändert wurde

**`skonto.js` liest den Steuersatz**, statt ihn als Vorgabewert zu führen.

**Das Register vergleicht Werte.** `traegtZahl(text, literal)` liest jede Zahl
als eigenes Wort und vergleicht sie als Zahl. Die Fallen, die das alte Muster
kannte, bleiben: `0.20` trifft weiterhin nicht in `0.255`, nicht in `10.20` und
nicht in einem Bezeichner wie `satz0`.

**`src/shopkern.js` steht jetzt als begründete Ausnahme** — mit dem Grund, den
es immer schon hatte, und den beiden Testfällen, die ihn halten. Sichtbar war
diese Fundstelle bis heute nicht; das Register führte sie also nicht, weil sie
in Ordnung ist, sondern weil es sie nicht sah. Der Unterschied ist der ganze
Punkt dieser Runde.

## Was offen bleibt

`JE_HUB_NETTO = 7.5` steht in `src/huebe.js` und als
`kranentladungJeHubNetto: 7.5` in `data/lieferanten.json` — Code gegen Daten,
dieselbe Bauart wie die Palettenzahl vom Vortag. Sie ist **nicht** in dieser
Runde aufgelöst: Die eine ist der Satz des Lieferanten uns gegenüber, die
andere die Zahl, mit der dieses Haus rechnet, und ob das dieselbe Zahl sein
muss, ist eine Frage an den Bestand und nicht an die Schreibweise. Sie steht
damit als nächster Faden da, nicht als erledigt.

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `das-register-vergleicht-wieder-zeichen` | der Abgleich vergleicht wieder Schreibweisen |
| `der-steuersatz-steht-wieder-im-vorgabewert` | `skonto.js` bekommt seine eigene `0.2` zurück |

Die zweite misst den **Quelltext**, nicht das Ergebnis: Dass der Vorgabewert
heute denselben Wert trägt, ist kein Schutz — er ist eine zweite Zahl, und eine
zweite Zahl ist irgendwann alt.
