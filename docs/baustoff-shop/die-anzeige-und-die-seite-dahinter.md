# Die Anzeige und die Seite dahinter

**5. September 2026.** Die Kampagne ist die Fläche, für die der Auftraggeber
Geld freigeben soll: 45 Tage Klickversuch, das ganze Werbebudget. Gelesen habe
ich sie bisher nie — nur die Werkzeuge, die sie bauen.

Drei Anzeigen, je sieben bis acht Überschriften und vier Beschreibungen. Zwei
Befunde, und beide sitzen an derselben Stelle: **zwischen dem, was die Anzeige
verspricht, und dem, was die Seite dahinter kann.**

---

## 1. „Sie zahlen seinen Preis"

In der WDVS-Anzeige stand als Beschreibung 3:

> „Ein Baumeister kauft ein, **Sie zahlen seinen Preis**."

Die Anzeige führt auf `gruppe/wdvs.html`. Von dort ist — wie von jeder
Artikelkarte — die Wissensseite **„Was ‚Baumeisterpreis' heißt — und was
nicht"** verlinkt. Sie beantwortet dieselbe Frage in ihrem zweiten Satz:

> „Die Preise hier entstehen aus dem Einkauf eines Baumeisterbetriebs,
> **zuzüglich eines Aufschlags**, aus dem dieser Shop betrieben wird."

Der Kunde zahlt nicht seinen Preis. Er zahlt seinen Preis plus 25 %.

> **Die Landeseite erklärt sorgfältig, warum die Aussage nicht stimmt, die die
> Anzeige macht, die auf sie führt.**

Das ist keine Ungenauigkeit. Es ist eine **Preisangabe in einer Werbung** —
die Gattung, bei der eine falsche Aussage nicht nur enttäuscht.

### Was nicht getroffen wird

Der Claim selbst bleibt. „Zum Baumeisterpreis" ist die Weisung des
Auftraggebers, der Name der Website, und er ist durch eine eigene Wissensseite
eingeordnet — die es *nur deshalb* gibt. Auch „Baumeisterpreis, nicht Liste"
bleibt: Das ist präzise und wahr.

Getroffen wird die **Gleichsetzung**: Ihr Preis = sein Preis. Die vier Muster
in `PREISAUSSAGEN` verlangen deshalb ein Wort der Gleichheit („zahlen … seinen
Preis", „zum Einkaufspreis", „ohne Aufschlag") und lassen den Claim in Ruhe.
Ein Testfall hält das fest, mit vier Sätzen, die grün bleiben müssen.

Geprüft wird gegen `ZIELMARGE`, nicht gegen eine Liste: Wäre der Aufschlag
eines Tages null, hörte die Regel von selbst auf zu schlagen.

**Neuer Text:** „Ein Baumeister kauft ein — wie weit unter der Liste, steht bei
jedem Artikel." Das ist genau die Zahl, die die Wissensseite als „die Zahl, die
Sie tatsächlich betrifft" bezeichnet, und sie steht artikelweise nachrechenbar
auf jeder Karte.

---

## 2. Die Reihenfolge stand im Plan, die Bedingung nicht

Alle drei Anzeigen versprechen eine **Bestellung**:

> „Fassade **aus einer Bestellung**" · „Kaminzug **in einer Lieferung**" ·
> „Schiedel-Systemteile aus einer Bestellung, **geliefert statt abgeholt**"

Der Shop kann heute keine entgegennehmen. Gate 26: Der Bestellweg ist gebaut
und ausgeschaltet, und `llms.txt` sagt es wörtlich — „Bestellen ist noch nicht
möglich."

Das allein wäre kein Fehler: Die Kampagnen stehen auf PAUSIERT, und der
Rolloutplan setzt den Bestellweg auf **Tag 10–12**, das Schalten auf
**Tag 14–15**. Der Fehler ist, dass diese Reihenfolge **nur zeitlich** dastand.
`anzeigen-schalten` stützte sich auf `upload`, `keywordmessung` und
`indexierung` — nicht auf `bestellweg`. Verschiebt sich eine Etappe davor (der
Upload hängt an den Rechtstexten, zehn Tage Wartezeit auf Dritte), laufen
bezahlte Anzeigen auf ein Versprechen, das die Landeseite nicht einlöst.

> **Die Reihenfolge stand im Plan, die Bedingung nicht — und dazwischen liegt
> das ganze Werbebudget.**

Dieselbe Familie wie am 4. September: *„Nicht der neue Punkt fehlte, sondern
die Verbindung zwischen beiden Listen."*

**Nachgemessen:** Die Kopplung kostet **null Tage**. Die Kette bleibt bei 60,
weil der Bestellweg ohnehin davorlag. Sie macht die Reihenfolge verbindlich und
sonst nichts.

Und die Verbindung wird gehalten: `pruefeBestellversprechen` nimmt die
Anzeigentexte und die Etappen und meldet jedes Bestellversprechen, solange
`anzeigen-schalten` nicht auf `bestellweg` wartet.

**Keine Rückrichtung**, und das ist eine bewusste Ausnahme von der Hausregel:
Sonst müsste dieser Prüfer verlangen, die Abhängigkeit wieder zu entfernen,
sobald keine Anzeige mehr von einer Bestellung spricht — und ein Shop, der
bestellfähig ist, bevor er Klicks kauft, ist unabhängig vom Anzeigentext die
richtige Reihenfolge.

---

## Was gelesen und für richtig befunden wurde

Damit die zwei Befunde nicht wie eine Gesamtwertung aussehen — was beim Lesen
standgehalten hat:

- **Markennennungen** („Capatect und Baumit", „Schiedel Kaminsystem",
  „SIKM Systemteile") — der Shop führt alle drei; die Nennung ist die eines
  Wiederverkäufers.
- **„Kein Baumarktpreis"** — eine Abgrenzung, keine Preiszusage.
- **„In Paketeinheiten gerechnet, damit kein Rest übrig bleibt."** — stimmt,
  das ist der Gebindeschritt aus `mengenschritt()`.
- **„Geliefert wird in die Bezirke Perg, Urfahr-Umgebung, Freistadt,
  Linz-Land, Linz."** — steht in allen drei Anzeigen als Beschreibung 4 und
  deckt sich mit Gate 23.
- **Die Gebote** (4,19 € / 5,91 € / 8,22 €) stehen gegen einen Markt von
  0,50–2,50 € und sind aus dem Deckungsbeitrag des Referenzwarenkorbs
  gerechnet, nicht geschätzt.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `kampagne` prüft zwei Aussagengattungen mehr |
| Neue Gates | keine |
| Gegenproben | **65 für 35 Prüfer** (vorher 63) |
| Kettenlänge | **unverändert 60 Tage** |
| Testfälle | 1632 |

## Was offen bleibt

- **Die Landeseiten der drei Gruppen** sind noch nicht so gelesen worden wie
  die Anzeigen. Ein Klick endet dort, und die Anzeige ist nur die Hälfte des
  Versprechens.
- **Die Keywords** (100, davon 68 Gattung) und die 66 Ausschlüsse ebenso
  wenig. Ein Ausschluss, der zu breit ist, kostet Reichweite; einer, der
  fehlt, kostet Geld.
