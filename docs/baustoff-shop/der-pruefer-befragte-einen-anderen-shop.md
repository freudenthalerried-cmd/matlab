# Der Prüfer befragte einen anderen Shop

**6. September 2026, vormittags.** Vierte Runde durch die Kampagne. Diesmal die
Regel, die seit dem 1. September als **Kommentar** in `bin/kampagne.mjs` steht,
neben dem einen Keyword, das an jenem Tag entfernt wurde:

> *„Auf ein Wort zu bieten, das die eigene Suche nicht beantwortet, ist ein
> bezahlter Klick auf eine leere Trefferliste."*

Ein Satz, ein Fall, kein Prüfer. Genau die Gestalt, die dieser Bestand heute
schon zweimal gefunden hat — und **beide Male war die Regel dann verletzt.**

---

## Diesmal nicht. Und beinahe hätte ich das Gegenteil gemeldet.

Erste Messung, Index aus Artikeln und Suchwörtern gebaut:

```
Keywords: 30 · ohne Treffer in der eigenen Suche: 3
   ✗ Putzgrund Fassade
   ✗ WDVS System kaufen
   ✗ Kaminsystem einzügig
```

Drei bezahlte Suchbegriffe ohne Antwort — der Befund schien fertig. Und
„Kaminsystem einzügig" ist besonders schön: **„Schiedel Kaminsystem" ist die
erste Überschrift der Kamin-Anzeige.** Die Anzeige würde ihr eigenes Wort nicht
finden.

Es stimmte nicht. Der Index, den der Besucher im Browser bekommt, enthält
neben den 46 Artikeln auch **24 Inhaltsseiten** — Wissensseiten, Systemlisten,
Gruppenseiten. Mit ihnen:

```
Seiten im Index: 24 · Keywords: 30 · ohne Treffer: 0
```

> **Ein Prüfer, der einen anderen Index befragt als der Kunde, misst einen
> anderen Shop.**

Und der Fehler war teuer im Beinahe: Die „Berichtigung" wäre gewesen, drei
Suchwörter ins Register zu schreiben, damit die Anzeige etwas findet. **Genau
so ist der Fehler entstanden, den die Runde davor gefunden hat** — `suchwoerter.json`
begründet einen Eintrag mit *„ist Keyword des ersten Anzeigenanlaufs"*.

*Ich hätte denselben Fehler noch einmal gemacht, in derselben Datei, einen Tag
später, um eine Prüfung zu bedienen, die selbst falsch gemessen hat.*

---

## Was gemessen dasteht

`npm run kampagne` prüft seither zwei Fragen, und nur die erste ist eine Regel:

**1. Findet die Suche überhaupt etwas?** Nichts zu finden ist die leere
Trefferliste aus dem Kommentar. Rot, und es wird nichts geschrieben.

**2. Ist ein Artikel darunter?** Wird gezählt und genannt, nicht abgewiesen:

```
Eigene Suche: 30 geführte Keywords, alle mit Treffer,
              27 davon mit mindestens einem Artikel.
  · „Putzgrund Fassade"      führt nur auf gruppe:WDVS-Komponenten
  · „WDVS System kaufen"     führt nur auf gruppe:WDVS-Komponenten,
                             wissen:Was zu einem WDVS gehört
  · „Kaminsystem einzügig"   führt nur auf gruppe:Kaminsystem
```

**Das ist kein Fehler.** Für eine Systemfrage ist die Gruppenseite die richtige
Antwort, und der Klick aus der Anzeige landet ohnehin dort. Es steht trotzdem
da, weil eine Zahl, die niemand sieht, keine Messung ist.

---

## Was auffällt und nicht geändert wurde

**„Putzgrund Fassade" ist der schwächste der drei.** Der Shop führt *Capatect
Putzgrund weiß 25 kg*; der Artikel heißt nur nicht „Fassade", und zwei Wörter
grenzen in dieser Suche ein, statt zu erweitern — eine Entscheidung vom
28. August, die ein Browserszenario schützt („XPS 50" darf nicht die 100er
finden).

Der naheliegende Griff wäre, dem Wort „Fassade" die WDVS-Bauteile zuzuordnen.
**Nicht getan.** Es wäre wieder eine Erweiterung des Suchregisters, damit eine
Anzeige besser dasteht — und die Runde davor hat gezeigt, wohin das führt. Wenn
diese Zuordnung richtig ist, dann ist sie es aus einem Grund über die Ware, und
den hat noch niemand aufgeschrieben.

---

## Die Gegenprobe mutiert den Index, nicht die Wortliste

Der erste Versuch setzte ein Wort in die Keywordliste, das der Shop nicht
führt — und die Gegenprobe blieb **grün**: Das Wort wurde schon eine Stufe
früher zurückgehalten, weil die Landeseite es nicht sagt.

> **Die vorhandene Deckungsprüfung fängt fast alles, was diese Regel fangen
> soll — weil die Suche dieselben Seiten liest, gegen die sie prüft.**

Deshalb mutiert `gebot-auf-die-leere-trefferliste` den **Index**: `seiten: []`,
genau der Fehler des ersten Messversuchs. Drei Keywords finden dann nichts, und
der Lauf wird rot. Damit hält die Gegenprobe beides wach — die Regel und die
Bedingung, unter der sie etwas wert ist.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Regeln | `suchdeckungsbefund` in `src/suchdeckung.js`, im Kampagnenlauf |
| Neue Gegenproben | `gebot-auf-die-leere-trefferliste` |
| Neue Testfälle | 4 (`test/suchdeckung.test.js`) |
| Gefundene Fehler | **keine** — und das ist das Ergebnis |
| Neue Gates | keine |

## Was offen bleibt

- **„Putzgrund Fassade" findet keinen Artikel.** Ob das Wort „Fassade" auf die
  WDVS-Bauteile gehört, ist eine Frage über die Ware und nicht über die
  Anzeige. Sie ist gestellt und nicht beantwortet.
- **Die Regel ist zum größten Teil redundant** zur vorhandenen
  Deckungsprüfung, weil die Suche dieselben Seiten liest. Sie bleibt, weil der
  Rest nicht redundant ist: ein Keyword, dessen Wörter auf der Seite stehen,
  aber in keinem Indexeintrag zusammen.
- **Die Gebietsfrage an den Lieferanten** und die sieben Punkte in
  `npm run startklar` — alle beim Auftraggeber.
