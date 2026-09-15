# Eine Kontrolle, die nur ein Test aufruft

**2. September 2026.** Die Frage der letzten Runde drehte die Richtung um:
*Was steht im Bestand, das niemand mehr braucht?* Vier Runden lang war nach
Fehlendem gesucht worden.

Gezählt habe ich, welche Ausfuhren des Rechenkerns **außerhalb der Tests**
niemand aufruft. Ergebnis: zwei völlig ungenannte Konstanten — und **dreißig
Funktionen, die nur Tests benutzen.**

Die meisten davon zu Recht: `kaskade`, `rangfolge`, `berechneBedarf`,
`ordneEin` gehören zur Analyse, ihr Aufrufer ist ein Dokument. Aber dreizehn
gehören einer anderen Sorte an.

## `src/kontrolle.js`: sieben Kontrollen, dreiundfünfzig Testverweise, null Aufrufe

Diese Datei ist die **zweite Rechnung** des Vorhabens, und sie beschreibt
selbst, warum sie anders gebaut ist:

> Sie liest den gerenderten Belegtext zurück und rechnet aus den Zeichen nach.
> […] Sie kennt weder `warenkorb.js` noch `preis.js`, sondern nur Text und die
> vier Grundrechenarten. […] Ein Fehler beim Formatieren wäre allen 213
> Testfällen entgangen, weil sie Objekte prüfen und keine Zeichen.

Nichts außerhalb von `test/` importiert sie. Nicht `auftragslauf.js`, kein
Werkzeug in `bin/`, nicht das Browserbündel.

Und der Auftragsabgleich behauptet zum neunten Ergebnis:

> „auftragslauf.js führt den Vorgang, **kontrolle.js prüft jeden Beleg gegen die
> Rechnung**, darfBestaetigtWerden verweigert die Bestätigung …"

Das Präsens beschrieb einen Vorgang, den es nicht gab.

> **Eine Kontrolle, die nur ein Test aufruft, kontrolliert einen Test.**

Es fehlte nicht die Rechnung. Es fehlte der Knopf.

## `npm run pruefe-kontrolle`

Sieben Kontrollen an einem aus dem echten Katalog gebauten Vorgang — demselben
Warenkorb der Zielgröße, den auch `pruefe-belege` liest, damit beide Befunde
vergleichbar sind:

```
  ✓ Rechnung geht in sich auf          Fünf Gleichungen im gerenderten Text
  ✓ Angebot geht in sich auf
  ✓ Die Klammer des Vorgangs ist geschlossen
  ✓ Keine Einkaufszahl im Kundenbeleg  Wareneinsatz steht nirgends im Text
  ✓ Der Bruttobetrag hängt nicht am Rundungsweg
  ✓ Der Belegtext stimmt mit dem Warenkorb überein
  ✓ Fracht gedeckt: Poschacher Baustoffhandel
```

Am Tag, an dem die erste Lieferantenrechnung eintrifft, nimmt derselbe Befehl
sie entgegen. Bis dahin hält er den eigenen Bau gegen sich selbst.

## Drei Funde beim Bauen, alle im selben Werkzeug

**Erstens: `baueVorgang` war nicht nachgezogen.** Der erste Lauf meldete
*„Zahlungsvermerk unbrauchbar — kein Zahlweg angegeben"*. `erzeugeRechnung`
hatte am Vormittag den Vermerk bekommen — den Satz, ohne den die Buchhaltung
des Kunden ein zweites Mal überweist. Die Klammer in `vorgang.js` baute weiter
Rechnungen ohne ihn.

Fünfter Fall derselben Familie in zwei Tagen: Eine Regel wird an der einen
Stelle eingeführt und gilt an der anderen nicht. Behoben.

**Zweitens: mein eigener Prüfer konnte an drei Stellen nicht rot werden.** Die
erste Fassung las das Ergebnis jeder Kontrolle als `abweichungen ?? fehler ??
[]` und hielt alles andere für sauber. Damit waren `pruefeMargenleck`
(`{dicht, funde}`), `pruefeBruttoUnabhaengig` (`{stimmig, abweichung}`) und
`pruefeFrachtdeckung` (`{gedeckt, grund}`) **strukturell blind** — drei von
sieben, an dem Tag, an dem drei andere Prüfer beim Nichtrotwerden ertappt
worden waren.

> **Ein Sammelgriff auf „irgendein Feld mit Abweichungen" ist keine Auswertung,
> sondern eine Hoffnung.**

Jede Kontrolle nennt ihr Urteilsfeld jetzt am Aufruf.

**Drittens: eine wahre Aussage über das falsche Objekt.** Nach der Berichtigung
meldete die Frachtdeckung *„Im Bestelltext steht kein Warenwert"*. Sie stimmte —
ich hatte ihr das bereits **gelesene** Ergebnis übergeben, und darin gibt es
keinen `.text` mehr. `pruefeFrachtdeckung` liest selbst. Die Meldung war
korrekt und beschrieb ein Objekt, das nie ein Bestelltext war.

## Was der neue Prüfer nicht kann

Er sagt es selbst am Ende jedes Laufs: **Steht überall derselbe falsche Preis,
geht die zweite Rechnung auf.** Sie prüft die innere Stimmigkeit, nicht die
Richtigkeit. Dafür ist der Abgleich mit dem Warenkorb da — und der ist eine der
sieben Kontrollen, aber er vergleicht Text gegen Objekt, nicht Objekt gegen
Wirklichkeit.

Die Gegenprobe steht im Register: Ein `Wareneinsatz: …` in den Rechnungstext
eingebaut, und die Kontrolle meldet ihn. Acht von acht Gegenproben schlagen an.

## Was übrig bleibt

Die anderen dreizehn Nur-von-Tests-Funktionen sind angesehen und **bleiben
stehen**:

- `ablage.js` (`stelleRechnungAus`, `storniere`, `aufbewahrungBis`) — die
  Belegablage nach § 131 BAO. Sie hat keinen Aufrufer, weil es keinen Beleg
  gibt, der abzulegen wäre. Das ist kein Ballast, sondern ein vorbereiteter
  Schritt.
- `vies.js`, `vorgang.js`, `abgleich.js` — dasselbe Muster.
- Die Analysefunktionen — ihr Aufrufer ist ein Dokument, und das ist der Zweck.

**Gelöscht wurde nichts.** Die Frage lautete „was braucht niemand mehr", und die
ehrliche Antwort ist: nichts davon ist überflüssig, aber eines davon war
unerreichbar — und genau das behauptete ein Beleg des Auftragsabgleichs als
laufenden Betrieb.

## Die Frage für den nächsten Lauf

> **Welcher Beleg des Auftragsabgleichs behauptet mehr, als er zeigt?**

Neun der zwölf Ergebnisse sind mit „unter anderem Namen vorhanden" beantwortet,
jedes mit einer Begründung, die auf Dateien zeigt. Bei Ergebnis 9 stand im
Präsens, was nie lief. Die anderen acht sind nach demselben Muster geschrieben
und von derselben Hand.
