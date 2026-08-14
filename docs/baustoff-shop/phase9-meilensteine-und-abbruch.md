# Phase 9 — Meilensteine, Kennzahlen und Abbruchregeln

Stand: 2026-08-14. Erste Phase seit dem Stillstand, die sich ohne Freigabe,
ohne Ausgabe und ohne Kontakt zu Dritten vollständig bearbeiten lässt — und die
den Stillstand zum Teil auflöst.

Basis: [`PARAMETER.md`](./PARAMETER.md),
[`phase3-unit-economics.md`](./phase3-unit-economics.md),
[`STATUS.md`](./STATUS.md).

## Warum dieses Dokument vor dem ersten Euro entsteht

Das Modell steht auf zwei unbelegten Zahlen — Rohmarge und Materialwert je
Gebäude. Wer unter solchen Bedingungen 8.000–12.000 € einsetzt, entscheidet
nicht, sondern wettet. Abbruchregeln, die **vorher** festgelegt sind, kosten
nichts und sind das einzige Mittel gegen die Neigung, eine begonnene Sache
weiterzufinanzieren, weil sie begonnen ist.

Die Regel lautet deshalb: Jede Stufe hat einen Kostendeckel, eine Frist und ein
messbares Kriterium. Wird das Kriterium verfehlt, wird nicht nachgebessert,
sondern abgebrochen oder umgestellt.

## Gate 4 — die Modellentscheidung wird vertagt, und zwar begründet

In `STATUS.md` steht die Modellwahl zwischen Radon-Shop und Leadvermittlung als
eine von drei offenen Blockaden. Sie ist keine.

Die Stufen 0 bis 2 sind für beide Modelle **identisch**: dieselben
Herstellerkonditionen, dieselbe Nachfrageprüfung, dieselbe Domain, dieselben
Inhalte, dieselbe Plattform. Getrennt wird erst bei der Monetarisierung — und
das ist Stufe 3. Bis dahin ist jede Vorabfestlegung reine Selbstbindung ohne
Gegenwert.

> **Entscheidung: Die Modellwahl fällt am Ende von Stufe 2, nicht davor.**
> Grundlage sind dann drei Dinge, die heute fehlen: bestätigte
> Händlerkonditionen, gemessene Suchvolumina und die tatsächliche
> Anfragestruktur der ersten Besucher. Wer zuerst kauft, wird Shopkunde; wer
> zuerst fragt, wird Lead. Das zeigt sich, es lässt sich nicht erraten.

Damit sinkt die Zahl der wirklich blockierenden Freigaben von drei auf zwei.

## Das Stufenmodell

| Stufe | Zweck | Kostendeckel | Dauer | Weiter nur wenn |
|---|---|---|---|---|
| **0** | Konditionen belegen | 0 € | 4 Wochen | ≥2 Hersteller schriftlich, Rohmarge ≥32 % |
| **1** | Nachfrage messen | 200 € | 4 Wochen | ≥3 Themencluster mit tragfähigem Volumen |
| **2** | Fundament bauen | 2.500 € | 6 Monate | 800 Sessions/Monat und ≥5 Erstgeschäfte |
| **3** | Monetarisierung | 3.000 € | 3 Monate | Deckungsbeitrag deckt Fixkosten |
| **4** | Skalierung | aus Marge | offen | Zielkorridor wird gehalten |

**Kumuliertes Risiko bis zur ersten Umsatzbestätigung: 2.700 €.** Nicht
8.000–12.000 €. Der Unterschied entsteht dadurch, dass Gründung, Shopsystem und
Werbebudget erst nach dem ersten belegten Geschäft anfallen — und Werbung ab
Stufe 4 aus dem Deckungsbeitrag bezahlt wird, nicht aus Startkapital.

Das ist eine Korrektur an
[`phase3-unit-economics.md`](./phase3-unit-economics.md): Die dortigen
8.000–12.000 € Anlaufverlust gelten für den Weg, bei dem der Shop zuerst gebaut
und danach Nachfrage gesucht wird. In der gestuften Reihenfolge ist der Betrag
niedriger — allerdings nur unter einer Bedingung, die im nächsten Abschnitt
steht.

## Der eigentliche Kostentreiber ist nicht der Shop

Hosting, Domain und Rechtstexte kosten nach
[`phase5-technik.md`](./phase5-technik.md) 35–105 € im Monat. Das ist
vernachlässigbar. Der Aufbau steht und fällt mit den Inhalten, und die haben
zwei mögliche Preise:

| Weg | Kosten | Was er bricht |
|---|---|---|
| Selbst geschrieben | ~0 € Geld, 4–8 h je Beitrag | die Vorgabe „unabhängig von meiner Person" |
| Eingekauft | 150–300 € je Fachbeitrag, 12–15 Kernbeiträge = 1.800–4.500 € | den Kostendeckel der Stufe 2 |

Ein dritter Weg ist der wahrscheinliche: **Fachliche Gliederung und
Faktenprüfung vom Auftraggeber, Ausformulierung maschinell.** Das kostet rund
eine Stunde je Beitrag statt vier bis acht und hält beide Grenzen ein. Der
Fachbeitrag zur ÖNORM S 5280-2 ist nicht von jemandem schreibbar, der die Norm
nicht kennt — genau darin liegt aber auch die Alleinstellung.

Der Kostendeckel von 2.500 € für Stufe 2 unterstellt diesen dritten Weg. Wird
vollständig eingekauft, steigt er auf 5.000 € und das kumulierte Risiko auf
5.200 €.

## Kennzahlen je Stufe

Nur Größen, die ohne zusätzliches Werkzeug ablesbar sind. Was nicht gemessen
werden kann, taugt nicht als Abbruchkriterium.

### Stufe 0 — Konditionen

| Kennzahl | Zielwert | Abbruch bei |
|---|---|---|
| Antwortende Hersteller | ≥3 von 6 | 0 nach zweiter Nachfrage |
| Zugesagter Händlerrabatt auf UVP | ≥35 % | <35 % bei allen Antwortenden |
| Streckengeschäft zugesagt | ≥2 Hersteller | keiner |
| Kalkulierbare Frachtregelung | ≥2 Hersteller | „Fracht nach Aufwand" bei allen |
| Strukturierte Produktdaten (Gate 6) | ≥1 Kernlieferant | keiner → Shopmodell fällt |
| Daraus abgeleitete Rohmarge | ≥32 % | <32 % |

Die beiden mittleren Zeilen sind nachgetragen: Fracht aus
[`phase4-sortiment-und-materialwert.md`](./phase4-sortiment-und-materialwert.md),
Produktdaten aus [`phase6-automatisierung.md`](./phase6-automatisierung.md).
Beide werden von Anschreiben A bereits abgefragt (Punkt 4 und Punkt 6) und
kosten damit keinen Zusatzaufwand.

Fällt Stufe 0, fällt die Nische — so in Gate 3 festgelegt. Phase 1 wird dann
mit den nächstplatzierten Kandidaten neu aufgerollt, nicht das ganze Projekt
beendet.

### Stufe 1 — Nachfrage

| Kennzahl | Zielwert | Abbruch bei |
|---|---|---|
| Suchvolumen Hauptbegriffe AT/Monat | ≥2.000 kumuliert | <500 |
| Themencluster mit ≥200 Suchen | ≥3 | ≤1 |
| Wettbewerbsdichte der Kernbegriffe | niedrig bis mittel | durchgehend hoch |

Bei ≤1 tragfähigem Cluster ist Radon als alleinige Reichweitenquelle zu dünn.
Dann greift Gruppe C aus
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md) —
Kellersanierung und Bauwerksabdichtung — als tragende Achse, Radon als
Alleinstellung darin. Das ist eine Umstellung, kein Abbruch.

### Stufe 2 — Fundament

| Monat | Inhalte online | Sessions/Monat | Erstgeschäfte kumuliert |
|---|---|---|---|
| 3 | 8 | 150 | 0 |
| 6 | 15 | 800 | 5 |

Dazu als Frühindikator: **vermittelte Radonmessungen je Monat.** Sie laufen den
Sanierungsleads um rund drei Monate voraus — so lange dauert eine normgerechte
Langzeitmessung. Begründung in
[`phase3b-leadmodell.md`](./phase3b-leadmodell.md); dort ist die jährliche Zahl
der Messungen in Österreich als Engpass des Leadmodells benannt.

„Erstgeschäft" heißt: bezahlte Vermittlung an eine Messstelle, qualifizierter
Sanierungslead oder Materialbestellung — je nachdem, was zuerst eintritt. Die
Art des ersten Geschäfts ist das eigentliche Ergebnis dieser Stufe, weil sie
die Modellentscheidung aus Gate 4 beantwortet.

| Abbruchmarke Monat 6 | |
|---|---|
| <300 Sessions/Monat | Inhalte greifen nicht — Umstellung auf Cluster C oder Abbruch |
| 0 Erstgeschäfte bei ≥800 Sessions | Nachfrage ohne Kaufabsicht — Modell trägt nicht |

> **Eingeschränkt für die Leadstrecke.** Nach
> [`phase7b-messstrecke.md`](./phase7b-messstrecke.md) dauert eine
> normgerechte Langzeitmessung rund drei Monate. Wurden die ersten Messungen in
> Monat 4 angestoßen, kann bis Monat 6 physikalisch noch kein Sanierungslead
> vorliegen. Für die Leadstrecke tritt deshalb der Frühindikator
> **angeforderte Messungen je Monat** an die Stelle des Erstgeschäfts; für den
> Warenverkauf bleibt die Marke unverändert. Das lockert ein selbst gesetztes
> Kriterium, aber aus einer Eigenschaft der Sache, nicht aus Nachsicht.

Der zweite Fall ist der gefährlichere, weil er sich als Erfolg tarnt.
Reichweite ohne Transaktion ist in diesem Projekt wertlos; das steht schon in
[`content-und-leadgen.md`](./content-und-leadgen.md) und gilt hier erneut.

### Stufe 3 — Monetarisierung

| Kennzahl | Zielwert Monat 9 | Abbruch bei |
|---|---|---|
| Monatsumsatz bzw. Vermittlungserlös | 4.700 € | <2.000 € |
| Deckungsbeitrag nach Werbung | ≥ Fixkosten | dauerhaft negativ |
| Wiederkehrende Erlöse | ≥1 Retainer oder ≥20 % Bestandskunden | 0 |
| Beratungsanfragen je Bestellung | ≤0,2 | dauerhaft >0,5 |

Die letzte Zeile stammt aus [`phase6-automatisierung.md`](./phase6-automatisierung.md)
und misst die Vorgabe „unabhängig von meiner Person" direkt: Bleibt der Wert
hoch, ist das Geschäft ein Beratungsgeschäft mit angeschlossenem Verkauf.

4.700 € ist der Break-even aus
[`phase3-unit-economics.md`](./phase3-unit-economics.md). Er ist bewusst als
Zielwert gesetzt und nicht als Abbruchmarke — verfehlt wird erst unterhalb der
Hälfte.

### Stufe 4 — Skalierung

| Monat | Monatsumsatz | Anmerkung |
|---|---|---|
| 12 | 8.000 € | Werbung erstmals aus Marge finanziert |
| 18 | 15.000 € | Bestandskunden tragen erkennbar |
| 24 | 24.200 € | Zielgröße nach Planungsfall |

Der Korridor entspricht den 18–30 Monaten aus Gate 3. Verfehlt der Verlauf zwei
aufeinanderfolgende Marken um mehr als 40 %, ist die Zielgröße mit diesem
Modell nicht erreichbar und die Frage lautet nicht mehr „wie schneller", sondern
„was stattdessen".

## Harte Abbruchregeln, unabhängig von der Stufe

1. **Kumulierte Ausgaben über 6.000 € ohne Break-even** → Stopp. Der Rest des
   Startbudgets bleibt unangetastet und steht für einen zweiten Versuch in
   einer anderen Nische zur Verfügung.
2. **Monat 12 ohne Deckung der Fixkosten** → Stopp oder Modellwechsel, keine
   Nachfinanzierung.
3. **Bestätigte Rohmarge unter 32 %** → Nische fällt, unabhängig von allen
   anderen Zahlen.
4. **Rechtliche Auflage, die den Betrieb ohne laufende Anwesenheit unmöglich
   macht** → Stopp. Beispiel: eine Auslegung, nach der die Vermittlung an
   Messstellen selbst genehmigungspflichtig wäre. Siehe
   [`phase8-compliance.md`](./phase8-compliance.md).

## Was bei Abbruch erhalten bleibt

Nicht alles ist verloren, und das gehört zur ehrlichen Abwägung:

| Wert | Bleibt erhalten | Wert bei Weiterverwendung |
|---|---|---|
| Domain und Inhalte | ja | Grundlage für jedes andere Bauthema |
| Rankings | ja, solange die Domain lebt | wesentlicher Teil des Aufwands |
| Herstellerkontakte | ja | für jede andere Baustoffnische nutzbar |
| Rechtstexte, Hosting | nein, laufende Kosten | — |
| Gründungskosten GmbH | nur bei Weiterverwendung der Hülle | — |

Rund zwei Drittel des Aufwands bis Stufe 2 sind übertragbar. Das ist das
Hauptargument dafür, Inhalte vor Struktur zu bauen — und es ist derselbe Grund,
aus dem `phase5-technik.md` WordPress empfiehlt.

## Aufwand für die Messung selbst

| Rhythmus | Tätigkeit | Zeit |
|---|---|---|
| monatlich | Sessions, Rankings, Erstgeschäfte gegen Zielwerte prüfen | 30 min |
| je Stufenende | Stufenkriterium prüfen, Entscheidung dokumentieren | 1 h |
| quartalsweise | Zahlen der Vorstufen fortschreiben | 1 h |

Zusammen rund zwei Stunden im Monat. Das passt in die Vorgabe von 4–8 Stunden
aus [`skalierung-und-passivitaet.md`](./skalierung-und-passivitaet.md) und
lässt Raum für die eigentliche Arbeit.

## Was sich damit am Projektstand ändert

| Vorher | Jetzt |
|---|---|
| Drei blockierende Freigaben | Zwei — die Modellwahl ist begründet vertagt |
| Kapitalrisiko 8.000–12.000 € vorab | 2.700 € bis zur ersten Umsatzbestätigung |
| Kein Abbruchkriterium | Vier harte Regeln, je Stufe messbar |
| Kostentreiber unbenannt | Inhalte, nicht Technik — mit drei Wegen und Preisen |

Die verbleibenden zwei Freigaben sind unverändert: die sechs Herstelleranfragen
aus [`anschreiben-entwuerfe.md`](./anschreiben-entwuerfe.md) und das
Keyword-Werkzeug für 100–200 €. Beide liegen in Stufe 0 und Stufe 1 — also am
Anfang, wo sie hingehören, und zusammen unter 200 € Geldeinsatz.
