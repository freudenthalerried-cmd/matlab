# 82 Pixel seitwärts — und drei Messfehler auf dem Weg dorthin

Stand: 2026-08-27. Der Shop hat seit heute Suche, Filter und Warenkorb.
Ungeprüft war, wie er sich auf einem Telefon verhält — und ein
Baustoffhändler wird vom Gerüst aus bestellt, nicht vom Schreibtisch.

Das Ergebnis: **ein echter Fehler, drei Fehlschlüsse beim Messen, und ein
Prüfer, der ihn beim ersten Versuch nicht finden konnte.**

## Der Fehler

Die AGB-Seite scrollt bei 390 Pixel Breite **82 Pixel seitwärts**. Ursache
ist ein einziges Wort:

> **„Geschäftsbedingungen"** ist als Überschrift **437 Pixel** breit. Der
> verfügbare Kasten ist 335 Pixel breit.

Dieselbe Ursache, kleiner: `Perimeterdämmung und Grundmauerschutz` — neun
Pixel. Deutsche Komposita in großen Überschriften sind auf schmalen
Anzeigen ein eigenes Problem, und ein Shop, dessen Seite seitwärts
wandert, wirkt kaputt, bevor irgendein Preis gelesen wird.

Behoben durch `overflow-wrap: break-word` auf `body`, dazu `hyphens: auto`
auf den Überschriften — die Seiten tragen `lang="de-AT"`, ein Telefon
trennt damit sauber.

## Drei Messfehler, und jeder hätte den Bericht falsch gemacht

### 1. Das Bildschirmfoto log

Der erste Blick war ein Foto mit `--window-size=390,1400`. Es zeigte
abgeschnittenen Text an jedem rechten Rand — offensichtlich ein
Umbruchfehler.

**War es nicht.** Headless-Chromium erzwingt in dieser Umgebung eine
Fensterbreite von **mindestens 500 Pixeln**. Die Seite wurde 500 Pixel
breit aufgebaut und das Foto auf 390 zugeschnitten. Was aussah wie
überlaufender Text, war ein Beschnitt.

> **Ein Bildschirmfoto beweist nicht, was es zeigt, sondern was der
> Renderer getan hat.** Beinahe wäre ein Fehler berichtet worden, den es
> nicht gibt — und der echte, eine Seite weiter, wäre unentdeckt geblieben.

Der Ausweg ist ein `<iframe width="390">`: ein echter eigener Viewport,
ohne Mindestbreite.

### 2. `scrollWidth` allein log auch

Der zweite Anlauf maß `documentElement.scrollWidth` und listete jedes
Element, das über den rechten Rand ragt. Ergebnis auf der AGB-Seite:
`scrollWidth = 457`, überstehende Elemente: **eine Tabelle**.

Falscher Verdächtiger. Die Tabelle liegt in einem `.scroll`-Kasten mit
eigenem Rollbalken; dass ihr Inhalt breiter ist, ist Absicht. Wer danach
geht, „repariert" eine Tabelle, die richtig gebaut ist.

Der Test, der nicht lügt:

```js
w.scrollTo(9999, 0);
w.scrollX  // 82 → die Seite scrollt wirklich
```

**Ob eine Seite seitwärts scrollt, beantwortet man, indem man sie seitwärts
scrollt.** Danach war der Schuldige in einem Durchgang gefunden: das
einzige Element mit `scrollWidth > clientWidth` außerhalb der
Scrollkästen — die Überschrift.

### 3. Der erste Prüfer konnte nicht durchfallen

Aus der Messung wurde eine Probe: fünf Seiten im 390-Pixel-Rahmen,
eingebaut in `npm run shopprobe`. Alle grün.

Die Gegenprobe — CSS-Regel entfernen, Probe muss melden — **blieb
ebenfalls grün.** Der Prüfer konnte den Fehler nicht sehen, für den er
gebaut war.

Zwei Gründe, beide lehrreich:

| | |
|---|---|
| Der Rahmen zeigte die **Einzeldateifassung** | Deren Inhalt wird per Rautenwechsel eingesetzt; im iframe blieb er leer. Eine leere Seite scrollt nie seitwärts — `scrollX=0`, grün. |
| Die Gegenprobe entfernte **die falsche Regel** | Von zwei hinzugefügten Regeln trug die auf `body` die Last. Nur die Überschriftenregel zu entfernen änderte nichts. |

Beides ist behoben: Der Rahmen zeigt jetzt die **Mehrseitenfassung** — die
Fassung, die später auf der Domain liegt —, und die Messung meldet
zusätzlich **die Überschrift der geprüften Seite**. Fehlt sie, gilt die
Probe als fehlgeschlagen:

> **Eine Messung an einer leeren Seite ergibt immer null und sieht wie ein
> bestandener Test aus.** Der Beweis, dass etwas gemessen wurde, gehört ins
> Messergebnis.

Die wiederholte Gegenprobe meldet jetzt, was sie soll:

```
✗ AGB-Seite scrollt bei 390 px nicht seitwärts
    die Seite scrollt seitwärts: scrollX=82 breite=457/375 h1=Geschäftsbedingungen
✗ Wissensseite mit langem Titel …
    die Seite scrollt seitwärts: scrollX=9 breite=384/375 h1=Perimeterdämmung und Grundmauerschutz
```

## Nebenbei: ein Bau, der still gescheitert ist

Beim Einsetzen der CSS-Regel stand in ihrem Kommentar das Wort
`break-word` in **Rückwärts-Anführungszeichen**. Der Kommentar steht in
einem JavaScript-Template-String — die Anführungszeichen haben ihn beendet,
und der Bau brach mit `SyntaxError: Unexpected token 'break'` ab.

Gemerkt hätte ich es fast nicht: Der Aufruf lief mit `>/dev/null 2>&1`,
und die nächste Messung las die **alte** Ausgabedatei. Sie zeigte
denselben Fehler wie vorher, was zum Schluss geführt hätte, die Regel
wirke nicht.

> **Ein Bauschritt, dessen Ausgabe man wegwirft, kann nicht scheitern — er
> kann nur schweigen.** Der Zeitstempel der Ausgabedatei hat es verraten.

## Stand

| | |
|---|---|
| Seiten bei 390 px ohne Seitwärtsrollen | **alle geprüften** (Start, Gruppe, Artikel, Wissen, AGB, Datenschutz, Lieferung, Warenkorb, Kasse) |
| `npm run shopprobe` | **19 Szenarien**, davon 5 im 390-px-Rahmen |
| Gegenprobe | schlägt fehl, wenn die Regel fehlt — mit Zahl und Überschrift |
| Testfälle | 681 grün |

Was noch nicht geprüft ist: **Bedienung** am Telefon — ob sich der
Vorschlagskasten unter dem Suchfeld mit dem Daumen schließen lässt, ob die
Mengenfelder im Warenkorb groß genug sind. Das misst kein `scrollX`; dafür
braucht es entweder echte Berührungsereignisse oder ein Telefon.
