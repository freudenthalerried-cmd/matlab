# Ein Gruppenvorschlag, gemessen und verworfen

Stand: 2026-08-29

## Warum die Frage aufkam

Der Bau bricht seit gestern ab, wenn eine Katalogzeile keine Warengruppe trägt
(`artikel-ohne-gruppe-sind-unauffindbar.md`). Das ist richtig so — ein Artikel ohne
Gruppe steht auf keiner Seite und ist im Shop nicht auffindbar. Es verschiebt
aber die Arbeit: Kommt die Artikelliste des Lieferanten ohne Spalte `gruppe`,
und danach sieht es aus, dann müssen hundert und mehr Zeilen von Hand
zugeordnet werden, bevor überhaupt etwas gebaut wird.

Naheliegender Gedanke: ein Werkzeug, das aus der Bezeichnung eine Gruppe
vorschlägt. Bevor ich es baue, habe ich es gemessen.

## Die Regeln

Aus dem Bestand der 46 Katalogartikel abgeleitet, in dieser Reihenfolge, erste
Übereinstimmung gewinnt:

| Muster in der Bezeichnung | Vorschlag |
| --- | --- |
| `capatect` | WDVS |
| `schiedel`, `sikm`, `mantelstein`, `kaminkopf`, `rauchrohr` | Kamin |
| `kanal`, `schachtring`, `grundmauerschutz`, `noppenbahn` | Kanal |
| `xps`, `eps`, `isover`/`isov`, `dämm`, `styrodur`, `austrotherm`, `uniroll`, `orsik` | Dämmung |
| `ziegel`, `planstein`, `hohlblock` | Mauerwerk |
| `mörtel`, `spachtel`, `masse`, `putz`, `kleber`, `beton`, `estrich` | Mörtel |
| `gewebe`, `dübel`, `kantenschutz`, `sockelprofil`, `armierung` | WDVS |
| sonst | Zubehör |

## Zwei Messungen

**Am eigenen Bestand, an dem die Regeln geschrieben wurden: 40 von 46.**

Diese Zahl ist keine Messung. Die Regeln kennen die Antworten; ich habe die
Muster genau so gewählt, dass sie diese 46 Zeilen treffen. Nach der Regel aus
Gate 17 — die Bewertungsregel steht fest, bevor die Antworten vorliegen — zählt
sie nicht. Sie steht hier nur, damit sichtbar ist, wie leicht ein solches
Werkzeug überzeugend aussieht.

**An zurückgehaltenen Daten: 25 von 41.**

Die 41 Artikel sind die abgetippten Zeilen des Lagerhaus-Konditionenblatts
(`preise/lagerhaus-artikel.json`, vertraulich, von `.gitignore` gedeckt). Die
richtige Antwort ist dort die Gruppe der Seite, auf der die Zeile steht.
61 Prozent klingt brauchbar. Der Blick auf die Aufteilung nimmt der Zahl den Wert:

| Seite | Gruppe | Artikel | Treffer |
| --- | --- | --- | --- |
| 53 | Dämmung | 25 | **25** |
| 57 | WDVS | 16 | **0** |

Seite 53 ist eine Isover-Seite. In jeder der 25 Bezeichnungen steht `ISOV`. Die
Regel trifft nicht die Gruppe, sie trifft den Hersteller, und auf dieser einen
Seite fallen beide zusammen. Auf Seite 57 trifft sie nichts, und zwar
ausnahmslos.

## Warum Seite 57 scheitert

Zwei Gründe, beide nicht wegprogrammierbar.

**Erstens: Lieferantenlisten sind abgekürzt und in Großbuchstaben.**
`BAUM KLEBESPACHTEL 25 KG`, `ISOV DAEMMPL ORSIK 10 120X60CM 3,6QM`,
`UNI PUTZGEWEBE MW4X4 50 QM`. Der Hersteller steht als Kürzel, die Umlaute sind
umschrieben, die Produktbezeichnung ist gestaucht. Jedes Muster, das an
ausgeschriebenen Namen entwickelt wurde, geht daran vorbei. Man kann Kürzel
nachpflegen — aber nur die, die man schon gesehen hat.

**Zweitens, und das ist der eigentliche Grund: Die Gruppe ist keine Eigenschaft
des Artikels. Sie ist eine Entscheidung dieses Shops.**

Der Beleg steht im eigenen Katalog:

```
POS-29108 | Mörtel | Baumit KlebeSpachtel 25 kg
POS-52058 | WDVS   | Baumit TextilglasGitter 1,1x50 m
POS-13728 | WDVS   | Capatect Putzgrund weiß 25 kg
```

Derselbe Baumit KlebeSpachtel ist bei uns **Mörtel** und steht beim Lieferanten
auf Seite 57 unter **Vollwärmeschutz**. Beides ist richtig. Er klebt
Dämmplatten, und er ist ein Spachtelmörtel. Welche der beiden Wahrheiten die
Navigation trägt, entscheidet der Shop, nicht das Produkt. Ein Werkzeug, das aus
der Bezeichnung liest, kann diese Entscheidung nicht finden, weil sie dort nicht
steht.

Dasselbe beim Putzgrund: bei uns WDVS, weil er im Fassadenaufbau vorkommt. Die
Regel schlägt Zubehör vor. Nicht falsch — nur nicht unsere Entscheidung.

## Entscheidung

Das Werkzeug wird nicht gebaut. Ein Vorschlag, der auf der einen Seite 100
Prozent und auf der anderen 0 Prozent trifft, ist schlechter als kein
Vorschlag: Er sieht überall gleich zuversichtlich aus, und die 16 falschen
Zuordnungen würden ungeprüft in den Katalog laufen. Der Bauabbruch bei fehlender
Gruppe bleibt die bessere Sicherung — er sagt „hier fehlt eine Entscheidung“
statt eine zu erfinden.

## Was am Liefertag stattdessen zu tun ist

Nicht Artikel für Artikel entscheiden, sondern **einmal die Gliederung des
Lieferanten auf unsere sieben Gruppen abbilden**. Die Exportliste trägt
erfahrungsgemäß eine Warengruppen- oder Seitenkennung des Lieferanten; davon
gibt es rund zwanzig, nicht hundert. Eine Tabelle mit zwanzig Zeilen
(`Vollwärmeschutz → WDVS`, `Wärmedämmung → Dämmung`, `Kanal/Entwässerung →
Kanal`, …) ordnet dann den ganzen Katalog auf einmal zu, und die Ausnahmen —
der KlebeSpachtel, der bei uns anders steht — sind eine Handvoll, die man
einzeln benennt.

Das ist derselbe Schluss wie im Vorgängerdokument, nur von der anderen Seite:
Hundert Artikel in sieben Gruppen sind ein Sortiment; hundert Artikel ohne
Gruppe sind eine Datei. Die Zuordnung ist redaktionelle Arbeit — aber
redaktionelle Arbeit an zwanzig Gruppen, nicht an hundert Zeilen.

## Notiert

Wieder ein Fehlerbild aus der bekannten Reihe: **eine Zusage, die keine Probe
widerlegen kann.** Am eigenen Bestand gemessen hätte das Werkzeug 40 von 46
gemeldet und wäre gebaut worden. Erst zurückgehaltene Daten haben gezeigt, dass
die 40 nichts über die nächste Liste aussagen. Neu daran ist nur, wie gut die
Gesamtzahl (25 von 41) den Befund noch verdeckt hat — sichtbar wurde er erst
aufgeschlüsselt nach Seiten.
