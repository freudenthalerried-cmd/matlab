# Die leere Allaussage

**9. September 2026.** Die Runde davor fand zwei Testfälle, die über eine
Liste laufen und bei leerer Liste nichts prüfen. Die Frage danach war nicht,
ob das behoben ist, sondern ob **dieselbe Lücke eine andere Schreibweise
hat.**

Sie hat eine:

```js
assert.ok(liste.every((x) => …));   // bei leerer Liste: true
```

`Array.prototype.every` auf der leeren Liste ist `true` — die leere
Allaussage. Für die Zusicherung ist das dasselbe wie eine Schleife, die nicht
läuft: **grün, ohne etwas geprüft zu haben.**

Gemessen, bevor gebaut: **23 Fundstellen** im Testbestand.

> **Eine Regel, die nur eine Schreibweise kennt, prüft die Schreibweise und
> nicht die Sache.**

---

## Acht von neun waren echt

Regel 4 in `pruefe-tests` misst denselben Umstand wie Regel 3 — steht in
derselben Zusicherung oder davor eine Aussage über die Länge **dieser** Liste?
Erster Lauf: **neun Verdachtsfälle** von 2009 Testfällen.

Acht sind behoben, jeder mit einer Zusicherung, die sagt, warum sie dasteht:

| Datei | Was leer sein konnte |
|---|---|
| `abgleich.test.js` | die Schritte des Ablaufs |
| `auftragslauf.test.js` | das Protokoll des Vollausbaus |
| `beleg.test.js` | die betroffenen Auslandslieferanten |
| `gebinde.test.js` | die Meldungen des Einheitenbefunds |
| `maschinenlesbar.test.js` | die Feed-Einträge mit Lücken |
| `shopkern.test.js` | die Wortstämme |
| `warenkorb.test.js` | die Katalogartikel |

Der neunte war ein **Fehlalarm der Regel selbst**: `quellen.test.js:176`
schreibt `assert.ok(!a.quellen.every(…))`. Eine **verneinte** Allaussage ist
auf der leeren Liste `!true`, also `false` — die Zusicherung fiele durch,
statt still zu bestehen. Die Falle gibt es dort nicht, und die Regel schließt
verneinte Ausdrücke seither aus.

> **Ein Prüfer, der Lärm macht, wird ruhiggestellt statt befolgt.**

---

## Der eine, der bleiben durfte

```js
// Kein Schleifenkörper: `ohne` ist bei einem stummen Wort leer, und das
// ist der Regelfall. Eine Längenzusicherung wäre hier falsch — geprüft
// wird, dass nichts wegfällt, nicht dass etwas da war.
assert.ok(ohne.every((id) => mit.includes(id)), …);
```

Der Kommentar stand dort, bevor es die Regel gab. Er hat recht: Geprüft wird,
dass das Wortregister **keine Treffer wegnimmt**. Eine Längenzusicherung
verlangte, dass jedes der achtzehn Wörter vorher schon etwas fand — genau die
Behauptung, die der Testfall widerlegt.

> **Ein Prüfer, der einen richtigen Testfall zwingt, falsch zu werden, ist
> schlechter als keiner.**

Deshalb ein **Register** statt einer Ausnahme im Code: `OHNE_LAENGENZUSICHERUNG`
mit Datei, Fallnamen, Ausdruck und Pflichtgrund — und in **beide Richtungen**
gehalten. Ein Eintrag, dessen Stelle die Regel gar nicht mehr auslöst, ist
selbst ein Befund und macht den Lauf rot; sonst sammeln sich hier Freibriefe
für Stellen, die es nicht mehr gibt.

**Beide Richtungen gezeigt, nicht behauptet:**

| Eingriff | Meldung |
|---|---|
| Längenzusicherung in `warenkorb.test.js` entfernt | 1 mit Verdacht |
| Ausdruck im Register verfälscht | „1 Eintrag greift nicht mehr", Ausgang 1 |

### Die Gegenrichtung war beim ersten Anlauf selbst falsch

Der eigene Testfall dieses Prüfers hat sie umgeworfen, bevor sie hinausging:

```
not ok — der Prüfer findet in der Probedatei jedes Muster …
  mit --bericht bleibt der alte Weg offen: 1 !== 0
```

Zwei Fehler in vier Zeilen. Sie sah `--bericht` nicht an — und schwerer: Sie
urteilte über das Register, **egal welchen Ordner sie gerade las.** Der
Prüfer läuft im eigenen Testfall über einen Probeordner, und dort ist der
Eintrag zu Recht ungenutzt: Der gemeinte Testfall steht dort gar nicht.

> **Die Gegenrichtung eines Registers muss wissen, über welchen Bestand sie
> spricht. Sonst meldet sie eine Lücke, wo nur jemand woanders hingesehen
> hat.**

Sie gilt jetzt nur für den eigenen Bestand und schweigt mit `--bericht`.
Danach beide Nachweise erneut geführt, mit demselben Ergebnis.

---

## Was das über die vorige Runde sagt

Gestern stand hier: *„Ein Testfall, der über eine Liste läuft, prüft die
Liste — nicht die Regel."* Der Satz war richtig und zu eng gefasst. Er hätte
lauten müssen:

> **Jede Aussage über *alle* Glieder einer Liste ist wahr, wenn die Liste leer
> ist. Wer die Regel meint, muss zuerst zusichern, dass es etwas zu prüfen
> gibt** — gleich, ob er das mit `for`, mit `every` oder mit einem `filter`
> aufschreibt.

Der Prüfer kennt jetzt zwei der drei Schreibweisen. `filter(…).length === 0`
ist die dritte und im Bestand nicht als Zusicherung über alle Glieder im
Gebrauch; sie steht als offener Punkt und **nicht** als gebaute Regel — eine
Regel ohne Fall im Bestand lässt sich nicht anschlagen sehen, und was man
nicht anschlagen sieht, ist keine.
