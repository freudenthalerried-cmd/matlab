# Der Brief sagte „vier" und stellte sechs Fragen

**8. September 2026.** `npm run pruefe-anfrage` druckt den Brief, den der
Auftraggeber an den Lieferanten schicken soll — das **einzige Dokument dieses
Bestands, das an einen Dritten geht**. Er begann so:

> „… Dafür brauchen wir **vier** Auskünfte."

und endete so:

> „Mehr Auskünfte brauchen wir nicht — die **vier** oben genügen uns."

Dazwischen standen **sechs** nummerierte Fragen. Der Empfänger liest die
falsche Zahl in der ersten Zeile, zählt beim Lesen sechs und findet sie in der
letzten Zeile noch einmal falsch bestätigt.

---

## Wie das entstanden ist

Der Brief begann mit vier Fragen. Am 3. September kam die fünfte dazu (die
Palettenzahl, aus Gate 25), am 6. September die sechste (die Abholung, aus
Gate 28). Beide Male wurde `FRAGEN` erweitert und der Rahmentext nicht
angefasst.

Der Kopfkommentar derselben Datei hält den ersten Schritt sogar fest:

> *„**Von vier auf fünf am 3. September.** Gate 25 hat einen
> Mindestbestellwert …"*

Geändert wurde die Zahl **im Kommentar** und nicht **im Brief**.

Und sie überlebte, weil sie ein **Wort** ist. Am 4. September stand derselbe
Befund schon einmal da — die Etappenzahl der PR-Beschreibung war als Wort
geschrieben, und `pruefe-schaufenster` sucht Ziffern:

> **Eine Zahl, die als Wort dasteht, findet kein Muster, das nach Ziffern
> sucht.**

---

## Das Bittere: die Lehre stand zwanzig Zeilen weiter

`bin/anfragepruefung.mjs` trägt seit dem 3. September an einer Konsolenzeile
diesen Kommentar:

> *„Die Zahl kommt aus der Liste, nicht aus dem Satz. Sie stand hier als
> ‚acht' — und war am 3. September neun, an dem Tag, an dem die Palettenfrage
> dazukam. **Ein Satz, der eine Menge behauptet, gehört an die Menge
> gehängt.**"*

Derselbe Fehler, derselbe Tag, dieselbe Datei — und behoben wurde er an der
Zeile, die auf **meiner** Konsole steht, nicht an der, die beim **Lieferanten**
ankommt.

> **Angewandt wird eine Regel dort, wo sie auffällt, nicht dort, wo sie
> zählt.**

---

## Was jetzt dasteht

Beide Zahlen kommen aus `fragen.length`, ausgeschrieben über `zahlwort()`. Und
`SELBSTZAEHLUNG` führt die zwei Stellen, an denen der Brief sich selbst zählt,
mit Muster und Ortsangabe:

| Regel | wann |
|---|---|
| `brief-zaehlt-falsch` | die Stelle nennt eine andere Zahl als die Liste hergibt |
| `stelle-ohne-treffer` | der Satz wurde umgeschrieben — dann prüft niemand mehr diese Zahl |

Die zweite Regel ist die wichtigere. Ein Muster, das ins Leere greift, meldet
sonst nichts und sieht aus wie Zustimmung — das ist der Anker-Befund vom
4. September, hier von vornherein mitgebaut. Ziffern und Wörter werden gleich
gelesen, damit die Prüfung nicht an der Schreibweise scheitert, die der
Verfasser gerade im Kopf hatte.

---

## Und ein dritter Fund beim Aufräumen

Für `zahlwort()` brauchte es eine Tabelle Wort → Zahl. Es gab sie schon —
**zweimal**:

| wo | Form | Umfang |
|---|---|---|
| `src/systemlisten.js` | Objekt | `eine` bis `zwölf` |
| `src/inhaltspruefung.js` | `Map` | `zwei` bis `zwölf` |

Zwei Tabellen für dieselben zwölf Wörter, und sie waren nicht gleich: Die eine
kannte „eine", für die andere war es eine unbekannte Zahl. Beinahe wäre eine
dritte dazugekommen.

> **Zwei Fassungen derselben Tabelle sind eine Fassung, die niemand pflegt.**

Sie stehen jetzt einmal in `src/format.js`, zusammen mit der Gegenrichtung.
Beide Prüfer, die daran hängen, sind grün, und 1.925 Testfälle stehen dahinter.
