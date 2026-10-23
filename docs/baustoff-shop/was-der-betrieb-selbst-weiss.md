# Was der Betrieb selbst weiß

*23. Oktober 2026, auf Weisung des Auftraggebers: „mach den artikelvergleich".
Verglichen wird, was im Haus gemessen ist. Und über der Tafel steht, wann sie
nichts bedeutet.*

---

## Was gemessen wurde, bevor etwas gebaut wurde

Vergleichstafeln gab es schon zwei, beide auf den Gruppenseiten:

| | |
|---|---|
| „Was ein Zentimeter Stärke kostet" | Dämmplatten nach Stärke, seit 11. September |
| Der Kilovergleich | Gebindeartikel nach Kilopreis, aus dem Befund *„Wer eine Zahl dreimal richtig beschriftet, hat noch keine vergleichbare Zahl geliefert."* |

Beide vergleichen eine ganze Gruppe nach **einem** Kriterium. Was fehlte, ist
die Gegenüberstellung: wenige Artikel, alle Merkmale, nebeneinander.

## Die Grenze steht vor der ersten Zeile Code

Der Katalog führt **keine technischen Kennwerte** — kein Lambda, keinen
Druckwiderstand, keine Brandklasse. Das ist die zweite Redaktionsregel dieses
Hauses und keine Lücke: Kennwerte stehen im Merkblatt des Herstellers, und wer
sie abschreibt, haftet für einen Zahlendreher in einem Nachweis.

> **Ein Vergleich, der Kennwerte erfindet, ist gefährlicher als keiner:**
> Er sieht aus wie eine Entscheidungsgrundlage.

Ein Vergleich ohne Kennwerte klingt nach einem halben Vergleich. Er ist aber
der einzige, den dieses Haus belegen kann — und die Spalte, die ein Kunde
wirklich gegeneinanderhält, ist ohnehin der Preis je Einheit.

## Die elf Merkmale und ihre Deckung, als Zahl

`npm run pruefe-vergleich` schreibt sie hin, weil ein Merkmal, das bei drei von
46 Artikeln einen Wert hat, keine Spalte ist, sondern eine Fußnote:

```
  Preis je Einheit, netto          ████████████████████ 46/46
  Einheit                          ████████████████████ 46/46
  unter der Liste des Lieferanten  █████████████████··· 39/46
  Abgabe ab                        ████████············ 18/46
  je Kilogramm, netto              ███·················  7/46
  Stärke                           ███████············· 15/46
  Winkel                           █···················  3/46
  Gewicht je Einheit               ███·················  7/46
  palettiert                       ████████████████████ 46/46
  Systembindung                    ████████████········ 28/46
  Preisgrundlage, Stand            ████████████████████ 46/46
```

Diese Zahlen sind **kein Befund.** Dass der Katalog das Gewicht für sieben
Artikel kennt, ist eine offene Frage an den Lieferanten und kein Fehler der
Tafel. Sie stehen da, damit die Frage nicht hinter einer gleichmäßig
aussehenden Tabelle verschwindet.

Zu jeder Lücke steht ein Satz, und zwar ein Satz je Merkmal und nicht ein
Gedankenstrich — denn eine Tafel, die schweigend kürzt, sieht vollständig aus
und ist es nicht. Jeder dieser Sätze trägt im Register einen Grund von
mindestens 150 Zeichen, dieselbe Zahl wie überall.

## Vier Merkmale sagen, woher sie kommen

`palettiert`, `Stärke`, `Winkel` und `je Kilogramm` stehen in keiner Zeile des
Katalogs. Sie sind aus der Bezeichnung gelesen oder aus zwei Zahlen gerechnet,
und genau das stand zuerst nicht dabei: `pruefe-sperrgut` fand „palettiert" auf
15 Seiten ohne seine Herkunft. Abgeleitete Merkmale tragen jetzt einen Hinweis
unter der Tafel und eine Regel über sich.

> **Eine Angabe, die aus einem Namen gelesen ist, ist eine Lesart und keine
> Eigenschaft.** Steht sie ohne ihre Herkunft in einer Tabelle, wird sie zur
> Eigenschaft, ohne dass jemand sie zugesagt hat.

## Die Auswahl: gleiche Gruppe, gleiche Einheit, gleiche Schicht

Was die Tafel nebeneinanderstellt, entscheidet `alternativen()` — Artikel
derselben Gruppe, derselben Einheit, derselben **Systemschicht**, sortiert nach
Preisnähe. Die dritte Bedingung fehlte zuerst, und der erste Lauf stellte dem
Mantelstein den Mantelsteinkleber, die Regenhaube und die Zuluftplatte
gegenüber:

> **Zwei Artikel, die zusammen gekauft werden, sind keine Alternativen.**

Die Erkennung dafür war schon da (`einordnung` in `src/systemtreue.js`, gegen
den Katalog gehalten, in beide Richtungen). Eine zweite Erkennung wäre ein
zweiter Weg zur selben Aussage gewesen, und einer von beiden ist irgendwann
alt. Der **Satz** kommt nicht von dort: `systembruchsatz` spricht von „Ihr
Warenkorb enthält", und das ist eine andere Lage — im Korb liegt die Ware, im
Vergleich liegt sie noch nicht.

## Die drei Warnungen, ohne die diese Tafel irreführt

1. **Verschiedene Einheiten.** Ein Artikel je m², einer je Stück: Die
   Preisspalte steht nebeneinander und vergleicht nichts. Genau der Befund, aus
   dem der Kilovergleich entstanden ist. Preisspalten tragen in diesem Fall
   zusätzlich den Vermerk „nicht vergleichbar".
2. **Verschiedene Systeme.** Baumit-Kleber neben Capatect-Gewebe: Beide Preise
   sind richtig, und wer beide kauft, verlässt die geprüfte Zusammenstellung
   (ETAG 004, ÖNORM B 6400). Die Warnung nennt beide Systeme, nennt die Rollen
   und sagt ausdrücklich, dass sie **keine Kaufempfehlung** ausspricht.
3. **Verschiedene Warengruppen.** Eine Dämmplatte neben einem Kanalrohr: Die
   Tafel rechnet, der Vergleich bedeutet nichts.

Alle drei stehen **über** der Tafel und nicht darunter: Sie sind die Bedingung,
unter der die Zahlen gelten — dieselbe Entscheidung wie bei der Liefernotiz
über dem Warenraster.

## Wo die Tafel steht — und warum nicht auf der Artikelseite

Gebaut war sie zuerst auf jeder Artikelseite. `npm run pruefe-dubletten` ging
daraufhin von vier Paaren über die Grenze 0.98 rot, nachdem das höchste Paar
vorher bei 0.97 lag. Erst sah es nach zu viel Prosa aus; gekürzt wurden drei
Paare zu einem. Dann weniger Spalten: 2, 3, 4, 5, 6 Alternativen durchgemessen
— das Paar blieb. Ein zusätzliches, unterscheidendes Merkmal (`Winkel`) half
auch nicht.

Die Ursache war nicht die Menge, sondern die Richtung:

> **Eine Tafel, die A auf B zeigt und B auf A, gibt beiden Seiten denselben
> Wortschatz** — und für eine Suchmaschine sind zwei Seiten mit demselben
> Wortschatz eine Antwort.

Die Tafel steht seither auf der **Gruppenseite**, einmal über alle bepreisten
Artikel der Gruppe, Artikel als Zeilen und Merkmale als Spalten. Sechs
Gruppenseiten tragen sie, 34 Artikelseiten tragen stattdessen einen Verweis
dorthin. Das höchste Paar liegt wieder bei 0.97. Spalten, in denen kein
einziger Artikel einen Wert hat, fallen heraus und werden unter der Tafel
genannt — eine leere Spalte ist keine Auskunft, ihr Fehlen aber eine.

## Der Prüfer stand nicht, als er grün war

`src/artikelvergleich.js` trägt acht Regeln, jede mit einem Testfall, der sie
feuern lässt. Die achte fehlte, und gefunden hat das die Gegenprobe: Die
Auswahlregel — gleiche Gruppe, gleiche Einheit, gleiche Schicht — stand im Code
und in keiner Prüfung. Abgeschaltet blieb der Prüfer grün.

> **Eine Regel, die nur im Code steht, ist eine Absicht.** Erst die Gegenprobe
> macht aus ihr eine Zusage.

Gegenprobe 322 (`alternativen-ohne-schicht`) mutiert jetzt genau diese Stelle.
Ihre erwartete Meldung musste ich austauschen: Die erste Fassung erwartete den
Namen der neuen Regel, rot wurde der Lauf aber über die Systemwarnung, die
denselben Fehler eine Zeile früher sieht — *rot, aber nicht wegen*. Erwartet
wird jetzt das gemessene Muster.

## Sieben eigene Fehler, und wer sie gefunden hat

| Fehler | Gefunden von | Satz |
|---|---|---|
| `alleGleich` war wahr, wenn alle Werte `null` waren — die Tafel hob dann eine „Übereinstimmung" hervor, die aus drei Lücken bestand | eigener Testfall | ***Dass niemand etwas weiß, ist keine Übereinstimmung.*** |
| Alternativen über Systemschichten hinweg | Blick auf die gebaute Seite | ***Zwei Artikel, die zusammen gekauft werden, sind keine Alternativen.*** |
| „palettiert" auf 15 Seiten ohne Herkunft | `pruefe-sperrgut` | Eine Lesart, die als Eigenschaft dasteht |
| Vier Dublettenpaare über 0.98 | `pruefe-dubletten` | ***Eine Tafel, die A auf B zeigt und B auf A, gibt beiden Seiten denselben Wortschatz.*** |
| Drei doppelte Sätze — die Weisung zweimal zitiert, die Weigerung über die fehlende Preisdatei abgeschrieben, ein Satz aus `bin/regelpruefung.mjs` wörtlich übernommen | `pruefe-saetze` | Die Weigerung liegt jetzt als `preisdateiWeigerung()` an einer Stelle |
| Drei Testschleifen ohne Längenzusicherung — eine leere Liste wäre grün durchgelaufen | `pruefe-tests` | Eine Schleife über nichts prüft nichts |
| Der Merkblattblock stand **vor** den Vergleichstafeln, und damit sah seine eigene Prüfung nicht, was danach noch auf die Seite kam | `test/merkblattverweis.test.js` | ***Eine Regel über den Quelltext einer Seite übersieht, was der Bau dazuschreibt — und eine, die zu früh läuft, auch.*** |

Und ein achter, der kein Fehler im Code war: **Drei meiner eigenen Testfälle
waren falsch.** Einer sicherte eine Reihenfolge bei gleichem Preisabstand zu —
die gibt es nicht, und sie zuzusichern wäre genau die Empfehlung, die dieser
Vergleich vermeidet. Einer erfand einen Artikelnamen, den `einordnung` nicht
kennt. Und einer ließ `vergleichsbefund` über zwei Vorlagen laufen statt über
den Katalog:

> **Ein Register, das über den ganzen Katalog gilt, lässt sich nicht an zwei
> Artikeln freisprechen.**

## Was offen bleibt, gemessen

**Die Schichtregel greift bei 11 von 46 Artikeln.** `SCHICHTEN` in
`src/systemtreue.js` kennt acht Rollen, und 35 Artikel fallen in keine davon —
in der Gruppe Kamin fünf von neun (Regenhaube, Zuluftplatte, Fertigfußpaket,
Putztüranschlusspaket, Thermo-Trennstein). Für sie ist die dritte Bedingung
wirkungslos, sie gelten einander weiter als Alternativen, und das sind sie
nicht. Die Tafel ist dadurch nicht falsch — sie steht auf der Gruppenseite über
alle Artikel —, aber der Verweis von der Artikelseite kann auf eine Zeile
zeigen, die daneben liegt. Was fehlt, sind Rollen für die restlichen Gruppen,
und die gehören gemessen und nicht geraten.

**Nicht gebaut: eine Empfehlung.** Keine Spalte „empfohlen", keine Hervorhebung
des günstigeren Artikels über den Preisvorteil hinaus, der ohnehin dasteht. Wer
zwei Mantelsteine vergleicht, braucht keine Meinung des Shops, sondern die
beiden Zahlen und den Hinweis, wann sie sich nicht vergleichen lassen.

## Zahlen des Tages

| | |
|---|---|
| Prüfer im Schnelllauf | 61 → **62** (`npm run pruefe-vergleich`) |
| Gegenproben im Register | 321 → **322** |
| Tests | 2761 → **2786** grün, 0 rot |
| Merkmale im Vergleich | 11, davon 4 abgeleitet |
| Regeln im Register | 8, jede mit einem Testfall, der sie feuern lässt |
| Gruppenseiten mit Tafel | 6 · Artikelseiten mit Verweis: 34 |
| Ähnlichstes Seitenpaar | 0.97 (Grenze 0.98) |
