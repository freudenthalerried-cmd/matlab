# Die Rolle, die ein Rohr war

**Stand: 30. August 2026** · Der letzte offene Punkt aus der Vorbereitung des
Liefertags. Betroffen: `shop/src/bilder.js`, `shop/test/bilder.test.js`.

## Die Frage

Jede Artikelseite trägt eine Zeichnung. Sie ist kein Herstellerfoto, sondern
ein Schema aus den Angaben des Datensatzes — die Startseite sagt es so:
**„Was gezeigt wird, steht auch im Datensatz."**

Die Form wird aus der Bezeichnung erschlossen. Auf den 46 Artikeln des
Bestands funktioniert das: 43 bekommen eine eigene Form, drei bleiben beim
allgemeinen Formteil, und alle drei sind Kaminpakete ohne Formwort — der
ehrliche Ausgang.

Der Liefertag bringt aber Namen, die niemand gesehen hat. Also die Frage:
**Wie verhält sich die Formerkennung bei Namen, die nicht aus diesem Katalog
stammen?**

## Die Messung

Vierzig Namen, wie sie bei einem Baustoffhändler vorkommen — Ziegel, Mörtel,
Dämmung, Kanal, WDVS, Kamin, Zubehör —, jeder mit der Form, die ein Bauleiter
erwarten würde. **Die Erwartung stand vor der Messung.**

| | |
|---|---|
| richtig | 35 |
| allgemeines Formteil | 3 |
| **falsch** | **2** |

Ein allgemeines Formteil ist kein Fehler: Ein Paket ohne Formwort *soll* als
Teil gezeichnet werden. Falsch ist eine Zeichnung, die etwas anderes zeigt,
als der Artikel ist — und davon gab es zwei.

## Die zwei falschen

**„Capatect Eckwinkel mit Gewebe 2,5 m" → Rolle.** Das Erzeugnis ist ein
Winkel von zweieinhalb Metern; das Gewebe ist das Zubehör daran. Gezeichnet
worden wäre eine Rolle.

Der Grund ist bekannt und stand schon im Quelltext — für den umgekehrten
Fall. Dort ist beschrieben, warum „Mantelstein**kleber**" kein Stein ist: Im
deutschen Kompositum steht der Kopf **hinten**, deshalb prüft die Formsuche
auf Wortende. Bei der Beifügung steht er **vorn**:

> **„X mit Y" ist ein X.**

Was hinter „mit" steht, wird für die Formsuche jetzt abgeschnitten. Auf den
46 Bestandsartikeln ändert das nichts — „Regenhaube mit Sicherungsseil"
bleibt eine Haube, „Kantenschutz mit Gewebe" bleibt eine Leiste. Es hält den
Fehler von morgen ab, nicht einen von heute.

**„Drainagerohr DN 100 gelocht 50 m", Einheit `RLL` → Rohr.** Fünfzig Meter
Rohr kommen als Ring, nicht als Stange.

Hier stand ein Wort gegen eine Tatsache: Die Einheit steht im Beleg des
Lieferanten, der Name ist Prosa. Wo die Einheit die Form festlegt,
entscheidet sie jetzt zuerst — aber **nur `RLL` und `DOS`**, weil nur sie
keine zweite Lesart zulassen. `SCK`, `KG` und `EIM` stehen weiter unten in
der Kette: Ein Sack kann auch ein Ziegel sein, der auf Paletten in Säcken
kommt, und das prüft ein Testfall.

Dazu eine kleine Ergänzung: Eine **Sockelschiene** ist eine Leiste, wie
Anputzleiste und Kantenschutzprofil.

## Nach der Behebung

| | |
|---|---|
| richtig | 38 |
| allgemeines Formteil | 2 |
| **falsch** | **0** |

Die zwei verbliebenen sind ehrlich: „Wienerberger Porotherm 25 Plan" trägt
kein Formwort — dass das ein Ziegel ist, weiß ein Mensch und kein Muster. Ein
Wort wie „Porotherm" in die Regeln aufzunehmen hieße, Markennamen zu pflegen;
das ist die Arbeit, die das Kundenwörter-Register bewusst von Hand macht, und
sie gehört nicht in eine Zeichenroutine.

**Die Verteilung auf den 46 Bestandsartikeln ist unverändert** — Form für
Form dieselbe Zahl. Das war die Bedingung: Eine Regel, die den Fehler von
morgen abhält und dabei heute etwas verschiebt, wäre keine Verbesserung,
sondern ein Tausch.

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| Kernbildung entfernt (alles nach „mit" zählt wieder) | die Probe fällt |
| Einheitenvorrang entfernt | zwei Proben fallen, darunter die über vierzig Namen |

## Was am Liefertag zu tun bleibt

Die Zeichnungen sind damit vorbereitet, nicht erledigt. Zwei Dinge sind nach
dem Einlesen anzusehen:

1. **Die Plattenstärken.** Sie werden maßstäblich gezeichnet, und die
   Erkennung hat eine Plausibilitätsgrenze von 300 mm — der Grund steht in
   `eine-platte-mit-sechzig-zentimetern.md`. Bei neuen Dämmstoffnamen ist zu
   prüfen, ob die Zahl gefunden wurde; wo nicht, steht „Platte" statt eines
   Maßes, und das ist sichtbar.
2. **Die Formteile.** Wie viele Artikel als allgemeines Teil gezeichnet
   werden, sagt `bauform` in einem Durchlauf. Ein hoher Anteil ist kein
   Fehler, aber ein Hinweis: Vielleicht fehlt ein Formwort, das im neuen
   Sortiment häufig vorkommt.
