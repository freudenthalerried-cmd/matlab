# Die Schuld lag im eigenen Absatz

*5. September 2026. Runde 122.*

## Der Satz, der nie nachgerechnet wurde

`npm run pruefe-dubletten` endete seit dem 4. September mit diesem Schluss:

> *Der gemeinsame Anteil ist damit nicht klein — er ist die Grenze dessen, was
> aus fünfzehn Lieferantenrechnungen zu holen ist. Was ihn wirklich senkt,
> steht als offener Punkt: die Artikelliste aus dem Kundenkonto.*

Derselbe Satz stand in den offenen Punkten, im Brief an den Lieferanten und in
zwei Dokumenten. **Gemessen war er nie.** Der Prüfer kannte eine einzige Zahl
— den Anteil über die ganze Seite — und die sagt nicht, *wessen* Gleichheit
sie zählt.

> **Eine Gesamtzahl sagt, wie viel gleich ist. Sie sagt nicht, wer es ändern
> kann.**

## Nachgezählt

Der eigene Text einer Artikelseite zerfällt an ihren Zwischenüberschriften in
drei Abschnitte. Je Abschnitt gezählt:

| Abschnitt | auf jeder Seite | Median | Fassungen |
|---|---|---|---|
| **Lieferung** | **93 von 109 Wörtern (85 %)** | 0,81 | 46, größte auf 1 |
| Kopf und Preistafel | 26 von 83 (31 %) | 0,57 | 46, größte auf 1 |
| Technische Kennwerte | 5 von 44 (11 %) | 0,06 | **6, größte auf 22** |

Der Befund steht in der ersten Zeile. **Der Lieferabsatz ist zu 85 % auf jeder
der 46 Seiten derselbe** — Frachtsätze, Kranentladung, „warum es kein frei
Haus gibt", Mindestbestellwert. Das ist unser eigener Text. Er wird durch
keine Artikelliste, keine EAN und kein Produktbild kürzer.

Was die Lieferantenliste wirklich löst, steht in der letzten Zeile: Der
Abschnitt „Technische Kennwerte" hat auf 46 Seiten nur **sechs Fassungen**,
die größte auf 22 — und alle sechs sind Platzhaltersätze („Für diesen Artikel
liegt uns kein Herstellermerkblatt vor"). Das ist ein echtes Argument für die
Anfrage, nur ein kleineres als das behauptete.

> **Ein Befund, der die Ursache beim Dritten sucht, während sie im eigenen
> Haus liegt, macht aus einer lösbaren Aufgabe eine blockierte.**

Und er stand in einem **Brief an einen Dritten**. Dort hieß es: „Hersteller,
EAN, Verpackungseinheit und ein Produktbild je Artikel sind das Einzige, was
daran etwas ändert." Ein Brief, der seine Bitte mit einer falsch
zugeschriebenen Zahl begründet, ist schlechter als einer, der weniger
verlangt und richtig rechnet. Beide Stellen sind berichtigt.

## Drei Zahlen, weil keine allein genügt

Beim Bauen der Aufschlüsselung ist aufgefallen, dass jede einzelne Kennzahl
für sich in die Irre führt.

* **Der Schnitt** — was auf ausnahmslos jeder Seite steht — ist streng: Ein
  einziger Ausreißer drückt ihn auf null. Bei „Technische Kennwerte" meldet er
  11 %, obwohl 22 Seiten wortgleich sind.
* **Der Median** über alle Paare ist robust gegen Ausreißer und hier trotzdem
  irreführend: Die Verteilung hat **zwei Gipfel**. 22 Seiten tragen die eine
  Fassung, 24 die andere, damit sind mehr Paare kreuz als gleich, und der
  Median landet bei 0,06.
* **Die Fassungszahl** sagt es einfach: *sechs verschiedene Texte auf 46
  Seiten, der häufigste auf 22.* Das ist der Satz, nach dem jemand handeln
  kann.

Umgekehrt beim Lieferabsatz: 46 Fassungen, jede einmal — weil Preise und
Mengen darin stehen. Nach der Fassungszahl allein wäre er der
**unterschiedlichste** Abschnitt der Seite. Er ist der gleichförmigste.

> **Wortgleichheit und Textgleichheit sind nicht dasselbe.** Ein Absatz, in
> dem sich nur die Zahlen ändern, ist sechsundvierzigmal ein anderer Text und
> sechsundvierzigmal dieselbe Aussage.

## Und eine Berichtigung an der Messung selbst

Der Kopfkommentar der Funktion sagte seit dem 3. September, Kopf, Fuß,
Skript und Querverweise fielen heraus, „sie stehen auf jeder Seite gleich und
sind Navigation, kein Inhalt". Drei Stück Navigation standen trotzdem drin:

* der `<noscript>`-Hinweis — dreißig Wörter, auf allen 46 Seiten wortgleich,
* der `<head>` mit dem Seitentitel,
* die Sprungmarke „Zum Inhalt springen", die außerhalb der Kopfleiste sitzt,
  damit sie als Erstes angesprungen wird.

Der gemeldete Anteil sinkt dadurch von **62 % auf 58 %**. Das ist **keine
Verbesserung der Seiten** — sie sind Wort für Wort dieselben geblieben. Es ist
eine Berichtigung der Messung, und sie geht in die angenehme Richtung; deshalb
steht sie hier ausdrücklich und nicht nur im Änderungsprotokoll. Vier
Dokumente, die 62 % im Präsens behaupteten, tragen jetzt ihre Berichtigung.

Gegenprobe `navigation-als-inhalt` setzt die alte, kürzere Ausschlussliste
wieder ein und muss den Testlauf umwerfen. **52 Gegenproben für 31 Prüfer.**

## Was jetzt zu tun wäre — und was ausdrücklich nicht

**Nicht:** den Lieferabsatz kürzen. Er steht dort, weil ein Bauleiter beim
Artikel wissen muss, was die Zustellung kostet und ab wann die Kasse annimmt.
Text zu löschen, um eine Kennzahl zu verbessern, wäre der schlechteste aller
Wege — die Kennzahl ist Diagnose, kein Ziel.

**Sondern:** den Absatz je Artikel etwas anderes sagen lassen. Sperrgut,
Sackware und Ringbund werden verschieden zugestellt; heute steht der
Unterschied in den Zahlen und nicht in den Sätzen. Das ist eigene Arbeit, sie
hängt an keiner fremden Antwort — und genau das war unter dem alten Schluss
nicht zu sehen.

## Die Lehre

> **Wer eine Zahl nennt und gleich daneben ihre Ursache, hat zwei Aussagen
> gemacht und eine gemessen.** Die Zahl war nachrechenbar, die Ursache war
> eine Vermutung — und sie zeigte bequemerweise auf jemanden, der nicht
> antwortet.
