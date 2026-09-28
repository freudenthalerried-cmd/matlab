# 33 von 32

*5. September 2026, vormittags. Runde 127.*

## Der Befund

`npm run kennzahlen` schreibt die Seite, auf der steht, woran dieses Vorhaben
gemessen wird. Ihr Kopfkommentar begründet, warum es sie überhaupt gibt:

> **Festlegen, was gemessen wird, gegen welche Schwelle — und welche
> Entscheidung daran hängt.** Danach ist die Versuchung da, die Schwelle zu
> verschieben, weil man die Zahl schon kennt.

Eine der zehn Schwellen lautete:

```
Keywords mit gemessenem Suchvolumen
  ist — noch nicht gemessen, Schwelle mindestens 33 von 33
```

`npm run messliste` sagt: **32 Begriffe in 3 Anzeigengruppen.**

> **Ein Schwellendokument, dessen ganze Begründung lautet, Schwellen dürften
> sich nicht verschieben — und eine seiner Schwellen war eine abgeschriebene
> Zahl, die sich längst verschoben hatte.**

Die 33 stand als Zahl im Quelltext. Die Liste kommt aus
`ausgabe/kampagne/keywords.csv`, hat sich irgendwann geändert, und die Zeile
erfuhr nichts davon.

## Zwei Zeilen darüber stand die Warnung

In `bin/kennzahlen.mjs`, unmittelbar über dem Aufruf:

> *Die offenen Punkte kommen aus `bin/offenepunkte.mjs` selbst, nicht aus
> einer zweiten Zusammenstellung. Der erste Anlauf hat sie hier neu gebaut und
> meldete **2** statt 15 … **Eine Zahl, die plausibel aussieht und falsch ist,
> fällt in einem Dashboard niemandem auf: Es gibt ja nichts, woran man sie
> prüfen würde.***

Genau dieser Satz. Die offenen Punkte wurden deshalb hereingereicht — und die
Messbegriffe standen daneben und wurden abgeschrieben.

## Der Testfall, der die Regel im Namen trägt

`test/kennzahlen.test.js` führt seit dem 1. September:

```js
test('Die Schwellen sind gerechnet, nicht eingetragen', () => {
  const teurer = kennzahlen({ ziel: { ...ziel, zielgewinn: ziel.zielgewinn * 2 } });
  const umsatz = (l) => l.find((k) => k.id === 'monatsumsatz').schwelle;
  assert.ok(umsatz(teurer) > umsatz(normal) * 1.8);
});
```

> **Eine Probe, deren Name die Regel nennt und deren Körper einen Fall
> prüft.** Zehn Schwellen, eine geprüft.

Dieselbe Familie wie die Sperren von gestern Nacht, von denen niemand gezeigt
hatte, dass sie je aufmachen: Der Name verspricht das Allgemeine, geprüft ist
das Einzelne — und der Name beruhigt beim Lesen genau so weit, dass niemand
nachsieht.

## Was gebaut wurde

**1. Die Zahl kommt von außen.** `kennzahlen()` verlangt `begriffe` und hat
dafür **keinen Vorgabewert**: Ein Vorgabewert sähe aus wie eine Angabe und
wäre wieder eine Abschrift. Fehlt sie, wird nicht gerechnet, sondern
abgebrochen. `bin/kennzahlen.mjs` liest die Messliste — und weigert sich über
einem veralteten `ausgabe/kampagne`, weil eine Schwelle aus den Anzeigen von
gestern dieselbe Sorte Zahl ist wie die abgeschriebene.

**2. Ein Verzeichnis der eingetragenen Schwellen.** Zwei sind mit Absicht
Zahlen und keine Rechnung:

* `freigaben-offen` mit **0** — *„Die Null ist keine Rechnung, sondern die
  Entscheidung selbst: Solange ein Punkt offen ist, startet der Versuch
  nicht. Eine gerechnete Schwelle hieße, dass es eine erträgliche Zahl
  offener Freigaben gibt."*
* `werbeanteil` mit **23 %** — die Tragfähigkeitsgrenze aus
  `empfindlichkeit.js`; hier steht das Ergebnis als Entscheidung. Sie
  mitwandern zu lassen hieße, die Grenze an dem Tag zu verschieben, an dem die
  Marge nachgibt.

**3. Ein Prüfer, der die Regel prüft und nicht nur behauptet.**
`schwellenbefund` rechnet die Kennzahlen **zweimal** mit deutlich verschiedenen
Eingaben — anderer Zielgewinn, anderer Klickpreis, andere Quote, andere
Begriffszahl — und sieht an, welche Schwelle sich nicht rührt. Was sich nicht
rührt, ist eingetragen und muss im Verzeichnis stehen. In beide Richtungen:
Ein Eintrag für eine Schwelle, die sich sehr wohl rührt, fällt genauso auf.

Er läuft in `npm run kennzahlen` selbst — das Werkzeug, das die Seite
schreibt, prüft die Schwellen, die es daraufschreibt.

Gegenprobe `abgeschriebene-schwelle` schreibt die 33 wieder hinein.
**56 Gegenproben für 33 Prüfer.**

## Und ein zweiter Fund, beim Reparieren

Die Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, meldete nach jedem
Neubau von `npm run kampagne` unverdrossen weiter:

```
Abbruch: ausgabe/kampagne ist älter als 70 Quelldatei(en)
```

Die vier Dateien darin trugen die Zeit von 06:39, der Ordner die von 00:41.
`frischebefund` maß `statSync(ordner).mtimeMs` — und das ist bei einem Ordner
die Zeit, zu der zuletzt ein Eintrag **dazukam oder wegfiel**, nicht die Zeit,
zu der sein Inhalt entstand. `npm run kampagne` überschreibt seine Dateien und
legt keine neue an.

> **Die Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, hat das falsche
> Alter gemessen.**

In die eine Richtung ist das lästig: Sie verweigert die Arbeit über einem
frischen Stand. In die andere ist es gefährlich — `ausgabe/site` hat fünf
Unterordner mit 81 Seiten, und die Zeit des obersten sagt nichts über die
Seiten darin.

Gemessen wird jetzt die **älteste** Datei des Erzeugnisses, rekursiv. Ein
Erzeugnis ist so frisch wie sein ältester Teil; alles andere hieße, einen halb
gebauten Stand für gebaut zu erklären.

Nebenbei ist damit auch ein Eintrag im Leserregister falsch geworden und
berichtigt: `bin/kennzahlen.mjs` stand dort mit dem Grund *„Es schreibt eine
Übersicht in `ausgabe/`, es liest dort nichts."* Seit heute liest es. **Ein
Grund, der einmal stimmte, gilt nicht weiter, wenn das Werkzeug etwas Neues
tut** — derselbe Satz wie gestern bei Gate 27, nur eine Etage tiefer.

## Der Prüfer, der die Zahl kannte — und dort nicht hinsah

Beim Gesamtlauf danach wurde `pruefe-leitzahlen` rot, und zwar an meiner
eigenen frisch geschriebenen STATUS-Zeile:

```
✗ docs/baustoff-shop/STATUS.md:968 [keyword-anzahl]
    Begriffe der Messliste steht mit 33 ohne ihre Bedingung — gültig ist 32.
    Abgelöst: vor dem 01.09., als „Kaminkopf Regenhaube" noch in der Kampagne stand
```

Damit steht der Befund noch schärfer da: **Das Leitzahlregister kannte die 32
und wusste sogar, wann und warum die 33 abgelöst wurde.** Es hat sie nur nie
dort gesucht, wo sie stand.

`bin/leitzahlpruefung.mjs` durchsucht die Akte und die Shoptexte, und der
Grund steht im Kopf der Datei:

> *… nicht der Quelltext: Dort stehen dieselben Zahlen als Testfälle und
> Registereinträge, und ein Prüfer, der seine eigene Prüftabelle meldet, hat
> sich selbst gefunden.*

Der Grund ist richtig — und die Folge ist, dass **die eine Stelle, an der eine
abgelöste Leitzahl nicht nur falsch dasteht, sondern eine falsche Ausgabe
erzeugt, außerhalb der Reichweite des Prüfers liegt.** In den Dokumenten
irritiert eine alte Zahl; im Quelltext rechnet sie.

Das gehört gelöst, und zwar nach demselben Muster wie überall hier: den
Quelltext mitdurchsuchen und die Stellen, die eine abgelöste Zahl **nennen
dürfen** — das Register selbst, die Gegenproben, die Testfixtures —, mit
Pflichtgrund ausnehmen. Es ist keine Fünf-Minuten-Arbeit: Die Kopfkommentare
dieses Hauses zitieren alte Zahlen absichtlich und in Menge — etwa den
nötigen Monatsumsatz in seiner Kartenfassung vom 25. August, gerechnet vor
Gate 21 —, und jede davon müsste die Sichtweitenregel tragen oder ausgenommen
sein.

*Diese Zeile selbst ist der Beleg dafür:* Der erste Entwurf schrieb die alte
Zahl als Beispiel hin, und `pruefe-leitzahlen` hat sie im nächsten Lauf
gemeldet. Genau diese Sorte Fund käme aus dem Quelltext dann massenhaft. **Aufgeschrieben statt gemacht** — und damit an
der Stelle, an der ein späterer Lauf ihn findet.

## Die Lehre

> **Eine Zahl, die aus einer Liste stammt, gehört nicht neben die Liste
> geschrieben, sondern aus ihr gelesen.** Zwischen „32" und „33" liegt keine
> Nachlässigkeit, sondern ein Arbeitsschritt, den niemand mehr macht: das
> Nachzählen.
