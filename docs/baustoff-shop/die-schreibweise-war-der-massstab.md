# Die Schreibweise war der Maßstab

**13. September 2026, dritte Runde des Tages.**

## Der Anlass

Die Runde davor hat die Vorschlagsmessung gebaut: Sie misst jede benannte Zahl
gegen den Bestand und fragt, wie viele andere Dateien denselben Wert tragen.
Damit war entschieden, *womit* das Zwillingsregister verglichen wird — nicht
mehr, was jemandem zufällig aufgefallen ist.

Sie las `export const NAME = 0.25;`.

Gemessen über denselben Bestand:

| Schreibweise | Zahlen |
|---|---|
| `export const NAME = …` | **59** |
| `feldname: …` in einem Objekt | **218** |

> **Eine Messung, die nur eine Schreibweise liest, misst nicht den Bestand,
> sondern die Schreibweise.**

Beweisen lässt sich das am Register selbst. Sein dritter Eintrag heißt
`ANNAHMEN.umsatzProSession` und steht als `basis: 0.02` in einem Objekt. **Die
Messung, die Zwillinge vorschlagen soll, hätte ihren eigenen Eintrag nicht
gefunden.**

## Was die Ausdehnung fand

34 Zahlen im engen Band statt 13. Drei davon echt.

### Die Kennzahl schrieb die Grenze ab — und nannte die Quelle dabei

`src/kennzahlen.js`:

```js
schwelle: 0.23,
richtung: 'hoechstens',
herkunft: 'Tragfähigkeitsgrenze bei 25 % Rohmarge — empfindlichkeit.js',
```

Die Herkunftsnotiz **eine Zeile darunter** nennt die Datei, aus der die Zahl
stammt. Dort steht sie als `grenze: 0.23` in der Annahme `werbeanteil`, mit
einem Absatz, der sie begründet.

Das ist wortwörtlich der Fall, für den das Register am 11. September gebaut
wurde:

> **Die Gleichheit stand in einem Satz und nicht in einem Aufruf.**

`annahmewert()` gab bis heute nur das Feld `basis` heraus. Wer die **Grenze**
brauchte, musste sie abschreiben.

> **Ein Leseweg, der nur ein Feld herausgibt, macht aus jedem anderen Feld eine
> Abschrift.**

### Der Marktpreis hatte seine Heimat in einem Werkzeug

`src/kennzahlen.js` und `src/leitzahlen.js` riefen beide:

```js
quoteAmMarktboden({ …, marktUnten: 0.5 })
```

Dieselbe Zahl, zwei Module, beide im Rechenkern. Eine Heimat gab es — in
`bin/kampagne.mjs`:

```js
export const MARKT_CPC = { unten: 0.5, oben: 2.5 };
```

> **Ein Haus, dessen Heimat in einem Werkzeug liegt, hat keine Heimat — der
> Kern darf das Werkzeug nicht lesen.**

`MARKT_CPC` steht jetzt in `src/werbewirkung.js`, wo die Rechnung steht, die es
braucht, und wo der Dateikopf die Spanne ohnehin ausschreibt („Der Markt kostet
0,50 bis 2,50 € je Klick"). Beide Aufrufer lassen das Argument weg;
`bin/kampagne.mjs` und `bin/werbeprobe.mjs` lesen es.

**Nebenbei aufgefallen:** In `quoteAmMarktboden` standen zwei `0.5` — der
Marktpreis und der Stützpunkt, an dem die lineare Beziehung ausgewertet wird.
Fünfzig Cent und fünfzig Prozent. Welche welche war, ließ sich nur am Namen des
Arguments ablesen; der Stützpunkt heißt jetzt `STUETZQUOTE`.

### Vier Zahlen standen zweimal, eine war gehalten

`data/zielgroessen.json` und `src/empfindlichkeit.js` führen dieselben vier
Annahmen. Die Schleife in `test/empfindlichkeit.test.js` lief seit jeher über
alle vier:

```js
for (const a of ANNAHMEN) {
  assert.equal(typeof LAGE[a.id], 'number', …);
}
```

Sie verglich den **Typ**. Am Vormittag bekam **eine** der vier einen
Wertvergleich — die Kaufquote, weil sie aufgefallen war. Der Satz dazu steht
zehn Zeilen weiter unten in derselben Datei:

> *„Eine Notiz, die sagt ‚dieselbe Größe', ist keine Prüfung, dass es dieselbe
> Zahl ist."*

Er galt ab da für eine Annahme. `rohmarge` war mittelbar über `ZIELMARGE`
gehalten; `werbeanteil` und `warenkorbNetto` waren es gar nicht.

> **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle — auch
> dann, wenn die Schleife über alle daneben steht.**

Heute stimmen alle vier. Der Fehler war latent, nicht wirksam. Die Schleife
vergleicht jetzt den Wert; das ist eine Zeile an der Stelle, an der die
Berichtigung vom Vormittag hätte stehen sollen.

## Was die Messung lernen musste

**Gate-Nummern sind keine Größen.** Von den 34 Kandidaten waren **elf** `gate:`
— die laufenden Nummern 19 bis 39. Sie stehen in jeder Datei, die das Gate
erwähnt, kollidieren mit jedem Schwellenwert im selben Zahlenbereich und haben
gar keine Heimat, die man lesen könnte.

> **Eine fortlaufende Nummer ist kein Zwilling, sondern ein Name aus Ziffern.**

**Ein Haken gilt für eine Zahl, nicht für einen Feldnamen.** Solange die
Messung nur Ausfuhren las, war der Name eindeutig. Objektfelder heißen `basis`,
`wert`, `mindestens` — in `src/empfindlichkeit.js` tragen drei Annahmen ein
Feld `basis` mit drei verschiedenen Zahlen. Der Schlüssel ist jetzt Name **und**
Wert.

**Der Prüfer wurde zu langsam.** 218 Kandidaten × 247 Dateien: 1,5 s, über der
Sekunde aus Gate 38. Er suchte je Kandidat in jeder Datei neu. Gesammelt wird
jetzt einmal je Datei, welche Zahlen darin vorkommen — **1,5 s auf 0,2 s**. Die
zweite Lesart (`zahlenIn`) wird gegen die erste (`traegtZahl`) gehalten, in
beide Richtungen; zwei Lesarten derselben Sache sind zwei Lesarten.

## Die offene Frage der Vorrunde, geschlossen

`bin/wegprobe.mjs` tippte `999` ins Mengenfeld. Der Block wandert als
Zeichenkette in eine HTML-Datei, und der Dateikopf warnt: *keine Backslashes,
keine Backticks.* Die Schablone ist aber ein Template-Literal, also setzt Node
die Konstante schon beim Bauen ein — die Probe liest sie jetzt.

**Dabei ist mir ein Fehler unterlaufen, der die Warnung ergänzt:** Mein erster
Kommentar über der Stelle erklärte die Einsetzung und enthielt dafür eine leere
Einsetzungsklammer. Sie machte die ganze Datei unlesbar. Der Kopf warnt vor
Backslashes und Backticks; er hätte auch vor der Klammer warnen müssen.

> **In einem Template-Literal ist auch ein Kommentar noch Text.**

Gefunden hat es `test/lesbarkeit.test.js` („jede Quelldatei dieses Hauses lässt
sich einlesen") — beim Versuch, eine Gegenprobe rot zu sehen, die aus einem
ganz anderen Grund rot war.

## Was geändert wurde

| Datei | was |
|---|---|
| `src/zwillingszahlen.js` | `benannteZahlen()` liest auch Objektfelder; `KENNUNGSFELDER`; `zahlenIn()`; Haken tragen Name **und** Wert; 14 neue Haken; ein neuer geführter Zwilling (650) |
| `src/kennzahlen.js` | liest `annahmewert('werbeanteil', 'grenze')`; gibt `marktUnten` nicht mehr mit |
| `src/leitzahlen.js` | gibt `marktUnten` nicht mehr mit |
| `src/empfindlichkeit.js` | `annahmewert(id, feld)` gibt jedes Zahlfeld heraus und wirft bei einem unbekannten |
| `src/werbewirkung.js` | `MARKT_CPC` als Heimat; `STUETZQUOTE` benannt; `marktUnten` hat einen Vorgabewert |
| `bin/kampagne.mjs` | liest `MARKT_CPC`, statt es zu führen |
| `bin/wegprobe.mjs` | setzt `HOECHSTMENGE` in die Schablone ein |
| `test/empfindlichkeit.test.js` | die Schleife vergleicht den Wert statt des Typs |
| `test/zwillingszahlen.test.js` | vier neue Testfälle |

Drei Gegenproben, jede rot gesehen:
`die-messung-liest-nur-eine-schreibweise` ·
`die-kennzahl-schreibt-die-grenze-wieder-ab` ·
`die-zielgroessen-werden-wieder-nur-auf-den-typ-geprueft`

## Der Faden dieser drei Runden

| Runde | was endete wo |
|---|---|
| 12.09. | die Suche am **Dateityp** — `data/` fehlte |
| 13.09. I | der Vergleich an der **Schreibweise** — `0.2` ≠ `0.20` |
| 13.09. II | die Auswahl an der **Aufmerksamkeit** — geführt war, was auffiel |
| 13.09. III | die Messung an der **Schreibweise**, eine Ebene höher — gelesen war, was wie eine Ausfuhr aussah |

Jede Runde hat das Werkzeug der vorigen erweitert, und jede hat dabei einen
Fehler gefunden, den die vorige eingebaut oder stehen gelassen hat. Das ist
kein Zeichen, dass die Arbeit schlecht war — es ist das, was Messen von
Meinen unterscheidet.

## Offen

Die Messung liest Ziffern und keine Einheiten. `aufkantungHoehe: 0.30` (dreißig
Zentimeter) und `haendlerrabattAufUvp: 0.3` (dreißig Prozent) sind für sie
dieselbe Zahl; von den 32 Kandidaten im Band sind 29 solche Zufälle. Jeder
trägt jetzt einen Satz, der sagt warum — aber die Liste wächst mit dem
Bestand, und ein Verzeichnis aus lauter Gründen für Nichtbefunde ist selbst
eine Last. Ob die Messung Einheiten lesen kann, ist eine Frage an die nächste
Runde.
