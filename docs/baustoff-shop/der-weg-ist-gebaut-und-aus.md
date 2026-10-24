# Der Weg ist gebaut, und er ist aus

**4. September 2026, Nachmittag.** Gate 26 ist seit einer Stunde entschieden:
Der Bestellweg läuft über ein eigenes Empfangsskript auf dem Hosting des
Auftraggebers. Heute ist er gebaut — Formular, Skript, Ablage, Proben — und
**eingeschaltet ist er nicht**.

Das ist kein halber Stand, sondern der Zustand, den das Gate beschreibt: Ohne
`betreiber.email` hat das Skript keinen Empfänger, und ohne verbindlichen
Datenschutzwortlaut darf keine Übertragung stattfinden.

## `bestellung.php` — was es tut und was ausdrücklich nicht

Dreißig Zeilen Empfangsskript, ohne Bibliothek. Es nimmt POST mit JSON,
begrenzt auf 64 KB, prüft jede Angabe auf Länge und auf Zeilenumbrüche, legt
unter Sperre ab und benachrichtigt den Betreiber.

Drei Dinge tut es **nicht**, und jedes davon hat einen Grund:

- **Es rechnet nichts nach.** Die Preise stehen im Text, den die Kasse gebaut
  hat; hier entstünde eine zweite Rechnung, die von der ersten abweichen kann.
  Nachgerechnet wird mit `npm run anfrage-lesen`, gegen den Katalog — nicht
  gegen das, was der Browser mitgeschickt hat.
- **Es bestätigt nichts.** Eine Auftragsbestätigung ist nach AGB Punkt 2 die
  Annahme des Vertrags; sie entsteht in `npm run vorgang`, nach der Prüfung von
  Liefergebiet, Mindestbestellwert und Lieferzeit.
- **Es schickt dem Kunden keine Mail.** Wer eine Empfangsbestätigung
  automatisch versendet, versendet sie auch an jede Adresse, die jemand anders
  hier einträgt.

> **Es nimmt entgegen, legt ab und sagt Bescheid. Mehr nicht.**

Zwei Entscheidungen im Detail, beide aus dem Bestand übernommen:

**Die laufende Nummer entsteht unter der Sperre.** Wer sie vorher zieht,
vergibt bei zwei gleichzeitigen Bestellungen zweimal dieselbe — dieselbe
Lehre wie in `src/ablage.js`, wo die Rechnungsnummer erst bei der Ausstellung
fällt.

**Erst ablegen, dann melden.** Scheitert die Mail, liegt die Bestellung
trotzdem in der Ablage und ist nicht verloren. Umgekehrt wäre eine gemeldete
Bestellung ohne Eintrag der teurere Fehler.

Und die Ablage liegt **über** dem Webverzeichnis, in `../bestellungen/`. Ein
Journal mit Namen und Anschriften, das unter einer URL erreichbar ist, ist kein
Journal, sondern eine Veröffentlichung — dieselbe Frage wie heute Mittag bei
`ablage/`, nur eine Ebene tiefer.

**Geprüft am laufenden PHP**, nicht am Quelltext: sieben Fälle, darunter die
Kopfzeileneinschleusung (`firma: "A\nBcc: opfer@…"` → abgewiesen, und nichts
abgelegt), die zweite Nummer, die unlesbare Adresse und der unkonfigurierte
Zustand von heute (503, „Der Bestellweg ist noch nicht eingerichtet").

## Ein Schalter, nicht zwei

Der Bestellweg entscheidet über zwei Dinge zugleich: ob `bestellung.php`
mitgeliefert wird, und was die Datenschutzseite über den Warenkorb sagt.

> **Zwei Schalter für dieselbe Sache sind ein Schalter, den einer vergisst.**

`WEBSITE_VERARBEITUNG` war eine Konstante. Sie ist jetzt `websiteVerarbeitung(aktiv)`
— eine Funktion, die jeder Aufrufer mit dem Schalter versorgen muss. Die
Konstante gibt es nicht mehr, also kann sie niemand versehentlich in der alten
Lesart weiterbenutzen. Beide Fassungen der Zusage sind messbar:

| Zustand | Die Seite sagt | Gemessen wird |
|---|---|---|
| aus | „wird nicht an den Server übertragen" | **kein** Absendeweg im Bündel |
| an | „überträgt sie an `bestellung.php` auf demselben Server" | **genau ein** Weg, und keine fremde Adresse |

## Der Prüfer hat den ersten Wurf sofort gemeldet

Das `fetch` stand zunächst in `shop-ui.js`, hinter einer Prüfung auf
`stand.wegZiel`. Der Weg war aus, es wäre nie gelaufen — und
`pruefe-datenschutz` meldete es trotzdem.

> **Er hatte recht. Eine Zusage, die auf einer null-Prüfung ruht, ist keine.**
> Wer sie prüfen will, müsste beweisen, dass eine Bedingung nie wahr wird, und
> das kann kein Textprüfer.

Das Absenden steht deshalb in `shop-bestellen.js` — einer eigenen Datei, die
**nur mit eingeschaltetem Weg** ins Bündel geht. Solange der Weg aus ist,
enthält das ausgelieferte Skript kein einziges `fetch`, und die Zusage ruht auf
dem Code statt auf dem Kontrollfluss. Die Gegenprobe
`schlafendes-fetch-im-buendel` hält das wach: Sie packt die Datei hinein,
obwohl der Weg aus ist, und verlangt, dass es auffällt.

## Vier weitere Funde der eigenen Änderung

**Ein Kommentar ist kein Absendeweg.** In `shop-ui.js` steht jetzt ein
Kommentar, der erklärt, warum das `fetch` **nicht** dort steht.
`bestellwegBefund` las ihn und meldete einen Absendeweg; vier Testfälle wurden
rot, keiner davon zu Recht. Gemessen wird seither ohne Kommentare — und zwar
in `absendewege()` selbst, nicht beim Aufrufer: Vier Stellen rufen sie, und die
fünfte würde es vergessen.

**Bauwerkzeug im Download jedes Besuchers.** `rechtstexte.js` braucht den Satz
über den Warenkorb, und `rechtstexte.js` geht ins Browserbündel. Über einen
Import hätte es `bestellweg.js` und dessen Kommentarauslese mitgezogen. Die
Voraussetzungen kommen deshalb als Wert herein: Wer prüft, bringt das Register
mit; wer nur den Satz braucht, bekommt ihn ohne.

**Eine Liste, die nicht mehr alles nennt.** `bestellwegbau.js` kam über die
Importhülle ins Bündel, ohne in `KERNMODULE` zu stehen. Ein Testfall hat die
Differenz gemeldet — 23 sortiert gegen 22 deklariert.

**Ein Anker, der weggezogen ist.** Die Probe „das gebaute demo.html führt sein
Skript wirklich aus" suchte `${KORBSCHLUESSEL}` als Beleg dafür, dass die
Deklaration vor der Verwendung steht. Die Einsetzung ist umgezogen; die
geprüfte Eigenschaft ist dieselbe geblieben, der Anker nachgezogen.

## Was der Auftraggeber davon merkt

Heute nichts — der Bau meldet es beim Laufen:

```
Bestellweg aus — bestellung.php wird nicht mitgeliefert.
  es fehlt betreiber.email: …
  es fehlt rechtstexteFundstelle: …
```

Am Tag, an dem beides dasteht, liefert derselbe Befehl das Skript mit, die
Kasse zeigt drei Felder und einen Knopf, und die Datenschutzseite benennt die
Übertragung. Es ist kein zweiter Auftrag und keine weitere Runde nötig.
