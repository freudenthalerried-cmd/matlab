# Der Kunde tippt den Plural

**Stand: 30. August 2026** · Befund und Behebung aus einem Lauf des
Arbeitsloops. Betroffen: `shop/src/shopkern.js`, `shop/data/suchwoerter.json`,
`shop/test/shopkern.test.js`.

## Der Befund

Ein Bauleiter sucht nicht nach *einer* Dämmplatte. Er tippt „dämmplatten",
„abflussrohre", „spachtelmassen", „schornsteine". Gemessen an 35 Paaren aus
dem Wortschatz dieses Katalogs:

> **31 der 35 verloren beim Wechsel in die Mehrzahl jeden Treffer.**

| Getippt | Treffer vorher | Treffer nachher |
|---|---|---|
| `dämmplatte` → `dämmplatten` | 10 → **1** | 10 → 10 |
| `schornstein` → `schornsteine` | 9 → **0** | 9 → 9 |
| `abflussrohr` → `abflussrohre` | 6 → **0** | 6 → 6 |
| `spachtelmasse` → `spachtelmassen` | 3 → **0** | 3 → 3 |
| `kanalbogen` → `kanalbögen` | 2 → **0** | 2 → 2 |
| `anputzleiste` → `anputzleisten` | 1 → **0** | 1 → 1 |

Der Grund steckt in der Trefferregel und ist einleuchtend, sobald man ihn
sieht: Die Suche kennt den **Wortanfang** und ab vier Zeichen die
**Wortmitte**. Damit findet ein *kürzeres* Suchwort das längere Indexwort —
„spachtel" findet den KlebeSpachtel. Umgekehrt nie. Und der deutsche Plural
ist fast immer die längere Form.

Zwei Spuren im Bestand zeigen, dass das schon aufgefallen war, ohne erkannt
zu werden: Im Kundenwörter-Register standen „rondellen" neben der
Artikelbezeichnung *Rondelle* und „dübelteller" neben „duebelteller" —
Handeinträge gegen eine fehlende Regel. Die Begründung des einen lautete
wörtlich: *„Der Suchindex kennt keine deutsche Mehrzahlbildung."*

## Die Behebung

Ein Wort ergibt jetzt **einen** Stamm, für Index und Frage nach derselben
Regel:

1. **Normalform.** Umlaut und Digraph fallen auf denselben Vokal:
   „mörtel", „moertel", „mortel" → `mortel`. Damit ist auch der alte
   Doppeleintrag jedes Umlautworts überflüssig.
2. **Eine Endung ab.** `ern em en er es e`, ein `s` nur nach geeignetem
   Vorgänger — die erste Stufe des deutschen Snowball-Stemmers. Keine
   Wortliste, kein Fremdmittel.

Die zweite und dritte Stufe (`heit`, `lich`, `keit`, `isch`) bleiben
absichtlich draußen: Sie machen aus Wortbildung Wortstamm und würden im
Sortiment Bedeutungen zusammenwerfen. Gemessen wurde der Plural; beantwortet
wird der Plural.

**Ergebnis: 35 von 35 Paaren finden dieselben Artikel.** Auch die vier
formgleichen (Ziegel, Dübel, Gewebe) — sie stehen absichtlich in der Liste,
weil eine Probe, die nur die schweren Fälle enthält, es nicht merkt, wenn die
leichten kaputtgehen.

## Der Fehler, den die Behebung eingebaut hat

Der erste Wurf war grün bis auf zwei Testfälle — und einer davon deckte
etwas auf, das schlimmer war als der Befund. Die Vertipperhilfe schlug
plötzlich vor:

> „dammplatt", „geweb", „spachtelmass"

Verstümmelte Wörter, die in keinem Katalog stehen. Der Grund: Sie zog ihren
Wortschatz aus demselben Index wie die Suche — und der enthielt jetzt Stämme.

> **Gesucht wird über Stämme, vorgeschlagen wird über Wörter.**

Beides steht jetzt nebeneinander im Index: `stark`/`schwach` tragen die
Stämme, `formen` trägt die ungestutzten Wörter. Verglichen wird über die
Normalform, angezeigt wird die Schreibweise des Katalogs. Nebenwirkung, die
eine ältere Zusage ablöst: Wer „daemmplate" tippt, bekommt jetzt
„dämmplatte" vorgeschlagen statt „daemmplatte" — also den Namen, unter dem
die Ware wirklich steht.

## Drei Sperren gebaut, eine behalten

Beim Stemmer ist leicht zu viel eingebaut. Ich hatte drei Sicherungen:

| Sperre | Gegenprobe | Ergebnis |
|---|---|---|
| R1-Regel von Snowball | abgeschaltet: **0 von 177** Bestandswörtern ändern ihren Stamm | entfernt |
| Mindestwortlänge 5 | auf 2 gesetzt: kein Test fällt um | entfernt |
| „Wörter mit Ziffern nicht stutzen" | abgeschaltet: kein Test fällt um | entfernt |
| **Mindeststammlänge 4** | auf 1 gesetzt: **zwei** Testfälle fallen um | **behalten** |

Von drei Regeln, die ich für nötig hielt, konnte keine ihre Wirkung zeigen.
Der Kommentar zur R1-Regel behauptete zusätzlich, sie halte „Mauer"
zusammen — nachgemessen fällt dort das `ue` der Normalform, mit oder ohne
Regel. Das ist dieselbe Fehlerklasse wie am 26. August: **eine Zusage, die
der Code nicht hält.** Nur steht sie diesmal in einem Kommentar über einer
Regel, die gar nichts tut.

Geblieben ist eine Zahl, die man nachrechnen kann: Ein Stamm behält
mindestens vier Zeichen. Deshalb wird aus „Boden" kein „bod".

## Was der Preis dieser Regel ist

Er wird hier genannt, damit ihn niemand später als Fehler meldet:

- **`ue` fällt mit `ü` zusammen.** Aus „Mauer" wird `maur`, aus „Feuer"
  `feur`. Das ist der Preis dafür, dass „duebel" den Dübel findet — und er
  trifft Index und Frage gleich, verliert also keinen Treffer.
- **Ein Wortteil am Ende eines Kompositums.** Nachgetragen am selben Tag:
  „bogen" fand die *Kanalbögen* nicht mehr, weil der Index sie auf `kanalbog`
  stutzte und die kurze Frage ihr `-en` behielt. Der Index trägt seither
  beides, Stamm und ungestutzte Normalform; siehe
  [`was-die-gruppenseite-verspricht.md`](./was-die-gruppenseite-verspricht.md).
- **Die bloße `-n`-Endung fällt nicht.** „mit Dübeln" bleibt ungefunden.
  Snowball kennt sie nicht, und sie einzeln nachzurüsten hieße, eine Regel
  ohne Messung einzubauen — siehe die Tabelle oben.
- **Der Stamm ist kein Wörterbuch.** Umlautplurale gehen durch, solange der
  Vokal derselbe bleibt: „Bänder" → `band`, „Häuser" → `haus`,
  „Kanalbögen" → `kanalbog`. Wo der Plural den Vokal *wechselt* statt ihn nur
  zu färben, hört die Regel auf. Im Sortiment kommt der Fall nicht vor; wenn
  er kommt, ist ein Kundenwort im Register die ehrlichere Antwort als eine
  Regel, die raten muss.

## Was die Gegenprobe geprüft hat

Ein Stemmer, der zu viel abschneidet, macht aus zwei Wörtern eines — und
gerade hier wäre das teuer: Das Register lehnt 23 Wörter **begründet** ab,
weil der Shop die Ware nicht führt, und ein Zufallstreffer würde auf
Ersatzware zeigen. Gemessen, alt gegen neu:

- **23 Ablehnungen:** keine einzige findet auf einmal etwas.
- **45 Kundenwörter:** keines verliert einen Treffer, keines gewinnt einen
  falschen.

Beides steht jetzt als Testfall da, nicht nur als Messung dieses Laufs.

## Nebenwirkung: zwei Registereinträge sind entfallen

`dübelteller` (reine Umlautschreibweise) und `rondellen` (reine Mehrzahl)
sind gestrichen — 47 Kundenwörter werden 45. Beide finden weiterhin die
Rondelle, jetzt über die Regel statt über die Handarbeit. Die Streichung
steht mit Begründung unter `_entfallen` in der Datei, damit ein späterer Lauf
sie nicht für vergessen hält und wieder einträgt.

Das ist der eigentliche Gewinn: Nicht zwei Einträge weniger, sondern zwei
Stellen weniger, die auseinanderlaufen können.

## Stand

852 Tests grün (vorher 847), `pruefe-tests` 849/0, `pruefe-preise` 46/0,
`pruefe-seiten` 81/81, `rahmenzensus` 81/81.
