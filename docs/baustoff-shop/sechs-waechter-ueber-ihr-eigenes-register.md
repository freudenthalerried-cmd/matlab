# Sechs Wächter über ihr eigenes Register

*Lauf vom 15. September 2026. Ungesehene Regelstellen 31 → 19 von 484,
zwölf Testfälle, eine neue Testdatei, eine Gegenprobe, keine neue Regel.*

---

## Die offene Frage der Vorrunde

Am Ende der letzten Runde stand die Frage: *„Wie viele der verbliebenen Regeln
bewachen eine zweite Sperre und können deshalb gar nicht feuern?"* — und die
Vermutung, dass der Griff, der bei `papierschrittbefund`, `nummernbefund` und
`stempelbefund` getragen hatte, auch weiter trägt. Beides war nicht gemessen.

Gemessen sind die 31 ungesehenen Stellen jetzt: **6 in `bin/`, 25 in `src/`**.

## Was in `bin/` steht — und warum es dort bleibt

Fünf der sechs `bin/`-Stellen sind keine eigenen Befunde, sondern Umhüllungen:

| Stelle | ruft | geprüft in |
|---|---|---|
| `bin/ablagepruefung.mjs` — `voraussetzung-fehlt`, `papiere-widersprechen-sich` | `luecken()`, `widersprueche()` aus `src/vorgangsstand.js` | `test/vorgangsstand.test.js:167ff` |
| `bin/systemtreuepruefung.mjs` — `bruch-nicht-erkannt`, `bruch-ohne-bruch`, `kasse-schweigt` | `systembruch()` aus `src/systemtreue.js` | `test/systemtreue.test.js:72, 87, 94` |

Die **Entscheidung** ist, sie nicht zu verschieben. Man könnte jede dieser
fünf Zeilen in eine Funktion in `src/` heben und dort anschlagen sehen; der
Zähler fiele um fünf. Gewonnen wäre nichts: Was die Regel prüft, ist in beiden
Fällen längst gemessen, und das Ergebnis wäre eine Umleitung, die nur dafür da
ist, einen Zähler zufriedenzustellen.

> **Ein Prüfer, der einen Messwert nur verschiebt, hat ihn nicht verbessert.**

Das gehört hier hin, weil die Sperrklinke sonst irgendwann genau zu solchen
Umbauten zwingt. Sie zählt Stellen ohne roten Fall — sie zählt nicht, ob eine
Sache geprüft ist.

## Der eigentliche Fund: sechs Wächter, die ihr eigenes Register bewachen

Von den 25 `src/`-Stellen gehören zwölf zu einer einzigen Bauart, und es ist
**dieselbe** wie an den drei Vortagen, nur eine Stufe allgemeiner:

Ein Befund prüft nicht die Welt, sondern **das Register, aus dem er selbst
liest** — ob jede Zeile einen Grund nennt, ob ein Eintrag beides zugleich
angibt, ob eine Ausnahme noch auf etwas zeigt. Und weil im Bestand jedes
dieser Register in Ordnung ist, hat kein einziger dieser Wächter je
angeschlagen.

| Modul | Regeln | was sie bewachen |
|---|---|---|
| `src/punktezahlen.js` | `freibrief-ohne-gegenstand`, `freibrief-ohne-grund` | `OHNE_MESSUNG` — jeder Freibrief nennt Zahlen **oder** Form und einen Grund |
| `src/zettel.js` | `ohne-wofuer`, `ohne-grund`, `ohne-form` | `ZULIEFERUNGEN` — jede Zeile sagt wofür, worauf sie beruht und wie sie aussieht |
| `src/tagx.js` | `gefuehrt-und-ohne-wirkung`, `angabe-erreicht-bestaetigung-nicht` | zwei Listen über denselben Tag X, gegeneinander |
| `src/warenkorbdeckung.js` | `korbposition-ohne-namen`, `grund-fuer-etwas-ausserhalb` | Korbgründe gegen die Systemliste |
| `src/absage.js` | `ohne-satz`, `ohne-herkunft` | `ABSAGEGRUENDE` — jeder Grund hat einen Kundensatz und eine Herkunft |
| `src/hersteller.js` | `zweite-markenliste`, `ausnahme-ohne-datei` | die **eine** Markenliste und ihre eine Ausnahme |

> **Ein Register, das stimmt, macht seinen eigenen Wächter unsichtbar.**

Das ist keine Kleinigkeit. Diese zwölf Regeln sind genau die, die anschlagen
sollen, **wenn jemand das Register erweitert** — also in dem Augenblick, in
dem niemand hinsieht, weil man ja nur eine Zeile hinzufügt. Ob sie das können,
war bis heute unbekannt.

## Der Griff, der trägt

Fünf der sechs Funktionen nahmen ihr Register bereits als Beiwert entgegen —
`zettelbefund(betreiber, kostenlosLeer, register = ZULIEFERUNGEN)`,
`betreiberbefund(betreiber, angaben, ohne)`, `korbbefund({koerbe, systemlisten})`,
`absagebefund(bekannteGruende, eintraege = ABSAGEGRUENDE)`,
`markenlistenbefund(dateien, namen, ohneKommentare, ausnahmen = NICHT_DURCHSUCHT)`.
Der Beiwert stand da; **gebraucht** hatte ihn niemand.

Die sechste, `punktebefund`, las `OHNE_MESSUNG` an vier Stellen unmittelbar
aus dem Modul. Sie ist damit das **vierte** Mal derselbe Griff in zwei Tagen:

```js
export function punktebefund({
  punkte, messwerte, gibtEs, vollstaendig = false, ohneMessung = OHNE_MESSUNG,
}) {
```

und alle vier Lesestellen ziehen den Beiwert, nicht das Modul. Der Umbau ist
für sich genommen unsichtbar — deshalb hält ihn eine Gegenprobe fest, die ihn
zurücknimmt: `der-freibrief-prueft-sich-selbst-nicht-mehr` ersetzt
`for (const e of ohneMessung)` wieder durch `OHNE_MESSUNG`, und der Testfall
über den Eintrag ohne Gegenstand fällt um. Rot gesehen am 15. September.

## Was dabei auffiel

**`src/hersteller.js` hatte überhaupt keine eigene Testdatei.** Das Modul
führt die eine Markenliste dieses Hauses, den Hersteller-Leser `marke()` und
den Prüfer, der verhindert, dass eine zweite Liste entsteht — geprüft wurde es
bisher nur nebenbei aus `test/systemtreue.test.js` und
`test/maschinenlesbar.test.js`, die beide etwas anderes messen. Seit heute
steht `test/hersteller.test.js` mit sechs Fällen; Testdateien 174 → **175**.

**Die Marken werden an erfundenem Quelltext gemessen, nicht am Bestand.** Der
grüne Fall — es gibt genau eine Liste — wird schon von `pruefe-systemtreue`
gehalten. Ein zweiter Test darüber hätte nichts hinzugefügt; was fehlte, war
der **rote** Fall, und den kann nur eine erfundene Datei liefern.

## Die Sperrklinke

`UNGESEHENE_HOECHSTENS` in `src/regelnamen.js`: 80 → 67 → 56 → 47 → 43 → 38 →
31 → **19**. Zwölf Stellen an einem Abend, und zwar ohne eine einzige neue
Regel — der ganze Gewinn liegt darin, dass Register, die man prüfen will, als
Beiwert hereinkommen müssen.

Die Zahl steht zugleich in `VORSCHLAG_GEPRUEFT` (`src/zwillingszahlen.js`),
weil sie im engen Band liegt: 19 kommt außerdem als Gate-Nummer und als
Zeilenzahl vor, und beide wandern nie mit ihr mit.

## Was dieser Lauf **nicht** erreicht hat

- **Die 13 übrigen `src/`-Stellen** sind nicht derselbe Fall. Sie verteilen
  sich über `ausschluss.js`, `aussenlage.js`, `belegpruefung.js`,
  `bezeichnungsmass.js`, `gatestand.js`, `kennzahlen.js`, `lieferungen.js`,
  `posteingang.js`, `pruefregister.js`, `systemlisten.js`, `weisungsstand.js`
  und `zwillingszahlen.js` — ob dort ein gemeinsamer Grund liegt oder
  dreizehn einzelne, ist **nicht gemessen**.
- **Ob der Beiwert auch benutzt wird**, prüft nichts. Eine Funktion kann ihr
  Register als Beiwert nehmen und es an einer Stelle trotzdem aus dem Modul
  lesen — genau das war `punktebefund` heute an vier Stellen, und aufgefallen
  ist es beim Lesen, nicht beim Messen.
- **Die sechs `bin/`-Stellen** bleiben ungesehen, mit dem Grund oben. Sie
  stehen damit in derselben Lage wie die zwei Einträge in `REGEL_GEPRUEFT` —
  nur ist ihr Grund bisher **hier** aufgeschrieben und nicht dort.

## Die Frage für den nächsten Lauf

Kann man messen, ob ein Beiwert wirklich gezogen wird? Eine Funktion, die
`register = REGISTER` in der Kopfzeile führt und im Rumpf `REGISTER` nennt,
ist von außen nicht zu erreichen und sieht trotzdem erreichbar aus. Das ist
**kein Verdacht, sondern ein gemessener Fall** — heute, viermal, in einer
einzigen Funktion.
