# Die Ablage — und ein Zahlungsweg, der ausgeschlossen gehört

Stand: 2026-08-15. Gehört zum Bauprotokoll
[`umsetzung-shop.md`](./umsetzung-shop.md). Quelltext: `shop/src/ablage.js`,
16 Testfälle.

Bisher entstand alles und verschwand wieder: Die UID-Abfrage erzeugte eine
Belegzeile, der Warenkorb drei Bestellentwürfe, die Kasse eine Rechnung — und
mit dem nächsten Seitenaufruf war nichts davon mehr da. Für ein Funktionsmuster
genügt das. Für ein Geschäft nicht.

## Was das Gesetz von einer Ablage verlangt

Drei Vorschriften, die zusammen die Bauform vorgeben:

| Vorschrift | Verlangt |
|---|---|
| § 11 Abs 1 Z 5 UStG | fortlaufende Rechnungsnummer, **einmalig vergeben** |
| § 131 BAO | Eintragungen so, dass der ursprüngliche Inhalt feststellbar bleibt |
| § 132 BAO | sieben Jahre Aufbewahrung ab Ende des Kalenderjahres |

Daraus folgen zwei Entscheidungen, und beide sind wichtiger, als sie klingen.

## Erstens: Die Nummer entsteht bei der Ausstellung, nicht im Warenkorb

Das ist der Fehler, den man sonst einmal macht. Wer die Rechnungsnummer schon
beim Anlegen des Vorgangs zieht, verbrennt für jeden abgebrochenen Kauf eine —
und erklärt dem Prüfer später, warum zwischen 0007 und 0034 nichts liegt.

`stelleRechnungAus()` verlangt deshalb einen **vollständigen** Beleg. Fehlt eine
Pflichtangabe, gibt es keine Nummer:

```
Keine Rechnungsnummer vergeben. Pflichtangaben fehlen: Name und Anschrift des
liefernden Unternehmers, UID-Nummer des Ausstellers — keine Nummer vergeben
Nummernkreis Rechnungen 2026: 0 vergeben, lückenlos
```

Genau das zeigt das Funktionsmuster heute: Der Musterauftrag legt eine
UID-Abfrage, ein Angebot und drei Lieferantenbestellungen ab — die
Rechnungsnummer bleibt unberührt, weil die Firmendaten fehlen. Die Eins ist
noch frei.

`pruefeNummernkreis()` findet trotzdem jede Lücke, die auf anderem Weg
entsteht. Sie liefert die fehlenden Nummern und **kein Urteil**: Eine Lücke ist
nicht von vornherein ein Fehler, sie ist erklärungsbedürftig.

## Zweitens: Nur ergänzen, nie ändern

§ 131 BAO verlangt, dass der ursprüngliche Inhalt feststellbar bleibt. Die
Einträge werden deshalb beim Ablegen eingefroren; ein Testfall versucht, einen
abgelegten Eintrag zu ändern, und besteht auf dem Fehler.

Eine Korrektur ist ein **neuer** Eintrag. `storniere()` lässt die Rechnung
unangetastet und stellt eine Gutschrift mit eigener Nummer daneben, die auf sie
zeigt. Die Nummer der stornierten Rechnung wird nicht wiederverwendet — eine
wiederverwendete Rechnungsnummer ist genau das, was „einmalig" ausschließt.

## Der Befund: Nachnahme würde eine Registrierkasse auslösen

Beim Nachlesen zur Belegpflicht ist etwas aufgefallen, das den Zahlungsweg
betrifft und deshalb **vor** die Wahl eines Zahlungsanbieters gehört.

Die Registrierkassenpflicht greift, wenn zwei Grenzen zugleich überschritten
sind: mehr als 15.000 € Jahresumsatz **und** mehr als 7.500 € Barumsatz. Die
erste ist bei einer Zielgröße von 290.000 € im Jahr keine Hürde, sondern eine
Selbstverständlichkeit. Die zweite entscheidet.

Und dort liegt die Falle: **Karten- und Bankomatzahlungen zählen als Barumsatz,
wenn sie vor Ort im Beisein des Unternehmers erfolgen.** Dieselbe Kreditkarte
im Web-Checkout ist keiner. Für einen reinen Onlineshop mit Überweisung, Karte
oder Zahlungsdienst gilt deshalb:

| Zahlungsweg | Barumsatz | Folge |
|---|---|---|
| Überweisung, Karte im Web, Zahlungsdienst | nein | keine Registrierkasse |
| **Nachnahme** | **ja** | Grenze in wenigen Bestellungen gerissen |
| Barzahlung bei Übergabe auf der Baustelle | ja | dasselbe |

Bei einem Warenkorb von 650 € netto wären **zwölf Nachnahmesendungen im Jahr**
genug, um die 7.500 € zu überschreiten. Im Baustoffhandel ist Nachnahme keine
exotische Idee — sie ist bei Direktlieferungen an Baustellen durchaus üblich,
und ein Spediteur bietet sie von sich aus an.

**Entscheidung: Nachnahme und Barzahlung sind ausgeschlossen.** Sie stehen
jetzt als ausdrücklicher Hinweis im Punkt 7 der AGB-Gliederung („Zahlung,
Verzug, Eigentumsvorbehalt"), und ein Testfall besteht darauf. Der Preis dafür
ist gering: Im B2B mit Vorkasse oder Rechnung ist Nachnahme ohnehin unüblich.
Der Preis für das Gegenteil wäre eine Registrierkasse samt Signatureinrichtung,
Jahresbeleg und Prüfpflichten — für eine Handvoll Sendungen.

**Kein neues Gate.** Der Punkt begründet keine Entscheidung, die offen war; er
schließt einen Weg, den niemand ausdrücklich gewählt hatte. Er gehört aber in
die Anforderungen an den Zahlungsanbieter, und dort ist er jetzt.

## Was die Ablage noch nicht ist

**Sie hält nichts fest.** Es gibt keinen Server, keine Datei, keine Datenbank —
die Ablage lebt im Arbeitsspeicher und ist mit dem Seitenaufruf wieder weg. Was
hier gebaut ist, ist die **Form** des Vorgangs: welche Einträge entstehen, in
welcher Reihenfolge, mit welchen Nummern, und was nicht mehr geändert werden
darf.

Das ist kein Versäumnis, sondern die Grenze der Umgebung. Sobald es ein Hosting
gibt — 35–105 € im Monat nach `phase5-technik.md`, also freigabepflichtig —
tritt an die Stelle des Arbeitsspeichers eine Datei oder eine Tabelle, und
`alsCsv()` liefert schon heute die Form, in der die Buchhaltung das Journal
übernimmt.

Die Aufbewahrungsfrist rechnet die Ablage mit: Für einen Beleg aus 2026 endet
sie am **31.12.2033**.
