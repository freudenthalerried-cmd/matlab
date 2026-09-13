# Anwesend ist nicht dasselbe wie richtig

**4. September 2026.** `npm run startklar` führt seit dem 25. August den Punkt
`impressum`. Er zählt die dreizehn Pflichtangaben nach § 5 ECG und meldet, wie
viele fehlen. Heute wollte ich ihn benutzen, um dem Auftraggeber die vier
offenen Felder in einer Zeile zu nennen — und habe stattdessen gesehen, wonach
er nie gefragt hat.

> **Er prüft, ob eine Angabe dasteht. Nicht, ob sie eine Angabe ist.**

Ein `"uid": "steht"` erfüllt diesen Punkt. Ein `"plz": "Oberösterreich"` auch.
Ein `"email": "office(at)bauversand.com"` ebenso. Der Punkt wird grün, das
Impressum geht online, und der erste, dem es auffällt, ist ein Kunde oder eine
Behörde.

Am teuersten ist die UID. Sie steht nach § 11 Abs 1 Z 3 UStG auf Rechnungen
über 400 €, und ein Tippfehler dort gefährdet den **Vorsteuerabzug des
Kunden** — nicht einmal, sondern bei jeder dieser Rechnungen, so lange,
bis es jemandem auffällt.

Die Rechnung dafür liegt seit dem 27. August im Bestand: `uidPruefzifferStimmt`
in `src/kunde.js` rechnet die Prüfziffer der österreichischen UID nach. Sie
bewacht Gate 7 — die UID des **Kunden**, damit die Nettorechnung trägt. Die
**eigene** hat sie nie gesehen.

> **Die Regel war da, sie stand nur an einer Stelle.** Dieselbe Familie wie am
> 2. September beim Widerruf, der sechs Tage lang nur in den Dokumenten stand
> und nicht in der Oberfläche: Eine Prüfung, die an einer Stelle gilt und an
> der anderen nicht, sieht aus wie eine Regel und ist eine Ausnahme.

## `src/betreiberform.js`

Fünf Formregeln, je Angabe eine, jede mit **Beispiel und Grund**:

| Angabe | geprüft wird | Beispiel |
|---|---|---|
| `uid` | Prüfziffer nach dem österreichischen Verfahren | `ATU12345675` |
| `firmenbuchnummer` | `FN`, bis sechs Ziffern, Prüfbuchstabe | `FN 347938z` |
| `plz` | vier Ziffern | `4312` |
| `email` | ein `@`, ein Punkt danach, keine Leerzeichen | `office@bauversand.com` |
| `telefon` | Ziffern und Trennzeichen, mindestens sieben | `+43 7238 12345` |

Das `beispiel` ist Pflichtfeld, nicht Zierde: Vier dieser Felder sind leer und
warten auf den Auftraggeber. Eine Regel ohne Beispiel zwingt den, der sie
ausfüllen soll, zum Raten.

**Ein leeres Feld ist kein Formfehler.** Es ist ein offener Punkt, und den
führt `pruefeBetreiberdaten` seit dem 25. August. Zwei Prüfungen, die über
dieselbe Sache verschiedene Auskünfte geben, wären schlimmer als eine — deshalb
sieht `pruefeBetreiberform` nur an, was gefüllt ist.

Der Bestand hält: zwei gefüllte Felder mit Formregel, null Mängel.

## `npm run impressum`

Ein Blatt für den Auftraggeber. Es nennt je offenes Feld den Ort in
`data/betreiber.json`, die Bezeichnung aus dem Gesetz, ein Beispiel und den
Grund, warum es gebraucht wird — und darunter, was damit aufgeht: das
Hochladen, der Rechtstexteauftrag, der Lieferantenbrief. Solange etwas offen
oder in falscher Form ist, endet es rot.

Der Punkt `impressum` in `startklar()` fällt seit heute auch über Formfehler,
nicht nur über fehlende Angaben.

## Was die Probe an der Probe fand

Der eigentliche Ertrag der Runde steht nicht in der neuen Datei, sondern in
zwei alten. Beide Proben füllten das Impressum vollständig — und beide mit
Angaben, die keine sind:

- `test/startklar.test.js` setzte **jedes** der dreizehn Felder auf die
  Zeichenkette `'steht'` und verlangte dann `startklar: true`. Die Probe für
  „mit allem, was gebraucht wird, ist der Shop startklar" hätte einen Shop mit
  dreizehn Platzhaltern durchgewinkt. Sie zieht ihre Angaben jetzt aus den
  `beispiel`-Feldern der Formregeln; wo es keine Regel gibt, bleibt `'steht'`
  stehen — dort ist die Anwesenheit tatsächlich alles, was zählt.
- `test/website.test.js` prüft, dass der Satz „Bestellen ist noch nicht
  möglich" auf Startseite und `llms.txt` **kippt**, sobald alles beantwortet
  ist. Dafür schrieb sie `uid: 'ATU12345678'` — eine UID, die aussieht wie
  eine und deren Prüfziffer nicht aufgeht. Der Shop hätte sich auf eine
  erfundene Nummer hin für bestellfähig erklärt.

> **Eine Probe, die eine Zusage mit einem Platzhalter erfüllt, prüft den
> Platzhalter.** Beide Zeilen sind von mir, beide sind Wochen alt, und beide
> haben bis heute grün gemeldet.

## Drei Prüfer haben die neue Datei sofort gelesen

- `pruefe-widerrufe` meldete sie **vier Mal**. Ich hatte „auf jeder Rechnung"
  und „auf jedem Beleg" geschrieben — beides Formulierungen, die am 27. August
  über die **Fracht** zurückgenommen wurden. Meine Sätze meinen die UID und die
  Anschrift, nicht die Fracht; das Muster kennt den Wortlaut und nicht die
  Absicht. Richtig ist trotzdem der Prüfer: Wer die abgelöste Formulierung
  wiederbenutzt, macht sie wieder auffindbar. Umgeschrieben.
- `pruefe-tests` verlangte vor jeder Schleife über die Regeln eine Aussage über
  deren Anzahl.
- Die Gegenprobe `eigene-uid-ungeprueft` zeigte zuerst „meldete trotz Mutation
  grün" — und beschuldigte damit einen Prüfer, der die Datei nie gesehen hat.
  Ich hatte sie auf `pruefe-tests` gerichtet, den Prüfer der **Testqualität**;
  gefallen wäre der **Testlauf**. Dieselbe Familie wie der Befund oben: ein
  Werkzeug, das existiert, an der falschen Stelle angeschlossen. Jetzt zeigt
  sie auf `test` und schlägt an: Nimmt man die Prüfziffernrechnung aus
  `FORMREGELN` heraus, wird `test/betreiberform.test.js` rot.

## Was das für den Auftraggeber ändert

Nichts an der Liste — es sind weiterhin dieselben vier Felder (E-Mail,
Telefon, UID, Gewerbewortlaut). Was sich ändert, ist der Tag danach: Bisher
hätte ein Tippfehler beim Eintragen niemanden gestört. Jetzt fällt er auf,
bevor die Seite online geht.
