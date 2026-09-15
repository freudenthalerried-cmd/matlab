# Ein Geschäftsbuch für jedermann

**11. September 2026, zwanzigste Runde.** Diese Runde hat das einzige Stück
angesehen, das auf dem Server laufen wird: `bestellung.php`, das
Empfangsskript des Bestellwegs. Neunzehn Runden lang ging es um Texte, Zahlen
und Register — dieses Skript ist das eine, das offen im Netz steht.

## Die Messung

Ein laufendes PHP, die Konfiguration wie im Bau, und dann einfach gefragt, was
geht:

| Versuch | Antwort | Journal |
|---|---|---|
| 30 Bestellungen hintereinander, dieselbe Adresse | **30 × 200** | **30 Zeilen** |
| Formular von einer fremden Seite (`Content-Type: text/plain`) | **200** | +1 |
| Anfrage mit fremdem `Origin` | **200** | +1 |

Jede einzelne schreibt in die **Vorgangsablage**, die nach § 132 BAO sieben
Jahre zu führen ist, und löst eine Mail an den Betrieb aus.

> **Ein Geschäftsbuch, in das jeder beliebig oft schreiben darf, ist keine
> Ablage, sondern eine Halde.**

Im ganzen Bestand — 446 Arbeitsdateien, 50 Prüfer — kam bis heute kein einziges
Mal das Wort Missbrauch, Flut oder Drossel vor. Das Skript ist sorgfältig gegen
alles gebaut, was eine *einzelne* Bestellung falsch machen kann:
Kopfzeileneinschleusung, doppelte Nummern, eine Ablage im Webverzeichnis, zwei
verschiedene Uhren. Gegen die **zweite** Bestellung war es nicht gebaut.

## Gate 35, selbst entschieden

**Das Empfangsskript nimmt nur von der eigenen Seite an — und höchstens fünf
Bestellungen je Minute.**

Drei Sperren, alle ohne fremde Bibliothek und **ohne eine einzige neue Angabe
über den Besucher**:

1. **Nur `application/json`.** Ein HTML-Formular auf einer fremden Seite kann
   diesen Kopf nicht setzen; ein `fetch` mit ihm löst eine Vorabanfrage aus,
   die hier niemand beantwortet. Der eigene Absendeweg setzt ihn seit jeher —
   die Sperre kostet den ehrlichen Weg nichts.
2. **Kein `Sec-Fetch-Site: cross-site`.** Wo der Browser selbst sagt, dass die
   Anfrage von woanders kommt, wird ihm geglaubt. Wo der Kopf fehlt, wird
   **nicht geraten**: Ältere Browser und Werkzeuge senden ihn nicht, und eine
   Sperre, die den ehrlichen Weg trifft, wird am zweiten Tag abgeschaltet.
3. **Höchstens fünf je Minute, über alle zusammen.**

### Warum nicht je Adresse

Das wäre die naheliegende Grenze und die teurere. Eine Zählung je Adresse
verlangt, die **IP des Besuchers zu speichern** — ein neuer Zweck, eine neue
Angabe auf der Datenschutzseite, ein neues Risiko und eine neue Löschfrist. Für
einen Betrieb mit einer Handvoll Bestellungen je Woche ist das
unverhältnismäßig.

Gezählt wird stattdessen aus den **Zeitstempeln, die das Journal ohnehin
führt** — und zwar in derselben Lesung, die die laufende Nummer vergibt. Ein
zweiter Durchgang über dieselbe Datei wäre ein zweiter Weg zur selben Zahl.

### Was die Sperren nicht können

Eine **langsame, geduldige Flut**: Wer alle zwölf Sekunden eine Bestellung
schickt, bleibt unter der Grenze. Dagegen hülfe nur die Zählung je Adresse oder
ein fremder Dienst — das eine kostet personenbezogene Daten, das andere Geld
und einen Auftragsverarbeiter nach Art. 28 DSGVO. Beides ist eine Entscheidung
des Auftraggebers und steht seit heute als offener Punkt in der Liste.

*Eine Entscheidung, die nur die halbe Gefahr abdeckt, gehört mit ihrer anderen
Hälfte aufgeschrieben — sonst steht sie da, als wäre sie vollständig.*

### Die Absage nennt den Weg zurück

```
429  Gerade gehen ungewöhnlich viele Bestellungen ein. Bitte in einer Minute
     noch einmal abschicken — der Warenkorb bleibt erhalten.
Retry-After: 60
```

Eine Grenze ohne Auskunft ist für den Kunden nicht von einem kaputten Shop zu
unterscheiden.

## Nach der Änderung, dieselben Versuche

| Versuch | Antwort | Journal |
|---|---|---|
| 10 Bestellungen hintereinander | 5 × 200, dann **5 × 429** | **5 Zeilen** |
| Formular von einer fremden Seite | **415** | keine Ablage angelegt |
| `Sec-Fetch-Site: cross-site` | **403** | — |
| `Sec-Fetch-Site: same-origin` (der eigene Weg) | 200 | +1 |

Die letzte Zeile ist die wichtigere Hälfte: Der ehrliche Weg kommt weiterhin
durch. `npm run bestellprobe` — Klick, Empfangsskript, Ablage, Posteingang,
Angebot — trägt unverändert.

## Die Gegenproben

Zwei, und beide lassen die *Rechnung* stehen und schalten nur die
*Entscheidung* ab:

- Die Zählung im Zeitfenster bleibt, nur die Grenze greift nicht mehr — so ist
  sichtbar, dass der Prüfer die Grenze misst und nicht das Rechnen.
- Die Typprüfung fällt weg; alles andere bleibt grün, und nur der Fall der
  fremden Seite fällt um.

Beide meldeten rot an der erwarteten Stelle.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2264 | **2267** |
| Gegenproben | 168 | **170** |
| Gates | 34 | **35** (19 mit Spur im Bestand) |
| offene Punkte | 25 | **26** |

`npm test` grün (2267 bestanden, 3 übersprungen), `npm run pruefe-tests` (2270
Testfälle, 0 mit Verdacht), `npm run bestellprobe` grün, `npm run
pruefe-datenschutz` grün (die Sperren speichern nichts, was die Seite nicht
nennt), `npm run pruefe-gates` (35 Gates), `npm run pruefe-pruefer` (50 Prüfer,
1 abgebrochen — `pruefe-gebinde`).
