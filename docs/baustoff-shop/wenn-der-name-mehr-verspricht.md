# Wenn der Name mehr verspricht als der Rumpf hält

**14. September 2026.**

## Der Anlass

Am 13. September ist dieselbe Bauart **dreimal** aufgefallen, jedes Mal an
einer anderen Stelle und jedes Mal durch Zufall:

| Zusicherung | was ihr Name sagte | was sie prüfte |
|---|---|---|
| `test/huebe.test.js` | „der Hubsatz steht **nur an einer Stelle**" | zwei der drei Stellen |
| `beschreibungsbefund` | jede Beschreibung sagt etwas **Eigenes** | „eigen" hieß: steht in keinem Nachbarfeld |
| `lesbarkeit` | der Name trägt **ein** Maß | der Leser fand ein Maß |

> **Dreimal an einem Tag hat eine Zusicherung etwas anderes zugesichert, als ihr
> Name sagt.**

Drei Funde durch Zufall sind kein Grund zu glauben, es seien die letzten — der
Satz, mit dem am 11. September das Zwillingsregister begann.

## Was sich davon messen lässt

Ein Testname ist Prosa; ihn mit seinem Rumpf zu vergleichen, geht im
Allgemeinen nicht maschinell. **Ein Sonderfall geht: der Allquantor.** Sagt ein
Name „jede", „jeder", „jedes" oder „alle", behauptet er eine Aussage über eine
**Menge**.

Gemessen über die Testdateien: **305 von 2498** Testnamen tragen einen
Allquantor.

Drei Formen sichern eine Menge zu, alle drei im Bestand belegt: eine
**Schleife**, ein **`deepEqual`** gegen die ganze erwartete Menge, oder eine
**Zusicherung über die Anzahl**. Die vierte Form, ebenfalls belegt, sichert
nichts zu: zweimal `assert.ok(x.some(…))`.

> **Zwei Stichproben sind keine Allaussage — sie sind zwei Stichproben.**

**Neunzehn** Namen mit Allquantor trugen keine dieser drei Formen.

## Was davon echt war

**Sieben.** Sie sind zugesichert worden — und zwar so, wie der Bestand es sonst
tut: mit einer Schleife über das **Register, aus dem die Meldungen kommen**.

| Testfall | war | ist |
|---|---|---|
| `Jeder Eintrag braucht einen Zeitpunkt` | **eine** von acht Arten | Schleife über `ARTEN` |
| `Jede Auskunft trägt Stand, Quelle und Vorbehalt` | **eine** Eingabe | fünf, darunter unbekanntes Gebiet und leere Eingabe |
| `Verschlechtern heißt bei jeder Annahme etwas anderes` | zwei von vier | Schleife über `ANNAHMEN`, Richtung aus `schlechterIst` |
| `Der Bogen nennt jedes Pflichtfeld, das fehlt` | zwei Stichproben | Schleife über die Pflichtfelder von `BOGEN` |
| `Der Partnerbogen nennt jedes fehlende Pflichtfeld` | zwei Stichproben | Schleife über `PARTNER_BOGEN` |
| `Die Prüfung benennt jede fehlende Pflichtangabe einzeln` | zwei Stichproben | Schleife über `RECHNUNGSMERKMALE` |
| `Das Impressum macht jede Lücke sichtbar` | zwei Lückenmarken | alle Marken gegen `pruefeBetreiberdaten` |

Bei drei davon war meine erste Fassung **selbst zu schwach**: Ich habe die
Anzahl gegen `Register.length - 1` gehalten und damit geraten, wie viele Felder
bedingt sind. Der Lauf hat es sofort gezeigt — 6 statt 10. Die Schleife über
die tatsächlich pflichtigen Felder braucht diese Annahme nicht.

> **Eine geratene Zahl ist keine Zusicherung, auch wenn sie eine Zahl ist.**

## Was nicht echt war

**Zwölf**, jede mit Grund im Register. Drei Muster:

- **Der Allquantor steht in der Eingabe oder der Bedingung.** „Sind **alle**
  Lieferzeiten bekannt…", „ohne **jede** Gewichtsangabe…", „mit **allen**
  Voraussetzungen…". Zugesichert wird ein Ergebnis, und das ist keine Menge.
- **Übertragene Allaussage.** `pruefeAbgleich` und `pruefeDatenfluesse` sind
  selbst der Lauf über alle Punkte; der Testfall sichert ihr Urteil über die
  ganze Menge zu. Eine Schleife im Testfall verdoppelte die Regel, statt sie zu
  halten.
- **Die Menge ist geschlossen und ausgeschrieben.** „alle drei Steuersätze",
  „alle drei Durchgänge" — die Zahl steht im Namen, und wächst die Menge, passt
  der Name nicht mehr.

Einer verdient eine eigene Zeile: `alle drei Formen werden gefunden` **zählt**
(`assert.equal(b.gefunden, 3)`). Die Messung sieht es nur nicht, weil die Zahl
in einem eigenen Feld steht und nicht in `.length`. Ein Zählwerk mit anderem
Namen ist ein Zählwerk — der Grund steht so im Register.

## Die Schranke steht auf null

Nicht aus Strenge, sondern weil nichts übrig ist: sieben zugesichert, zwölf
begründet.

> **Eine Schranke über null wäre ein Vorrat an Fällen, den niemand ansieht.**

## Drei Nebenbefunde, jeder aus dem Bau selbst

**Die Zerlegung gab es einmal, und sie musste zweimal wandern.** Der neue
Prüfer liest dieselben Testdateien wie `pruefe-tests` und braucht dieselbe
Lesart — eine, die zweimal berichtigt wurde: am 28. August (`test(name,
options, fn)` galt als Rumpf ohne Zusicherungen) und am 11. September
(`\btest\(` traf auch `muster.test(`). Sie steht jetzt in
`src/testzerlegung.js`.

> **Eine Zerlegung, die zweimal berichtigt wurde, darf es nicht zweimal
> geben.**

**Der Prüfer der Tests las in Anführungszeichen hinein.** `test/allaussage.test.js`
führt Testrümpfe als **Zeichenketten** mit — es prüft ja einen Leser, der
Rümpfe liest. `pruefe-tests` meldete zwei hohle Schleifen, die keine sind: Sie
laufen nie, sie stehen in Anführungszeichen.

> **Ein Prüfer, der in Anführungszeichen hineinliest, prüft eine Zeile, die nie
> läuft.**

Dieselbe Lehre steht seit dem 11. September in seinem eigenen Kopf, nur für
einen anderen Fall. Die Schleifenregel liest den Rumpf jetzt durch
`ohneZeichenketten()`.

**Und die Berichtigung hat sofort einen echten Fall freigelegt.** In
`test/shopkern.test.js` lief eine innere Schleife über `e.skus ?? []` ohne
Längenzusicherung — vorher verdeckt. Ein Registereintrag ohne Kennungen wäre
durchgelaufen, ohne etwas zu prüfen. Gezählt wird jetzt, wie viele Wörter
überhaupt Kennungen führen.

> **Ein Prüfer, der zu viel liest, verdeckt, was er lesen soll.**

## Was geändert wurde

| Datei | was |
|---|---|
| `src/allaussage.js` | neu: `traegtAllquantor`, `sichertMengeZu`, `allaussagebefund`, 27 begründete Ausnahmen, Sperrklinke auf null |
| `bin/allaussagenpruefung.mjs` | neu: `npm run pruefe-allaussagen` |
| `src/testzerlegung.js` | neu: die Zerlegung aus `bin/testpruefung.mjs`, dazu `ohneZeichenketten()` |
| `bin/testpruefung.mjs` | liest die Zerlegung, statt sie zu führen; die Schleifenregel liest ohne Zeichenketten |
| sieben Testdateien | Allaussagen zugesichert statt bestichprobt |
| `test/shopkern.test.js` | die freigelegte hohle Schleife geschlossen |
| `src/pruefregister.js` | der neue Prüfer im Register |

Zwei Gegenproben, jede rot gesehen:
`deepEqual-zaehlt-nicht-mehr-als-mengenzusicherung` ·
`die-meldung-gilt-wieder-als-zusicherung`

## Offen

Der Allquantor ist der Sonderfall, der sich messen lässt. Die anderen beiden
Fälle vom 13. September — „eigen" und „eindeutig" — waren **Begriffe in
Funktionsnamen**, nicht Testnamen, und für die gibt es keine mechanische
Regel. Was bleibt, ist der Reflex: Wer einen Begriff prägt, schreibt daneben,
was er **nicht** heißt.
