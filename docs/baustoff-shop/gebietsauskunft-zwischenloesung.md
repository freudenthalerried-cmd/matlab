# Die Gebietsauskunft — elf Einträge statt 2.095 Gemeinden

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Zwischenlösung zum blockierten Baustein 1 aus
[`umsetzung-shop.md`](./umsetzung-shop.md); der Vollausbau nach
[`phase10-datengrundlage-gebietsabfrage.md`](./phase10-datengrundlage-gebietsabfrage.md)
bleibt offen, solange RIS und Geoserver aus dieser Umgebung nicht erreichbar
sind.

Die Vorrunde ([`nachfragezahlen-pflichtgebiet-und-bestand.md`](./nachfragezahlen-pflichtgebiet-und-bestand.md))
hat die Tür geöffnet: Das Radonvorsorgegebiet — die Kulisse der
Neubau-Pflicht — ist fast ganz Österreich, ausgenommen Wien und zehn Bezirke.
Eine Frage, die als Positivliste 2.095 Gemeinden bräuchte, braucht als
**Negativliste elf Einträge**. Die sind ohne die blockierten Quellen zu haben.

## Was gebaut wurde

`gebiet.js` mit `AUSNAHMEN_VORSORGEGEBIET` (Wien + zehn Bezirke, je mit
Bundesland) und `vorsorgeauskunft(bezirk)`. Die Demo fragt im
Baustellen-Block den Bezirk ab und zeigt die Auskunft live an; der
Beispielwert ist **Perg** — der Heimatbezirk des Betreibers, und der ist
Vorsorgegebiet.

> **Berichtigt am 26. August.** Hier stand: „Beispielwert ist bewusst *Ried
> im Innkreis* — der Heimatbezirk des Betreibers, und der ist ausgenommen."
> Beides zusammen war falsch: Der Betriebssitz liegt in **Ried in der
> Riedmark, Bezirk Perg**, und Perg steht nicht auf der Ausnahmeliste. Zwei
> Bezirke, deren Namen mit „Ried" beginnen, rund 150 km auseinander —
> Hergang in [`zwei-ried.md`](./zwei-ried.md).

Dass die Auskunft auch „nein" sagen kann, zeigt seit der Berichtigung ein
eigenes Oberflächenszenario mit Ried im Innkreis statt der Voreinstellung.

Die Auskunft ist eine **Auskunft, keine Sperre**: Sie hält keine Bestellung
an. Ob ein Kunde in Güssing Radonbahn kaufen will, ist seine Sache — die
Auskunft sagt ihm nur, dass keine Pflicht ihn treibt.

## Die drei Grenzen, die die Auskunft selbst ausspricht

Gate 11 verlangt, dass die Rechtsaussage auf Verordnungstext steht und keine
Genauigkeit vorgetäuscht wird. Die Zwischenlösung hält das so:

1. **Vorsorgegebiet, nicht Schutzgebiet.** Jede Auskunft — auch die leere —
   endet mit dem Satz, dass Schutzgebiets-Pflichten (104 Gemeinden, Anlage 1
   RnV) nur die amtliche Liste auf Gemeindeebene beantwortet. Die ist
   blockiert; die Auskunft sagt das dazu, statt es zu verschweigen.
2. **Bezirksebene, weil die Ausnahmen bezirksscharf sind.** Eingegeben wird
   der Bezirk, nicht die Postleitzahl — eine PLZ beweist keinen Bezirk, so
   wie sie kein Land beweist (`kunde.js`).
3. **Der Vorbehalt wandert in jedes Ergebnis.** Die Liste stammt aus einer
   Sekundärquelle (BMLUK-Seite laut Websuche); jedes Auskunftsobjekt trägt
   Stand, Quelle und den Satz „vor einer Veröffentlichung am Verordnungstext
   gegenzuprüfen". Wer die Auskunft in Inhalte übernimmt, übernimmt den
   Vorbehalt mit.

Eine vierte Entwurfsentscheidung steckt in der Fehlbehandlung: **Ein
verschriebener Bezirk landet auf der Vorsorge-Seite** — das ist die Logik der
Negativliste, und die Auskunft formuliert sie als Listenaussage („steht nicht
auf der Ausnahmeliste"), nicht als Ortskenntnis. Sie behauptet nie, den
Bezirk zu kennen; sie behauptet nur, die Liste geprüft zu haben.

## Geprüft

| | |
|---|---|
| neue Testfälle | 10 |
| Testfälle gesamt | 374, alle grün, 0 mit Verdacht |

Darunter: Fremdtext in der Bezirkseingabe bleibt eine Zeile im Auskunftstext
(der Eingabewert läuft durch `textZeile`, wie an jedem Ausgang).

Gegenproben an der Prüfung, beide sofort rot, danach zurückgenommen:

| Mutation | |
|---|---|
| Ried im Innkreis von der Ausnahmeliste gestrichen | 3 Testfälle fallen |
| Die Auskunft sieht die Liste nicht mehr an | 3 Testfälle fallen |

Am gebauten Bündel nachgesehen: Die Demo zeigt für den Beispielbezirk die
Ausnahme-Auskunft, `gebiet.js` ist im Bündel, der Kollisionswächter schweigt.

## Was der Vollausbau später ändert

Die Zwischenlösung ist so geschnitten, dass der Vollausbau sie **ergänzt
statt ersetzt**: Die Vorsorge-Auskunft über die Negativliste bleibt richtig,
auch wenn die Gemeindeliste kommt — dann kommt die Schutzgebiets-Auskunft
(Anlage 1, gemeindescharf) als zweite Stufe dazu, und der letzte Satz jeder
Auskunft verweist nicht mehr auf eine externe Karte, sondern auf die eigene
zweite Stufe. Offen bleibt bis dahin: die Gegenprüfung der Bezirksliste am
Verordnungstext, sobald RIS erreichbar ist. **Nachtrag:** Eine Gegenprüfung
aus unabhängigen Sekundärquellen hat noch am selben Tag sieben der zehn
Bezirke ausdrücklich bestätigt, Ried im Innkreis amtlich durch das Land OÖ —
siehe [`gegenpruefung-bezirksliste.md`](./gegenpruefung-bezirksliste.md);
der Verordnungstext bleibt die ausständige Instanz.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. Die Referenzzahlen bleiben
3.900,20 € brutto und 34,2 % Mischmarge (als optimistisch markiert); alle
Preise sind Platzhalter. Keine E-Mail versendet, nichts gekauft, keine
Ausgabe.
