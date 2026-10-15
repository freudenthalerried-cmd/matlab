# Was der Besteller danach liest

**4. September 2026, Abend.** Zwei Sätze in diesem Bestand beschrieben nach
den heutigen fünf Runden noch den Zustand von vorgestern. Beide sind
Auskünfte, auf die sich jemand verlässt — der eine der Auftraggeber, der
andere der Kunde.

## Der Satz für den Auftraggeber

`npm run offenepunkte` führt den Bestellweg unter „Liegt vor, fehlt nur in der
Datei" und begründete ihn so:

> *die Oberfläche schickt nichts ab; die Kasse rechnet und erzeugt einen
> Anfragetext zum Kopieren.*

Das ist der Satz eines Shops, für den nichts gebaut ist. Gebaut ist seit heute
alles: Empfangsskript, Formular, Ablage, Posteingang — und einmal von Ende zu
Ende gefahren.

> **Ein Befund, der die Vergangenheit beschreibt, ist eine Falschauskunft —
> auch wenn er in die vorsichtige Richtung irrt.** Er hätte den Auftraggeber
> glauben lassen, hier stehe Arbeit aus, während zwei Einträge in seiner
> eigenen Datei fehlen.

Der Punkt sagt jetzt:

> *der Bestellweg ist gebaut und ausgeschaltet — es fehlen betreiber.email,
> rechtstexteFundstelle. Bis dahin rechnet die Kasse und erzeugt einen
> Anfragetext zum Kopieren.*

Und er sagt weiterhin den alten Satz, wenn er stimmt: Sind beide Angaben da
und findet sich trotzdem kein Absendeweg im ausgelieferten Quelltext, dann
fehlt wirklich der Bau. Ein Testfall hält beide Richtungen, die Gegenprobe
`befund-von-vorgestern` schaltet die Unterscheidung ab und verlangt, dass es
auffällt.

## Der Satz für den Kunden

Nach dem Absenden stand da:

> *Angekommen. Ihre Nummer: B-2026-0001*

Mehr nicht. Der Besteller wusste weder, dass er noch keinen Vertrag hat, noch
wann er etwas hört.

> **Der Vertrag entsteht nach AGB Punkt 2 mit unserer Auftragsbestätigung.**
> Wer das nach dem Absenden nicht liest, hält seine Bestellung für angenommen
> — und plant die Baustelle danach.

Jetzt steht dort die Nummer, die Vertragslage und die zugesagte Antwortzeit.
Die Zeitangabe wird nicht erfunden: Sie kommt aus denselben Betreiberdaten wie
der Satz über dem Anfragetext und fehlt heute noch; dann bleibt sie weg statt
geraten zu werden.

Der Satz wird **gebaut** und nicht aus dem Satz darüber zusammengeschnitten.
Mein erster Wurf tat das — `rueckmeldung.replace(' — wir bestätigen', ', in
der wir')` — und ergab beim ersten Zusammenbau Kauderwelsch: *„…
Auftragsbestätigung (AGB Punkt 2), in der wir Preis, Verfügbarkeit und Termin
innerhalb von 1 Werktag."*

> **Zwei Sätze, die durch Ersetzen auseinander hervorgehen, sind ein Satz, der
> beim ersten Umbau bricht.**

## Die Probe prüft die Zusage, nicht den Wortlaut

`npm run bestellprobe` verlangte den Erfolgssatz **genau** — und ging kaputt,
sobald er um den Hinweis auf AGB Punkt 2 wuchs. Das ist die falsche Richtung:

> **Eine Probe, die auf dem Wortlaut besteht, verbietet die Verbesserung des
> Textes.**

Sie prüft jetzt vier Dinge, die der Besteller lesen muss: dass es angekommen
ist, unter welcher Nummer, dass der Vertrag erst mit der Auftragsbestätigung
entsteht, und die zugesagte Antwortzeit. Dafür trägt die Betreiberdatei der
Probe seit heute auch `antwortzeitWerktage` — ohne sie hätte die Probe den
Satz ohne seine wichtigste Angabe geprüft.

## Was das für den Auftraggeber ändert

Die offenen Punkte sagen ihm ab sofort, was von ihm kommt und was schon steht.
Vorher hätte er aus derselben Liste geschlossen, der Shop könne keine
Bestellungen entgegennehmen, weil dafür nichts gebaut sei — und das ist seit
heute Nachmittag nicht mehr wahr.
