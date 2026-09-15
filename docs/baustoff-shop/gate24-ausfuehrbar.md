# Gate 24 steht jetzt im Rechenkern, bevor es einen Fall gibt

Stand: 2026-08-27. Der Lauf davor hat Gate 24 entschieden — *kein Artikel
im Shop, dessen Einkaufspreis nur „auf Anfrage" zu haben ist* — und dazu
geschrieben:

> Umzusetzen ist vorerst nichts: Kein Artikel im Katalog stammt vom
> Lagerhaus.

**Dieser Satz ist die häufigste Art, wie eine Regel verschwindet.** Er
stimmt und ist trotzdem der falsche Schluss. Das Register führt die
Begründung seit dem 26. August selbst mit, bei Gate 21:

> Ohne Gate bliebe der Hebel eine Empfehlung, die im Alltag umgangen wird.

Gate 23 wurde aus genau diesem Grund gebaut und nicht nur beschlossen: Die
Weisung „regional statt österreichweit" stand fünf Tage lang im
Verzeichnis und war an genau einer Stelle umgesetzt — als Zeichenkette in
einer Anzeigenzeile. Erst `liefergebiet.js` hat sie durchgesetzt.

Deshalb steht Gate 24 jetzt im Code, **bevor** der erste Artikel auftaucht,
für den es gilt. Das ist das Gate-17-Prinzip in seiner nützlichsten Form:
Die Regel wird festgelegt, solange sie noch niemandem wehtut.

## Was gebaut ist

**Ein Artikel trägt `ekQuelle: 'anfrage'` im öffentlichen Katalog.**
`ladeBaustoffkatalog()` gibt ihn dann ohne jeden Preis zurück, mit einem
Grund im Klartext, und `katalogbefund()` weist ihn getrennt aus.

| | |
|---|---|
| `nurAnfrage` / `nurAnfrageSkus` | die Kennungen, damit sie nennbar bleiben |
| `verkaeuflich` | Artikelzahl **ohne** die Anfrageartikel |
| `grund` | „Einkaufspreis nur auf Anfrage — Gate 24: was der Shop nicht rechnen kann, kann er nicht anbieten." |

Getrennt von `nurBeipack` und `ohneListe`, weil es ein anderer Fall ist:
Dort fehlt ein Vergleichsmaßstab oder ein Preisvorteil, hier fehlt der
**Einkaufspreis selbst**.

### Die Sperre steht vor dem Blick in die Preisdatei

Das ist der eigentliche Zahn der Sache und die Stelle, an der ein
naheliegender Aufbau versagt hätte. Läge in `preise/baustoff-preise.json`
aus irgendeinem Grund eine Zahl für so einen Artikel — ein Angebot von
vorgestern, ein Telefonat, das jemand notiert hat —, dann würde eine
Prüfung *nach* dem Preisabgleich den Artikel verkäuflich machen.

> **Ein tagesaktueller Preis ist keine Kalkulationsgrundlage, auch wenn ihn
> jemand einmal aufgeschrieben hat.** Genau darum ging es bei der
> Entscheidung; eine Umsetzung, die das aufgeschriebene Telefonat gelten
> lässt, hebt sie wieder auf.

Ein Testfall hält das fest: Katalogartikel auf Anfrage **plus** Preis in
der Preisdatei → `vkNetto` bleibt `null`.

### Der Shop lässt sie weg — und sagt es

`npm run website` filtert die Anfrageartikel aus dem Katalog, bevor Seiten
entstehen, und meldet sie beim Bauen mit Kennung:

```
Gate 24 — 1 Artikel ohne Seite (Einkaufspreis nur auf Anfrage): LGH-PROBE-1
```

**Still verschwinden darf nichts.** Eine Ware, die aus dem Katalog fällt,
ohne dass es jemand sieht, ist derselbe Fehler wie eine Zahl, die berechnet
und verschwiegen wird — nur in die andere Richtung. Dieses Vorhaben hat die
erste Richtung fünfmal aufgeschrieben; die zweite ist genauso teuer, weil
niemand eine Lücke sucht, von der er nichts weiß.

## Die Gegenprobe

Nach dem bewährten Verfahren: Katalogdatei kopieren, einen Artikel auf
Anfrage einsetzen, laufen lassen, Kopie zurückspielen. Kein
`git checkout` — sonst wäre die Gegenprobe selbst die gefährlichste
Operation im Lauf.

| Probe | Ergebnis |
|---|---|
| Anfrageartikel im Katalog | `vkNetto: null`, Grund im Klartext, `nurAnfrage: ['LGH-PROBE-1']` |
| **derselbe Artikel mit Preis in der Preisdatei** | **`vkNetto: null`** — die Sperre hält |
| Befund | 47 Artikel gesamt, **46 verkäuflich** |
| Bau | 77 Seiten wie zuvor, Artikel gemeldet und weggelassen |
| Katalog ohne Anfrageartikel | unverändert; `nurAnfrage` leer |

Die letzte Zeile ist die, die man vergisst: Eine Sperre, die auch dann
etwas tut, wenn kein Fall vorliegt, ist schlimmer als keine.

## Was das für den zweiten Bezugsweg heißt

Der Weg über das Lagerhaus ist **nicht** entschieden — er setzt einen
Vertrag und damit eine Anfrage an Dritte voraus. Was jetzt feststeht, ist
die Aufnahmeprüfung für den Tag, an dem er entschieden würde:

1. Artikel aus der Konditionsliste übernehmen, mit `ekQuelle: 'anfrage'`
   für jede Zeile, die dort „ANFRAGE" trägt.
2. Der Rechenkern verwirft sie, der Shop lässt sie weg, der Bau nennt sie.
3. Für die übrigen bleibt Gate 22 zuständig — und ohne Werkspreisliste ist
   auch deren Rabattsatz keine Zahl.

**Punkt 3 ist weiterhin die harte Grenze.** Gate 24 klärt, was gar nicht
erst infrage kommt; es macht aus den übrigen Rabattsätzen keine Preise.

650 Testfälle grün, davon 4 neue. 11 Oberflächenszenarien grün.
