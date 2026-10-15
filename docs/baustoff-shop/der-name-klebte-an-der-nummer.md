# Der Name klebte an der Nummer

**Stand: 30. August 2026** · Befund und Behebung aus einem Lauf des
Arbeitsloops. Betroffen: `shop/src/kundenanfrage.js`,
`shop/test/kundenanfrage.test.js`.

## Wo gesucht wurde

Der Anfragetext ist **der einzige Weg, auf dem heute eine Bestellung zustande
kommt.** Es gibt keinen Zahlungsanbieter, keine Auftragsstrecke; was der Shop
kann, ist: Warenkorb füllen, Bezirk wählen, den fertig gerechneten Text
kopieren und schicken. Also einmal einen echten Korb gerechnet und den Text
gelesen, den ein Kunde bekommt.

Die dritte Zeile lautete:

```
4 KG          Capatect Klebe- und Spachtelmasse 186 M 25 kgPOS-11283   0,56 €     2,24 €
```

`…186 M 25 kg` **POS-11283** — ohne ein Leerzeichen dazwischen.

## Warum

Die Spaltenfunktion füllte kurzen Text bis zur Spaltenbreite auf und gab
langen unverändert zurück:

```js
return t.length >= breite ? t : t + ' '.repeat(breite - t.length);
```

Bei Überlänge also **kein einziges Leerzeichen**. Die nächste Spalte begann
unmittelbar hinter dem letzten Buchstaben.

> **Eine Spalte, die nicht trennt, ist keine Spalte.**

Gemessen am Bestand: **12 der 46 Artikel** tragen einen Namen, der länger ist
als die Namensspalte von 44 Zeichen. Der längste hat 96. Bei jedem vierten
Artikel lief der Name in die Artikelnummer — und die Artikelnummer ist das
Feld, an dem wir die Ware erkennen, wenn die Anfrage bei uns ankommt.

## Behoben, zweistufig

**Erstens** garantiert die Spalte mindestens ein Leerzeichen. Das allein
beseitigt schon das Zusammenkleben.

**Zweitens** bricht ein zu langer Name um, an Wortgrenzen. Das ist nötig, weil
Schritt eins die rechten Spalten verschiebt: Ohne Umbruch stünde die
Summenspalte bei zwölf von sechsundvierzig Positionen woanders, und die rechte
Kante überfliegt man beim Prüfen einer Bestellliste zuerst.

Die Reihenfolge im Block folgt der, in der ein Bauleiter liest — **wie viel,
wovon, welche Nummer, was kostet es:**

```
4 kg          Capatect Klebe- und Spachtelmasse 186 M 25
              kg                                          POS-11283   0,56 €     2,24 €
9 m²          XPS glatt SF 50 mm 0,75 m2                  POS-12571   8,72 €     78,48 €
2 Karton      Capatect Polystyrol-Rondelle für Capatect
              Universaldübel Rondelle und Capatect
              Schraubdübel Holz                           POS-29610   13,24 €    26,48 €
```

Ein einzelnes Wort, das länger ist als die Spalte, bleibt ungeteilt stehen.
Ein zerschnittener Artikelname wäre schlimmer als eine zu lange Zeile.

## Die Proben und was sie trennen

| Zusicherung | fällt ohne |
|---|---|
| Jede Artikelnummer steht mit Leerzeichen davor — geprüft an **allen** Artikeln | den Mindestabstand |
| Der lange Name ist Wort für Wort wiederherstellbar | — (hält auch ohne Umbruch) |
| Die Summenspalte steht in jeder Positionszeile an derselben Stelle | den Umbruch |

Die beiden Gegenproben treffen verschiedene Testfälle, und das ist der Punkt:
Der Mindestabstand behebt den **Fehler**, der Umbruch behebt die **Folge der
Behebung**. Wer nur das erste getan hätte, hätte eine lesbare Liste mit
zerfranster rechter Kante hinterlassen und es für erledigt gehalten.

## Zwei Dinge, die geprüft wurden und in Ordnung sind

**Die Einheiten.** Im ersten Probelauf stand „4 KG" und „2 KRT" statt „kg" und
„Karton". Das lag an meiner Probe, nicht am Shop: Ich hatte eine unvollständige
Einheitentabelle übergeben. Die Seite übergibt die vollständige.

**Der Mailknopf.** Der `mailto:`-Verweis trägt den Text in der Adresse und ist
ab **drei Positionen** zu lang — nicht wegen des Umbruchs, sondern weil die
URL-Kodierung die Länge etwa verdoppelt. Gemessen alt gegen neu: bei ein und
zwei Positionen identisch, ab drei in beiden Fällen zu lang. Die Oberfläche
blendet den Knopf dann aus **und schreibt dazu, warum** — „Für den Mailknopf
ist die Liste zu lang; bitte den Text kopieren". Ein fehlender Knopf ohne
Begründung sähe aus wie ein Fehler.

Damit ist der Kopierweg nicht die Notlösung, sondern der Hauptweg. Das ist
vertretbar, solange es dabei bleibt — und es ist ein weiterer Grund, warum
dieser Text stimmen muss.
