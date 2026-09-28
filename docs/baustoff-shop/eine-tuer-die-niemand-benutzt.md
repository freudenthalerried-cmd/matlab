# Eine Tür, die niemand benutzt

*Lauf vom 15. September 2026. Ein neuer Prüfer (`pruefe-beiwerte`, 65 ohne
Browser), 168 Registervorgaben angesehen, zwei eigene Fehler im ersten Lauf,
eine Gegenprobe. Und eine Entscheidung, 84 Verdachtsfälle nicht zu prüfen.*

---

## Die Frage der Vorrunde

Am Abend zuvor sind zwölf Regeln erreichbar geworden, die ihr eigenes Register
bewachen. Der Griff war jedes Mal derselbe: Das Register kommt als Beiwert
herein statt aus dem Modul gelesen zu werden. Bei einer Funktion lag der Fund
aber nicht dort, wo er aussah:

```js
export function punktebefund({ …, ohneMessung = OHNE_MESSUNG }) {
```

Die Kopfzeile trug den Beiwert längst. Der Rumpf nannte an **vier** Stellen
weiter `OHNE_MESSUNG`. Von außen war nichts zu erreichen, von innen sah alles
offen aus.

> **Eine Tür, die man einbaut und nicht benutzt, ist eine Wand mit Beschlag.**

Und das Entscheidende: Aufgefallen ist das **beim Lesen, nicht beim Messen**.
Genau dafür gibt es jetzt `npm run pruefe-beiwerte`.

## Was er misst

Jede Kopfzeile, die eine Registervorgabe trägt — `register = ZULIEFERUNGEN`,
`ohneMessung = OHNE_MESSUNG`, `satz = UST_SATZ_KUNDE` —, wird gegen ihren
Rumpf gehalten, **in beide Richtungen**:

| Regel | Fall |
|---|---|
| `beiwert-uebergangen` | Der Rumpf liest das Register trotzdem unmittelbar aus dem Modul |
| `beiwert-ungenutzt` | Der Rumpf nennt den Beiwert nie — er ändert nichts |
| `zu-wenig-gesehen` | Weniger als 120 Vorgaben gefunden: Die Zerlegung ist gebrochen, nicht der Bestand sauber |

Gemessen am 15. September: **168 Registervorgaben in 258 Modulen, keine
Meldung.** Der Prüfer findet heute nichts — er hält, was die Vorrunde
hergestellt hat. Das ist der ehrliche Satz dazu, und er gehört hierher und
nicht in die Fußnote.

## Was er ausdrücklich nicht prüft — und warum

Die naheliegende, größere Frage wäre: *Welche Befundfunktionen lassen ihr
Register überhaupt nicht herein?* Sie ist gemessen worden, bevor entschieden
wurde:

**84 von 183 Befundfunktionen** lesen irgendeine Modulkonstante unmittelbar.
Angesehen sind sie: Die allermeisten sind Suchmuster (`ZAHLMUSTER`, `QUELLE`,
`STAND`), Umsatzsteuersätze oder Zeilenmaße. Bei ihnen machte ein Beiwert
nichts erreichbar, sondern wäre bloß eine Stellschraube mehr — und ein Prüfer
darüber hätte an vier von fünf Stellen unrecht.

> **Eine Bauart ist kein Befund, sondern ein Verdacht.**

Wörtlich dieselbe Entscheidung wie am 13. September über die
Kopfzeilenprüfung, und sie ist hier zum zweiten Mal richtig. Dieser Prüfer
misst nur, was schon entschieden ist: Wo jemand die Tür gebaut hat, muss sie
auch die einzige sein.

## Zwei Fehler im ersten Lauf — beide meine

**Der erste: ein geteilter globaler Ausdruck.** Das Muster für die
Registervorgabe stand als `/…/g` im Modul, und zwei Funktionen benutzten es —
die eine mit `.test()`, die andere mit `matchAll()`. Beide lesen und schreiben
`lastIndex`, und zwar **über Aufrufe hinweg**. Der Prüfer meldete daraufhin
einen Beiwert namens `eter` — die zweite Hälfte von `anbieter`, weil die Suche
mitten im Wort ansetzte — und zählte **117 statt 168** Vorgaben.

> **Ein globaler Ausdruck, den zwei Funktionen teilen, teilt auch seinen
> Stand.**

Seither steht dort die Quelle als Zeichenkette und kein fertiger Ausdruck:
Jede Stelle baut sich ihren eigenen. Dazu kam ein `(?<![\w$])` davor, damit
eine Suche gar nicht erst mitten in einem Wort greifen kann.

**Der zweite: eine Schreibweise, die ich nicht gelesen hätte.** Der erste
Entwurf las nur Rümpfe in geschweiften Klammern. `ustText` in
`src/shopkern.js` ist eine Pfeilfunktion mit Ausdrucksrumpf —
`(satz = UST_SATZ_KUNDE) => …` — und die einzige ihrer Form im Bestand. Ein
Prüfer, der sie nicht kennt, meldet nicht zu wenig, sondern übergeht sie
still. Beide Formen stehen jetzt in `rumpfNach()`, und ein Testfall hält sie
fest.

Dass ein neuer Prüfer im ersten Lauf zwei eigene Fehler zeigt, ist kein
Ausrutscher, sondern der Grund, warum er läuft, bevor das Dokument
geschrieben wird.

## Die Untergrenze statt einer Sperrklinke

`MINDESTENS_VORGABEN = 120` ist **keine** Sperrklinke. Eine Sperrklinke darf
fallen und nie steigen; diese Zahl soll überhaupt nicht wandern. Sie fängt
genau einen Fall ab: Die Zerlegung bricht, findet nichts mehr und der Prüfer
meldet „keine Meldung". Das ist derselbe Griff wie `zuWenigQuellen` bei den
Namen und den Regeln — und hier war er in derselben Stunde nötig, in der die
Zerlegung tatsächlich brach.

## Die Gegenprobe

`die-tuer-wird-wieder-umgangen` baut die Bauart in eine **zweite** Funktion
ein: `zettelbefund` in `src/zettel.js` nimmt seit dem 10. September ein
`register` herein; die Mutation lässt eine Zeile wieder `ZULIEFERUNGEN` lesen.
Rot gesehen am 15. September. Gegenproben 308 → **309**.

## Was dieser Lauf nicht erreicht hat

- **Ob ein Beiwert von außen je gezogen wird**, prüft weiterhin nichts. Eine
  Funktion kann ihr Register sauber hereinlassen, und kein Testfall gibt je
  etwas anderes hinein — dann ist die Tür gebaut, benutzt und führt trotzdem
  nirgendwohin. Das ist messbar (die Aufrufstellen in `test/` stehen da), aber
  nicht gemessen.
- **Die 84 Verdachtsfälle** bleiben unangesehen, mit dem Grund oben. Angesehen
  ist die Liste, entschieden ist die Zurückstellung — nicht dasselbe wie
  „geprüft".
- **Klassen und Methoden** kennt die Zerlegung nicht. Im Bestand gibt es
  keine; käme eine, liefe der Prüfer still daran vorbei — genau wie er es bei
  der Pfeilfunktion getan hätte.

## Die Frage für den nächsten Lauf

Welche der 168 Registervorgaben bekommt von außen **je** etwas anderes zu
sehen als ihre eigene Vorgabe? Eine Tür, durch die nie jemand geht, unterscheidet
sich von einer Wand nur auf dem Papier — und das ist nach heute die letzte
Stelle dieser Kette, an der noch niemand nachgesehen hat.
