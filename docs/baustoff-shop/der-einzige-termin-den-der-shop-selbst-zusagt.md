# Der einzige Termin, den der Shop selbst zusagt

**2. September 2026.** Beide Wege sind gemessen: fünf Schritte für den
Besucher, dreizehn Minuten für den Betreiber. Die Frage danach war die Zeit
dazwischen — *wie lange wartet der Kunde auf eine Antwort?*

Sie steht in keiner der beiden Rechnungen, und zwar aus einem strukturellen
Grund: **Sie liegt zwischen den Schritten.** Die elf Schritte in
`auftragslauf.js` zählen Bearbeitungsminuten. Was zwischen dem Eintreffen der
Anfrage im Postfach und dem Öffnen des Postfachs vergeht, zählt keiner davon.

## Was die Kasse versprach

> „Diese Liste ist eine Anfrage, keine Bestellung. Kopieren Sie sie in eine
> Mail — **wir melden uns mit Preis, Verfügbarkeit und Termin zurück.**"

Zwei Dinge stimmen daran nicht.

**Erstens: „mit Preis".** Der Preis steht auf derselben Seite, in der
Preistafel darüber und im Anfragetext darunter. Ihn als noch offen anzukündigen
nimmt der ganzen Preistransparenz den Boden, mit der dieser Shop wirbt —
„Baumeisterpreis, nicht Liste". Wer liest, man melde sich *mit* Preis, schließt:
Der Preis auf der Seite ist nicht der Preis.

Richtig ist **bestätigen**. Genannt ist er längst; unverbindlich ist er, weil
Preise altern, nicht weil er unbekannt wäre.

**Zweitens: keine Zeitangabe.** „Wir melden uns zurück" — wann? Im
Baustoffhandel entscheidet das über den Auftrag. Wer am Nachmittag anfragt und
am übernächsten Tag ein Angebot bekommt, hat längst woanders gekauft.

## Was jetzt dasteht

> „… Kopieren Sie sie in eine Mail — wir bestätigen Preis, Verfügbarkeit und
> Termin."

Ohne Zeit. **Und sie wird nicht erfunden.** Eine Antwortzeit auf einer
Kundenseite ist eine Zusage im Namen des Auftraggebers; die trifft er, nicht
ich.

Stattdessen ist sie eine **geführte Angabe** geworden, wie alle anderen offenen
Betreiberdaten:

- `data/betreiber.json` trägt `antwortzeitWerktage: null` mit Begründung.
- `npm run startklar` führt sie als offenen Punkt, Zuständigkeit Auftraggeber,
  mit dem Kassenwort „eine zugesagte Antwortzeit".
- `npm run offenepunkte` nennt sie damit neben E-Mail, Telefon, UID und
  Gewerbewortlaut.
- Steht dort eines Tages eine Zahl, schreibt die Kasse sie von selbst:
  *„… innerhalb von 1 Werktag."* Nachgewiesen, nicht behauptet — mit `1` in
  der Datei erscheint der Satz im Browser.

> **Die Antwortzeit ist der einzige Termin, den dieser Shop selbst zusagt.**
> Alle anderen kommen vom Lieferanten, und die Lieferzeit ist genau deshalb
> seit dem 30. August eine sichtbare Lücke.

## Eine zurückgezogene Gegenprobe, und was sie gezeigt hat

Ich wollte festhalten, dass eine erfundene Antwortzeit auffällt: „innerhalb von
24 Stunden" in den Kassentext, `pruefe-seiten` muss rot werden.

Er blieb grün — **zu Recht.** Der Kassentext steht in keiner gebauten Datei. Er
entsteht erst im Browser aus `shop-ui.js`; die HTML-Seite enthält nur das
Gerüst. Kein Inhaltsprüfer sieht ihn.

Das ist zum dritten Mal dieselbe Familie. Am 1. September waren es die Belege,
die kein Prüfer las, und `shop-ui.js`, das in keinem Widerrufsbestand stand.
Heute der Satz, der die einzige eigene Zusage des Shops trägt.

> **Was erst im Browser entsteht, prüft keine Datei.**

Der Eintrag ist zurückgezogen und steht mit diesem Grund unter den Prüfern ohne
Gegenprobe. Der Satz gehört in ein Szenario der Oberflächenprobe — und die
braucht dann eine eigene Gegenprobe. Das ist die nächste Runde, nicht diese:
Ein halber Eintrag im Register wäre eine falsche Anschuldigung gegen
`pruefe-seiten`, und die hatte ich gestern schon zweimal.

## Fünf Proben halten das fest

Darunter zwei, die den Unterschied zwischen Zusage und Lücke bewachen: `0`,
`-1`, `"2"` und `NaN` sind **keine** Zusage, und ohne Kassenwort bliebe der
Punkt für den Kunden unsichtbar. Dazu die Datenprobe: Steht dort eines Tages
eine Zahl ohne Begründung, ist `null` nur eine Lücke gewesen.

Zwei bestehende Proben haben den Wechsel angezeigt — der vollständige
Testbetreiber und die Bau-Probe über Startseite und `llms.txt` brauchen die
Antwortzeit jetzt, sonst bliebe „Bestellen ist noch nicht möglich" aus einem
Grund stehen, den sie gar nicht meinen. Genau dafür gibt es sie.

## Die Frage für den nächsten Lauf

> **Welcher Satz des Shops entsteht erst im Browser — und wer liest ihn?**

Der Kassentext ist einer. `shop-ui.js` hat rund zweitausend Zeilen, und was
davon als Satz beim Kunden ankommt, steht in keiner gebauten Datei. Die
Oberflächenprobe fährt elf Szenarien; wie viele Sätze es sind, weiß niemand.
