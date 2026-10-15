# Die zweite Hand gab es nie

**7. September 2026.** Die Runde davor hat die vierte Redaktionsregel gegen den
Bestand gehalten. Dieselbe Seite trägt drei weitere, und die erste lautete:

> **Erstens: Verfassen und Prüfen sind nie derselbe Arbeitsgang.** Wer einen
> Text geschrieben hat, liest ihn nicht mehr unbefangen. *Jede Seite geht durch
> eine zweite Hand, bevor sie erscheint.*

Das ist keine Regel, sondern eine **Zusage über den Betrieb** — und sie ist
nicht eingelöst. Diese Texte entstehen in einem Lauf, und was sie prüft, sind
Programme: 31 Prüfer und 1.780 Testfälle. Ein zweiter Mensch liest hier nichts
gegen.

> **Eine Zusage über den eigenen Betrieb ist teurer als eine falsche Zahl: Sie
> lässt sich nicht nachrechnen, nur glauben.**

Und sie stand ausgerechnet auf der Seite, auf die `llms.txt` mit „Wie geprüft
wird" verweist — dort, wo ein misstrauischer Leser nachsieht.

---

## Was jetzt dasteht

> Jede Seite läuft deshalb gegen Prüfprogramme, die unabhängig vom Text
> entstehen und ihn nicht kennen: Sie halten Zahlen gegen ihre Quelle, Aussagen
> über den Betrieb gegen das, was er tatsächlich kann, und jedes Versprechen
> gegen die Stelle, die es einlösen müsste. Was sie finden, wird berichtigt,
> und die Berichtigung steht in der Änderungsgeschichte.

Das ist nicht weniger als vorher, sondern nachprüfbar: Der Satz beschreibt
genau die Läufe, die im Verzeichnis stehen. Die alte Fassung ist darunter
benannt — ohne sie wörtlich zu wiederholen, weil der Prüfer sonst seinen
eigenen Widerruf meldet.

---

## Die Regel dahinter: ein Register mit einem Eintrag

`BETRIEBSAUSSAGEN` in `src/inhaltspruefung.js` gibt es seit dem 5. September.
Es sucht Sätze, die etwas über **diesen** Betrieb behaupten, was er nicht hat —
und es hatte genau **einen** Eintrag: den Vorrat („ab Lager", „lagernd",
„vorrätig"). Der hat gestern gearbeitet und meinen eigenen Satz über den
Abholort gemeldet.

Ein Register mit einem Eintrag prüft eine Sorte Fehler. Die zweite Sorte stand
seit dem 25. August ungeprüft auf der Glaubwürdigkeitsseite. Aufgenommen sind
deshalb die Leistungen, die ein Baustoffhändler üblicherweise anbietet und die
dieser Betrieb **nicht** hat, jede mit der Stelle, die dagegensteht:

| Aussage | Was dagegensteht |
|---|---|
| zweite Hand, Vier-Augen-Prinzip, gegengelesen | die Prüfer in `src/pruefregister.js` — kein zweiter Mensch |
| eigener Fuhrpark, unsere Monteure, wir montieren | `AGB_GLIEDERUNG` ohne Werkleistung; der Lieferant fährt |
| Ausstellung, Schauraum, Showroom, Musterhaus | `PARAMETER.md`: Streckengeschäft, kein Lager |
| rund um die Uhr, 24 Stunden erreichbar, Hotline | eine Antwortzeit ist bis heute offener Punkt (`npm run startklar`) |

**Nicht aufgenommen: „beraten".** Auf der Dämmungsseite steht *„Wir liefern die
Stärke, die dort steht, und beraten nicht darüber hinweg"* — die Verneinung
wird links vom Treffer gesucht, sie stünde hier rechts, und ein Prüfer, der bei
jedem zweiten Satz anschlägt, wird abgeschaltet statt befolgt.

---

## Geprüft

Drei neue Fälle in `test/inhaltspruefung.test.js`: neun Sätze, die anschlagen
müssen (jeder mit der erwarteten Begründung), vier, die es nicht dürfen — die
Sätze, die dieser Shop wirklich schreibt, den neuen Regeltext eingeschlossen —,
und die Zusicherung, dass jeder Eintrag seine Gegenstelle nennt.

**Ein bestehender Testfall musste dafür erweitert werden**, und das ist selbst
ein Befund: Er verlangte, dass jede Begründung `PARAMETER.md` nennt. Das war
richtig, solange die Liste einen Eintrag hatte. Dass dieser Betrieb kein Gewerk
verkauft, steht in der AGB-Gliederung; dass keine Antwortzeit zugesagt ist, in
der Bereitschaftsliste. Verlangt wird weiter eine **benannte** Grundlage — nur
nicht immer dieselbe.

Gegenprobe `eine-zweite-hand-die-es-nicht-gibt` setzt die abgelöste Zusage
wieder in die Seite.
