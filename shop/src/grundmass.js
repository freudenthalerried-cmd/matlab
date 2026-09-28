/**
 * Wie lang muss ein Grund sein?
 *
 * **Der Fund, 14. September 2026, mittags.** Dieses Haus beantwortete die
 * Frage **fünfmal verschieden** unter **zwei** Namen:
 *
 * | Name | Wert | Module |
 * |---|---|---|
 * | `GRUND_MINDESTLAENGE` | 150 | `korbtext`, `weisungsstand`, `verweise`, `zahlenherkunft` |
 * | `GRUND_MINDESTLAENGE` | 120 | `gatestand`, `ungerufen` |
 * | `MINDESTGRUND` | 60 | `vorbehalt` |
 * | `MINDESTGRUND` | 40 | `warenkorbdeckung`, `llmsdeckung` |
 * | — (gar nicht benannt) | 80 | `allaussage`, `codedubletten`, `regelnamen`, `zwillingssaetze`, … |
 *
 * Keine dieser Zahlen ist je entschieden worden. Sie sind entstanden — jede
 * beim Bau ihres Registers, jede aus dem Gefühl des Tages.
 *
 * > **Fünf Antworten auf eine Frage sind keine Genauigkeit, sondern die
 * > Abwesenheit einer Entscheidung.**
 *
 * ## Die Entscheidung, und warum es trotzdem zwei Werte sind
 *
 * Gemessen wurde, was ein einziger Wert kostet. **Und die erste Messung war
 * zu eng:** Sie lief über die Prüfer und meldete genau einen roten —
 * `pruefe-koerbe`. Über die Testreihen lief sie nicht, und dort fiel ein
 * zweites Register um: `OHNE_EINTRAG` in `src/llmsdeckung.js`, sechs Gründe
 * zwischen 134 und 171 Zeichen.
 *
 * > **Eine Messung, die nur die Prüfer fragt, hat die Hälfte der Register
 * > nicht gesehen** — viele werden von ihrem Testfall gehalten und von keinem
 * > Prüfer.
 *
 * Betroffen sind also zwei Register, und ihre Gründe sind gut:
 *
 * > „Nur bei versenkter Setzung — die Systemliste sagt es in derselben Zeile,
 * > und ob versenkt gesetzt wird, entscheidet die Dübelbemessung und nicht
 * > der Korb."
 *
 * Dieser Satz ist bei 148 Zeichen fertig. Ihn auf 150 zu bringen hieße, ein
 * Wort einzufügen, das niemand braucht.
 *
 * > **Ein Boden, der zum Auffüllen zwingt, misst die Länge und nicht den
 * > Gedanken.**
 *
 * Also zwei Werte, und der Unterschied ist benannt: Ein Grund, der eine
 * **Ausnahme im Quelltext** trägt, erklärt, warum eine Regel hier nicht gilt —
 * das ist ein Absatz. Ein Grund, der eine **fachliche Zuordnung** festhält
 * („diese Position gehört nicht in den Korb, weil ihre Menge am Bauwerk
 * hängt"), ist ein Satz und darf einer bleiben.
 */

/**
 * Für einen Grund, der eine **Ausnahme** trägt: mindestens ein Absatz.
 *
 * Wer eine Regel für einen Fall aussetzt, muss sagen, warum sie dort nicht
 * gilt, was stattdessen gilt und woran man merkt, dass der Grund abgelaufen
 * ist. Das sind drei Sätze, und drei Sätze sind 150 Zeichen.
 */
export const GRUND_MINDESTLAENGE = 150;

/**
 * Für einen Grund, der eine **fachliche Zuordnung** festhält: ein Satz.
 *
 * Gilt für zwei Register: die Warenkorbdeckung (`src/warenkorbdeckung.js`),
 * wo begründet wird, warum eine geführte Position der Systemliste nicht im
 * Rechenkorb liegt, und `OHNE_EINTRAG` in `src/llmsdeckung.js`, wo steht,
 * warum eine gebaute Seite nicht in `llms.txt` gehört. Vierzig Zeichen sind
 * kein Anspruch, sondern eine Sperre gegen das leere Feld; die vorhandenen
 * Gründe liegen zwischen 90 und 250.
 */
export const KURZGRUND_MINDESTLAENGE = 40;
