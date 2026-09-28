# Eine Erwartung, die auch auf Grün passt

**7. September 2026.** Der Gegenprobenläufer sichert vier Dinge zu, und keines
reicht allein:

1. Der Prüfer ist **vorher grün**.
2. Die Mutation ist **angekommen**.
3. Er meldet **rot** und **nennt die erwartete Stelle**.
4. Nach dem Zurücksetzen ist er **wieder grün**.

Die dritte ist die einzige, die etwas über den *Grund* sagt. Geprüft wurde sie
gegen die **ganze** rote Ausgabe des Prüfers.

---

## Gemessen: 34 von 101

Alle 38 Prüfer einmal grün gelaufen — mit frischem Bau, sonst weigern sich die
Erzeugnisleser und man misst ihre Weigerung — und jede Erwartung des Registers
gegen diese grüne Ausgabe gehalten:

**34 von 101 Erwartungen passen schon auf Grün.**

Bei `npm test` sind es fast alle, und der Grund ist banal: TAP nennt **jeden**
Testfall beim Namen. `ok 42 - die Sitemap trägt ein Änderungsdatum` steht in
der grünen Ausgabe genauso da wie `not ok 42 - …` in der roten. Eine Erwartung,
die auf den Namen des Testfalls zielt, trifft ihn in beiden Läufen.

Bei den übrigen ist es dieselbe Sorte: `pruefe-widerrufe` zählt sein Register
auf, also steht die Regel-Kennung `fracht-auf-jedem-beleg` auch dann in der
Ausgabe, wenn nichts gefunden wurde.

> **Eine Erwartung, die auch auf Grün passt, sagt nur, dass es rot ist — nicht,
> warum.**

Für ein Drittel der Einträge war die dritte Zusicherung damit dieselbe Aussage
wie die zweite. Das sah aus wie zwei Prüfungen und war eine.

---

## Die Regel: verglichen wird, was neu ist

`neueMeldungen(vorher, nachher)` gibt die Zeilen zurück, die in der roten
Ausgabe stehen und in der grünen nicht standen. Die Erwartung wird nur noch
gegen die gehalten.

Bei einem Testlauf ist das genau die eine Zeile `not ok … — <Name>`: In Grün
stand dort `ok`, die Zeile ist also neu, und der Name ist wieder eine
belastbare Auskunft — er sagt jetzt, **welcher** Testfall gefallen ist. Bei
einem Prüfer ist es die Fundzeile mit Datei und Zeilennummer.

Verglichen wird zeilenweise und beschnitten: Einrückung und Laufzeiten
verschieben sich zwischen zwei Läufen ohnehin.

**Was die Regel nicht kann:** Sie prüft nicht, ob eine Erwartung scharf
*formuliert* ist — nur, ob sie an einer Stelle greift, die es ohne die Mutation
nicht gäbe. Ein `/Abweichung/` bleibt ein weites Wort. Aber es muss jetzt in
einer Zeile stehen, die die Mutation erzeugt hat.

---

## Was die schärfere Regel sofort gefunden hat

**Zwei von 98 Gegenproben gingen nicht mehr durch.** Beide waren echte Funde,
keine Fehlalarme.

**Erstens: `mehr-lieferungen-als-lieferanten`.** Die Mutation lässt den Satz
über mehrere Lieferungen wieder unabhängig von der Lieferantenzahl stehen. Rot
wird davon genau ein Testfall — der über den **Satzbaustein**. Der Korpusfall
über alle 82 gebauten Seiten wird **nicht** rot, und das ist folgerichtig:
Die Seiten entstehen aus derselben mutierten Quelle. Seite und Prüfer sind
sich einig, und beide irren gemeinsam.

> **Ein Korpus, der aus der geprüften Quelle gebaut wird, bestätigt sie.**

Die Erwartung zeigt jetzt auf den Testfall, der tatsächlich fällt.

**Zweitens: `widerruf-ohne-widerruf`.** Sie erwartete die Regel-Kennung, und
die zählt der Prüfer immer auf. Sie zeigt jetzt auf die Fundzeile mit Datei
und Zeilennummer — die gibt es ohne die Mutation nicht.

---

## Und ein Nachtrag zur Vorrunde

Der Suchtextprüfer von heute Vormittag liest das ganze Register gegen die
Dateien. Während eine Gegenprobe läuft, steht die Datei, die sie mutiert, aber
nicht so da wie im Register — ihr Suchtext ist gerade ersetzt. Der Prüfer
meldete deshalb bei **jeder fremden Mutation** `suchtext-passt-nicht` über eine
Stelle, die es eine Minute später wieder gibt.

> **Ein Prüfer, der den Bestand liest, während ein anderer ihn absichtlich
> verstellt, misst die Verstellung.**

Aufgefallen ist das erst durch die schärfere Regel dieser Runde: Der Testlauf
ging rot, und zwar an einer Zeile, die mit der geprüften Mutation nichts zu tun
hatte. Unter der alten Regel wäre das nie sichtbar geworden — irgendeine Zeile
der roten Ausgabe passte immer.

Übersprungen wird jetzt, was einen **offenen Mutationszettel** trägt, und nur
das: Der Zettel liegt genau so lange, wie die Mutation steht. Die Liste dafür
ist keine eigene — es ist dieselbe, an der `pruefe-mutationen` liegen
gebliebene Mutationen erkennt.
