# Acht von sechsundvierzig Namen

**13./14. September 2026, fünfte Runde.**

## Die Frage, mit Bedingung

Die Runde davor hat beziffert: **21 von 46** maschinenlesbaren Beschreibungen
sagen über die Ware selbst nichts. Der naheliegende Ausweg liegt sichtbar da —
in den Bezeichnungen stehen Maße: „750 ml", „100 m2", „133cm", „48 mm x 50 m".
Ein Leser darüber, und jede Beschreibung trüge eine Eigenschaft.

Der Ausweg wurde nicht genommen, mit einer Bedingung:

> *Wer es dennoch tut, misst zuerst, wie viele der 46 Namen **eindeutig** sind —
> und nicht, wie viele sich irgendwie lesen lassen.*

Diese Runde ist diese Messung. **Sie baut keinen Leser für den Betrieb.**
`src/bezeichnungsmass.js` wird an keiner Kundenseite, in keinem Feed und in
keiner Beschreibung aufgerufen; es beantwortet eine Frage.

## Das Ergebnis

| | Artikel |
|---|---|
| Namen ohne jedes Maß | **12** |
| Namen mit mehreren Zahlen oder mehrdeutigen | **26** |
| **eindeutig lesbar** | **8 von 46 — 17 %** |

Und die Zahl, auf die es ankommt. Von den acht lesbaren nennen **fünf ihr Maß
schon**: `packungsgewichtKg` liest die Kilogramm, und „Kleinste Abgabemenge
25 kg" steht längst in ihrer Beschreibung. Übrig bleiben drei — dreimal Soudal,
750 ml.

> **Ein Leser über die Namen senkte die 21 auf 18.**

Er wäre für 8 von 46 richtig, für 2 still falsch und für 36 stumm oder
unvollständig.

> **Ein Werkzeug, das in 17 von 100 Fällen recht hat, ist keine Datenquelle.**

## Warum die anderen 38 nicht lesbar sind

Drei Bauarten, jede mit einem Beleg aus dem Bestand.

### Mehrere Maße ohne Rolle

```
Schachtring 800 300 80 mm
```

Durchmesser, Höhe, Wandstärke — drei Zahlen, eine Einheit am Ende. Der naive
Leser nimmt die letzte und wirft zwei weg. `Isover TDPT 20 1200 600 mm 8,64 m2`
ebenso: 20 mm dick, 1200 × 600 groß, 8,64 m² je Paket — gelesen wird `600 mm`.

### Eine Typenbezeichnung, die wie ein Maß aussieht

```
Capatect Klebe- und Spachtelmasse 186 M 25 kg
```

Das `186 M` ist die Produktkennung des Herstellers. Der Leser liest **186
Meter** und hängt sie an einen Sack Klebemörtel.

> **Ein Leser, der ein Maß findet, wo eine Kennung steht, erfindet eine
> Eigenschaft — und zwar eine, die plausibel aussieht.**

Das ist der teuerste der drei Fälle, weil er nicht schweigt und nicht
offensichtlich falsch ist.

### Zwei Zahlen unter einer Einheit — der Fund innerhalb der Messung

```
Baumit TextilglasGitter 1,1x50 m
Rahmenschraube Zylinderkopf vz 7,5x182 mm lose
```

Beide standen im **ersten Durchlauf dieser Messung** in der Spalte „eindeutig".
Der Leser fand genau ein Paar aus Zahl und Einheit — `50 m`, `182 mm` — und
zählte die andere Zahl gar nicht, weil vor ihr ein `x` steht und die Suche nach
nackten Zahlen einen Buchstaben davor ausschließt.

> **„Eindeutig" hieß: Der Leser findet genau eine Zahl. Es hieß nicht: Der Name
> trägt genau eine.**

Dieselbe Bauart wie der Befund der Vorrunde über die Beschreibungen — dort hieß
„eigen": steht in keinem Nachbarfeld, und nicht: sagt etwas über die Ware. Und
dieselbe wie am Vormittag beim Zwillingsregister. **Dreimal am selben Tag hat
eine Zusicherung etwas anderes zugesichert, als ihr Name sagt.**

Die x-Form wird jetzt eigens gelesen. Ohne sie meldete die Messung zehn statt
acht — und zwei davon wären falsch.

## Was daraus folgt und was nicht

**Kein Parser.** Die drei Artikel, die ein Leser brächte, sind dreimal dasselbe
Produkt in derselben Dose. Sie von Hand einzutragen wäre möglich; es hieße, ein
zweites Feld je Artikel anzulegen, das die Artikelliste des Lieferanten später
noch einmal füllt — und damit genau die zweite Fassung zu schaffen, gegen die
vier Runden dieses Tages gearbeitet haben.

**Die Zahlen bleiben messbar.** `GEMESSEN` in `src/bezeichnungsmass.js` hält
fest, worüber das Urteil gefällt wurde: 46 Artikel, 12 / 26 / 8. Wächst der
Katalog — der Auftraggeber hat mindestens hundert Artikel angeordnet —, meldet
der Prüfer es, statt still weiterzugelten.

> **Ein Urteil über einen Bestand, das den Bestand nicht kennt, wird mit dem
> Bestand alt.**

**Der offene Punkt trägt das Ergebnis.** Vier neue lebende Zahlen im Punkt
`artikelliste`, gegen `massbefund` und `beschreibungsbefund` gemessen — nicht
als Freibrief. `npm run pruefe-punkte` hält jetzt **14** Zahlen der Liste gegen
den Bestand, gestern waren es sieben.

## Nebenbei berichtigt

Beim Schreiben des offenen Punktes standen zuerst die Artikelnamen wörtlich
darin — mit ihren Zahlen. `pruefe-punkte` hat sechs davon gemeldet: *„Im Punkt
artikelliste steht die Zahl 800, die weder gemessen wird noch einen Grund hat."*
Zu Recht. Ein Name in Anführungszeichen ist zwar ein Zitat und keine Behauptung,
aber der Prüfer kann das nicht wissen, und ihm dafür einen Freibrief zu geben
hieße, jede künftige Zahl in Anführungszeichen mitzudecken. Die Beispiele stehen
jetzt in Worten.

Und `pruefe-schaufenster` hat die PR-Beschreibung eingefordert: Sie sagte **58
Prüfer**, gemessen sind seit diesem Lauf **59**. Nachgezogen und mit
`npm run veroeffentlichen` übertragen — zurückgelesen, 131.533 Zeichen, Zeichen
für Zeichen gleich.

## Was geändert wurde

| Datei | was |
|---|---|
| `src/bezeichnungsmass.js` | neu: `masseImNamen`, `lesbarkeit`, `massbefund`, `GEMESSEN` |
| `bin/massprobe.mjs` | neu: `npm run pruefe-masse` |
| `src/pruefregister.js` | der neue Prüfer im Register, 59 statt 58 |
| `src/punktezahlen.js` · `bin/punktepruefung.mjs` | vier neue lebende Zahlen |
| `src/offenepunkte.js` | das Ergebnis im Punkt `artikelliste`, Beispiele ohne Ziffern |
| `test/bezeichnungsmass.test.js` | sieben Testfälle, darunter der Katalog gegen `GEMESSEN` |
| `docs/baustoff-shop/pr-beschreibung.md` | 59 Prüfer, veröffentlicht und zurückgelesen |

Eine Gegenprobe, rot gesehen: `die-x-form-zaehlt-wieder-als-ein-mass`.

## Offen

Unverändert: Was die 21 senkt, ist eine Eigenschaft je Artikel aus einer
belegten Quelle — die Artikelliste des Lieferanten oder die Merkblätter der
Hersteller. Beides freigabepflichtig.

Diese Runde hat die Frage nicht beantwortet, sondern **geschlossen**: Der
Umweg über die Namen trägt nicht, und das steht jetzt mit einer Zahl da statt
mit einer Vermutung.
