# Vier Schritte statt fünf, sechs statt neun

**2. September 2026, nachmittags.** Am Vormittag stand in
`fuenf-schritte-bis-zur-anfrage.md` ein Satz, der ausdrücklich eine eigene
Runde verlangte:

> **Ein halber Umbau der Landeseite ist schlechter als keiner.** Er verdient
> eine eigene Runde, und der Preis dafür steht jetzt gemessen daneben: vier
> Schritte je zusätzlicher Position.

Das ist diese Runde.

## Was gemessen war

Die Landeseite einer Anzeige ist die Gruppenseite. Wer aus „Kleber, Gewebe,
Dübel" kommt, hat drei Positionen im Kopf — und musste dreimal den Umweg über
die Artikelseite gehen: öffnen, legen, zurück.

| | vorher | nachher |
|---|---|---|
| Weg bis zur fertigen Anfrage | 5 Schritte | **4** |
| drei Positionen aus derselben Anzeige | 9 Schritte | **6** |
| Artikel auf der Gruppenseite direkt legbar | 0 von 11 | **11 von 11** |

Der bezahlte Klick kostet 4,19 bis 8,22 €. Jeder Schritt, der zwischen ihm und
dem fertigen Anfragetext liegt, ist eine Gelegenheit abzuspringen.

## Warum es nicht früher gebaut wurde — und was daran stimmte

Die Kachel war ein Verweiselement um die ganze Fläche. Ein Knopf darin wäre
ein Bedienelement in einem Bedienelement gewesen: im Browser eine
Fehlkonstruktion, für die Tastatur eine Falle. Der Umbau bedeutete Kachel von
`<a>` auf `<div>`, Kopfbereich als Verweis, Mengenfeld je Zeile, Fokusführung
neu — und daran hingen die Browserszenarien.

Der zweite Grund war die Ware: Jeder Artikel hat eine **Gebindemenge**. Ein
Legen-Knopf ohne Mengenfeld legt „eins", und „ein Quadratmeter Glasgewebe" ist
eine Menge, die niemand kommissionieren kann — die Rolle gibt es ab 55 m².
Deshalb trägt die Kachel kein bloßes Plus, sondern dasselbe Mengenfeld wie die
Artikelseite, vorbelegt mit dem Gebindeschritt und in Gebinden zählend.

## Drei Dinge, die der Umbau nebenbei aufgedeckt hat

**1. Die Knöpfe waren nicht verdrahtet.** `baueKorbknoepfe()` hat jeden
vorhandenen Knopf einzeln mit einem Behandler versehen. Das hielt, solange die
Knöpfe im gelieferten HTML standen — die Kacheln entstehen aber erst danach,
und der Filter zeichnet das Raster jedes Mal neu. Ein Knopf ohne Behandler
sieht aus wie einer, der nicht funktioniert.

Jetzt ein einziger Behandler am Dokument, der auch trifft, was später
entsteht. Die Wache dagegen, ihn bei jedem Rautenwechsel ein zweites Mal
anzuhängen, steht daneben: **Ein doppelter Behandler legt jede Menge zweimal
in den Korb.**

**2. Dieselbe Kennung zweimal auf einer Seite.** Die Kachel trug zuerst ein
Mengenfeld mit der Kennung `menge-<SKU>`, wie die Artikelseite. Auf einer
Artikelseite steht derselbe Artikel aber in **zwei** Listen — „Verwandt" und
„Mitverbaut" —, und damit gab es die Kennung zweimal. `getElementById` liefert
die erste: Der zweite Knopf hätte die Menge des ersten Feldes in den Korb
gelegt.

Gefunden hat es eine Probe, die es vorher nicht gab und die ich für eine
Formalie hielt: **keine gebaute Seite trägt eine Kennung zweimal.** Sie meldete
sofort 46 Fundstellen.

Die Behebung ist die bessere Bauart: Der Knopf sucht sein Mengenfeld in
**seiner eigenen Zeile** und erst dann über die Kennung. Die Kachel braucht
damit gar keine.

> **Eine Zuordnung über eine Kennung ist eine Verabredung, dass es die Sache
> nur einmal gibt.** Sobald ein Baustein zweimal auf eine Seite kann, ist sie
> gebrochen.

**3. Der Preisabgleich las die Kachel nicht mehr.** Er trennt die Gruppenseite
an `'<a class="karte"'`. Nach dem Umbau fand er nichts und meldete für alle 46
Artikel „die Artikelkarte nennt die Mindestmenge nicht". Der Prüfer hatte
recht zu melden — er hatte nur den falschen Anker. **Ein Anker im HTML ist eine
Verabredung mit dem Bauwerkzeug; wer das Bauwerkzeug ändert, ändert sie mit.**

Und die Fokusprobe von 29. August meldete `karte=GLEICH`: Sie prüfte den
Fokusring von `.karte`, und ein `div` nimmt keinen Fokus. Auch das war kein
Fehlalarm, sondern eine Probe, die auf etwas zielte, das kein Bedienelement
mehr ist. Der Tastaturweg führt jetzt über den Kopfbereich, und der trägt den
Ring.

## Was die Proben festhalten

Drei neue Browserszenarien:

| | warum |
|---|---|
| Der Knopf legt die **Gebindemenge**, nicht eins | 55 m² Glasgewebe, nicht 1 m² — der Fehler, der am 31. August auf den Artikelseiten behoben wurde |
| Drei Klicks werden **drei Positionen** im Korb | der gemessene Fall aus der Anzeige |
| Kein Knopf steckt in einem Verweis, jede Kachel verlinkt weiter | die Falle, wegen der es den Knopf nicht gab — und der Verweis, der beim Umbau verlorengehen kann |

Dazu die Zusicherung gegen doppelte Kennungen über alle 81 gebauten Seiten,
und vier neue Prüfungen in der Wegprobe: kein Knopf im Verweis, jede Kachel
mit Verweis, mindestens ein Legen-Knopf, und drei Positionen unter acht
Schritten.

## Stand

| | |
|---|---|
| Weg bis zur Anfrage | **4 Schritte**, höchstens 5 vorgesehen |
| drei Positionen | **6 Schritte** |
| Textfelder auf dem Weg | 0 |
| Browserszenarien | 53 Shop, 11 Oberfläche, 81 Seiten im 390-px-Rahmen |
| Tests | 1238 |
| Gegenproben, die anschlagen | 18 von 18 |

Was bleibt: Die Kachel ist nicht mehr als Ganzes anklickbar. Wer die Fläche
gewohnt war, klickt jetzt auf Bild oder Titel. Das ist der Preis dafür, dass
ein Knopf darauf Platz hat — und er ist bewusst gezahlt, weil die Alternative
ein Bedienelement in einem Bedienelement gewesen wäre.
