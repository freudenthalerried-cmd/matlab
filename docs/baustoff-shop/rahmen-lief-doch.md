# Der Rahmen lief doch — die Ursache saß im Proxy

**28. August 2026.** Am 27. stand hier eine gemessene Tatsache:

> **Ein eingebettetes Dokument führt in diesem Headless-Chromium seine
> Skripte nicht aus.** Beide `<script>`-Elemente vorhanden, `window.__SHOP__`
> undefiniert.

Die Messung war echt. Die Ursache war falsch zugeordnet — und die falsche
Zuordnung hat zwei Prüfszenarien gekostet.

## Was tatsächlich passiert

Jede Seite bindet Schriften von `fonts.googleapis.com` ein. In dieser
Umgebung läuft jeder ausgehende Aufruf über einen Proxy, und dieser Aufruf
**hängt dort, statt zu scheitern**. Ein hängendes Stylesheet im Kopf hält den
Parser an: Das nachfolgende `<script src="shop.js">` wird nicht mehr geparst,
`document.readyState` bleibt auf „loading", und die Seite hat kein Skript.

Derselbe Aufbau, zweimal gemessen:

| | Skripte im DOM | `window.__SHOP__` | `readyState` |
|---|---|---|---|
| mit Proxyvariablen | 1 von 2 | undefined | loading |
| ohne Proxyvariablen | 2 von 2 | **object** | **complete** |

Nicht der Rahmen. Nicht Chromium. Der Proxy.

> **Eine Beobachtung ist keine Ursache.** „Das Skript läuft im Rahmen nicht"
> war richtig beobachtet und falsch erklärt — und die Erklärung, nicht die
> Beobachtung, ist danach zur Grundlage von Entscheidungen geworden.

Die falsche Erklärung hatte die bequeme Eigenschaft, endgültig zu klingen:
eine Eigenschaft der Umgebung, gegen die nichts zu machen ist. Genau deshalb
wurde nicht weitergesucht.

## Was daraus folgt

**1. Chromium startet ohne Weg nach außen.** `--proxy-server=127.0.0.1:9`
mit `--proxy-bypass-list=127.0.0.1`, dazu geleerte Proxyvariablen für das
Kind. Was die Seite an fremden Adressen einbindet, scheitert jetzt sofort
statt langsam — in `shopprobe` und in `oberflaechenprobe`.

**2. Die zwei entfernten Szenarien sind wieder da.** Warenkorb mit drei
Positionen und Kasse mit gefülltem Korb, beide im 390-px-Rahmen, beide mit
`mindestens`-Absicherung gegen die leere Seite. Gegenprobe: mit leerem Korb
fällt das Warenkorbszenario um. **28 Szenarien, davon 8 im Rahmen.**

Beide Seiten sind damit zum ersten Mal überhaupt bei 390 px gemessen worden.
Ergebnis: kein Seitwärtsrollen, kein Bedienelement unter 44 px, nichts, was
über den Rand ragt. Das ist ein Negativbefund — und der ist hier trotzdem
etwas wert, weil er vorher schlicht nicht vorlag.

**3. Der Widerruf steht im Register.** `rahmen-ohne-javascript` in
`src/widerruf.js`, mit einem Muster, das die Aussage in jeder Schreibweise
findet. Es meldete sofort zwei Fundstellen: `STATUS.md` und das
Ursprungsdokument selbst. Beide tragen jetzt ihren Widerruf.

Der erste Musterentwurf fand nur **eine** der beiden — er verlangte das Wort
„Rahmen" in der Nähe. Das Ursprungsdokument sagt an der entscheidenden Stelle
„sie", nicht „der Rahmen". Ein Widerrufsmuster, das die Höflichkeitsform der
deutschen Sprache nicht überlebt, ist keins.

## Die Grenze, die bleibt

Die Probe misst jetzt garantiert **ohne die Webschrift** — sie lädt in dieser
Umgebung ohnehin nie, jetzt scheitert sie nur schneller. Gemessen wird der
Umbruch mit den Ersatzschriften der Maschine. **Ein Umbruchfehler, der erst
mit „Barlow Condensed" entsteht, fällt hier nicht auf.** Das ist die Grenze
dieser Probe, und sie steht als solche im Werkzeug — nicht als Nebensatz.

Der bekannte AGB-Fehler (437 px breite Überschrift) wäre auch mit
Ersatzschrift aufgefallen; ein knapperer Fall vielleicht nicht.

## Stand

- 714 Tests grün
- `shopprobe` **28 Szenarien** (vorher 26), davon **8 im 390-px-Rahmen**
  (vorher 6); `oberflaechenprobe` 11
- `pruefe-widerrufe`: 130 Dateien, **44** Fundstellen, alle mit Widerruf in
  Sichtweite (vorher 43)
- `pruefe-inhalte` 24/355/0, `pruefe-seiten` 57/216/0, `pruefe-pruefer` 6
- Website 81 Seiten ohne toten Verweis
