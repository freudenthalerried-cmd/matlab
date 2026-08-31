# Der Weg zum ersten Verkauf — über Shop und Werbung

**31. August 2026.** Weisung des Auftraggebers: *Ziel ist der erste Verkauf
mit 25 % Marge, und er soll über den Shop und über Werbung zustande kommen* —
nicht über einen Anruf.

Das ist eine Festlegung auf den längeren, aber skalierbaren Weg. Dieses
Dokument sagt, was dafür fehlt, was es kostet und in welcher Reihenfolge es
gebraucht wird. Alle Zahlen sind gerechnet, nicht geschätzt; wo eine Annahme
drinsteckt, steht sie dabei.

## Die 25 % sind nicht das Problem

Zuerst die Entwarnung. Drei durchgerechnete Warenkörbe:

| Bestellung | Warenwert | Rohmarge | Deckungsbeitrag |
|---|---|---|---|
| 1× Putztüranschlusspaket | 458,33 € | **25,0 %** | +86,08 € |
| 2× Dübelkarton (Kleinstauftrag) | 132,70 € | **25,0 %** | +33,18 € |
| Kaminsatz komplett | 1.756,10 € | **25,0 %** | +410,53 € |

Die Frachtpauschale von 75,50 € geht als eigene Zeile an den Kunden und
schmälert die Marge nicht. Was sie schmälert, sind Palette und Folierung —
28,50 € bei Sperrgut, aus der Marge zu tragen. Selbst der Kleinstauftrag
bleibt damit im Plus (Gate 20 erfüllt).

**Die Marge hält. Was fehlt, ist der Weg zum Kunden.**

## Was Werbung je Verkauf kosten darf

`npm run kampagne` rechnet für jede Anzeigengruppe einen Warenkorb durch und
leitet daraus das Höchstgebot je Klick ab. Daraus lässt sich die eigentliche
Frage beantworten: **Trägt der Deckungsbeitrag die Werbekosten?**

Werbekosten je Verkauf = Klickpreis ÷ Umsatzquote.

| Umsatzquote | Klickpreis | je Verkauf | Kamin (411 €) | Dämmung (295 €) | WDVS (209 €) | Mörtel (93 €) | Kanal (69 €) | Mauerwerk (62 €) |
|---|---|---|---|---|---|---|---|---|
| 0,5 % | 0,50 € | 100 € | **+311** | **+195** | **+109** | −7 | −31 | −38 |
| 0,5 % | 1,00 € | 200 € | **+211** | **+95** | +9 | −107 | −131 | −138 |
| 0,5 % | 1,50 € | 300 € | **+111** | −5 | −91 | −207 | −231 | −238 |
| 1,0 % | 1,00 € | 100 € | **+311** | **+195** | **+109** | −7 | −31 | −38 |
| 2,0 % | 1,00 € | 50 € | **+361** | **+245** | **+159** | +43 | +19 | +12 |

> **Die Umsatzquote ist eine Annahme, keine Messung.** Sie steht seit dem
> 15. August als offener Punkt: Das Keyword-Werkzeug misst Suchvolumen, nicht
> die Quote. Deshalb ist die Tabelle über drei Quoten gespannt statt auf eine
> gerechnet.

**Der Befund ist trotzdem eindeutig:** Kamin und Dämmung tragen die Werbung in
*jedem* dieser Fälle. WDVS in fast allen. Kanal, Mauerwerk und Mörtel nur bei
günstigem Klickpreis **und** guter Quote — bei 0,5 % Quote verlieren sie in
jedem Fall Geld.

### Entschieden: Der erste Anlauf läuft nur auf Kamin und Dämmung

Begründung: Für den *ersten* Verkauf zählt nicht die Breite des Sortiments,
sondern dass der erste Euro Werbebudget nicht in eine Gruppe fließt, die
selbst im günstigen Fall knapp ist. Kamin trägt noch bei 0,5 % Quote und
1,50 € Klickpreis — das ist der pessimistischste Fall der Tabelle. Die
schwachen Gruppen kommen dazu, sobald eine **gemessene** Quote vorliegt; bis
dahin wären sie eine Wette auf die Annahme.

Die Kampagnendateien stehen unverändert auf **PAUSIERT**. Das Schalten löst
Ausgaben aus und bleibt Sache des Auftraggebers.

## Was zwischen hier und der ersten Anzeige steht

Sieben Glieder, und keines lässt sich überspringen. Der Reihe nach:

| # | Was | Wer | Kostet |
|---|---|---|---|
| 1 | **UID-Nummer** in `data/betreiber.json` | Auftraggeber | nichts, liegt vor |
| 2 | **E-Mail, Telefon, Gewerbewortlaut** — Rest des Impressums | Auftraggeber | nichts, liegt vor |
| 3 | **Lieferzeit von Poschacher** in Werktagen | Auftraggeber (ein Anruf) | nichts |
| 4 | **Domain und Hosting** | Entscheidung | ~10–20 €/Monat |
| 5 | **Rechtstexte** (AGB, Widerruf, Datenschutz), verbindlicher Wortlaut | Rechtstexteanbieter | ~100–300 € einmalig oder Abo |
| 6 | **Zahlungsanbieter** wählen und anbinden | Entscheidung + Vertrag | Gebühr je Bestellung |
| 7 | **GTIN/EAN für 43 Artikel** | Auftraggeber/Lieferant | nichts, aber Arbeit |

1–3 sind Angaben, die es schon gibt; sie fehlen nur in der Datei. 4–6 kosten
Geld und sind Entscheidungen. **7 ist das neue Glied, und es ist das
unangenehmste.**

## Das GTIN-Problem

```
Feed:    43 veröffentlichbar, 3 zurückgehalten
43 Einträge sind veröffentlichbar, aber unvollständig:
  · GTIN/EAN — für Produktfeeds verlangt — bei 43 Artikeln
Einreichbar: nein
```

Ein Produktfeed ohne Artikelkennungen wird abgelehnt — und zwar **ganz**, nicht
teilweise. Ohne Feed keine Shopping-Anzeigen. Die Kennungen stehen auf den
Gebinden und in den Datenblättern der Hersteller (Baumit, Capatect/Synthesa,
Schiedel); Poschacher führt sie in seinen Stammdaten.

Damit hängt der Werbeweg an derselben Auskunft wie die Sortimentserweiterung:
**an einer Artikelliste aus dem Poschacher-Kundenkonto.** Wer die Liste mit
EAN-Spalte ausleitet, löst zwei Punkte auf einmal — die hundert Artikel und
die Feed-Fähigkeit. `npm run artikelliste` liest sie bereits.

> Nachtrag zur Ehrlichkeit: Google lässt für Artikel ohne herstellerseitige
> Kennung `identifier_exists: no` zu. Bei Markenware im Baustoffhandel greift
> diese Ausnahme regelmäßig **nicht** — die Ware hat eine EAN. Sie zu
> verschweigen wäre keine Lösung, sondern ein Ablehnungsgrund mehr.

## Der kürzeste ehrliche Weg

1. **Heute, ohne Kosten:** UID, E-Mail, Telefon, Gewerbewortlaut in
   `data/betreiber.json`; Lieferzeit bei Poschacher erfragen. Danach läuft ein
   Vorgang vom Angebot bis zur geprüften Rechnung durch.
2. **Ein Anruf mehr:** Artikelliste mit EAN-Spalte aus dem Kundenkonto. Löst
   Feed und Sortiment gemeinsam.
3. **Erst dann Geld:** Domain, Rechtstexte, Zahlungsanbieter. In dieser
   Reihenfolge — ohne Rechtstexte darf die Seite nicht online, ohne Seite
   nützt der Zahlungsanbieter nichts.
4. **Zuletzt Werbebudget**, auf Kamin und Dämmung beschränkt, mit einem
   Tagesbudget, das einen Fehlversuch verkraftet.

Zwischen Schritt 1 und Schritt 4 liegt kein Verkauf über den Shop — aber nach
Schritt 1 ist ein Verkauf **auf dem kurzen Weg** möglich, mit denselben 25 %
und denselben geprüften Belegen. Das ist kein Ersatz für das Ziel, sondern die
Möglichkeit, die erste Bestellung durchlaufen zu lassen, während die Kette für
den Shopweg entsteht. Wer den ersten Vorgang einmal von Hand durchgespielt
hat, findet die Lücken darin billiger als der erste bezahlte Klick.

## Stand

Nichts an dieser Datei löst Ausgaben aus. Die Kampagnen bleiben pausiert.
