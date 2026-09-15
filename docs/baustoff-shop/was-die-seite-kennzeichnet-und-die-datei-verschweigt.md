# Was die Seite kennzeichnet und die Datei verschwieg

**8. September 2026, nachts.** `llms.txt` ist die Datei, für die dieser Shop
laut eigener Abnahmeliste „überhaupt so geschrieben ist" — die Auskunft an
Assistenten. Sie trägt seit dem 5. September einen Satz, der die richtige
Lehre zieht, damals für die Palettierung:

> **Eine Auskunft, die an einer Stelle qualifiziert ist und an der
> maschinenlesbaren blank steht, wird von Assistenten als Tatsache
> weitergegeben.**

Ihr Abschnitt `## Systemlisten` führte die vier Seiten mit ihrer Frage:

```
- [Grundleitung DN 100 — die Liste](…/system/kanal-dn100.html):
  Welche Teile brauche ich für eine Grundleitung, und wie zähle ich sie aus dem Plan?
```

Und sagte **nicht**, dass drei von acht Positionen nicht im Sortiment sind.

| wo | sagt es |
|---|---|
| die Systemseite selbst | *(nicht im Sortiment)* in der Tabelle |
| die JSON-LD-`ItemList` | `disambiguatingDescription: 'nicht im Sortiment'` |
| **`llms.txt`** | **nichts** |

Ein Assistent, der sie liest, empfiehlt „dort bekommst du die ganze
Grundleitung". Für drei von acht Positionen stimmt das nicht — und es sind
genau die drei, die dieselbe Liste als **„wird oft vergessen"** führt.

---

## Was jetzt dasteht

```
- [Kaminzug — die Liste für einen Zug](…): Welche Teile … — davon liefern wir 1 von 10 Positionen nicht
- [Grundleitung DN 100 — die Liste](…): Welche Teile … — davon liefern wir 3 von 8 Positionen nicht
- [Kellerwand außen dämmen — die Liste](…): Was brauche ich … — davon liefern wir 3 von 7 Positionen nicht
```

Die Fassadenliste bleibt ohne Zusatz, und das ist richtig: Ihre Dämmplatte
trägt *(nicht in Flächenstärke)* — die andere Marke, die „führen wir, aber
nicht in dieser Stärke" heißt. Der Prüfer unterscheidet beide.

**Verlangt wird die Zahl, nicht ein Wort.** „Teilweise lieferbar" könnte alles
heißen; „3 von 8" nicht. Ein Testfall hält genau das fest.

`npm run pruefe-systemlisten` misst es dort, wo die Zahlen ohnehin gelesen
werden, und weigert sich über einem veralteten Erzeugnis — der Prüfer steht
seit heute mit `ausgabe/site` im Erzeugnisregister.

---

## Zum dritten Mal an einem Abend: hinter dem Ausgang

Die Regel war geschrieben, der Prüfer lief grün — und blieb auch grün, als ich
den Zusatz zur Probe wieder aus `llms.txt` entfernte.

Der Block stand **hinter** `process.exit(0)`.

Es ist der dritte Fall an einem Abend, und alle drei sind dieselbe Sorte:

| | wo die Regel landete |
|---|---|
| 1 | `befund.meldungen` wurde nicht mitgezählt |
| 2 | **innerhalb** von `if (geheim.length)` — einem Zweig, der nie läuft |
| 3 | **hinter** `process.exit(0)` |

> **Eine Regel, die nicht ausgeführt wird, ist von einer richtigen Regel nicht
> zu unterscheiden — außer man lässt sie einmal anschlagen.**

Gefunden hat es jedes Mal dieselbe Frage: *Wird der Prüfer rot, wenn ich den
Fehler absichtlich hineinlege?* Beim ersten und zweiten Mal die Gegenprobe,
beim dritten Mal die Handprobe mit `sed`. Ohne sie stünde jetzt ein Prüfer im
Register, der nie etwas findet — und `npm run alles` wäre grün.

---

## Ein Nebenbefund beim Bauen

Der neue Prüfer hieß zuerst `llmsbefund`. Denselben Namen führt
`src/llmsdeckung.js` bereits — dort misst er, ob **jede gebaute Seite** in
`llms.txt` steht; hier, ob die Zeile, die dort steht, **ihre Lücke nennt**.

`pruefe-ungerufen` sucht nach Namen und stolperte prompt: Er meldete, ein
Eintrag „entschuldigt einen Zustand, den es nicht mehr gibt".

Umbenannt in `llmsqualifikation`, mit dem Grund im Kopf. Es ist dieselbe
Familie wie die drei Markenlisten von heute Nachmittag — nur bei
Funktionsnamen statt bei Tabellen.
