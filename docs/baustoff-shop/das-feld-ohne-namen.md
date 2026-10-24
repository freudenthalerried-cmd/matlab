# Das Feld ohne Namen

**11. September 2026, einundzwanzigste Runde.** Die Runde davor hat gefragt,
was ein Fremder mit dem Shop anstellen kann. Diese fragt das Gegenteil: was ein
Kunde mit ihm anfangen kann, der ihn nicht **sieht**.

## Die Messung

Zuerst die gebauten Seiten, und das Ergebnis ist gut:

| gemessen | Ergebnis |
|---|---|
| 82 Seiten mit `lang`-Angabe | 82 von 82 |
| 639 Schemazeichnungen mit Textalternative | 639 von 639 (`role="img"` + `aria-label`) |
| **712 Bedienelemente mit Beschriftung** | **712 von 712** |
| 47 externe Verweise mit `rel="noopener noreferrer"` | 47 von 47 |

Die Vorschlagsliste der Suche ist sogar vollständig als Kombinationsfeld
ausgezeichnet — `role="combobox"`, `aria-expanded`, `aria-activedescendant`,
`listbox` und `option`. Das hat jemand gekonnt gebaut.

Dann die Bedienelemente, die **erst im Browser entstehen**. Die Kasse zeichnet
fünf: das Bezirksfeld, drei Zahlwege und den Anfragetext. Vier davon tragen
eine Beschriftung.

> **Das einzige unbeschriftete Bedienelement des Shops war das, in dem die
> ganze Bestellung steht.**

Der Absatz darüber erklärt es — *„Diese Liste ist eine Anfrage, keine
Bestellung. Kopieren Sie sie in eine Mail…"* — aber ein Absatz über einem Feld
ist keine Beschriftung, sondern Nachbarschaft. Wer die Seite hört, kommt an ein
Textfeld ohne Namen und weiß nicht, dass darin seine Bestellung steht.

## Der zweite Teil: Auskünfte, die nur zu sehen sind

Im ganzen Shop — 82 gebaute Seiten und 1.200 Zeilen Oberfläche — war **kein
einziger Bereich als Meldung ausgewiesen**. Kein `aria-live`, kein
`role="status"`, kein `role="alert"`.

Betroffen sind fünf Auskünfte, und alle fünf sagen etwas über den **eigenen
Vorgang** des Kunden:

| Meldung | wann |
|---|---|
| „Kopiert." / „Kopieren ging nicht — der Text ist markiert…" | nach dem Kopierknopf |
| „Wir liefern nach Perg." / „Außerhalb des Liefergebiets." | nach der Bezirkswahl |
| „Es fehlt noch: …", „Wird abgeschickt …", „Angekommen" | beim Abschicken |
| „Der Warenkorb kann in diesem Browser nicht gespeichert werden" | beim Einlegen |
| „10× im Warenkorb" | nach dem Legen-Knopf |

Vier davon haben jetzt eine Rolle. **Die fünfte ausdrücklich nicht:** Sie steht
auf dem Knopf, den der Kunde gerade gedrückt hat, und ein Knopf sagt seinen
neuen Namen beim nächsten Anfassen ohnehin. *Eine Ansage zu viel ist auch eine
Störung* — wer jede Änderung vorlesen lässt, macht die wichtigen unhörbar.

Die Unterscheidung zwischen den vieren ist nicht kosmetisch:

- **`role="status"`** für die drei Auskünfte — sie warten, bis der Vorleser
  fertig ist.
- **`role="alert"`** für das Speicherproblem — wer weiterlegt und beim nächsten
  Aufruf einen leeren Korb findet, hat die Auskunft zu spät.

Und eine Eigenart, die in den Code gehört und nicht in eine Erinnerung: Die
Bereiche werden **leer erzeugt und später gefüllt**. Ein Bereich, der erst mit
seinem Text entsteht, wird von manchen Vorleseprogrammen nicht angesagt. Der
Bestand machte es schon richtig — jetzt steht auch der Grund dabei.

## Was ich nicht getan habe

**Keine Aussage über Rechtspflichten.** Der Europäische Rechtsakt zur
Barrierefreiheit gilt seit Juni 2025 für den elektronischen Geschäftsverkehr,
nimmt aber Kleinstunternehmen aus, und ob der Betrieb darunterfällt, steht mir
nicht zu. Was hier gemessen wurde, ist kein Rechtsbefund, sondern ein
Bedienbefund: *Ein Feld ohne Namen ist für den, der es hört, ein leeres Feld* —
unabhängig davon, wer es verlangt.

**Keine Kopfzeilen für den Server.** Beim Suchen ist aufgefallen, dass die
mitgelieferte `.htaccess` außer `ErrorDocument` nichts setzt — keine
Sicherheitskopfzeilen. Das lässt sich von hier aus **nicht prüfen**: Apache
liegt in dieser Umgebung nicht vor, und eine unbekannte Direktive beantwortet
Apache mit 500 für die ganze Seite. Eine ungeprüfte Zeile in die Datei zu
schreiben, die den Shop ausliefert, wäre der teuerste Weg, recht zu haben.
Notiert, nicht getan.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Shop-Szenarien im Browser | 61 | **63** |
| Gegenproben | 170 | **172** |
| Bedienelemente ohne Namen | 1 | **0** |
| Bereiche mit Meldungsrolle | 0 | **4** |

`npm run shopprobe` (63 Szenarien, 0 fehlgeschlagen), `npm run
oberflaechenprobe` (11 Szenarien), `npm test` grün, `npm run pruefe-oberflaeche`
(30 Sätze).
