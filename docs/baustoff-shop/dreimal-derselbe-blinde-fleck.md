# Dreimal derselbe blinde Fleck an einem Tag

**14. September 2026, abends.** Am Vormittag hat die Zählung der Regelnamen
85 Stellen gefunden, deren Name in keinem Testfall vorkommt. Achtzehn sind
damals geschlossen worden, und der größte Block war
`papierschrittbefund()` in `src/vorgangsstand.js`: elf Regeln, die vier
Register der Akte gegeneinander halten — und **nicht erreichbar**, weil die
Funktion ihre Register unmittelbar aus dem Modul las und keinen Parameter nahm.

Diese Runde hat elf weitere Stellen geschlossen. Zwei davon standen in
Funktionen mit **genau demselben Bau**:

| Funktion | Register | Regeln, die niemand sehen konnte |
|---|---|---|
| `papierschrittbefund()` (Vormittag) | `ARTEN`, `PAPIERSCHRITT`, `SCHRITTE`, `ABZWEIGE`, … | 11 |
| `nummernbefund()` (`src/ablage.js`) | `ARTEN`, `NUMMERNHERKUNFT` | 2 |
| `stempelbefund()` (`src/quellenstempel.js`) | `QUELLENSTEMPEL` | 3 |

> **Wer dreimal am selben Tag dieselbe Bauart findet, hat keine drei Funde,
> sondern eine Gewohnheit gefunden.**

Die Gewohnheit ist verständlich: Ein Befund, der ein hausinternes Register
gegen den Bestand hält, *braucht* keinen Parameter — das Register steht ja
daneben und ist `Object.freeze`. Genau deshalb ist er aber auch nie rot zu
sehen. Er ist grün, weil nichts kaputt ist, und er wäre grün, wenn er kaputt
wäre.

## Was jetzt geprüft ist

Elf Regelstellen mehr sind gesehen worden, verteilt auf drei Module:

* **`src/systemtreue.js`** (4) — ein Artikel, der als „schichtlos" geführt ist
  und doch eine Schicht trifft; einer, der als „System unbekannt" geführt ist
  und gar keine Schicht mehr ist; ein Gewerk ohne Artikel; ein Gewerk, das
  sich auf einen verschwundenen Artikel beruft. Alle vier greifen erst, wenn
  sich der **Katalog** ändert — und ein Kamin wird über die Systemzulassung
  abgenommen.
* **`src/ablage.js`** (3) — eine Art mit unbekannter Nummernherkunft; eine
  Art, die eine Nummer zieht und kein Blatt hat (§ 131 Abs 1 Z 2 BAO verlangt
  die lückenlose Folge: eine vergebene Nummer ohne Beleg ist für immer eine
  Lücke, die niemand erklären kann); eine Nummer, die ihren Vorgang nicht
  nennt.
* **`src/quellenstempel.js`** (4) — ein Registereintrag, der auf keiner
  gebauten Seite mehr steht; eine Fundstelle ohne Datum; ein Stand, wo keiner
  erwartet wird; ein Eintrag ohne die Tatsache, die er belegen soll.

Die Sperrklinke `UNGESEHENE_HOECHSTENS` steht damit auf **56** von 486
Stellen — 80 → 67 → 56 an einem Tag.

## Zwei Messungen, die nichts zu tun gaben

**Der Preis des Lesers je Testrumpf** war der offene Punkt der Runde davor.
Gemessen: 2 594 Testrümpfe, **514 ms**, 2 767 Zerlegungen bei 2 473 Treffern.
Die Zahl der Zerlegungen ist damit genau die Summe aus Testrümpfen (jeder
einmalig, also unvermeidlich) und Testdateien — **optimal**. Der Punkt ist
geschlossen, ohne dass etwas zu ändern war.

**Der Bau ist deterministisch.** Zweimal `npm run website`, `npm run build`
und `npm run kampagne` hintereinander ergeben Byte für Byte dieselben Dateien.
Das ist die stillschweigende Annahme unter jeder Frischeprüfung und unter
jeder Gegenprobe, die baut — und sie stand nirgends gemessen da.

## Und was der Katalog hergibt

Zur Sicherheit noch einmal nachgesehen, ob auf der **Produktseite** etwas zu
tun ist, bevor diese Runde wieder in die Apparatur geht:

* `preise/baustoff-preise.json` führt 46 Preise, der Katalog 46 Artikel — aus
  den fünfzehn Lieferantenrechnungen ist nichts mehr herauszuholen.
* Die Weisung „mindestens 100 Artikel" ist seit dem 28. August vorbereitet:
  127 Artikel des Sortiments stehen im Konditionenblatt des Lagerhauses
  Eferding mit Artikelnummer, Einheit und Gebinde — **und keiner mit einem
  Preis.**
* Jedes Katalogfeld ist vollständig bis auf `gewichtKg` (7 von 46, bekannt)
  und `gtin` (0 von 46, offener Punkt beim Auftraggeber).

> **28 offene Punkte, und keiner davon gehört mir.**

## Stand

* 55 Prüfer grün, 2 607 Testfälle, **303** Gegenproben
* Regelstellen nie gesehen: 67 → **56** von 486
* Die neue Gegenprobe nimmt `nummernbefund()` sein Register wieder weg

## Was diese Runde nicht erreicht hat

56 Stellen bleiben. Neun davon liegen in `bin/kopfzeilenpruefung.mjs` und
messen an einem laufenden Apache — dort ist „nie gesehen" kein Versäumnis,
sondern der Preis dafür, dass die Probe eine echte Serverkonfiguration fährt.
Ob dieser Preis als Grund taugt, entscheidet ein Eintrag in `REGEL_GEPRUEFT`,
den es noch nicht gibt; solange er fehlt, zählen sie mit.

Und die Bauart selbst ist nicht gemessen: Wie viele Befunde dieses Hauses
lesen ihr Register noch unmittelbar aus dem Modul? Drei sind gefunden, indem
ihre Regeln als ungesehen auffielen. Gefunden hat sie kein Prüfer, sondern
ein Umweg — und das ist genau der Grund, warum die Zählung der Regelnamen
überhaupt gebaut wurde.
