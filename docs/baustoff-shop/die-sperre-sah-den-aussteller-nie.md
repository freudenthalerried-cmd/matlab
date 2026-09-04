# Die Sperre sah den Aussteller nie

*5. September 2026, nach Mitternacht. Runde 120.*

## Der Fund, und er ist selbst gemacht

In `src/beleg.js` steht seit dem 30. August eine Regel, ausformuliert als
Kommentar über der Lieferzeitsperre:

> *Die Auftragsbestätigung ist die Annahme: Mit ihr kommt der Vertrag
> zustande, und sie nennt den Termin. Wer einen Termin zusagt, den er nicht
> kennt, hat ihn erfunden. **Das Angebot darf die Lücke tragen und sichtbar
> machen, die Bestätigung nicht.***

Gestern Abend habe ich eine Lücke in genau dieses Dokument gesetzt. Ohne
Konto trägt die Auftragsbestätigung seither:

```
Bitte überweisen Sie auf:
  [[ Kontoinhaber und IBAN — FEHLT ]]
  Verwendungszweck: AB-2026-0007
```

Das ist richtig für das Papier — eine Lücke, die man sieht, wird gefüllt —
und ein Verstoß gegen die Regel drei Zeilen weiter oben, sobald die
Bestätigung hinausgeht.

> **Die Regel stand da, und die Sperre hat den Verstoß nicht bemerkt — weil
> sie den Aussteller nie zu sehen bekam.**

`darfBestaetigtWerden(warenkorb, auftrag)` prüfte den Warenkorb und den
Auftrag: Unternehmerstatus, UID, Mindestbestellwert, Platzhalterpreise,
Lieferzeit. **Wer das Papier ausstellt, war nie ihr Gegenstand.** Der
Betreiber lag in `vorgangFuehren` griffbereit daneben und wurde nicht
weitergereicht.

Was daraus folgt, ist kein Schönheitsfehler. Nach Punkt 2 der eigenen AGB
kommt mit der Bestätigung der Vertrag zustande, und nach Gate 21 wird beim
Hersteller nichts bestellt, bevor gezahlt ist. Eine Bestätigung ohne Konto
bindet den Kunden, verlangt sofortige Zahlung — und nennt ihm keinen Weg
dazu. **Er kann die Vorbedingung des Geschäfts nicht erfüllen, an das er
gebunden ist.**

Die Sperre nennt jetzt den Grund:

```
· Annahme: Bankverbindung unvollständig (kontoinhaber, iban) —
  die Bestätigung verlangt Zahlung sofort und nennt kein Konto
```

Der Grundwert des neuen Arguments ist `{}` und damit die vorsichtige
Richtung: Wer ihn vergisst, bekommt einen Befund und keine stille Erlaubnis.

## Der zweite Fund, und er ist der größere

Beim Nachziehen der Proben fiel auf, wie sie gebaut sind. `darfBestaetigtWerden`
hat sechs Sperrgründe und sechs Testfälle, und jeder prüft, dass **sein**
Grund kommt. Die übliche Zeile lautet:

```js
assert.ok(!f.gruende.some((g) => /Lieferzeit/.test(g)));
```

Sie hält fest, dass ein bestimmter Grund fehlt — und schweigt über die fünf
anderen.

> **Keine einzige Probe hat je geprüft, dass die Sperre bei vollständiger
> Lage aufmacht.**

Eine Sperre, von der niemand gezeigt hat, dass sie aufgeht, könnte jeden
Auftrag abweisen, ohne dass eine Probe es merkt. Der Shop nähme Bestellungen
entgegen und könnte keine einzige annehmen. Genau davor warnt der Kommentar
in `startklar.js` seit dem 30. August — *für einen einzigen Grund*, die
Lieferzeit. Die Kette aus allen sechs hat niemand geprüft.

Dasselbe galt für `darfRechnungGestelltWerden`. Nur `darfAutomatisch-
AusgeloestWerden` hatte einen echten grünen Fall, in
`test/gate20-freigabe.test.js`.

Neu sind deshalb vier Proben:

* **die vollständige Lage** — alles beantwortet, `erlaubt: true` und
  `gruende: []`. Nicht „kein Lieferzeitgrund", sondern **kein Grund**.
* **dieselbe Lage ohne Konto** — genau ein Grund, und er nennt beide
  fehlenden Felder. Ohne diese Probe bliebe die erste auch dann grün, wenn
  die Bankprüfung ersatzlos verschwände.
* **ohne Betreiber** — der Grundwert sperrt.
* **die Rechnung mit vollständiger Lage** — dasselbe für die zweite Sperre.

## Die Gegenprobe

`bestaetigung-ohne-konto` macht die Sperre wieder blind: Die Bedingung wird
auf `false` gesetzt, die Bestätigung darf wieder ohne Konto hinaus. Der
Testlauf muss rot werden und das Konto nennen.

```
✓ test — Eine Auftragsbestätigung, die hinausdarf, ohne ein Konto zu nennen
    shop/src/beleg.js (ersetzen)
    meldete rot an der erwarteten Stelle
```

**50 Gegenproben für 30 Prüfer**, zwei weitere mit begründetem Verzicht.

## Die Lehre

Zwei, und die zweite wiegt schwerer.

> **Eine Prüfung prüft, was sie in die Hand bekommt.** `darfBestaetigtWerden`
> war nicht nachlässig geschrieben — sie war vollständig für das, was ihr
> übergeben wurde. Die Lücke lag in der Signatur, und eine Signatur sieht
> niemand an, wenn er nach Fehlern sucht.

> **Eine Zusicherung der Form „dieser eine Grund kommt nicht" ist kein
> grüner Fall.** Sechs solcher Zeilen ergeben keine einzige Aussage darüber,
> ob die Sperre je aufgeht. Wer eine Sperre baut, schuldet beide Richtungen:
> den Fall, in dem sie hält, und den Fall, in dem sie nachgibt.
