# Was der Plan nach dem Hochladen nicht fragt

**6. September 2026, nachts.** Die Runde davor hat die Fehlerseite gebaut und
mit einem Satz geendet, der ein Vorsatz war:

> *„Ob die Zeile beim Hoster wirkt, ist von hier aus nicht feststellbar. Es
> gehört auf die Liste dessen, was beim ersten Hochladen im Browser
> nachzusehen ist."*

**Die Liste gibt es nicht.** Und das ist der Befund dieser Runde, nicht die
Zeile.

---

## Die Lücke im Plan

`npm run rollout` führte fünfzehn Etappen. Zwei davon stehen nebeneinander:

| Tag 10–11 | `ausgabe/site/` auf bauversand.com hochladen |
| Tag 11–14 | Search Console einrichten und die Indexierung bestätigen |

> **Der Plan prüfte, ob Google die Seite findet — und nicht, ob der Server sie
> richtig herausgibt.**

Dazwischen liegt alles, was zwischen „die Dateien sind oben" und „der Shop
funktioniert" schiefgehen kann, und nichts davon ist von hier aus messbar. Der
Netzausgang dieser Umgebung ist gesperrt; `npm run startklar` sagt das seit
Tagen selbst, bei zwei seiner elf Punkte: *„von hier aus nicht feststellbar"*.

Seit gestern Nacht ist die Liste dieser Punkte länger geworden, ohne dass sie
irgendwo stünde: Die Fehlerseite hängt an einer Zeile in `.htaccess`, und ob
der Hoster sie befolgt, weiß hier niemand.

---

## Was jetzt dasteht

`npm run abnahme` druckt acht Punkte, jeder mit Adresse, erwartetem Text und
dem, was sein Fehlen bedeutet:

```
 1. https://bauversand.com/                     → „Bauversand"
 2. https://bauversand.com/gibt-es-nicht-abnahme.html
                                                → „Diese Seite gibt es nicht"
 3. https://bauversand.com/artikel/gibt-es-nicht-abnahme.html
                                                → „href="/index.html""
 4. https://bauversand.com/robots.txt           → „Sitemap: …/sitemap.xml"
 5. https://bauversand.com/sitemap.xml          → „<urlset" (78 Adressen)
 6. https://bauversand.com/shop.js              → „window.__SHOP__"
 7. https://bauversand.com/llms.txt             → „Liefergebiet"
 8. https://bauversand.com/artikel/POS-10095.html → „../shop.js"
```

Punkt 2 und 3 sind dieselbe Frage aus zwei Höhen: Die Fehlerseite verlinkt ab
der Wurzel, weil sie unter jeder Adresse ausgeliefert wird — ob das im Browser
hält, entscheidet sich erst am Server.

Und dazu eine sechzehnte Etappe im Rolloutplan, **null Tage**, abhängig vom
Hochladen. Null Tage und trotzdem eine Etappe: Sie kostet nichts und verschiebt
nichts, aber ohne sie steht der Schritt in keinem Plan, den der Auftraggeber
liest.

---

## Warum die Liste erzeugt wird und nicht geschrieben

Eine abgeschriebene Prüfliste ist am Tag nach dem nächsten Bau falsch. Genau
das hat dieser Bestand in den letzten beiden Tagen dreimal gefunden: das
Prüferregister, das eine Zahl von gestern meldete; die Kopfzahl in `STATUS.md`,
183 Dateien daneben; die Gegenprobe, deren Suchtext nicht mehr ankam.

> **Jeder Punkt wird aus dem gebauten Erzeugnis abgeleitet.**

Die Zahl der Adressen kommt aus der Sitemap. Der Pfad der Fehlerseite kommt aus
der `.htaccess` — steht dort morgen ein anderer Name, fragt die Liste nach dem
anderen Namen. Die erwartete `Sitemap:`-Zeile kommt aus `robots.txt` selbst.
Ein Testfall hält das fest: Wird in der `.htaccess` `fehler.html` eingetragen,
nennt die Liste `fehler.html`.

### Die Hälfte, die hier messbar ist

Jeder Punkt nennt eine Datei im Ausgabeordner **und** einen Text, der darin
steht. Beides wird lokal geprüft — vom Werkzeug selbst und von einem Testfall
gegen den echten Ordner.

> **Was übrig bleibt, ist genau die Liste dessen, was hier nicht geht.**

Das ist der Punkt: Fragt die Liste nach einem Text, den es im Ordner gar nicht
gibt, meldet der Auftraggeber einen Fehler des Servers, wo der Fehler in der
Liste steht — und sucht ihn an der falschen Stelle. Die Gegenprobe
`abnahme-fragt-ins-leere` tauscht eine Erwartung gegen eine erfundene und
verlangt, dass der Testlauf es meldet.

### Und der erfundene Pfad muss erfunden bleiben

`gibt-es-nicht-abnahme.html` löst die Fehlerseite nur aus, solange es die Datei
nicht gibt. Läge sie eines Tages im Ordner, prüfte Punkt 2 gar nichts mehr und
bliebe grün. Auch das ist eine Regel und kein Vertrauen: `abnahmebefund`
meldet es.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Werkzeuge | `npm run abnahme` (Liste, kein Prüfer) |
| Neue Etappen | 16 statt 15 — null Tage, hängt am Hochladen |
| Neue Gegenproben | `abnahme-fragt-ins-leere` |
| Neue Testfälle | 8 (`test/abnahme.test.js`) |
| Neue Gates | keine |

## Was offen bleibt

- **Die Liste ist nicht abgearbeitet** und kann es hier nicht sein. Sie ist der
  ehrliche Ersatz für eine Prüfung, die diese Umgebung nicht machen kann —
  nicht deren Ersatz im Sinne von „damit ist es erledigt".
- **Die Gebietsfrage an den Lieferanten** — freigabepflichtig.
- **Sieben Punkte in `npm run startklar`** — alle beim Auftraggeber.
