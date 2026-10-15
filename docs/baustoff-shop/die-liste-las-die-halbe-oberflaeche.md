# Die Liste las die halbe Oberfläche

**4. September 2026, Abend.** Vier Runden Bestellweg: entschieden (Gate 26),
gebaut, an laufendem PHP geprüft, einmal von Ende zu Ende gefahren, um fünf
fehlende Formularfelder ergänzt, und seit einer Stunde führt `npm run
posteingang` die Kette bis zum Angebot.

Dann habe ich `npm run startklar` mit einer vollständig beantworteten
Betreiberdatei laufen lassen — also so, wie es am Tag der Freigabe aussähe:

```
✗ Der Kunde kann eine Bestellung abschicken
    die Oberfläche schickt nichts ab; die Kasse rechnet und erzeugt einen
    Anfragetext zum Kopieren.
```

> **Die Bereitschaftsliste sagte weiter, es gebe keinen Bestellweg.**

## Warum

`bin/startklar.mjs` las `shop-ui.js`, und daneben stand der Kommentar, der es
begründete:

> *Ob diese Seite eine Bestellung abschicken kann, steht in **ihr** und nicht
> in einer Datei daneben.*

Seit dem Nachmittag steht das Absenden in einer Datei daneben. Mit gutem
Grund: Ein schlafendes `fetch(` im Bündel machte die Datenschutzzusage von
einer Tatsache zu einer Behauptung über den Kontrollfluss, und der
Datenschutzprüfer hat das damals sofort gemeldet.

**Beide Entscheidungen waren richtig. Zusammen ergaben sie einen Prüfer, der
das Falsche liest.** Das ist die Sorte Fehler, die keine der beiden Runden
allein finden konnte: Die eine schob den Code weg, die andere fragte an der
alten Stelle nach.

## Zusammengesetzt wird jetzt an einer Stelle

`oberflaeche(lies, aktiv)` in `src/bestellwegbau.js` — dort, wo der Schalter
steht. `npm run website` und `npm run startklar` rufen beide sie.

> **Zwei Fassungen der Zusammensetzung wären zwei Antworten auf die Frage, was
> der Browser bekommt.**

Danach kippt der Punkt in beide Richtungen richtig: mit den heutigen Daten
„schickt nichts ab", mit vollständiger Betreiberdatei „der Weg besteht". Ein
Testfall hält beide Richtungen; die Gegenprobe
`bereitschaft-liest-die-halbe-oberflaeche` nimmt das Anhängen wieder heraus
und verlangt, dass es auffällt.

## Und der Punkt zeigt jetzt auf den Richtigen

Er stand mit `wer: 'Werkzeug'` in der Liste, und das war richtig, solange der
Weg nicht gebaut war. Er ist gebaut; was ihn anhält, sind zwei Angaben des
Auftraggebers — die E-Mail-Adresse und der Rechtstextewortlaut, beide mit
eigenem Punkt in derselben Liste.

> **Ein Punkt, der auf meiner Seite steht und auf eine fremde Antwort wartet,
> wird nie geschlossen.** Er hätte die Liste dauerhaft rot gehalten und dabei
> auf den Falschen gezeigt.

## Was heute noch offen ist

Mit vollständig beantworteter Betreiberdatei bleiben **zwei** Punkte:

- der Bestellweg — hängt an E-Mail und Rechtstexten, beide in derselben Liste,
- die **Lieferzeit des Lieferanten** — eine der fünf Fragen an ihn, und die
  einzige, die auch nach der Freigabe aller Betreiberangaben offen bliebe.

Damit steht die Kette vollständig, und was sie anhält, ist nicht mehr Bauen,
sondern Antworten: vier Impressumsangaben, ein Rechtstexteauftrag, ein
Lieferantengespräch.

## Und dann war die Platte voll

Der Gesamtlauf danach brach mit `ENOSPC` ab. Unter `/tmp` lagen **63 082
Einträge**.

Zwölf Proben und Werkzeuge legen sich ein Wegwerfverzeichnis an, und nur acht
räumten es weg. Die teuerste ist die neueste: `npm run bestellprobe` baut
darin eine vollständige Website — rund zehn Megabyte je Lauf, und im
Gesamtlauf läuft sie mehrfach.

> **Eine Probe, die ihre Spuren behält, wird irgendwann selbst der Fehler.**
> Sie meldete nichts; die Maschine tat es, dreißig Läufe später und an einer
> Stelle, die mit ihr nichts zu tun hatte.

`src/wegwerf.js` legt den Ordner an und räumt ihn über `process.on('exit')`
wieder weg — **nicht** in einem `finally`: Ein `finally` läuft nicht bei
`process.exit()`, und genau so enden die meisten dieser Werkzeuge. Dieselbe
Lehre wie beim Mutationsschutz vom Vormittag, nur in die andere Richtung.

Zwanzig Dateien sind umgestellt. Ein Testfall verbietet den direkten Aufruf:
Wer `mkdtempSync` ruft, umgeht das Aufräumen. Drei weitere fahren den
Nachweis an **eigenen Prozessen** — im laufenden Testprozess ist der Ordner
noch da, und das ist richtig so; was zählt, ist das Danach, auch bei
`process.exit(3)`.

`WEGWERF_BEHALTEN=1` lässt sie für die Fehlersuche stehen.

## Was das für den Auftraggeber ändert

Nichts an seiner Liste, und eines an ihrer Verlässlichkeit: Bis heute Abend
hätte sie ihn am Tag der Freigabe angelogen — in die vorsichtige Richtung, aber
angelogen. Er hätte alles beantwortet und wäre auf einem roten Punkt sitzen
geblieben, der auf mich zeigte und längst erledigt war.
