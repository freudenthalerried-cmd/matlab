# Der Bezugsweg stand auf dem Angebot

**11. September 2026. Runde 31.**

## Wie es aufgefallen ist

Diese Runde hatte ein anderes Ziel. Die Betriebskette sagte seit dem
10. September über den Schritt „Rechnung":

> *Was fehlt, ist der Befehl, der beides zusammenführt — und ihm fehlen zwei
> Angaben, die kein Kommandozeilenwert sind: das **Lieferdatum** und der
> **Zahlungseingang**.*

Diese Begründung trägt nicht. Sie wirft zwei Dinge zusammen:
**Festzustellen**, dass bezahlt wurde, braucht den Kontoauszug — den hat
dieses Haus nicht und soll ihn nicht haben. **Die Rechnung zu schreiben**,
nachdem der Betreiber es festgestellt hat, braucht nur, dass er es eingibt —
genau wie die Anschrift des Kunden, die auch niemand aus einer Anfrage
ableitet.

> **Eine Angabe, die aus der Welt kommt, ist kein Hindernis für ein Werkzeug —
> sie ist sein erstes Argument.**

Also `npm run vorgang -- --stufe rechnung --geliefert … --bezahlt …`. Und weil
die Absage seit dem 10. September ihren fertigen Text durch `findeInterna`
schickt, bekam die Rechnung denselben Prüfer. Er meldete sofort.

## Der Fund

```
Abbruch: Die Rechnung trägt ein Internum — nichts ausgegeben.
  · lieferantenname: „Poschacher"  (3 Fundstellen)
```

Nachgemessen am Angebot — dem Blatt, das seit dem 30. August gedruckt wird:

| | |
| --- | --- |
| Länge des Briefes | 1.544 Zeichen |
| Nennungen des Lieferanten | **3** |

Sie standen in der Überschrift jeder Teillieferung
(„Poschacher Baustoffhandel — Direktlieferung"), in ihrer Frachtzeile und in
der Lückenmarke einer fehlenden Lieferzeit.

`src/interna.js` führt genau diesen Namen **seit dem 28. August** als
Internum, mit dem Grund:

> *Der Bezugsweg. Er steht dem Kunden nicht zu und dem Wettbewerber schon gar
> nicht — die Herstellernamen der Ware sind davon unberührt.*

Geprüft wurde das über jede gebaute Seite und über jeden Anzeigentext. Über
die drei Belege nie — und der Satz, warum, stand seit einem Tag im Bestand,
nur über die Absage geschrieben: *„geprüft würde sie von niemandem, denn die
Interna-Prüfung läuft über gebaute Seiten und Anzeigentexte, nicht über eine
Mail von Hand."* Für Angebot, Auftragsbestätigung und Rechnung galt derselbe
Satz. Nur wurden die schon gedruckt.

> **Eine Regel, die für Seiten gilt und für Briefe nicht, ist keine Regel über
> den Bezugsweg, sondern eine über HTML.**

## Gate 39 — der Bezugsweg steht auf keinem Kundenbeleg

Kundenbelege nennen die **Lieferung**, nicht den Lieferanten:

```
Lieferung 1 — Direktlieferung, 5 Werktage
    30 Sack  POS-12569    Klebe- und Armiermörtel
      à 12,40 € netto = 372,00 €
  Fracht Lieferung 1: 90,50 € (Pauschale plus 2× Kranentladung)
```

Der Kunde verliert dabei nichts. Was ihn angeht, ist **welche** Lieferung wann
kommt und was ihre Fracht kostet, nicht von wem sie stammt — und bei einer
fehlenden Lieferzeit ist „[[ Lieferzeit Lieferung 1 — FEHLT ]]" sogar die
brauchbarere Auskunft als ein Firmenname, den er nicht einordnen kann. Die
**Herstellernamen der Ware** stehen unverändert in jeder Positionszeile, und
die Bestellungen an den Lieferanten nennen ihn selbstverständlich weiter.

Durchgesetzt wird es an drei Stellen: Das Werkzeug schickt **jeden** fertigen
Beleg durch `findeInterna` und bricht ab, statt ihn auszugeben; ein Prüffall
fährt das Verhalten, indem er dem Aussteller einen geführten Namen gibt und
einen roten Ausgang verlangt; zwei Gegenproben halten beides wach.

## Ein Testfall, der das Leck zusicherte

`test/beleg.test.js` verlangte seit dem Anfang:

```js
for (const teil of korb.teillieferungen) {
  assert.ok(a.text.includes(teil.lieferantName), `${teil.lieferantName} fehlt im Angebot`);
}
```

> **Ein Testfall, der ein Leck zusichert, hält es fest.**

Er ist berichtigt und prüft jetzt beide Richtungen: Die Lieferung muss
dastehen, der Lieferant nicht.

## Die Rechnung, nebenbei

Die vierte Stufe steht und ist dieselbe Bauart wie die Absage: `--geliefert`,
`--bezahlt` und `--zahlweg` sind Pflicht, `darfRechnungGestelltWerden` hält
Pflichtangaben, Platzhalterpreise und Zahlungsvermerk auf, und die Nummer
fällt erst beim Ablegen, damit kein abgebrochener Lauf eine aus dem
fortlaufenden Kreis verbrennt.

**Heute entsteht damit trotzdem keine Rechnung**, und zwar zu Recht: Die
UID-Nummer des Ausstellers ist Pflichtangabe nach § 11 Abs 1 Z 6 UStG und
steht in `data/betreiber.json` leer. Der Lauf sagt genau das.

Damit der Weg dahinter nicht ungeprüft bleibt, liest das Werkzeug die
Betreiberdatei jetzt auch aus `VORGANG_BETREIBER` — derselbe Schalter,
dieselbe Begründung wie bei den Lieferzeiten: **Eine Sperre, die richtig ist,
macht den Weg dahinter trotzdem ungeprüft.**

## Ausgang

| | |
| --- | --- |
| Nennungen des Bezugswegs auf Kundenbelegen | 3 → **0** |
| Stufen des Vorgangswerkzeugs | 3 → **4** |
| Schritte der Betriebskette mit Werkzeug | 5 → **6** |
| Gates | 38 → **39** |
| Testfälle | 6 neu, 2333 grün |
| Gegenproben | 194 → **196** |

## Was daraus offen bleibt

Nichts Neues. Die Rechnung wartet auf dieselbe UID, die im Impressum, im Feed
und seit gestern in der maschinenlesbaren Entität fehlt — vier Stellen, eine
Angabe.

---

**Die Regel dieser Runde:** *Eine Regel gilt für die Form, an der sie geprüft
wird — und nur für die.*
