# Der Weg zum ersten Verkauf, nachgerechnet

**1. September 2026.** Nachfolger von `weg-zum-ersten-verkauf.md` (31. August).
Das alte Dokument bleibt stehen und trägt einen Überholt-Vermerk; hier steht,
was ein Tag Nachrechnen daran geändert hat.

Die **Aufzählung** der offenen Punkte steht nicht mehr in einem Dokument,
sondern in `npm run offenepunkte`. Hier steht die **Begründung**: warum die
Punkte in dieser Reihenfolge stehen und was jeder wirtschaftlich bedeutet.
Das kann kein Werkzeug.

## Was sich seit dem 31. August geklärt hat

| | 31.08. | 01.09. |
|---|---|---|
| Domain und Hosting | offen, ~10–20 €/Monat | **entschieden**: bauversand.com bei All-Inkl |
| Landeseiten | nannten Liefergebiet und Fracht **nicht** | Kasten über dem Preisraster, Seitenfuß auf allen 81 Seiten |
| Anzeigentexte | warben mit **Paletten**, die es nicht gibt | auf Belegbares umgeschrieben, `GEBINDEAUSSAGEN` hält es |
| Keywords | 14 von 36 ohne Deckung auf der Landeseite | 33, **alle** gedeckt und in der Shopsuche auffindbar |
| Produktfeed | „nur noch die Kennungen" | drei Pflichtangaben offen: GTIN, Marke, **Bild** |
| Preisbasis | nie gemessen | 22.04. bis 17.08., Median 50 Tage, `pruefe-preisalter` |
| Höchstgebote | Kamin 8,79 €, Dämmung 6,48 € | Kamin 8,22 €, Dämmung 5,91 €, WDVS 4,19 € |

## Die drei Rechnungen, die vorher gefehlt haben

### 1. Der erste Anlauf ist ein Versuch, kein Betrieb

Das Modell braucht **3.350 Besucher im Monat** und gibt sich dafür **4.340 €
Werbebudget** — es schreibt sich damit selbst einen Klickpreis von **1,30 €**
vor, mitten im Marktband von 0,50 bis 2,50 €. Das ist die erste unabhängige
Plausibilitätsprobe des ganzen Zahlenwerks, und sie fällt gut aus.

Der geplante erste Anlauf mit 10 € am Tag sind **300 € im Monat** — ein
Vierzehntel davon. Er kann den ersten Verkauf bringen und die Kaufquote
messen; die Zielgröße von 3.000 € netto trägt er nicht. Das ist keine
Schwäche, aber es gehört gesagt, damit aus einem gelungenen ersten Anlauf
niemand auf einen tragfähigen Betrieb schließt.

### 2. Wann „kein Verkauf" eine Antwort ist

Bei 1,50 € Klickpreis kommen aus 300 € rund 200 Klicks im Monat. Läge die
wahre Kaufquote bei 1 %, wäre ein Monat **ohne jede Bestellung** immer noch
mit 13,4 % zu erwarten. Ein leerer Monat widerlegt nichts.

Vorab festgelegt, damit die Regel nicht ans Ergebnis angepasst wird:

| Stand | Entscheidung |
|---|---|
| bis 299 Klicks ohne Bestellung | weiterlaufen lassen |
| 299 Klicks (≈ 449 €) ohne Bestellung | auf Kamin verengen — unter 1 % trägt WDVS seine Werbekosten nicht |
| 598 Klicks (≈ 897 €) ohne Bestellung | Klickkanal beenden |
| erste Bestellung | die Quote messen und alles neu rechnen |

Gezählt werden **Klicks, nicht Tage**. Ein Tageszähler misst die Geduld.

### 3. Wahrscheinlich bindet der Markt, nicht das Geld

Die Zeiten oben gelten nur, wenn das Budget **ausgegeben werden kann**. Dafür
müssen die 33 Keywords im Liefergebiet zusammen 2.500 bis 6.700 Suchanfragen
im Monat tragen. Bei 1.000 werden aus 45 Tagen bis zur ersten belastbaren
Aussage **sechs Monate**, und 225 € im Monat bleiben liegen.

Ein liegengebliebenes Budget ist kein gespartes Geld, sondern ein Versuch, der
sich hinzieht — und in dieser Zeit veraltet die Preisbasis weiter, an der
empfindlichsten Stelle des Modells (Elastizität der Rohmarge: 2,24).

## Die Reihenfolge, und warum sie so ist

**Erstens: das eine Gespräch mit dem Lieferanten.** Es schließt acht der
fünfzehn offenen Punkte — EAN, Herstellername und Bildverweis aus der
Artikelliste des Kundenkontos, dazu Lieferzeit, Preisrhythmus und
Liefergebiet, und es erfüllt die Weisung, das Sortiment auf hundert Artikel zu
erweitern. Kostet nichts außer einer Freigabe.

**Zweitens: die vier Impressumsangaben.** E-Mail, Telefon, UID,
Gewerbewortlaut. Sie liegen vor und fehlen nur in der Datei. Die **E-Mail** ist
dabei nicht bloß eine Pflichtangabe:

> Der Shop erzeugt Anfragen, keine Verkäufe. Ein Analysewerkzeug trägt er
> bewusst nicht. Gezählt werden kann an genau einer Stelle — im Posteingang.
> **Die E-Mail-Adresse ist das einzige Messgerät des ganzen Versuchs.**

Ohne sie kauft das Klickbudget Klicks und keine Erkenntnis.

**Drittens: die Suchvolumenmessung.** Kostenlos, ohne Freigabe, und sie
entscheidet, ob der Klickkanal überhaupt tragfähig ist. Liste:
`npm run messliste`, 33 Begriffe, Ort = Liefergebiet und nicht Österreich.

**Viertens, und erst dann Geld:** Rechtstexte und Zahlungsanbieter. Ohne
Rechtstexte darf die Seite nicht online, ohne Seite nützt der
Zahlungsanbieter nichts.

**Fünftens: Upload und Repository privat stellen.** Solange das Verzeichnis
öffentlich ist, sind 44 von 46 Einkaufspreisen rekonstruierbar.

**Zuletzt: Werbebudget**, auf Kamin und Dämmung beschränkt, mit der
Abbruchregel von oben.

## Was weiterhin gilt

Die 25 % Marge halten — drei durchgerechnete Warenkörbe, alle 25,0 %, alle mit
positivem Deckungsbeitrag (Gate 20). Die Marge ist nicht das Problem. Was
fehlt, ist der Weg zum Kunden, und daran hat sich in einem Tag nichts
geändert; es ist nur genauer beziffert.

Der **kurze Weg** bleibt offen: Nach den vier Impressumsangaben läuft ein
Vorgang vom Angebot bis zur geprüften Rechnung durch. Das ist kein Ersatz für
das Ziel, sondern die Möglichkeit, die erste Bestellung durchlaufen zu lassen,
während die Kette für den Shopweg entsteht.

## Stand

Nichts an diesem Dokument löst Ausgaben aus. Die Kampagnen stehen auf
**PAUSIERT**.
