# Die Behauptung ohne Zahl

Stand: 2026-08-26. Der Auftrag lautete, ein Team einzurichten, „die die
Richtigkeit der Aussagen und Content prüft". Die maschinelle Schicht
davon gibt es seit dem 25. August (`npm run pruefe-inhalte`), und sie
meldete am Bestand von dreiundzwanzig Seiten: **null Verdachtsfälle.**

Dieses Dokument hält fest, warum das kein gutes Zeichen war.

## Was der Prüfer nicht sehen konnte

Alle sieben Regeln der ersten Fassung hängen an etwas Zählbarem: einer
Zahl mit Einheit, einer Normnummer, einem Grenzwort aus einer Liste,
einem Eurobetrag, einem Blockzitat. Ein Satz, der keines davon enthält,
kam durch — auch dieser:

> Ein WDVS wird als System geprüft und **zugelassen**. Wer den
> Klebemörtel des einen Herstellers mit dem Gewebe eines anderen
> kombiniert, verlässt diese Zulassung.

Das ist keine Nebenbemerkung. Es ist die **tragende Verkaufsaussage der
Systemlisten** — der Grund, aus dem dieser Shop Pakete anbietet statt
Einzelartikel, und der Grund, aus dem ein Kunde beim teureren Anbieter
kauft statt beim Baumarkt. Sie stand siebenmal auf sechs Seiten, ohne
eine einzige Fundstelle.

**Eine Behauptung ohne Zahl ist nicht weniger eine Behauptung.** Sie ist
nur schlechter zu finden.

## Die achte Regel

`GELTUNGSAUSSAGE` meldet Sätze, die behaupten, was zugelassen,
vorgeschrieben oder verboten ist — solange im selben Absatz keine
Fundstelle steht: *Zulassung, zugelassen, bauaufsichtlich,
vorgeschrieben, genormt, Pflicht, verpflichtet, unzulässig.*

Der erste Entwurf war länger. Was daraus wieder verschwand, ist der
lehrreichere Teil:

| gestrichen | warum |
|---|---|
| `haftet` | Im Baustofftext physikalisch: *die Abdichtung haftet an der Wand.* Drei Treffer am Bestand, drei Fehltreffer. |
| `Haftung` | Ebenso: *der Putzgrund stellt die Haftung her.* |
| `zulässig` | Steht fast immer dort, wo die Seite eine Frage korrekt **weiterreicht**: *„Was zulässig ist, regeln die Bauordnung des Landes und die Systemunterlagen."* Genau das soll die Regel nicht bestrafen. |

Nach Gate-17-Prinzip wurde die Wortliste an einer Stichprobe geeicht,
**bevor** entschieden wurde, was mit den Treffern geschieht. Aus fünfzehn
Meldungen wurden sieben — und alle sieben waren echte Behauptungen.

Ein Prüfer, der bei jeder Verarbeitungsbeschreibung anschlägt, wird
abgeschaltet statt befolgt. Diese Lehre steht seit dem Testfallprüfer im
Projekt; hier hat sie zum ersten Mal Wörter aus einer Regel gestrichen,
die fachlich richtig gewesen wären.

## Zwei Fehler, die dabei aufgefallen sind

### Der Prüfer zeigte auf die falsche Zeile — von Anfang an

Die erste Meldung lautete `kaminzug-aufbau.md, Zeile 53`. Dort steht
nichts dergleichen; der Satz steht auf **Zeile 62**.

`inAbsaetze` zählte beim Zerlegen mit — je Absatz „Zeilen plus eins" —
und unterstellte damit genau eine Leerzeile zwischen zwei Absätzen. Der
Kopfblock wird aber durch *mehrere* Leerzeilen ersetzt, und
`split(/\n\s*\n/)` fasst einen ganzen Block Leerzeilen zu einem Trenner
zusammen. Ab dem ersten Absatz nach dem Kopf lag jede Meldung um genau
die Kopflänge daneben.

**Der Fehler war seit dem ersten Tag drin und so lange unsichtbar, wie
der Bestand sauber war.** Ein Prüfer, der nichts findet, verrät auch
nicht, dass sein Fingerzeig falsch ist.

Es gab einen Testfall dafür. Er verglich den Lauf über eine Datei mit
Kopfblock gegen einen von Hand nachgebauten Text ohne — beide Seiten
liefen durch dieselbe falsche Zählung und waren sich deshalb einig.
**Ein Test, der die Rechnung gegen sich selbst prüft, prüft nichts.**
Er heißt jetzt gegen die abgezählte Zeile, und ein zweiter schlägt die
gemeldete Zeile in der echten Datei nach.

Die Zeilennummer wird nicht mehr mitgezählt, sondern aus der Position im
Text berechnet.

### Der Kopfblock war ausgenommen — und wird veröffentlicht

Nach dem Umschreiben der Fließtexte meldete der Prüfer null. Die alte
Aussage stand da noch in drei Kopfblöcken:

```
kurz: … Ausgewählt wird nach dem System, nicht nach dem Einzelpreis:
      Die Komponenten sind als System geprüft und zugelassen.
```

Der Kopfblock war ausgenommen, weil ein Titel wie „Mengen für 100 m²
Fassade" sonst auf jeder Seite die Zahlenregel auslöste. Nur sind `kurz`
und `frage` keine Metadaten: Sie werden als Beschreibung der Seite
ausgegeben — in die Kachel, in die Meta-Beschreibung, ins JSON-LD und in
die `llms.txt`.

> **Die ungeprüfte Aussage stand ausgerechnet dort, wo maschinelle Leser
> sie abholen.** Der Prüfer meldete sie im Fließtext und schwieg zur
> wörtlich gleichen Zeile drei Zeilen darüber.

Geprüft werden jetzt genau diese zwei Felder, mit Feldnamen und Zeile in
der Meldung. `titel`, `slug`, `stand` und die Verweise bleiben
ausgenommen — der ursprüngliche Grund gilt für sie weiter.

## Was mit den sieben Behauptungen geschehen ist

Nicht weggeräumt und nicht mit einer begründeten Ausnahme
stillgestellt. Beides wäre der bequeme Weg gewesen, und die Regel
`<!-- pruefung: begruendet -->` ist genau dafür da, missbraucht zu
werden.

Stattdessen sagt jede Seite jetzt, **wo es steht, statt zu behaupten,
dass es gilt**:

| vorher | nachher |
|---|---|
| „die Zulassung gilt für die Kombination" | „Geprüft wird die Kombination, nicht das Einzelteil — welche Kombination das ist, steht in den Systemunterlagen des jeweiligen Kamins." |
| „Die Komponenten sind als System geprüft und zugelassen." | „Geprüft wird die Kombination, nicht der einzelne Sack — welche Kombination das ist, steht in den Systemunterlagen des Herstellers." |
| „Mischen verlässt die Zulassung." | „Mischen verlässt die geprüfte Kombination." |
| „Ein Zuschlag ist hier keine Sicherheitsreserve, sondern Pflicht." | „…keine Sicherheitsreserve — wie breit die Bahnen überlappen müssen, steht in der Verarbeitungsrichtlinie des gewählten Systems." |

Der praktische Rat bleibt vollständig erhalten. Was verschwindet, ist
der Anspruch, eine Rechtslage zu kennen, die hier niemand nachgeschlagen
hat.

**Warum nicht einfach die Fundstelle nachtragen?** Weil sie sich aus
dieser Umgebung nicht beschaffen lässt. `baumit.at`, `schiedel.at`,
`synthesa.at`, `isover.at` und `ris.bka.gv.at` sind sämtlich vom
Netzausgang gesperrt — geprüft an diesem Tag, jeweils mit
`EGRESS_BLOCKED`. Eine Normnummer aus dem Gedächtnis in eine
Kundenseite zu schreiben, verletzt die zweite Prüfregel des Projekts
(*keine Norm-Aussage ohne Nummer und Ausgabejahr*) in ihrem Sinn, auch
wenn sie den Buchstaben erfüllte.

## Die Beschaffungsliste, die daraus entstanden ist

Die Weisung vom 25. August lautete auch: *„verlinke Datenblätter"*.
Bisher steht in den Inhalten kein einziger Datenblattlink — nur vier
Herstellerstartseiten. Die umgeschriebenen Sätze sagen jetzt genau,
welches Dokument fehlt:

| Dokument | wofür | wo es gebraucht wird |
|---|---|---|
| Systemunterlagen Schiedel, einzügig | welche Teile die geprüfte Kombination bilden | `kaminzug-aufbau`, `gruppen/kamin` |
| Systemunterlagen des WDVS (Capatect/Synthesa, Baumit) | dasselbe für die Fassade | `wdvs-systemaufbau`, `gruppen/wdvs` |
| Verarbeitungsrichtlinie Glasgewebe | Überlappungsbreite | `mengen-fuer-100-qm-wdvs` |
| Technische Merkblätter je Artikel | Verbrauchswerte, die die Seiten bewusst nicht nennen | sieben Seiten verweisen darauf |

Das ist **keine Anfrage an Dritte**: Diese Unterlagen liegen öffentlich
auf den Herstellerseiten. Es braucht nur einen Lauf, der sie erreicht,
oder den Auftraggeber, der sie aus seinen eigenen Systemunterlagen
beisteuert. Erst danach werden aus den Verweisen Links.

## Gegenproben

Vier Mutationen, jede einzeln eingespielt und wieder zurückgenommen:

| Mutation | fallende Testfälle |
|---|---|
| Geltungsregel entschärft (Muster trifft nie) | 4 |
| Fundstelle ignoriert (Regel meldet immer) | 3 |
| alte Zeilenzählung wiederhergestellt | 3 |
| Kopffelder wieder ausgenommen | 3 |
| Kopfzeile fest auf 1 gesetzt | 1 |

578 Testfälle grün, davon 12 neue. Der Bestand ist wieder ohne Befund —
diesmal geprüft.

## Was das Werkzeug weiterhin nicht kann

Der Satz am Ende jeder Ausgabe gilt unverändert: *„Die Faktenprüfung
gegen die Quelle ersetzt dieses Werkzeug nicht."* Er hat sich heute
selbst bestätigt. Der Prüfer hat gefunden, dass eine Behauptung ohne
Beleg dasteht. Ob sie **wahr** ist, weiß er nicht — und dieser Lauf
konnte es auch nicht klären, weil die Quellen nicht erreichbar waren.

Was sich geändert hat, ist die Richtung des Risikos: Vorher stand eine
unbelegte Aussage als Tatsache auf sechs Seiten und in drei
maschinenlesbaren Ausgaben. Jetzt steht dort ein Verweis auf das
Dokument, das die Antwort trägt.
