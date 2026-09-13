# Die AGB-Seite hat die eigene Kalkulation ausgestellt

Stand: 2026-08-27. Der Auftraggeber hat den gebauten Shop angesehen und
eine Frage gestellt, die nach einer Verständnisfrage klingt:

> **„ist das schon die öffentliche seite oder nur dashboard für mich"**

Die Antwort ist: die öffentliche Seite. Und beim Nachsehen, ob das stimmt,
kam heraus, dass sie es an einer Stelle **zu wörtlich** war.

## Was auf der AGB-Seite stand

`rechtliches/agb.html` — eine Kundenseite — enthielt:

| | |
|---|---|
| die eigene Rohmarge | „diese 3 % heben die Rohmarge von **25 auf 27,25 %**" |
| das Skonto beider Lieferanten | „beide Lieferanten geben **3 % Skonto bei 14 Tagen**" |
| Mehrkosten je Zahlweg | „**+6,50 €** je Bestellung nach Gebühr und Skonto", „**17,93 €** je Bestellung mehr als EPS" |
| die eigene Kippzahl | „lohnt ab **acht Zusatzbestellungen** im Monat oder einer **Ausfallquote über 3,2 %**" |
| interne Gate-Nummern | „Maßgeblich für **Gate 21** …" |
| Programmkennungen | `eps`, `karte-stripe`, `offene-rechnung` als Zeilenüberschriften |

Alles davon habe ich am Vortag selbst dort hingeschrieben. `ZAHLUNGSBEDINGUNGEN`
in `rechtstexte.js` kannte nur **ein** Feld — `grund` —, und das war die
Entscheidungsbegründung. `bin/website.mjs` hat sie in eine Tabelle gerendert,
deren Spalte „Warum" heißt.

> **Eine Begründung, die überzeugt, überzeugt auch die Konkurrenz.** Der
> Grund, warum eine Bedingung gilt, ist nicht automatisch der Grund, den man
> dem Kunden nennt — und der Unterschied ist keine Unehrlichkeit, sondern die
> Grenze zwischen Auskunft und Kalkulation.

## Warum keiner der drei Prüfer angeschlagen hat

Die Prüfkette war zu dem Zeitpunkt vier Werkzeuge stark, und keines stellt
diese Frage:

| Prüfer | fragt |
|---|---|
| `pruefe-inhalte` | Stimmt die Aussage, und ist sie belegt? |
| `pruefe-quellen` | Trägt die Quelle die Aussage? |
| `pruefe-geheimnis` | Lässt sich der Einkaufspreis zurückrechnen? |
| `pruefe-widerrufe` | Ist die Aussage längst zurückgenommen? |

Die fünfte Frage fehlte: **Gehört das überhaupt auf diese Seite?** Jede
einzelne Angabe war wahr, belegt, aktuell und nicht widerrufen. Sie stand
nur am falschen Ort.

Der Fehler ist damit eine alte Bekannte dieses Vorhabens in neuer Kleidung —
*eine Angabe, die berechnet und dann falsch ausgegeben wird*. Bisher trat sie
als **verschwiegene** Zahl auf (die Gebühr, die aus dem Angebot fiel; die
Fracht, die im Warenkorb fehlte). Diesmal war es die Umkehrung: eine Zahl,
die ausgegeben wurde, wo sie hätte schweigen müssen. Beide Richtungen haben
dieselbe Ursache — **der Datensatz wird ausgegeben statt der Inhalt.**

## Der Riegel: `src/interna.js`, im Bauwerkzeug

Sechs Mustergruppen, jede mit ihrem Grund: Gate-Nummern, eigene Spanne,
Lieferantenkonditionen, Lieferantennamen, Betriebsrechnung,
Programmkennungen. Der Prüfer läuft **im Bau selbst**, an derselben Stelle
und nach derselben Regel wie die Verweisprüfung:

> **Eine Seite mit einem Treffer wird nicht geschrieben.** Ein Prüfer, den
> man nach dem Bauen aufrufen muss, wird irgendwann nicht aufgerufen — und
> genau so ist die Rohmarge auf die AGB-Seite gekommen.

Ausnahmen gibt es, aber sie kosten einen Satz: `intern: begruendet — Grund`
im Seitenkopf, und der Grund steht im Baubericht. Ausnahmen lassen sich
außerdem **auf einzelne Muster eingrenzen** (`internNur`) — eine Ausnahme,
die mehr freigibt als nötig, ist der zweite Fehler nach dem ersten.

### Erster Lauf: vierzehn Treffer auf vier Seiten

Neben der AGB-Seite meldete er die Startseite und zwei Wissensseiten. Deren
Treffer sind **keine Versehen**, und darin liegt die eigentliche Frage
(unten).

## Was berichtigt wurde

1. **`ZAHLUNGSBEDINGUNGEN` hat jetzt zwei Begründungen je Zahlweg**:
   `grund` (intern, bleibt im Verzeichnis) und `kunde` (veröffentlichbar).
   Die Seite rendert `kunde`.
2. **Die Zahlweg-Tabelle zeigt Namen statt Kennungen** — „EPS-Onlineüberweisung"
   statt `eps`. Die Kennung stammt aus `zahlung.js`; weicht sie ab, bricht
   der Bau.
3. **AGB Punkt 9 ist neu geschrieben.** Der alte Hinweis war eine Notiz an
   mich selbst. Der neue nennt, was die Klausel regeln muss —
   Eigentumsvorbehalt bis zur vollständigen Zahlung, ausdrücklich für
   Weiterverkauf und Einbau in fremdes Eigentum, weil Baustoff regelmäßig
   verbaut ist, bevor er bezahlt ist. **Das ist der nützlichere Punkt**, und
   er hat vorher gefehlt, weil die Stelle mit Skontorechnung belegt war.
4. **Die Begründung für null Tage steht weiter da, in Kundensprache:**
   *Wer nicht auf Ziel kauft, zahlt hier nicht für den, der es tut.* Das ist
   dieselbe Wahrheit ohne die Zahlen dahinter.

## Die Entscheidung, die nicht mir gehört

Drei Seiten nennen die **Handelsspanne von 25 %** ausdrücklich — die
Startseite im ersten Satz, `wissen/baumeisterpreis.md` als deren
Kernaussage, `wissen/warum-keine-gratislieferung.md` als Begründung.

Das ist kein Versehen, sondern das Verkaufsargument: *Was ein Baumeister im
Einkauf zahlt, zahlen Sie auch — zuzüglich 25 %.* Ohne die Zahl ist es eine
Behauptung; mit ihr ist es nachrechenbar, und genau das trägt den Kanal, für
den der Shop gebaut ist.

**Es hat aber einen Preis, und der gehört genannt:**

| | |
|---|---|
| **dafür** | die Aussage wird prüfbar statt werblich; für die KI-Sichtbarkeit ist eine nachrechenbare Angabe mehr wert als ein Superlativ |
| **dagegen** | wer die Spanne kennt, kennt bei jedem veröffentlichten Verkaufspreis den Einkaufspreis — der Wettbewerber ebenso wie der Lieferant beim nächsten Konditionengespräch |

Der zweite Punkt ist derselbe, der in
[`rekonstruierbare-einkaufspreise.md`](./rekonstruierbare-einkaufspreise.md)
steht — dort für das Verzeichnis, hier für den Shop. Nur mit einem
Unterschied: **Das Verzeichnis kann privat gestellt werden. Ein Shop nicht.**

Die drei Seiten tragen deshalb eine **begründete Ausnahme**, keine
stillschweigende. Der Bau nennt sie bei jedem Lauf. Entschieden ist nichts;
die Entscheidung gehört dem Auftraggeber, weil sie das Verkaufsargument
betrifft und nicht die Technik.

Drei Wege stehen offen, falls sie fallen soll:

1. **Spanne nennen, Prozentsatz weglassen** — „zuzüglich einer Handelsspanne"
   statt „zuzüglich 25 %". Kostet die Nachrechenbarkeit.
2. **Preisvorteil nennen statt Spanne** — „durchschnittlich 8 % unter dem
   Fachhandel" (die Zahl steht in `marge-25-prozent.md`). Sagt dem Kunden
   mehr und dem Wettbewerber weniger.
3. **So lassen.** Der Vorteil ist real und der Nachteil bekannt.

Mein Vorschlag ist **Weg 2**: Der Kunde fragt nicht nach der Spanne, er fragt
nach dem Vorteil. Die Zahl, die er braucht, ist die Differenz zum
Fachhandel — und die verrät den Einkauf nicht.

## Was der Riegel nicht kann

| | |
|---|---|
| **Umschreibungen** | „unser Aufschlag liegt bei einem Viertel" kommt durch. Er sucht Muster, keine Bedeutung. |
| **Neue Interna** | Er kennt sechs Gruppen. Was niemand einträgt, findet er nicht. |
| **Die Demo** | `demo.html` läuft über `build-demo.mjs` und ist ungeprüft — die Bestelloberfläche zeigt Deckungsbeiträge, dort allerdings absichtlich. |

Die dritte Zeile ist eine offene Aufgabe: Die Demo ist als
**Arbeitsoberfläche** gebaut und zeigt Gate-Meldungen im Klartext. Solange
sie nicht öffentlich liegt, ist das richtig. Wenn sie es wird, gilt für sie
dieselbe Prüfung — und dann ist sie die Antwort auf die Frage, die diesen
Bericht ausgelöst hat: **das eine ist der Shop, das andere das Dashboard.**

635 Testfälle grün, davon 8 neue. 11 Oberflächenszenarien grün.
