# Eine Position, die niemand vermisst

**10. September 2026, fünfzehnte Runde.** Diesmal die Frage, was mit einem
Warenkorb passiert, der ein paar Tage liegt. Der Katalog wechselt mit jeder
Lieferantenliste — und die Weisung lautet, ihn auf mindestens hundert Artikel
zu erweitern, also wird er häufiger wechseln als bisher.

## Die Messung

Ein Warenkorb aus zwei Positionen im Browserspeicher, davon eine, die der
Katalog nicht mehr führt. Gemessen an der ausgelieferten Warenkorbseite:

> **1 Positionen** · 20 mm Fassaden EPS · 23,16 € · Warenwert 23,16 € …

Die zweite Position ist weg. Die Summe ist kleiner. **Kein Wort dazu.**

`bereinige()` in `src/shopkern.js` gibt seit jeher zwei Dinge zurück — die
gültigen Zeilen *und* die Kennungen, die es nicht mehr gibt. Die Oberfläche
fragte nur, **ob** es welche gab:

```js
var bereinigt = bereinige(korb, D.artikel);
if (bereinigt.entfallen.length) {
  korb = bereinigt.zeilen;
  speichereKorb(speicher, korb);   // und das war alles
}
```

> **Was ein Kunde eingelegt hat, verschwindet nicht ohne einen Satz.**

Das ist zum sechsten Mal dieselbe Familie: *eine Angabe, die berechnet und
dann verschwiegen wird.* Diesmal steht die weggeworfene Angabe sogar im
Rückgabewert der Funktion, die sie berechnet.

Was es kostet: Wer fünf Positionen für ein Gewerk zusammenstellt und drei Tage
später bestellt, schickt eine Anfrage über vier — und hält es für vollständig.
Der Shop sagt es selbst, in seiner eigenen Kaminanzeige: *„Was beim Kamin
fehlt, hält die Baustelle auf."*

## Der zweite Fund stand in derselben Zeile

**„1 Positionen".** Die Überschrift des Warenkorbs setzte die Zahl vor ein
festes Hauptwort. Die Regel dafür steht **elf Zeilen tiefer**, am Gewichtssatz:
`+ (rechnung.positionenOhneGewicht === 1 ? '' : 'en')`.

Nachgezählt, damit aus einem Fund keine Vermutung wird: Sieben Stellen dieser
Oberfläche setzen eine Zahl vor ein Hauptwort.

| Stelle | Lage |
|---|---|
| „… Artikel" (dreimal), „… Treffer" | unveränderlich in der Mehrzahl |
| „… getrennte Lieferungen" | wird bei einer Lieferung nie erreicht |
| „… Position(en) ohne belegtes Gewicht" | behandelt die Eins |
| **„… Positionen" (Warenkorbkopf)** | **behandelt sie nicht** |

Eine von sieben — und ausgerechnet die, die auf der Seite ganz oben steht.

## Was jetzt gilt

Der Hinweis geht **in den Speicher**, nicht in eine Variable. Der Grund ist der
Auslieferungsweg: Der Shop besteht aus Einzeldateien, ein Klick auf „Warenkorb"
ist ein vollständiger Seitenwechsel. Bereinigt wird auf der Seite, die der
Kunde gerade offen hat — meist nicht der Warenkorb. Ein Hinweis, der nur dort
erschiene, wo bereinigt wurde, wäre beim Klick auf den Korb wieder weg und die
Position trotzdem fort. Der Vermerk überlebt den Wechsel und wird gelöscht,
sobald er gelesen ist.

Und er zeigt auf nichts, was nicht da ist: Ist der **ganze** Korb entfallen,
fehlt der Nachsatz „Die Summe darunter ist ohne sie gerechnet" — darunter steht
dann „Der Warenkorb ist leer". Auch das ist eine Messung und keine Annahme; die
erste Fassung hatte den Satz und stand über einem leeren Korb.

Zwei Gegenproben halten beides: Die eine nimmt den Vermerk heraus und lässt die
Bereinigung stehen — die Position verschwindet dann wieder still. Die andere
setzt das feste „Positionen" zurück.

## Der dritte Fund kam vom eigenen Bauen

Für den Hinweis entstand `entfallensatz()`. Das Fremdtextverzeichnis, das jede
textbauende Funktion führt, sah sie **nicht** — sein Namensmuster kannte
`…text`, `…zeile`, `…Csv`, `…Adresse`, aber nicht `…satz`.

Nachgezählt: **zehn** Ausfuhren enden auf „satz", darunter sieben, die einen
Satz für einen Kunden oder einen Lieferanten bauen — der Abholsatz, der
Lieferungssatz, der Merkblattsatz, die Nachfragen im Lieferantenbrief, der
Systembruchhinweis im Warenkorb.

> **Ein Verzeichnis, das eine Schreibweise nicht kennt, führt sie auch nicht —
> und meldet dabei vollständig über das, was es kennt.**

Der dritte Fall dieser Art in derselben Datei; die beiden davor waren
Pfeilfunktionen an einem `export const` und `Text` gegen `Txt`. Alle zehn
stehen jetzt mit ihrem Grund im Verzeichnis. Zwei enden nur zufällig so:
`noetigerUmsatz` gibt eine Zahl zurück, `pruefeAbsatz` ist ein Prüfer. Beide
mit Begründung ausgenommen — *eine Ausnahme mit Grund ist billiger als ein
Muster, das seine Fälle von Hand ausnimmt.*

## Am Werkzeug geändert

Die Rahmenproben der Shopprobe maßen bis heute ausschließlich **Maße**:
Seitwärtsrollen, Größe der Bedienelemente, Zahl der Elemente. Was auf der Seite
*steht*, war dort nicht prüfbar — und der Warenkorbzustand entsteht erst aus
dem Speicher, lässt sich also nur im Rahmen herstellen. Der Rahmen liest jetzt
auf Wunsch einen Text ab, und die beiden Listen `erwartet` und `verboten`
gelten dort wie bei jedem anderen Szenario, damit ein Rahmenszenario nicht
seine eigene Sprache spricht.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2244 | **2251** |
| Shop-Szenarien im Browser | 57 | **59** |
| Gegenproben | 159 | **161** |
| Einträge im Fremdtextverzeichnis | 40 | **50** (15 Ausgänge, 35 mit Grund) |

`npm test` grün (2251 bestanden, 3 übersprungen), `npm run pruefe-tests` (2254
Testfälle, 0 mit Verdacht), `npm run shopprobe` (59 Szenarien, 12 im
390-px-Rahmen), `npm run oberflaechenprobe` (11 Szenarien), `npm run
pruefe-oberflaeche` (29 Sätze), `npm run pruefe-pruefer` (48 Prüfer, 1
abgebrochen — `pruefe-gebinde`).
