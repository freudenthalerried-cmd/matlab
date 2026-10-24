# Der Zwillingsblick endete am Dateityp

**13. September 2026, neunte Runde des Tages.** Die Vorrunde fand eine Zahl,
die zweimal existierte: 22,00 € je Palette in `data/lieferanten.json`, 13,47 €
in `src/palettenkreis.js`. Neun Tage unbemerkt.

Dafür gibt es einen Prüfer. Die Frage dieser Runde: **Warum hat er
geschwiegen?**

## Der Prüfer und seine Grenze

`src/zwillingszahlen.js` gibt es seit dem 11. September, und sein Kopf sagt,
wofür:

> „Drei Tage hintereinander ist dieselbe Bauart aufgefallen, jedes Mal durch
> Zufall und jedes Mal an einer Zahl, an der Geld hängt. … Jedes Mal stand die
> Gleichheit in einem **Satz** … und nicht in einem Aufruf.
>
> **Drei Funde durch Zufall sind kein Grund zu glauben, es seien die letzten.**"

Er liest:

```js
for (const ordner of ['src', 'bin']) {
  …
  if (!statSync(pfad).isFile() || !/\.(js|mjs)$/.test(name)) continue;
```

> **Die Suche endete am Dateityp** — bei genau den Orten, an denen eine Zahl
> einen Namen haben kann. Die zweite Fassung stand woanders.

## Gemessen

`data/zielgroessen.json` trägt zwei der drei geführten Zahlen ein zweites Mal
— und jede mit einem Satz daneben, der die Gleichheit behauptet:

| Feld | Wert | der Satz daneben |
|---|---|---|
| `rohmarge` | 0.25 | „Muss mit ZIELMARGE in src/baustoffkatalog.js uebereinstimmen." |
| `umsatzProSession` | 0.02 | „DIESELBE GROESSE wie die Kaufquote der Kampagne." |

Genau die Bauart, für die das Register gebaut wurde. Es sah sie nicht.

> **Eine Zahl in einer Datendatei ist genauso eine zweite Fassung wie eine im
> Quelltext.** Sie kann dort sogar schlechter stehen: In JSON gibt es keinen
> Import, mit dem man die Heimat läse.

Über alle Datendateien gesucht, ergeben die drei geführten Literale genau diese
zwei Fundstellen — die Erweiterung bringt also keine Flut, sondern zwei Namen.

## Und eine davon war wirklich ungehalten

Beim Nachsehen, ob die beiden wenigstens anderswo gehalten werden, zeigte sich
eine ungleiche Lage. `test/empfindlichkeit.test.js` hält **zwei** der drei
Zielgrößen mit Heimat gegen sie:

```js
assert.equal(LAGE.rohmarge, ZIELMARGE, …);
assert.equal(LAGE.frachtProBestellungNetto, lieferant.fracht.pauschaleNetto, …);
```

Für die dritte stand nur:

```js
for (const feld of ['zielgewinn', …, 'umsatzProSession']) {
  assert.ok(String(LAGE[`_${feld}Hinweis`] ?? '').length > 20, …);
}
```

> **Eine Notiz, die sagt „dieselbe Größe", ist keine Prüfung, dass es dieselbe
> Zahl ist.**

Geprüft war, dass die Herkunftsnotiz **existiert** — nicht, dass sie stimmt.
Und es ist die Zahl, mit der jedes Höchstgebot je Klick multipliziert wird:
Läuft sie weg, rechnet die Empfindlichkeitsanalyse mit einer anderen Quote als
die Kampagne, und beide melden für sich plausible Zahlen.

Dass die beiden heute übereinstimmen, ist geprüft — seit heute.

## Was geändert wurde

**Der Zwillingsabgleich liest `data/*.json`.** Beide Fundstellen stehen jetzt
als begründete Ausnahme im Register, und die Begründung nennt jeweils den
Testfall, der die Zahl wirklich hält — für die Kaufquote also erst, seit es ihn
gibt.

Das ist der Punkt an der Ausnahmeform dieses Registers: Sie zwingt dazu, den
Grund **hinzuschreiben**. Für `rohmarge` war er schon da. Für
`umsatzProSession` hätte ich ihn hinschreiben können, ohne dass er gestimmt
hätte — und genau das wäre der Fehler gewesen, den dieser Bestand am häufigsten
findet: eine Zusicherung, die niemand nachmisst.

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `der-zwillingsblick-endet-am-dateityp` | der Prüfer liest wieder nur `src/` und `bin/` |
| `die-kaufquote-laeuft-von-ihrer-heimat-weg` | `zielgroessen.json` bekommt 0,03 statt 0,02 |

Die zweite setzt an den **Daten** an und nicht am Testfall. Der erste Entwurf
tat es andersherum — er machte die Zusicherung tautologisch — und schlug nicht
an: **Ein leergemachter Testfall wird grün, nicht rot.** Eine Gegenprobe muss
den Prüfer rot sehen, nicht den Prüfling verstummen lassen.
