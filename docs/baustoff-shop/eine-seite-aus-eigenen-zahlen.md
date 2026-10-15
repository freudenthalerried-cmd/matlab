# Eine Seite aus eigenen Zahlen

**14. September 2026, abends.** Vierzehn Runden dieses Tages haben am Prüfwerk
gearbeitet — zu Recht, denn alle 28 offenen Punkte des Shops liegen beim
Auftraggeber. Die Runde davor hat festgehalten, dass die Zählung der
Regelnamen ihren Ertrag abgegeben hat: Was bleibt, kostet einen Testfall je
Stelle und fällt nicht mehr mit einem Griff.

Bevor der Loop wieder in die Apparatur geht, gehört die Frage gestellt, die
das Verzeichnis selbst stellt: **Was davon sieht der Kunde?**

Eine Weisung vom 22. August lautet wörtlich *„schreibe viel content"*, und sie
ist die einzige der acht, die dieser Loop ohne den Auftraggeber weiterbringen
kann. Diese Runde hat sie ein Stück weitergebracht.

## Die vierzehnte Wissensseite

`inhalte/wissen/warum-der-korb-die-menge-aendert.md` beantwortet eine Frage,
die jeder Besteller stellt und die bisher nirgends stand: **Warum bekomme ich
eine andere Menge zurück, als ich eingegeben habe?**

Achtzehn der 46 Artikel kommen in Gebinden, die niemand aufbricht — 8,64 m²
je Dämmplattenpaket, 0,75 m² je XPS-Platte, 55 m² je Gewebsrolle, 2,55 lfm je
Anschlussleiste, 25 kg je Sack. Der Korb rundet auf das nächste ganze Gebinde
**auf**, nie ab.

> **Aufrunden kostet Material, Abrunden kostet einen Arbeitstag.**

Das ist keine Vorsicht, sondern eine Rechnung: Was zu viel kommt, liegt auf
der Baustelle. Was fehlt, hält die Fassade an, bis die nächste Lieferung da
ist — und die kostet die Fracht noch einmal.

## Was die Seite nicht behauptet

Jede Zahl auf ihr stammt aus dem **eigenen** Bestand: aus den
Lieferantenrechnungen, aus denen der Katalog gebaut ist, und aus der eigenen
Entscheidung über den Mindestbestellwert. Kein technischer Kennwert, kein
Verbrauch, keine Schichtdicke — die Redaktionsprinzipien dieses Shops
verbieten das Abschreiben aus Merkblättern, und aus dieser Umgebung ist
ohnehin keine Herstellerseite erreichbar.

> **Eine Seite, die nur sagt, was das eigene Haus weiß, braucht keine fremde
> Quelle — aber sie muss sagen, dass es die eigene ist.**

## Was der Prüfer beim ersten Wurf fand

`npm run pruefe-inhalte` hat die erste Fassung in fünf Absätzen beanstandet,
und jeder Punkt war berechtigt:

| Stelle | Befund |
|---|---|
| die Frage im Kopf | „8 m²", „8,64 m²" — Zahlen ohne Herkunft |
| die Gebindetabelle | dieselbe Beanstandung, die Quelle stand im Absatz **darunter** |
| „Wer 20 kg braucht…" | drei Zahlen, keine Quelle im selben Absatz |
| der hervorgehobene Satz | Zitat ohne Fundstelle — auch ein eigener Satz ist eines |
| die 250 Euro | Preis ohne Stand, „er ist in vier Wochen falsch" |

Bemerkenswert ist der zweite: Die Quelle **stand** da, einen Absatz tiefer.
Der Prüfer liest absatzweise, und das ist richtig so — ein Sprachmodell
zitiert einen Absatz, nicht eine Seite, und eine Quelle, die erst im nächsten
steht, kommt beim Zitieren nicht mit.

> **Eine Quelle, die einen Absatz zu spät steht, steht für den, der den Absatz
> nimmt, gar nicht da.**

Die Tabelle ist deshalb in Prosa aufgelöst, die Beispielzahlen stehen auf den
Artikelseiten, wo sie hingehören, und jeder verbliebene Absatz mit einer Zahl
trägt seine Herkunft in sich.

## Stand

* 14 Wissensseiten, **25 Inhaltsdateien**, 399 Absätze, 0 mit Verdacht
* die Seite steht in `llms.txt`, in der Sitemap und im Wissensindex
* 55 Prüfer grün, 2 618 Testfälle, 305 Gegenproben

## Was diese Runde nicht erreicht hat

Die Seite ist geschrieben, nicht **gelesen**: Ob sie die Frage so beantwortet,
dass ein Besteller aufhört zu suchen, weiß niemand, und dieser Bestand hat
kein Werkzeug dafür. Was er hat, ist die Zusicherung, dass keine Zahl darauf
erfunden ist.

Und der Shop ist weiter nicht online. Die Seite wird erst gelesen, wenn
`ausgabe/site/` hochgeladen ist — Punkt 28 der offenen Liste, und der hängt
wie die anderen 27 nicht an mir.
