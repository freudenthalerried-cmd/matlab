# Was die Gruppenseite verspricht

**Stand: 30. August 2026** · Zwei zusammenhängende Befunde eines Laufs.
Betroffen: `shop/src/shopkern.js`, fünf Dateien in `shop/inhalte/gruppen/`,
`shop/data/suchwoerter.json`, `shop/test/shopkern.test.js`.

## Erster Befund: „bogen" fand nichts

Beim Nachprüfen der Gruppenseiten fiel auf, dass **„bogen" keinen Artikel
findet** — obwohl der Shop zwei *PVC Kanalbögen* führt. Vor dem Wortstamm von
gestern fand es beide. Das ist eine Verschlechterung, die ich selbst
eingebaut habe.

Der Grund ist eine Unsymmetrie der Mindeststammlänge. Sie gilt für das ganze
Wort:

| Wort | Stamm | warum |
|---|---|---|
| `kanalbogen` | `kanalbog` | acht Zeichen bleiben — die Endung fällt |
| `bogen` | `bogen` | `bog` wäre zu kurz — die Endung bleibt |

Die Suche findet ein kürzeres Wort in einem längeren. Aber `kanalbog` enthält
`bogen` nicht mehr.

> **Der Stamm half der Beugung und schadete dem Wortteil.**

Behoben, indem der **Index** beides trägt — den Stamm für die Beugung, die
ungestutzte Normalform für den Wortteil. Die **Frage** trägt weiterhin nur
den Stamm: Dort müssen alle Wörter treffen, und zwei Formen desselben Wortes
wären zwei Bedingungen statt einer.

Gegengemessen über alle 162 Wörter des Bestands, alter Stand gegen neuen:
**null Verluste, null unerwartete Gewinne** — und die 35 Numeruspaare von
gestern bleiben bei 35 von 35.

## Zweiter Befund: fünf Seiten versprachen, was die Gruppe nicht führt

Der eigentliche Anlass. Jede Gruppenseite beginnt mit „Wir führen …". Diesen
Satz gegen den Katalog gehalten:

| Seite | versprach | tatsächlich |
|---|---|---|
| Mörtel | „Thermo- und **Mauermörtel**" | kein Mauermörtel im Sortiment |
| Mauerwerk | „**Planziegel** für den Hochbau" | ein Hochlochziegel mit Nut und Feder |
| Kamin | „**Anschluss**- und Putztürformteile" | nur der Putztüranschluss |
| Zubehör | „Schrauben und **Dübel**" | die Dübel stehen unter WDVS |
| Dämmung | „Trittschall- und **Trennlagen**" | die Trennlage steht als Folie beim Zubehör |

Drei Arten von Fehler in einer Tabelle: Ware, die es **nicht gibt**
(Mauermörtel, Anschlussformteil), Ware unter **falschem Namen** (Planziegel
statt Hochlochziegel — die beiden sind nicht dasselbe), und Ware in einer
**anderen Gruppe** (Dübel, Trennlage).

Das Gewicht liegt wieder darin, wo diese Sätze landen: `kurz` wird zur
Meta-Beschreibung, zur JSON-LD-Antwort und zur Zeile in `llms.txt`. Ein Kunde,
der auf „Mörtel" klickt, weil er Mauermörtel braucht, bekam ein Versprechen,
das die Gruppe nicht hält — und ein Sprachmodell hätte es weitergegeben.

Alle fünf Sätze sind berichtigt, im Fließtext **und** im Kopffeld `kurz`,
und `stand:` ist mitgezogen. Wo die Ware in einer anderen Gruppe steht, sagt
der Satz jetzt, in welcher.

## Acht Wörter, die der Shop selbst benutzt

Beim Messen zeigte sich das Gegenstück: Wörter, die auf den **eigenen**
Seiten stehen und im Katalog nichts finden.

| Wort auf der Seite | Artikel im Katalog |
|---|---|
| Fassadenplatte | Fassaden EPS 2/3/5 cm |
| Perimeterplatte | XPS glatt SF |
| Innenrohr | SIKM Rohr 133 cm gedämmt |
| Putztüranschluss, Putztürformteil | SIKM Putztüranschlusspaket |
| Klebemasse | Capatect Klebe- **und** Spachtelmasse |
| Grundmauerschutzbahn | Grundmauerschutz 20 / 1,5 m |
| Trittschalldämmplatte | Isover TDPT |

Acht Einträge im Kundenwörter-Register, jeder mit Begründung; 45 werden 53.
Bemerkenswert ist die Herkunft: Das sind keine Wörter von der Baustelle,
sondern **die eigenen Positionslisten**. Die Systemliste Kellerwand nennt
Position 2 „Perimeterplatte XPS" — und die Suche desselben Shops fand sie
nicht.

## Die Probe und ihre Grenze

Ein Werkzeug kann nicht entscheiden, welches Wort in einem Satz Ware
bezeichnet: „Auswahl", „Einbauort" und „Wärmeschutznachweis" stehen in
denselben Sätzen. Deshalb steht die Liste der Versprechen von Hand da — 32
Einträge, wie das Kundenwörter-Register — und zwei Proben halten sie fest:

1. **Jedes Versprechen ist einlösbar.** Jedes Wort findet einen Artikel, und
   zwar in der genannten Gruppe. Steht die Ware in einer anderen, muss der
   Eintrag das ausdrücklich sagen — und der Satz auf der Seite auch.
2. **Die Liste steht wirklich auf den Seiten.** Jedes Wort kommt im
   Antwortsatz seiner Gruppe vor, am Wortstamm gemessen. Ohne diese zweite
   Probe könnte die Liste zu einer Erzählung werden, die neben den Seiten
   herläuft — die Gegenprobe zeigte genau das: Der alte Wortlaut „Mauermörtel"
   im Satz ließ die erste Probe unberührt.

**Was beide nicht leisten:** ein *neues* Warenwort im Satz bemerken. Wer
morgen „Fliesenkleber" in einen Antwortsatz schreibt und die Liste nicht
anfasst, kommt durch. Dafür bräuchte es ein Wörterbuch, das Ware von
Nichtware trennt; das wäre eine dritte Liste von Hand, und drei Listen für
eine Frage sind zwei zu viel. Die ehrlichere Absicherung ist der Blick beim
Schreiben — und die Regel, dass ein neuer Satz die Liste mitführt.

## Offen geblieben

Auf den Systemlisten stehen Positionen, zu denen es keinen Artikel gibt. Bei
der Fassade ist das ausdrücklich vermerkt („Position 2 steht auf der Liste,
aber nicht im Regal"), beim Kaminzug bisher nicht — dort ist das
Anschlussformteil der Feuerstätte Position 6 ohne Hinweis; die Gruppenseite
sagt es seit heute, die Systemliste noch nicht. Bei Kanal und Kellerwand
betrifft es Positionen fremder Gewerke (Abdichtung, Verfüllung, Gleitmittel),
die im Text begründet sind. Ein Zensus „jede Position hat einen Artikel oder
einen Hinweis" wäre der nächste Schritt.
