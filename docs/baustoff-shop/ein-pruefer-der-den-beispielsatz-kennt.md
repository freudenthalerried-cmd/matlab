# Ein Prüfer, der den Beispielsatz kennt

**10. September 2026.** Am 6. September stand an vier Kundenflächen derselbe
Satz: *„Werden mehrere Hersteller bestellt, entstehen mehrere Lieferungen, und
die Grenze gilt für jede einzelne."* Der Katalog führt 46 Artikel von **einem**
Lieferanten, der Rechenkern teilt nach `lieferantId` — ein Warenkorb ist eine
Lieferung. Die vier Stellen wurden berichtigt, der Satz wird seither aus der
Lieferantenzahl abgeleitet, und `src/lieferungen.js` bekam einen Prüfer dafür:

```js
export const BEHAUPTUNG =
  /(?:mehrere[nr]?|verschiedene[nr]?)\s+(?:Hersteller|Lieferanten)\S*[^.!?]{0,80}?entstehen mehrere Lieferungen/i;
```

Vier Tage lang grün. Gemessen am 10. September über **127 Kundenflächen** —
82 gebaute Seiten, 24 Quelltexte, `llms.txt`, die AGB-Gliederung und die
Lieferhinweise der Auftragsbestätigung — steht dieselbe Behauptung an
**sieben** weiteren Stellen, in vier anderen Formulierungen. Das Muster trifft
**keine** davon.

| Fläche | Was dort stand |
|---|---|
| **Angebot** (mit Bindefrist) | „Lieferung im Streckengeschäft **ab Werk der Hersteller**; Teillieferungen je Lieferant sind der **Regelfall** und werden **nicht gesondert berechnet**." |
| **AGB Punkt 4** | „Direktversand durch den Hersteller; Teillieferungen je Lieferant sind der Regelfall." |
| **Auftragsbestätigung** | „Teillieferungen kommen getrennt an. … Eine Bestellung erreicht die Baustelle deshalb **in mehreren Sendungen an verschiedenen Tagen**; jede ist für sich zu prüfen." |
| **Wissensseite** | „Wir bündeln, was auf dieselbe Baustelle geht, **statt drei Teillieferungen zu fahren**." |

> **Ein Prüfer, der aus einem Beispielsatz gebaut wird, erkennt den
> Beispielsatz.** Seine grüne Meldung hat seit dem 6. September nichts
> bedeutet.

## Was die einzelnen Stellen kosten

**Das Angebot ist der teuerste.** Es trägt eine Bindefrist, ist also eine
Zusage, und in anderthalb Zeilen stehen drei Fehler:

1. **„ab Werk der Hersteller"** — die Ware kommt vom Lager eines
   Baustoffhändlers in Mauthausen, nicht ab Werk von Baumit oder Schiedel.
2. **„Teillieferungen sind der Regelfall"** — bei einem Lieferanten gibt es
   keine.
3. **„werden nicht gesondert berechnet"** — das widerspricht **Punkt 5 der
   eigenen AGB**: *„Bei mehreren Lieferungen gilt er je Lieferung, weil
   Anfahrt und Verpackung je Lieferung anfallen."* Die Frachtpauschale von
   75,50 € fällt je Lieferung an. Käme der zweite Lieferant, stünde auf dem
   Angebot das Gegenteil dessen, was die Kasse rechnet.

Gefunden hat ihn nicht das Lesen, sondern der neue Prüfer bei seinem
**ersten Lauf** — er stand nicht auf der Liste der sieben, die die Messung
vorher gefunden hatte, weil `pruefe-belege` den Beleg **erzeugt** und keine
Datei liest.

**Die Auftragsbestätigung ist die verräterischste.** Die Abnahme**seite**
trägt denselben Hinweis — und sagt zwei Absätze darunter, seit dem 30. August:

> *„Ein Punkt oben trifft heute noch nicht zu. … Das jetzige Sortiment läuft
> über einen Lieferanten, also kommt eine Bestellung in einer Sendung."*

Auf dem **Beleg** steht derselbe Text allein. Und dort ist er keine
Beschreibung, sondern eine Auskunft über die Rügeobliegenheit nach § 377 UGB:
Wer auf eine zweite Sendung wartet, die nicht kommt, prüft die erste zu spät.

> **Die Berichtigung ist an der Seite angekommen und nicht am Text.**

Zwei Runden hintereinander dieselbe Familie: gestern die 400 €, die eine
Seite erreichten und eine andere nicht; heute ein Hinweiskasten, der auf der
Seite eingeordnet wird und auf dem Beleg nicht.

## Die Regel, die jetzt misst

> **Wer mehrere Lieferungen behauptet, sagt auf derselben Fläche, wovon sie
> abhängen.**

Zweistufig, und das ist Absicht:

1. **Der Satz** trägt seine Bedingung selbst — „Kommt ein zweiter Lieferant
   dazu, entstehen mehrere Lieferungen". So stehen 24 Fundstellen im Bestand,
   keine davon ein Befund.
2. Sonst entscheidet die **Fläche**: Nennt sie irgendwo den einen Lieferanten
   oder den zweiten, der dazukommen müsste, liest der Kunde beides zusammen.
   Das ist der Grund, warum die Abnahmeseite grün bleibt und der Beleg nicht.

**Was ausdrücklich nicht als Bedingung zählt:** ein beliebiges Bedingungswort
auf derselben Seite. „Wenn Sie Fragen haben, rufen Sie an" deckt nichts. Ein
Freibrief, der überall gilt, ist keiner — die Lehre steht seit dem
1. September im Leitzahlenregister.

**Und „mehreren" deckt sich nicht selbst.** Der erste Entwurf nahm jedes
„mehrere" als Bedingung; damit wäre *„erreicht die Baustelle in mehreren
Sendungen"* durch sein eigenes Wort gedeckt gewesen. Ein Testfall hält das
fest.

Die Regel schaltet sich selbst ab: Sobald der Katalog einen zweiten
Lieferanten führt, stimmen alle beanstandeten Sätze, und
`mehrlieferungsbefund` gibt ohne Meldung zurück. Gemessen wird die
Lieferantenzahl aus den Artikeln, nicht aus einer Notiz.

## Wo sie läuft

- **`npm run pruefe-belege`** — über die sieben **erzeugten** Belege. Was auf
  ihnen steht, gilt; die Vorlage prüft niemand.
- **`npm run pruefe-inhalte`** — über die 24 Quelltexte.
- **`npm run pruefe-seiten`** — über die 82 gebauten Seiten.
- **`test/lieferungen.test.js`** — über alles zusammen, 127 Flächen
  einschließlich AGB-Gliederung und Lieferhinweisen.

## Stand

- 4 Texte berichtigt: Angebot (`src/beleg.js`), AGB Punkt 4 und der
  Lieferhinweis (`src/rechtstexte.js`), Wissensseite.
- `src/lieferungen.js`: `MEHRLIEFERUNG`, `SATZBEDINGUNG`,
  `FLAECHENBEDINGUNG`, `saetzeVon`, `mehrlieferungsbefund`.
- 9 neue Testfälle, darunter einer über den ganzen Bestand.
- 3 Gegenproben, alle angeschlagen: `angebot-verspricht-teillieferungen` (3 s),
  `agb-macht-teillieferungen-zum-regelfall` (13 s),
  `wissensseite-buendelt-was-nicht-geteilt-ist` (7 s).
- 2183 Testfälle, 147 Gegenproben, 47 Prüfer.

**Was diese Runde nicht geändert hat:** die Regel selbst. „Je Lieferung"
stimmt und ist im Rechenkern richtig umgesetzt. Geändert hat sich, dass die
Kundentexte sagen, wann sie greift — und dass es auffällt, wenn eine neue
Formulierung es wieder nicht tut.
