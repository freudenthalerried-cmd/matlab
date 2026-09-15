# Derselbe Schnitt an drei weiteren Stellen

**13. September 2026. Runde 66.**

Die Runde davor fand einen Geschäftsfall, den der Jahreswechsel in zwei
Vorgänge zerschnitt, und zog die Trennlinie:

> **Was an der Datei hängt, bleibt beim Jahr. Was am Geschäftsfall hängt,
> gehört zum Vorgang.**

Diese Runde hat gefragt, wo sonst nach Jahr gesucht wird, wo nach
Geschäftsfall zu suchen wäre. Gefunden: drei Stellen, alle gemessen.

## Erstens: der Posteingang schlägt Bearbeitetes zur Arbeit vor

```
Posteingang — 1 Bestellungen, 1 angebotsreif, 1 davon noch offen
  ✓ B-2026-0500  2026-12-20  Musterbau GmbH (Perg)
Zum Weiterarbeiten:
  npm run posteingang -- --nummer B-2026-0500 …
```

Die Bestellung war längst bearbeitet — Angebot und Auftragsbestätigung lagen
im Journal **2027**, gesucht wurde in 2026, dem Jahr des Posteingangs.

> **Das ist der Fund vom 12. September, wiederhergestellt durch den
> Jahreswechsel.** Wer der Empfehlung folgt, macht ein zweites Angebot über
> dieselbe Ware, unter einer zweiten Vorgangsnummer, an denselben Kunden —
> und zwar in den Tagen, in denen ohnehin niemand in der Routine ist.

## Zweitens: die Gutschrift fand ihre Rechnung nicht

`storniere` suchte die aufzuhebende Rechnung in **der Ablage, in die sie
schreibt**. Eine Rechnung vom 20. Dezember, im Jänner aufgehoben:

```
Error: Kein Eintrag mit der Nummer RE-2026-0007
    at storniere (src/ablage.js:341)
```

Eine ungefangene Ausnahme — und sie kam, **nachdem** die Durchschrift der
Gutschrift schon geschrieben war. Das Papier lag in der Akte, die Zeile
darüber fehlte.

## Drittens, und das ist die schwerere Richtung

`istStorniert` sah ein Storno aus einem anderen Jahr nicht.

> **Zweimal aufheben heißt einmal zu viel gutschreiben** — mit umgekehrtem
> Vorzeichen in der Umsatzsteuervoranmeldung.

Gemessen, nach der Berichtigung:

```
=== Gutschrift im Jänner ===
Abgelegt: Gutschrift GS-2027-0001 zu RE-2026-0007, laufende Nummer 1.
=== zweites Storno ===
Abbruch: RE-2026-0007 ist bereits storniert.
```

## Was dabei ausdrücklich beim Jahr bleibt

`storniere` bekam zwei Angaben dazu — `bezug` und `bekannt` —, und beides
ändert nur, **wo gesucht** wird. Gezogen wird die Nummer weiterhin aus dem
Kreis des Jahres, in das geschrieben wird: § 11 Abs 1 Z 5 UStG verlangt
fortlaufend und einmalig, und der Kreis beginnt je Geschäftsjahr neu. Die
Gutschrift zu einer Dezemberrechnung heißt deshalb `GS-2027-0001` und nicht
`GS-2026-0008`.

Dieselbe Trennung beim Vermerk und beim Posteingang: gesucht über alle
Journale, geschrieben ins laufende.

## Die vollständige Durchsicht

Jede Stelle, die einen Journalnamen aus einem Jahr baut, angesehen:

| Stelle | |
| --- | --- |
| `bin/posteingang.mjs` — Akte lesen | **berichtigt** |
| `bin/vorgang.mjs` — Gutschrift, Bezug suchen | **berichtigt** |
| `src/ablage.js` — `storniere`, `istStorniert` | **berichtigt** |
| `bin/vorgang.mjs` — Nummernkreise ziehen (Rechnung, Gutschrift) | bleibt: § 11 UStG, je Jahr |
| `bin/vorgang.mjs` — Journalzeile schreiben (fünf Stufen) | bleibt: der Beleg entsteht in seinem Jahr |
| `bin/buchhaltung.mjs` — Auszug je Periode | bleibt: der Auszug **ist** die Periode |
| `bin/bestellprobe.mjs` — Journal des Shops | bleibt: der Eingang hat sein Jahr |
| `bin/ablagepruefung.mjs` — Durchschriften, Auszüge | bleibt: Belegordner und `lfd` sind jahresweise |

## Ausgang

| | |
| --- | --- |
| Stellen mit falschem Schnitt | 3 → **0** |
| `storniere` | sucht über `bekannt`, zieht im laufenden Jahr |
| Testfälle | 2.449 → **2.451** |
| Gegenproben | 243 → **245** |

---

**Die Regel dieser Runde:** *Ein Fund ist erst dann abgearbeitet, wenn man
gesucht hat, wo derselbe Schnitt sonst noch verläuft — und die Stellen, die
richtig bleiben, aufgeschrieben sind.*
