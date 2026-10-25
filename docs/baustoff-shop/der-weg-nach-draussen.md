# Der Weg nach draußen

*25. Oktober 2026, auf Weisung des Auftraggebers: „mach die github action".
Der erste Weg in diesem Projekt, auf dem etwas das Haus verlässt, ohne dass
ein Mensch es vorher ansieht — und deshalb der erste mit einer eigenen
Sperre davor.*

---

## Warum die Action auf GitHub läuft und nicht hier

Der Container, in dem gebaut wird, erreicht den Webspace nicht: Sein
Netzausgang weist `all-inkl.com` und `kasserver.com` ab. Gemessen, mehrfach,
zuletzt am 24. Oktober.

Der Lauf auf GitHubs Rechnern hat dieses Tor nicht. Er braucht nur die
Zugangsdaten — und die gehören in die **Secrets** des Repositories, nicht in
eine Datei und nicht in einen Chat.

## Was hochgeladen wird — und was nicht gebaut werden kann

Hochgeladen wird `shop/ausgabe/site`, **so wie es im Repository liegt.**

Gebaut werden kann dort nicht, und der Grund ist derselbe, der dieses Projekt
seit dem ersten Tag prägt: `npm run website` braucht
`preise/baustoff-preise.json` mit den Einkaufspreisen, und die Datei liegt
absichtlich außerhalb des Repositories. Ein Bau auf GitHub müsste sie dorthin
bringen.

> **Die Datei, die den Bau möglich macht, ist genau die, die nicht hinaus
> darf.**

Also lädt die Action den Stand des letzten Commits hoch. Damit das keine stille
Falle wird, prüft die Sperre es ausdrücklich — Frage 2 unten.

## Die vier Fragen vor dem Hochladen

`npm run freigabe` (`src/freigabe.js`, `bin/freigabepruefung.mjs`). Jede der
vier verhindert einen Schaden, den man nicht zurücknehmen kann:

| | Frage | Was sie verhindert |
|---|---|---|
| 1 | Liegt überhaupt ein Bau da? | Ein halbes Verzeichnis, das eine laufende Seite überschreibt |
| 2 | Ist die Ausgabe jünger als ihre Quelle? | Eine Seite von vorgestern, hochgeladen als wäre sie heute |
| 3 | Steht ein internes Wort darin? | Einkaufspreis, Marge, Lieferantenname auf einer Kundenseite |
| 4 | Ist das Impressum vollständig? | Ein Gerüst, veröffentlicht als Shop |

**Frage 2 misst Commitzeiten, nicht Dateizeiten.** In einem frischen Klon
tragen alle Dateien die Zeit des Auscheckens; ein Vergleich der Zeitstempel
meldete dort immer Grün.

> **Eine Frischeprüfung, die im Klon nicht misst, ist genau dort blind, wo sie
> gebraucht wird.**

**Frage 3 liest jede Datei, nicht nur die Seiten.** Das ist der Befund vom
23. Oktober, eine Ebene weiter gedacht: Damals stand ein Pfad zur Preisdatei im
ausgelieferten `shop.js`, und beide Prüfungen des Baus sahen ihn nicht, weil
beide Seiten lasen. Hier gehen alle 90 Dateien durch. Die eine begründete
Ausnahme für das Bündel liegt jetzt als `BUENDELAUSNAHME` an **einer** Stelle —
zwei Prüfer brauchen sie, und zweimal geschrieben hieße einmal gepflegt.

**Frage 4 ist heute rot, und das ist richtig so.** Vier sichtbare Lücken im
Impressum: E-Mail, Telefon, UID, Gewerbewortlaut. § 5 ECG verlangt sie ab dem
ersten Aufruf. Eine Vorschau darf sie zeigen, ein Shop nicht.

## Warum die Sperre nicht im Prüfregister steht

Weil sie heute rot ist. Stünde sie im Schnelllauf, scheiterte jeder Commit am
unvollständigen Impressum — an einem Zustand also, den niemand hier schließen
kann und der sauber als offener Punkt geführt ist.

> **Das Gate vor dem Commit fragt, ob der Bestand in sich stimmt. Diese Prüfung
> fragt, ob er vor einem fremden Menschen besteht.** Das sind zwei Fragen, und
> eine Antwort auf beide wäre für keine der beiden richtig.

Mit `--ohne-impressum` lässt sich Frage 4 übergehen — für den Tag, an dem der
Auftraggeber eine Vorschau unter seiner eigenen Adresse sehen will, bevor die
Angaben da sind. Sie muss ausdrücklich verlangt werden, sie übergeht **nur**
diese eine Frage, und der Lauf sagt laut, was er durchgelassen hat. Beides ist
als Testfall festgehalten.

## Ein eigener Fehler, gefunden von `pruefe-regeln`

Die vier Regeln standen zuerst in `bin/freigabepruefung.mjs`. Der Prüfer
meldete am selben Tag: vier Regelstellen, die kein Testfall je hat feuern
sehen.

> **Eine Regel in einem Skript ist eine Regel, die niemand einzeln auslösen
> kann** — und was man nur im Ganzen auslösen kann, prüft man nicht.

Sie liegen jetzt in `src/freigabe.js`. `freigabebefund()` liest nichts selbst:
keine Dateien, keine Uhr, kein Git. Das Werkzeug sammelt, das Modul urteilt,
und sieben Testfälle lassen jede Regel einzeln feuern — darunter zwei, die das
Gegenteil sichern: Gleichstand von Quelle und Ausgabe ist **kein**
Hinterherhängen, und die Mindestzahl selbst gilt noch als genug.

Dazu ein zweiter, von `pruefe-saetze`: Der Kopf des Werkzeugs wiederholte den
Kopf des Moduls, Wort für Wort. Jetzt verweist er darauf.

## Zwei Wächter für dieselbe Frage

Frage 2 vergleicht Commitzeiten. Vor ihr steht ein zweiter Wächter, der
Dateizeiten vergleicht — derselbe, der vor jedem Werkzeug steht, das
`ausgabe/` liest. Das ist keine Verdopplung:

> **Die eine Frage gilt im fremden Klon, die andere auf diesem Rechner.** Im
> Klon tragen alle Dateien dieselbe Zeit, dort misst nur die Geschichte; hier
> sieht nur die Dateizeit den Bau, der noch gar nicht gelaufen ist.

Gemeldet hat das Fehlen `pruefe-erzeugnis` — zuerst, dass ein neues Werkzeug
`ausgabe/` anfasst und in keinem Eintrag steht, und nach dem Eintrag, dass der
Eintrag ohne Prüfung dasteht. Zwei Meldungen, beide in die richtige Richtung.

## Was die Action bewusst nicht tut

**Sie läuft nicht bei jedem Push.** Es gibt keinen `push`-Auslöser, nur
`workflow_dispatch` — von Hand.

> **Eine Seite, die draußen steht, nimmt man nicht zurück; die Suchmaschine hat
> sie dann schon gelesen.**

Wann der Shop hinausgeht, entscheidet der Auftraggeber und nicht ein Merge. Das
ist dieselbe Linie wie bei den Kampagnen, die seit Wochen auf PAUSIERT stehen,
und beim Bestellweg, der gebaut und abgeschaltet ist.

**Sie löscht nichts, außer man kreuzt es an.** `mirror -R` ohne `--delete`:
Was im Zielordner liegt und nicht aus diesem Repository kommt, bleibt stehen.
Von hier aus ist nicht zu sehen, was dort liegt, und was man nicht sieht,
löscht man nicht.

**Sie spricht FTPS und nicht blankes FTP.** Ein Passwort im Klartext über das
Netz ist kein Passwort mehr. Weigert sich der Server, bricht der Lauf ab — das
ist ein Befund und kein Schalter.

**Das Passwort steht in `LFTP_PASSWORD` und nicht in der Befehlszeile.** Was in
`argv` steht, liest jeder Prozess auf derselben Maschine mit.

## Was offen bleibt

**Der FTP-Teil ist von hier aus nicht zu testen.** `lftp` gibt es in diesem
Container nicht, und selbst mit ihm käme keine Verbindung zustande. Der erste
Lauf auf GitHub ist die Probe — deshalb steht vor dem Hochladen ein eigener
Schritt, der sich nur anmeldet und das Zielverzeichnis auflistet. Schlägt
etwas fehl, dann dort, in zwei Sekunden, mit den drei wahrscheinlichsten
Gründen im Protokoll.

**Und davor gehört das Repository auf privat.** Es ist offen, und aus einer
gebauten Artikelseite sind 44 von 46 Einkaufspreisen auf den Cent
rückrechenbar. Zugangsdaten zu einem Webspace in einem offenen Repository zu
hinterlegen, wäre der falsche Zeitpunkt — die Secrets selbst sind zwar auch
dort verschlossen, aber die Reihenfolge stimmt nicht.

## Zahlen des Tages

| | |
|---|---|
| Fragen vor dem Hochladen | 4, davon heute 1 rot |
| Testfälle dafür | 9, jede Regel feuert einzeln |
| Dateien, die Frage 3 liest | 90 — jede, nicht nur die 85 Seiten |
| Auslöser der Action | 1, von Hand |
| Prüfer im Schnelllauf | 62 grün · Tests 2786 → **2795** |
