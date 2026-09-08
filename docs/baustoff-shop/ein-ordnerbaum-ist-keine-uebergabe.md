# Ein Ordnerbaum ist keine Übergabe

**8. September 2026.** Der oberste offene Punkt lautet seit Wochen unverändert:

> *„`ausgabe/site/` auf bauversand.com hochladen — ohne erreichbare Seite kein
> Klick, keine Auffindbarkeit, keine Anfrage."*

Hochladen kann nur der Auftraggeber; der Netzausgang dieser Umgebung ist
gesperrt. Was er dafür bekam, waren **87 Dateien in fünf Ordnern** und der Satz
„lade das hoch".

> **Ein Ergebnis, das nur als Ordnerbaum vorliegt, ist noch nicht übergeben.**

Wer das per FTP hantiert, vergisst einen Unterordner — und dann liegt die
halbe Seite ohne `shop.js` da, also ohne Suche, ohne Warenkorb, ohne Kasse.

---

## `npm run paket`

Ein ZIP mit 89 Einträgen: die 87 gebauten Dateien unter `site/`, dazu

- **`ABNAHME.txt`** — die acht Punkte, an denen sich nach dem Hochladen zeigt,
  ob wirklich ausgeliefert wird. Sie werden aus **denselben Dateien**
  abgeleitet, die gerade eingepackt werden: Eine Liste, die neben dem Paket
  liegt, beschreibt beim zweiten Hochladen ein anderes.
- **`INHALT.txt`** — jede Datei mit SHA-256 und Größe. Damit lässt sich nach
  dem Upload feststellen, ob angekommen ist, was abgeschickt wurde.

Das Werkzeug weigert sich über einem veralteten Erzeugnis. Ein Paket aus einem
alten Bau wäre die schlimmste Sorte: Es sieht vollständig aus, liegt auf dem
Server, und niemand sieht ihm an, dass es von gestern ist.

**Ohne fremde Bibliothek.** Das Archiv entsteht in `src/paket.js` — Methode 0,
ungepackt: je Datei ein lokaler Kopf, am Ende ein Verzeichnis und ein
Schlussblock. Der Ordner ist 3,3 MB; ein Archiv, das jedes Programm öffnet, ist
mehr wert als eines, das kleiner ist.

---

## Geprüft wird gegen ein fremdes Programm

Ein selbstgeschriebenes Archivformat, das nur die eigene Umsetzung öffnet, ist
keines. Der Testfall packt deshalb mit **`unzip`** aus und vergleicht den
Inhalt — nicht mit dem eigenen Leser, den es gar nicht gibt.

Die Gegenprobe lässt die Schlussverknüpfung der Prüfsumme weg
(`c ^ 0xffffffff`). Das Archiv sieht danach unverändert aus, unsere eigenen
Zahlen bleiben in sich stimmig — und `unzip -t` weist es zurück. Genau dafür
steht die fremde Instanz im Test.

---

## Was das Verzeichnis dazu beigetragen hat

Drei Register haben den neuen Code angehalten, bevor er lief:

**`pruefe-erzeugnis`:** ein Werkzeug, das `ausgabe/` anfasst und in keinem
Leserregister steht. Eingetragen, mit der Weigerung über veraltetem Stand.

**`aussentexte`:** `baueZip` passt auf das Namensmuster der Ausgänge und musste
sich erklären. Es *ist* einer, und ein ungewöhnlicher: Er geht zuerst an den
Auftraggeber und danach, ausgepackt, an jeden Besucher — **das Archiv ist die
Website.**

Daraus folgte die dritte Prüfung, im Fremdtextverzeichnis: Das ZIP-Format
speichert Pfade als Text, und die meisten Auspackprogramme folgen ihm. Ein
Eintrag `../../etc/etwas` landet außerhalb des Ordners, in den ausgepackt
wurde — bei einem Archiv, das in ein **Webverzeichnis** geht, die eine Stelle,
an der das teuer wäre. `baueZip` weist absolute Pfade, `..`-Segmente und
Steuerzeichen im Namen jetzt ab.

**`wegwerf`:** Der neue Testfall legte sich mit `mkdtempSync` selbst ein
Verzeichnis an — die Regel dagegen gibt es, seit ein Gesamtlauf an 63.082
Einträgen unter `/tmp` scheiterte. Er nimmt jetzt `wegwerfordner`, das auch
bei `process.exit` aufräumt.

---

## Was es nicht tut

**Hochladen.** Der Netzausgang ist gesperrt, und ein Upload wäre eine Handlung
nach außen. Das Archiv liegt unter `ausgabe/` und ist **nicht im Verzeichnis
eingetragen**: Es enthält Byte für Byte, was unter `ausgabe/site/` ohnehin
dort steht, wiegt 3,3 MB je Bau und ist in Sekunden neu gebaut.
