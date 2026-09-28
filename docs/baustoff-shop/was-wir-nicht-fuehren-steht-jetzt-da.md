# Dreiundzwanzig begründete Ablehnungen, die niemand zu sehen bekam

Stand: 2026-08-29

## Der Befund

Die Messung von vorhin hat gezeigt: Fünf von acht erfolglosen Suchen waren
**richtig** erfolglos — Estrich, Drainage, Sockelputz und andere führt dieser
Shop nicht. Für jedes dieser Wörter steht seit heute eine begründete
Entscheidung im Register `data/suchwoerter.json`, inzwischen 23 an der Zahl.

Der Kunde bekam davon nichts zu sehen. Die Suchseite sagte bei jedem
Fehlschlag denselben allgemeinen Satz:

> Der Katalog umfasst 46 Artikel aus dem laufenden Einkauf. Was nicht darin
> steht, führen wir nicht — wir zeigen lieber nichts als etwas Erfundenes.

Der Satz ist richtig und bleibt stehen. Aber für 23 Wörter **wissen wir es
genauer**, und diese Auskunft lag ungenutzt im Repository. Wer „Drainage"
sucht, hat eine echte Frage; „führen wir nicht" beantwortet sie halb.

Jetzt:

> **Das führen wir nicht.** Drainagerohre führen wir nicht. Die Noppenbahn
> schützt die Kellerwand und leitet Wasser ab, sie ersetzt aber keine
> Drainageleitung.

## Zwei Fragen, zwei Texte

Der naheliegende Weg wäre gewesen, den vorhandenen `warum`-Text auszuliefern.
Er taugt dafür nicht:

| Feld | Beispiel |
| --- | --- |
| `warum` | „Ein Suchwort, das auf die Dämmplatte zeigt, würde genau den Fehler erzeugen, den die Systemliste verhindert: dämmen ohne abzudichten." |
| `antwort` | „Abdichtungsbahnen führen wir nicht. Gedämmt wird über der Abdichtung, nicht statt ihrer — welche Bahn Ihr Aufbau braucht, steht in der Planung." |

Das `warum` erklärt dem **nächsten Lauf** die redaktionelle Entscheidung und
spricht dabei über den Suchindex, über Register und Wissensseiten. Das
`antwort` beantwortet die Frage des **Kunden** und spricht über Ware. Beide
Texte sind nötig, und beide sind kurz.

Einen für den anderen zu halten wäre derselbe Fehler wie heute Nachmittag,
als `produktAuszeichnung()` zwei Fragen auf einmal beantwortete und drei
Artikelseiten ihr JSON-LD verloren. Ins Browserbündel geht deshalb **nur**
`antwort`; `warum` bleibt im Repository.

Ein Test hält das fest: Jede Ablehnung braucht eine Antwort von mehr als 25
Zeichen, die Antwort darf die Wörter „Suchwort", „Suchindex", „Treffer wäre",
„Register" und „Wissensseite" nicht enthalten, und sie darf kein Verweis auf
einen anderen Eintrag sein („Siehe silikatputz." ist als Begründung in
Ordnung und als Antwort unlesbar).

## Wo die Grenze liegt

Die Antworten nennen, was daneben steht — ohne es als Ersatz anzubieten:

> `flexkleber` — Fliesenkleber führen wir nicht. Unser Klebespachtel ist für
> Dämmplatten.

> `silikatputz` — Silikatputz führen wir nicht. Unser Oberputz ist ein
> Reibputz (Capatect PrimaPor K20); Silikat-, Silikon- und Mineralputze sind
> eigene Systeme und nicht gegeneinander austauschbar.

Das ist die Linie, die das Register von Anfang an zieht: **ersatzweise auf
etwas Ähnliches zu zeigen verkauft das Falsche.** Sagen, was man hat, ohne zu
behaupten, es sei dasselbe.

## Geprüft und gegengeprobt

837 Testfälle, 47 Browserszenarien. Zwei neue Szenarien, und das zweite ist
das wichtigere:

| Szenario | prüft |
| --- | --- |
| `suche?q=drainage` | die eigene Antwort samt Noppenbahn-Hinweis |
| `suche?q=zementmischer` | **nur** der allgemeine Satz, keine erfundene Antwort |

Gegengeprobt durch Leeren der ausgelieferten Liste: Das erste Szenario fällt,
das zweite bleibt grün — genau richtig, denn es prüft die Abwesenheit.

## Was das nicht ist

Keine Empfehlung und kein Verkaufsversuch. Der Shop sagt, was er nicht hat,
und nennt das Bauteil daneben mit dem Unterschied dazu. Ob es passt,
entscheidet die Planung — nicht die Suche.
