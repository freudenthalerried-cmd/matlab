# Sieben Jahre, und niemand sagte wo

**9. September 2026, abends.** `src/ablage.js` legt jede eingehende Bestellung
auf dem Hosting ab. Im Kopf der Datei steht seit ihrem ersten Bau am
4. September:

> § 132 BAO verlangt sieben Jahre Aufbewahrung.

Und weiter unten, warum jede Datei einmal geschrieben und nie wieder angefasst
wird: § 131 BAO verlangt, dass der ursprüngliche Inhalt feststellbar bleibt.

**Das Modul wusste es. Auf keiner Liste stand es.**

Die Bereitschaftsliste (`npm run startklar`) führte elf Punkte — Bestellweg,
Bankverbindung, Impressum, Antwortzeit, zwei Preispunkte, Lieferzeit,
Zahlungsanbieter, Rechtstexte, Domain, Repository. Keiner davon war die
Ablage. Der
Rolloutplan (`npm run rollout`) führte sechzehn Etappen bis zur Entscheidung
über die Kaufquote. Keine davon war die Sicherung.

> **Der Shop war darauf ausgelegt, Aufzeichnungen sieben Jahre zu halten, und
> niemand hatte gesagt, wo sie so lange liegen.**

---

## Warum es keine Sorge um verlorene Daten ist

Ein verlorener Bestelldatensatz kostet einen Kunden. Das ist ärgerlich und
wäre kein Befund für dieses Verzeichnis.

Der Punkt ist ein anderer: `ablage/` steht in `.gitignore`, und zwar zu Recht —
die Vorgänge tragen Namen, Anschriften und Beträge, und dieses Repository ist
öffentlich. Dieselbe Entscheidung, die sie richtigerweise draußen hält, lässt
sie in **einer** Kopie liegen, auf einem Webhosting.

**Das ist Wort für Wort der Fall der Preisdatei** — dieselbe `.gitignore`,
dieselbe eine Kopie, derselbe Grund. Nur ist die Preisdatei einen Tag später
wieder da, weil es einen Rettungsweg gibt; ein fehlender Beleg aus dem
Vorjahr ist nicht rekonstruierbar, und die Behörde fragt nicht, ob es
unangenehm war.

Und: **Die Pflicht beginnt mit dem ersten Datensatz.** Nicht mit dem
hundertsten, nicht mit dem ersten Gewinn. Am ersten Tag ist nichts zu
verlieren — genau deshalb fällt es an dem Tag niemandem auf.

---

## Was gebaut wurde

**Zwölfter Punkt der Bereitschaftsliste.** `ablagesicherung`, gebaut mit
demselben Muster wie „Repository ist privat": unbeantwortet ein Fragezeichen,
kein stilles Grün.

```
Die Ablage der Vorgänge ist gesichert
    von hier aus nicht feststellbar — § 132 BAO verlangt sieben Jahre,
    und die Ablage liegt auf dem Hosting des Auftraggebers   [Auftraggeber]
```

Er hält den Shop nicht auf: `unpruefbar` heißt nicht `offen`. Aber
„startklar" heißt in diesem Werkzeug seit jeher **nichts offen und nichts
ungeprüft** — ein Punkt, den niemand bestätigt hat, zählt nicht als erfüllt.
Die Liste liest sich seither: *2 erfüllt, 7 offen, 3 von hier aus nicht
feststellbar.*

**Siebzehnte Etappe des Rolloutplans.** `ablagesicherung`, ein Tag, `art:
'gesetzt'` — keine gerechnete Dauer, sondern eine Frist aus dem Gesetz. Kein
Gate: § 132 BAO lässt nichts zu entscheiden.

Sie hängt an `bestellweg`, und das ist keine Formalie:

> Vorher gibt es nichts zu sichern. Die Ablage bleibt leer, solange der
> Bestellweg ausgeschaltet ist — sie vorher einzurichten hieße, eine leere
> Datei zu sichern und sich für vorbereitet zu halten.

---

## Die Verbindung hat beim ersten echten Anlass gehalten

Der Punkt war eingetragen, die Etappe noch nicht. Der nächste Lauf:

```
$ npm run rollout
punkt-ohne-eintrag: ablagesicherung
```

**Das ist der Prüfer aus der Runde vom 4. September**, entstanden aus genau
diesem Riss: Damals bekam `startklar()` abends die Bankverbindung als Punkt,
und der Rolloutplan — das Papier, das der Auftraggeber vor der Budgetfreigabe
liest — erfuhr nichts davon. Seither hält `planbefund` beide Listen
gegeneinander, in beiden Richtungen.

Heute hat er **meinen eigenen Zusatz** gemeldet, bevor er ungeplant
mitfahren konnte. Zwei Listen für dieselbe Sache sind eine Liste, die niemand
pflegt — es sei denn, ein Werkzeug hält sie zusammen.

---

## Und die Beschreibung, die der Auftraggeber liest

`docs/baustoff-shop/pr-beschreibung.md` trug „16 Etappen". Nachgezogen auf
17, mit dem Satz zur siebzehnten und einem neuen Punkt unter „Was fehlt".

Danach meldete `npm run pruefe-schaufenster` genau eine Sache:

```
✗ veroeffentlichung-steht-aus
```

**Die Regel aus der Runde davor, beim ersten echten Anlass.** Sie ist am
Nachmittag entstanden, weil die veröffentlichte Beschreibung dreimal
hinterherhinkte, und sie hat mich beim allerersten Mal danach erwischt: Die
Quelle war nachgezogen, GitHub nicht. Beschreibung mit `npm run --silent
pr-text` neu gesetzt, Fingerabdruck in `pr-veroeffentlicht.json` nachgeführt.

*Ein Handgriff ohne Werkzeug unterbleibt* — vier Runden lang bewiesen, einmal
mit Werkzeug widerlegt.

---

## Der Punkt war eingetragen, und die Startseite sagte weiter Nein

Der Testlauf danach war rot, und zwar an einer Stelle, an der ich nichts
angefasst hatte:

```
Startseite und llms.txt sagen aus den Daten, ob bestellt werden kann
  The input did not match /Bestellen ist möglich/
  '- **Bestellen ist noch nicht möglich.** …'
```

**Vier Werkzeuge rufen `startklar()`, drei bauen ihre Lage von Hand aus
derselben Betreiberdatei zusammen** — `bin/startklar.mjs`,
`bin/offenepunkte.mjs` und `bin/website.mjs`. Nachgetragen hatte ich das neue
Feld in **einem** der drei. In den anderen beiden fiel es auf `null` zurück.

> **`?? null` sieht genau aus wie „unbeantwortet".** Ein Feld, das ein
> Werkzeug nicht liest, ist von einem Feld, das der Auftraggeber nicht
> beantwortet hat, im Ergebnis nicht zu unterscheiden.

Die Folge wäre nicht rot gewesen, sondern still: Startseite und `llms.txt`
hätten „Bestellen ist noch nicht möglich" aus einem Grund stehen gelassen,
den die Betreiberdatei längst beantwortet. Gefunden hat es eine Probe, die
seit dem 3. September genau darauf besteht, dass diese Auskunft **kippt** —
nicht dass sie stimmt.

**Behoben an der Ursache, nicht an drei Stellen:** `betreiberangaben()` in
`src/startklar.js` bildet die Betreiberdatei einmal ab, alle drei Werkzeuge
spreizen sie. Ein Testfall hält das fest — er verlangt den Aufruf in allen
drei Dateien und weist jedes handgeschriebene `betreiber.<feld> ??` zurück.
Gegengeprobt: eine Stelle zurückgedreht → rot.

*Dieselbe Abbildung dreimal geschrieben ist eine Abbildung, die niemand
pflegt.*

---

## Zwei Dinge, die beim Nachziehen auffielen

**Der Prüfer schickte in die Falle, vor der er warnt.** Seine Meldung sagte
*„Mit `npm run pr-text` neu setzen"* — und `npm run` schreibt zwei eigene
Zeilen auf dieselbe Ausgabe:

```
> pr-text
> node bin/prtext.mjs

Machbarkeitsanalyse, Shop und Website …
```

Wer der Anweisung wörtlich folgt und die Ausgabe kopiert, veröffentlicht eine
Beschreibung, die mit `> pr-text` beginnt. Aufgefallen ist es, weil mein
eigener Fingerabdruck aus der verschmutzten Ausgabe stammte: Er stimmte mit
sich selbst überein und mit nichts sonst — der Prüfer blieb rot, obwohl beide
Zahlen gleich aussahen. Der Kopfkommentar des Werkzeugs nennt seit jeher die
richtige Form (`npm run --silent pr-text`); die Meldung, die man im Moment des
Fehlers liest, nannte sie nicht.

> **Eine Anweisung, die nur im Kopf der Datei richtig steht, gilt für den, der
> die Datei liest — nicht für den, der die Meldung bekommt.**

Nachgezogen an beiden Stellen, an denen die Anweisung wirkt: in der Meldung
und im Feld `werkzeug` des Vermerks.

**Und die Regel hatte keine Gegenprobe.** Sie ist gestern Nachmittag
entstanden und nicht ins Gegenprobenregister gekommen — kein Prüfer erzwingt
das, also fiel es nicht auf. Nachgetragen als
`veroeffentlichung-haengt-hinterher`: Sie hängt an den veröffentlichten Text
**ein einziges Leerzeichen** an, unsichtbar für jeden Leser, und verlangt, dass
der Fingerabdruck es merkt. Sie schlägt an (91 s). **129 Gegenproben.**

---

## Was das nicht löst

Der Punkt sagt, dass die Frage offen ist. Er sichert nichts. Ob All-Inkl die
Ablage in seine eigene Sicherung nimmt, ist von hier aus nicht feststellbar,
und ein Prüfer, der es behauptete, wäre eine Behauptung mit Ziffern.

**Beim Auftraggeber liegt damit ein Punkt mehr:** die Sicherung der
Vorgangsablage einrichten oder beim Hoster bestätigen lassen, bevor der
Bestellweg eingeschaltet wird. Kosten entstehen dabei nach heutigem Stand
keine — es ist eine Einstellung, kein Einkauf.

**6 neue Testfälle** — zwei an der Bereitschaftsliste (unbeantwortet ein
Fragezeichen, ausdrücklich verneint ein offener Punkt), zwei am Plan (die
Etappe gibt es, und sie hängt am Bestellweg), zwei an der einen Abbildung.
Dazu vier bestehende Proben nachgezogen: Ihr vollständig beantworteter
Betreiberdatensatz kannte das neue Feld nicht und hätte sonst gemeldet, der
Shop sei nicht startklar — aus dem richtigen Grund, aber am falschen Ort.
