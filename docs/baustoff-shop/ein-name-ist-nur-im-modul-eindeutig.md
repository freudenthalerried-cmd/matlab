# Ein Name ist nur in seinem Modul eindeutig

**9. September 2026, spät.** Seit dem 3. September gibt es einen Prüfer für
die Frage, welche gebaute und geprüfte Funktion außerhalb ihrer Tests niemand
ruft. Er hat an dem Tag zwei gefunden — `erzeugeAngebot` und
`pruefeAnfrageAufGeheimnis` —, und seither steht sein Register mit
neununddreißig Einträgen und je einem Pflichtgrund.

Er war grün. Er ist es auch heute. Aber er hat drei Ausfuhren übersehen, und
alle drei aus demselben Grund:

> **Er kannte Funktionen bei ihrem Vornamen und zählte Erwähnungen wie
> Aufrufe.**

---

## Die drei Fälle

**Erstens: ein Name gehört einem Modul, nicht dem Bestand.** Acht Namen gibt
es hier zweimal — `kennzahlen`, `deckungsbefund`, `vergleiche`,
`werteAntwortAus`, `zuordnungsbefund`, `mindestbestellwertKunde`,
`ohneKommentare`, `zeitstempel`. Der Prüfer suchte den bloßen Namen im ganzen
Quelltext: Wurde einer der beiden gerufen, galt der andere als gerufen.

**Zweitens: eine Zeichenkette ist kein Code.** `pruefeAblageAufDrittdaten`
galt als gerufen, weil ihr Name in `src/ablage.js` in einem **Feldtext**
steht:

```
zweck: 'Betreff oder Vermerk — nie der volle Belegtext;
        Schranke: keine Daten Dritter (pruefeAblageAufDrittdaten)'
```

Kommentare hat dieser Prüfer von seinem ersten Tag an entfernt, und der Grund
dafür steht in seinem Kopf: sonst hätte der Satz „gerufen hat `erzeugeAngebot`
niemand" die Funktion als gerufen gemeldet. **Die Regel war da, die
Zeichenkette lag daneben.**

**Drittens: ein Muster ist kein Aufruf.** `zeitstempel` aus dem gestern
gebauten Kalender galt als gerufen, weil der Name in einem regulären Ausdruck
vorkommt — in `KALENDERRUF`, dem Muster, mit dem der Uhrenprüfer nach
Kalenderaufrufen sucht.

---

## Was dahinter lag

`pruefeAblageAufDrittdaten` sagt über sich selbst:

> Heute steht sie nicht drin — aber **aus Zufall, nicht aus Absicht**:
> `ablageEintraege` legt nur den Betreff der Bestellung ab, nicht ihren Text.
> Wer das einmal auf `b.text` ändert, hätte die Rufnummer für sieben Jahre
> unlöschbar im Journal. **Diese Prüfung macht aus dem Zufall eine
> Zusicherung.**

Nur hat sie niemand gerufen. **Eine Zusicherung, die nicht läuft, ist ein
Kommentar.** Sie steht seit heute in `npm run vorgang --ablegen`, nach dem
Schreiben: Herausnehmen ließe sich der Eintrag nach § 131 BAO ohnehin nicht
mehr — sie sagt, was drinsteht, damit es beim nächsten Mal nicht wieder
hineingerät.

Und `vergleiche` aus `src/zahlung.js` hält jeden Zahlweg gegen vier
Anforderungen und rechnet seine Monatskosten. **Das ist die Tafel, auf der
Gate 21 ruht** — die Entscheidung für EPS und Vorkasse, gegen Karte und offene
Rechnung. Sie stand in der PR-Beschreibung, im Gate-Register und in vier
weiteren Dokumenten. Gerechnet hat sie außerhalb der Tests **niemand**.

---

## Der erste Lauf hat sofort etwas gefunden

`npm run zahlwege` entstand, damit die Tafel einen Befehl hat. Er nimmt seine
Lage aus `data/zielgroessen.json` — kein Werkzeug mit eigenen Annahmen; das
wäre eine zweite Rechnung neben der ersten.

Beim ersten Lauf hat er sich geweigert:

```
Abbruch: zielgroessen.json nennt keine Fracht je Bestellung.
Die Zahlungsgebühr rechnet auf den vollen Kundenzahlbetrag, und der
trägt die Fracht mit. Ohne sie wäre jede Zeile hier zu günstig.
```

**Und das ist der eigentliche Fund dieser Runde.** `wirkungAufMonat` trägt in
ihrem eigenen Kopf:

> Die Bemessungsgrundlage ist der volle Kundenzahlbetrag — Warenumsatz **plus
> durchlaufende Fracht**, beides brutto. Diese Hochrechnung ließ die Fracht
> aus und widersprach damit der eigenen Erklärung.

Der Satz beschreibt eine Berichtigung, die an der **Funktion** vorgenommen
wurde: Sie nimmt die Fracht seither als Parameter. In
`data/zielgroessen.json` stand sie nicht, also kam beim Aufruf der Vorgabewert
null an, und `noetigerUmsatz` rechnete die Zahlungsgebühr auf einen Umsatz
**ohne Fracht**.

> **Die Berichtigung war an der Funktion angekommen und nicht an den Daten.**

Poschacher hat keine Frei-Haus-Schwelle. Die Pauschale von 75,50 € fällt bei
**jeder** Zustellung an, der Kunde zahlt sie mit, und der Zahlungsanbieter
nimmt seinen Prozentsatz vom vollen Betrag.

| | bisher | gültig |
|---|---|---|
| nötiger Monatsumsatz | 43.396 € | **43.792 €** |
| Bestellungen im Monat | 67 | **68** |
| Kaufquote am Marktboden | 0,77 % | **0,78 %** |
| EPS-Gebühr im Monat | 485,43 € | **545,40 €** |

Das ist **das dritte Mal**, dass die Leitzahl falsch war — nach den
45.356 € **bei Kartenzahlung**, die bis zum 1. September dastanden, obwohl
Gate 21 zwei Tage vor ihrer Berechnung EPS entschieden hatte. Wieder war die
Richtung dieselbe: zu günstig.

---

## Gate 32: Die Liste warnt, das Gate entscheidet

Mit der Fracht in der Grundlage erfüllt **kein einziger** Zahlweg alle vier
Anforderungen. Zwei davon widersprechen dem entschiedenen Gate 21:

- **Vorkasse** meldet den Zahlungseingang nicht maschinell zurück. Sie ist
  trotzdem entschieden — sie kostet nichts und braucht keinen Vertrag. Die
  Bedingung beschreibt damit **Handarbeit im Postfach**, nicht Untauglichkeit.
- **EPS** kostet 545,40 € im Monat, also **10,1 %** des Zielgewinns; die
  Bedingung sagt „höchstens 10 %". Die Überschreitung beträgt **7,40 € im
  Monat**. Und die Schwelle nennt als Herkunft `PARAMETER.md` — dort ist die
  einzige 10-%-Angabe der **Werbekostenanteil vom Umsatz**, eine andere Größe.

**Entschieden (Gate 32, selbst):** Gate 21 gilt. Eine Schwelle ohne Herkunft
entscheidet nicht über ein Gate, das auf einer nachgerechneten Skontowirkung
ruht. Die Liste bleibt stehen und wird bei jedem Lauf gerechnet; `npm run
zahlwege` nennt beide Widersprüche beim Namen. Sie wird zur Sperre, sobald
jemand die 10 % belegt — bis dahin ist sie eine Warnung mit Ziffern.

---

## Zwei Proben, die von der Berichtigung fielen

**Die Empfindlichkeitsprobe.** Sie behauptete: „beim Rechnungskauf ohne
Fixbetrag fällt der zweite Effekt weg". Mit der Fracht in der Grundlage
stimmt das nicht mehr — **die Frachtpauschale ist selbst ein Fixbetrag je
Bestellung**, und jeder prozentuale Zahlweg zahlt seinen Satz darauf. Der
Rechnungskauf liegt seither vorn (1,18 gegen 1,13). Geprüft wird jetzt, was
die Aussage trägt.

**Die Schwellenprobe.** Sie stört die Eingaben und sieht an, welche Schwelle
sich nicht rührt. Der leistbare Klickpreis rührte sich — aber nur, weil
`bestellungen` aufgerundet wird und der Sprung die Zahl zufällig bewegte. Er
liest seine Quote aus `ziel.umsatzProSession`, und die Störung veränderte ein
`quote`-Argument daneben, das er gar nicht liest.

> **Eine Störung, die die gestörte Größe nicht erreicht, prüft nichts.**

Mit der Fracht fiel der Zufall weg, und die Probe wurde rot. Die Störung
reicht die Quote jetzt dorthin, wo sie gelesen wird.

---

## Was der Prüfer jetzt kann — und was nicht

Ein Aufruf zählt nur noch dort, wo die Datei den Namen **aus diesem Modul**
eingeführt hat — oder wo sie aus dem Browserbündel läuft und gar nichts
einführen kann. Umbenannte Einfuhren (`import { eng as weit }`) und
Weiterexporte zählen mit. Zeichenketten und Muster fallen vorher heraus.

**Mehrzeilige Schablonen bleiben unangetastet**, und das ist Absicht:
`bin/website.mjs` baut die Seiten aus Schablonen, und darin steht echter Code
zwischen HTML-Anführungszeichen.

```
<meta name="description" content="${esc(kurzfassung(seite.kurz, 300))}">
```

Wer diese Zeile wie Code behandelt, hält `content="` für den Anfang einer
Zeichenkette und verliert den Aufruf darin — **ein Fund, den es nicht gibt.**
Beim Bauen ist genau das zweimal passiert: einmal 269 gemeldete Ausfuhren,
einmal 49. Die Richtung des Irrtums bleibt damit dieselbe, die der Prüfer von
sich selbst behauptet: *Er findet zu wenig, nie zu viel.*

---

## Was das nicht löst

> ⚠️ **Zurückgenommen am 9. September, spät.** Hier stand, `zeitstempel`
> stehe mit Grund im Register und der Grund sei eine offene Frage: Die
> JS-Ablage lege mit einem Tag ab, und damit fehle ihr die **Zeitfolge**
> nach § 131 Abs 1 Z 2 BAO — zwei Einträge desselben Tages stünden ohne
> Reihenfolge. **Das ist falsch, und die Antwort stand in derselben Datei,
> zwölf Zeilen über der, die ich gelesen hatte.** `FELDER_DER_ABLAGE` führt
> als erstes Feld `lfd` mit genau dieser Grundlage: *„Eintragungen der
> Zeitfolge nach — die laufende Nummer macht Lücken und Umsortierungen
> sichtbar."* Sie wird beim Anhängen vergeben, steht in jeder Journalzeile
> und wird beim Einlesen Zeile für Zeile gegen ihre Position gehalten. Die
> Zeitfolge ist damit geführt; der Tag im `zeitpunkt` ist das
> Ausstellungsdatum nach § 11 UStG und muss kein Zeitstempel sein.
>
> *Ich habe eine Lücke behauptet, ohne die Stelle zu lesen, die sie
> schließt* — dieselbe Bewegung, die dieses Verzeichnis sonst an anderen
> findet.

`zeitstempel` steht seit heute **nicht mehr** im Register: `npm run
bestellprobe` ruft ihn. Er misst am laufenden PHP, ob der Stempel des
Empfangsskripts denselben Kalendertag nennt wie der Kalender dieses Betriebs
und denselben Augenblick meint wie seine eigene Zeichenkette. Der Beleg für
die Berichtigung vom Vortag war bis dahin ein **eigener kleiner
PHP-Schnipsel** — und ein Beleg über einen Schnipsel ist ein Beleg über den
Schnipsel.

Und die 10-%-Schwelle bleibt unbelegt. Gate 32 hält sie als Warnung, nicht als
Sperre — belegt ist sie damit nicht, sondern nur eingeordnet.
