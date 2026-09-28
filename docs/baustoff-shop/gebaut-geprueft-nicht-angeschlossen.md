# Gebaut, geprüft, nicht angeschlossen

**3. September 2026, abends.** An einem Tag ist zweimal derselbe Befund
angefallen, und beide Male hat ihn ein Mensch beim Hinsehen gefunden:

| Funktion | Seit | Zustand |
|---|---|---|
| `erzeugeAngebot` | 31. August | Bindefrist nach § 862 ABGB, Pflichtangaben nach § 11 UStG, eigener Prüfer, 17 Testfälle — **außerhalb der Tests gerufen von: ihrem eigenen Prüfer, mit einem erfundenen Warenkorb** |
| `pruefeAnfrageAufGeheimnis` | 31. August | die zweite Reihe gegen Einkaufszahlen im Kundentext — **außerhalb der Tests gerufen von: niemandem** |

> **Eine Funktion, die nur ihre Tests rufen, ist ein Entwurf und kein
> Betriebsmittel.** Sie ist geprüft — aber *geprüft* ist nicht dasselbe wie
> *angeschlossen*, und der Unterschied fällt niemandem auf, weil beide Male
> grün danebensteht.

Zweimal an einem Tag ist kein Zufall, sondern eine Fehlerklasse. Sie hat bis
heute kein Werkzeug gehabt.

## Die Messung

`npm run pruefe-ungerufen` liest den **kommentarfreien** Quelltext von `src/`,
`bin/` und `shop-ui.js` und sucht jede `export function`, deren Name nirgends
als Aufruf vorkommt — außerhalb ihrer Definitionszeile und außerhalb der
Import- und Exportlisten. `test/` bleibt draußen, und das ist die ganze Aussage
dieses Prüfers: gesucht wird, was **nur** die Tests rufen.

Kommentare zählen ausdrücklich nicht mit. Ohne das hätte der Satz „gerufen hat
`erzeugeAngebot` niemand" die Funktion als gerufen gemeldet — ein Register, das
sich an seiner eigenen Begründung sattsieht.

Die Messung ist keine Erreichbarkeitsanalyse: Eine Funktion, die nur von einer
anderen ungerufenen gerufen wird, gilt hier als gerufen.

> **Sie irrt damit in eine Richtung: Sie findet zu wenig, nie zu viel.** Wer im
> Register steht, ist wirklich ungerufen; wer fehlt, kann es trotzdem sein. Für
> den Zweck reicht das — es geht um die Funktion, die gebaut, geprüft und dann
> vergessen wurde, und die hat gar keinen Rufer.

## Der Befund: 34

Gefunden werden **34 ungerufene Ausfuhren in 18 Modulen**. Jede steht jetzt im
Register `UNGERUFEN` mit einem Pflichtgrund — nach demselben Muster wie die
Widerrufe, die Leitzahlen, die Außentexte, die offenen Punkte, die Gegenproben
und das Crawler-Register.

Die Gründe fallen in vier Klassen, und keine davon ist „vergessen":

| Klasse | Module | Grund |
|---|---|---|
| **Betrieb, der nicht läuft** | `ablage.js` (7), `speicher.js` (2), `vorgang.js`, `vies.js` (2) | Rechnungsnummern nach § 11 Abs 1 Z 5 UStG, Aufbewahrung nach § 132 BAO, das Journal, die UID-Abfrage. Alle beginnen mit dem ersten echten Vorgang — und der beginnt mit einem Zahlungsanbieter, der beim Auftraggeber liegt. Ein Werkzeug, das heute Nummern zöge, schriebe eine Reihe, die mit dem ersten Kunden nicht mehr stimmt. |
| **Der andere Zweig** | `bedarf.js`, `gebiet.js`, `messwert.js` | Radonvorsorge. Nach Gate 12 liegen beide Modelle gleichrangig im Bestand; gebaut wird gerade der Baustoffhandel. |
| **Rechnung, deren Ergebnis wiederholt wird** | `kostenbild.js` (5), `verhandlung.js` (3), `empfindlichkeit.js`, `zahlung.js` | Die Wirtschaftlichkeitsrechnung ist gelaufen; wiederholt wird ihr **Ergebnis** als Leitzahl, gehalten von `npm run pruefe-leitzahlen`. Ein Werkzeug, das die Kaskade täglich neu druckt, druckt täglich dasselbe. |
| **Prüfer, der im Testfall wohnt** | `abgleich.js` (3), `aussentexte.js`, `buendel.js`, `kontrolle.js`, `crawler.js`, `quellen.js` | `test/abgleich.test.js` ruft `pruefeAbgleich` gegen die **echten** Module und verlangt Vollständigkeit; damit läuft die Prüfung in Schritt 1 des Gesamtlaufs mit. Was fehlt, ist nur die Ausgabe. Sie zusätzlich an ein Werkzeug zu hängen hieße, dieselbe Prüfung zweimal zu führen und beim nächsten Umbau eine der beiden zu vergessen. |

Der Rest ist einzeln begründet: `beleg.js#reihengeschaeftEinordnung` betrifft
den **Eingang** (innergemeinschaftlicher Erwerb) und gehört auf keinen
Kundenbeleg, sondern in die Unterlage für die Steuerberatung.

## Der Prüfer prüft in beide Richtungen

Die zweite Richtung ist die, die man vergisst: Ein Eintrag bleibt stehen, die
Funktion ist längst angeschlossen — und das Register führt eine Entschuldigung
für einen Zustand, den es nicht mehr gibt. Genau das ist beim **ersten Lauf**
eingetreten, und zwar an meinem eigenen, gerade geschriebenen Register:

```
✗ src/ablage.js#vorgangsakte ruft außerhalb der Tests niemand — und das
  Register sagt nicht, warum                                    [ohne-grund]
✗ src/kostenbild.js#gebuehrenanteil wird inzwischen gerufen — der Eintrag
  entschuldigt einen Zustand, den es nicht mehr gibt        [grund-ohne-fall]
```

Beide Fehler stammen aus meiner Vorabzählung mit `grep`, die Kommentare
mitgelesen hat. Der Prüfer, der Kommentare entfernt, hat beide gefunden — im
ersten Lauf, ohne dass jemand hingesehen hätte.

## Zwei Berichtigungen unterwegs

**1. Die zweite Reihe steht jetzt.** `pruefeAnfrageAufGeheimnis` läuft in
`npm run pruefe-belege` über den echten Anfragetext, mit den Artikeln samt
Einkaufsdaten. Die erste Reihe hält weiterhin (ins Browserbündel geht nur
`oeffentlicherArtikel()`, gemessen von `npm run pruefe-geheimnis`); die zweite
steht an dem einen Text, der aus dem Haus geht und aus einem Warenkorb mit
Einkaufspreisen entsteht.

**2. Und beim ersten Lauf meldete sie sofort — falsch.**

```
✗ Kundenanfrage
    POS-52124: die Zahl 3,68 ist sein Einkaufspreis und steht im Text
```

Der Artikel kommt in diesem Warenkorb gar nicht vor. Gefunden hatte sie die
Zahl in der Zeile `USt                   153,68 €`: `text.includes('3,68')`
trifft mitten in einer größeren Zahl.

> **Ein Fehlalarm, der bei jedem Lauf kommt, ist schlimmer als keine Prüfung.**
> Er bringt den Leser dazu, die Meldung zu überblättern — und mit ihr die
> echte.

Gesucht wird jetzt die **ganze** Zahl: keine Ziffer und kein Trennzeichen
davor, keine Ziffer danach. Der zufällige Gleichstand zweier echter Beträge
bleibt möglich und ist auch gemeint — er heißt weiterhin „hier nachsehen" und
nicht „hier steht ein Geheimnis".

## Was das für die Zukunft heißt

Der Prüfer läuft ab sofort in `npm run alles` mit (Schritt 20 von jetzt 21) und
hat ein Mindestmaß: Fällt die Zahl unter fünf, endet er rot. Ein leeres Ergebnis
hieße nicht „alles angeschlossen", sondern „die Messung hat nichts mehr
gelesen".

Die nächste Funktion, die gebaut, geprüft und nicht angeschlossen wird, meldet
sich selbst — beim nächsten Gesamtlauf, nicht beim nächsten Hinsehen.

## Verweise

- `shop/src/ungerufen.js` — Register und Regeln
- `shop/bin/ungerufen.mjs` — `npm run pruefe-ungerufen`
- `shop/test/ungerufen.test.js` — zehn Proben, darunter „ein Name im Kommentar ist kein Aufruf"
- [`der-beleg-den-nur-sein-pruefer-kannte.md`](./der-beleg-den-nur-sein-pruefer-kannte.md) — der erste der beiden Funde
