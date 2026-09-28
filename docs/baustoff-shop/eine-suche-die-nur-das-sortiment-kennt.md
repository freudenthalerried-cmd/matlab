# Eine Suche, die nur das Sortiment kennt

**10. September 2026, zwölfte Runde.** Nach elf Runden an Texten und Prüfern
diesmal die Frage, was ein Besucher **tut**: Er landet über eine bezahlte
Anzeige auf einer Gruppenseite — 4,19 € bis 8,22 € je Klick — und tippt ins
Suchfeld.

## Die Messung

Zwanzig Fragen, die ein Besteller vor dem Absenden stellt, gegen den
Suchindex, der mit jeder Seite ausgeliefert wird:

| Frage | Treffer |
|---|---|
| kranentladung · frachtpauschale · lieferzeit · mindestbestellwert · liefergebiet | **0** |
| widerruf · rügefrist · reklamation | **0** |
| impressum · agb · datenschutz | **0** |
| zahlung · zahlungsarten · vorkasse · rechnung · umsatzsteuer | **0** |
| versandkosten · abholung | **0** |
| fracht | 1 (die Wissensseite) |
| lieferung | 2 — **die Gruppenseite „Zubehör und Kleinteile"** |

**Achtzehn von zwanzig ohne Antwort.** Der Shop hat für fast jede dieser
Fragen eine Seite: die Lieferseite mit den Frachtsätzen, die AGB mit Punkt 9
zur Zahlung, die Abnahmeseite mit § 377 UGB, Impressum und Datenschutz. Der
Index kannte **46 Artikel und 24 Inhaltsseiten** — und keine davon.

> **Eine Suche, die nur das Sortiment kennt, antwortet auf jede zweite Frage
> mit „nichts gefunden" — obwohl die Antwort im Haus liegt.**

Und die zweite Zeile ist schlimmer als Schweigen: Wer „lieferung" tippt,
bekommt die Gruppenseite *Zubehör und Kleinteile*. Die Suche antwortet
falsch, nicht gar nicht.

## Was ich zuerst gemessen habe — und was daran falsch war

Der erste Anlauf baute den Index von Hand aus dem Katalog und meldete **neun
von zwanzig Warenfragen** ohne Treffer, darunter „armierungsgewebe" und
„perimeterdämmung". Beides falsch: Ich hatte den Schlüssel der Synonymdatei
verwechselt (`suchwoerter` statt `woerter`) und die Inhaltsseiten weggelassen.
Mit dem Index, wie er ausgeliefert wird, findet der Shop beides.

> **Wer den Index anders baut als der Shop, misst seinen eigenen Nachbau.**

Dritte falsche Messung des Tages, dritte, die vor dem Schreiben aufgefallen
ist. Gemessen wird seither die Datei, die der Besucher bekommt —
`ausgabe/site/shop.js`, aus der auch der Testfall liest.

## Was jetzt gilt

`src/dienstseiten.js` führt die sechs Seiten, die eine Frage vor der
Bestellung beantworten, jede mit **Frage und Kurzantwort**:

- Lieferung und Frachtkosten · Impressum · Geschäftsbedingungen ·
  Datenschutz · Abnahme und Rügefrist · Rechtliches im Überblick

Die Kurzantwort ist **keine Werbung**: Sie steht so oder sinngleich auf der
Seite selbst. *Wer eine Antwort in den Index schreibt, die auf der Seite nicht
steht, hat die Suche zur zweiten Quelle gemacht.*

Das Verzeichnis wird **in beide Richtungen** gegen den Bau gehalten: Was darin
steht, muss gebaut werden; was gebaut wird, unter `lieferung` oder
`rechtliches/` liegt und eine Frage beantwortet, muss darin stehen — oder mit
Grund ausgenommen sein.

**Nach zwanzig Fragen: 20 von 20 beantwortet.** „versandkosten" führt jetzt
auf die Lieferseite.

Drei Stellen mussten dafür an der **Seite** geändert werden, nicht am Index:

- Die AGB-Überschrift heißt jetzt *„Geschäftsbedingungen (AGB)"* — die
  Abkürzung ist das Wort, das ein Kunde tippt, und sie stand auf der Seite
  nirgends.
- Die Übersichtsseite ist als sechste Dienstseite aufgenommen, weil sie als
  einzige die Frage nach dem **Widerrufsrecht** beantwortet: Es entfällt, weil
  ausschließlich an Unternehmer verkauft wird. „Nichts gefunden" wäre die
  falsche Antwort auf eine Frage, die eine hat.
- Umsatzsteuer, Rechnung und Zahlungsarten stehen in der Kurzantwort der AGB,
  weil sie auf der Seite stehen.

## Stand

- `src/dienstseiten.js` — neu: `DIENSTSEITEN` (6 Einträge), `dienstseitenbefund`.
- `bin/website.mjs` — die Dienstseiten gehen in den ausgelieferten Suchindex;
  AGB-Überschrift ergänzt.
- 6 neue Testfälle, davon zwei gegen die **ausgelieferte** `shop.js`.
- 1 Gegenprobe (`suche-ohne-die-dienstseiten`, angeschlagen).
- 2234 Testfälle, 157 Gegenproben, 48 Prüfer.

**Was der Auftraggeber davon wissen muss:** Nichts zu tun. Der Index wächst um
sechs Einträge — gemessen 0,8 KB im ausgelieferten Bündel (39,9 → 40,7 KB gezippt).
