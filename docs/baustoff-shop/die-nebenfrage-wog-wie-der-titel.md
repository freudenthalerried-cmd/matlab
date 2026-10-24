# Die Nebenfrage wog wie der Titel

**13. September 2026, vierte Runde des Tages.** Die drei Runden davor sind
alle an derselben Sorte Zeile hängengeblieben: ein geratener Rückfall, der als
Bequemlichkeit beginnt und als Auskunft endet — `gebinde || 1`,
`mengenschritt(artikel) || 1`. Diese Runde beginnt deshalb mit einer Suche
danach.

```
$ grep -rE "\|\| 1\b|\?\? 1\b" src/ bin/ shop-ui.js
src/shopkern.js:392:    punkte *= GEWICHT[e.art] ?? 1;
```

## Sechs von sechsundsiebzig

`GEWICHT` ist das Verzeichnis, das jeder Trefferart ihr Gewicht in der Suche
gibt. Es kannte vier Arten. Der **ausgelieferte** Index führt fünf:

```
Arten im Suchindex: { artikel: 46, wissen: 13, gruppe: 7, system: 4, dienst: 6 }
  OHNE GEWICHT: dienst -> 6 Einträge, Rückfall 1
```

Die sechs Dienstseiten — **Lieferung, Impressum, AGB, Datenschutz, Rechtliches,
Abnahme** — standen in keiner Zeile des Verzeichnisses.

> **Sechs von sechsundsiebzig Einträgen wurden von einem Rückfall gewichtet,
> und niemand hätte es gemerkt.**

## Und was dabei auffiel, war schlimmer

Beim Nachmessen der Wirkung stand da:

```
$ suche „lieferung"
   11,0  dienst   Geschäftsbedingungen
   10,7  dienst   Lieferung und Frachtkosten
```

> **Die Seite, die „Lieferung und Frachtkosten" heißt, stand hinter den AGB.**

Beide bekamen 12 Punkte für einen genauen Treffer. Entschieden hat dann der
Längenabzug: „Geschäftsbedingungen" hat zwanzig Zeichen, „Lieferung und
Frachtkosten" sechsundzwanzig.

Warum die AGB überhaupt 12 Punkte bekamen, steht in ihrer Frage:

> „Zu welchen Bedingungen wird verkauft — welche Zahlungsarten, **welche
> Lieferung**, welcher Eigentumsvorbehalt?"

`baueSuchindex` legte Titel und Frage in denselben Topf:

```js
stark: indexwoerter(`${s.titel} ${s.frage ?? ''}`),
```

**Ein Wort in der Nebenfrage einer fremden Seite wog damit so viel wie derselbe
Titel.** Und das widerspricht dem Satz, der zehn Zeilen darüber steht: *„Ein
Treffer im Titel wiegt schwerer als einer im Fließtext."* Die Absicht war da,
die Frage saß auf der falschen Seite der Grenze.

## Die Frage ist ein eigener Rang

Sie ist mehr als Fließtext — sie ist vom Autor geschrieben, um genau die
Suchfrage abzubilden. Und sie ist weniger als der Name der Seite. Genau
dazwischen steht sie jetzt:

| Rang | Punkte |
|---|---|
| Wort steht im Titel | 12 / 8 / 6 |
| Wort steht in der Frage | **5** |
| Wort steht im Fließtext | 3 |

Danach:

```
   10,7  dienst   Lieferung und Frachtkosten
    4,9  gruppe   Zubehör und Kleinteile
    4,0  dienst   Geschäftsbedingungen
    4,0  wissen   Warum es hier keine Gratislieferung gibt
```

## Was die Änderung kostet

Nichts — gemessen, nicht behauptet. Über **alle 353 Wörter** des
ausgelieferten Index, jeweils der erste Treffer, alte Fassung gegen neue:

| | |
|---|---|
| unverändert | 299 |
| **besser** (das Wort steht jetzt im Titel des ersten Treffers) | **23** |
| schlechter | **0** |
| Treffer ganz verloren | **0** |

Die übrigen 31 sind neutral: Dort trägt weder der alte noch der neue erste
Treffer das Wort im Titel, beide sind über den Fließtext gefunden, und die
Reihenfolge ist so oder so willkürlich.

Beispiele aus den 23: „sackware" führt jetzt auf *Lagerung von Sackware und
Platten* statt auf die Gruppe *Mörtel und Putze*; „welche teile" auf *Welche
Teile ein Kaminzug braucht* statt auf *Mauerwerk*.

## Und das Gewicht der Dienstseiten ist gemessen, nicht gesetzt

Naheliegend wäre 2 gewesen, wie Gruppen- und Systemseiten. Ein Versuch damit
verschob 26 Ergebnisse, und mehrere davon in die falsche Richtung: Die Suche
nach „prüfen" hätte *Abnahme und Rügefrist* über *Untergrund prüfen, bevor
geklebt wird* gestellt.

> **Dienstseiten und Wissensseiten sind beides Text. Was sie trennt, gehört in
> den Treffer und nicht in die Art.**

Deshalb **1**, wie `wissen` — und damit ändert der Eintrag am heutigen Bestand
gar nichts. Das ist kein Grund, ihn wegzulassen: Was sich ändert, ist, dass die
Zahl **dasteht**, statt aus einem `??` zu kommen. Die nächste neue Seitenart
fällt dann auf, statt lautlos mit 1 zu laufen.

## Der Prüfer dazu

`gewichtsbefund(index)` hält das Verzeichnis gegen einen Index — in beide
Richtungen:

| Regel | Befund |
|---|---|
| `art-ohne-gewicht` | eine Art im Index, die das Verzeichnis nicht kennt — sie wird vom Rückfall bewertet |
| `gewicht-ohne-art` | ein Gewicht, dem keine Art mehr entspricht — eine Zeile, die nichts mehr tut |

Gerufen wird er im Testfall über den **ausgelieferten** Index, nicht über einen
gebauten. Das ist der Punkt: Ein Verzeichnis gegen erfundene Arten zu halten,
hätte den Fund nicht gemacht — die Art heißt `dienst`, und darauf wäre niemand
gekommen.

## Und beim Absichern fiel ein dritter auf

Die Gegenprobe zum Gewichtsverzeichnis schlug nicht an. Nicht, weil die
Mutation folgenlos wäre — sondern:

```
meldete rot an der erwarteten Stelle
nach dem Zurücksetzen nicht wieder grün — die Probe hat etwas hinterlassen
```

Sie hatte nichts hinterlassen. **Dieselbe Meldung ist heute dreimal
gekommen** — in der Runde über den Rückweg der Anfrage, in der über den
Bestellschritt und hier.

`test/erzeugnisfrische.test.js` prüft, ob die gebauten Erzeugnisse jünger sind
als ihre Quellen. Eine Mutation an einer Quelldatei des Bündels macht ihn
**durch ihre bloße Existenz** rot — und das Zurücksetzen macht ihn nicht wieder
grün: Die Datei ist danach wieder jünger als der letzte Bau.

Der Zeugenmechanismus vom 12. September schreibt **jede** rote Testdatei als
Zeugen mit. Der Frischewächter landete damit in vier Zeugenlisten und machte
jede „wieder grün"-Prüfung dieser vier Proben unmöglich.

> **Ein Wächter über die Frische der Erzeugnisse kann kein Zeuge einer
> Mutation sein: Er wird von jeder rot, und nach dem Zurücksetzen bleibt er es,
> bis jemand neu baut.**

`KEINE_ZEUGEN` in `src/zeugen.js` nimmt ihn heraus. Was er misst, bleibt
richtig und bleibt im Gesamtlauf; er sagt nur nichts darüber, ob eine Mutation
gefangen wurde. Bleibt nach dem Aussortieren kein Zeuge übrig, läuft beim
nächsten Mal die ganze Reihe — der sichere Ausgang, den `zeugen.js` von Anfang
an beschreibt: **ein falscher Alarm, kein falsches Grün.**

Gemessen: Die Gegenprobe, die vorher gar nicht anschlug, läuft jetzt in
**32 Sekunden** statt in 105 — der Zeuge tut endlich, wofür er da ist.

## Gegenproben

| Gegenprobe | was sie einsetzt |
|---|---|
| `die-nebenfrage-wiegt-wie-der-titel` | Titel und Frage liegen wieder in einem Topf |
| `die-dienstseiten-fallen-wieder-aus-dem-verzeichnis` | `dienst` verschwindet aus `GEWICHT` |
| `der-frischewaechter-wird-wieder-zeuge` | die Zeugenliste nimmt den Frischewächter wieder auf |
