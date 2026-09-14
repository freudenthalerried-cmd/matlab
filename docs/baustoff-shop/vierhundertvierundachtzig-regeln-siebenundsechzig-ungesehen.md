# 484 Regeln, 67 hat nie jemand feuern sehen

**14. September 2026, abends.** Jeder Prüfer dieses Hauses meldet in derselben
Form: `{ regel, text }`. Die `regel` ist der Name des Befundes, und an ihm
hängt alles Weitere — der Gegenprobenlauf sucht ihn in der Ausgabe, ein
Testfall behauptet ihn, ein Dokument nennt ihn. Gezählt wurde er nie.

Gezählt ergibt: **484 Regelstellen, 418 Namen — und 85 Stellen, deren Name in
keinem einzigen Testfall vorkommt.**

Das ist kein Beweis, dass sie falsch sind. Es ist der Beweis, dass sie niemand
hat feuern sehen.

> **Eine Regel, die nie gefeuert hat, ist kein Prüfsatz, sondern ein Vorsatz.**
> Ob ihr Text stimmt, ob ihre Bedingung je zutrifft, ob sie den Fall trifft,
> für den sie geschrieben wurde — das alles ist offen, solange sie nur dasteht.

## Das Zählen war der erste Fund

„Hier entsteht eine Regel" steht in **drei** Schreibweisen:

| Schreibweise | Stellen | Beispiel |
|---|---|---|
| Feld | 400 | `meldungen.push({ regel: 'kopf-ohne-stand', … })` |
| örtlicher Melder | 67 | `melde('uhr-unbekannt', …)`, `sag('alles-fremd', …)` |
| Fallunterscheidung | 6 | `regel: leicht ? 'leicht-und-sperrgut' : 'schwer-und-frei'` |

Mein erster Zähler kannte nur die erste. Er meldete 347 Namen statt 412 — und
in der Gegenrichtung **zehn Namen, die ein Testfall behauptet und die es
angeblich nicht gibt.** Alle zehn gab es. Sie standen in der zweiten
Schreibweise.

> **Ein Verzeichnis, das eine von drei Schreibweisen kennt, meldet die anderen
> beiden als fehlend — und liest sich dabei wie ein Fund.**

Dieselbe Lehre wie am Nachmittag, als der Dublettenvergleich an der Gleichheit
von Zeichen endete, und wie am Mittag, als eine Schranke einen Fund um zwei
Zeichen verfehlte. Dreimal an einem Tag war das Werkzeug knapper als sein
Gegenstand.

Der örtliche Melder heißt in jeder Datei anders (`melde`, `sag`). Gefunden wird
er nicht am Namen, sondern daran, **was er tut**: eine Funktion, deren erster
Parameter `regel` heißt und die ein Objekt mit diesem Feld ablegt. Die zweite
Hälfte dieser Probe ist nicht schmückend: `frachtbetrag(regel, …)` in
`src/frachtsatz.js` nimmt eine **Frachtregel** entgegen. Ohne sie zählte das
Verzeichnis einen Preisrechner als Meldeweg.

## Elf Regeln, die keine Prüfung je erreichen konnte

Der größte einzelne Block der Ungesehenen stand in
`src/vorgangsstand.js:papierschrittbefund()` — elf Regeln, die die vier
Register der Akte gegeneinander halten: Hat jedes Papier einen Schritt? Zeigt
das Papierregister auf Arten, die es gibt? Nennt eine Voraussetzung eine Art
ohne Blatt?

Die Funktion nahm **keinen Parameter**. Sie las `ARTEN`, `PAPIERSCHRITT`,
`SCHRITTE`, `ABZWEIGE`, `VORAUSGESETZT` und `SCHLIESST_AUS` unmittelbar aus dem
Modul, und alle sechs sind `Object.freeze`.

> **Ein Prüfer, dessen Gegenstand unveränderlich neben ihm steht, kann nie
> jemand anschlagen sehen. Er ist grün, weil nichts kaputt ist — und er wäre
> grün, wenn er kaputt wäre.**

Die Register stehen jetzt als Vorgabewerte in der Signatur. Für jeden Aufrufer
ändert sich nichts, für einen Testfall alles: Fünf neue Testfälle sehen alle
elf Regeln anschlagen, ein sechster hält den Befund ohne Parameter gegen die
echten Register — sonst prüfte die Reihe nur ihre eigenen Attrappen.

## Was sich nicht zählen lässt

Zwei Regelnamen entstehen erst zur Laufzeit: `` `ohne-${name}` `` und
`` `${name}-doppelt` `` in `src/verweise.js`. Das ist richtig so — welche
Verweisart fehlt, ist die halbe Meldung —, aber es heißt, dass kein Verzeichnis
sie kennen kann. Sie stehen in `GEBAUT_GEPRUEFT` mit Grund:

> **Ein Name, den kein Verzeichnis kennt, ist kein Fehler, solange jemand
> weiß, dass es ihn gibt.**

## Die gefährlichere Hälfte

Der Prüfer geht **beide** Richtungen. Die zweite ist die unangenehmere: Ein
Testfall behauptet einen Regelnamen, den keine Quelle mehr trägt. Er ist dann
grün, weil er nichts mehr prüfen kann.

> **Ein fehlender Prüfsatz meldet sich. Ein toter nicht.**

Heute steht dort nichts Offenes — die zehn Verdächtigen des ersten Zählers
waren sein eigener Fehler. Geblieben sind sechs Namen, die die Prüfreihe dieses
Verzeichnisses selbst **erfindet**, weil sie einen Befund gegen eigene
Attrappen fährt. Sie stehen in `ERFUNDEN_GEPRUEFT`, geführt mit Datei **und**
Liste: Ein siebter erfundener Name in derselben Datei fällt weiter auf.

## Der Stand und die Sperrklinke

| | |
|---|---|
| Regelstellen | 484 |
| Regelnamen | 418 |
| nie gesehen, vor dieser Runde | 85 |
| **nie gesehen, danach** | **67** |
| zur Laufzeit gebaut | 2, beide begründet |

Geschlossen wurden 18: elf in `src/vorgangsstand.js`, fünf im neuen
Verzeichnis selbst, zwei im Gestaltregister vom Nachmittag. Die Sperrklinke
`UNGESEHENE_HOECHSTENS` steht auf 67 und darf nur fallen.

Dass die eigenen fünf darunter sind, ist kein Zufall: **Ein Prüfer, der andere
daran misst, ob man sie feuern sah, ist der letzte, der sich davon ausnehmen
darf.**

## Was nebenbei auffiel und diese Runde nicht mehr ist

Der Schnelllauf meldete `pruefe-saetze` mit 1,4 s über der Sekunde aus Gate 38
— zweimal gemessen, beide Male darüber. Nachgemessen, wo die Zeit steckt:

| Muster | Zeit | Treffer |
|---|---|---|
| Blockkommentare | 3 ms | 2 050 |
| Zeilenkommentare | 3 ms | 3 967 |
| **Zeichenketten** | **1 088 ms** | 18 146 |

99 % in einem einzigen Muster: `(['"`])((?:\\.|(?!\1)[\s\S])*)\1`. Die
Alternative aus verneinten Zeichenklassen braucht **9 ms** — 120-mal schneller.

Sie ist aber **keine reine Beschleunigung**: Sie findet 24 636 statt 18 146
Zeichenketten. Der Grund ist der Rückverfolger im alten Muster — er lässt eine
einfach begrenzte Zeichenkette über Zeilenumbrüche laufen, was Javascript nicht
tut. Das alte Muster liest also nicht nur langsam, sondern **anders**, und
Gelesenes ist hier der Gegenstand eines Registers mit fünfzehn begründeten
Einträgen.

> **Eine Änderung, die ein Werkzeug schneller *und* anders lesen lässt, ist
> zwei Änderungen. Wer sie als eine einbringt, kann hinterher nicht sagen,
> welche der beiden die Zahlen verschoben hat.**

Das ist die nächste Runde, nicht diese.

## Was diese Runde nicht erreicht hat

67 Stellen bleiben ungesehen, verteilt auf 33 Dateien. Der Prüfer nennt sie
beim Namen, sortiert nach Datei; die größten Blöcke sind
`bin/kopfzeilenpruefung.mjs` (9), `src/systemtreue.js` (4),
`src/quellenstempel.js` (4) und `bin/paketpruefung.mjs` (4). Vier davon messen
an einem laufenden Apache — dort ist „nie gesehen" keine Nachlässigkeit,
sondern der Preis dafür, dass die Probe eine echte Serverkonfiguration fährt.
Ob dieser Preis ein Grund ist, entscheidet der Eintrag in `REGEL_GEPRUEFT`, den
es noch nicht gibt.
