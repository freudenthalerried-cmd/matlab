# Der Auswertungsbogen — und was „35 % Rabatt" wirklich bedeutet

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/auswertung.js`,
18 Testfälle.

Sobald die zwölf Anfragen aus
[`anschreiben-entwuerfe.md`](./anschreiben-entwuerfe.md) freigegeben sind und
Antworten eintreffen, entscheiden sich an ihnen Gate 1, 2 und 6 zugleich. Damit
dann niemand erst überlegen muss, wie zu lesen ist, was da steht, ist die
Auswertung jetzt gebaut — vor der Freigabe, wie Gate 17 es verlangt.

Beim Bauen ist etwas aufgefallen, das die Schwelle in Gate 2 in ein anderes
Licht rückt.

## Der Befund: Genau 35 % Rabatt lassen 4,4 % Preisspielraum

Der Verkaufspreis ist nach `preis.js` bei der UVP gedeckelt — höher geht nicht,
weil der Kunde die UVP kennt. Wer 35 % Händlerrabatt bekommt, hat damit
**höchstens** 35 % Rohmarge, und die auch nur, wenn er zur vollen UVP verkauft.
Jeder Prozentpunkt Nachlass geht unmittelbar von der Marge ab.

Gerechnet gegen die Untergrenze von 32 % aus Gate 1:

| Händlerrabatt | Reicht ohne Nachlass? | Möglicher Nachlass auf die UVP |
|---|---|---|
| 30 % | **nein** | — |
| 32 % | ja, exakt | **0,0 %** |
| 35 % | ja | 4,4 % |
| 38 % | ja | 8,8 % |
| 42 % | ja | 14,7 % |

**Das ändert die Lesart von Gate 2.** Die dort geforderten „≥ 35 %" klingen wie
ein Puffer über der Untergrenze von 32 %. Tatsächlich sind sie 4,4 Prozentpunkte
Nachlassspielraum — im Baustoffhandel, wo Handwerksbetriebe routinemäßig nach
Konditionen fragen, ist das fast nichts.

Der Wert 38 % aus
[`phase2-lieferantenlandkarte.md`](./phase2-lieferantenlandkarte.md) — dort
begründet damit, dass die Bahn die Marge tragen muss, weil das Rohr ein
Preisprodukt ist — bekommt damit eine zweite Begründung: **Erst bei 38 % wird
Preiswettbewerb überhaupt möglich.** Zwei unabhängige Wege zur selben Zahl, und
diesmal ist es keine Rundungsgleichheit, sondern dieselbe Ursache aus zwei
Richtungen.

**Kein neues Gate.** Gate 2 bleibt bei ≥ 35 %; die Schwelle ist nicht falsch,
sie ist nur enger, als sie aussieht. Wer eine Antwort mit genau 35 % bekommt,
sollte wissen, dass er damit einen Shop ohne Preisspielraum betreibt. Der
Auswertungsbogen weist das bei jeder Antwort aus.

## Was der Bogen prüft

Die vier Bedingungen aus [`entscheidungsmatrix.md`](./entscheidungsmatrix.md),
als UND-Verknüpfung:

1. Streckengeschäft mit Direktversand an den Endkunden
2. Händlerrabatt, aus dem ≥ 32 % Rohmarge bleiben
3. Kalkulierbare Frachtregelung — `nachAufwand` zählt als Absage
4. Strukturierte Produktdaten **und** ein angekündigter Preisrhythmus

Drei von vier ist nicht bestanden. Ein Testfall besteht darauf.

**Was nicht beantwortet wurde, gilt als nicht zugesagt.** Ein Hersteller, der
zur Fracht schweigt, hat keine kalkulierbare Frachtregelung zugesagt — und
genau darauf käme es an. Der Bogen zählt Schweigen nicht als „offen", sondern
als Nein; alles andere führte dazu, dass eine unvollständige Antwort später als
Zusage gelesen wird.

Zwei Punkte sind gegenüber der ursprünglichen Liste dazugekommen:

- **Der Preisrhythmus** ist Teil der vierten Bedingung, nicht nur die Datei.
  Eine CSV ohne angekündigten Rhythmus ist eine Momentaufnahme; Gate 6 verlangt
  aber, dass die Pflege sich beim Einlesen erledigt.
- **Wer fakturiert**, aus
  [`beleg-und-reihengeschaeft.md`](./beleg-und-reihengeschaeft.md). Nicht der
  Sitz des Herstellers entscheidet über das Reihengeschäft, sondern die
  Gesellschaft, die die Rechnung stellt. Ohne Angabe unterstellt der Bogen
  nichts — das Feld bleibt `null`.

## Von der Antwort zur Planungszahl

Prüfung A gilt als bestanden, wenn **mindestens zwei** Hersteller alle vier
Bedingungen zugleich erfüllen. Für die Planung zählt dann nicht der bessere,
sondern der **schwächere** der beiden: Beide Sortimentsteile werden gebraucht,
also begrenzt der schlechtere die Mischmarge.

Was daraus unmittelbar folgt:

| Beste zwei Zusagen | tragende Marge | Umsatz/Monat | Bestellungen | Sessions |
|---|---|---|---|---|
| 42 % / 38 % | 38 % | 22.921 € | 36 | 1.800 |
| 38 % / 35 % | 35 % | 25.875 € | 40 | 2.000 |
| 38 % / 34 % | 34 % | 27.036 € | 42 | 2.100 |
| 35 % / 32 % | 32 % | 29.702 € | 46 | 2.300 |

Die Spanne zwischen der besten und der schlechtesten noch zulässigen Antwort
beträgt **500 Besucher im Monat** — knapp 28 %. Das ist die Größenordnung, um
die es bei den zwölf Anfragen geht, und sie ist damit erstmals beziffert statt
beschrieben.

## Was der Bogen nicht kann

**Er ersetzt kein Urteil über die Antwort.** Ob ein Hersteller, der „Rabatt nach
Absatzstaffel" schreibt, damit eine kalkulierbare Kondition zusagt, entscheidet
kein Programm. Der Bogen prüft, was eingetragen wurde — wer einträgt, muss die
Antwort gelesen haben.

**Er kennt keine Nebenabreden.** Boni, Werbekostenzuschüsse, Skonti und
Erstausstattungsrabatte sind im Baustoffhandel üblich und können eine schwache
Grundkondition deutlich verbessern. Sie stehen nicht im Bogen, weil sie im
Anschreiben nicht gefragt sind. Wer sie zugesagt bekommt, sollte sie **nicht**
in den Rabattsatz einrechnen — sie sind an Bedingungen geknüpft, die im ersten
Jahr niemand erfüllt.

**Es ist nichts versendet.** Der Bogen ist leer und bleibt es, bis die Freigabe
für die zwölf Anfragen vorliegt.
