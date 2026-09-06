# Die Seite nahm es zurück, die Auszeichnung nicht

**6. September 2026, nachmittags.** Heute früh ist auf allen 46 Artikelseiten
ein Satz gefallen. Er stand neben dem Preisstand:

> *„Preisstand 2026-04-22 · **gültig bis zur nächsten Liste**"*

Zurückgenommen, weil er zweierlei behauptet und beides nicht hält: eine
Gültigkeit, die erst das Angebot herstellt (14 Tage, § 862 ABGB), und ein
Ereignis, das dieser Betrieb nicht beobachten kann — `preisrhythmus: null`.

Heute nachmittag die strukturierte Auskunft derselben 46 Seiten gelesen.
`src/maschinenlesbar.js`, seit dem 5. September:

```js
// `validFrom` und ausdrücklich **nicht** `priceValidUntil`: … Bis
// wann er gilt, hängt an der nächsten Liste und ist nicht bekannt
```

> **Dieselbe Behauptung, ein Tag Abstand, zwei Dateien — und nur eine ist
> berichtigt worden.**

---

## Eine Begründung, die auf einem zurückgenommenen Satz ruht

Das ist keine vergessene Zeile, sondern eine **Begründung mit einem Bezug**:
Sie beruft sich auf die nächste Lieferantenliste. Genau diesen Bezug hat die
Artikelseite einen Tag später gestrichen.

Der Bestand kennt die Form: *„Die Begründung ist nicht falsch geworden, sie ist
abgelaufen"* (Gate 27, 5. September). Hier ist sie **an einem anderen Ort
abgelaufen als dort, wo sie steht** — und das ist die Sorte, die niemand von
selbst findet.

---

## Und die Antwort stand längst da, nur woanders

Der Betrieb hat sehr wohl eine Antwort auf „bis wann". Sie steht in
`src/preisalter.js`:

```js
export const GRENZE_TAGE = 90;
```

Ab diesem Alter gilt die Preisgrundlage als überholt, `pruefe-preisalter` lässt
kein Gebot mehr darauf ruhen, und seit heute früh sagt die Artikelseite es dem
Kunden im Klartext. Die Zahl ist ein Platzhalter für den unbekannten
Preisrhythmus und sagt das selbst — **aber sie ist die Zahl, nach der dieser
Betrieb handelt.**

> **„Nicht bekannt" stimmte für den Lieferanten. Für den eigenen Umgang damit
> stimmte es nie.**

`priceValidUntil` wird seither aus Preisstand + `GRENZE_TAGE` gerechnet. Ein
Aufrufer, der es besser weiß, behält den Vortritt; ohne brauchbaren Preisstand
bleibt **beides** weg — was nicht bekannt ist, bekommt keinen Schlüssel.

---

## Was das kostet, und warum es trotzdem richtig ist

Gemessen über alle 46 Artikelseiten:

```
Artikelseiten mit priceValidUntil: 46
davon in der Vergangenheit:         7
   POS-12294 → 2026-07-21     POS-21382 → 2026-08-24
   POS-29691 → 2026-08-24     POS-29754 → 2026-08-24
   POS-31631 → 2026-08-24     POS-52537 → 2026-08-24
   POS-53215 → 2026-08-24
```

Eine Suchmaschine liest ein vergangenes `priceValidUntil` als **abgelaufenes
Angebot**. Sieben von 46 Artikeln fallen damit aus den strukturierten
Ergebnissen.

**Es sind dieselben sieben**, die seit heute früh auf ihrer Seite tragen: *„Diese
Grundlage ist 137 Tage alt und damit älter als die selbst gesetzte Grenze von 90
Tagen."*

> **Menschen- und maschinenlesbare Fläche sagen jetzt dasselbe. Das ist der
> Zweck, nicht der Preis.**

Der Weg zurück ist nicht, das Datum zu strecken, sondern den Preis nachzuziehen
— dieselbe offene Frage an den Lieferanten, an der heute schon zwei
Korbpositionen hängen.

---

## Zwei Testfälle, die ihre eigene Begründung getauscht haben

Beide prüften `priceValidUntil === undefined`, mit Gründen:

> *„ein erfundenes Gültigkeitsdatum wäre eine Zusage"* — und
> *„bis wann er gilt, weiß niemand"*.

Der erste stimmt weiter: **erfunden** wäre es eine Zusage. Gerechnet ist es
keine Erfindung. Der zweite ist derselbe zurückgenommene Satz.

Geprüft wird jetzt der **Wert** statt seiner Abwesenheit, dazu drei Fälle: ohne
Preisstand bleibt beides weg, ein gesetzter Wert behält den Vortritt, und ein
Preisstand vom Januar ergibt im September ein abgelaufenes Datum.

Gegenprobe `auszeichnung-ohne-ablauf` nimmt das gerechnete Datum wieder heraus.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Ausfuhren | `preisGueltigBis` in `src/preisalter.js` |
| Neue Gegenproben | `auszeichnung-ohne-ablauf` |
| Geänderte Testfälle | 2 berichtigt, 1 neu |
| Neue Prüfer | keine |
| Neue Gates | keine |

## Was offen bleibt

- **Sieben Artikel sind für eine Suchmaschine abgelaufen.** Der Ausweg ist der
  Einkaufspreis, nicht das Datum. Er hängt an derselben Frage an den
  Lieferanten wie der Preisrhythmus selbst — freigabepflichtig, weil sie eine
  Anfrage an Dritte ist.
- **`GRENZE_TAGE` ist als Platzhalter deklariert** und bestimmt jetzt auch,
  was eine Maschine über die Preisgültigkeit erfährt. Das ist mehr Gewicht auf
  einer geschätzten Zahl als gestern — und der Grund, aus dem die Frage nach
  dem Preisrhythmus in der Anfrage an den Lieferanten steht.
- **Die Gebietsfrage** und die sieben Punkte in `npm run startklar` — alle beim
  Auftraggeber.
