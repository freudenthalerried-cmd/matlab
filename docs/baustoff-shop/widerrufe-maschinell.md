# Der vierte Überlebende — und warum ihn diesmal eine Maschine gefunden hat

Stand: 2026-08-27. Dreimal in vier Tagen ist derselbe Fehler passiert: Eine
Aussage wird in einem Dokument zurückgenommen, und in einem
**Nachbardokument** steht sie unverändert weiter. Jedes Mal fiel es
zufällig auf, jedes Mal Stunden später, jedes Mal beim Lesen aus einem
anderen Anlass.

| | widerrufen in | überlebt hatte er in |
|---|---|---|
| Der Heimatbezirk sei Ried im Innkreis | `zwei-ried.md`, 26.08. | vier Dokumenten |
| Nur der Rechnungskauf verletze Gate 21 | `zahlungsziel-entschieden.md`, 26.08. | vier Stellen |
| Die Trennlinie sei die Warengruppe, dann der Rohstoff | `lagerhaus-rabatte-gelesen.md`, 27.08. | `zweiter-bezugsweg-lagerhaus.md` |

> **Der Widerruf ist billig, das Nachziehen ist die Arbeit.** Wer eine These
> zurücknimmt, schreibt das dort auf, wo er gerade schreibt — und genau dort
> ist sie schon berichtigt. Die Kopien stehen woanders.

Diese Runde macht die Prüfung maschinell: `npm run pruefe-widerrufe`.

## Die Regel, vor dem ersten Treffer festgelegt

Der naheliegende Ansatz wäre eine Verbotsliste: Das Wort darf nicht mehr
vorkommen. Er wäre falsch. **Widerrufene Sätze müssen zitierbar bleiben**,
sonst verliert das Verzeichnis seine Fehlergeschichte — und die ist der
wertvollste Teil daran. Die Regel lautet deshalb:

> **Eine widerrufene Aussage darf überall stehen — aber nie ohne ihren
> Widerruf in Sichtweite.**

„In Sichtweite" ist ausbuchstabiert, damit es prüfbar ist: **acht Zeilen
darüber oder darunter**, oder ein **Kopfvermerk als Zitatblock in den
ersten fünfzehn Zeilen** der Datei, der dann für das ganze Dokument gilt.
Der Kopfvermerk ist keine Erfindung — `rechnung-zum-zuschlag.md` macht es
seit dem 25. August genau so vor.

Der Prüfer ist damit gebaut wie `pruefe-inhalte`: ein grober Musterprüfer,
der einen **Verdacht** meldet, kein Urteil. Was er findet, gehört
angesehen.

## Zwei Entwürfe, die daneben lagen — und was sie gezeigt haben

**Erster Entwurf: eine großzügige Merkmalsliste.** Als Widerrufsmerkmal
galten auch „falsch", „gestrichen", „nicht mehr". Ergebnis: Der Prüfer
verstummte genau an der Stelle, für die er gebaut worden war. In
`umsetzung-shop.md` steht acht Zeilen unter dem stehengebliebenen Irrtum
der Satz *„Gegenproben: Ried gestrichen"* — der etwas völlig anderes
meint. **Ein Merkmal, das zufällig danebensteht, ist kein Widerruf.**

**Zweiter Entwurf: eine enge, aber allgemeine Liste.** Sie meldete zehn
Stellen, davon sieben zu Unrecht: In `marge-25-prozent.md` steht „25 %
Zuschlag" in Vergleichstabellen, sauber als *(bisher)* gekennzeichnet. Der
Versuch, die allgemeine Liste um „bisher", „historisch", „alte Annahme" zu
erweitern, hätte sie wieder in den ersten Fehler zurückgeführt: In
`STATUS.md` steht acht Zeilen unter der alten Zuschlagsrechnung, dass
*Gate 1* abgelöst wurde — eine Berichtigung, ja, aber eine andere.

Der Ausweg war nicht ein besseres allgemeines Wort, sondern ein
**eintragseigenes Merkmal**:

> **Ein Widerruf deckt nur seine eigene Aussage.** Neben „25 % Zuschlag"
> muss „25 % Marge" stehen, nicht irgendein Berichtigungswort. Neben „Ried
> im Innkreis" muss „Riedmark" oder „Bezirk Perg" stehen.

Damit blieben von zweiunddreißig Fundstellen **drei** übrig — und alle
drei waren echt.

## Was er gefunden hat

### 1. `umsetzung-shop.md:95` — der vierte Überlebende

> Die Demo fragt den Bezirk der Baustelle ab; Beispielwert ist Ried im
> Innkreis, der ausgenommene **Heimatbezirk des Betreibers**.

Genau die Zuschreibung, die `zwei-ried.md` am 26. August als Verwechslung
aufgelöst hat. Sie stand noch da — im **Baustandsdokument**, also in dem
Dokument, das ein späterer Lauf zuerst liest.

### 2. `auftrag-baumeisterpreise.md` — die Frage ohne Antwort

Dieses Dokument hält die Weisung vom 22. August wörtlich fest und rechnet
„+25 %" als Zuschlag auf den Einkauf (= 20 % Rohmarge). Es stellt die
Zweideutigkeit sogar ausdrücklich als offene Frage:

> Ist „+25 %" als Zuschlag auf den Einkauf gemeint (→ 20 % Rohmarge) oder
> als Rohmarge von 25 %?

**Der Auftraggeber hat sie am 25. August beantwortet — im Dokument steht
sie bis heute offen.** Das ist die unangenehmere Sorte Fund: keine falsche
Aussage, sondern eine beantwortete Frage, die weiter nach Ungewissheit
aussieht. Wer sie liest, hält den Punkt für ungeklärt und rechnet
vorsichtshalber mit der ungünstigeren Lesart. Der Unterschied beträgt
27.384 € Monatsumsatz.

Jetzt trägt das Dokument einen Kopfvermerk und die Frage einen
durchgestrichenen Nachtrag.

### 3. `STATUS.md:23` — die Zahl ohne ihre Berichtigung

Der Kurswechsel-Kasten vom 22. August nennt *„Gate 1 (25 % Zuschlag = 20 %
Rohmarge)"*. Die Berichtigung steht neun Zeilen darunter im Nachtrag vom
25. August — eine Zeile außerhalb der Sichtweite. Wer den Kasten
sequenziell liest, stolpert nicht; wer per Suche mitten hineinspringt, tut
es. Das ist derselbe Befund wie gestern bei der Gefälletabelle in
`norm-b2501-und-die-falsche-norm.md`: **Die Berichtigung muss an der Zahl
kleben, nicht in der Nähe liegen.** Die Berichtigung steht jetzt in der
Klammer.

Nach den drei Berichtigungen: 108 Dateien, 32 Fundstellen, **keine
Meldung**.

## Die Gegenprobe

Ein Prüfer, der schweigt, ist erst dann eine gute Nachricht, wenn er
beweisen kann, dass er nicht taub ist. Die widerrufene Rohstoff-These
wurde in einer Kopie von `zweiter-bezugsweg-lagerhaus.md` wieder
eingesetzt — der Prüfer meldet sie mit Datei, Zeile und der Angabe, was
stattdessen gilt. Die Kopie lag im Scratchpad; das Verzeichnis blieb
unberührt.

Dazu ein Testfall, der leicht zu übersehen gewesen wäre: **Findet jedes
Muster seinen eigenen widerrufenen Wortlaut noch?** Ein Muster, das nichts
mehr trifft, meldet nichts — und sieht damit aus wie ein Erfolg. Genau so
ist die erste Fassung des Registers durchgefallen: Die Beschreibung stand
im Konjunktiv („das Lagerhaus *staffele*"), das Muster suchte den
Indikativ. Deshalb hält jeder Eintrag jetzt den **ursprünglichen Wortlaut**
fest, und der Test prüft das Muster gegen ihn.

## Was das Register enthält

| Kennung | zurückgenommen | seit |
|---|---|---|
| `heimatbezirk-innkreis` | Der Heimatbezirk sei Ried im Innkreis und ausgenommen | 26.08. |
| `gate21-nur-rechnungskauf` | Nur der Rechnungskauf könne Gate 21 verletzen | 26.08. |
| `lagerhaus-regal-gegen-baustelle` | Fest gestaffelt sei, was im Regal liegt | 27.08. |
| `lagerhaus-rohstoff` | Die Trennlinie sei der Rohstoff | 27.08. |
| `marge-als-zuschlag` | „25 %" seien Zuschlag auf den Einkauf | 26.08. |

Jeder Eintrag nennt: was behauptet wurde, was stattdessen gilt, wann und
wo es zurückgenommen wurde, ein Suchmuster und den ursprünglichen
Wortlaut. Das Register liegt in `shop/src/widerruf.js` — im Rechenkern,
nicht in einer Textdatei, damit Tests es lesen können.

**Der Eintrag ist der eigentliche Ertrag, nicht der Prüflauf.** Eine
zurückgenommene Aussage ist bisher nirgends als solche geführt worden; sie
stand als Fließtext in dem Dokument, das sie zurücknahm. Wer sie später
suchte, musste wissen, dass es sie gibt.

## Die Pflicht, die daraus folgt

> **Wer künftig eine Aussage widerruft, trägt sie ins Register ein.** Der
> Lauf, der den Widerruf schreibt, ist der einzige, der noch weiß, was
> genau zurückgenommen wurde — jeder spätere muss es rekonstruieren.

Das ist kein Gate: Es entscheidet nichts über das Geschäft, es hält eine
Arbeitsweise fest. Aber es gehört in die Prüfkette vor der Freigabe, neben
`pruefe-inhalte`, `pruefe-quellen` und `pruefe-geheimnis`.

## Was der Prüfer nicht kann

| | |
|---|---|
| **Umformulierungen** | Er sucht Muster, keine Bedeutung. Wer die These in anderen Worten wiederholt, kommt durch. |
| **Unbekannte Widerrufe** | Er findet nur, was im Register steht. Ein nicht eingetragener Widerruf ist für ihn nicht passiert. |
| **Code und Demo** | Er läuft über `docs/baustoff-shop/`. Ein Irrtum in Testdaten fällt weiter nur der Oberflächenprobe auf — so wie beim Innkreis-Fall. |

Die zweite Grenze ist die ernste, und sie ist nicht technisch: **Das
Register ist so vollständig, wie die Läufe diszipliniert sind.** Die fünf
Einträge stammen aus dem Gedächtnis dieses Laufs und aus einer Suche nach
„berichtigt", „widerlegt", „Irrtum" im Bestand. Ältere Widerrufe, die
diese Wörter nicht verwenden, fehlen möglicherweise.

627 Testfälle grün, davon 11 neue.
