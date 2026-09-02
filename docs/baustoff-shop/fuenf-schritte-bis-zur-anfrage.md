# Fünf Schritte bis zur Anfrage

**2. September 2026.** Die Frage der letzten Runde: *Wie viele Schritte liegen
zwischen dem Klick und der fertigen Anfrage — und an welchem springt der
Besucher ab?*

Anders als die Kaufquote lässt sich das **ohne einen einzigen Besucher
zählen.** Der bezahlte Klick kostet zwischen 4,19 € und 8,22 €; was er wert
ist, hängt daran, wie weit es von der Landeseite bis zu dem Text ist, den der
Kunde abschickt.

## Gemessen, nicht geschätzt

`npm run wegprobe` geht den Weg im gebauten Shop wirklich — Klick für Klick,
im Browser, ab der WDVS-Gruppenseite, auf der die Anzeige landet:

```
  1. Klick auf einen Artikel
  2. In den Warenkorb legen
  3. Warenkorb öffnen
  4. Weiter zur Kasse
  5. Bezirk wählen

5 Schritte, höchstens 5 vorgesehen.
Textfelder auszufüllen: 0 · Auswahlfelder: 1 · Zahlweg vorbelegt: ja
Am Ende: 775 Zeichen Anfragetext, Knöpfe: Text kopieren
```

**Fünf Schritte, kein einziges Textfeld.** Der Zahlweg ist vorbelegt, der
Bezirk ist eine Auswahl, Firmenname und UID fragt die Kasse gar nicht — sie
gehören zur Bestellung, die es noch nicht gibt. Für einen Polier, der auf der
Baustelle am Telefon steht, ist das kurz.

Das ist der erste gemessene Wert dieser Strecke. Bisher stand über den Funnel
nur, dass es ihn gibt.

## Die eine Länge, die daneben steht

```
Auf der Gruppenseite: 11 Artikel, 0 davon direkt legbar.
```

Die Landeseite hat **keinen Legen-Knopf.** Wer aus der Anzeige „Kleber, Gewebe,
Dübel" kommt — also mit drei Positionen im Kopf —, geht dreimal: Artikel öffnen,
legen, zurück zur Gruppe. **Neun Schritte statt fünf**, und die vier zusätzlichen
sind reine Wege.

Der Grund ist nicht Nachlässigkeit, sondern die Ware: Jeder Artikel hat eine
**Gebindemenge**. Die Glasgewebe-Rolle gibt es ab 55 m², die Anschlussleiste ab
2,55 lfm, der Sack zu 25 kg. Ein Legen-Knopf ohne Mengenfeld legt „eins" — und
„ein Quadratmeter Glasgewebe" ist eine Menge, die niemand kommissionieren kann.
Genau dieser Fehler ist am 31. August auf den Artikelseiten behoben worden.

**Warum es heute nicht gebaut wird.** Die Artikelkarte ist ein `<a>`, das die
ganze Kachel umfasst. Ein Knopf darin wäre ein interaktives Element in einem
interaktiven Element — im Browser eine Fehlkonstruktion, für die Tastatur eine
Falle. Der Umbau bedeutet: Karte von `<a>` auf `<div>`, Titel als Link,
Mengenfeld je Zeile, Fokusführung neu. Fünfzig Browserszenarien hängen an dieser
Kachel.

> **Ein halber Umbau der Landeseite ist schlechter als keiner.** Er verdient
> eine eigene Runde, und der Preis dafür steht jetzt gemessen daneben: vier
> Schritte je zusätzlicher Position.

## Was die Probe festhält

Vier Zusicherungen, jede mit ihrem Grund:

| | warum |
| --- | --- |
| höchstens 5 Schritte | Jeder zusätzliche entwertet einen Klick, der Geld gekostet hat. |
| 0 Textfelder | Jede Eingabe am Bau ist ein Absprung. |
| Zahlweg vorbelegt | Ein Klick ohne Erkenntnis. |
| ≥ 200 Zeichen Anfragetext am Ende | Ein leerer Kasten wäre ein Weg ohne Ziel. |

Die Gegenprobe im Register: `if (i === 0) r.checked = true` auf `i === -1` —
der Zahlweg ist nicht mehr vorbelegt, die Probe meldet rot. **Zwölf von zwölf
Gegenproben schlagen an.**

Dabei kam heraus, dass `baueVorher` bisher nur `npm run website` lief. Die
Oberfläche geht durch das **Bündel**; eine Mutation in `shop-ui.js` erreichte
die gebaute Seite gar nicht. Jetzt läuft `build` davor — sonst wäre die
Gegenprobe eine halbe gewesen, zum fünften Mal in drei Tagen.

## Ein Marker, der auch im Werkzeug vorkommt

Der erste Lauf der Sonde stürzte beim Auslesen ab. Der Grund ist eine
Kleinigkeit mit Lehrsatz: Die Sonde schreibt ihr Ergebnis zwischen zwei
Markierungen in die Seite, und der **Quelltext der Sonde steht selbst im
ausgegebenen DOM** — samt der unmaskierten Markierung. Das Werkzeug fand sich
selbst und versuchte, `' + JSON.stringify(...)` als JSON zu lesen.

> **Ein Marker, der auch im Werkzeug vorkommt, findet das Werkzeug.**

Gesucht wird jetzt die maskierte Form, von hinten.

## Die Frage für den nächsten Lauf

> **Was kostet der Weg, den der Betreiber geht?**

Die Besucherstrecke ist gemessen: fünf Schritte. Die Gegenrichtung nicht. Der
Anfragetext landet in einem Postfach, und von dort bis zur Bestellung beim
Lieferanten liegen elf Schritte in `auftragslauf.js`, jeder mit einer
Minutenangabe. Bei siebenundsechzig Bestellungen im Monat entscheidet diese
Zahl, ob der Betrieb neben dem Baugeschäft läuft oder es ersetzt — und
gerechnet ist sie, aber nie gegen die Zielgröße gehalten worden.
