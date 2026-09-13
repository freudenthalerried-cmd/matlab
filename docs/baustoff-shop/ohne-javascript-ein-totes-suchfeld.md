# Ohne JavaScript stand auf jeder Seite ein totes Suchfeld

Stand: 2026-08-29

## Die Messung

Was sieht ein Besucher ohne JavaScript? Gemessen an einer Fassung jeder
gebauten Seite, aus der die `<script>`-Blöcke entfernt sind — was dann als
Text übrig ist, ist das, was er liest.

Zuerst die gute Hälfte:

| Seite | Text ohne Skript |
| --- | --- |
| Startseite | 8.531 Zeichen |
| Artikelseite | ~4.000 Zeichen |
| Gruppenseite | 3.270 Zeichen |
| Wissensseite | vollständig |

**Der Inhalt braucht kein JavaScript.** Preise, Mengenangaben, Lieferung,
Merkblattverweise, die ganze Warengruppe — alles steht im ausgelieferten
HTML. Das ist keine Selbstverständlichkeit und war offenbar Absicht; sie war
nur nie nachgemessen.

Und die andere Hälfte: **79 von 81 Seiten trugen ein Bedienelement ohne ein
Wort dazu.** Warenkorb, Kasse und Suchseite erklären sich seit jeher selbst.
Das Suchfeld in der Kopfleiste steht aber auf **allen** Seiten, und der Knopf
„In den Warenkorb" auf allen 46 Artikelseiten — beide sahen aus wie
Bedienelemente und taten nichts.

> **Ein Bedienelement, das aussieht wie eines und nichts tut, ist eine
> Zusage, die der Shop nicht hält.**

## Was jetzt dasteht

Auf jeder Seite, direkt vor der Kopfleiste, und nur sichtbar, wenn es
zutrifft:

> **Ohne JavaScript** arbeiten Suchfeld und Warenkorb nicht. Alle Artikel-,
> Wissens- und Gruppenseiten sind vollständig lesbar; das Sortiment steht
> über die Warengruppen in der Kopfleiste.

Gesagt wird, was **nicht** geht — und wohin es stattdessen geht. Die
Warengruppen in der Kopfleiste sind gewöhnliche Verweise und funktionieren
ohne Skript; über sie ist das ganze Sortiment erreichbar.

## Ein Prüfer, der beides verlangt

Der Test geht über alle 81 Seiten und verlangt zweierlei: den Hinweis **und**
mindestens 800 Zeichen Text in der skriptlosen Fassung. Die zweite Hälfte ist
die wichtigere — ein Hinweis auf einer leeren Seite wäre eine Entschuldigung
statt einer Auskunft. Warenkorb, Kasse und Suche sind ausgenommen und
benannt; ihr Inhalt entsteht wirklich erst mit dem Skript, und sie sagen es.

Gegengeprobt durch Entfernen des Hinweises: Der Testfall fällt.

## Eine Nebenwirkung, die eine alte Lücke schließt

`npm run pruefe-seiten` prüfte bis heute früh **58 von 81** gebauten Seiten;
die übrigen 23 trugen keinen eigenen Absatz, weil ihr ganzer Text aus
`inhalte/` stammt und dort geprüft wird. Seit jede Seite den Hinweis trägt,
sind es **81 von 81**.

Ehrlich dazugesagt: Der zusätzliche Absatz ist auf allen Seiten derselbe. Die
Abdeckung ist echt, aber sie ist nicht dadurch entstanden, dass mehr Text
geprüft würde — sondern dadurch, dass jede Seite jetzt einen eigenen hat.

Und der Bericht musste nachziehen. Er endete mit „Die übrigen 0 tragen keinen
eigenen Absatz" — ein Satz, der bei einer runden Zahl sinnlos wird. **Ein
Bericht, der den Grenzfall nicht vorgesehen hat, ist an dieser Stelle nicht
fertig gedacht.** Jetzt: „Gebaut sind 81 Seiten, und jede trägt mindestens
einen eigenen Absatz."

## Was nicht geht und nicht gehen soll

Eine Suche ohne Skript. Sie bräuchte einen Server, der sucht; die Seite ist
eine Datei. Der Ausweg steht im Hinweis und ist der richtige: die
Warengruppen.
