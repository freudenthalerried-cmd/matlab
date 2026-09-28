# Prüfer, die den Text sehr wohl kennen

**10. September 2026, zehnte Runde.** Dritter Besuch bei den
Redaktionsprinzipien — der Seite, auf der dieser Shop seine eigenen Regeln
aufstellt. Regel 2 und 3 sind seit heute gemessen. Bleibt die erste, und sie
ist die unangenehmste:

> *„Jede Seite läuft deshalb gegen Prüfprogramme, die **unabhängig vom Text
> entstehen und ihn nicht kennen**."*

Das stimmt nicht, und der Beweis steht in den Runden dieses Tages. **Vier** der
heute laufenden Regeln sind aus Sätzen dieses Bestands entstanden:

| Regel | entstanden aus |
|---|---|
| `GRENZAUSSAGEN` | „Unter etwa 400 Euro netto Warenwert …" |
| `MEHRLIEFERUNG` | „Teillieferungen je Lieferant sind der Regelfall." |
| `UEBERNAHMEBEHAUPTUNGEN` | „Wir verlinken sie und geben die Kennwerte wieder." |
| `normstellenbefund` | den vier Normbezügen der Wissensseiten |

Und weil sie so entstehen, sind sie eng: `MEHRLIEFERUNG` fing beim ersten Wurf
**0 von 5** Umschreibungen derselben Behauptung, `GRENZAUSSAGEN` 1 von 5.
Genau deshalb gibt es seit heute Mittag `src/umschreibung.js`.

> **Eine Zusage über den eigenen Betrieb ist teurer als eine falsche Zahl: Sie
> lässt sich nicht nachrechnen, nur glauben** — und diese stand auf der Seite,
> die erklärt, wie hier geprüft wird.

Es ist derselbe Eintrag, unter dem am 7. September *„Jede Seite geht durch
eine zweite Hand"* gefallen ist. Dieselbe Seite, dieselbe Sorte Satz, drei
Tage später.

## Was jetzt dasteht

Der geschönte Teil ist weg, und an seine Stelle tritt der unbequeme:

> Diese Programme entstehen aus **gefundenen Fehlern** — jemand stößt auf
> einen falschen Satz und schreibt die Regel gegen ihn. Das macht sie eng: Sie
> erkennen zuerst die Formulierung, gegen die sie geschrieben wurden. Deshalb
> wird ihre **Reichweite** selbst gemessen: Zu jeder Regel steht eine Liste
> von Umschreibungen derselben Behauptung, und wo eine Lücke bleibt, steht sie
> mit ihrem Grund da statt zu fehlen.

Das ist die stärkere Aussage. Sie erklärt, warum ein Prüfprogramm überhaupt
etwas wert ist, und sie hält.

## Der Apparat hat sich selbst nachgezogen

Beim Eintragen der neuen Regel ins Reichweitenregister meldete
`npm run pruefe-umschreibung` **fünf** Muster, die die beiden Runden davor
gebaut und nicht eingeordnet hatten: `KENNWERT`,
`UEBERNAHMEBEHAUPTUNGEN`, `NORMBEZUG`, `AUSGABE`, `REIHE`.

Das ist die Aufzählung, die sich selbst fortschreibt, aus der Runde vom
Nachmittag — sie hat genau den Fall gefangen, für den sie gebaut wurde:
**neue Regeln, die niemand einordnet.** Vier davon sind Formmuster mit Grund,
eine ist eine Behauptungsregel und hat jetzt ihre vier Umschreibungen.

Danach: **16 Regeln, 71 Umschreibungen, 7 offene Lücken mit Grund, 0
Behauptungsregeln ohne Umschreibungen.**

## Stand

- `inhalte/wissen/redaktionsprinzipien.md` — erste Regel berichtigt, mit der
  Angabe, was bis heute dastand.
- `src/inhaltspruefung.js` — `BETRIEBSAUSSAGEN` um die
  Unabhängigkeitsbehauptung erweitert (6 Einträge). Getroffen wird die
  Unabhängigkeit **vom Text**; die richtige Unabhängigkeit vom Hersteller oder
  Lieferanten bleibt still.
- `src/umschreibung.js` — zwei neue Regeln (`unabhaengige-pruefer`,
  `kennwertuebernahme`), fünf Muster eingeordnet.
- 1 Gegenprobe (`pruefer-die-den-text-nicht-kennen`, angeschlagen).
- 2223 Testfälle, 155 Gegenproben, 48 Prüfer.

**Damit sind alle vier Redaktionsregeln gemessen** — die erste über
`BETRIEBSAUSSAGEN`, die zweite über die Kennwertregel, die dritte über die
Normausgabe, die vierte über die Eignungsgrenzen. Drei Runden dafür, und in
jeder war die Regel richtig und der Satz darüber zu großzügig.
