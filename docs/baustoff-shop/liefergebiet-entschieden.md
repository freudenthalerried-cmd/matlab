# Das Liefergebiet stand in der Werbung, nicht im Shop

Stand: 2026-08-26. Die Weisung vom 22. August lautet: **regional, nicht
österreichweit.** Sie war seither an genau einer Stelle umgesetzt — als
Zeichenkette in einer Anzeigenzeile:

```
Ausrichtung: 'Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz-Land, Linz'
```

Das ist eine **Zielgruppeneinstellung**. Sie bestimmt, wem Google die
Anzeige zeigt. Sie hält keine Bestellung auf.

Der Rechenkern nahm bis heute jede österreichische Adresse an, und
Punkt 12 der Geschäftsbedingungen hieß *„Lieferorte nur in
Österreich"* — eine Erlaubnis für 83.879 km², nicht die Grenze, die
gemeint war. Wer aus Bregenz bestellt hätte, wäre durchgekommen.

## Wo das Gebiet überall stand — und nirgends verbindlich

| Stelle | was dort stand | verbindlich? |
|---|---|---|
| `bin/kampagne.mjs` | fünf Bezirke, als Text in einer CSV-Spalte | nein — steuert nur die Anzeige |
| `bin/veroeffentlichung.mjs` | was in `SHOP_BEZIRKE` gesetzt war | nein — Einstellung des Rechners, auf dem gebaut wird |
| `src/kunde.js` | nichts | — |
| AGB Punkt 12 | „nur in Österreich" | ja, und zu weit |
| `inhalte/vorlagen/produktseite.md` | `[[ Bezirksliste — FEHLT ]]` | die einzige Stelle, die es zugab |

Drei Orte, drei Antworten, keine Quelle. Der Feed konnte ein anderes
Gebiet ausrufen als die Kampagne bewarb, und beide ein anderes, als der
Shop annahm — ohne dass irgendetwas auffiel.

## Die Entscheidung

**Gate 23: Keine Annahme außerhalb des Liefergebiets.**

Geliefert wird nach **Perg, Urfahr-Umgebung, Freistadt, Linz-Land und
Linz** — dieselben fünf Bezirke, für die geworben wird. Beworben und
beliefert ist dieselbe Fläche, und das hält jetzt ein Testfall fest, der
die erzeugte Kampagnendatei gegen die Entscheidung liest.

| Bezirk | warum |
|---|---|
| Perg | Sitz des Betriebs (Marwach 5, 4312 Ried in der Riedmark) |
| Urfahr-Umgebung | Nachbarbezirk, Mühlviertel |
| Freistadt | Nachbarbezirk, Mühlviertel |
| Linz-Land | Ballungsraum, größte Bautätigkeit im Umkreis |
| Linz | Statutarstadt im selben Ballungsraum |

### Warum der Bezirk gefragt und nicht errechnet wird

Aus demselben Grund, aus dem `kunde.js` das Land verlangt, statt es aus
der Postleitzahl zu erraten: **Eine Postleitzahl beweist keinen
Bezirk.** Sie überschreitet Bezirks- und sogar Bundeslandgrenzen, und
die amtliche Zuordnung ist von hier aus nicht abrufbar — dieselbe
Sperre, an der schon die Gebietsauskunft des Radonmodells endete.

Eine aus dem Gedächtnis zusammengeschriebene Postleitzahlentabelle wäre
der bequeme Weg gewesen und der falsche: Sie sähe amtlich aus und wäre
es nicht. Das Formular fragt deshalb nach dem Bezirk.

**Ein fehlender Bezirk ist kein Ja.** Ihn stillschweigend durchzulassen
öffnete die Grenze genau dort, wo sie am leichtesten zu übersehen ist —
beim unvollständigen Formular. Fehlender und außerhalb liegender Bezirk
sind zwei verschiedene Auskünfte, und beide nennen, wohin geliefert
wird. Eine Absage ohne Alternative ist eine halbe Auskunft.

### Warum eng und nicht großzügig

Der Shop ist ein Streckengeschäft. Was er liefern kann, liefert der
Lieferant — und **wie weit der fährt, steht in keiner der fünfzehn
Rechnungen.** Die Frachtpauschale ist auf jedem Beleg dieselbe, ob der
Beleg über 18,74 € oder über 1.934 € lautet; eine Entfernungsstaffel ist
daraus weder ablesbar noch ausschließbar.

Solange das offen ist, gilt die vorsichtige Richtung. **Ein
angenommener Auftrag, den der Lieferant nicht fährt, kostet mehr als ein
abgelehnter — er kostet die Zusage.** Der Vorbehalt steht im Rechenkern
und wandert in jede Feedausgabe, statt verschwiegen zu werden.

Die Frage an den Lieferanten ist eine **E-Mail an Dritte** und damit
freigabepflichtig. Sie steht auf der Liste, nicht in dieser
Entscheidung.

### Was das Gebiet nicht einschränkt

Die **Abholung am Betriebssitz.** Sie setzt keine Lieferung voraus, und
die Kalkulation empfiehlt sie ohnehin für alles unterhalb der
Frachtschwelle (`marge-25-prozent.md`: unter rund 110 € netto trägt eine
gelieferte Bestellung sich nicht, bei der echten Pauschale erst ab
344 €). Wer aus Schärding kommt und selbst lädt, wird nicht abgewiesen.

## Zwei Nebenfunde

### Der Feed nahm seine Grenze aus einer Umgebungsvariablen

`SHOP_BEZIRKE` bestimmte, welches Gebiet der Feed und die `llms.txt`
ausriefen. Eine Einstellung des Rechners, auf dem gebaut wird — mit dem
Ergebnis, dass zwei Läufe auf zwei Maschinen zwei verschiedene
Liefergebiete verkünden konnten.

Die Variable wird jetzt nicht mehr befolgt, sondern **verglichen**.
Weicht sie ab, meldet das Werkzeug einen Widerspruch und richtet sich
nach der Entscheidung:

```
Widerspruch zwischen Einstellung und Entscheidung:
  · SHOP_BEZIRKE nennt „Ried im Innkreis, Schärding", das entschiedene
    Liefergebiet lautet „Perg, Urfahr-Umgebung, Freistadt, Linz-Land, Linz"
    — es gilt die Entscheidung.
```

### Die Schreibsperre war leergelaufen

`npm run veroeffentlichung --schreiben` brach bisher ab, solange
Pflichtangaben fehlten — und die einzige verbliebene Pflichtangabe war
der Firmenname. Seit der am 26. August aus `betreiber.json` kommt, war
die Liste leer, und der Aufruf **schrieb**: einen Feed mit 43 Einträgen
ohne GTIN, den die Plattform als Ganzes ablehnt.

Aufgefallen ist das an einem Ordner, der bei den Testläufen entstand und
laut Zusicherung nicht hätte entstehen dürfen.

> **Eine Sperre, die an der falschen Bedingung hängt, geht auf, sobald
> die Bedingung anderswo gelöst wird.** Sie hängt jetzt an der
> Eigenschaft, um die es geht: Ohne `einreichbar` wird nichts
> geschrieben.

## Was im Rechenkern dazugekommen ist

| | |
|---|---|
| `src/liefergebiet.js` | die Bezirke mit Grund je Eintrag, `imLiefergebiet`, `pruefeLieferort`, Vorbehalt und Abholhinweis |
| `src/kunde.js` | prüft die Baustelle gegen das Gebiet — erst wenn das Land stimmt, damit nicht zwei Meldungen zur selben Ursache erscheinen |
| Baustellenfeld `bezirk` | neu und verlangt; die Vorlage `produktseite.md` hat ihren Platzhalter verloren |
| AGB Punkt 12 | heißt jetzt „Liefergebiet" und nennt die Bezirke |
| `bin/kampagne.mjs` | nimmt die Ausrichtung aus derselben Quelle |
| `bin/veroeffentlichung.mjs` | ebenso, meldet Abweichungen, und schreibt nur noch bei einreichbarem Feed |

**607 Testfälle grün, davon 19 neue.** Drei Mutationen gegengeprüft:
fehlenden Bezirk durchlassen (2 Fälle fallen), Gebietsgrenze aufheben
(1), die Prüfung aus `kunde.js` entfernen (3).

Die Testdaten haben dabei die Baustelle gewechselt. Sie lag auf **4910
Ried im Innkreis** — als Stolperstein gewählt, weil es zwei Orte dieses
Namens gibt, und damit zum zweiten geworden: Der Ort liegt außerhalb des
Gebiets. Als Regelfall taugt er nicht mehr, als Gegenprobe steht er
weiter im Bestand.

## Was offen bleibt

- **Das Liefergebiet des Lieferanten** — eine Frage an ihn, also eine
  E-Mail an Dritte und freigabepflichtig. Bis dahin gilt die engere
  Grenze.
- **Ob fünf Bezirke reichen.** Sie sind die Fläche, für die geworben
  wird, nicht das Ergebnis einer Nachfrageschätzung. Ob die 60
  Bestellungen im Monat daraus kommen können, ist offen — und mit den
  ersten 300 € Werbung zu messen, nicht vorher zu behaupten.
- **Ein Bezirksfeld im Bestellformular.** Der Rechenkern verlangt es;
  die Oberfläche des Funktionsmusters kennt es noch nicht.
