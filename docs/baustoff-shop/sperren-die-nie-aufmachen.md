# Sperren, von denen niemand weiß, ob sie je aufmachen

*5. September 2026, früh. Runde 121.*

## Die Frage, die die letzte Runde offengelassen hat

Gestern Nacht fiel auf, wie die Proben um `darfBestaetigtWerden` gebaut sind:
sechs Sperrgründe, sechs Testfälle, und jeder prüft, dass **sein** Grund
kommt. Die übliche Zeile lautet

```js
assert.ok(!f.gruende.some((g) => /Lieferzeit/.test(g)));
```

und hält fest, dass ein bestimmter Grund fehlt — sie schweigt über die fünf
anderen. Sechs davon ergeben keine einzige Aussage darüber, ob die Sperre je
aufgeht.

> **Eine Sperre, von der niemand gezeigt hat, dass sie aufmacht, könnte jeden
> Auftrag abweisen, ohne dass eine Probe es merkt.**

Zwei Sperren waren betroffen, und beide sind geschlossen worden. Offen blieb
die eigentliche Frage: **Wie viele noch?** Das ist genau die Sorte Frage, die
man nicht durch Lesen beantwortet.

## Der Prüfer

`npm run pruefe-sperren` nimmt die Liste **aus den Quelldateien**, nicht aus
einem Register: Dieses Haus nennt jede Sperre `darfXWerden`, und diese
Benennung *ist* das Register — wer eine neue baut, trägt sie ein, indem er
sie so nennt. Ein zweites Verzeichnis wäre eine zweite Liste über dieselbe
Sache, und genau daran ist dieser Bestand schon ein halbes Dutzend Mal
gescheitert.

Auch das **Urteilsfeld** kommt aus der Quelle. Sechs Sperren geben
`{ erlaubt }` zurück, `darfVersendetWerden` gibt `{ darf }`. Ein Prüfer mit
fest verdrahtetem `erlaubt` hätte diese eine stillschweigend übersprungen —
und stillschweigend übersprungen ist die Fehlerart, um die es hier geht.

Als grüner Fall gilt eine bejahende Zusicherung im **Umkreis von acht
Zeilen** um einen Aufruf; drei Schreibweisen zählen, alle drei kommen im
Bestand vor:

```js
assert.equal(f.erlaubt, true)      // auch mit Meldung dahinter
assert.ok(f.erlaubt)
assert.deepEqual(f.gruende, [])    // die schärfere: kein Grund
```

Der Prüfer ist damit **grob**, wie `pruefe-tests`: Er meldet einen Verdacht,
kein Urteil. Wer begründet verzichtet, trägt die Sperre in
`OHNE_GRUENEN_FALL` ein — mit Grund, nicht mit Häkchen. Der Verzicht ist
heute leer, und auch das ist eine Aussage.

## Was er beim ersten Lauf gefunden hat

Genau die zwei, die von Hand gefunden worden waren — kein dritter, aber auch
keiner weniger:

| Sperre | Befund |
|---|---|
| `darfBeauftragtWerden` | **keine einzige Probe ruft sie auf** |
| `darfVorgangLaufen` | vier Proben, alle rot |

`darfBeauftragtWerden` entscheidet, ob der Brief an den
Rechtstexteanbieter hinausgeht — einer der wenigen Ausgänge dieses Hauses an
einen Dritten. Berührt wurde sie nur mittelbar: `test/fremdtext.test.js`
prüft am fertigen Brief, dass er ohne Rückantwortadresse
`versandfaehig: false` trägt. Das ist die rote Richtung über einen Umweg.

`darfVorgangLaufen` ist die Klammer über allen anderen Sperren. Ihre vier
Proben hießen „hält den Vorgang an", „halten den Vorgang an", „wird
abgewiesen", „gehört nicht zu Vorgang".

## Was daraus geworden ist

**Ein vollständiger Geschäftsfall, einmal ausgeschrieben.** Der grüne Fall
für `darfVorgangLaufen` ist die einzige Stelle im Bestand, an der
nachgerechnet steht, was ein Geschäft vollständig macht: Kunde mit UID und
Unternehmerbestätigung, Ware ohne Platzhalterpreis, Lieferzeit je Hersteller,
Konto des Betreibers, Zahlung mit Weg und Datum, Lieferdatum,
Rechnungsnummer. Er brauchte einen **eigenen Warenkorb**: Der geteilte reißt
Gate 25, weil die zweite Teillieferung auf 148,80 € netto kommt und der
Mindestbestellwert 250 € **je Lieferung** verlangt. *Eine vollständige Lage
muss vollständig sein, nicht fast.*

**Und ein neuer Fund als Nebenprodukt.** Der grüne Fall für den
Rechtstexteauftrag lief sofort rot — nicht an der Sperre, sondern am Papier:

```
[[ Telefonnummer des Absenders — FEHLT ]]
```

Der Brief druckt in der Unterschrift eine Telefonnummer, und die Sperre
verlangte sie nicht. Ein Auftrag konnte „versandfähig" heißen und trotzdem
eine sichtbare Lücke tragen.

> **Ein Papier, das hinausdarf und eine sichtbare Lücke trägt, ist ein
> Papier, das der Empfänger für unfertig hält.**

Der Schwesterbrief an den Lieferanten verlangt Telefon und E-Mail seit jeher.
Zwei Ausgänge an Dritte mit zwei verschiedenen Maßstäben waren einer zu viel;
`darfBeauftragtWerden` hat jetzt fünf Gründe statt vier. Gefunden hat es der
grüne Fall, den es bis heute nicht gab — **der rote Fall hätte es nie
gezeigt**, weil bei ihm ohnehin überall Lücken stehen.

## Der Stand

```
Sperrenabgleich: 7 Sperren gegen 22.133 Testzeilen
Sichtweite 8 Zeilen zwischen Aufruf und Zusicherung.

  ✓ darfBestaetigtWerden          (src/beleg.js, Urteil: erlaubt)
  ✓ darfRechnungGestelltWerden    (src/beleg.js, Urteil: erlaubt)
  ✓ darfAutomatischAusgeloestWerden (src/bestellung.js, Urteil: erlaubt)
  ✓ darfVersendetWerden           (src/lieferantenanfrage.js, Urteil: darf)
  ✓ darfVeroeffentlichtWerden     (src/maschinenlesbar.js, Urteil: erlaubt)
  ✓ darfBeauftragtWerden          (src/rechtstexteauftrag.js, Urteil: darf)
  ✓ darfVorgangLaufen             (src/vorgang.js, Urteil: erlaubt)

7 von 7 Sperren zeigen ihren grünen Fall.
```

Gegenprobe `sperre-ohne-gruenen-fall` nimmt den grünen Fall des
Rechtstexteauftrags wieder heraus und lässt die rote Richtung stehen — genau
den Zustand von heute früh. **51 Gegenproben für 31 Prüfer.**

## Die Lehre

> **Wer eine Sperre baut, schuldet beide Richtungen: dass sie hält und dass
> sie nachgibt.** Die rote Richtung schreibt sich von selbst, weil sie beim
> Bauen anfällt. Die grüne kostet Arbeit — man muss eine vollständige Lage
> herstellen — und wird deshalb übersprungen. Genau deshalb findet sie mehr:
> Die fehlende Telefonnummer war in keinem roten Fall zu sehen, weil dort
> ohnehin überall Lücken stehen.
