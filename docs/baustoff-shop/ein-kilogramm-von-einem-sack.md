# Ein Kilogramm von einem 25-kg-Sack

Stand: 2026-08-29

## Der Befund

Das Mengenfeld stand auf jeder Artikelseite gleich:

```html
<input type="number" min="1" max="999" value="1">
```

Bei `Capatect Putzgrund weiß 25 kg`, Einheit `KG`, heißt das: Ein Klick auf
„In den Warenkorb" legt **ein Kilogramm** hinein. Ein Kilogramm eines
25-kg-Gebindes gibt es nicht. Die Bestellung wäre nicht lieferbar, und gemerkt
hätte es niemand vor dem Kommissionieren — die Kasse rechnet 2,77 € plus
75,50 € Fracht und sagt kein Wort.

Fünf Artikel des Bestands sind betroffen: alle mit Einheit `KG` und einer
Gebindegröße im Namen.

Das ist derselbe Fall, den `bedarf.js` schon 2026 für die Radonfolien
beschrieben hat: *„Wer 140 m² braucht und Rollen zu 37,5 m² kauft, zahlt
Verschnitt — und erfährt das heute erst an der Kasse."* Nur ist es hier kein
Verschnitt, sondern eine Menge, die es gar nicht gibt.

## Was jetzt passiert

**Auf der Artikelseite** beginnt das Feld bei einem Gebinde und zählt in
Gebinden weiter — `min="25" value="25" step="25"` — mit einem Satz darunter:

> Abgabe in ganzen Gebinden zu 25 kg laut Artikelbezeichnung. Der Preis gilt
> je Kilogramm; ein Gebinde kostet danach 69,25 € netto, Stand: 2026-08-12.

**Im Warenkorb gilt dieselbe Regel.** Sie nur auf der Artikelseite zu setzen
hieße: Der Kunde legt ein Gebinde in den Korb und schreibt es im Korb auf 7 kg
herunter — dieselbe unlieferbare Menge, einen Klick später. Die Regel steht in
`gebinde.js`, nicht zweimal.

**Aufgerundet, nicht ab.** Wer 30 kg einträgt, bekommt 50 kg. Ihm 25 zu geben
wäre stillschweigend zu wenig — und stillschweigend zu wenig ist schlimmer als
sichtbar zu viel: Das Fehlende hält die Baustelle auf, das Zuviel steht im
Lager.

Artikel ohne ablesbare Gebindegröße behalten das freie Feld. Es wird keine
Gebindegröße erfunden, und ein Test prüft genau das an `POS-12566`.

## Was hier eine Annahme ist, und welche

**Dass ein als „25 kg" benanntes Gebinde nur ganz abgegeben wird, steht auf
keiner Rechnung.** Der Lieferant fakturiert je Kilogramm. Die Annahme ist
trotzdem die vorsichtigere:

| Annahme | Fehlerfolge, wenn sie falsch ist |
| --- | --- |
| Gebinde nur ganz (jetzt) | Ein Kunde, der wirklich 7 kg wollte, muss 25 kg nehmen |
| Beliebige Menge (vorher) | Eine Bestellung, die niemand kommissionieren kann |

Verkauft der Lieferant doch lose, fällt `mengenschritt()` weg und sonst
nichts. Der umgekehrte Weg wäre teurer.

Die Annahme steht als solche im Quelltext, nicht als Tatsache.

## Der Inhaltsprüfer hatte recht

Der erste Wurf des Hinweissatzes lautete: *„Abgabe in ganzen Gebinden zu
25 kg. Der Preis gilt je Kilogramm; ein Gebinde kostet 69,25 € netto."*

`npm run pruefe-seiten` beanstandete ihn sofort, in fünf Artikelseiten:

```
→ Zahl ohne Quelle: 25 kg, 69,25 € — jede Zahl braucht Herkunft und Stand
→ Preis ohne Stand — er ist in vier Wochen falsch
```

Der Einwand war richtig, und die naheliegende Verteidigung — „beides steht
eine Zeile höher in der Preistafel" — trägt nicht: Der Satz wird für sich
gelesen, in der Vorlesehilfe, im Suchergebnis, im Ausdruck. Er trägt jetzt
beides: die Herkunft der Gebindegröße („laut Artikelbezeichnung") und den
Preisstand.

Das ist ein Prüfer, der einen neu geschriebenen Satz beanstandet hat, bevor er
online ging. Genau dafür ist er da.

## Geprüft und gegengeprobt

Vier neue Testfälle und zwei Browserszenarien:

| Probe | prüft |
| --- | --- |
| `mengenschritt` je Einheit | `KG` mit Gebinde ja, `SCK`/`M2`/ohne Angabe nein, 1,5 kg nein |
| am Bestand | jeder Artikel mit Schritt hat Einheit `KG`, **und nicht jeder Artikel hat einen** |
| Artikelseite | `min`, `value`, `step` auf 25, Gebindepreis im Satz |
| Artikelseite ohne Gebinde | `min="1"`, kein `step`, kein Hinweissatz |
| Browser: in den Korb | Menge 25, Schritt 25, Zeilensumme 69,25 € |
| Browser: Teilmenge | 30 eingetippt → 50 im Korb, 138,50 € |

Gegengeprobt: Mit ausgeschaltetem Schritt (an beiden Stellen) fallen beide
Browserszenarien um.

## Was das nicht löst

Der Warenkorb prüft weiterhin keine Mindestbestellmenge und keinen
Mindestbestellwert — Gate 20 hält nur Bestellungen an, die ihren
Deckungsbeitrag nicht tragen. Ob es einen Mindestbestellwert für palettierte
Ware geben soll, ist weiter eine offene Entscheidung des Auftraggebers.
