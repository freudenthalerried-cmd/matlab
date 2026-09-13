# Acht Weisungen ohne Prüfer

**7. September 2026.** Die Runde davor hat die achtundzwanzig Gates gegen den
Bestand gehalten. Ein Gate ist aber **meine** Entscheidung. Die Schicht darüber
sind die **Weisungen des Auftraggebers** — acht seit dem 22. August, und sie
sind der Grund, aus dem dieses Vorhaben so aussieht, wie es aussieht. Zwei
davon haben frühere Arbeit vollständig umgeworfen: die Grundlage der
Kalkulation und die Bedeutung von „25 %".

Gehalten hat sie nichts. `npm run pruefe-auftrag` misst den **Ursprungs**auftrag
vom 9. August — die zwölf Ergebnisse des Master-Prompts —, und dort endet es.
Was der Auftraggeber danach angeordnet hat, stand in einer Tabelle in
`PARAMETER.md` und in keinem Prüfer.

> **Eine Weisung, die nur im Protokoll steht, ist ein Missverständnis mit
> Datum.**

---

## Drei Zustände, nicht zwei

Das ist der Unterschied zum Gate-Register:

1. **erfüllt** — die Weisung wirkt an einer benannten Stelle;
2. **offen und geführt** — sie ist nicht erfüllt, und der Bestand weiß das:
   `npm run offenepunkte` nennt sie;
3. **vergessen** — weder das eine noch das andere.

Der dritte Zustand ist der Grund für den Prüfer. Gemessen sind heute **sieben
erfüllt, eine offen und geführt, null vergessen**.

| Weisung | wirkt in |
|---|---|
| 22.08. Baumeister-Einkaufspreise als Grundlage | `src/baustoffkatalog.js` — der Katalog lädt eine **getrennte** Preisdatei |
| 22.08. Google Shopping, Lieferung regional | `src/maschinenlesbar.js` (Feed), `src/liefergebiet.js` (Bezirk) |
| 25.08. „25 %" ist Marge vom Verkauf | `src/baustoffkatalog.js` — `ZIELMARGE = 0.25` |
| 26.08. Die Firma existiert bereits | `data/betreiber.json` — FN 347938z |
| 28.08. Keine Spanne ausgeben | `src/geheimnis.js` — die Abflussmuster |
| **28.08. Sortiment auf mindestens 100 Artikel** | **offen**, geführt in `src/offenepunkte.js` |
| 31.08. `bauversand.com` verwenden | `data/betreiber.json` |
| 03.09. Auftritt als „Bauversand" | `data/betreiber.json` — `marke` |

Die eine offene ist die interessanteste Zeile der Tabelle. 46 Artikel sind das
Maximum aus fünfzehn Rechnungen; hundert brauchen eine Artikelliste aus dem
Kundenkonto des Lieferanten, und die anzufordern ist freigabepflichtig. Sie ist
deshalb nicht vergessen, sondern **geführt** — und der Prüfer prüft genau das:
Verschwindet sie aus der Liste der offenen Punkte, ohne dass eine Spur
entsteht, meldet er `offener-punkt-verschwunden`. Erfüllt und aufgegeben sehen
sonst gleich aus.

---

## Geprüft wird die Sache, nicht das Datum

Wie bei den Gates: Ein Muster, das nach „28.08." sucht, misst nur, ob jemand
das Datum in einen Kommentar geschrieben hat.

Und weil die Nummern aus der Zeilenfolge der Tabelle kommen, prüft jeder
Eintrag **sein Datum mit**. Wer eine Zeile einfügt, verschiebt alles darunter —
danach beschriebe jeder Eintrag eine andere Weisung, ohne dass es auffiele.

Gelesen wird nur die erste Tabelle des Abschnitts. Darunter steht eine zweite
mit den **unveränderten** Parametern — Zielmarkt, Zielgröße, Startbudget,
Logistik ohne eigenes Lager, Zielgruppe B2B. Sie sind der Boden, nicht die
Änderung, und eine Änderung ist das, was driftet. Gemessen werden sie anderswo:
die Zielgröße in `data/zielgroessen.json` und über `npm run pruefe-leitzahlen`,
und „kein eigenes Warenlager" hütet seit dem 6. September `BETRIEBSAUSSAGEN` in
`src/inhaltspruefung.js` — die Regel, die verhindert, dass eine Seite dem Kunden
einen Vorrat verspricht, den es nicht gibt.

---

## Die Gegenprobe

Sie schreibt `ZIELMARGE = 0.25` als `ZIELMARGE = 1 / 4`. Das **ist** dieselbe
Zahl: Gerechnet wird unverändert, kein Testfall fällt, kein Preis ändert sich.
Nur die Weisung „25 % ist Marge vom Verkauf" ist im Bestand nicht mehr
wiederzufinden — und der Prüfer meldet rot.

Der erste Anlauf schrieb `0.2500` und war zu Recht grün: Das Muster stand noch
da. Auch das gehört zur Regel aus derselben Runde — eine Mutation, die nicht
ankommt, prüft den unveränderten Bestand.
