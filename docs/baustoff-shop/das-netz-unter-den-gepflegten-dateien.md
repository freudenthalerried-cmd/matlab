# Das Netz unter den gepflegten Dateien

**Stand: 30. August 2026** · Die Umsetzung dessen, was der vorige Lauf als
offenen Punkt notiert hat. Neu: `shop/src/sicherung.js`,
`shop/bin/sicherung.mjs`, `shop/test/sicherung.test.js`.

## Der Auftrag an mich selbst

Der vorige Lauf endete mit einem Satz, den ich nicht als Notiz stehen lassen
wollte:

> Für alles, was der Auftraggeber liefert und was in `preise/` landet, ist am
> Liefertag eine Sicherung einzurichten, bevor das erste Werkzeug darauf
> läuft.

Der Anlass war ein Vorfall desselben Tages: Eine Gegenprobe hatte die
vertrauliche Preisdatei geleert. Sie ließ sich in einem Befehl aus ihrer
Quelle neu erzeugen — **weil sie abgeleitet ist und nicht gepflegt.** Genau
dieses Netz fehlt für alles, was von Hand entsteht.

## Was gebaut wurde

**Automatisch.** `src/sicherung.js` legt vor jedem Überschreiben eine
datierte Kopie neben das Original:

```
preise/.sicherung/baustoff-preise-2026-08-30T16-39-26.json
```

`bin/katalog-aus-rechnungen.mjs` ruft das für beide Ausgaben auf und meldet
es im Bericht. Wer heute den Katalog neu baut, hat den vorigen Stand noch.

**Von Hand.** `npm run sicherung` kopiert **jede** Datei unter `preise/` —
auch die, die kein Werkzeug schreibt: die Positionstabelle aus den
Rechnungen, das Konditionenblatt des Lagerhauses, die abgetippten Seiten, die
Schachermayer-Belege. Sieben Dateien, die es nur einmal gibt.

Der Aufruf gehört an den Anfang jedes Tages, an dem neue Angaben eintreffen —
vor dem ersten Werkzeug, nicht nach dem ersten Schreck.

## Drei Entscheidungen, die dabei zu treffen waren

**Die Kopie liegt neben dem Original.** Nicht in einem zentralen
Sicherungsordner: Eine Kopie vertraulicher Konditionen, die aus dem
gitignorierten Bereich herauswandert, ist keine Sicherung, sondern ein Leck.
`preise/.sicherung/` bleibt innerhalb des ohnehin ausgeschlossenen Bereichs;
`.sicherung/` steht zusätzlich in `.gitignore`, damit auch die Kopien des
öffentlichen Katalogs nicht ins Repository geraten. Wofür es `git` gibt,
braucht es keine Kopie — und wofür es keines gibt, darf sie nicht hinein.

**Zehn Stände je Datei, der älteste fällt.** Eine Grenze, die man nachrechnen
kann, statt eines Ordners, der stillschweigend wächst.

**Der Aufräumer fasst nur an, was er selbst angelegt hat.** Er löscht
ausschließlich Namen, die auf Stamm **und** Zeitstempel passen. Ein
Aufräumer, der nach lockerem Muster löscht, ist gefährlicher als das
Volllaufen, das er verhindert — deshalb steht als Testfall da, dass
`preise-von-hand.json` und `notiz.txt` im selben Ordner unberührt bleiben.

## Der Fehler, den der eigene Test gefunden hat

Der erste Wurf hatte **zwei** Begriffe von „Stand dieser Datei": Der
Aufräumer prüfte streng gegen den Zeitstempel, die Auflistung locker mit
`startsWith`. Die Probe meldete elf Stände, wo zehn stehen sollten — sie
zählte eine fremde Datei mit, die der Aufräumer richtigerweise in Ruhe ließ.

Zwei Begriffe für dieselbe Frage sind einer zu viel. Es gibt jetzt eine
Fassung (`standmuster`), und beide benutzen sie. Dieselbe Fehlerklasse wie
sechsmal in dieser Woche — diesmal in Code, der eine Stunde alt war.

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| Löschmuster gelockert (`startsWith`) | die Probe der fremden Nachbarn fällt |
| Aufräumer abgeschaltet | zwei Proben fallen |
| Existenzprüfung entfernt | drei Katalogproben fallen — eine Kopie „von nichts" |
| Leerer Ordner bei `npm run sicherung` | Abbruch mit Ausgang 2 |

Die letzte Zeile ist die Lehre des Vormittags, angewandt: Ein leerer Ordner
darf nicht „Sicherung: 0 Dateien" melden und wie eine erledigte Sicherung
aussehen — genau so hat der Katalogerzeuger heute früh „Artikel im Katalog:
0" gemeldet.

## Was das nicht ist

Kein Ersatz für eine Sicherung außerhalb dieses Rechners. Die Kopien liegen
neben den Originalen; ein verlorener Rechner nimmt beide mit. Was sie
abfangen, sind Fehlgriffe — der eigene von heute Mittag, und die, die am Tag
der Lieferung wahrscheinlicher sind als sonst.

Die Sicherung außer Haus ist eine Entscheidung des Auftraggebers und hängt an
Fragen, die dieser Loop nicht beantworten kann: wohin, wie oft,
verschlüsselt. Sie steht in der Liste der offenen Punkte, nicht in diesem
Werkzeug.
