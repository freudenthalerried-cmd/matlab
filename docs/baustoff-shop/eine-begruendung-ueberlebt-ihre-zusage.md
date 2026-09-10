# Eine Begründung überlebt ihre Zusage

**10. September 2026, fünfte Runde.** Die Vorrunde ließ eine Zeile offen —
`abholung.ZUSAGE` war die letzte Behauptungsregel ohne Umschreibungen — und
diesmal hat der Prüfer sie selbst genannt statt ein Dokument. Beim Schließen
kam ein Fund heraus, an dem Geld hängt.

## Zuerst die Regel

Acht Sätze, die alle dasselbe zusagen. Das Muster fing **zwei** — die beiden,
gegen die es geschrieben wurde:

> „Sie **können** die Ware bei uns **abholen**." · „**Selbstabholer sparen**
> die Frachtpauschale." · „Abholung **nach Vereinbarung**." · „Gerne stellen
> wir Ihre Bestellung **zur Abholung bereit**." · „Ware kann **am Lager
> übernommen** werden." · „Auf Wunsch **holen Sie selbst ab**."

Diese Zusage ist keine Formalie. Der Shop hat **kein eigenes Lager**, und ob
Kunden beim Lieferanten abholen dürfen, ist dort angefragt und unbeantwortet
(Frage 6). Wer sie zusagt, schickt einen Bauleiter zu einem Tor, das ihn nicht
kennt.

Mit dem erweiterten Muster brauchte der Prüfer eine **Verneinung**: *„Sie
können die Ware **nicht** bei uns abholen"* ist die richtige Auskunft. Gesucht
wird sie links vom **Verb**, nicht links vom Treffer — sie steht mitten im
Treffer. Und nicht bis zum Trefferende: Sonst deckte das „**keine** Fracht"
in *„Wer selbst abholt, zahlt keine Fracht"* die Zusage, die davorsteht.

## Und dann der Fund

`bin/kampagne.mjs` führt ein Verzeichnis von Wörtern, die **absichtlich nicht**
als negatives Keyword ausgeschlossen sind. Einer der beiden Einträge:

> **abholung** — *„Die Lieferseite sagt ausdrücklich ‚Ja, ausdrücklich
> vorgesehen. Wer selbst abholt, zahlt keine Fracht.' Selbstabholung ist ein
> angebotener Weg und spart dem Shop die Frachtpauschale — eine Suche danach
> ist die günstigste Bestellung, die er bekommen kann."*

Die Lieferseite sagt das **seit dem 6. September nicht mehr**. Sie sagt das
Gegenteil: *„Abholung können wir derzeit nicht zusagen."* Ein Testfall hält
genau diesen Satz seither fest.

> **Eine Begründung, die eine Zusage zitiert, überlebt die Zusage.**

Vier Tage lang war „abholung" damit ausdrücklich **beworben** statt
ausgeschlossen — bei **4,19 € bis 8,22 € je Klick**. Wer „baustoffe abholen
perg" tippt, will genau das eine, was dieser Betrieb nicht kann, und landet
auf einer Seite, die ihm das sagt. Ein bezahlter Klick auf eine Absage — der
Satz stand schon im Werkzeug, eine Prüfung weiter oben, für Keywords, die die
eigene Seite verneint. Für die **Begründung**, warum ein Wort *nicht*
ausgeschlossen ist, galt er nicht.

Bemerkenswert daneben: Die **Anzeigentexte** waren längst berichtigt. Eine
Überschrift lautet *„Eine Lieferung, kein Abholen"*. Der Text war nachgezogen,
die Begründung im Register nicht — dieselbe Trennung wie an diesem Vormittag
zwischen Abnahmeseite und Beleg.

## Die Entscheidung

**Der Ausschluss wird abgeleitet, nicht eingetragen.** `abholungsausschluss()`
liest `abholungDurchKunden` der geführten Lieferanten:

- **nicht bestätigt** → „abholung", „abholen", „selbstabholung",
  „selbstabholer" stehen auf der Ausschlussliste;
- **bestätigt** → sie fallen von selbst weg, und dann stimmt die alte
  Begründung wieder: Selbstabholung wäre die günstigste Bestellung, die dieser
  Shop bekommen kann.

Eigenes Thema **„Nicht zugesagt"** statt „Nicht im Sortiment": Der Ausschluss
folgt keiner Sortimentsentscheidung, sondern einer offenen Frage — und die
Rückrichtung im Sortimentsregister hätte sonst angeschlagen, zu Recht.

Damit steht der Ausschluss auf 102 Wörtern (vorher 98).

## Damit es nicht wiederkommt

Zwei Regeln, beide in `bin/kampagne.mjs`:

1. **Eine Begründung, die zitiert, muss die Fundstelle nennen.** Erkannt an
   deutschen Anführungszeichen um mindestens ein paar Wörter; wer zitiert,
   trägt `zitat` und `fundstelle`. Der historische Eintrag kommt damit heute
   nicht mehr durch — ein Testfall führt ihn im Wortlaut vor.
2. **Jedes Zitat wird gegen die Seite gehalten, aus der es stammt.**
   `zitatbefund` liest das **Erzeugnis**, nicht die Vorlage: Was der Kunde
   sieht, ist die Behauptung. Fehlt die Fundstelle, gibt es die Seite nicht
   oder steht der Satz nicht mehr darauf — jedes davon ist ein Befund.

> **Ein Zitat in einer Begründung ist eine Behauptung über den Bestand wie
> jede andere — nur hat sie bis heute niemand nachgeschlagen.**

## Stand

- `src/abholung.js` — `ZUSAGE` um sechs Formen erweitert (über 111
  Kundenflächen null Fehltreffer), `VERNEINT` und satzweise Prüfung neu.
- `bin/kampagne.mjs` — `abholungsausschluss`, `zitatbefund`, `ZITIERT`,
  `THEMA_NICHT_ZUGESAGT`; der Eintrag „abholung" ist gestrichen, sein Wortlaut
  steht als Kommentar da, damit ein späterer Lauf ihn nicht arglos ergänzt.
- `src/umschreibung.js` — Regel `abholung` mit 9 Umschreibungen, davon eine
  offene Lücke mit Grund; `REGELQUELLEN` meldet jetzt **0** Behauptungsregeln
  ohne Umschreibungen.
- 8 neue Testfälle, 2 Gegenproben (`abholzusage-nur-in-zwei-worten`,
  `abholsuche-wieder-beworben`), beide angeschlagen.
- 2204 Testfälle, 151 Gegenproben, 48 Prüfer.

**Was der Auftraggeber davon wissen muss:** Nichts zu tun — die Kampagne steht
weiter auf PAUSIERT, und das Schalten löst Ausgaben aus. Sobald der Lieferant
die Abholfrage beantwortet, dreht sich der Ausschluss von selbst um; die
Frage steht als Nummer 6 in der Lieferantenanfrage.
