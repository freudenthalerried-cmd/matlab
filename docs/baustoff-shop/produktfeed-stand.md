# Der Produktfeed: von „46 veröffentlichbar" zu „nicht einreichbar"

Stand: 2026-08-26. Das Veröffentlichungswerkzeug lief bis heute auf dem
Radon-Platzhalterkatalog und meldete pflichtgemäß null veröffentlichbare
Artikel. Angeschlossen an den echten Katalog meldete es dann **46
veröffentlichbar, 0 zurückgehalten** — und das war die optimistischste
Falschaussage, die dieses Vorhaben bisher produziert hat.

## Was daran falsch war

Zwei Dinge, und beide waren im Bestand schon ausgerechnet.

**Erstens: Die GTIN fehlt bei jedem Artikel.** `produktAuszeichnung()`
prüft das und legt es in einem Feld `fehlend` ab — mit dem Wortlaut
„GTIN/EAN — für Produktfeeds verlangt". `katalogFeed()` hat dieses Feld
**nie gelesen**. Es zählte nur veröffentlichbar gegen zurückgehalten und
warf den Rest weg.

> Das ist dieselbe Fehlerklasse wie fünfmal zuvor: eine Angabe, die
> berechnet und dann verschwiegen wird. Bei der Oberflächenprobe war es
> das Grün für nie gelaufene Szenarien, beim Import der geprüfte
> Platzhalter, beim Auslesewerkzeug der stille Nullfund. Immer meldet
> sich etwas **nicht**, und immer sieht das Ergebnis besser aus als es
> ist.

**Zweitens: Gate 22 lief nicht mit.** Ein Produktfeed ist Werbung, und
Gate 22 sagt, dass nur unter den Listenpreis kommt, was beworben werden
darf. Die drei Beipack-Artikel wären mitgegangen.

## Was jetzt gemeldet wird

```
Katalog: Baustoffkatalog aus den Lieferantenrechnungen
         46 Artikel
Feed:    43 veröffentlichbar, 3 zurückgehalten
  · Verkaufspreis am Listendeckel — Beipack, kein Feedartikel (Gate 22)

43 Einträge sind veröffentlichbar, aber unvollständig:
  · GTIN/EAN — für Produktfeeds verlangt — bei 43 Artikeln
  · Liefergebiet ist nicht beziffert — bei 43 Artikeln
  · Versandkosten — bei 43 Artikeln
Ein Feed mit lückenhaften Einträgen wird abgelehnt, nicht teilweise angenommen.

Einreichbar: nein
```

Der Unterschied zwischen **veröffentlichbar** und **einreichbar** ist der
Kern der Korrektur. Ein Eintrag kann den Weg in den Feed finden und
trotzdem unbrauchbar sein. `einreichbar` ist erst wahr, wenn keine Zeile
eine Lücke trägt — Google nimmt einen Feed nicht teilweise an.

## Drei weitere Änderungen am Werkzeug

**Der echte Katalog ist angeschlossen.** Liegt die Preisdatei vor, wird
der Baustoffkatalog veröffentlicht; fehlt sie, fällt das Werkzeug auf den
Radonkatalog zurück **und sagt welchen es benutzt**. Es tut dann nichts
Falsches — die Platzhaltersperre hält dessen Preise zurück —, aber
niemand soll glauben, er habe den echten Katalog vor sich.

**Der Firmenname kommt aus `data/betreiber.json`**, nicht mehr aus einer
Umgebungsvariablen. Zwei Quellen für denselben Namen sind eine zu viel;
die Entität braucht überall dieselbe Schreibweise.

**Ein Fehler beim Einbau, gefunden vom Test:** Die erste Fassung nahm den
Namen mit `??` aus der Umgebung. Eine *gesetzte, aber leere* Variable
gewinnt gegen `??` — sie ist nicht nullish — und riss die Lücke wieder
auf. Leer heißt hier „nicht gesetzt".

## Was jetzt noch zwischen dem Feed und dem Merchant Center steht

| fehlt | wer es beschafft | Kosten |
|---|---|---|
| **GTIN je Artikel** | Anfrage an Lieferant oder Hersteller — E-Mail an Dritte, **Freigabe nötig** | 0 € |
| Liefergebiet als Bezirksliste | Entscheidung des Auftraggebers | 0 € |
| Versandkosten je Feedeintrag | folgt aus dem Liefergebiet | 0 € |
| Domain und Hosting | Entscheidung, dann Ausgabe | ~19 €/Jahr |
| vier Impressumsangaben | Auftraggeber | 0 € |

**Die GTIN ist der einzige Punkt, der Arbeit ist und nicht nur
Entscheidung.** Die Rechnungen führen Lieferanten-Artikelnummern; das
sind keine Herstellerkennungen. Ohne sie läuft die Suchkampagne, Google
Shopping nicht.

Eine erfundene GTIN wäre hier der teuerste denkbare Fehler: Sie führt
nicht zur Ablehnung des Artikels, sondern zur Sperre des Kontos. Ein
gesperrtes Merchant-Konto ist schwerer wieder freizubekommen als eines,
das nie eröffnet wurde — das stand schon am 22. August in
`google-kampagne.md` und gilt unverändert.

## Testbestand

**566 Testfälle, alle grün.** Zwölf davon neu, darunter die Gegenprobe,
dass die GTIN-Lücke aus den Daten kommt und nicht aus der Prüfung: Mit
gesetzter GTIN ist derselbe Feed einreichbar.

Vier Mutationen gegengeprüft, alle gefangen — Gate 22 entfernen,
`fehlend` wieder wegwerfen, `einreichbar` ohne Lückenprüfung, und
`amListendeckel` auf truthy statt auf `=== true` (dann hätte ein
fehlendes Kennzeichen wie ein gesetztes gewirkt und den Radonkatalog
mitgesperrt).

Zwei bestehende Tests prüften „0 veröffentlichbar, 9 zurückgehalten" —
den Zählerstand des Platzhalterkatalogs. Sie brachen, sobald das Werkzeug
den echten Katalog bekam, obwohl ihre Zusicherung unverletzt war. Auf die
Eigenschaft umgestellt: *einreichbar: nein*, und der Grund dazu.
