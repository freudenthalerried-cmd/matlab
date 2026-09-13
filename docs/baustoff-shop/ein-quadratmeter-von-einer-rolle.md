# Ein Quadratmeter von einer Rolle

**2. September 2026, später Nachmittag.** Eine Stunde nach dem Umbau der
Artikelkachel habe ich mir angesehen, was der Shop am Ende eigentlich
ausspuckt — den Anfragetext, das einzige Papier, das ihn verlässt. Die
Wegprobe hatte den **ersten** Knopf der WDVS-Gruppenseite gedrückt. Heraus kam:

```
Positionen
----------
1 m²   Baumit TextilglasGitter 1,1x50 m   POS-52058   1,19 €   1,19 €

Warenwert             1,19 €
Zustellung            75,50 €
```

Ein Quadratmeter von einer Rolle, die 1,1 mal 50 Meter misst. Dazu 75,50 €
Zustellung.

Zwei getrennte Fehler in einem Dokument, und beide waren nur zu sehen, weil
der Weg wirklich gegangen wurde.

## Fehler 1: Das Gebinde stand im Namen und wurde nicht gelesen

`mengenschritt()` liest die Gebindegröße aus der Bezeichnung — „25 kg",
„0,75 m2", „2,55 m". Für „1,1x50 m" gab es `null`, und ohne Schritt beginnt
das Mengenfeld bei **1**.

Der Grund stand als Zusicherung im Test, wörtlich:

> `assert.equal(mengenschritt({ bezeichnung: 'Bahn 1,1x50 m', einheit: 'M2' }), null,`
> `  'Meter sind keine Quadratmeter — die zweite Kante wird nicht erfunden');`

**Der Satz stimmt — nur nicht für diesen Fall.** Er gehört zu einer einzelnen
Länge: Aus „Bahn 50 m" folgt keine Fläche, weil die zweite Kante fehlt. Bei
„1,1x50 m" fehlt sie nicht. Zwischen den beiden Zahlen steht ein Malzeichen,
beide tragen dieselbe Einheit, und die Fläche ist eine Multiplikation zweier
**genannter** Zahlen, keine Erfindung.

> **Zwei Zahlen mit einem Malzeichen sind ein Maß. Zwei Zahlen ohne eines sind
> zwei Zahlen.**

Die zweite Hälfte des Satzes ist der Grund, weshalb der alte Test in einem
anderen Punkt recht behält und unverändert bleibt: „Grundmauerschutz 20 1,5 m"
bekommt weiterhin `null`. Dort stehen zwei Zahlen **nebeneinander**, ohne
Malzeichen — ob das 20 Meter mal 1,5 Meter heißt, weiß der Name nicht. Das ist
eine Frage an den Lieferanten, und sie ist gestellt: Die Artikelliste mit
Verpackungseinheit ist Frage 1 der Lieferantenanfrage.

**Was für die 55 m² spricht, außer der Rechnung:** Der Nachbarartikel im
selben Katalog, „Capatect Glasgewebe M, Breite 110cm, orange **55 m2**",
dieselbe Warenart, dieselbe Rollengröße, ausdrücklich beschriftet. Zwei Rollen
Armierungsgewebe zu 55 m² nebeneinander — die eine sagt es in Quadratmetern,
die andere in Kanten.

Nach der Berichtigung: **55 m², 65,45 €.**

## Fehler 2: Der Hinweis stand auf der Seite, nicht im Papier

Der Warenkorb sagt seit Wochen deutlich, was hier los ist:

> **Die Fracht kostet hier mehr als die Ware.** … Das lohnt sich für Sie
> nicht — legen Sie zusammen, was ohnehin gebraucht wird, oder holen Sie die
> Kleinmenge im Fachhandel vor Ort. Wir sagen das lieber hier als auf der
> Rechnung.

Im Anfragetext stand davon **nichts**. Der Kunde kopiert den Text, schickt ihn
weg, und der Satz bleibt auf einer Seite zurück, die er längst verlassen hat.

> **Ein Hinweis, der nur auf der Seite steht, fehlt in dem Papier, das der
> Kunde verschickt.**

Er steht jetzt im Text, und zwar **vor** dem Preisstand: Was den Kunden Geld
kostet, gehört in die Anfrage und nicht in eine Fußnote über das Werkzeug.

### Was das kostet, und warum ich es trotzdem tue

Der Anfragetext kann als `mailto:`-Adresse geöffnet werden, solange er unter
1.800 Zeichen bleibt — darüber kappen Mailprogramme **stillschweigend**, und
eine halbe Positionsliste wäre schlimmer als kein Knopf. Der neue Satz kostet
rund zweihundert Zeichen. Die Grenze verschiebt sich damit von zwei Positionen
auf eine — **aber nur in Körben, in denen die Fracht die Ware übersteigt.**
Trägt der Korb seine Fracht, steht der Satz gar nicht im Text, und der Knopf
bleibt, wo er war.

Der Preis ist also: In genau den Körben, von denen der Shop dem Kunden abrät,
gibt es die Abkürzung eine Position früher nicht mehr. Der kopierbare Text
bleibt in jedem Fall. **Der Hinweis wiegt schwerer als die Abkürzung**, und
eine Probe hält beide Richtungen fest — auch die, dass der Satz nicht dasteht,
wo er nichts sagt.

## Und ein dritter Fehler, meiner

Die neue Prüfung liest Warenwert und Zustellung aus dem erzeugten Text. Der
erste Lauf meldete „Fracht über Warenwert: **nein**" bei 65,45 € Ware und
75,50 € Fracht.

Der Code der Wegprobe wandert als Zeichenkette durch eine Schablone in eine
HTML-Datei, und die Schablone schluckt jeden Backslash: Aus einer
Leerzeichenklasse wurde ein Buchstabe `s`. Diese Falle steht in `shopprobe.mjs`
seit dem 29. August aufgeschrieben, mit Begründung — und ich bin trotzdem
hineingelaufen. Jetzt ohne Backslash geschrieben, und das ist kein Stil.

## Stand

| | |
|---|---|
| Artikel mit erkanntem Gebinde | 18 von 46 (vorher 17) |
| Anfragetext im gemessenen Weg | 907 Zeichen (vorher 775) |
| Wegprobe: Fracht über Ware erkannt | ja, und der Satz steht im Text |
| Tests | 1240 |
| Gegenproben, die anschlagen | 19 von 19 |

Die neue Gegenprobe schaltet den Satz im Quelltext ab und erwartet, dass die
Wegprobe es merkt. Sie baut vorher — die Probe geht durch den gebauten Shop,
und eine Änderung an einer Quelldatei erreicht sie erst nach `build` und
`website`.
