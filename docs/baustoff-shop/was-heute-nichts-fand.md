# Was heute nichts fand — und trotzdem etwas ergab

**8. September 2026.** Diese Runde begann wie jede: mit Messen. Sechs
Oberflächen, und **keine** hat einen Befund hergegeben.

| gemessen | Ergebnis |
|---|---|
| Suchwörterregister gegen den Katalog | 61 Einträge, keiner nennt eine Artikelnummer, die es nicht gibt; alle 61 tragen einen Grund |
| Lieferantenartikelnummern in der eigenen Suche | 46 von 46 finden ihren Artikel, keine den falschen zuerst |
| Alle 29 geschalteten Keywords | 29 von 29 finden einen Artikel |
| Zahlen auf den Rechtsseiten | zwei — „20 %" (der ausgewiesene Steuersatz, Gate 19) und „30 Tage" als **Name eines nicht angebotenen Zahlwegs** |
| `.htaccess` im Paket | vorhanden, und ihre Kargheit ist seit dem 6. September begründet |
| Zwei Warenkorbrechnungen (`berechneWarenkorb` und `kundenWarenkorb`) | ein Testfall hält sie seit dem 3. September aneinander |

Sechs Fehlanzeigen sind kein Ergebnis, das man aufschreibt. **Drei
Handmessungen daneben schon** — weil sie grün waren und niemand sie
wiederholt.

---

## Der eigentliche Fund: drei Zahlen ohne Werkzeug

Am fertigen Ordner von Hand gemessen:

- **2.650 interne Verweise**, keiner geht ins Leere,
- **zwei Seiten ohne eingehenden Verweis** — `404.html` und `suche.html` —,
  beide mit `noindex` und beide zu Recht,
- **82 verschiedene Titel, 82 Beschreibungen, 82 Überschriften** auf 82 Seiten.

Alles gut, und genau das ist die Lage, in der dieser Bestand sonst einen
Prüfer schreibt:

> **Ein Befund, den kein Werkzeug wiederholt, gilt für den Tag, an dem er
> erhoben wurde.**

Der Bau benennt Seiten um, Gruppen kommen dazu, eine Vorlage ändert sich. Ein
toter Verweis kostet hier mehr als anderswo: Drei der Seiten sind Endziele
bezahlter Anzeigen zu 4,19 € bis 8,22 € je Klick, und der Klick ist bezahlt,
bevor die Fehlerseite erscheint.

---

## `npm run pruefe-verweise`

Drei Regeln, alle beidseitig:

**Kein Verweis ins Leere.** Gezählt werden nur die internen; `https:`,
`mailto:`, `tel:` und reine Anker zählen nicht mit, und der Anker hinter einer
Adresse wird abgeschnitten, bevor die Datei gesucht wird.

**Keine Seite ohne eingehenden Verweis** — außer den zweien, die mit Grund im
Register stehen. Die Fehlerseite zu verlinken hieße, dem Besucher einen Weg auf
eine Sackgasse anzubieten; die Suchseite steht in der Kopfleiste als
**Eingabefeld**, nicht als Verweis, und für Maschinen als `SearchAction` der
Startseite. Ein Verweis auf sich selbst zählt nicht als eingehender.

**Titel, Beschreibung und Überschrift je Seite verschieden.** Zwei Seiten mit
demselben Titel sind in der Trefferliste einer Suchmaschine dieselbe Seite —
und in der Lesezeichenliste des Kunden auch.

Und in die andere Richtung: Steht eine Seite im Register und ist doch verlinkt
oder gar nicht mehr da, meldet der Prüfer das ebenso.

---

## Nachtrag: einmal geschrieben, einmal verloren

Diese Runde stand schon einmal fertig da — am Vormittag, mit demselben
Prüfer und derselben Gegenprobe. Sie war noch nicht committet, als der
Behälter neu aufgesetzt wurde, und damit weg. Dieselbe Ursache, die die
Preisdatei gekostet hat.

Der Unterschied: Diese Arbeit ließ sich in zwanzig Minuten neu schreiben, weil
sie im Gedächtnis dieses Laufs stand. Die Preisdatei nicht.

> **Was nicht committet ist, gibt es nur, solange die Maschine läuft.**

Seither wird zuerst committet und dann der lange Lauf gestartet — nicht
umgekehrt.

---

## Die Gegenprobe

Sie hängt einen Buchstaben an die Warenkorbadresse in der **Kopfleiste**. Der
Verweis steht damit auf jeder der 82 Seiten und führt auf nichts — die
schlimmste Sorte toter Verweis, weil sie überall ist und nirgends auffällt.
