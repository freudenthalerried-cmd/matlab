# „Alle Preise Stand: 17. August" — der älteste ist vom 22. April

**1. September 2026.** Der Auftraggeber hat die Seite sehen wollen. Ich habe
sie ihm geschickt und danach selbst gelesen, was auf der Startseite steht —
also auf der Seite, die sich zuerst öffnet.

Zweiter Satz:

> „Was ein Baumeister im Einkauf zahlt, zahlen Sie auch — deshalb liegen 39
> von 46 Artikeln unter dem Listenpreis des Lieferanten, im Median um 26,7 %.
> **Alle Preise Stand: 2026-08-17.**"

Der letzte Satz ist falsch. Gerechnet wurde dafür:

```js
const staende = katalog.artikel.map((a) => a.preisStand).filter(Boolean).sort();
return staende[staende.length - 1];   // das Maximum
```

**Das Maximum, ausgewiesen als Aussage über alle.** Der älteste
Einkaufspreis im Katalog ist vom **22. April** — 117 Tage vor dem genannten
Datum. Für einunddreißig der sechsundvierzig Artikel behauptete der Satz eine
Frische, die sie nicht haben.

Und wieder in die günstige Richtung. Das ist inzwischen die Regelmäßigkeit
dieses Vorhabens: Wo etwas ungenau ist, ist es zugunsten des Plans ungenau.

## Warum das kein Schönheitsfehler ist

Ein Preisstand ist keine Zierde, sondern die Angabe, auf die sich ein Kunde
verlässt, wenn er einen Preis übernimmt. Er steht in den eigenen
Redaktionsprinzipien als Regel — *jede Zahl mit Herkunft und Stand* — und
diese Regel wird verletzt, wenn man das Beste aus einer Menge nimmt und
„alle" darüberschreibt.

Derselbe Satz stand in **`llms.txt`**, also in dem Kanal, für den dieser Shop
ausdrücklich gebaut wird. Ein Sprachmodell hätte die Frische aller Preise mit
dem 17. August beantwortet.

## Der Anfragetext konnte es die ganze Zeit richtig

```
Preisstand der Positionen: 2026-06-25 bis 2026-07-27. Preise freibleibend.
```

`kundenanfrage.js` bildet seit jeher die **Spanne** — der Code dafür stand
fertig im Verzeichnis, drei Dateien weiter.

> **Zwei Wege zur selben Aussage, und der kürzere stand auf der
> meistbesuchten Seite und im maschinenlesbaren Kanal.**

Dieselbe Familie wie der feste Seitenfuß, die verdrahtete Domain, die
Markentabelle im Bauwerkzeug. Ich zähle sie inzwischen nicht mehr; ich suche
sie gezielt.

## Abgestellt

`preisstandSpanne()` in `src/preisalter.js` — dort, wo auch die
Altersprüfung sitzt, weil beide dieselbe Frage stellen. Ein einziges Datum
wird nicht zu „X bis X" aufgeblasen; unbrauchbare Werte zählen nicht mit; und
wenn nichts übrig bleibt, gibt es **keine** Spanne statt einer erfundenen.

| Ort | vorher | jetzt |
|---|---|---|
| Startseite | „Alle Preise Stand: 2026-08-17." | „Preise der 46 Artikel, Stand: 2026-04-22 bis 2026-08-17." |
| `llms.txt` | „Preisstand 2026-08-17" | „Preisstand 2026-04-22 bis 2026-08-17; je Artikel steht er auf der Artikelseite." |
| Artikelseite | Preisstand des Artikels | unverändert — dort war er immer richtig |

## Zwei Dinge, die mir beim Beheben passiert sind

**Der Seitenprüfer hat die erste Fassung abgelehnt.** „Preisstand der
Artikel: …" enthält kein `Stand:` — und damit galt die 26,7 % im selben Absatz
als Zahl ohne Quelle. Der Prüfer hatte recht: Die Quellenmarke war
verschwunden, weil ich den Satz umgeschrieben habe. Jetzt heißt es „Preise der
46 Artikel, **Stand:** …".

**Und dabei habe ich selbst eine 46 hingeschrieben.** Eine Bestandszahl im
Quelltext, in derselben Stunde, in der ich sie anderswo herausnehme.
Nachgezogen auf `befund.artikelGesamt`, bevor sie committet wurde — aber
aufgeschrieben, weil das die Fehlerart ist, die man bei sich selbst am
schlechtesten sieht.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Spanne zurück auf das Maximum | ja |
| Unbrauchbare Preisstände mitzählen | ja |
| Startseite wieder auf den jüngsten Wert | ja |

Die Probe prüft nicht ein abgeschriebenes Datum, sondern hält die gebauten
Seiten gegen den Katalog — und verlangt ausdrücklich, dass die Spanne
**uneinheitlich** ist. Trügen eines Tages alle Artikel denselben Preisstand,
prüfte der Vergleich nichts mehr, und die Probe sagt das.

## Stand

- 1.086 Tests, 0 rot; alle Prüfer grün
- Preisbasis unverändert: 22.04. bis 17.08., Median 50 Tage
- Kampagnen weiterhin **PAUSIERT**

Nichts an diesem Lauf löst Ausgaben aus.
