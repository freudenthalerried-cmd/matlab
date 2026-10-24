# Sieben Positionen von zehn

**Stand: 30. August 2026** · Befund und Behebung aus einem Lauf des
Arbeitsloops. Betroffen: `shop/inhalte/system/fassade-100-qm.md`,
`shop/inhalte/system/kellerwand-perimeter.md`,
`shop/src/inhaltspruefung.js`.

## Der Befund

Die Systemseiten sind das eigentliche Verkaufsargument dieses Shops. Sie
sagen nicht, was ein Produkt kostet, sondern **was zu einem Bauteil
zusammengehört** — samt der Spalte „wird oft vergessen", in der die kleinen
Positionen stehen, wegen derer eine Baustelle stillsteht.

Zwei dieser vier Seiten zählten in ihrem eigenen Antwortsatz falsch:

| Seite | Antwortsatz sagte | Tabelle hatte |
|---|---|---|
| Fassade dämmen — 100 m² | **Sieben Positionen** | **zehn Zeilen** |
| Kellerwand mit Perimeterdämmung | **vier Positionen** | **sieben Zeilen** |

Beide Seiten wussten es besser. Drei Absätze unter dem falschen Satz stand
auf der einen „Vier von **zehn** Positionen sind die, die typischerweise
fehlen", auf der anderen „Zwei der **sieben** Positionen führen wir nicht".
Der Widerspruch stand also jeweils auf derselben Seite, wenige Zeilen
auseinander.

## Warum das mehr ist als eine Zahl

Entscheidend ist nicht, dass sieben und zehn verschieden sind, sondern
**welche** drei Positionen im Antwortsatz fehlten:

- Rondellen
- Kantenschutz mit Gewebe
- Gewebeanschlussleisten

Und bei der Kellerwand die Dosierpistole. Das sind — bis auf eine —
**genau die Zeilen, die in der Tabelle mit „wird oft vergessen: ja"
markiert sind.** Eine Seite, die verspricht, die vergessenen Positionen zu
nennen, vergaß sie in dem einen Satz, der überall zitiert wird.

Denn der Satz aus dem Kopffeld `kurz` steht an vier Stellen:

1. als `<meta name="description">` der Seite,
2. als Antwortabsatz auf der Seite selbst,
3. im JSON-LD als `acceptedAnswer` einer `QAPage` — also als **die**
   maschinenlesbare Antwort auf „Was muss ich bestellen, um 100 m² Fassade
   zu dämmen?",
4. in `llms.txt`.

Ein Sprachmodell, das diese Seite liest, hätte „sieben Positionen"
geantwortet und die vier teuren Kleinteile weggelassen. Für einen Shop, der
für genau diese Auffindbarkeit gebaut wird, ist das der teuerste Satz auf der
Seite.

## Die Behebung

Beide Antwortsätze nennen jetzt die Zahl der Liste und die vergessenen
Positionen ausdrücklich:

> **Zehn Positionen** bilden das vollständige System — vier davon werden
> regelmäßig vergessen: Rondellen, die Überlappung des Glasgewebes,
> Kantenschutz und Gewebeanschlussleisten.

> **Sieben Positionen** bilden das Bauteil, fünf davon aus unserem
> Sortiment […]. Die beiden anderen sind fremde Gewerke — die Abdichtung
> davor und die Verfüllung danach.

Bei beiden Seiten ist `stand:` mitgezogen worden. Der Wert wird zu
`dateModified` im JSON-LD; ein geänderter Text unter einem alten Datum ist
dieselbe Sorte Unwahrheit, nur kleiner.

## Die Regel, die es künftig findet

`npm run pruefe-inhalte` zählt jetzt mit: Steht in einem Text „*N*
Positionen" und führt derselbe Text eine nummerierte Liste, müssen die
Zahlen übereinstimmen. Ausgewertet werden Zahlwort und Ziffer gleich.

Zwei Abgrenzungen, damit die Regel nicht rät:

- **„Positionen 7 und 8 gehören zum Bauwerk"** ist eine Nummernangabe, keine
  Anzahl — die Zahl steht dahinter, nicht davor, und schlägt nicht an.
- **Ohne Liste keine Meldung.** Eine Wissensseite darf von „vier Positionen"
  sprechen, ohne eine Tabelle zu führen; verglichen wird nur, wo es etwas zu
  vergleichen gibt (ab drei Zeilen).

Die Regel greift auch im Kopfblock, nicht nur im Fließtext — das ist die
Lehre vom 28. August, als eine Geltungsaussage im `kurz`-Feld ungeprüft
blieb, während dieselbe Aussage drei Zeilen tiefer gemeldet wurde. Beim
jetzigen Befund stand der falsche Satz an beiden Stellen, und die Prüfung
meldet ihn zweimal.

**Gegenprobe:** Mit dem alten Wortlaut („Sieben Positionen") meldet der
Prüfer beide Fundstellen mit `Der Text nennt 7 Positionen, die Liste hat 10
Zeilen`. Fünf Testfälle halten die Regel fest, darunter einer über die vier
Systemseiten des Bestands.

## Die Grenze dieser Prüfung

Sie liest die Markdown-Quelle, nicht die gebaute Seite. Tabellen, die das
Seitenbauwerkzeug selbst erzeugt — Vergleichstafeln der Warengruppen,
Preistafeln der Artikel —, zählt sie nicht mit. Dort steht bisher keine
Positionszahl im Fließtext; käme eine hinzu, wäre die Regel nach
`pruefe-seiten` nachzuziehen.

Und sie prüft nur, was sich zählen lässt. Ob die zehn Zeilen die *richtigen*
zehn sind, sagt kein Werkzeug — das bleibt die Arbeit an der Sache.
