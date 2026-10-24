# Die Adresse, die es nicht gibt

**6. September 2026, nachts.** `npm run startklar` sagt seit Tagen dasselbe:
sieben offene Punkte, alle beim Auftraggeber, zwei von hier aus nicht
feststellbar. Der Loop kann daran nichts schließen. Also die andere Frage:
**Was am ausgelieferten Shop ist unfertig, ohne dass es auf einer Liste steht?**

Der Ausgabeordner, vollständig:

```
artikel/  gruppe/  rechtliches/  system/  wissen/
index.html  kasse.html  lieferung.html  suche.html  warenkorb.html
llms.txt  robots.txt  shop.js  sitemap.xml
```

Eine Datei fehlt, und sie fehlt seit es den Shop gibt.

---

## Was heute passiert, wenn jemand danebenklickt

Der Shop veröffentlicht **78 Adressen** in der Sitemap. Für jede andere Adresse
unter `bauversand.com` liefert das Hosting seine eigene Fehlerseite aus: ohne
Marke, ohne Kopfleiste, ohne Suchfeld, ohne einen Weg zurück ins Sortiment.

Drei dieser Adressen sind die Endziele der bezahlten Anzeigen — **4,19 € bis
8,22 € je Klick**, 45 Tage lang, das ganze Budget.

> **Ein Klick, der bezahlt ist und ins Leere geht, ist doppelt verloren: einmal
> das Geld und einmal der Besucher.**

Und das ist keine ausgedachte Gefahr. Sie steht in der eigenen Fehlerliste:

> *„**Anzeigenziel:** alle drei Anzeigen des ersten Anlaufs zeigten auf Seiten,
> die es nicht gibt — die Ziel-URL war der Google-**Anzeigepfad**."*

Der Fehler ist behoben. Die **Sorte** Fehler bleibt: eine vertippte Adresse,
ein Verweis aus einer alten Nachricht, ein Artikel, den es nicht mehr gibt,
eine Anzeige mit einem Pfad von letzter Woche.

---

## Was jetzt dasteht

`404.html` — Marke, Kopfleiste mit Suchfeld und den sieben Warengruppen, ein
Satz, was passiert ist, und der Weg weiter. **Kurz gehalten:** Ihre Aufgabe ist,
den Besucher weiterzuschicken, nicht ihn zu beschäftigen.

**Was sie ausdrücklich nicht tut: weiterleiten.** Eine Fehlerseite, die
heimlich zur Startseite springt, macht aus einem sichtbaren Fehler einen
unsichtbaren — der Besucher glaubt, er sei richtig, und der Betreiber erfährt
nie, dass eine Adresse falsch ist.

### Drei Dinge, die an ihr anders sind als an jeder anderen Seite

**Sie kennt ihre eigene Tiefe nicht.** Jede andere Seite weiß, wo sie liegt,
und verlinkt relativ. Die Fehlerseite wird unter **jeder** nicht gefundenen
Adresse ausgeliefert: `/tippfehler.html` genauso wie
`/artikel/gibt-es-nicht.html`. Ein `../index.html` zeigte im zweiten Fall aus
dem Verzeichnis heraus und im ersten daneben.

> **Eine Seite, die an jeder Adresse ausgeliefert wird, darf von keiner
> ausgehen.**

Ihre Verweise gehen deshalb ab der Wurzel (`/index.html`, `/gruppe/wdvs.html`),
und ihr Skriptpfad auch. Die Verweisprüfung des Bauwerkzeugs musste das lernen:
Ohne den neuen Zweig löste sie `/gruppe/wdvs.html` zu einer Kennung
`/gruppe/wdvs` auf, die es nicht gibt, und hätte **jeden** Verweis der
Fehlerseite als tot gemeldet.

**Sie bekommt kein `canonical`.** Ein Kanonisch sagt: *diese Seite ist unter
dieser Adresse die maßgebliche.* Die Fehlerseite wird unter jeder Adresse
ausgeliefert, die es **nicht** gibt. Ein Kanonisch darauf behauptete gegenüber
einer Suchmaschine, `404.html` sei eine gültige Seite dieses Shops — die eine
Aussage, die eine Fehlerseite gerade nicht machen darf. `kanonisch()` gibt für
sie `null` zurück, und der Testfall prüft seither **beide** Richtungen: Wo eine
erwartet wird, muss sie stimmen; wo keine erwartet wird, darf keine stehen.

**Sie steht nicht in der Sitemap.** Aus einem anderen Grund als Warenkorb,
Kasse und Suche: Die sind zu dünn, die Fehlerseite ist **keine Adresse**.

---

## Und die Zeile, ohne die alles davon nichts wäre

```
# ausgabe/site/.htaccess
ErrorDocument 404 /404.html
```

Ohne sie liegt die Datei im Ordner und wird nie ausgeliefert.

> **Eine Fehlerseite, die niemand ausliefert, ist eine Datei.**

Geprüft wird sie an ihrer **Wirkung**, nicht an ihrem Wortlaut: Der genannte
Pfad muss auf eine Datei zeigen, die im Ausgabeordner liegt. Dieselbe Lehre wie
bei der Ablagesperre am 5. September — *eine Zeile, die auf nichts zeigt, ist
keine Anweisung.* Die Gegenprobe `fehlerseite-ohne-auslieferung` lässt die
Zeile stehen und zeigt auf `/fehler.html`; der Testlauf meldete rot an der
erwarteten Stelle.

In der `.htaccess` steht bewusst **nur diese eine Anweisung**. Was sonst noch
hineingehörte — Weiterleitungen, Kompression, Kopfzeilen — wäre eine
Serverkonfiguration ohne Prüfung: Von hier aus lässt sich nicht messen, ob sie
wirkt, und der Netzausgang dieser Umgebung ist gesperrt.

---

## Drei Register haben sich gemeldet

Der Testlauf wurde an drei Stellen rot, und jede war eine Liste, die eine
Ausnahme führt:

| Register | Was es sagte |
|---|---|
| „jede Seite trägt 800 Zeichen ohne JavaScript" | `404.html: 672 Zeichen` |
| „drei Seiten fehlen in der Sitemap" | jetzt vier |
| „jede Seite nennt ihre kanonische Adresse" | die Fehlerseite hat keine |

Alle drei sind jetzt mit **Grund** erweitert, nicht mit einer größeren Zahl.
Die erste hätte man auch anders bedienen können — die Seite auf 800 Zeichen
aufblasen. *Eine Fehlerseite zu füllen, damit eine Zahl stimmt, ist genau die
Sorte Lösung, gegen die dieser Bestand anschreibt.*

---

## Was das gekostet hat

| | |
|---|---|
| Neue Seiten | `404.html` (82 statt 81) und `.htaccess` |
| Neue Prüfer | keine — drei Testregister erweitert, eines neu |
| Neue Gegenproben | `fehlerseite-ohne-auslieferung` |
| Neue Gates | keine |

## Was offen bleibt

- **Ob die Zeile beim Hoster wirkt**, ist von hier aus nicht feststellbar — der
  Netzausgang ist gesperrt. Sie ist die Standardanweisung für Apache, und
  All-Inkl fährt Apache; **gemessen ist das nicht.** Es gehört auf die Liste
  dessen, was beim ersten Hochladen im Browser nachzusehen ist.
- **Die Gebietsfrage an den Lieferanten** — freigabepflichtig.
- **Sieben Punkte in `npm run startklar`** — alle beim Auftraggeber.
