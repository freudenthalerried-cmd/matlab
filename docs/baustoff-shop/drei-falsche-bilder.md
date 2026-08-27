# Drei falsche Bilder — und die Prüfung, die sie nicht sehen konnte

**27. August 2026.** Weisung: „mehr Bilder, eher auf die Produkte
konzentrieren". Bilder gibt es seit dem 26.: 14 Bauformen, maßstäblich
gezeichnet, für alle 46 Artikel. Beim Durchzählen der Zuordnung fiel auf, dass
**drei davon das falsche Bauteil zeigten**.

| Artikel | gezeichnet wurde | richtig ist |
|---|---|---|
| Soudal Profi-Pistolen**schaum** | eine Kartuschenpistole | eine Dose |
| Mantelstein**kleber** Dünnbettmörtel | ein Mauerstein | ein Sack |
| Putztüranschluss**paket** | ein Sack (wegen „Putz") | ein Formteil |

## Die Ursache

Die Formerkennung suchte das Formwort **irgendwo** in der Bezeichnung. Im
Deutschen steht der Kopf eines Kompositums aber hinten:

> Ein Mantel**stein** ist ein Stein. Ein Mantelstein**kleber** ist keiner.

Es ist derselbe Fehler wie bei `marke()` im Seitenbauwerkzeug, wo „SIK" das
Wort „Sikkativ" fand — nur andersherum. Dort war jeder Treffer im Wortinneren
falsch; hier ist er nur falsch, wenn hinter dem Formwort noch ein Wortteil
folgt.

**Behoben** mit einer Wortende-Prüfung `(?![\p{L}])` und `/u` — nicht mit
`\b`, denn JavaScripts Wortgrenze ist ASCII und kennt kein „ö"; dieselbe
Falle steht seit dem 25. August in `inhaltspruefung.js` angeschrieben.
Ziffern und Bindestriche beenden ein Wort weiterhin, sonst wären „PAE-Folie",
„Kanalbogen 45" und „Thermo-Trennstein 12-18" mit repariert worden statt
erhalten. Typenkürzel (EPS, XPS, TDPT, N+F) werden bewusst weiter im ganzen
Text gesucht — sie sind keine Kompositumsköpfe.

## Der eigentliche Befund: die Prüfung sah nur hin, ob überhaupt etwas da war

Es gab einen Test über alle 46 Artikel. Er prüfte: ist es ein SVG, hat es das
richtige Feld, hat es eine Bildbeschreibung, steht kein `NaN` drin. Alle drei
falschen Bilder bestanden ihn mühelos.

> **Eine Prüfung, die fragt „ist es ein Bild?", beantwortet nicht die Frage
> „ist es das richtige Bild?".**

Das ist die vierte Ausprägung desselben Musters in diesem Projekt — nach dem
Prüfer, der das Modell statt der Ausgabe las, dem Prüfer, dessen Voreinstellung
auf die Probedatei zeigte, und der Zusage im Kommentar, die keine Probe
widerlegen konnte (gestern, bei „keine Kappung").

**Neu deshalb: ein Schlüssel statt einer Regel.** `SOLLFORM` in
`test/bilder.test.js` hält für jeden der 46 Artikel die von Hand entschiedene
Bauform fest — das ist die Angabe, die die Maschine nicht ableiten kann. Ein
neuer Artikel ohne Eintrag lässt den Test durchfallen und erzwingt die
Entscheidung, statt still in „teil" zu landen.

Gegenprobe durch Mutation: Wird die Wortende-Regel auf die alte Teilwortsuche
zurückgedreht, fallen genau die beiden neuen Tests um; die übrigen acht
bleiben grün. Datei aus dem Scratchpad zurückkopiert, nicht `git checkout`.

## Stand

- 698 Tests grün (vorher 695; +3)
- `pruefe-inhalte` 24/355/0, `pruefe-seiten` 54/213/0
- `shopprobe` 23 Szenarien, `oberflaechenprobe` 11, Website 81 Seiten ohne
  toten Verweis
- Die Bildbeschreibungen der drei Artikel lauten jetzt „Kartusche",
  „Sackware" und „Bauteil" statt „Werkzeug", „Mauerstein" und „Sackware" —
  auch für Vorleseprogramme und für maschinelle Leser stimmt das Bild damit.

## Was offen bleibt

Die Zeichnungen sind Schemazeichnungen, keine Produktfotos, und sagen das auf
jeder Seite. Fotos gäbe es beim Hersteller — deren Nutzung ist eine Frage der
Bildrechte und damit eine Entscheidung des Auftraggebers, keine technische.
