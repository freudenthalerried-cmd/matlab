# Die Uhr in der Probe

**10. September 2026, 00:01 Uhr Ortszeit** (die Rechneruhr stand noch auf dem 9.)

Ein Neubau der Website, ein Testlauf, und eine Probe war rot, die den ganzen
Abend grün war:

```
POS-21382: nennt das Alter nicht
```

Die gebaute Artikelseite sagt *„Diese Grundlage ist 107 Tage alt"*. Die Probe
rechnete 106.

---

## Was passiert war

Vor zwei Runden bekam dieser Bestand einen Kalender. `src/geschaeftszeit.js`
beantwortet seither die Frage, welcher Tag heute ist — für einen Betrieb in
Ried in der Riedmark, nicht für einen Rechner in einem Rechenzentrum. Sieben
Stellen wurden damals umgestellt, ein Register führt jede Stelle, die von sich
aus auf die Uhr sieht, und `npm run pruefe-zeit` hält das Register gegen den
Quelltext.

Um 22:01 Uhr UTC war es in Wien **00:01 Uhr des Folgetags**. `npm run website`
stempelte die Seiten mit dem Geschäftskalender: der 10. September, das
Preisalter um einen Tag höher. Die Probe daneben las

```js
const HEUTE = new Date().toISOString().slice(0, 10);
```

— den 9. September. Zwei Uhren, ein Tag Unterschied, eine rote Probe.

> **Eine Probe, die zwei Uhren vergleicht, prüft den Kalender des Rechners,
> nicht den des Betriebs.**

---

## Warum der Prüfer, der genau das misst, es nicht gesehen hat

`bin/zeitpruefung.mjs` sammelt seine Dateien so:

```js
for (const ordner of ['src', 'bin']) {
```

Seine Liste endete an der Grenze zwischen Quelltext und Probe. Für diese Grenze
gab es einen Grund, der beim Bauen einleuchtet — Belege entstehen im Quelltext,
nicht in Testfällen — und der genau das ausschloss, was heute Nacht auffiel:
Eine Probe erzeugt zwar kein Belegdatum, aber sie **urteilt über eines.**

Das ist zum dritten Mal in fünf Runden derselbe Satz:

> **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
> ausschließt.**

---

## Gemessen: vier Stellen, nicht eine

Mit `test` in der Liste sind es vier Proben, die von sich aus auf die Uhr sehen
— und alle vier halten das Ergebnis gegen ein Erzeugnis, das der
Geschäftskalender gestempelt hat:

| Probe | was sie mit der Uhr tut | was schiefgeht |
|---|---|---|
| `preisstand-auf-der-seite.test.js` | Vergleichsdatum für das Preisalter | die heute Nacht rote |
| `inhaltsstand.test.js` | Heute gegen die Git-Stände der Inhaltsseiten | urteilt abends anders als vormittags |
| `sitemapstand.test.js` | Heute gegen die Datumsangaben der sitemap.xml | die sitemap.xml geht so an Google |
| `bestellungphp.test.js` | Wirtschaftsjahr der Journaldatei | **am 31. Dezember nach 23:00 Uhr Ortszeit sucht sie die falsche Datei** |

Der letzte ist der unangenehmste. `bestellung.php` wählt seine Journaldatei
seit dem 9. September über `Europe/Vienna` — das war der Kern des damaligen
Befunds. Die Probe, die diesen Fehler bewacht, suchte die Datei weiter mit dem
**UTC-Jahr**. Sie hätte den Fehler, gegen den sie steht, am Jahreswechsel selbst
begangen.

Alle vier rufen jetzt `geschaeftstag()` beziehungsweise `geschaeftsjahr()`,
stehen mit Grund im Register, und der Prüfer liest `src`, `bin` **und** `test`.

---

## Zwei Nebenfunde beim Einbauen

**Der Prüfer meldete siebzehn Uhrgriffe in der Datei, die ihn prüft.**
`test/geschaeftszeit.test.js` baut sich Quelltexte, an denen es den Zähler
misst — `new Date()`, `gmdate(`, `date(` stehen dort als Zeichenketten. Ein
Prüfer kann Zitat und Aufruf nicht unterscheiden; dafür gibt es die Kategorie
`uhr: 'zitat'`, und die Zahl steht genau, damit ein echter Uhrgriff, der sich
in diese Datei verirrt, die Summe verschiebt.

**Die neue Gegenprobe hat ihren eigenen Prüfer rot gemacht, bevor sie lief.**
Ihr Mutationstext enthält die Zeile `new Date().toISOString()` — als
Zeichenkette in `src/gegenprobenregister.js`, wo bereits eine solche stand. Der
Prüfer zählte zwei statt einer und meldete, zu Recht, eine Abweichung. Der Lauf
brach mit *„war schon vorher rot"* ab. Zum zweiten Mal in zwei Runden hat sich
eine Gegenprobe an ihrem eigenen Text gestoßen; beide Male war die Meldung
richtig und der Zähler musste nachgeführt werden.

---

## Was das nicht löst

Der Kalender steht, die Proben stehen darunter, der Prüfer sieht sie. Was
weiterhin **niemand** gemessen hat, ist die Zeitzone des Hostings bei All-Inkl:
`bestellung.php` setzt sie seit dem 9. September selbst, aber ob das Skript
dort läuft, wie es hier läuft, sagt erst der erste echte Datensatz.

Und ein Handgriff bleibt offen, den diese Nacht nebenbei sichtbar gemacht hat:
Der Suchtext der Gegenprobe `der-kopf-des-registers-zaehlt-anders-als-die-tabelle`
ist auf das Zahlwort im Kopf des Gate-Registers verankert — auf genau die
Stelle, die sich mit jedem neuen Gate ändert. Er ist jetzt zum dritten Mal
nachgezogen worden (31 → 32 → 33). Was ihn heilte, wäre ein **Suchmuster statt
eines Suchtextes**; der Läufer kennt bisher nur Zeichenketten. Steht als eigene
Aufgabe an.
