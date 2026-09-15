# Der Pfad stand auf jeder Seite

**7. September 2026.** Jede Seite dieses Shops trägt oben eine Krume — *Start ›
Wissen › …* Gezählt über den gebauten Bestand:

```
Seiten mit sichtbarem Pfad:   81 von 82
Seiten mit BreadcrumbList:     0
```

Die Krume sagt dem Leser, wo er steht. Eine Suchmaschine stellt denselben Pfad
statt der nackten Adresse ins Ergebnis — wenn er ausgezeichnet ist.

> **Der Pfad stand auf jeder Seite und in keiner Auszeichnung.** Dieselbe
> Familie wie gestern das Änderungsdatum, das die Seite kannte und die Sitemap
> verschwieg.

---

## Erst der Pfad, dann die Auszeichnung

Beim Nachsehen war die Krume selbst unvollständig. Sie endete beim **Bereich**,
nicht bei der Seite:

| | vorher | jetzt |
|---|---|---|
| Artikelseite | Start › WDVS | Start › WDVS › Capatect Putzgrund weiß 25 kg |
| Wissensseite | Start › Wissen | Start › **Wissen** (verlinkt) › XPS oder EPS — welche Platte wohin |
| Rechtsseite | Start › Rechtliches › Geschäftsbedingungen | unverändert — sie hatte es von Anfang an |

Eine Auszeichnung aus der alten Krume hätte einer Suchmaschine gesagt, diese
Seite **heiße „Wissen"**. Und die Wissensübersicht stand da, ohne aus der Krume
erreichbar zu sein — jetzt ist sie es.

---

## Aus der gerenderten Seite, nicht aus einer zweiten Liste

Die Auszeichnung entsteht im Rahmen, der die fertige Seite sieht. Der Grund
steht seit dem 5. September im Kopf von `mitMindestwert` und gilt hier
genauso:

> *Ein Absatz, den jeder Seitentyp selbst anhängt, ist ein Absatz, den ein
> fünfter Seitentyp vergisst.*

Dazu der zweite Grund: Zwei Listen laufen auseinander, und **eine
Auszeichnung, die etwas anderes sagt als die Seite, ist eine Behauptung an eine
Maschine.** Der Prüfer hält beides gegeneinander — Pfad und Liste müssen
dieselben Stufen in derselben Reihenfolge nennen.

**Die Wurzel bekommt die Schreibweise, die auch das `canonical` nennt**
(`bauversand.com/`, nicht `/index.html`). Der Fehler, den die Sitemap am
3. September hatte, wäre hier zum zweiten Mal entstanden.

**Ohne Kanonisch keine Krume:** Die Fehlerseite zeigt einen Pfad und trägt
bewusst kein `rel="canonical"` — sie wird unter jeder Adresse ausgeliefert, die
es *nicht* gibt. Eine `BreadcrumbList` behauptete genau das, was das Kanonisch
dort nicht sagen darf. Geprüft wird diese Ausnahme **an der Seite**, nicht an
einer Namensliste: Wer eine zweite Seite ohne Kanonisch baut, bekommt dieselbe
Regel, ohne daran zu denken.

Stand: **80 von 82 Seiten** tragen die Auszeichnung — alle außer der Startseite
(eine Stufe ist keine Liste) und der Fehlerseite.

---

## Und die Suche, die niemand angemeldet hat

Der Shop hat eine funktionierende Suche, die ihre Anfrage in der Adresse trägt
(`suche.html?q=…`). Die Startseite meldete sie nicht an. Für eine Suchmaschine
ist das eine Angabe, die sie kennen will: Sie stellt das Suchfeld neben das
Ergebnis, statt den Besucher erst auf die Startseite zu schicken.

Neu auf der Startseite: ein `WebSite`-Knoten mit `SearchAction` und **der
echten** Adressvorlage — derselben, die die Vorschlagsliste unter dem Suchfeld
baut. Eine erfundene Vorlage führte auf eine leere Trefferliste, und das wäre
dieselbe Sorte Zusage wie ein Keyword, das die eigene Suche nicht beantwortet.

---

## Geprüft

`test/krume.test.js`, zwölf Fälle: das Zerlegen der Krume, das Auflösen der
Verweise, die Wurzelschreibweise, die Ein-Stufen-Krume, beide Regelrichtungen,
die Ausnahme ohne Kanonisch — und vier über den **Bestand**: Jede Seite mit
Pfad zeichnet ihn aus und sagt dasselbe, der Pfad endet bei der Seite selbst
(an drei Seitentypen nachgesehen), und die Startseite meldet ihre Suche mit
einer Adresse an, die es gibt.

**Ein bestehender Testfall hat mitgearbeitet:** *„die Startseite hat genau eine
Schreibweise"* las den **ersten** Auszeichnungsblock und prüfte dessen `url`.
Mit dem zweiten Knoten daneben hätte er die zweite Schreibweise nicht gesehen.
Er liest jetzt alle Knoten und verlangt von jedem dieselbe Adresse.

Gegenprobe `pfad-auf-der-seite-ohne-auszeichnung` nimmt die Auszeichnung den 46
Artikelseiten wieder weg — der Hälfte, bei der der Pfad am meisten trägt, weil
er die Warengruppe nennt.
