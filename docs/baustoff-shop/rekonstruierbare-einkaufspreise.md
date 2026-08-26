# Die Regel schützt die Datei, nicht die Angabe

Stand: 2026-08-26. Im Wurzelverzeichnis steht seit dem 25. August eine
`.gitignore` mit einer Begründung, die ungewöhnlich klar ist:

> Einkaufskonditionen gehören nicht in ein öffentliches Verzeichnis. Die
> Rabattsätze, die ein Lieferant einem Baumeister einräumt, sind dessen
> Geschäftsgeheimnis und zugleich die Verhandlungsposition des
> Auftraggebers. Alles unter `preise/` bleibt lokal.

Die Regel wird eingehalten. `preise/baustoff-preise.json` ist nicht im
Verzeichnis, und kein Einkaufspreis steht wörtlich in einer Datei, die
mitgeliefert wird.

**Und trotzdem sind 44 von 46 Einkaufspreisen aus dem öffentlichen
Verzeichnis auf den Cent genau rekonstruierbar.**

## Die Rechnung, die jeder anstellen kann

Im Verzeichnis stehen zwei Dinge, die beide dort hingehören:

1. **Die Verkaufspreise.** Sie stehen auf 46 Artikelseiten unter
   `shop/ausgabe/`. Ein Shop ohne Preise ist kein Shop.
2. **Die Zielmarge.** „25 % Marge" steht in `PARAMETER.md`, in
   `marge-25-prozent.md`, im Quelltext als `ZIELMARGE = 0.25`, auf der
   veröffentlichten Kalkulationsseite und in einem Dutzend weiterer
   Dokumente. Sie ist die zentrale Kennzahl des Vorhabens.

Ein Schritt verbindet sie:

```
Einkauf = Verkauf × (1 − Marge)
```

`npm run pruefe-geheimnis` rechnet das nach — aus dem, was jeder sehen
kann — und vergleicht mit der vertraulichen Datei, sofern sie örtlich
vorliegt:

```
Durchgang 2 — Rekonstruktion aus Verkaufspreis und Zielmarge (25 %)
  44 von 46 Einkaufspreisen auf den Cent rekonstruierbar (96 %).
  2 weichen ab — durchweg Artikel am Listendeckel (Gate 22) …
```

**Nicht „ungefähr". Auf zwei Nachkommastellen.** Ein Lieferant, der die
eigene Kalkulation im Netz findet, liest keine Schätzung, sondern seine
eigene Rechnung — und sieht zugleich, welchem anderen Kunden er welchen
Satz gibt.

### Die einzige Stelle, die etwas verbirgt, ist eine Sperre

Die beiden Ausnahmen sind kein Zufall. Gate 22 kappt den Verkaufspreis am
Listenpreis des Lieferanten, wo die Zielmarge ihn darüber heben würde.
Genau dort greift die Rückrechnung zu tief:

| Artikel | rekonstruiert | tatsächlich | daneben |
|---|---|---|---|
| POS-53215 | 0,50 € | 0,60 € | 0,10 € |
| POS-31631 | 9,45 € | 10,08 € | 0,63 € |

**Ausgerechnet die Sperre, die den fehlenden Preisvorteil ausweist,
verbirgt nebenbei den Einkauf.** Was aus kaufmännischen Gründen gedeckelt
wurde, ist das Einzige, was nicht mehr zurückrechenbar ist.

## Was daraus folgt — und was nicht

**Es ist kein Fehler im Shop.** Ein Shop veröffentlicht Verkaufspreise;
das ist sein Zweck. Es ist auch kein Fehler in der `.gitignore` — sie tut
genau, was sie verspricht.

**Es ist eine Folge davon, dass das Repository öffentlich ist.** Der Punkt
steht seit Tagen auf der Liste („vor echten Preisen auf privat stellen"),
aber mit der falschen Frist: Er las sich, als sei noch Zeit, solange keine
Einkaufspreise eingecheckt sind. Eingecheckt ist keiner. Ableitbar sind
sie trotzdem seit dem Tag, an dem der echte Katalog kam.

> **Die Sperre war nie „keine Einkaufspreise im Verzeichnis". Sie war
> „keine Verkaufspreise im Verzeichnis, solange die Marge dort steht".**
> Nur hat das niemand so formuliert, und deshalb sah die eingehaltene
> Regel wie Schutz aus.

## Drei Möglichkeiten, mit Kosten

| | Wirkung | Kosten |
|---|---|---|
| **A — Repository privat stellen** | vollständig; alles andere bleibt, wie es ist | eine Einstellung beim Anbieter; Sache des Auftraggebers |
| **B — `shop/ausgabe/` nicht mehr mitliefern** | die 46 Artikelpreise verschwinden aus dem Verzeichnis | die gebaute Website ist im Verzeichnis nicht mehr nachlesbar, nur noch erzeugbar (`npm run website`); die Warenkorbwerte in `kampagne-gerechnet.md` bleiben und erlauben eine grobe Rückrechnung |
| **C — nichts tun und es wissen** | keine | die Verhandlungsposition beim nächsten Konditionengespräch |

**Empfehlung: A, und zwar vor der nächsten Preisänderung.** B ist ein
halber Schritt — es entfernt die genauen Artikelpreise, nicht die
Rechnung. C ist vertretbar, solange nichts verkauft wird und niemand das
Verzeichnis kennt; beides ändert sich mit dem ersten geschalteten Klick.

**A ist nicht meine Entscheidung.** Es ist eine Einstellung am Konto des
Auftraggebers. B wäre eine, aber sie nimmt dem Verzeichnis den Beleg für
den Zustand der Website, und dieser Beleg ist mehrfach als Schaufenster
gegen den Text abgeglichen worden. Deshalb ist hier nichts entfernt,
sondern gemessen — die Zahl steht, die Wahl liegt beim Auftraggeber.

## Der erste Durchgang: wörtlicher Abfluss

Fünf Meldungen, alle angesehen, keine ein Leck:

| Fundstelle | Befund |
|---|---|
| `shop/data/lieferanten.json` (3×) | Rabattsätze 30 / 42 / 38 % — die drei **Radon**-Lieferanten, in derselben Datei ausdrücklich als `konditionenStand: platzhalter` gekennzeichnet. Erfundene Zahlen. |
| `shop/demo.html` | dieselbe Datei, ins Funktionsmuster eingebettet |
| `docs/…/import-riegel-umgangen.md` | „Mit bestätigtem Einkaufspreis: 4 von 4" — eine **Anzahl**, kein Preis. Fehltreffer aus dem Fließtext. |

Der echte Poschacher-Satz steht dort nicht: In `lieferanten.json` ist
`haendlerrabattAufUvp: null`, mit dem Hinweis, dass der Satz artikelgenau
ist und von 10 bis 88 % reicht. Diese **Spanne** steht allerdings
öffentlich in `katalog-aus-rechnungen.md`, zusammen mit dem Median von
27 % unter Liste — für sich noch keine Kalkulation, aber die Bestätigung,
dass die Rückrechnung in der richtigen Größenordnung landet.

46 Dateien unter `test/` und `beispiel/` sind übergangen; dort stehen
erfundene Zahlen, das ist ihr Zweck. Der Lauf sagt es, statt es zu
verschweigen — eine Prüfung, die stillschweigend Bereiche auslässt, meldet
Grün für etwas, das sie nicht angesehen hat.

## Was gebaut wurde

| | |
|---|---|
| `src/geheimnis.js` | `rekonstruiereEinkauf`, `rekonstruierbarkeit`, `findeAbfluss`, `ABFLUSSMUSTER` |
| `bin/geheimnispruefung.mjs` | `npm run pruefe-geheimnis` — beide Durchgänge |

Der Prüfer liest die vertrauliche Datei **nicht**, um seinen Befund zu
erheben; er braucht sie nur für die Gegenprobe. Ein Prüfer eines
öffentlichen Verzeichnisses, der zum Prüfen das Geheimnis benötigt, ist
als solcher wertlos. Fehlt die Datei, sagt er das — und ausdrücklich
dazu, dass ihr Fehlen kein Freispruch ist.

Ein Fehltreffer beim Bauen ist erwähnenswert, weil er das Muster dieses
Vorhabens wiederholt: Die erste Fassung meldete die Zeile

```js
const hebel = t.einkaufNetto > 0 ? t.warenwertNetto / t.einkaufNetto : 1;
```

als Einkaufspreis mit Wert — der Doppelpunkt kam aus einem
Bedingungsausdruck, nicht aus einer Zuweisung. **Ein Prüfer, der den
Rechenkern meldet statt des Lecks, wird abgeschaltet statt befolgt.**

616 Testfälle grün, davon 9 neue. Drei Mutationen gegengeprüft:
Wortgrenze entfernt (1 Fall fällt), Abweichung immer null (1), Marge
statt Gegenmarge gerechnet (3).
