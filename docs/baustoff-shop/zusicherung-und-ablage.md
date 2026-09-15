# Die Ablage ist die einzige Stelle, aus der nichts mehr verschwindet

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Die Vorrunde hat den Befund benannt: Der **Ansprechpartner vor Ort** auf der
Baustelle ist ein Dritter, der Shop gibt seine Rufnummer an Lieferant und
Spedition weiter, und Art. 14 DSGVO verlangt, ihn zu informieren — eine Person,
die der Shop nie erreicht.

Diese Runde baut den einzigen Weg, der offensteht. Und stößt beim Bauen auf
einen zweiten Ort, an dem dieselben Daten liegen könnten — den schlechtesten
von allen.

## Die Zusicherung

Der Shop erreicht den Dritten nicht. Der Besteller schon: Er hat ihn benannt,
er kennt ihn, er steht mit ihm auf derselben Baustelle.

`ZUSICHERUNG_DRITTER` in `rechtstexte.js` hält den Wortlaut an **einer** Stelle:

> Ich habe den genannten Ansprechpartner vor Ort darüber informiert, dass sein
> Name und seine Telefonnummer zur Zustellung an den Hersteller und dessen
> Spedition weitergegeben werden.

`pruefeBestelldaten` verlangt den Haken, sobald eine abweichende Baustelle
angegeben ist — ohne ihn keine gültige Bestellung, genau wie bei der
Unternehmerbestätigung nach Gate 7.

Drei Entwurfsentscheidungen, jede mit einem Grund:

**An die Baustelle geknüpft, nicht an eine Namensprüfung.** Ob der genannte
Ansprechpartner der Besteller selbst ist, kann der Shop nicht zuverlässig
erkennen. Eine Kästchenauswahl zu viel kostet den Kunden nichts, eine zu wenig
kostet die Grundlage.

**Ohne Baustelle wird sie nicht verlangt.** Dann gibt es keinen Dritten. Eine
Bestätigung ohne Anlass gewöhnt Kunden daran, Kästchen ungelesen anzuhaken —
und entwertet die, auf die es ankommt.

**Der Wortlaut steht in `rechtstexte.js`, die Oberfläche holt ihn von dort.**
Ein Zusicherungstext, der an zwei Stellen lebt, weicht irgendwann voneinander
ab. Ein Testfall besteht darauf, dass das geprüfte Feld dasselbe ist, das der
Wortlaut nennt.

**Was die Zusicherung nicht ist:** die Erfüllung der Pflicht durch den Shop.
Sie ist die Verlagerung auf denjenigen, der sie erfüllen kann, und die
Dokumentation, dass danach gefragt wurde. Ob das genügt, entscheidet der
Rechtstexteanbieter aus `phase5-technik.md`. Der Eintrag in `DATENFLUESSE`
führt deshalb **beides**: die Maßnahme und die offene Frage. Eine offene Frage
ohne Maßnahme ist eine Notiz; eine Maßnahme ohne offene Frage wäre eine
Beschönigung.

## Der zweite Ort — und warum er der schlechteste ist

Beim Bauen kam die Frage auf: Wo überall liegt diese Rufnummer eigentlich?

| Ort | Rufnummer drin? | |
|---|---|---|
| Bestelltext an den Lieferanten | ja | gehört hin, dafür ist sie da |
| Auftragsbestätigung an den Kunden | ja | er hat sie selbst angegeben |
| Rechnung | nein | |
| **Journal der Ablage** | **nein** | **aus Zufall, nicht aus Absicht** |

Die Ablage ist die einzige Stelle, aus der nichts mehr verschwindet. § 131 BAO
verlangt, dass der ursprüngliche Inhalt feststellbar bleibt; § 132 verlangt
sieben Jahre Aufbewahrung. **Eine Löschung nach Art. 17 DSGVO läuft dort ins
Leere** — und muss es auch, denn Art. 17 Abs. 3 lit. b nimmt gesetzliche
Aufbewahrungspflichten ausdrücklich aus.

Genau deshalb gehört dorthin nur, was die Aufbewahrungspflicht **verlangt**. Die
Rufnummer eines Poliers verlangt sie nicht. Wer sie ins Journal schreibt,
schafft einen Eintrag über einen Dritten, den niemand mehr löschen kann und für
den es keinen Grund gibt, ihn zu behalten.

Heute steht sie nicht drin, weil `ablageEintraege` nur den **Betreff** der
Bestellung ablegt, nicht ihren Text. Das war keine Entscheidung — es war
bequem. Eine Zeile `text: b.text` statt `text: b.betreff`, geändert „für mehr
Nachvollziehbarkeit", und die Nummer liegt sieben Jahre unlöschbar im Journal.

`pruefeAblageAufDrittdaten` in `kontrolle.js` macht aus dem Zufall eine
Zusicherung. Gegenprobe: genau diese Änderung vorgenommen → der Testfall fällt.

```
Eintrag 1 (lieferantenbestellung): Rufnummer des Ansprechpartners steht im Journal
```

## Geprüft

| | |
|---|---|
| neue Testfälle | 10 |
| Testfälle gesamt | 345, alle grün, 0 mit Verdacht |

Gegenproben, beide sofort rot:

| Mutation | |
|---|---|
| Zusicherung wird nicht mehr verlangt | 2 Testfälle fallen |
| Ablage speichert den Bestelltext statt des Betreffs | 1 Testfall fällt |

Am gebauten Bündel nachgesehen: Das Kästchen ist verborgen, bis eine Baustelle
angegeben wird; sein Text kommt aus `rechtstexte.js`; ohne Haken wird die
Bestellung mit dem Hinweis auf Art. 14 DSGVO abgewiesen, mit Haken geht sie
durch und die Baustelle steht im Bestelltext.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. 3.900,20 € brutto und 34,2 %
Mischmarge bleiben; alle Preise sind Platzhalter.

Was bleibt, ist eine Frage für den Rechtstexteanbieter — und ein Satz, der über
diese Runde hinausreicht: **Was in die Ablage geht, geht für sieben Jahre
hinein.** Bisher war das eine Aussage über Rechnungsnummern und
Unveränderbarkeit. Sie gilt genauso in die andere Richtung: Jedes Feld, das man
dort „zur Sicherheit" mitschreibt, ist ein Feld, das man sieben Jahre lang nicht
mehr loswird.
