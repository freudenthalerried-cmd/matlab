# Vierzig Prozent waren neununddreißig

**Stand: 30. August 2026** · Befund und Behebung aus einem Lauf des
Arbeitsloops. Betroffen: `shop/src/shopkern.js`, `shop/bin/website.mjs`,
`shop/test/shopkern.test.js`, `shop/test/website.test.js`.

## Der Befund

Auf der Artikelseite des Ökotherm-Ziegels stand:

> **40 % unter Listenpreis**

Gerechnet sind es **39,80 %**. Die Zahl entstand mit `Math.round` — und
kaufmännisch runden heißt bei einem Preisvorteil: aufrunden, wenn der Rest
über der Hälfte liegt.

Gemessen über den ganzen Bestand:

> **21 von 39 Artikeln mit Vorteilsmarker nannten einen zu hohen Wert**, bis
> zu einen vollen Prozentpunkt.

| Artikel | gerechnet | stand da |
|---|---|---|
| Ökotherm HL N+F | 39,80 % | 40 % |
| Capatect Klebespachtel 190 | 27,71 % | 28 % |
| XPS glatt SF 50 mm | 46,67 % | 47 % |
| Kanalrohr NW 100 | 83,99 % | 84 % |
| Rahmenschraube | 11,996 % | 12 % |

## Warum das nicht Erbsenzählerei ist

Kaufmännisch runden ist bei einer **Messgröße** richtig und bei einem
**Werbeversprechen** falsch. Ein Prozentsatz unter dem Listenpreis ist keine
Messung, sondern eine Zusage: *So viel weniger zahlen Sie.* Wer 39,8 %
nachlässt und „40 %" schreibt, hat 0,2 Prozentpunkte behauptet, die er nicht
gibt.

Die Richtung der Rundung ist hier also keine Frage der Genauigkeit, sondern
die Frage, **zu wessen Gunsten der Rest fällt.** Bei einer Preisaussage fällt
er zu Gunsten des Kunden — sonst steht auf der Seite eine Zahl, die die
Rechnung nicht hält.

Dazu kommt der Ort: Der Prozentsatz steht nicht nur als Marker, sondern auch
im Satz „*X* % unter dem Listenpreis des Lieferanten" und in `kurz` — und
`kurz` wird zur Meta-Beschreibung und zur Antwort in den strukturierten
Daten. Eine zu hohe Zahl wird von Maschinen mitgenommen.

## Drei Wege zur selben Zahl

Beim Beheben zeigte sich der eigentliche Grund, warum so etwas stehen bleibt.
Der Prozentsatz entstand an **drei** Stellen:

| Ort | Form |
|---|---|
| `vorteil()` in `shopkern.js` | für die Browseroberfläche und die Sortierung |
| `bin/website.mjs`, Artikelkarte | dieselbe Formel, noch einmal hingeschrieben |
| `bin/website.mjs`, Artikelseite | dieselbe Formel, ein drittes Mal |

Alle drei mit `Math.round`. Wer eine davon berichtigt hätte, hätte zwei
falsche Zahlen stehen lassen und es nicht gemerkt — die Karte und die Seite
zeigen dieselbe Ware.

Jetzt ruft das Seitenbauwerkzeug `vorteil()`. **Eine Quelle für die Zahl**,
zum sechsten Mal in dieser Woche dieselbe Behebung.

## Das Epsilon

`Math.floor(prozent + 1e-9)` statt `Math.floor(prozent)`. Der Grund ist die
Binärdarstellung: `(1 − 0,8) × 100` ergibt in Gleitkomma nicht zuverlässig
genau 20, und ein echtes 20 soll nicht zu 19 werden. Das Epsilon ist klein
genug, dass 19,999 % weiterhin 19 ergeben — das steht als Testfall da, nicht
als Behauptung.

Drei Artikel lagen genau an dieser Kante: 11,996 %, 11,997 %, 11,998 %. Alle
drei zeigten „12 %" und zeigen jetzt „11 %". Das ist kein Rundungsartefakt,
sondern der ehrliche Wert.

## Die Proben

| Zusicherung | Gegenprobe |
|---|---|
| 39,8 % ergeben 39; genau 40 bleibt 40 | `Math.round` zurück → fällt |
| Keine gebaute Seite nennt mehr, als der Artikel gibt | `Math.round` zurück → fällt |
| Und keine nennt mehr als einen Punkt zu wenig | `floor − 1` → fällt |

Die dritte Zeile ist die, die Übervorsicht verhindert: Abrunden ist richtig,
aber wer aus 39,8 % ein „35 %" macht, verschenkt das Argument. Die Probe hält
beide Seiten zusammen — der genannte Wert liegt im halboffenen Intervall
zwischen *wahr − 1* und *wahr*.

Gemessen greift sie an 39 der 46 Artikelseiten; die übrigen sieben haben
keinen Listenpreis oder stehen am Listendeckel (Gate 22) und zeigen deshalb
keinen Vorteil.

## Was offen bleibt

Der Listenpreis selbst. `uvpNetto` kommt aus den Lieferantenunterlagen und
trägt keinen eigenen Stand — der Preisstand am Artikel gilt für den Einkauf.
Ändert der Hersteller seine Liste, ohne dass wir einkaufen, wird der
ausgewiesene Vorteil falsch, ohne dass eine Prüfung anschlägt. Das ist am Tag
der neuen Lieferantenliste zu klären: **ein Listenpreis braucht einen Stand
wie jeder andere Preis.**
