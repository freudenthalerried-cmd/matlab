# Die dritte Zeile der maßgeblichen Datei

**9. September 2026.** Die PR-Beschreibung sagt: *„Bei Gate-Fragen gilt
`gate-register.md`."* Die Datei sagte über sich selbst:

```
Stand: 2026-08-27. **Maßgeblich für alle Gate-Fragen.** Vierundzwanzig
Entscheidungen sind über die Phasen verteilt gefallen.
```

Siebenunddreißig Zeilen tiefer:

```
## Die einunddreißig Gates
```

Dasselbe Dokument, **sieben Gates Unterschied, zwölf Tage**.

> **Ein Dokument, das „maßgeblich" von sich sagt, wird oben gelesen und nicht
> ganz.** Wer nach drei Zeilen weiß, was er wissen wollte, geht mit der
> falschen Zahl.

---

## Der Prüfer hatte die richtige Zahl in der Hand

`npm run pruefe-gates` liest die Tabelle seit dem 7. September und zählt
**31**. Es hat die Zahl nie gegen die gehalten, die das Dokument über sich
druckt.

Das ist derselbe Schnitt wie am 5. September bei `STATUS.md`, eine Datei
weiter — damals entstand `src/statuskopf.js` mit genau dieser Begründung:

> **Die Aussagen eines Dokuments über genau das, was der Prüfer ohnehin misst,
> sind ohne jedes Textverständnis prüfbar.**

Die Regel wurde geschrieben, angewandt — **auf ein Dokument** — und daneben
stand ein zweites mit derselben Eigenschaft. Vier Tage lang.

---

## Was jetzt gemessen wird

Drei Angaben, keine vierte, alle drei Aussagen des Dokuments über seinen
eigenen Inhalt:

| Angabe | Gemessen an |
|---|---|
| das Zahlwort im Kopf | den gezählten Gates |
| die Zahl in der Überschrift „Die N Gates" | den gezählten Gates |
| `Stand: JJJJ-MM-TT` | dem jüngsten Datum, das das Dokument **selbst** nennt |

**Das Datum wird nicht gegen den Kalender gemessen.** Ein Register darf alt
sein, solange nichts dazukam. Falsch wird es, wenn es selbst von etwas
Späterem erzählt — und dieses erzählte vom 7. September.

Beim ersten Lauf, beide Meldungen:

```
✗ der Kopf nennt 24 Entscheidungen, gezählt sind 31 Gates  [kopfzahl-abgeloest]
✗ der Kopf sagt „Stand: 2026-08-27", das Dokument erzählt
  selbst vom 2026-09-07  [stand-aelter-als-der-inhalt]
```

Der Kopf ist berichtigt; `pruefe-gates` ist grün. Gegenprobe
`der-kopf-des-registers-zaehlt-anders-als-die-tabelle`: *meldete rot an der
erwarteten Stelle*. 9 neue Testfälle.

### Ein Zahlwort lesen zu können war die Voraussetzung

`zahlwort` in `src/format.js` hört bei zwölf auf, mit der Begründung: *„Über
zwölf schreibt niemand mehr aus, und ein Wort, das keiner benutzt, würde in
keinem Text wiedergefunden."* Als allgemeine Regel stimmt das. In **diesem**
Bestand stimmt es nicht — genau diese Datei schreibt „Vierundzwanzig" und
„einunddreißig" aus.

> **Eine Begründung, der der eigene Bestand widerspricht, ist keine.**

Geschrieben wird weiter mit `zahlwort` bis zwölf. Dazugekommen ist nur, was
zum **Lesen** nötig ist: `wortzahl()` für die Zehner und die
Zusammensetzungen. Ein unbekanntes Wort gibt `null` und nicht 0 — *ein
Prüfer, der ein unlesbares Wort als null zählt, meldet einen Unterschied, den
es nicht gibt.* Ein eigener Testfall hält das fest.

---

## Und dieselbe Zahl steht falsch auf GitHub

`docs/baustoff-shop/pr-beschreibung.md` ist die Quelle der PR-Beschreibung und
sagt seit gestern **31 Gates**. Der veröffentlichte Text an Pull Request #14
sagt **30**.

**Das Werkzeug dafür gibt es seit dem 5. September.** `npm run pr-text` gibt
genau den Text aus, der veröffentlicht gehört, und `npm run
pruefe-schaufenster` misst die Quelle gegen den Bestand. Beide waren grün.
Zwischen dem Werkzeug und dem, was auf GitHub steht, liegt ein Handgriff — und
den prüft nichts.

> **Ein Werkzeug, das den richtigen Text ausgibt, hat ihn nicht
> veröffentlicht. Eine Datei, die eine Veröffentlichung beschreibt, ist nicht
> die Veröffentlichung.**

Es ist derselbe Handgriff, der am 5. September schon einmal danebenging — 25
Prüfer in der Quelle, 24 im Veröffentlichten. Damals entstand `pr-text` als
Antwort. Das Werkzeug beseitigt das Abschreiben, nicht das Vergessen.

Die Beschreibung ist mit `npm run pr-text` neu gesetzt. Ein **Prüfer** dafür
ist nicht gebaut: Er müsste über das Netz die GitHub-API lesen, und ein
Prüfer, der ohne Netz „nicht messbar" meldet, stünde in jedem Lauf ohne Netz
gelb da. Der Punkt bleibt als offener vermerkt, damit er nicht als erledigt
gilt.
