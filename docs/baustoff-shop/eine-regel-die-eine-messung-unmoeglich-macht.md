# Eine Regel, die eine Messung unmöglich macht

**9. September 2026, nachts.** Der Gesamtlauf über den Tageswechsel meldete
die Gegenproben rot. Eine schlug an, dreizehn sagten dasselbe:

```
✗ test — Ein geführtes Keyword, das die eigene Suche nicht beantwortet
    war schon vorher rot — an einem roten Prüfer lässt sich nichts zeigen
```

Am Bestand war nichts. **Es war eine Regression von mir, aus derselben
Nacht.**

---

## Was passiert war

`test/erzeugnisfrische.test.js` kam wenige Stunden vorher dazu. Es sagt, wenn
`ausgabe/site` nicht auf dem Stand der Quelle ist — die Lücke, die drei rote
Abende erklärt hatte.

Im Gegenprobenlauf ist das Erzeugnis **nach jeder Mutation** veraltet: Der
Läufer macht eine Quelldatei absichtlich falsch und ruft den Prüfer. Für die
meisten Prüfer baut er vorher neu; für `npm test` nicht.

Also war der Testlauf ab der ersten Probe rot, und jede weitere fand einen
Prüfer vor, an dem sich nichts zeigen lässt.

> **Eine neue Regel, die eine bestehende Messung unmöglich macht, ist keine
> Verschärfung, sondern ein Ausfall.**

### Warum er durchs Raster fiel

Der Läufer baut vor einem Prüfer, der in `LESER` steht — erkannt daran, dass
sein npm-Befehl ein Werkzeug aus `bin/` nennt. Der Testlauf heißt
`node --test test/*.test.js` und nennt keines. **Gelesen hat er die
Erzeugnisse trotzdem immer:** fünfunddreißig Testdateien lesen `ausgabe/site`.

Er wird jetzt wie jeder andere Erzeugnisleser vor dem Lauf gebaut.

**Gemessen, nicht behauptet:** alle vierzehn Gegenproben am Prüfer `test`
hintereinander — **14 von 14 schlagen an**, wo es vorher eine und dreizehn
Fehlanzeigen waren.

---

## Und was der Kalender damit zu tun hat

Der Lauf begann am 8. und endete am 9. Zwölf gebaute Dateien haben sich
geändert, alle nach demselben Muster:

```diff
- Diese Grundlage ist 91 Tage alt und damit älter als die selbst gesetzte …
+ Diese Grundlage ist 92 Tage alt und damit älter als die selbst gesetzte …
```

Das ist kein Fehler, sondern die Absicht: Der Shop sagt dem Kunden, wie alt
die Preisgrundlage ist, und rechnet das in Tagen. **Die Ausgabe dieses Shops
ist über Mitternacht hinweg verschieden**, und wer sie im Verzeichnis führt,
committet an jedem Tag eine andere.

Es ist derselbe Vorgang, der die Gegenproben rot gemacht hat — eine
Erzeugnisänderung mitten im Lauf —, nur kommt sie diesmal nicht von einer
Mutation, sondern von der Uhr.

---

## Der Haken hat den Commit gestoppt

Ich hatte die Behebung committen wollen, während der Nachweislauf noch lief.
Vorher gemessen: kein offener Zettel. Der Haken maß im Augenblick des
Schreibens — und da war einer:

```
✗ bin/website.mjs ist noch absichtlich falsch
  (gegenprobenlauf.mjs (pfad-auf-der-seite-ohne-auszeichnung), seit 00:38:16)
```

Mein `git add` betraf eine andere Datei. Das ändert nichts: Ein Commit hätte
einen Stand festgehalten, in dem eine Quelldatei nachweislich verfälscht ist.

> **Was eine Sekunde vorher gemessen wurde, gilt eine Sekunde später nicht
> mehr, solange etwas anderes schreibt.**

Die Prüfung **vor** dem Commit ist eine Auskunft. Die Prüfung **im** Commit
ist eine Sperre. Seit gestern Nachmittag gibt es die zweite, und heute Nacht
hat sie zum ersten Mal etwas aufgehalten, das ich für sicher gehalten hatte.
