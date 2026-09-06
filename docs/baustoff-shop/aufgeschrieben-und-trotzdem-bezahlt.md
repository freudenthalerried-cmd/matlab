# Aufgeschrieben, und trotzdem bezahlt

**6. September 2026, spätabends.** Am Nachmittag war die Frage, ob die Antwort
aus dem Register „was wir nicht führen" den Kunden auf der Suchseite erreicht.
Sie tut es seither. Die Anschlussfrage stellte sich von selbst: **Was macht die
Kampagne mit diesen 24 Wörtern?**

```
Wörter im Register „das führen wir nicht":   24
davon in der Ausschlussliste der Kampagne:    0
```

**Keines.** Die Anzeigen laufen auf *Phrase* — sie erscheinen, sobald die
Anfrage den Produktbegriff enthält. „XPS 80 mm **Sockelschiene**" enthält ihn,
„Oberputz **Silikatputz**" auch. Der Klick wird bezahlt, und am Ende steht ein
Satz, der mit *„führen wir nicht"* beginnt.

> **Ein Betrieb, der aufschreibt, was er nicht hat, und weiter dafür bezahlt,
> hat die Liste für den falschen Leser geschrieben.**

Es ist dieselbe Begründung, mit der die Gruppe „Falsche Absicht" ihre Wörter
trägt — nicht *„kauft wahrscheinlich nicht"*, sondern **kann hier nicht kaufen,
was er sucht.** Der Unterschied: Dort steht sie in einem Kommentar, hier stand
sie in einem zweiten Register, das niemand gegen das erste gehalten hat.

---

## Abgeleitet, nicht abgeschrieben

Die naheliegende Antwort wäre gewesen, 24 Zeilen in `NEGATIVE` zu tippen. Das
wäre ein zweiter Eintrag desselben Sachverhalts — und dieser Bestand weiß seit
heute früh, was daraus wird: ein Feld, das jemand nachführen muss.

`src/nichtgefuehrt.js` leitet die Ausschlüsse bei jedem Lauf aus dem Register
ab. Neu in `ausgabe/kampagne/negative-keywords.csv`: **21 Zeilen** unter dem
Thema „Nicht im Sortiment", von 76 auf 97 Ausschlüsse.

---

## Drei bleiben zulässig, und zwar gemessen

Ein Ausschluss, der im eigenen Seitentext gewöhnliches Deutsch ist, trifft die
eigene Kundschaft — der Fall von heute früh („vergleich", 39× im eigenen Text,
im Satz, der das Verkaufsargument trägt). Dieselbe gemessene Grenze
(`EIGENWORTGRENZE = 10`) entscheidet hier:

| Wort | Fundstellen | warum es zulässig bleibt |
|---|---|---|
| `gleitmittel` | 19 | steht auf der Kanalliste als Position, die anderswo zu besorgen ist |
| `abdichtung` | 17 | steht auf Perimeter- und Kellerwandseiten — **über** der Abdichtung wird gedämmt |
| `drainage` | 2 | steht im geführten Keyword „Drainage Grundmauerschutz" |

Wer „Abdichtung" tippt, während er die Kellerwand plant, ist der Leser, für den
die Perimeterseite geschrieben ist. Und **worauf geboten wird, wird nicht
ausgeschlossen** — ein Ausschluss, der ein eigenes Keyword trifft, schaltet die
eigene Anzeige ab.

---

## Der Abgleich läuft in beide Richtungen

`deckungsbefund` hält Register und Ausschlussliste gegeneinander:

* **vorwärts** — jedes Registerwort ist ausgeschlossen oder zurückgehalten
  **mit einem Grund von mindestens 30 Zeichen**;
* **rückwärts** — kein abgeleiteter Ausschluss ohne Eintrag im Register, und
  kein Wort, das zugleich als ausgeschlossen und als zurückgehalten geführt
  wird;
* und die Ausschlüsse laufen durch **dieselbe Kollisionsprüfung** wie die von
  Hand geführten: kein Bezirksname, nicht der Ort des Betriebs, kein geführtes
  Keyword.

Der Prüfer der Ausschlussfläche (`ausschlussbefund`) bekommt die abgeleiteten
Wörter seit heute mit hinein. Ohne das hätte er eine kleinere Reichweite gehabt
als die Regel, die er prüft — die Familie, die dieser Bestand am häufigsten
findet.

---

## Geprüft

`test/nichtgefuehrt.test.js`, 13 Fälle: die Ableitung (unter/über der Grenze,
Keywordkollision), der Abgleich in beide Richtungen, und zwei Fälle über den
**Bestand** — jedes der 24 Registerwörter ist im gebauten CSV ausgeschlossen
oder hat einen gemessenen Grund, und kein abgeleiteter Ausschluss steht ohne
Registereintrag da. Der Ausnahmefall `drainage` steht namentlich in der
Zusicherung, damit ein zweiter nicht stillschweigend dazukommt.

Gegenprobe `nicht-gefuehrt-und-trotzdem-beworben` hält jedes Wort zurück und
stellt damit den alten Zustand wieder her.

---

## Was offen bleibt und benannt ist

Das Keyword **„Drainage Grundmauerschutz"** gehört zur zurückgestellten Gruppe
Kanal. Es ist vertretbar — gesucht wird der Grundmauerschutz, den wir führen —,
aber seine Landeseite (`gruppe/kanal.html`) sagt kein Wort über den
Unterschied; der Abgrenzungssatz steht auf der Wissens- und der Systemseite.
Ein bezahlter Klick landete also auf einer Seite, die die Frage nicht
beantwortet, die er gestellt hat.

Der Prüfer aus der Runde vom 1. September misst Keywords gegen den Text ihrer
**Landeseite** und findet dort nichts zu verneinen. **Zwei Register über
denselben Sachverhalt, und jeder Prüfer kennt nur eines** — die Auflösung
(Abgrenzungssatz auf die Landeseite, und was das für die Keywordprüfung
bedeutet) gehört in eine eigene Runde, weil sie den Keywordbestand ändert.
Solange die Gruppe zurückgestellt ist, kostet der Fall nichts.
