# Drei Steuersätze und ein Abgleich

**Stand: 30. August 2026** · Ein Lauf, der mit einem Fehlurteil begann.
Betroffen: `shop/src/kontrolle.js`, `shop/src/shopkern.js`,
`shop/bin/website.mjs`, `shop/shop-ui.js`, `shop/test/kontrolle.test.js`.

## Der scheinbare Befund

Die Suche nach dem Muster dieser Woche — dieselbe Zahl an mehreren Orten —
führte auf den Umsatzsteuersatz. Er steht an **drei** Stellen:

| Ort | Form |
|---|---|
| `preis.js` | `export const UST_SATZ = 0.20` |
| `kontrolle.js` | `const UST_SATZ = 0.20` — privat, nicht importiert |
| `shopkern.js` | `ust = 0.2` als Vorgabewert einer Parameterliste |

Dazu der Text „20 %" als Zeichenkette an drei weiteren Stellen: auf der
Artikelseite, in der Fußzeile jeder Seite und im Warenkorb der Oberfläche.

Sechs Orte für eine Zahl. Das sah aus wie der Befund von gestern, vorgestern
und vorvorgestern, und ich habe entsprechend gehandelt: den privaten
Steuersatz in `kontrolle.js` gelöscht und aus `preis.js` importiert.

## Warum das falsch war

`kontrolle.js` hat keinen einzigen Import. Das steht in ihrem Kopf, und ich
hatte es gelesen, bevor ich es tat:

> „Die zweite Rechnung — bewusst anders gebaut als die erste. […] Die
> Testfälle rechnen mit denselben Funktionen nach, die sie prüfen sollen. Ein
> Denkfehler, der in beide Richtungen gleich falsch ist, fällt dabei nicht
> auf."

Diese Datei liest den **gerenderten Belegtext** zurück und rechnet aus den
Zeichen nach. Ihr Wert liegt gerade in der Unabhängigkeit. Ein
Kontrollwerkzeug, das seine Vergleichsgröße von dem holt, was es prüft,
kontrolliert nicht — es bestätigt.

> **Eine Regel, die man ohne den Fall anwendet, macht die Sache schlechter.**

Der Import ist zurückgenommen. Dasselbe gilt für `shopkern.js`: Dort steht der
Satz noch einmal, weil `preis.js` die Margenregel trägt und nicht in den
Browser darf — dieselbe Begründung, aus der `kundenWarenkorb` überhaupt
existiert.

## Was wirklich fehlte

Nicht die Vereinheitlichung, sondern **der Abgleich**. Was eine begründete
Doppelung von einer unbegründeten unterscheidet, ist nicht die Absicht,
sondern die Probe, die beide zusammenhält. Für den Warenkorb gab es sie längst
(`kundenWarenkorb` gegen `berechneWarenkorb`), für den Steuersatz nicht.

Jetzt steht sie da:

- **`UST_SATZ_KUNDE === UST_SATZ`** — die Kundenseite rechnet mit demselben
  Satz wie der Kern.
- Der Satz in `kontrolle.js` wird **aus dem Quelltext gelesen** und
  danebengehalten. Kein Import, keine Kopplung: Der Prüfer bleibt unabhängig,
  und die Zahl darf trotzdem nicht auseinanderlaufen.
- Und wenn die Kontrolle eines Tages gar keinen eigenen Satz mehr führt,
  schlägt die Probe ebenfalls an — dann wäre sie keine zweite Rechnung mehr.

Nebenbei bekam der Vorgabewert `0.2` einen Namen (`UST_SATZ_KUNDE`). Eine Zahl
in einer Parameterliste ist nicht falsch, aber unauffindbar.

## Der Text war die eigentliche Lücke

„20 % USt" stand als Zeichenkette neben einem Betrag, den eine andere Zahl
erzeugt hat. Beträge und Beschriftung hingen an nichts. Ein geänderter Satz
hätte **richtige Beträge unter falscher Beschriftung** ergeben — der
unangenehmste Fehler von beiden, weil die Summe stimmt und niemand nachrechnet.

`ustText()` erzeugt die Beschriftung aus derselben Zahl, an allen drei Stellen.
Der Testfall prüft nicht nur „20 %", sondern auch, dass ein anderer Satz einen
anderen Text ergibt und ein halber Prozentpunkt nicht verlorengeht
(`0,075 → 7,5 %`).

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| `kontrolle.js` auf 0,19 | drei Belegproben fallen, dazu die neue |
| `UST_SATZ_KUNDE` auf 0,19 | die neue Probe und der Warenkorbabgleich fallen |

Die erste Zeile ist bemerkenswert: Die Doppelung war schon indirekt
abgesichert, weil die Belegproben durch beide Rechnungen laufen. Die neue
Probe macht das **benannt** statt zufällig — sie sagt, welche Zahl mit welcher
übereinstimmen muss, statt es aus einem Summenfehler folgern zu lassen.

## Nebenbei: der Wächter von heute früh hat gegriffen

Nach den Gegenproben habe ich die Quelldateien zurückgesetzt und die Shopprobe
gestartet, ohne neu zu bauen. Sie brach ab:

```
Abbruch: ausgabe/website.html ist älter als 2 Quelldatei(en)
  src/kontrolle.js, src/shopkern.js
Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.
```

Genau der Fall, für den die Sperre heute früh gebaut wurde — und der erste,
in dem sie einen echten Fehler verhindert hat, nämlich meinen.
