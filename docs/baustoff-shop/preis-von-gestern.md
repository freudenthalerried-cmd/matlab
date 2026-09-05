# Der Preis von gestern, ausgewiesen als der von heute

**1. September 2026.** Drei Funde, alle in derselben Richtung: Etwas stimmt
heute und hat kein Ablaufdatum eingebaut.

## 1. Der Seitenfuß, der einen Termin hat

Im Fuß aller 81 Seiten stand fest verdrahtet:

> „Vorschau ohne Bestellmöglichkeit. Nichts ist gegründet, verkauft oder
> eingenommen."

Der Satz stimmt heute. Er stimmt an dem Tag nicht mehr, an dem der
Auftraggeber Impressum, Lieferzeit, Zahlungsanbieter und Rechtstexte
geschlossen hat — und dann steht er trotzdem noch da, auf jeder Seite, und
sagt dem Kunden, dass er hier nicht bestellen kann.

Die Kasse hat genau diesen Fehler schon hinter sich: Sie zählte früher fest
auf, was fehlt, und rechnet es seither aus `startklar()`. Die Startseite
ebenso. **Der Fuß war der dritte Weg zur selben Aussage — und der einzige
ohne Quelle.** Dass er auf achtzig Seiten steht statt auf einer, machte ihn
zum teuersten der drei.

Jetzt aus `betriebshinweis(bereitschaft)`, und die Seite sagt nebenbei auch,
**warum**:

```
Vorschau ohne Bestellmöglichkeit — es fehlen ein vollständiges Impressum,
die Lieferzeit des Lieferanten, ein Zahlungsanbieter, verbindliche
Rechtstexte. Nichts ist gegründet, verkauft oder eingenommen.
```

Der Zweig für den fertigen Shop ist mitgeprüft, obwohl er heute nicht
eintritt. Ohne Probe wäre der Tag seines ersten Laufs der Tag, an dem der
Shop online geht — der denkbar schlechteste Zeitpunkt für einen ungeprüften
Zweig.

## 2. Die Preisbasis, die niemand gemessen hat

Jeder Verkaufspreis dieses Shops ist ein Einkaufspreis plus 25 % Marge. Jeder
dieser Einkaufspreise trägt einen `preisStand` — auf der Artikelseite, in der
Preisliste, im Anfragetext. **Gemessen wurde er nie.**

```
2026-04-22    1 Artikel   132 Tage alt
2026-05-26    6 Artikel    98 Tage
2026-06-09    4 Artikel    84 Tage
2026-06-25    9 Artikel    68 Tage
2026-07-13    4 Artikel    50 Tage
2026-07-27    8 Artikel    36 Tage
2026-08-12    7 Artikel    20 Tage
2026-08-17    7 Artikel    15 Tage
```

Das ist keine Formalie. Hebt der Lieferant an, ist der Einkaufspreis von
gestern die Marge von heute — und zwar nach unten. Der Shop meldete
weiterhin 25 %, Gate 20 rechnete weiterhin mit dem alten Einstand, und die
erste Bestellung trüge einen Ertrag, den es nicht gibt.

> **Ein Preis ohne Alter ist keine Zahl, sondern eine Erinnerung.**

Neu: `src/preisalter.js` und `npm run pruefe-preisalter`.

### Die Grenze ist gesetzt, nicht gemessen — und das steht dabei

`lieferanten.json` führt `preisrhythmus: null`. Aus fünfzehn Rechnungen ist
er nicht ableitbar: Sie zeigen, wann *wir* gekauft haben, nicht, wann *er*
die Liste ändert. 90 Tage sind deshalb eine Setzung, kein Befund — ein
Quartal, weil Baustoffpreislisten üblicherweise so fortgeschrieben werden.
`GRENZE_HERKUNFT` sagt das im Klartext, damit die Zahl austauschbar bleibt.
Die Frage nach dem Preisrhythmus gehört auf dieselbe Liste wie Lieferzeit und
Artikelliste mit EAN-Spalte.

### Erst gröber gedacht, dann nachgemessen

Die erste Fassung eskalierte jeden zu alten Artikel einer **beworbenen
Gruppe**. Der erste Lauf meldete daraufhin:

```
✗ POS-52537  WDVS  Drehstiftdübel PK(100) K 6 40 mm
    98 Tage alt (Grenze 90) — und für diese Gruppe wird geworben
```

Nachgesehen: 2,15 € Einkauf für hundert Stück, kein Keyword zeigt darauf,
und im Referenzwarenkorb steht er nicht. Die Regel hätte die WDVS-Kampagne
wegen eines Dübels angehalten.

> **Eine Regel, die am ersten Tag den falschen trifft, wird am zweiten
> abgeschaltet.**

Maßgeblich ist nicht, in welchem Regal ein Artikel steht, sondern **ob ein
Gebot auf seinem Preis ruht**. Die Verschärfung greift jetzt für die
Positionen der Referenzwarenkörbe der beworbenen Gruppen — `WARENKOERBE` aus
dem Kampagnenwerkzeug selbst, keine zweite Liste daneben.

Befund danach: 11 Artikelpreise tragen ein Gebot, **keiner** über der Grenze.
Sieben sind über der Grenze, auf keinem ruht ein Gebot — genannt, nicht
gesperrt.

Und noch einmal der Palettensatz, eine Datei weiter: `WARENKOERBE` trug
„Eine Palette Mörtel" und „Eine Palette Planziegel". Dieser Text geht als
Spalte `Referenzwarenkorb` nach Google. Berichtigt auf „40 Sack Mörtel" und
„128 Planziegel" — die Mengen, die tatsächlich gerechnet werden — und mit
derselben `GEBINDEAUSSAGEN`-Regel geprüft wie die Anzeigentexte.

## 3. Der Prüfer der Prüfer kannte den neunten nicht

`npm run pruefe-preisalter` war fertig, lief, meldete richtig. Und
`pruefe-pruefer` sagte:

```
8 Prüfer befragt, 0 ohne belastbaren Umfang.
```

Ein vollständiges Ergebnis über eine unvollständige Liste — genau die
Fehlerfamilie, die dieses Werkzeug verhindern soll. **Nicht das Urteil war
falsch, sondern die Menge, über die geurteilt wurde.**

Und niemand hätte es abfangen können: Das Register stand in
`bin/prueferpruefung.mjs`, einem Skript, das beim Laden losläuft und deshalb
von keiner Probe importierbar ist. Dieselbe Bauart wie beim Widerrufsprüfer
zwei Tage davor.

Verlegt nach `src/pruefregister.js`. Die Probe hängt jetzt an
`package.json`: Jeder `pruefe-*`-Befehl muss im Register stehen, und jeder
Registereintrag muss einen Befehl haben. Eine einzige begründete Ausnahme,
namentlich: `pruefe-pruefer` prüft sich nicht selbst, sonst riefe er sich
rekursiv auf.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Betriebshinweis wieder fest verdrahtet | ja |
| Bereitschaft nicht mehr an den Rahmen durchgereicht | ja |
| Fertigzweig auf denselben Satz gestellt wie der offene | ja |
| Eskalation bei Gebot abgeschaltet | ja |
| Fehlender Preisstand als bloßer Verdacht gewertet | ja |
| „Eine Palette Mörtel" zurück in den Referenzkorb | ja |
| `pruefe-preisalter` wieder aus dem Register genommen | ja |

Sieben von sieben. Das ist ungewöhnlich und hat einen Grund: Diesmal habe ich
zu jeder Regel zuerst die Probe geschrieben, die sie auslösen kann, und die
Regel danach.

## Stand

- 1.059 Tests, 0 rot (vorher 1.049)
- 9 Prüfer, alle grün; `pruefe-widerrufe` liest 319 Dateien
- Preisbasis: jüngster Preis 15 Tage, ältester 132, Median 50
- Kampagnen weiterhin **PAUSIERT**

Neu auf der Liste für den Auftraggeber: **der Preisrhythmus des Lieferanten.**
Er entscheidet, ob 90 Tage die richtige Grenze sind oder eine falsche
Sicherheit. Die Frage geht mit derselben Anfrage hinaus wie Lieferzeit und
Artikelliste — und der Versand einer Anfrage an Dritte bleibt Sache des
Auftraggebers.
