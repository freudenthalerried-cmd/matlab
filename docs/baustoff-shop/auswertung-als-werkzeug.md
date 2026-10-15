# Der Bogen als Werkzeug: `npm run auswerten`

Stand: 2026-08-17. Bauprotokoll der Runde.

## Warum diese Runde

Am Freigabetag sitzt der Auftraggeber mit dreizehn Antworten vor dem
Bildschirm. Die Regeln, nach denen diese Antworten zu bewerten sind, stehen
seit Gate 17 fest und sind in `auswertung.js` und `partnerauswertung.js`
ausführbar — aber bislang nur aus Testfällen heraus aufrufbar. Wer die
Auswertung sehen wollte, musste ein Testprotokoll lesen. Das ist die falsche
Form für den Moment, in dem sie gebraucht wird: Der Auftraggeber braucht ein
Werkzeug, kein Testprotokoll.

## Was gebaut wurde

**`shop/bin/auswerten.mjs`** — ein Kommandozeilenwerkzeug nach dem Muster
von `bin/import.mjs`:

```
npm run auswerten                      # Probelauf über die fiktive Beispieldatei
npm run auswerten -- antworten.json    # echte Antworten auswerten
```

Es trägt vor, in dieser Reihenfolge:

1. **Bogenvollständigkeit je Lieferantenantwort** — welche Pflichtfelder
   fehlen, mit der Entweder-oder-Regel für die beiden Antwortwege
   (Händlerrabatt oder Netto-Einkaufspreis gegen Straßenpreis-Deckel).
2. **Prüfung A** — bestanden oder nicht, mit Zahl der bezifferten und der
   bestandenen Antworten; bei Bestehen die tragende Marge (der schwächere
   der beiden besten Werte) und die Folgen daraus: nötiger Monatsumsatz,
   Bestellungen, Sessions — gerechnet mit Fracht und Zahlweg aus dem
   `lage`-Block der Antwortdatei.
3. **Je gescheiterter Antwort die fehlenden Bedingungen** — damit eine
   Nachfrage beim Hersteller gezielt formuliert werden kann.
4. **Partnerrunde** — machbar oder nicht, tragender Leadpreis (der
   zweithöchste), im oder außerhalb des Preisbands 100–250 €.

Die Schlusszeile jeder Ausgabe benennt die Rollenverteilung: *Die Regeln
stehen vorab fest (Gate 17). Dieses Werkzeug trägt vor, es entscheidet
nicht.* Entschieden wird an den Gates, dokumentiert im Gate-Register.

**`shop/beispiel/antworten-beispiel.json`** — die fiktive Vorlage. Vier
Lieferantenantworten (Rabattweg, zweiter Rabattweg, Großhandelsweg mit
Netto-EK gegen Deckel, ein leerer Bogen als Absage) und drei
Partnerantworten (eine ohne namentliche Nennung). Jeder Name trägt das
Präfix FIKTIV, der `_hinweis` im Dateikopf sagt es noch einmal: Erfundene
Namen, erfundene Konditionen — sie belegen nichts. Echte Antworten kommen
in eine Kopie dieser Datei.

## Warum die Beispieldatei dieselben Zahlen wie die Generalprobe trägt

Absicht. Die Generalprobe (`test/generalprobe.test.js`) beweist die Kette
maschinell; die Beispieldatei führt dieselbe Kette am Bildschirm vor. Wer
`npm run auswerten` startet, sieht dasselbe Ergebnis, das der Testlauf
zusichert: Prüfung A bestanden, tragende Marge 40 %, Partnerrunde machbar,
tragender Leadpreis 150 € im Band. Weichen Werkzeug und Testlauf je
voneinander ab, ist das ein Befund.

## Absicherung

Zwei Testfälle in `test/auswerten-werkzeug.test.js` starten das Werkzeug
als Kindprozess (wie ein Benutzer es täte) und prüfen die Ausgabe: der
FIKTIV-Hinweis erscheint, Prüfung A besteht mit 40 %, die Partnerrunde ist
machbar mit Leadpreis im Band, der Gate-17-Schlusssatz steht darunter; mit
Dateiargument werden alle vier Lieferantenantworten gezählt und der leere
Bogen als unvollständig ausgewiesen. Damit ist auch die Vortragsschicht
selbst unter Test — ein Formatierungsfehler, der die Aussage verfälscht,
fiele auf.

Ein Grammatikfehler wurde vor dem Commit behoben: Die Bandzeile rendert
jetzt „im Band 100–250 €" bzw. „AUSSERHALB des Bands 100–250 €" statt des
verunglückten „im Bands".

Testbestand: 408 Fälle, alle grün, Prüfer ohne Verdacht.

## Was offen bleibt

Das Werkzeug liest eine Datei, die jemand von Hand füllt. Die
Feldnamen der JSON-Datei sind die der Bögen (`BOGEN`, `PARTNER_BOGEN`);
eine Eingabemaske gibt es nicht und braucht es für dreizehn Antworten
nicht. Wenn die echten Antworten da sind, entsteht die Kopie der
Beispieldatei — und die Auswertung ist ein Befehl, kein Nachmittag.

## Nachtrag vom selben Tag: das Werkzeug selbst auditiert

Die Audit-Serie „vom Verhalten zur Erklärung" hat als nächsten Prüfwinkel
die Vortragsschicht bekommen — das Werkzeug, das tags zuvor entstand.
Drei Befunde, alle vom selben Schlag wie die neun davor: **Schweigen an
der falschen Stelle.**

1. **Fehlender `lage`-Block verschwand stumm.** `werteRundeAus` liefert
   dann `folgen: null`, und die Ausgabe ließ die Folgen-Zeile einfach
   weg — „Prüfung A: BESTANDEN" stand da, als wäre nichts. Jetzt steht
   dort: *Folgen: nicht berechenbar — der Antwortdatei fehlt der
   lage-Block.*
2. **Eine nicht tragfähige Lage wurde verschluckt.** Die Kaskade liefert
   `tragfaehig: false` samt Grund („Nach Werbung und Gebühren bleibt
   nichts übrig") — die Ausgabe druckte davon nichts. Das ist der
   gefährlichste der drei: Prüfung A kann bestehen, während das
   Kostenmodell das Vorhaben verwirft, und genau diese Zeile fehlte.
   Jetzt: *Folgen: NICHT TRAGFÄHIG — <Grund aus der Kaskade>.*
3. **Kaputte oder fehlende Dateien warfen rohe Stacktraces.** Am
   Freigabetag ist ein Stacktrace keine Fehlermeldung. Jetzt: klare
   Meldung mit Verweis auf das Muster `antworten-beispiel.json`,
   Exit-Code 1.

Drei neue Testfälle starten das Werkzeug als Kindprozess gegen präparierte
Dateien (ohne Lage, Werbeanteil 45 %, kaputtes JSON). Gegenprobe per
Mutation: Folgen-Zweige entfernt → 2 Testfälle fallen; Fehlerbehandlung
entfernt → 1 fällt. Testbestand: 411, alle grün, Prüfer ohne Verdacht.

Merkposten für die Serie: Auch eine Vortragsschicht kann optimistisch
lügen — nicht durch falsche Zahlen, sondern durch weggelassene Zeilen.
