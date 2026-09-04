# Das Original lag nur im Arbeitsspeicher

**4. September 2026, später Vormittag.** Am Ende der letzten Runde meldete die
Abschlussprüfung des Loops „uncommitted changes". Im Baum stand
`src/betreiberform.js` mit **ausgehängter UID-Prüfziffer** — genau die
Mutation, die ich eine Stunde vorher als Gegenprobe eingetragen hatte.
Sekunden später war es `src/ungerufen.js`, dann nichts mehr.

Es war keine liegen gebliebene Arbeit. Es war ein laufender Prozess: Der
letzte Schritt von `npm run alles` ist `bin/gegenprobenlauf.mjs`, und der
macht der Reihe nach 38 Quelldateien absichtlich falsch, lässt einen Prüfer
darüber laufen und schreibt zurück. Ich hatte den Lauf für beendet gehalten,
weil meine Warteschleife auf den vorletzten Schritt gewartet hat.

Diesmal ging es gut aus. Zwei Gründe, warum das Glück war:

> **Dieser Loop committet und pusht ohne Rückfrage.** Ein Commit während des
> Gegenprobenschritts nimmt die Mutation mit — absichtlich falscher Code,
> gepusht, mit einer Nachricht, die von etwas anderem handelt.

> **Der Läufer hielt das Original nur im Arbeitsspeicher.** Zurückgeschrieben
> wurde es in einem `finally`. Ein `finally` läuft nicht bei `SIGKILL`, nicht
> bei einem Speicherabbruch und nicht, wenn der Container weggeräumt wird.
> Dann bleibt die mutierte Datei liegen und das Original ist weg.

## Das Modul dafür gibt es seit dem 30. August

`src/sicherung.js` legt vor jedem Überschreiben eine datierte Kopie an. Sein
Kopfkommentar sagt, warum es existiert: An dem Tag hat **eine Gegenprobe** die
vertrauliche Preisdatei geleert. Drei Werkzeuge benutzen es —
`bin/sicherung.mjs`, `bin/artikelliste.mjs`, `bin/katalog-aus-rechnungen.mjs`.

Die Gegenprobe benutzt es nicht.

> **Dieselbe Familie wie am Vormittag:** eine Regel, die es gibt und die
> ausgerechnet an der Stelle nicht gilt, an der sie entstanden ist. Heute früh
> war es die Prüfziffernrechnung, die nur die UID des Kunden bewachte. Jetzt
> ist es die Sicherung, die alles sichert außer dem Werkzeug, das sie
> ausgelöst hat.

Und zwischen den beiden Läufern besteht dasselbe Gefälle: `bin/gegenprobe.mjs`
— die Einzelprobe, die ein Mensch von Hand startet — fängt seit dem 31. August
`SIGINT` und `SIGTERM` ab und prüft danach nach, ob die Datei wirklich wieder
dasteht. Der **Läufer**, der 38 Proben hintereinander anwendet und
unbeaufsichtigt in `npm run alles` steckt, tat beides nicht.

## `src/mutationsschutz.js` — ein Zettel an der Tür

Eine datierte Kopie beantwortet die falsche Frage. Für eine Mutation braucht
es das Gegenteil von zehn Ständen: **genau einen**, und die Auskunft „liegt
hier gerade etwas absichtlich Falsches?". Der Zettel verschwindet, sobald
zurückgeschrieben ist — was übrig bleibt, ist ein Fund.

- geschrieben **vor** der Mutation, mit dem Original, dem Absender und dem
  Zeitpunkt,
- abgenommen **nach** dem Zurückschreiben,
- abgelegt unter `.sicherung/` neben der Datei — dasselbe Verzeichnis wie die
  datierten Kopien, aus demselben Grund gitignoriert und bei `preise/`
  innerhalb des vertraulichen Bereichs.

Der Läufer räumt jetzt **beim Start** auf, bevor er irgendetwas prüft, fängt
beide Signale ab und schlägt Alarm, wenn eine Datei nach der Probe nicht
wieder dasteht wie vorher.

Nachgestellt: Zettel gehängt, Datei verfälscht, Prüfer rot —

```
✗ shop/src/betreiberform.js ist noch absichtlich falsch
    (Nachstellung eines harten Abbruchs, seit 2026-09-04T09:48:37Z)
    [mutation-liegen-geblieben]
```

— dann `node bin/gegenprobenlauf.mjs` gestartet, erste Zeile: „Aus einem
abgebrochenen Lauf zurückgeholt". Kein `git checkout` beteiligt, was bei einer
Datei unter `preise/` auch keine Hilfe gewesen wäre.

## `npm run pruefe-mutationen`, und was er zählt

Der Prüfer hat ein Problem, das die anderen zwanzig nicht haben: **Sein
gesunder Zustand ist null Funde.** „Nichts gefunden" und „nicht hingesehen"
sähen in einer Fundzahl identisch aus — und das ist die Fehlerfamilie, gegen
die `src/pruefregister.js` überhaupt gebaut wurde.

Er meldet deshalb die Zahl der **angesehenen Einträge**, nicht die der Funde:
`Mutationsschutz — 640 Einträge angesehen, 0 offene Zettel`. Das Mindestmaß im
Register steht auf 200.

Eine Gegenprobe im üblichen Sinn hat er nicht, und der Grund steht im
Register: Er wird nicht durch Code rot, sondern durch einen Zettel auf der
Platte. Eine Mutation an seiner Quelle könnte ihn nur dazu bringen, einen Fund
zu **behaupten** — das zeigt nichts über den Fall, für den es ihn gibt. Sein
rotes Verhalten prüft `test/mutationsschutz.test.js` mit einer echten liegen
gebliebenen Datei, und die Gegenprobe `liegen-gebliebene-mutation-uebersehen`
hält diese Prüfung wach: Fallen die beiden Meldungen zusammen, meldet der
Prüfer den harmlosen Wortlaut über den gefährlichen Zustand.

## Ein Prüfer, der vor dem Ereignis läuft

`pruefe-mutationen` steht im Prüferregister und lief damit an seiner
alphabetischen Stelle — **vor** dem Gegenprobenschritt, dem einzigen, der
Quelldateien anfasst.

> **Ein Prüfer, der vor dem Ereignis läuft, prüft die Zeit davor.**

`npm run alles` hat deshalb seit heute einen Schritt mehr, und er steht ganz
am Ende: „nichts liegen geblieben".

## Was die Änderung sofort umgeworfen hat

Der Zettel legt ein Verzeichnis `src/.sicherung/` an, und in
`test/fremdtext.test.js` stand ein `readdirSync` **ohne Filter**: Jeder Eintrag
ging als Datei in `readFileSync`. Der Test starb mit `EISDIR`.

Elf andere Stellen im Bestand lesen Verzeichnisse und filtern alle auf eine
Endung; diese eine nicht. Sie ist die Prüfung darauf, dass kein Quelltext
fremden Text als HTML schreibt — sie hätte ab dem ersten Unterverzeichnis in
`src/` gar nichts mehr geprüft, sondern nur noch abgestürzt. Ein Absturz ist
dabei der freundliche Ausgang: Wäre der Eintrag lesbar gewesen, hätte sie
weitergemacht und weniger angesehen als gedacht.

## Was das für den Auftraggeber ändert

Nichts an seiner Liste. Es ändert etwas an dem, was dieser Loop nachts allein
tun darf: Er kann jetzt nicht mehr eine absichtlich falsche Datei
mitcommitten, ohne dass es vorher jemand sagt.
