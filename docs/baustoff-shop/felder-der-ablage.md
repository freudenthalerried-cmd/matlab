# Was für sieben Jahre in die Ablage geht — Feld für Feld

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Baustein 2 aus der Liste in [`umsetzung-shop.md`](./umsetzung-shop.md).

Die Vorrunde ([`zusicherung-und-ablage.md`](./zusicherung-und-ablage.md)) endete
mit einem Satz, der über sie hinausreichte: **Was in die Ablage geht, geht für
sieben Jahre hinein.** Geprüft war zu dem Zeitpunkt ein einziges Feld — die
Rufnummer des Dritten, die *nicht* hineindarf. Welche Felder tatsächlich
drinstehen und warum, war nirgends aufgestellt.

Diese Runde stellt das Verzeichnis auf, nach dem Muster des
Fremdtext-Verzeichnisses: nicht als Absatz in einem Dokument, sondern als
ausführbarer Code, gegen den geprüft wird. Und wie beim Fremdtext ist beim
Aufstellen etwas aufgefallen.

## Das Verzeichnis

`FELDER_DER_ABLAGE` in `ablage.js` — jedes Feld des Journals mit Grundlage und
Zweck. `verlangt` trennt, was eine Vorschrift fordert, von dem, was nur dem
Betrieb dient:

| Feld | verlangt | Grundlage | Zweck |
|---|---|---|---|
| `lfd` | ja | § 131 Abs 1 Z 2 BAO | Zeitfolge; die laufende Nummer macht Lücken sichtbar |
| `art` | ja | § 131 BAO | welche Aufzeichnung vorliegt; ohne Art kein prüfbarer Nummernkreis |
| `nummer` | ja | § 11 Abs 1 Z 5 UStG | fortlaufende, einmalige Belegnummer |
| `zeitpunkt` | ja | § 11 UStG, § 131 BAO | Ausstellungsdatum; zeitgerechte Eintragung |
| `vorgang` | ja | § 131 Abs 1 Z 5 BAO | Rückführbarkeit zum Geschäftsfall (Vorgangsakte) |
| `betragNetto` | ja | § 11 Abs 1 Z 5 UStG | das Entgelt |
| `betragBrutto` | ja | § 11 UStG | Entgelt samt Steuer; die Differenz ist der Steuerbetrag |
| `text` | **nein** | betrieblich | Betreff oder Vermerk — nie der volle Belegtext |
| `bezugAuf` | ja | § 131 Abs 1 Z 6 BAO | Stornokette: die Gutschrift zeigt auf die Rechnung, statt sie zu ändern |

Acht von neun Feldern tragen eine Vorschrift. Das einzige betriebliche Feld ist
`text` — und genau dort sitzt die Schranke der Vorrunde:
`pruefeAblageAufDrittdaten` besteht darauf, dass dort der Betreff steht und
nicht der Bestelltext mit der Rufnummer des Poliers.

Die Prüfung dazu heißt `pruefeAblagefelder` und läuft in beide Richtungen: Ein
Feld ohne Verzeichniseintrag ist ein Befund, auch wenn es leer ist; ein Eintrag,
dem ein Verzeichnisfeld fehlt, ebenso — `haltefest` schreibt alle Felder, fehlt
eines, kam der Eintrag am Riegel vorbei ins Journal.

## Der Fund: ein Feld, das nicht wahr werden kann

Beim Aufstellen blieb ein zehntes Feld ohne Begründung übrig: `storniert`.
Seit der ersten Fassung der Ablage stand es in jedem Eintrag, immer `false`,
von keiner Zeile des Quelltexts je gelesen.

Es war nicht nur tot, es war **strukturell unwahr**: Einträge werden mit
`Object.freeze` eingefroren — der ursprüngliche Inhalt bleibt feststellbar,
§ 131 BAO. Ein eingefrorenes Feld kann den Wechsel auf `true` nie vollziehen.
Die Rechnung RE-2026-0001 hätte nach ihrem Storno für sieben Jahre
`storniert: false` im Journal getragen, direkt neben der Gutschrift, die sie
storniert.

Der Widerspruch ist kein Versehen im Kleinen, sondern das Muster der Ablage im
Großen: **In einem Journal, das nur ergänzt wird, ist jeder Zustand eine
Ableitung, keine Zelle.** Ob eine Nummer storniert ist, folgt aus der
Gutschriftkette — dafür gibt es jetzt `istStorniert(ablage, nummer)`, und der
Doppelstorno-Riegel in `storniere` benutzt dieselbe Funktion, statt die Kette
ein zweites Mal abzusuchen.

Das Feld ist entfernt. Das ist die einzige Stelle, an der Entfernen richtig
ist: Das Journal selbst darf nicht geändert werden — aber `storniert` stand in
keinem echten Journal, nur im Bauplan des Eintrags. Wäre die Ablage schon
persistent (Baustein 3), wäre aus dem toten Feld ein Altlast-Feld geworden,
das sieben Jahre mitzuschleppen ist. Die Reihenfolge der Bausteine hat hier
zufällig gestimmt; verlassen sollte man sich darauf nicht.

## Geprüft

| | |
|---|---|
| neue Testfälle | 5 |
| Testfälle gesamt | 350, alle grün, 0 mit Verdacht |

Gegenproben an der Prüfung, beide sofort rot, danach zurückgenommen:

| Mutation | |
|---|---|
| `storniert: false` wieder in `haltefest` eingebaut | 3 Testfälle fallen |
| `pruefeAblagefelder` meldet immer „dicht" | 2 Testfälle fallen |

Am gebauten Bündel nachgesehen: `demo.html` enthält das tote Feld nicht mehr,
das Verzeichnis ist enthalten, die Seite rendert unverändert.

Dazu ein Fund am eigenen Verfahren, festgehalten, weil er wiederkommen kann:
Die erste Gegenprobe wurde mit `git checkout` zurückgenommen — und nahm die
**uncommitteten Neubauten gleich mit**. Eine Mutation an einer Datei mit
offenen Änderungen wird seither über eine Sicherungskopie zurückgenommen, nie
über die Versionsverwaltung.

## Was das Verzeichnis künftig leistet

Jedes neue Feld muss ab jetzt zuerst seinen Verzeichniseintrag bekommen —
Grundlage oder ausdrücklich „betrieblich" —, sonst fällt
`pruefeAblagefelder`. Damit ist die Frage der Vorrunde („Wer schreibt hier
eigentlich mit, und mit welchem Recht?") keine Durchsicht mehr, die einmal
stattfand, sondern eine Sperre, die bei jeder Änderung erneut zuschlägt. Der
Satz dazu steht jetzt im Code statt nur im Protokoll: Die zweite Klasse —
betriebliche Felder — ist nicht verboten, aber sie trägt die Beweislast.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl. Die Referenzzahlen bleiben
3.900,20 € brutto und 34,2 % Mischmarge (seit 16. August als optimistisch
markiert); alle Preise sind Platzhalter.

Offen bleibt Baustein 3, und der Fund dieser Runde schärft ihn: Das Gedächtnis
der Ablage entscheidet nicht nur, **wo** gespeichert wird, sondern friert das
Felderverzeichnis in seiner heutigen Form ein — ab dem ersten persistierten
Eintrag ist jede Feldänderung eine Migrationsfrage.
