# Der Ortsname, den es zweimal gibt

**5. September 2026.** Die Runde davor hat die Anzeigen gelesen und
aufgeschrieben, was fehlt: die **100 Keywords und die 66 Ausschlüsse**. Das
ist die Fläche, die bei jedem einzelnen Klick Geld kostet.

---

## Der Ausschluss, der nicht dasteht — und warum das richtig ist

Die Geo-Liste nennt neunzehn Städte und Länder außerhalb der fünf Bezirke:
Wien, Graz, Salzburg, Innsbruck, Klagenfurt, Villach, **Wels**, **Steyr**,
St. Pölten, Dornbirn, Bregenz, Tirol, Vorarlberg, Kärnten, Burgenland,
Steiermark, Deutschland, Bayern, Passau.

Der naheliegende nächste Eintrag wäre **„ried"**. Ried im Innkreis ist eine
oberösterreichische Bezirkshauptstadt, gut hundert Kilometer westlich, weit
außerhalb des Liefergebiets — genau wie Wels und Steyr, die beide in der Liste
stehen.

Er wäre der teuerste Ausschluss der ganzen Liste.

**Der Betrieb sitzt in Ried in der Riedmark**, Marwach 5, 4312, Bezirk Perg.
Ein Phrase-Ausschluss unterscheidet die beiden Orte nicht. Ein Bauleiter, der
„Dämmplatten Ried" tippt, meint mit einiger Wahrscheinlichkeit den Ort, in dem
der Shop steht — und der Ausschluss träfe die eigene Kundschaft an ihrer
Haustür.

> **Der gefährlichste Ausschluss ist der Ortsname, den es zweimal gibt.**

Dieser Bestand ist an genau dieser Zweideutigkeit schon einmal gescheitert: Am
26. August hielten **vier Dokumente Ried im Innkreis für den Heimatbezirk** —
eine Verwechslung, die am selben Tag widerrufen wurde. Der Sitz liegt in Ried in
der Riedmark, **Bezirk Perg** (`zwei-ried.md`).

---

## Und die Prüfung hätte ihn durchgelassen

Es gibt seit dem 3. September einen Testfall, der genau das verhindern soll.
Sein Kommentar ist ausdrücklich:

> „**Was hier nicht hineingehört, ist ebenso wichtig.** Kein Ortsname des
> eigenen Liefergebiets — ‚linz' auszuschließen wäre ein Ausschluss der eigenen
> Kundschaft."

Er hält die Ausschlüsse gegen `LIEFERGEBIET.bezirke`: **Perg, Linz, Linz-Land,
Freistadt, Urfahr-Umgebung.** Keiner davon enthält „ried".

> **Die Prüfung kannte die fünf Bezirksnamen — und nicht den Ort, an dem der
> Betrieb steht.**

Der Ort steht in `data/betreiber.json` und ist keine neue Angabe; er wird von
`bin/website.mjs`, vom Impressum und von jedem Beleg gelesen. Er stand nur in
keiner Prüfung.

Und die Lücke war nicht harmlos: Die Bezirke sind Verwaltungsnamen, die
Suchenden tippen Ortsnamen. Der einzige Ort, der beide Rollen spielt, ist
derselbe, an dem der Betrieb steht.

---

## Was jetzt gilt

**`pruefeAusschluesse`** prüft gegen drei Quellen — Bezirke, **Ort des
Betriebs**, geführte Suchbegriffe — und läuft im Bau der Kampagne mit, nicht
nur in einem Testfall. Ohne Orte meldet sie sich, statt grün zu sein.

**`NICHT_AUSGESCHLOSSEN`** hält die Wörter fest, die bewusst *nicht* in der
Liste stehen, mit dem Grund — damit ein späterer Lauf sie nicht arglos
ergänzt. Zwei Einträge:

| Wort | warum nicht |
|---|---|
| `ried` | der Betriebssitz; gemeint wäre Ried im Innkreis, und ein Phrase-Ausschluss trennt sie nicht |
| `abholung` | die Lieferseite bietet Selbstabholung ausdrücklich an — es ist die günstigste Bestellung, die der Shop bekommen kann |

Gehalten in beide Richtungen: Steht ein Eintrag doch in der Ausschlussliste,
ist das ein Befund.

---

## Zwölf Ausschlüsse mehr, aus demselben Grund wie die vorhandenen

Beim Lesen fiel auf, dass die Gruppe **„Falsche Absicht"** mit `reparatur`
bereits ein Dienstleistungswort trug — und die übersah, nach denen bei Dämmung
und Kamin tatsächlich gesucht wird.

Dieser Shop verkauft **Ware und kein Gewerk**: keine Werkleistung in der
AGB-Gliederung, kein Montagepreis im Katalog, keine Gewährleistung für eine
Ausführung. Wer eine Leistung sucht, sucht einen Handwerker; der Klick ist
trotzdem bezahlt.

Ergänzt: `montage`, `einbau`, `einbauen lassen`, `verlegen lassen`,
`setzen lassen`, `sanieren lassen`, `firma sucht`, `handwerker` — und
`förderung`, `foerderung`, `sanierungsbonus`, `zuschuss`, weil der Shop weder
berät noch abrechnet.

Die Begründungsform ist dieselbe wie bei „mieten" und „verleih" und nicht die
einer Marktvermutung: **nicht „kauft wahrscheinlich nicht", sondern „kann hier
nicht kaufen, was er sucht".** Von 66 auf 78 Ausschlüsse.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `kampagne` prüft die Ausschlüsse jetzt beim Bauen |
| Neue Gates | keine |
| Gegenproben | **66 für 35 Prüfer** (vorher 65) |
| Ausschlüsse | **78** (vorher 66) |
| Testfälle | 1634 |

## Was offen bleibt

- **Die drei Landeseiten** (`gruppe/wdvs.html`, `daemmung`, `kamin`) sind noch
  nicht so gelesen worden wie die Anzeigen. Der Klick endet dort.
- **Die Geo-Liste bleibt eine Auswahl**, keine Ableitung. Der Kommentar sagt
  warum („das wären hunderte Namen"), und die Nachbarbezirke des
  Liefergebiets — Rohrbach, Amstetten, Eferding, Wels-Land, Steyr-Land — sind
  bewusst **nicht** ergänzt: Ob jemand sie tippt, ist eine Marktannahme, und
  dieser Bestand trägt keine Marktannahmen als Tatsachen ein. Die freie
  Keyword-Planer-Messung, die ohnehin ansteht, beantwortet es.
- **Die Ausschlüsse „wie" und „test"** sind sehr breit. Ob sie mehr sparen als
  sie kosten, entscheidet dieselbe Messung.
