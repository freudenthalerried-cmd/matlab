# Das Liefergebiet stand überall, wo eine Maschine liest

**31. August 2026.** Ich habe heute früh in `bauversand-com.md` geschrieben,
das Liefergebiet stehe „in der Kopfzeile jeder Seite". Dann habe ich
`gruppe/kamin.html` gelesen wie jemand, der auf eine Anzeige geklickt hat, und
nachgezählt.

```
81 Seiten: 3 nennen das Liefergebiet, 78 nicht
Ohne Liefergebiet: 46 artikel, 14 wissen, 7 gruppe, 4 wurzel, 4 system, 3 rechtliches
Die drei Landeseiten des ersten Anlaufs:
   gruppe/wdvs.html         NENNT ES NICHT
   gruppe/daemmung.html     NENNT ES NICHT
   gruppe/kamin.html        NENNT ES NICHT
```

Der Hauptbereich von `gruppe/kamin.html` hatte 2.257 Zeichen. Darin neunmal
„netto" — und **null** Treffer für „Fracht", „Liefer", „Bezirk" und
„Umsatzsteuer". Auf der ganzen Seite kamen „Perg", „Liefergebiet" und
„Bezirk" nicht vor.

## Was daran das Teure ist

Die Aufzählung in meinem falschen Satz war nicht erfunden. Das Liefergebiet
stand tatsächlich in `llms.txt`, in den strukturierten Daten (`areaServed`)
und in der Kasse, die einen Bezirk außerhalb des Gebiets mit Begründung
ablehnt.

Das sind drei Stellen, an denen eine **Maschine** liest.

Für einen Shop, der ausdrücklich auf Auffindbarkeit durch Sprachmodelle
optimiert wird, ist das eine naheliegende Reihenfolge — und hier war sie
vollständig. Der Besucher kam darin nicht vor. Die Kette, die dabei
herauskommt, ist:

> Die Anzeige verspricht „Lieferung Perg bis Linz". Der Klick kostet Geld.
> Die Seite, auf der er landet, sagt weder, wohin geliefert wird, noch dass zu
> den gezeigten Nettopreisen Fracht kommt. Wer in Salzburg sitzt, erfährt es
> in der Kasse — nach dem bezahlten Klick.

Das Ziel ist der erste Verkauf über Shop und Werbung. Ein bezahlter Klick, der
an einer nicht genannten Bedingung scheitert, ist genau der Weg, auf dem das
Werbebudget verschwindet, ohne dass in der Auswertung ein Fehler steht.

## Abgestellt

`LIEFERBEZIRKE` wird einmal aus `LIEFERGEBIET.bezirke` gebildet
(`aufzaehlung()` in `format.js`, neu) und an drei Stellen ausgegeben:

| Ort | Was dort jetzt steht |
|---|---|
| Seitenfuß, alle 81 Seiten | Bezirke, „regional, nicht österreichweit", Fracht je Lieferung, kein Frei-Haus-Versand |
| Gruppenseiten, **über** dem Warenraster | netto + Umsatzsteuer, Bezirke, Fracht getrennt, Selbstabholung |
| Lieferseite, Tafel | `LIEFERGEBIET.bezirke.length` Bezirke statt handgeschriebenem „~40 km" |

Über dem Raster und nicht darunter: Wer auf ein Preisraster klickt, liest die
Zahlen. Der Kasten ist die Bedingung, unter der sie gelten.

Nachgezählt mit demselben Zähler wie vorher: **81 von 81**, die drei
Landeseiten darunter.

## Der Fund, der beim Hinsehen mitkam

Beim Schreiben des Frachthinweises habe ich `bin/widerrufpruefung.mjs`
laufen lassen. Grün, 219 Dateien, keine Meldung.

Gleichzeitig stand in `ausgabe/site/lieferung.html`:

> „Weil die Frachtpauschale bei unserem Lieferanten **auf jedem Beleg** steht."

Dieser Satz ist am **27. August** zurückgenommen worden. Fracht steht auf drei
von fünfzehn Rechnungen; elf lauten „Abholung Kunde". Er stand an drei Stellen
im Shop — im Wissensbeitrag, im Bauwerkzeug und im Suchindex. Der
Wissensbeitrag trägt Stand **2026-08-28**: geschrieben **nach** dem Widerruf,
in Kenntnis des Gegenteils.

Der Prüfer war nicht kaputt. Register und Muster hätten den Satz gefunden. Der
Fehler war, **wo er hinsah**: ausschließlich `docs/baustoff-shop/`.

> **Ein Widerruf, der nur die Akte erreicht, hat den Kunden nicht erreicht.**
> Die Akte liest niemand außer mir. Der Shop wird beworben.

Und die Reichweite stand im Werkzeug, also an der einen Stelle, die keine
Probe misst. Wer sie zurückdrehte, drehte nichts rot.

Verlegt nach `src/widerruf.js` als `BESTAENDE` und `bestandsdateien()`, dazu
`AUSGENOMMEN` — das Register selbst muss den widerrufenen Satz wörtlich führen
dürfen, sonst könnte es ihn nicht suchen. Neuer Umfang: **314 Dateien** statt
219, vier Bestände statt einem.

Der erste Lauf über den neuen Bestand meldete **vier** Aussagen ohne ihren
Widerruf:

| Fundstelle | Widerrufen | Berichtigt zu |
|---|---|---|
| `shop/inhalte/wissen/warum-keine-gratislieferung.md:14` | 27.08. | Fracht hängt an der Fahrt, nicht am Warenwert; drei von fünfzehn Belegen |
| `shop/bin/website.mjs:1440` | 27.08. | dasselbe, plus ein Absatz „Woher wir das wissen" |
| `shop/src/liefergebiet.js:30` | 27.08. | „auf den drei Rechnungen mit Zustellung dieselbe" |
| `shop/src/kostenbild.js:210` | 26.08. | 25 % **Marge** (= 33,33 % Zuschlag), nicht 25 % Zuschlag |

Der vierte ist der unangenehmste: Er stand im Kopfkommentar von Gate 20 — dem
Gate, das entscheidet, ob eine Bestellung sich selbst trägt. Die Weisung des
Auftraggebers lautet 25 % Marge; im Kommentar stand die zurückgenommene
Lesart als Begründung der Gate-Schwelle.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Liefernotiz von den Gruppenseiten entfernt | ja — 1 rot |
| Liefergebietszeile aus dem Seitenfuß entfernt | ja — 1 rot |
| Bestand „Shoptexte" aus `BESTAENDE` gestrichen | ja — 1 rot |
| `AUSGENOMMEN` geleert | erst nach Nachschärfen — die Schleife lief leer durch |
| Aktenpfad `docs/baustoff-shop` → `docs` | nein, und richtig so: `docs/` enthält nur `baustoff-shop`, die Mutation liest dieselben 219 Dateien |

Die vierte Zeile ist der bekannte Fehler in neuer Kleidung: `for (const t of
AUSGENOMMEN)` prüft nichts, wenn `AUSGENOMMEN` leer ist. Nachgeschärft mit
`assert.ok(AUSGENOMMEN.length > 0, …)` und einer namentlichen Prüfung auf
`shop/src/widerruf.js`.

Die fünfte ist kein Loch, sondern eine Grenze des Werkzeugs: `gegenprobe`
unterscheidet „unbemerkt" nicht von „verhaltensgleich". Das muss ich lesen,
nicht es.

## Was mich diesmal fast erwischt hätte

Nach den Gegenproben liefen vier Tests rot, darunter „Jede gebaute Seite nennt
das Liefergebiet" — mit `kasse.html`, `rechtliches/*` und `suche.html` in der
Liste. Der Seitenfuß dieser Seiten war leer.

`gegenprobe` stellt die **Datei** wieder her, nicht das, was der Befehl
gebaut hat. Der letzte Mutationslauf hatte die Website mit entfernter
Liefergebietszeile neu gebaut und diesen Stand liegen lassen. Ich habe eine
Sekunde lang geglaubt, meine eigene Änderung sei defekt.

> **Ein Werkzeug, das eine Datei zurücknimmt, nimmt nicht zurück, was diese
> Datei erzeugt hat.**

Nach `npm run website`: 62 von 62 grün. Der Befund ist keine Fehlfunktion,
sondern eine Eigenschaft, die man kennen muss — vermerkt, nicht behoben: Ein
`gegenprobe`, das Erzeugnisse mitsichert, müsste wissen, welche das sind.

## Stand

- 1.043 Tests, 0 rot (vorher 1.039)
- `pruefe-inhalte` 0 Verdacht, `pruefe-seiten` 0 Verdacht bei 81 Seiten
- `pruefe-widerrufe` 314 Dateien, 53 Fundstellen, alle gedeckt
- `pruefe-tests`, `pruefe-pruefer`, `pruefe-preise`, `pruefe-quellen`,
  `pruefe-geheimnis`, `pruefe-stand`: grün

Unverändert offen und beim Auftraggeber: UID, E-Mail, Telefon,
Gewerbewortlaut, Lieferzeit des Lieferanten in Werktagen, Rechtstexte,
Zahlungsanbieter, GTIN für 43 Artikel, Upload nach All-Inkl, Repository auf
privat.
