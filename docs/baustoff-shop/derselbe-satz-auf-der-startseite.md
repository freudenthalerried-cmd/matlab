# Derselbe Satz, auf der Startseite

**5. September 2026, abends.** Die Startseite gelesen — die einzige
Kundenfläche, die in dieser Reihe noch fehlte. Sie ist die Seite, auf der
jeder zuerst landet: der bezahlte Klick über die Marke, der direkte Besucher,
der Assistent.

Im ersten Satz unter der Hauptüberschrift stand:

> „Was ein Baumeister im Einkauf zahlt, **zahlen Sie auch** — deshalb liegen
> 39 von 46 Artikeln unter dem Listenpreis des Lieferanten, im Median um
> 26,7 %."

Die zweite Hälfte ist belegt und richtig. Die erste ist es nicht: Der Kunde
zahlt den Baumeister-Einkauf **plus 25 %**. Die eigene Wissensseite sagt es im
zweiten Satz — „…zuzüglich eines Aufschlags, aus dem dieser Shop betrieben
wird."

---

## Das ist derselbe Satz, den ich heute Nachmittag entfernt habe

Vor drei Runden stand in der WDVS-Anzeige „Ein Baumeister kauft ein, Sie
zahlen seinen Preis". Ich habe ihn beanstandet, ersetzt, ein Register
`PREISAUSSAGEN` dafür gebaut, eine Gegenprobe dazu, und aufgeschrieben, dass
eine Preisangabe in einer Werbung die Gattung ist, bei der eine falsche
Aussage nicht nur enttäuscht.

Und ihn auf der Startseite stehen lassen.

> **Der Prüfer, den ich dagegen gebaut habe, liest nur die Anzeigen.**

`pruefeTexte` läuft in `bin/kampagne.mjs` über `anzeigen` — dreimal sieben
Überschriften und vier Beschreibungen. Die 81 gebauten Seiten sieht es nicht.
Dieselbe Familie wie „eine Fläche gebessert, drei blank" und „der Prüfer las
ein anderes Blatt", nur diesmal mit meiner eigenen Runde als Vorgeschichte.

---

## Und über die Seiten gelaufen hätte es nichts gefunden

Das ist der unangenehmere Teil. Ich habe das Register versuchsweise über alle
81 Seiten laufen lassen, bevor ich etwas änderte:

```
Treffer: 0 in 81 Seiten
```

Die drei Muster kannten `zahlen … (seinen|den|unseren) Preis`, `zum
Einkaufspreis`, `ohne Aufschlag`. Die Behauptung auf der Startseite hängt am
Wort **„auch"** und kommt ohne „Preis" aus.

> **Ein Register aus Mustern, die aus einem beobachteten Fall abgeleitet sind,
> deckt genau diesen Fall.**

Ergänzt sind zwei Muster für die Gleichsetzung ohne das Wort „Preis" — eng
gehalten, weil „zahlen Sie auch" allein in einem Satz über die Umsatzsteuer
richtig wäre: Verlangt wird ein Wort der Einkaufsseite im selben Satz.

---

## Wo die Register jetzt stehen

`PREISAUSSAGEN` und `VORRATSWORTE` sind nach **`src/aussagen.js`** gezogen.
Beides sind Aussagen über den **eigenen Bestand**, die auf jeder Fläche gleich
falsch sind: Es gibt keinen Aufschlag von null, und es gibt kein Lager.
`bin/kampagne.mjs` und `npm run pruefe-seiten` lesen sie von dort.

Gesucht wird im **Text**, nicht im Markup: Die Startseite bricht den Satz über
zwei Zeilen, und ein Muster über rohes HTML hätte ihn auch jetzt nicht
gefunden — dieselbe Falle wie heute Abend beim Herkunftsmuster.

**Neuer Satz:** „Der Einkauf eines Baumeisterbetriebs ist unsere Grundlage —
deshalb liegen 39 von 46 Artikeln unter dem Listenpreis…" Dasselbe
Verkaufsargument, dieselbe belegte Zahl, keine behauptete Gleichheit — und mit
dem Wort, das die Wissensseite benutzt.

---

## Der Fehlalarm, der zu Recht kam

Der erste Lauf über die 81 Seiten meldete zwei Fundstellen. Die zweite war
`wissen/xps-oder-eps.html`:

> „Welche Stärke die richtige ist, ergibt sich aus dem Wärmeschutznachweis des
> Bauvorhabens — nicht aus dem Preis und **nicht aus dem, was vorrätig ist**."

Eine **Verneinung**, und das Gegenteil einer Zusage. Der Satz steht dort, um
genau die Erwartung abzuräumen, gegen die die Regel gebaut ist.

Das ist der Unterschied zwischen den Flächen, den die Regel beim Umzug
mitbekommen musste: In einer Überschrift von dreißig Zeichen ist ein
Vorratswort immer ein Versprechen; in einem Fließtext kann es verneint sein.

Nicht über eine Verneinungserkennung gelöst — „nicht immer vorrätig, aber
meist" wäre eine Zusage und rutschte durch. Stattdessen ein Verzeichnis
`HINGENOMMENE_STELLEN` mit Grund, gehalten in beide Richtungen: Ein Eintrag,
dessen Stelle es nicht mehr gibt, ist ein Befund.

*Vierter Fehlalarm dieser Art an einem Tag — 216 richtige „Listenpreis"-Stellen,
25 richtige Artikelseiten, acht richtige Beschreibungsgruppen, und jetzt ein
richtiger Satz über XPS. Jedes Mal war der erste Entwurf zu grob.*

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-seiten` liest zwei Register mehr |
| Neue Gates | keine |
| Gegenproben | **68 für 35 Prüfer** (vorher 67) |
| Geprüfte Flächen für Preisaussagen | **81 Seiten + 3 Anzeigen** (vorher 3 Anzeigen) |
| Testfälle | 1641 |

## Was offen bleibt

- **`suche.html`** ist die letzte ungelesene Kundenfläche. Sie trägt 214
  Zeichen eigenen Text und `noindex,follow`; viel kann dort nicht stehen, aber
  gelesen ist sie nicht.
- **Der Vorbehalt zum Liefergebiet** steht in `areaServed` immer noch nicht
  dabei — er steht in `LIEFERGEBIET.vorbehalt` und im Feed-Bericht.
- **Die übrigen Anzeigenregister** (`VOLLSTAENDIGKEITSWORTE`,
  `GEBINDEAUSSAGEN`) sind bewusst **nicht** mitgezogen: „komplett" auf einer
  Wissensseite ist eine andere Aussage als in einer Anzeigenüberschrift, und
  ein vierter Fehlalarm am selben Tag wäre einer zu viel.
