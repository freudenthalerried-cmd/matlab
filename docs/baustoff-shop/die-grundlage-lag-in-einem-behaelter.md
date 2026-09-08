# Die Grundlage lag in genau einer Kopie

**8. September 2026.** Die Arbeitsumgebung wurde neu aufgesetzt. Danach fehlte
`preise/baustoff-preise.json`, und `npm run website` sagte einen Satz:

```
Die Preisdatei fehlt: preise/baustoff-preise.json — ohne sie keine Website.
```

Die Datei stand seit dem ersten Tag in `.gitignore`, und das war richtig: Sie
trägt die Einkaufskonditionen des Lieferanten, und dieses Verzeichnis ist
öffentlich. Nur hieß dieselbe Entscheidung eben auch:

> **Die Zahl, auf der alles ruht, lag in genau einer Kopie — in einem
> Behälter, der jederzeit neu aufgesetzt wird.**

Sechsundvierzig Einkaufspreise aus fünfzehn Lieferantenrechnungen. Jeder
Verkaufspreis, jeder Deckungsbeitrag, Gate 20, Gate 22, Gate 25, die ganze
Kalkulation — alles hängt daran.

---

## Was sich zurückholen ließ: 43 von 46

`npm run pruefe-geheimnis` misst seit dem 30. August, dass aus den
**veröffentlichten** Verkaufspreisen und der dokumentierten Zielmarge die
Einkaufspreise auf den Cent zurückzurechnen sind. Der Befund war als **Warnung**
gemeint — er ist der Grund für die Empfehlung, das Verzeichnis privat zu
stellen.

Heute war dieselbe Rechnung der Rettungsweg. `npm run preise-wiederherstellen`
liest `ausgabe/site/shop.js` — die gebaute Ausgabe liegt im Verzeichnis — und
rechnet zurück: `ekNetto = vkNetto × (1 − Marge)`.

**Drei gehen nicht.** Wo der Verkaufspreis am **Listendeckel** hängt, ist die
Rechnung nicht umkehrbar: Jeder Einkauf oberhalb einer Schwelle ergibt denselben
gedeckelten Verkaufspreis. Das sind `POS-12294`, `POS-53215` und `POS-31631`.
Für sie hilft nur die Lieferantenrechnung.

**Und keiner der 43 heißt „belegt".** Jeder Eintrag trägt
`ekQuelle: 'rekonstruiert'`, und der Shop führt ihn folgerichtig als
Platzhalter:

> **Ein Wert, der stimmt, ist noch kein Wert, der belegt ist.**

---

## Der zweite Fund: Der Katalog kannte den Fall, der Bau nicht

Mit der lückenhaften Preisdatei brach `npm run website` ab — nicht mit einer
Meldung, sondern mit `TypeError: Cannot read properties of null (reading
'toLocaleString')`, mitten in einer Artikelkarte.

`ladeBaustoffkatalog` führt seit jeher eine Liste `ohnePreis` und schreibt jedem
solchen Artikel den Grund im Klartext dazu. Gelesen hat sie nie jemand:
`katalogbefund` reichte sie nicht weiter, und der Bau erfuhr nichts davon.

> **Der Katalog kennt den Fall; der Bau erfuhr nie davon.**

Bis heute konnte er auch nicht auffallen — die Preisdatei hatte noch nie eine
Lücke.

Der Absturz war dabei das bessere Ende. Das schlechtere wäre eine Seite mit
„null €" gewesen, oder, schlimmer, ein Shop, der drei Artikel stillschweigend
weglässt. Gate 24 sagt es zwei Absätze weiter oben in derselben Datei: *Eine
Ware, die aus dem Katalog fällt, ohne dass es jemand sieht, ist derselbe Fehler
wie eine Zahl, die berechnet und verschwiegen wird.*

Der Bau **weigert sich** jetzt und nennt die Artikelnummern.

---

## Was daraus folgt

**Für den Auftraggeber, sofort:** Drei Einkaufspreise aus den
Lieferantenrechnungen nachtragen, dann baut der Shop wieder. Und die
Preisdatei gehört an einen zweiten Ort — sie ist die einzige Zahlengrundlage
des ganzen Vorhabens und war bis heute nirgends gesichert.

**Für dieses Verzeichnis:** Der Prüfstand steht so lange still, wie der Bau
steht. Das ist richtig so und wird nicht umgangen; ein Lauf, der mit
zurückgerechneten Zahlen grün meldet, meldete etwas anderes als das, was
gemessen werden soll.

**Und ein Gedanke, der bleibt:** Der Befund „44 von 46 Einkaufspreisen sind aus
den veröffentlichten Verkaufspreisen rekonstruierbar" stand sechs Wochen lang
als Warnung im Verzeichnis. Heute war er das Einzige, was die Arbeit von sechs
Wochen gerettet hat. Dieselbe Eigenschaft, dasselbe Vorzeichen — nur die Frage,
wer rechnet, hat sich geändert.
