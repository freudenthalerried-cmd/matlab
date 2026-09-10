# Wie weit ein Prüfer reicht

**10. September 2026, dritte Runde des Tages.** Die Runde davor hat gezeigt,
dass `BEHAUPTUNG` in `src/lieferungen.js` genau die Formulierung kennt, gegen
die sie geschrieben wurde. Die naheliegende Antwort ist, dieses eine Muster zu
verbreitern — das ist geschehen. Die unbequeme Frage kommt danach:

> **Wie viele der anderen Prüfer erkennen auch nur ihren eigenen
> Beispielsatz?**

Dieser Bestand hat **fünf** Register aus Textmustern, die auf jeder
Kundenfläche laufen: `BETRIEBSAUSSAGEN` und `GRENZWOERTER`
(`inhaltspruefung.js`), `INTERNA` (`interna.js`), `PREISAUSSAGEN` und
`VORRATSWORTE` (`aussagen.js`).

## Die Messung

Neunzehn Sätze, die dieselben Behauptungen aufstellen wie die Register sie
verbieten — nur in anderen Worten. Keine Kunstprodukte: Formulierungen, die
auf einer Baustoffseite unauffällig aussehen.

| Regel | Was sie fängt | Was durchging |
|---|---|---|
| Vorrat | „ab Lager", „vorrätig", „sofort lieferbar" | „Wir haben die gängigen Größen **immer da**." · „Direkt **aus unserem Bestand** lieferbar." · „Die Ware **liegt bei uns bereit**." · „Kurzfristig verfügbar aus laufender **Bevorratung**." |
| Räume | „Schauraum", „Showroom", „Musterhaus" | „Besuchen Sie uns in unserem **Verkaufsraum**." · „Kommen Sie bei uns **im Geschäft** vorbei." |
| Zweite Hand | „Vier-Augen-Prinzip", „lektoriert" | „Jeder Text wird **von einem Redakteur** geprüft." · „**Vier Augen** sehen jede Seite an." |
| Eigene Leute | „eigener Fuhrpark", „unsere Monteure" | „**Unser Team** liefert und stellt auf." · „Wir stellen die Palette **selbst** zu." |
| Erreichbarkeit | „rund um die Uhr", „Hotline" | „Wir sind **immer für Sie da**." · „Sie erreichen uns **an sieben Tagen** die Woche." |
| Erfolgszusage | „garantiert", „dauerhaft trocken" | „…, **versprochen**." · „Wir **sichern Ihnen** die Lieferung **zu**." · „Das hält **ein Leben lang**." |
| Rechtsauskunft | „rechtssicher" | „Damit sind Sie **rechtlich auf der sicheren Seite**." · „Wir **prüfen Ihren Vertrag** mit." |
| Eigene Marge | „Rohmarge", „25 % Zuschlag" (die am 26.08. abgelöste Lesart; seither gilt 25 % Marge, siehe `marge-25-prozent.md`) | „…mit 25 **Prozent** Aufschlag." · „Der **Einkaufspreis** liegt bei 12,40 €." |

**Neunzehn von neunzehn gingen durch.** Kein Register fing auch nur eine
Umschreibung.

Die härteste Zeile ist die letzte. Das Wort **Einkaufspreis** — die Zahl, um
die sich in diesem Vorhaben alles dreht, die in `.gitignore` steht, für die es
einen eigenen Prüfer gibt (`npm run pruefe-geheimnis`) und eine
Empfehlung, das Repository privat zu stellen — **stand im Interna-Register
überhaupt nicht.** Ein Satz wie „Der Einkaufspreis liegt bei 12,40 €" wäre
durch den Bau gegangen und auf die Seite gekommen.

## Warum das nicht heißt, die Register seien schlecht

Ihre Enge ist **Absicht** und steht in ihren eigenen Kommentaren:

> *„Ein Prüfer, der bei jedem zweiten Satz anschlägt, wird abgeschaltet statt
> befolgt."*

Das stimmt und bleibt. „haftet" und „Haftung" sind mit Begründung draußen —
im Baustofftext sind das physikalische Wörter. Was fehlte, war nicht die
Breite, sondern die **Zahl**: Wie eng ist eng? Die grüne Meldung liest sich
wie *„keine solche Behauptung auf einer Kundenseite"* und heißt *„keine dieser
Formulierungen auf einer Kundenseite"*. Zwischen beidem lagen neunzehn Sätze,
und niemand wusste es.

> **Eine Lücke, die aufgeschrieben ist, ist eine Entscheidung. Eine Lücke, die
> niemand kennt, ist ein Versehen.**

## Was jetzt gilt

**`src/umschreibung.js`** führt zu jeder Regel die Umschreibungen mit dem
Vermerk, ob sie heute gefangen werden. `npm run pruefe-umschreibung` hält das
gegen die Wirklichkeit, **in beide Richtungen**:

- Ein Satz mit `gefangen: true`, der durchrutscht → die Regel ist enger
  geworden. Befund.
- Ein Satz mit `gefangen: false`, der plötzlich gefangen wird → die Lücke ist
  zu, der Eintrag gehört nachgezogen. Auch Befund, nur ein guter.

**Sechzehn der neunzehn Lücken sind geschlossen.** Jede Erweiterung wurde
vorher über 106 Kundenflächen gemessen: **null Fehltreffer**, in jedem
einzelnen Fall. Die drei übrigen bleiben offen — mit Grund daneben:

| Offene Lücke | Warum sie offen bleibt |
|---|---|
| „Schützt Ihre Familie vor **Schimmel**." | „Schimmel" ist bauphysikalisch: *„Wo Tauwasser anfällt, entsteht Schimmel"* ist die richtige Auskunft. Die Grenze liegt bei „Ihre Familie", und darauf lässt sich kein Muster bauen, das nicht die halbe Wissensseite trifft. |
| „Wir **liefern** Ihnen die Ware auf die Baustelle." | Der Shop liefert — er fährt nur nicht selbst. Ein Muster auf „wir liefern" schlüge auf jeder Seite an. |
| „Ein **Einkaufspreis**, den niemand anbietet, nützt niemandem." | Der eigene Satz der Wissensseite „Was Baumeisterpreis heißt". Gemeldet wird deshalb der Einkaufspreis **mit einer Zahl daneben** und nicht das Wort. |

## Warum die Gegenproben das nicht finden konnten

Der Bestand hat 148 Gegenproben, und jede beweist, dass ihr Prüfer rot werden
kann. Diese Klasse von Blindheit können sie strukturell nicht finden:

> **Eine Gegenprobe beweist, dass ein Prüfer den Fall erkennt, den ihr Autor
> gebaut hat — nicht, dass er die Klasse erkennt.** Und der Autor der
> Gegenprobe ist derselbe, der das Muster geschrieben hat, mit demselben Satz
> im Kopf.

Deshalb ist `pruefe-umschreibung` kein weiterer Prüfer über den Bestand,
sondern einer über die **Prüfer**: Er fragt nicht, ob eine Regel anschlägt,
sondern wie weit sie reicht. Seine eigene Gegenprobe setzt das Vorratsmuster
auf den Stand vom 31. August zurück — auf die Wörter, gegen die es geschrieben
wurde — und er meldet `regel-verengt`.

## Stand

- **`src/umschreibung.js`** — 9 Regeln, 32 Umschreibungen, davon 3 als offene
  Lücke mit Grund. `umschreibungsbefund` prüft in beide Richtungen,
  `registerbefund` verlangt zu jeder Lücke einen Grund (mindestens 30 Zeichen)
  und zu jedem gefangenen Satz seine Herkunft.
- **`bin/umschreibungspruefung.mjs`**, `npm run pruefe-umschreibung` — der
  48. Prüfer. Weigert sich mit Ausgang 2, wenn das Register unbegründet ist.
- **Neun Muster erweitert** in `inhaltspruefung.js` und `interna.js`, jedes
  mit dem Grund im Quelltext.
- 9 neue Testfälle, 1 Gegenprobe (`vorratsregel-wieder-verengt`, angeschlagen).
- 2192 Testfälle, 148 Gegenproben, 48 Prüfer.

**Was nicht gemessen ist:** `PREISAUSSAGEN` und `VORRATSWORTE` aus
`aussagen.js` laufen in der Zusammenstellung mit, haben aber noch keine
eigenen Umschreibungen im Register. Das ist die nächste offene Zeile.
