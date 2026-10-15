# Achtundzwanzig Entscheidungen ohne Prüfung

**7. September 2026.** Ein Gate ist die stärkste Festlegung dieses Vorhabens.
Es sagt, was gilt; alles Spätere baut darauf auf, und mehrere Gates haben
frühere Arbeit umgeworfen. Achtundzwanzig stehen im Register.

Gehalten hat sie bis heute **nichts**. Gemessen wurde am Bestand genau eine
Zahl über sie: ihre **Anzahl** — `pruefe-schaufenster` vergleicht die 28 in der
PR-Beschreibung mit den 28 im Register. Ob eine der Entscheidungen noch
irgendwo wirkt, hat nie jemand nachgesehen.

> **Eine Entscheidung, die nur im Protokoll steht, ist eine
> Absichtserklärung.**

---

## Der naheliegende Prüfer wäre wertlos gewesen

Der erste Gedanke war, in den Quellen nach „Gate 25" zu suchen. Gemessen
ergibt das: 19 der 28 Gates werden irgendwo namentlich genannt, neun nicht.

Nur sagt diese Zahl nichts. Sie misst, ob jemand die Nummer in einen Kommentar
geschrieben hat — und ein Prüfer, der das misst, belohnt genau das. Man käme
auf 28 von 28, indem man neun Kommentare schreibt, ohne dass eine einzige
Entscheidung besser abgesichert wäre.

Geprüft wird deshalb die **Sache**: die Datei, in der die Entscheidung wirkt,
und ein Muster, das verschwindet, wenn sie zurückgenommen wird.

| Gate | wirkt in | woran man es sieht |
|---|---|---|
| 7 — nur an Unternehmer | `src/kunde.js` | die UID-Prüfziffernrechnung |
| 12 — beide Modelle gleichrangig | `src/gebiet.js` | dass es das Radonmodul noch gibt |
| 19 — Regelbesteuerung von Anfang an | `src/shopkern.js` | der ausgewiesene Satz von 20 % |
| 20 — kein negativer Deckungsbeitrag | `src/bestellung.js` | `darfAutomatischAusgeloestWerden` |
| 21 — Zahlungsziel ≤ Skontofrist | `src/zahlung.js` | `zahlungszielTraegt` |
| 22 — Beipack ohne Anzeige | `bin/kampagne.mjs` | die Beipack-Kennzeichnung |
| 23 — kein Auftrag außerhalb des Gebiets | `src/liefergebiet.js` | die Bezirksfrage |
| 24 — kein Preis „auf Anfrage" | `src/baustoffkatalog.js` | der Ausschlussgrund im Klartext |
| 25 — Mindestbestellwert in der Kasse | `src/shopkern.js` | `mindestbestellwertKunde` |
| 26 — eigener Bestellweg | `bestellung.php` | die Datei selbst |
| 27 — Browserproben im Regellauf | `bin/gesamtlauf.mjs` | der Bezug auf `BROWSERPRUEFER` |
| 28 — keine Abholungszusage | `src/abholung.js` | das Zusagemuster |

Gate 12 ist der ungewöhnlichste Eintrag: Seine Spur ist das **Dasein** eines
Moduls. Solange beide Modelle gleichrangig sind, darf der Radonzweig nicht
stillschweigend abgeräumt werden, weil gerade das andere gebaut wird.

---

## Sechzehn ohne Spur — mit Grund

Die übrigen sechzehn gehören dem Radon- und dem Leadmodell oder regeln das
Verfahren statt das Erzeugnis. Sie stehen mit Begründung in `OHNE_SPUR`,
gruppiert nach dem Abschnitt des Registers, weil der Grund je Abschnitt
derselbe ist — es ist der Zweig, dem das Gate gehört.

Wie überall in diesem Bestand ist die **Ausnahme** das, was aufgeschrieben
werden muss, nicht die Regel. Und die Liste der Gates selbst kommt aus
`gate-register.md`: Ein handgeführtes Verzeichnis hätte dasselbe Ergebnis wie
sein Verfasser.

Gelesen wird dabei nur der Abschnitt „Die achtundzwanzig Gates". Weiter unten
stehen dieselben Nummern noch zweimal — als Auslöser und als Vorbehalt. Wer
das ganze Dokument liest, zählt Gate 5 dreimal.

---

## Der Prüfer hat zuerst seinen eigenen Verfasser berichtigt

Beim ersten Lauf meldete er Gate 20 rot: Ich hatte
`darfAutomatischAusgeloestWerden` in `shopkern.js` vermutet, wo der Name nur in
einem Kommentar steht. Die Funktion wohnt in `bestellung.js`.

Das ist genau der Fall, für den es ihn gibt — nur eine Runde früher als
erwartet: **Die Stelle, an der ich eine Entscheidung vermutete, war nicht die
Stelle, an der sie wirkt.**

Der zweite Fund war feiner. `npm run pruefe-ungerufen` meldete, `gatestand.js`
führe eine ungerufene Ausfuhr namens `vorsorgeauskunft` — weil das Muster für
Gate 12 die Zeile `export function vorsorgeauskunft` **wörtlich** mitführt.

> **Ein Muster, das Quelltext zitiert, ist Quelltext.**

Die Muster tragen seither `export\s+function`. Der Zweck ist derselbe, der
Wortlaut nicht mehr.

Eine Stunde später dieselbe Falle ein drittes Mal, und diesmal im
Gegenprobenregister: Die neue Probe benannte `mindestbestellwertKunde` um, und
der Ersetzungstext `export function untergrenzeFuerDenKorb(` stand damit
wörtlich im Register — `pruefe-ungerufen` meldete prompt eine ungerufene
Ausfuhr, die es nirgends gibt. Die Mutation nimmt jetzt das `export` weg statt
den Namen: kleiner, ehrlicher (eine Entscheidung driftet eher ins Interne, als
dass sie umgetauft wird) — und ohne zitierte Ausfuhr.

---

## Die Gegenprobe

Sie benennt `mindestbestellwertKunde` um. Der Mindestbestellwert rechnet
danach unverändert weiter — kein Testfall fällt, kein Kunde merkt etwas. Nur
Gate 25 ist im Bestand nicht mehr wiederzufinden, und genau das meldet der
Prüfer.
