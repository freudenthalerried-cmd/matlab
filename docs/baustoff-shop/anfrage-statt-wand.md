# Der Weg, der ohne Zahlungsanbieter funktioniert

Stand: 2026-08-29

## Wo der Besucher bisher stehenblieb

Die Kasse rechnet den Warenkorb vollständig durch — Positionen, Fracht,
Umsatzsteuer, Gewicht, Liefergebiet — und sagt dann wahrheitsgemäß:

> Hier endet die Vorschau. Es kann nichts bestellt werden: Der
> Zahlungsanbieter ist nicht gewählt, und Impressum und Rechtstexte sind
> unvollständig.

Für den Betrieb ist dieser Satz richtig und muss bleiben. Für den Besucher ist
er eine Wand. Wer sich durch sieben Warengruppen geklickt und einen Korb
gefüllt hat, geht dort ohne Spur wieder weg — und zwar der Besucher, der am
weitesten gekommen ist.

`npm run startklar` sagt seit gestern, woran es liegt: drei offene Punkte,
alle drei beim Auftraggeber. Die kann dieser Lauf nicht schließen. Was er
schließen kann, ist die Lücke dazwischen.

## Was jetzt dasteht

Nach der Bezirkswahl steht auf der Kasse die fertige, gerechnete Liste zum
Kopieren:

```
UNVERBINDLICHE ANFRAGE — keine Bestellung.

Baustelle im Bezirk: Perg
Erstellt am: 2026-08-29

Positionen
----------
12 M2       Fassaden EPS 2 cm 0,5 m2         POS-12566   1,93 €     23,16 €
40 STK      PVC Kanalrohr NW 100 1 m         POS-10095   10,81 €    432,40 €

Summen (netto, Preise für Unternehmer)
-------------------------------------
Warenwert             455,56 €
Zustellung            90,50 €
Netto gesamt          546,06 €
USt                   109,21 €
Brutto gesamt         655,27 €
Gewicht               69,3 kg  (für 1 Position nicht hinterlegt)
…
Preisstand der Positionen: 2026-06-09 bis 2026-08-17. Preise freibleibend.
```

Im regionalen Baustoffhandel ist das nicht der Notausgang, sondern der
übliche Weg: Der Betrieb schickt seine Liste, der Händler bestätigt Preis und
Termin. Neu ist nur, dass die Liste hier schon gerechnet ankommt.

## Vier Entscheidungen, die dabei getroffen wurden

**Es wird nichts gesendet.** Der Text steht in einem Feld und lässt sich
kopieren. Ob daraus eine Mail wird, entscheidet der Kunde in seinem eigenen
Programm. Damit wird auf dieser Seite nichts gespeichert und nichts
übertragen — es entsteht kein Datenverarbeitungsvorgang, den eine
Datenschutzerklärung tragen müsste, die es noch nicht gibt.

**Der Text sagt in der ersten Zeile, was er nicht ist.** „UNVERBINDLICHE
ANFRAGE — keine Bestellung", dazu der Preisstand jeder Position und der Satz,
dass ein Preis erst mit unserer Bestätigung verbindlich wird. Ein Text, der
wie eine Auftragsbestätigung aussieht, wäre schlimmer als die Wand.

**Gate 23 wird aufgerufen, nicht nachgebaut.** Aus einem Bezirk außerhalb des
Liefergebiets entsteht kein Anfragetext, sondern der Grund dafür. Die
Bezirksliste kommt aus `liefergebiet.js` — dieselbe Funktion, die das Gate im
Rechenkern durchsetzt. Eine zweite Liste in der Oberfläche wäre die sicherste
Art, beide auseinanderlaufen zu lassen.

**Der Mailknopf fehlt, und es steht dabei, warum.** Ohne hinterlegte
E-Mail-Adresse gibt es keinen `mailto:`-Knopf — die Adresse ist eine der vier
offenen Impressumsangaben. Ein Knopf, der ins Leere führt, wäre schlechter;
ein fehlender Knopf ohne Begründung sähe aus wie ein Fehler. Der Hinweis
darunter macht daraus einen offenen Punkt, den jemand schließen kann.

Und selbst mit Adresse bleibt der kopierbare Text der Hauptweg: Eine
`mailto:`-Adresse mit 46 Positionen wird von Browsern und Mailprogrammen
**stillschweigend gekappt**. `mailtoAdresse()` gibt deshalb oberhalb von 1800
Zeichen `null` zurück, statt eine halbe Positionsliste zu erzeugen. Ein Test
prüft genau das mit dem vollen Sortiment.

## Was geprüft ist

Zwölf Testfälle in `test/kundenanfrage.test.js` und vier Browserszenarien.
Geprüft wird unter anderem:

- Jede Position steht mit Menge, Einheit, Artikelnummer und Zeilensumme im
  Text, und die fünf Summen stimmen mit `kundenWarenkorb()` überein.
- Aus einem Bezirk außerhalb des Liefergebiets entsteht kein Text.
- **Keine Spanne, kein Einkaufspreis** — geprüft am ganzen Sortiment, nicht an
  zwei Positionen. Was hier durchrutscht, rutscht sonst bei genau dem Artikel
  durch, den niemand angesehen hat.
- Der Anfragetext im 390-px-Rahmen: Er ist ein Textfeld mit fester
  Spaltenbreite, also das eine Bedienelement, das einen schmalen Rahmen
  sprengen kann, ohne dass es jemand bemerkt.

Alle vier Oberflächenszenarien wurden gegengeprobt, indem der Abschnitt
abgeschaltet wurde. Beim ersten Versuch fielen nur **drei von vieren** um:
„Ein Bezirk außerhalb des Liefergebiets erzeugt keinen Anfragetext" blieb grün,
weil „kein Textfeld" auch dann zutrifft, wenn es den ganzen Abschnitt nicht
gibt. Wieder *eine Zusage, die keine Probe widerlegen kann*. Berichtigt: Das
Szenario verlangt jetzt zusätzlich den gezeichneten Abschnitt samt Grund. Mit
abgeschaltetem Abschnitt fallen alle vier.

## Zwei Fundstücke am Rand

**Der Bündelwächter hat zweimal zugeschlagen, und beide Male zu Recht.** Erst
hieß die neue Funktion `baueAnfrage` — den Namen führt `vies.js` bereits für
die UID-Abfrage beim EU-Register. Dann hieß die Hilfsfunktion `eur` — den
Namen führt die Vorlage der Demo-Einzeldatei. Getrennte Module dürfen denselben
Namen tragen; im zusammengefügten Browserskript ist er ein SyntaxError, der
die ganze Seite lahmlegt. Aufgefallen ist beides nicht beim Lesen, sondern weil
`buendel.js` die Namen zählt und `build-demo.mjs` das fertige Skript parsen
lässt, bevor es es schreibt. Beide Wächter stehen seit dem EUR-Vorfall im
August da — sie haben sich heute bezahlt gemacht.

**Der Rahmen kann jetzt eine Eingabe machen, bevor er misst.** Bedienelemente,
die erst nach einer Eingabe entstehen, waren bisher unmessbar: Der Rahmen lud
die Seite und maß den Anfangszustand. Er hätte dem Anfragetext bescheinigt,
dass er passt — ein Textfeld, das es zum Messzeitpunkt gar nicht gab.
`imRahmen` schließt das.

## Was das nicht ersetzt

Eine Anfrage ist keine Bestellung, und dieser Weg macht den Shop nicht
startklar. Die drei offenen Punkte aus `npm run startklar` bleiben offen:
Zahlungsanbieter, verbindliche Rechtstexte, vollständiges Impressum. Was sich
geändert hat, ist der Ausgang: Bis dahin geht der Besucher nicht mehr ohne
Spur weg.
