# Der Vertragsschluss war unerreichbar

**12. September 2026, nachts. Runde 61.**

## Der Fund

`npm run vorgang -- --stufe bestaetigung --ablegen` schreibt die
Auftragsbestätigung — das Papier, mit dem nach AGB Punkt 2 der **Vertrag**
zustande kommt, Schritt 4 von 9 der Betriebskette. Gemessen, mit der echten
Betreiberdatei:

```
Abbruch: Die Annahme ist nicht frei — eine Auftragsbestätigung schließt den
Vertrag (AGB Punkt 2). Sie entsteht hier nicht gegen die eigene Sperre.
  · Annahme: Bankverbindung unvollständig (kontoinhaber, iban)
```

Das sieht nach einer offenen Angabe des Auftraggebers aus. Es ist aber keine.
Mit einer Betreiberdatei, die Kontoinhaber und IBAN **enthält**, kam dieselbe
Meldung.

Der Grund steht in `bin/vorgang.mjs`:

```js
const betreiber = {
  firma: …, marke: …, strasse: …, plz: …, ort: …, uid: …,
};
```

> **Eine von Hand geschriebene Aufzählung von sechs Feldern — und die
> Bankfelder wurden darin abgeschnitten, bevor sie irgendwo ankommen
> konnten.** Keine Betreiberdatei dieser Welt hätte die Bestätigung
> freigegeben.

Damit war der Vertragsschluss der **einzige Schritt der Kette mit Werkzeug,
den nichts durchspielen konnte** — seit dem 4. September, als die Bestätigung
die Bankverbindung bekam. Acht Tage.

Fünfter Fall derselben Familie: Eine Regel wird an der einen Stelle eingeführt
und gilt an der anderen nicht, weil dort eine Liste steht, die niemand
mitgeführt hat.

## Warum acht Tage niemand darüber stolperte

Es gibt genau einen Testfall, der diese Stufe fährt: *„die
Auftragsbestätigung wird ohne Belegnummer abgelegt"*. Er stand so da:

```js
if (e.code !== 0) {
  assert.equal(existsSync(join(akte, 'journal-2026.jsonl')), false, e.aus);
  return;
}
assert.match(e.aus, /Abgelegt: auftragsbestaetigung/);
```

Der Abbruch kam **immer**, also kehrte der Fall immer zurück. Seine beiden
eigentlichen Zusicherungen sind nie gelaufen.

> **Ein Testfall, der den Fehlschlag abfängt und zurückkehrt, ist grün und
> prüft nichts.** Er trug den Namen dessen, was er nie gesehen hat.

## Die dritte Ursache: der Tag X kannte kein Konto

`OFFENE_ANGABEN` in `src/tagx.js` ist das Register der Angaben, die der
Auftraggeber noch schuldet — mit einem **Probewert**, damit sich alles
Nachgelagerte trotzdem fahren lässt. Es führte sechs Felder. Kontoinhaber und
IBAN waren nicht darunter, obwohl die Bestätigung seit dem 4. September ohne
sie abgewiesen wird.

Deshalb half auch die Betreiberdatei des Tages X nicht: Sie füllte alles außer
dem, woran es hing.

## Was jetzt gilt

| | |
| --- | --- |
| `bin/vorgang.mjs` | liest die Bankfelder aus `BANKFELDER` — dem Register, das auch der Beleg liest |
| `bin/belegpruefung.mjs` | dieselbe Aufzählung stand dort ein zweites Mal; auch sie liest jetzt das Register |
| `OFFENE_ANGABEN` | 6 → **8**: `kontoinhaber` und `iban`, mit Probewert und Grund |
| `data/betreiber.json` | führt beide Felder leer — eine offene Angabe muss als offen dastehen |
| `sichtbarIn` | `['bestaetigung']`: Sie stehen auf dem Papier an den Kunden und auf **keiner** Seite des Shops |
| Der Testfall | fängt nichts mehr ab und verlangt die IBAN auf dem abgelegten Beleg |

Der erste Beleg dieser Art, den dieses Haus je erzeugt hat:

```
Bitte überweisen Sie auf:
  Freudenthaler Bau GmbH (Probe)
  IBAN AT611904300234573201
  Verwendungszweck: AB-2026-0105
```

## Warum die IBAN nicht ins Impressum darf

`sichtbarIn` nennt für die sechs anderen Angaben Impressum, Organisationsblock
oder Oberfläche. Für diese beiden nennt es die Auftragsbestätigung — und das
ist eine Entscheidung, keine Auslassung: **Eine Kontonummer im Impressum ist
eine Einladung an jeden Leser.** Sie gehört auf das Papier an den Kunden, der
zahlen soll, und sonst nirgendwohin.

Damit die Angabe trotzdem gehalten wird, prüft `npm run pruefe-tagx` seit heute
den Abschnitt, in dem sie ankommt: die Bankzeilen der Bestätigung am Tag X.

## Ein Nebenbefund, den ein Prüfer sofort meldete

Weil `bin/vorgang.mjs` jetzt `src/bankverbindung.js` liest, gerät das Modul in
die Reichweite der Kundentext-Werkzeuge — und `npm run pruefe-umschreibung`
wurde prompt rot: `bankverbindung.AT_IBAN` ist ein Muster, das niemand
eingeordnet hatte. Es ist ein **Formmuster** (zwei Buchstaben, achtzehn
Ziffern) und keine Behauptung über den Shop; es steht jetzt so im Register.

Das ist der Prüfer, der seine eigene Reichweite mitführt — genau der Fall, für
den er gebaut wurde.

## Was offenbleibt

Der **Vertragsschluss im Echtbetrieb** hängt weiter an zwei Angaben des
Auftraggebers: Kontoinhaber und IBAN (zwei Zeilen, keine Ausgabe) und die
Lieferzeit von Poschacher. `npm run startklar` führt beide. Neu ist, dass der
Weg dahinter jetzt nachweislich trägt.

Ebenfalls offen, und bewusst: Ein Vorgang, bei dem die Auftragsbestätigung
**fehlt** und trotzdem Ware bestellt oder eine Rechnung gestellt wurde, fällt
in der Akte nicht auf. `vorgangsstand` nimmt den höchsten erreichten Schritt
und sieht nicht nach, ob die davor belegt sind. Das gehört in die nächste
Runde — es wird erst jetzt prüfbar, wo eine Auftragsbestätigung überhaupt
entstehen kann.

## Ausgang

| | |
| --- | --- |
| Schritte der Kette ohne Durchlauf | 1 → **0** |
| `OFFENE_ANGABEN` | 6 → **8** |
| Doppelte Betreiberlisten | 2 → **0** |
| Testfälle | 2.437 (ein grüner Fall prüft jetzt wirklich) |
| Gegenproben | 233 → **235** |

---

**Die Regel dieser Runde:** *Eine von Hand geführte Aufzählung neben einem
Register ist kein Auszug, sondern ein zweiter Bestand — und sie fällt erst
auf, wenn das Register wächst.*
