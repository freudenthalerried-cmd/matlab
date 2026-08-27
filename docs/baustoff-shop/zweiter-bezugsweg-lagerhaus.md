# Ein zweiter Bezugsweg — und ein Frachtmodell, das die Rechnung verschiebt

Stand: 2026-08-27. Das Konditionenblatt des **Lagerhaus Eferding-OÖ.
Mitte eGen** vom 27.02.2025 ist ausgelesen. Es hat drei Dinge geliefert,
die das Modell berühren, und dabei einen Fehler im eigenen Auslesewerkzeug
aufgedeckt, der ihn beinahe verhindert hätte.

## Der Werkzeugfehler zuerst — er ist der Grund, warum es fast nicht ging

Der erste Auslesversuch ergab 72 Seiten Ersatzzeichen:

```
          �������
          ����
          ���
```

Das sah aus wie ein Font ohne Zuordnung — die bekannte Falle mit
Subset-Glyphen ohne `/ToUnicode`. Es war das Gegenteil. Die Datei bringt
**190 ToUnicode-Tabellen** mit, und alle 187 Fonts deklarieren
`/WinAnsiEncoding`.

**`entschluesseln` las ausnahmslos zwei Bytes je Zeichen.** Für die
fünfzehn Lieferantenrechnungen war das richtig: Sie verwenden
zusammengesetzte Fonts (`/Subtype /Type0`, Identity-H), dort ist ein Code
zwei Byte breit. Ein Konditionenblatt mit einfachen Fonts hat **ein** Byte
je Zeichen. Paarweise gelesen wird daraus Unsinn — und zwar Unsinn, der
wie ein Kodierungsproblem aussieht statt wie ein Lesefehler.

> **Ein Werkzeug, das nur eine Sorte PDF gesehen hat, hält deren Eigenart
> für die Regel.** Dieselbe Familie wie der Seitenfinder, der `/Type/Page`
> ohne Leerzeichen suchte: Beide Male hat ein Erzeuger sich anders
> verhalten als der erste, und beide Male hat das Werkzeug nicht
> widersprochen, sondern etwas Falsches geliefert.

Behoben: Die Codebreite hängt jetzt am Font (`/Subtype /Type0` → zwei
Byte, sonst eines), und ohne ToUnicode gilt die deklarierte Kodierung
(cp1252 für WinAnsi). Die fünfzehn Rechnungen lesen sich unverändert;
das Konditionenblatt liest sich jetzt auch.

Nebenbei bestätigt: Der Auslesepfad ist **reproduzierbar**. Derselbe Lauf
hat aus den Rohdaten alle fünfzehn Poschacher-Rechnungen und die beiden
Pramer-Angebote wiederhergestellt — die Zusicherung von
`herkunft-der-rechnungen.md`, nachgeprüft statt behauptet.

## Was lesbar ist — und was nicht

**14 von 72 Seiten tragen Text.** Die übrigen 58 sind Bilder: Die
Rabattstaffel selbst liegt als Grafik vor, und ein Renderer steht in
dieser Umgebung nicht zur Verfügung (`pdftoppm` fehlt).

**Die Rabattsätze sind damit weiterhin nicht ausgewertet.** Was
auszuwerten war, steht unten; was fehlt, fehlt sichtbar.

## Befund 1: Das Lagerhaus ist im Liefergebiet

| Standort | Bezirk | im Liefergebiet? |
|---|---|---|
| **4323 Münzbach**, Wimmstraße 20 | Perg | **ja** |
| **4320 Perg**, Technologiepark 1 (Fachwerkstätte) | Perg | **ja** |
| 4061 Pasching | Linz-Land | **ja** |
| 4070 Eferding (Sitz), Grieskirchen, Lambach, Hörsching, Enns, Sipbachzell, Weibern, Fischlham | — | nein |

Das Konditionenblatt nennt außerdem eine eigene **Ansprechpartnerin für
Perg**. Die Genossenschaft hat also Verkaufsstellen im selben Bezirk wie
der Betriebssitz — anders als Poschacher, dessen Belege keinen Standort
im Liefergebiet erkennen lassen.

Für die Selbstabholung, die `marge-25-prozent.md` für alles unterhalb der
Frachtschwelle empfiehlt, ist das der entscheidende Unterschied: **Eine
Abholstelle im eigenen Bezirk ist eine, die der Kunde auch nutzt.**

## Befund 2: Die Fracht staffelt — und das verschiebt Gate 20

| | Poschacher | Lagerhaus (Zustellung ab Lager) |
|---|---|---|
| Kleintransporter | — | **41,66 €** |
| bis 4 Paletten | 75,50 € je Lieferung | 75,00 € *inkl. Kranhub* |
| bis 12 Paletten | 75,50 € je Lieferung | 87,50 € *inkl. Kranhub* |
| ab 13 Paletten | 75,50 € je Lieferung | 112,50 € *inkl. Kranhub* |
| Kranhub | 7,50 € **je Hub zusätzlich** | im Preis |
| Streckenlieferung | dasselbe Pauschalmodell | „lt. aktueller Industriepreisliste" |

**Poschacher berechnet 75,50 € je Lieferung — für einen Sack ebenso wie
für zehn Paletten.** Das ist der Befund, der Gate 20 überhaupt nötig
gemacht hat: Kleine Warenkörbe tragen ihre Fracht nicht.

Beim Lagerhaus gibt es für kleine Mengen einen **Kleintransporter zu
41,66 €**. Was das ausmacht, bei 25 % Marge und frei Haus:

| Fracht | Nulldurchgang (Warenwert netto) |
|---|---|
| Poschacher, eine Palette (75,50 + 7,50 Kranhub) | **332 €** |
| Lagerhaus, bis 4 Paletten (inkl. Kran) | 300 € |
| **Lagerhaus, Kleintransporter** | **167 €** |

> **Die Frachtschwelle halbiert sich.** Genau der Bereich zwischen 170 und
> 330 € Warenwert — der Bereich, in dem Google Shopping die meisten
> Bestellungen liefert — ist bei Poschacher ein Verlustgeschäft und beim
> Lagerhaus eines, das trägt.

Umgekehrt ist die große Lieferung beim Lagerhaus teurer: ab 13 Paletten
112,50 € gegen 75,50 €. **Kein Weg ist besser, sie sind verschieden** —
und das ist die eigentliche Nachricht. Ein Handel mit zwei Bezugswegen
kann je Bestellung den günstigeren wählen; ein Handel mit einem kann es
nicht.

## Befund 3: Das Sortiment deckt den Katalog und geht darüber hinaus

Das Inhaltsverzeichnis nennt unter anderem **Baumit**, **Capatect**,
**Weber Putze**, **Quarzolith**, **Isover Dämmstoffe**, **XPS Dämmung**,
**EPS-W15/20/25**, **Styrodur**, **Vollwärmeschutz**, **Kaminsysteme
Schiedel**, **Kanalrohre**, **Schachtringe**, **Schachtabdeckungen**,
**Kanaleinläufe**, **Grundmauerschutz**, **Ziegel** von sechs Werken,
**Rigips**, **Heraklith**, **Transportbeton**, **Betonstahl**.

**Alle sechs Warengruppen des Katalogs sind abgedeckt** — Kamin,
Dämmung, WDVS, Kanal, Mörtel, Mauerwerk —, und die Marken sind
dieselben, die auf den Poschacher-Rechnungen stehen. Ein direkter
Vergleich Satz gegen Satz ist damit möglich, sobald die Staffel lesbar
ist.

Darüber hinaus: Gartenbaustoffe, Pflaster, Türen und Zargen, Fenster,
Dachbahnen, Bauholz. Das sind Warengruppen, die der Katalog **nicht**
führt — und mögliche Antworten auf die Frage, wo Gate 22 heute Beipack
ausweist.

## Vier weitere Angaben, die der Shop bisher nicht hatte

| Angabe | Wert | wofür |
|---|---|---|
| **Retourware Lagerprodukte** | 15 % Manipulationsgebühr | AGB Punkt 11 hatte dazu keine Zahl |
| Retourware Strecke | lt. Industriepreisliste | dito |
| Preisgrundlage | „aktuell gültige Werkspreisliste", Rabatte lt. Konditionen | dieselbe Basis wie die Poschacher-Rückrechnung — vergleichbar |
| Preisbindung | „Die angeführten Preise sind unverbindlich"; Erhöhungen jederzeit möglich | betrifft die Preisstands-Angabe im Shop |

Die Retourregel ist ein Fund für die Rechtsseiten: AGB Punkt 11
(*Rücknahme angebrochener Gebinde und Rollenware*) stand bisher ohne
jede Zahl da. **15 % ist branchenüblich und hier belegt** — allerdings
belegt für den *Lieferanten*, nicht für den Shop. Was der Shop seinen
Kunden verrechnet, ist seine Entscheidung; was er selbst trägt, wenn er
zurückschickt, steht jetzt fest.

## Vorbehalte, ausdrücklich

1. **Das Blatt ist vom Februar 2025**, gilt für das Geschäftsjahr 2025.
   Konditionen werden jährlich neu ausgehandelt. Alles hier ist
   **Anhaltspunkt, kein Preisstand.**
2. **Die Konditionen gelten „ab Lager"** — Lagerbezug in den Filialen der
   Genossenschaft. Der Shop ist ein Streckengeschäft; für die Strecke
   verweist das Blatt auf die Industriepreisliste, also auf etwas, das
   hier nicht vorliegt.
3. **Die Rabattsätze selbst sind nicht ausgewertet** (Bilder, kein
   Renderer). Ohne sie ist offen, ob der Einkaufsvorteil beim Lagerhaus
   überhaupt an Poschacher heranreicht.
4. **Es sind fremde Konditionen.** Der ausgelesene Text liegt in
   `preise/lagerhaus-konditionen-2025.txt` und ist von `.gitignore`
   gedeckt — mit derselben Einschränkung wie bei Poschacher
   (`rekonstruierbare-einkaufspreise.md`).

## Was daraus folgt

**Der Katalog hängt an einem einzigen Bezugsweg**, und das steht in
keinem Risikoverzeichnis. Ein zweiter Weg wäre nicht nur eine
Preisfrage — er ist die Antwort auf einen Ausfall, auf eine
Konditionenverschlechterung und auf die Frachtschwelle bei kleinen
Bestellungen.

Aufgeschrieben **vor** der Auswertung der Staffel, nach Gate-17-Prinzip:

> Wenn die Rabattsätze des Lagerhauses in mindestens zwei der sechs
> Warengruppen an Poschacher heranreichen, ist der zweite Bezugsweg
> **wirtschaftlich** und nicht nur strategisch. Reichen sie nirgends
> heran, bleibt er trotzdem sinnvoll — aber allein wegen der Fracht bei
> kleinen Warenkörben und der Abholstelle im Bezirk Perg, und das ist
> dann so zu benennen.

**Was ein Vertrag mit dem Lagerhaus voraussetzt, ist eine Anfrage an
Dritte** — also freigabepflichtig. Diese Auswertung ist es nicht: Sie
liest ein Dokument, das im Postfach des Auftraggebers liegt.

## Offen für den nächsten Lauf

- **Die Rabattstaffel.** Ohne Renderer nicht auszulesen. Zwei Wege: ein
  Lauf mit `poppler-utils`, oder der Auftraggeber liest die sechs
  Warengruppen-Seiten ab (Seiten 4–8, 18, 26–28, 50–54, 57–59).
- **Die Industriepreisliste** für Streckenlieferung — liegt nicht vor.
- **Ob die Konditionen 2026 fortgeschrieben wurden.** Eine Nachricht
  gleichen Betreffs aus 2026 findet sich im Postfach nicht; das kann
  heißen, dass sie ausblieb, oder dass sie anders heißt.
