# Der Korb hieß nach dem Artikel von gestern

**8. September 2026.** Der Referenzwarenkorb der Gruppe Mauerwerk trug

```js
umfang: '128 Planziegel',
positionen: [{ sku: 'POS-29728', menge: 128, was: 'Planziegel' }]
```

Geführt ist unter `POS-29728` der **Ökotherm HL N+F** — ein Hochlochziegel mit
Nut und Feder. Ein Planziegel ist etwas anderes: plangeschliffen, im Dünnbett
versetzt, anderes Bauteil, anderer Arbeitsgang.

Das steht so im Bestand. **Zwölf Zeilen weiter oben, in derselben Datei:**

> *„«Planziegel kaufen» entfällt am 6. September: Geführt ist ein
> Hochlochziegel mit Nut und Feder. Ein Planziegel ist plangeschliffen und wird
> im Dünnbett versetzt — ein anderes Bauteil und ein anderer Arbeitsgang."*

Zurückgenommen wurde das **Keyword**. Der Klartext des Korbs blieb.

> **Das Wort wurde an einer Stelle zurückgenommen und blieb an der, die
> rechnet.**

---

## Es war kein Tippfehler, sondern ein Nachlass

`STATUS.md` hält die Vorgeschichte fest, vom 27. August:

> *„auf Anfrage stehen Polystyrol, Betonfertigteile, **Planziegel**,
> Edelstahlkamine und Öfen. Der Referenzwarenkorb «eine Palette Planziegel» ist
> damit ausgerechnet nicht kalkulierbar."*

Der Korb **hieß** einmal so, weil er einmal Planziegel enthielt. Dann wurde der
Artikel gewechselt — auf einen, dessen Einkaufspreis rechenbar ist —, und die
Bezeichnung blieb stehen. Nichts band den Klartext an die Artikelnummer:
`was: 'Planziegel'` und `sku: 'POS-29728'` stehen in derselben Zeile und wussten
nichts voneinander.

---

## Und der Satz, der nach außen ging

`warenkorbText` baut den Korbtext aus Umfang und Klartext. Bei **einer**
Position hängt er beides aneinander („40 Sack" + „Mörtel" → „40 Sack Mörtel").
Hier stand die Sache schon im Umfang:

> **„128 Planziegel Planziegel"**

Zwei Fehler in einer Zeile — das falsche Bauteil und ein doppeltes Wort —, und
dieser Text beschreibt den Warenkorb, aus dem das Höchstgebot der Gruppe
gerechnet wird.

Jetzt: `umfang: '128 Stück'`, `was: 'Hochlochziegel'` → **„128 Stück
Hochlochziegel"**.

---

## Was jetzt prüft

`npm run pruefe-korbtext` hält jede der 18 Korbpositionen gegen die
Bezeichnung des Artikels, den sie benennt — über dieselben Wortstämme, die
auch die Suche des Shops verwendet, und mit Teilwortdeckung, damit „Gewebe"
zu „Glasgewebe" und „Kleber" zu „Klebe- und Spachtelmasse" passt.

Zwei Klartexte stehen mit Grund daneben:

- **„Perimeterdämmung XPS 80 mm"** für „XPS glatt SF 80 mm" — der Lieferant
  benennt nach Bauform, der Kunde nach Verwendung. Genau so heißt die Platte
  auf der Systemliste `kellerwand-perimeter`.
- **„Bögen"** für „PVC Kanalbogen" — Mehrzahl mit Umlaut; die Stammbildung
  führt beides nicht zusammen. Eine Eigenheit der Stammbildung, keine
  Abweichung in der Sache.

Dazu die zweite Regel: **kein Wort zweimal im fertigen Korbtext.** Sie hätte
den Fall auch ohne den Artikelvergleich gefunden — und sie findet ihn wieder,
wenn jemand den Umfang das nächste Mal mit dem Bauteil füllt.

---

## Die Gegenprobe

Sie setzt „Planziegel" wieder ein. Beide Regeln schlagen an: der Klartext nennt
ein Bauteil, das im Artikel nicht vorkommt, und der Korbtext nennt es zweimal.
