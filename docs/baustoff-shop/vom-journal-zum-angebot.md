# Vom Journal zum Angebot

**4. September 2026, Abend.** Der Bestellweg steht: Der Kunde klickt,
`bestellung.php` nimmt entgegen, das Journal wächst um eine Zeile. Und
`npm run vorgang` macht daraus ein Angebot — aus einer **Datei mit dem
Anfragetext** und einer **Datei mit den Kundendaten**.

> **Zwischen der Zeile im Journal und diesen beiden Dateien lag nichts.**

Der Betreiber hätte sie von Hand herausschneiden müssen: den Text aus dem
JSON kopieren, die acht Kundenfelder abtippen, `land: "AT"` dazu erfinden.
Genau die Sorte Arbeit, gegen die `npm run anfrage-lesen` am 3. September
gebaut wurde — nur eine Stufe später und diesmal aus einer Datei, die dieser
Shop selbst erzeugt.

## `npm run posteingang`

Ohne Argumente sagt es, was da liegt:

```
Posteingang — 2 Bestellungen, 1 davon angebotsreif

  ✓ B-2026-0001  2026-09-04T16:40:00+00:00  Musterbau GmbH (Perg)
  · B-2026-0002  2026-09-04T16:41:00+00:00  Halb GmbH (Perg)
        Straße und Hausnummer fehlen
        Postleitzahl muss vierstellig und österreichisch sein
        Bestätigung fehlt, dass die Bestellung für ein Unternehmen erfolgt (Gate 7)
        UID-Nummer fehlt oder hat nicht das Format ATU gefolgt von acht Ziffern
```

Die Hindernisse kommen aus **derselben** Prüfung, die `npm run vorgang`
anwendet — nicht aus einer nachgebauten. Eine zweite Fassung derselben Regel
liefe auseinander, und die zweite ist immer die freundlichere.

Mit `--nummer` und `--nach` schneidet es die zwei Dateien heraus und druckt
den nächsten Befehl darunter. Ein Werkzeug, dessen Ausgang der Eingang des
nächsten ist, soll das auch sagen; sonst hört der Weg an dieser Stelle wieder
auf.

## Drei Entscheidungen, die es trägt

**Es rechnet nichts nach.** Ob die Positionen stimmen, prüft `leseAnfrage`
gegen den Katalog — dort, wo der Beleg entsteht. Eine zweite Nachrechnung hier
wären zwei Rechnungen über denselben Warenkorb.

**Die Kundendatei trägt die Formularfelder und sonst nichts.** Nummer,
Zeitpunkt und Anfragetext stehen im Journal und im Anfragetext; ein zweiter
Ort für dieselbe Angabe altert. Das einzige, was hinzukommt, ist `land: "AT"`
— eine Folgerung aus Gate 23, keine Eingabe.

**Es schreibt nicht ins Verzeichnis.** Dieselbe Regel wie bei der Ablage: Was
Namen und Anschriften trägt, gehört nicht in ein öffentliches Repository, und
`.gitignore` hilft nur, solange niemand daran vorbeischreibt. Erlaubt sind
Orte außerhalb — oder `ablage/`, das gesperrt ist. Eine Probe fährt den Fall.

## Die Bestellprobe fährt jetzt bis zum Beleg

Sie hatte vier Prüfungen und hat fünf. Die neue ist die, auf die es ankommt:

```
Bestellprobe — 5 Prüfungen von Klick bis Angebot

  ✓ Die Kasse meldet: Angekommen. Ihre Nummer: B-2026-0001
  ✓ Die Ablage liegt außerhalb des Webverzeichnisses
  ✓ In der Ablage: B-2026-0001, Musterbau GmbH, 940 Zeichen Positionsliste
  ✓ Aus der abgelegten Bestellung lässt sich ein Angebot machen
  ✓ Aus dem Journal entsteht über posteingang und vorgang ein Angebot
```

Zwischen der vierten und der fünften Zeile liegt der Unterschied zwischen
*die Daten würden genügen* und *der Beleg ist da*. Die vierte prüft die
Kundendaten gegen `pruefeBestelldaten`; die fünfte fährt `npm run posteingang`
und `npm run vorgang` am echten Journal und verlangt am Ende ein Angebot mit
Nummer.

Damit ist die Kette einmal in einem Befehl belegt: **Klick, Empfangsskript,
Ablage, Posteingang, Angebot.**

## Was noch fehlt, und wo

Der Beleg trägt weiterhin `[[ Lieferzeit Poschacher Baustoffhandel — FEHLT ]]`
— eine der fünf Fragen an den Lieferanten. Er ist damit nicht versandfertig,
und das Werkzeug sagt es unter dem Text. Das ist kein Mangel dieser Kette,
sondern der eine offene Punkt, der sie an ihrem Ende noch anhält.

## Der rote Lauf, den es seit gestern gibt, hat seinen Grund

Drei Gesamtläufe hintereinander endeten rot, jedes Mal an einer anderen
Stelle: einmal „war schon vorher rot" bei zwei Gegenproben, einmal „etwas
anderes gefunden", einmal ein roter Testlauf. Einzeln war jedes davon grün.

Die Ergänzungen von vorhin haben die Suche geführt statt geraten:
`gesamtlauf.mjs` zeigt bei einem gescheiterten Schritt jetzt die **Fundzeilen**
statt der letzten Zeilen, und der Gegenprobenläufer gibt bei „vorher rot" die
Begründung des Prüfers mit — *ein Urteil über einen Prüfer, das seine
Begründung wegwirft, ist eine Anschuldigung.*

Damit blieb ein Verdacht übrig, und er hat sich bestätigt: **Zwei Proben
starten je einen PHP-Server und rieten ihren Port.**

```
8100 + Zufall(800)     bestellungphp.test.js, siebenmal je Lauf
8300 + Zufall(600)     bestellprobe.mjs
```

> **Ein geratener Port ist kein Port, sondern eine Wette.** Sie ging meist gut
> aus; die Läufe, in denen sie es nicht tat, sahen aus wie ein roter Bestand.

`src/freierport.js` fragt jetzt das Betriebssystem: Horcher auf Port 0 öffnen,
zugeteilte Nummer lesen, sofort wieder hergeben. Die Lücke zwischen Freigeben
und Binden bleibt und ist klein — gegenüber einer Wette auf sechshundert
Zahlen der bessere Handel.

**Und die Browsergegenproben bleiben aus dem Regellauf heraus.** Dieselbe Regel
wie bei den Browserproben selbst, aus demselben Grund: `bestellprobe` kostet
einen Chromium-Start, einen PHP-Server, einen vollständigen Bau und zwei
Werkzeugläufe. Mit `--mit-browser` laufen sie mit; ohne sagt der Läufer, dass
er sie zurückgestellt hat, und nennt sie beim Namen.

Bei der Suche hat auch mein eigener Fundfilter geirrt: Er nahm die erste Zeile
mit `✗`, und in der Ausgabe von `npm test` steht ein `✗` aus dem
Aufwandsbericht eines geprüften Werkzeugs. Zwanzig Minuten in die falsche
Richtung. Er nimmt jetzt `not ok`, wo es welche gibt.

## Was das für den Auftraggeber ändert

Am Tag der ersten Bestellung: `npm run posteingang`, eine Zeile Befehl, und
das Angebot steht. Kein Abtippen, keine erfundene Angabe, und wenn etwas
fehlt, steht es mit Namen da — nicht als „Bestellung unvollständig".
