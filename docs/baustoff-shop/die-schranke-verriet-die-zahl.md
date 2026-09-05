# Die Schranke verriet die Zahl

**5. September 2026.** Eine Runde ohne neuen Prüfer und ohne neues Gate — der
Anlass war ein Blatt Papier. Ich habe ein Angebot mit `erzeugeAngebot` aus dem
echten Katalog erzeugt und gelesen, wie es ein Einkäufer liest. Zwei Zeilen
haben mich aufgehalten:

```
Fracht Rohrhersteller Österreich: 0,00 € (frei Haus ab 1500 € Bestellwert)
Zahlungsbedingung: … (EPS-Onlineüberweisung, Vorkasse per Überweisung,
                      Kreditkarte (EU-Karte, Listenpreis Stripe)).
```

Beide sind seit Wochen so hinausgegangen. Beide sind derselbe Fehler:
**ein Feld, zwei Leser.**

---

## 1. „Bestellwert" heißt für den Kunden etwas anderes als für uns

In `src/preis.js` steht, drei Zeilen über dem Satz, seine eigene Widerlegung:

```js
const warenwertNetto  = cent(positionen.reduce((s, p) => s + p.vkNetto * p.menge, 0));
const bestellwertNetto = cent(positionen.reduce((s, p) => s + p.ekNetto * p.menge, 0));
```

`bestellwertNetto` ist der **Einkauf**. Der Kommentar darüber sagt es
ausdrücklich und richtig — die Frei-Haus-Schwelle ist eine Kondition des
Lieferanten uns gegenüber, gemessen an unserer Bestellung. Genau diese
Unterscheidung wurde am 27. August eingebaut, weil sie vorher fehlte und Geld
gekostet hat.

Der **Satz für den Kunden** wurde dabei nicht mitgedacht. Er sagt jetzt zwei
Dinge, die er nicht sagen soll:

1. Der Kunde liest „Bestellwert" als **seinen** Rechnungsbetrag. Gemeint ist
   unsere Bestellung beim Hersteller. Dasselbe Wort, zwei Bedeutungen, auf
   einem Papier mit vierzehn Tagen Bindefrist.
2. Wichtiger: **Steht in der Frachtzeile 0,00 €, dann ist unser Einkauf
   mindestens 1.500 €.** Der Warenwert steht daneben. Wer beides nimmt, hat
   eine Obergrenze für die Handelsspanne — ohne dass ein einziger
   Einkaufspreis im Papier steht.

> **Eine Schranke auf einer geheimen Zahl ist eine Aussage über die geheime
> Zahl.**

`pruefeMargenleck` suchte bis heute ausschließlich die **tatsächlichen**
Beträge: Wareneinsatz, Deckungsbeitrag, Einkauf je Lieferant. Der Docstring
sagt von sich, er sei „bewusst grob: Jede Schreibweise eines Einkaufswerts
zählt als Fund, auch eine zufällige" — und ging an einer Zahl vorbei, die
gar keinen Einkaufswert nennt, sondern ihn eingrenzt.

Dabei war die Lösung im Haus. `warenkorb.js` hat denselben Fall beim
**Mindestbestellwert** am 26. August gelöst: Der Fehlbetrag wird über den
Hebel in die Währung des Kunden gerechnet, bevor er hinausgeht, und der
Kommentar dazu ist eine halbe Seite lang. Zwei Felder weiter unten, in
derselben Datei, ging die Frei-Haus-Schwelle roh hinaus.

*Eine Regel, die an einer Stelle sorgfältig begründet wurde, gilt nicht
automatisch für die Zeile daneben.*

**Geändert:** Der Satz kommt jetzt aus `frachtfreiText()` in
`src/frachttext.js` — dem Modul, das es seit gestern gibt, weil der andere
Frachtsatz zweimal dastand — und lautet „frei Haus — die Frachtfreigrenze
dieses Herstellers ist erreicht". Die Tatsache, die den Kunden angeht, bleibt;
umzurechnen gibt es hier nichts. `fracht()` gibt die Schwelle als
`schwelleNetto` zurück, `berechneWarenkorb` trägt sie als
`frachtSchwelleNetto` in die Teillieferung, und `pruefeMargenleck` sucht sie
in jedem Kundenpapier — **unabhängig davon, ob sie in diesem Vorgang erreicht
wurde**: Auch „ab 1500 € entfällt die Fracht" auf einem Angebot über 400 €
nennt sie.

### Und die Kasse nannte sie ohnehin

`oeffentlicherLieferant()` in `shopkern.js` reichte `freiHausAbNetto` als Zahl
in das Browserbündel. Der Kommentar daneben begründete es sauber — der Browser
kennt keine Einkaufspreise, kann die Schwelle nicht prüfen und meldet sie
deshalb als offenen Punkt, „statt sie zu verschweigen". Der Punkt ist richtig.
Die Zahl war nie nötig, um ihn zu machen: **Für „die Fracht kann entfallen"
genügt, *dass* es eine Schwelle gibt.**

Und zwei Zeilen darüber, in derselben Funktion, steht der Satz, der das
entscheidet:

> **Geheim ist nicht die Geschäftsbeziehung, geheim sind die Konditionen.**

Ausgeliefert wird jetzt `freiHausMoeglich: true|false`. **Der Testfall von
vorher hieß „eine Frei-Haus-Schwelle wird gemeldet statt verschwiegen" und
enthielt `assert.match(r.offen[0], /1500/)`** — er hat die Auslieferung der
Zahl ausdrücklich verlangt. *Ein Test kann einen Fehler nicht nur übersehen,
er kann ihn festschreiben.*

---

## 2. Der Name des Zahlwegs hatte zwei Leser

`ZAHLWEGE[].name` ging an zwei Adressaten:

- an die **interne Kostentabelle**, wo „Listenpreis Stripe" genau die Angabe
  ist, um die es geht — der Satz ist nicht verhandelt, und die Konfidenz „hoch"
  hängt daran;
- an den **Kunden**, über `zahlwegName()` in `beleg.js` und auf der AGB-Seite.

In `ausgabe/website.html` steht deshalb, seit es die Datei gibt:

> „Kreditkarte (EU-Karte, **Listenpreis Stripe**) — angeboten"

Zwei Absätze darunter sagt dieselbe Seite: „Der Zahlungsanbieter ist noch nicht
gewählt." *Die Seite widerspricht sich innerhalb von zwölf Zeilen, und beide
Hälften stimmen für sich.*

Der zweite Fall im selben Feld ist stiller. Der Zahlweg heißt

> „Offene Rechnung, 30 Tage netto — **auf eigenes Risiko**"

Gemeint ist **unser** Ausfallrisiko; der Zahlweg wird deshalb nicht angeboten.
Auf einer Kundenseite liest das jeder Besteller als seines. Derselbe Satz stand
außerdem handgeschrieben in der AGB-Gliederung, Punkt 9.

**Geändert:** Jeder Zahlweg trägt einen `kundenname`; `zahlwegName()` gibt ihn
zurück und **wirft**, wenn er fehlt — ein `?? z.name` sähe aus wie Vorsorge und
wäre der Fehler von heute, nur seltener. Die Kasse nahm bisher `.name` mit
`?? z.id` als Ausweichwert; sie nimmt jetzt `zahlwegName()`. Die AGB-Tabelle
zwölf Zeilen weiter oben nahm schon immer `zahlwegName` — *zwei Stellen, eine
richtig, eine falsch, ist der Regelfall bei einem Feld mit zwei Lesern.*

---

## 3. Der Prüfer, der beides nicht sehen konnte

`npm run pruefe-geheimnis` hat drei Durchgänge: Abfluss, Rekonstruktion,
Schlüssel. Alle drei suchen **Beträge**. Keiner konnte „Listenpreis Stripe"
oder „Frei-Haus-Schwelle ab 1500 €" finden, weil keines von beidem ein
Einkaufspreis ist. Beide sagen etwas über einen.

**Neu: Durchgang 4** — interne Namen und Lieferantenschwellen in **allen 94
Ausgabedateien**, nicht nur in den drei, die Durchgang 3 kennt. Der Fund von
heute stand in `website.html` **und** in `shop.js`.

Zwei Dinge daran waren die eigentliche Arbeit:

**Das Wort „Listenpreis" gehört nicht ins Register.** Der erste Wurf führte es,
und der Lauf meldete **216 Fundstellen in 47 Dateien** — alle richtig so:

> „73 % unter dem Listenpreis des Lieferanten."

Das ist der Listenpreis des **Herstellers**, die UVP, öffentlich, und der
Abstand zu ihr ist das Verkaufsargument des Shops. Der „Listenpreis Stripe" ist
der Satz unseres **Abwicklers**. Ein Wort, zwei Sachen. Ein Prüfer, der 216
richtige Sätze anschwärzt, um einen falschen zu finden, wird nach dem zweiten
Lauf abgeschaltet — und dann meldet er auch den echten Fall nicht mehr. Gesucht
wird deshalb der Abwickler beim Namen; er kommt in beiden Kartenzeilen vor und
trägt den Listenpreis mit. Das Wort steht in einem **Gegenregister**
(`NICHT_IM_REGISTER`) mit dem Grund, warum es nicht geführt wird, und
`namensbefund` meldet es, wenn jemand es doch einträgt.

Dieselbe Klammer gilt für die Schwellen: 1200 allein trifft jede
Artikelnummer, 600 jedes Millimetermaß. Gesucht wird die Zahl **in Gesellschaft
eines Frachtworts**. Die Lektion stand schon in derselben Datei — Durchgang 3
suchte einmal `0.25` und fand die Kartengebühr von 25 Cent.

**Eine Fundstelle bleibt, mit Grund.** Die Kasse liefert ihre Zahlwege als
Datensatz aus, und darin steht `"id":"karte-stripe"` als Wert des
Auswahlfelds. Sie muss: Was der Kunde anklickt, kommt in seinem Anfragetext
zurück und wird dort wieder zugeordnet. Nach dem Satz aus `shopkern.js` ist das
die Geschäftsbeziehung, nicht die Kondition. Der Eintrag steht in `HINGENOMMEN`
und wird **in beide Richtungen** gehalten: `teileFunde` meldet einen Eintrag,
der nichts mehr trifft — *sonst steht hier in einem Monat eine Ausnahme für
eine Stelle, die längst behoben ist, und sie liest sich wie ein Zustand.*

### Der Verzicht, der abgelaufen war

`pruefe-geheimnis` stand in `OHNE_GEGENPROBE`, und der Grund stimmte:

> „Seine Mutation wäre, einen Einkaufspreis in eine öffentliche Datei zu
> schreiben. Auch nur für Sekunden und auch nur lokal — das ist die eine
> Datei, die diese Arbeit nicht anfassen darf."

Für die Durchgänge 1 bis 3 gilt das weiter. Durchgang 4 sucht keine Beträge,
sondern Aussagen über Beträge — und der lässt sich gefahrlos gegenproben. Die
Gegenprobe `abwicklername-im-kundennamen` stellt genau den Zustand her, der bis
heute ausgeliefert wurde, und der Prüfer meldet rot.

*Ein begründeter Verzicht ist an den Umfang des Prüfers gebunden. Wächst der
Prüfer, läuft der Verzicht ab* — dieselbe Familie wie die Begründung „zusammen
gut eine Minute" von gestern, die nicht falsch wurde, sondern abgelaufen ist.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-geheimnis` bekam einen vierten Durchgang |
| Neue Gates | keine |
| Gegenproben | **59 für 35 Prüfer**, 1 weitere mit begründetem Verzicht (vorher 58 / 34 / 2) |
| Geänderte Kundentexte | Frachtzeile, Zahlwegnamen, AGB Punkt 9 |

## Was offen bleibt

- **Die Programmkennung `karte-stripe`** nennt den Abwickler. Hingenommen mit
  Grund; wenn der Anbieter gewählt ist, ist die Kennung ohnehin zu prüfen.
- **`data/lieferanten.json` führt die Schwellen im Klartext** und liegt im
  öffentlichen Verzeichnis. Das ist der offene Punkt „Repository privat
  schalten", nicht ein eigener — die Datei trägt daneben `haendlerrabattAufUvp`.
- **Der Zahlungsanbieter ist weiter nicht gewählt.** Das ist eine Ausgabe und
  liegt beim Auftraggeber.
