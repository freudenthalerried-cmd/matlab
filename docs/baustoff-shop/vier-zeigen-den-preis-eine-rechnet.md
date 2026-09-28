# Vier zeigen den Preis, eine rechnet damit

**7. September 2026.** `npm run pruefe-preise` gibt es seit dem 30. August. Es
entstand, weil drei Artikel nach einer Preisänderung in einer Ausgabe alt
stehen geblieben waren, und es vergleicht seither **vier Ausgaben**:

| Ausgabe | woher |
|---|---|
| Artikelseite, Preistafel | `ausgabe/site/artikel/<sku>.html` |
| Artikelseite, JSON-LD | dieselbe Datei |
| Artikelkarte auf der Gruppenseite | `ausgabe/site/gruppe/<gruppe>.html` |
| `llms.txt` | `ausgabe/site/llms.txt` |

Alle vier **zeigen** den Preis. Die Datei, die mit ihm **rechnet**, war nicht
dabei: `ausgabe/site/shop.js` trägt `vkNetto` für alle 46 Artikel, und daraus
entstehen Warenkorbsumme, Fracht, Umsatzsteuer und der Anfragetext, den der
Kunde abschickt.

> **Vier Ausgaben, die den Preis zeigen, wurden verglichen — die fünfte, aus
> der gerechnet wird, nicht.**

Eine Abweichung dort ist die teuerste von allen: Der Kunde liest auf der Seite
den einen Betrag und bekommt im Korb den anderen. Und sie fällt in der
Richtung auf, in der sie nicht wehtut — zu wenig verlangt merkt niemand, zu
viel verlangt merkt der Kunde.

Die sechste ist dieselbe Tabelle in der **Einzeldateifassung**: Sie ist es, die
der Auftraggeber öffnet, wenn er den Shop ohne Server ansieht, und die 55
Browserszenarien fahren darauf.

**Stand: 46 Artikel über sechs Ausgaben, null Abweichungen.** Die Zahl im Kopf
der Ausgabe wird gezählt, nicht geschrieben — sie stand als Wort da, während
die fünfte dazukam.

---

## Gelesen wird, was der Browser bekommt

Nicht der Katalog daneben: Ein Abgleich gegen die Quelle, aus der beide
entstehen, vergliche zweimal dasselbe. Gelesen wird `window.__SHOP__` aus dem
ausgelieferten Skript — derselbe Griff, mit dem seit dem 6. September auch die
Suchdeckung misst, und aus demselben Grund:

> **Ein Prüfer, der einen anderen Index befragt als der Kunde, misst einen
> anderen Shop.**

Findet sich kein `__SHOP__` in der Datei, ist das selbst ein Befund: Dann
rechnet die Kasse mit nichts.

---

## Die Gegenprobe hat zweimal gearbeitet

Der erste Anlauf mutierte `vkNetto: a.vkNetto ?? null` in `shopkern.js` — und
der Prüfer meldete **zu Recht grün**. Die Zeile steht dort **zweimal**: einmal
im Suchindex, einmal im öffentlichen Artikel. Getroffen war der Suchindex, und
der landet in keiner Preisausgabe.

> **Ein Suchtext, der zweimal passt, trifft die erste Stelle — nicht die
> gemeinte.**

Die Regel dafür gibt es seit dem 30. August: Eine Mutation, die mehrere
Stellen zugleich ändert, sagt nicht, welche der Test bemerkt hat — und
`bin/gegenprobe.mjs` bricht bei mehrfachem Treffer ab. Der Läufer im
Gesamtlauf ersetzt dagegen nur die erste Fundstelle. Der Suchtext nimmt jetzt
die Zeile darüber mit.

Mit dem richtigen Anker zieht die Mutation zehn Prozent vom Kassenpreis ab,
lässt jede sichtbare Seite unberührt — und der Prüfer meldet rot.
