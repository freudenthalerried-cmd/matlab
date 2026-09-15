# Die Datei für Assistenten sagte weniger als der Feed

*Lauf vom 15. September 2026. Die Merkblattadresse steht jetzt auch in
`llms.txt`, ein Abgleich hält beide Ausgaben zusammen, `marke()` nimmt ihr
Register herein. Und eine Vermutung, die sich beim Messen aufgelöst hat.*

---

## Zuerst die Frage von gestern — und ihr Ende

Gestern blieb offen: *Tragen die Artikelseiten denselben Hersteller und
dasselbe Merkblatt wie der Feed — an derselben Stelle, mit denselben Worten?*

Gemessen: **28 Artikel tragen eine Marke, die das Register kennt, und bei allen
28 steht der Herstellername auf der Seite.** Null Abweichungen. Die Vermutung
war, der sichtbare Abschnitt „Technische Kennwerte" nenne für die vier Marken
ohne belegte Adresse den Hersteller gar nicht — er sagt nur *„Für diesen
Artikel liegt uns kein Herstellermerkblatt vor"*. Das stimmt, aber es ist kein
Mangel: Bei genau diesen vier ist der Markenname der Firmenname, und er steht
in der Artikelbezeichnung, also in der Überschrift der Seite.

Eine Vermutung weniger, und der Aufwand dafür war eine Messung.

## Was dabei auffiel: die Datei, die es für Assistenten gibt

`llms.txt` ist die Datei, die dieser Shop für KI-Assistenten schreibt — die
Weisung, von Assistenten genannt zu werden, steht seit dem 22. August. Ihre
46 Artikelzeilen trugen:

```
- [Soudal Perimeterkleber B3 750 ml](…): 7,60 € je Dose, netto · Zubehör
```

Preis, Abgabemenge, Gruppe, bei systemgebundenen Schichten das System. **Nicht**
die Merkblattadresse, die seit gestern in der Feedbeschreibung steht.

> **Eine Datei für Assistenten, die weniger sagt als der Feed, schickt den
> Assistenten auf die schlechtere Quelle.**

Seit heute:

```
… netto · Zubehör · technisches Merkblatt über https://www.soudal.com/
```

und für die vier Marken ohne belegte Adresse:

```
… netto · Zubehör · ein technisches Merkblatt liegt uns nicht vor
```

Die zweite Form ist die wichtigere. Eine fehlende Angabe, die einfach fehlt,
sieht aus wie eine Auslassung; eine, die sich zu erkennen gibt, ist eine
Auskunft. *Eine Lücke, die sichtbar ist, ist besser als eine, die gefüllt
aussieht.*

## Ein Satz, drei Orte, eine Stelle

Derselbe Satz steht jetzt in der Feedbeschreibung, in `llms.txt` und — über die
Beschreibung — auf der Artikelseite. Drei Orte sind in diesem Haus der Anfang
jedes zweiten Befunds, also steht er **einmal**: `herkunftssatz()` in
`src/maschinenlesbar.js`. Die llms-Zeile kürzt nur die Anrede weg, weil der
Markenname ohnehin in der Bezeichnung steht.

Und weil ein Satz an derselben Stelle noch keine Gleichheit ist, hält
`llmsherkunftbefund` die **gebaute** Datei gegen die Feedbeschreibung, in beide
Richtungen:

| Regel | Fall |
|---|---|
| `merkblatt-fehlt-in-llms` | der Feed nennt eine Adresse, die Zeile nicht |
| `luecke-sieht-aus-wie-auslassung` | keine Adresse belegt, und die Zeile sagt es nicht |

Er läuft in `npm run pruefe-preise` — dem Befehl, der schon Preis und
Mindestmenge über sechs Ausgaben gegeneinander hält. Dieselbe Frage, eine
Angabe mehr, kein zweites Werkzeug.

## Wo die Gegenprobe zuerst nicht anschlug

Der erste Anlauf mutierte `bin/website.mjs` und erwartete, dass
`pruefe-preise` rot wird. Er blieb grün — und zwar zu Recht: Der Prüfer liest
die **gebaute** `llms.txt`, und die Mutation ändert nur das Bauwerkzeug. Ohne
`npm run website` dazwischen misst er die Datei von vorhin.

> **Ein Prüfer über ein Erzeugnis wird von einer Mutation an der Quelle nicht
> rot.**

Das ist kein Mangel des Prüfers — er soll das gebaute Ergebnis halten. Es heißt
nur, dass der Zeuge woanders stehen muss: Ein Testfall liest jetzt die Stelle
in `bin/website.mjs`, an der die Zeile entsteht. Wer sie herausnimmt, bekommt
es sofort gesagt und nicht erst beim nächsten Bau. Rot gesehen am
15. September. Gegenproben 313 → **314**.

## Zwei Funde am Rande, beide vom Bestand gemeldet

**`marke()` las ihr Register aus dem Modul.** Beim Schreiben der Testfälle
stellte sich heraus, dass die Funktion die Markenliste unmittelbar aus
`HERSTELLER` liest — ein Testfall konnte sie nur mit den Marken dieses Hauses
fahren. Es ist derselbe Griff wie am 14. September bei den zwölf Wächtern über
ihr eigenes Register, und seit demselben Tag hält `pruefe-beiwerte` fest, dass
ein hereingereichtes Register im Rumpf auch gezogen wird. Das Register kommt
jetzt herein.

**`pruefe-saetze` hat zweimal angeschlagen.** Ich hatte denselben Satz — *„Für
einen Assistenten, der eine Bestellliste zusammenstellt, ist die Stelle mit der
Verarbeitungsvorschrift die nützlichste Angabe überhaupt"* — in zwei Dateien
geschrieben, und die Begründung dazu gleich noch einmal in eine dritte. Beides
steht jetzt einmal, mit einem Verweis daneben. Ein Prüfer, der den eigenen
Verfasser beim Kopieren erwischt, während der über Doppelungen schreibt, ist
der beste Beleg dafür, dass er gebraucht wird.

**Und `pruefe-aussentexte` wollte den neuen Satz im Verzeichnis sehen.**
`herkunftssatz` baut Text, der hinausgeht — an zwei Stellen, an denen kein
Mensch mehr hinsieht. Er steht jetzt in `AUSGAENGE`, und zwei Proben in
`test/fremdtext.test.js` halten fest, dass eine vergiftete Artikelbezeichnung
keine zweite Zeile erzeugt und eine *behauptete* Marke keine Merkblattadresse
bekommt. Sonst wäre die Artikelliste des Lieferanten ein Weg, fremde Adressen
in unseren Feed zu schreiben.

## Was dieser Lauf nicht erreicht hat

- **Die Adresse ist die Herstellerseite, nicht das Dokument.** Die Zeile sagt
  „Merkblatt **über** …", und das ist die ehrliche Formulierung — ein direkter
  Link auf das Datenblatt wäre besser und liegt uns nicht vor.
- **Die vier Marken ohne Adresse** sind unverändert ein offener Punkt beim
  Lieferanten.
- **Die 18 Artikel ohne erkennbare Marke** bekommen keine Zeile. Für sie wäre
  jede Angabe geraten.
- **Ob ein Assistent die Datei liest**, weiß niemand. Gemessen ist, dass sie
  seit heute dasselbe sagt wie der Feed.

## Die Frage für den nächsten Lauf

`pruefe-preise` hält sechs Ausgaben über den Preis und seit heute zwei über die
Herkunft. Was hält die **Gruppenkarte** gegen die Artikelseite — dieselbe Ware,
zwei Flächen, und die Karte ist die, die ein Besucher zuerst sieht? Der
Preisabgleich liest sie schon; ob sie über die Ware dasselbe sagt, ist nicht
gemessen.
