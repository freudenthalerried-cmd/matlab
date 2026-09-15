# Über hundert Artikel liegen bereit — es fehlen die Preise, sonst nichts

**28. August 2026.** Weisung: *„auch produkte erweitern mind 100 stk"*. Der
Katalog hat 46 Artikel, und aus den fünfzehn Lieferantenrechnungen ist mehr
nicht herauszuholen: 70 Positionen, 53 Artikelnummern, davon sieben
Zuschläge. Dieser Lauf hat deshalb die zweite Quelle systematisch
durchgesehen — das Konditionenblatt des Lagerhauses Eferding.

## Der Befund in einer Zeile

> **127 Artikel des Shop-Sortiments stehen dort mit Artikelnummer, Einheit
> und Gebinde — und keiner davon mit einem Preis.**

## Was auf den Seiten steht

Acht Seiten sind inzwischen gelesen, fünf davon in diesem Lauf Zeile für
Zeile abgetippt. Die Spalte, die im Kopf „Rabatt/Preis" heißt, trägt
**Prozentsätze**. Auf Seite 1 steht, worauf sie sich beziehen: *„Preise
basierend auf aktuell gültige Werkspreisliste."* Diese Werkspreisliste liegt
nicht vor.

| Seite | Gruppe | Positionen | brauchbar |
|---|---|---|---|
| 53 | Isover Dämmsysteme | 25 | **25** — die vollständigste Seite, jede Zeile mit Nummer, Einheit und Gebinde |
| 26 | Kanalrohre (Pipelife, Ostendorf) | 35 | **35** |
| 22 | Schachtringe (Pimiskern) | 32 | **32** |
| 4 | Quarzolith Sackware | 30 | **19** (11 Siloware: Anfrage) |
| 57 | Vollwärmeschutz (Baumit) | 29 | **16** (13 EPS-Stärken: Anfrage) |
| 51 | EPS-W 25, Trittschall, Styrodur | 30 | **0** — jede Zeile Anfrage |
| 18 | Schiedel Kaminsysteme | 16 | **0** — siehe unten |
| 25 | Kabelschutz, Drainage, PE-Rohr | 19 | 0 — nicht unser Sortiment |

**Seite 18 ist die lehrreichste.** Sie sieht aus wie eine Artikelliste und
ist keine: Die Zeilen nennen Systemfamilien mit Größenbereichen — „EZ von 12
bis 40 cm" — ohne Artikelnummer, ohne Einheit, ohne Gebinde. Selbst mit einer
Werkspreisliste entstünde daraus kein Katalogeintrag; die Artikel stünden dann
in der Liste des Herstellers, nicht hier.

> **Ein Konditionenblatt ist kein Katalog.** Es beantwortet „zu welchem Satz",
> nicht „was gibt es".

## Was daraus folgt

Die Artikelbasis für weit über hundert Artikel **ist vorhanden**. Was fehlt,
ist genau eine Sorte Angabe, und sie ist benennbar:

1. **Die Werkspreislisten**, auf die sich die Sätze beziehen — Pipelife oder
   Ostendorf (Kanalrohre), Pimiskern (Schachtringe), Quarzolith, Isover,
   Baumit. Fünf Hersteller für 127 Artikel.
2. **Oder die Artikelpreisliste von Poschacher** mit Netto-Einkaufspreisen.
   Ein Ansprechpartner, eine Datei, sofort rechenbar — und dieselbe Quelle,
   aus der die heutigen 46 Artikel stammen.

Beides braucht eine E-Mail an einen Dritten und damit das Wort des
Auftraggebers. Ohne Preis bleibt jeder dieser Artikel draußen: **Gate 24 lässt
keinen Artikel in den Shop, den der Shop nicht rechnen kann** — und diese
Regel jetzt zu lockern, um auf hundert zu kommen, wäre der teuerste
Kurzschluss, den dieses Vorhaben machen könnte.

## Was ohne Rückfrage passiert ist

`preise/lagerhaus-artikel.json` — das Register, vertraulich und
gitignoriert, weil Rabattsätze die Verhandlungsposition des Auftraggebers
sind. Es enthält:

- 41 Artikel Zeile für Zeile abgetippt (Isover 25, Baumit 16)
- je Seite: Positionszahl, wie viele davon einen Satz tragen, wie viele
  „Anfrage" lauten, und der Befund im Klartext
- ausdrücklich **keine Preise** — und den Satz, warum daraus auch keine
  entstehen können

Sobald eine Preisliste da ist, ist das die Datei, gegen die sie gelegt wird.

## Nachtrag desselben Tages: Poschacher hat einen Webshop

Der Auftraggeber hat mitten im Lauf darauf hingewiesen. Nachgesehen und
bestätigt: **`shop.poschacher-baustoffe.at`** existiert
([Fundstelle](https://shop.poschacher-baustoffe.at/), gefunden über die
Websuche, Stand 28.08.2026).

Das ändert den Weg zu den Preisen grundlegend — es braucht **keine E-Mail an
einen Dritten**:

> Der Auftraggeber ist dort Kunde. Was er in seinem eigenen Konto sieht, sind
> **seine** Preise. Das ist seine Datenlage, nicht die eines Dritten.

**Aus dieser Umgebung ist die Seite nicht erreichbar** — `403 am
Ausgangsproxy`, auf beiden Wegen geprüft (Abruf und Websuche-Abruf), wie
zuvor schon `baumit.at`, `isover.at`, `schiedel.com` und `synthesa.at`. Ich
kann den Shop also nicht selbst lesen; die Ausleitung muss vom Auftraggeber
kommen.

**Was gebraucht wird, in einer Zeile:** eine Ausgabe der Artikelliste aus dem
Kundenkonto als CSV oder Excel, mit diesen Spalten:

| Spalte | Inhalt |
|---|---|
| `sku` | Artikelnummer des Lieferanten |
| `bezeichnung` | Artikelbezeichnung |
| `einheit` | STK, M2, SCK, KG … |
| `ek_netto` | **sein** Preis, netto |
| `uvp_netto` | Listenpreis, falls der Shop ihn zeigt (für den Preisvorteil) |
| `gruppe` | Warengruppe, falls vorhanden |

`ek_netto` allein genügt für den Verkauf. `uvp_netto` ist das, woraus der
Shop „25 % unter dem Listenpreis" rechnet — ohne diese Spalte fällt der
Preisvorteil weg, der Artikel bleibt aber verkäuflich.

## Die ehrliche Zwischenbilanz

| | |
|---|---|
| Artikel im Shop, bepreist und verkäuflich | **46** |
| Artikel identifiziert, aber ohne Preis | **127** |
| Fehlende Angabe | Einkaufspreise — aus dem Poschacher-Webshop oder als Liste |
| Wer sie beschaffen kann | der Auftraggeber, aus seinem eigenen Kundenkonto |

Die Zahl 100 ist erreichbar. Sie ist keine Frage der Arbeit an diesem Shop
mehr, sondern eine Frage einer Ausleitung — und seit dem Hinweis auf den
Webshop nicht einmal mehr eine Frage einer E-Mail.
