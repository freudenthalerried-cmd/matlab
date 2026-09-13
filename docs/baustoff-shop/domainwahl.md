# Domainwahl — Kriterien, Kandidaten, Empfehlung

> **Die Empfehlung dieses Dokuments ist überholt.** Es empfiehlt
> `shop.freudenthaler-bau.at`; der Auftraggeber hat am **31. August 2026**
> **`bauversand.com`** bei All-Inkl gewählt (`bauversand-com.md`). Die Adresse
> steht seither in `data/betreiber.json`, und Seiten, Sitemap, `llms.txt` und
> die finalen URLs der Anzeigen nehmen sie von dort. Das Dokument bleibt
> stehen, weil die Kriterien und die Kandidatenprüfung weiter gelten — die
> **Wahl** gilt nicht mehr.

Stand: 2026-08-25 (überarbeitet). Recherche auf Wunsch des
Auftraggebers. **Nichts registriert** — eine Registrierung ist eine
Ausgabe und braucht seine Freigabe.

## Die Ausgangslage hat sich geändert: die Firma gibt es schon

Die frühere Fassung dieses Dokuments rechnete mit einer Firma, die noch
zu gründen wäre. Das war falsch. Öffentlich auffindbar ist:

| | |
|---|---|
| Firma | **Freudenthaler Bau GmbH** |
| Sitz | Marwach 5, 4312 Ried in der Riedmark |
| Firmenbuch | FN 347938z, Landesgericht Linz |
| Gewerbe | Baumeister, BauKG-Koordination — **und Handel mit Baustoffen als Nebentätigkeit eingetragen** |
| Domain | **`freudenthaler-bau.at` ist bereits in Betrieb** (Baumeisterseite mit Impressum) |

Zwei Korrekturen an früheren Annahmen ergeben sich daraus, und beide
sind erheblich.

**Erstens: Die Region war falsch benannt.** Die alte Kandidatenliste
führte `baustoffe-innviertel.at` als bestes Muster. Ried in der
Riedmark liegt aber im **Mühlviertel**, Bezirk Perg, rund 20 km
nordöstlich von Linz — nicht im Innviertel. Die Verwechslung kommt vom
Ortsnamen (Ried im Innkreis liegt tatsächlich im Innviertel). Eine
Domain, die das Liefergebiet falsch benennt, wäre in genau dem Kanal
teuer, für den sie gedacht ist: KI-Systeme führen Ort, Domain und
Impressum zusammen, und ein Widerspruch zwischen ihnen kostet Vertrauen.

**Zweitens: Der Entitätswert ist schon aufgebaut.** Das
Sichtbarkeitskonzept (`ki-sichtbarkeit-konzept.md`, Vertrauenspunkt 1)
sagt, der Domainname sei zugleich der Name der Entität, unter dem
Systeme Erwähnungen zusammenführen. Diese Entität existiert bereits:
Firmenbuch, WKO-Verzeichnis, Herold, Creditreform, eigene Domain — alle
tragen denselben Namen und dieselbe Adresse. Eine neue, namenlose
Domain würde bei null anfangen und diesen Bestand nicht erben.

## Empfehlung: eine Subdomain der bestehenden Domain

> **`shop.freudenthaler-bau.at`** als Hauptadresse des Shops,
> ergänzt um **eine beschreibende `.at`-Domain als Weiterleitung.**

**Abgelöst am 31. August** durch die Weisung des Auftraggebers:
`bauversand.com`. Was darunter steht, ist die Begründung von damals.

Die Gründe, in der Reihenfolge ihres Gewichts:

1. **Deckungsgleichheit ohne Aufwand.** Firmenbuch, Impressum, UID,
   Bankverbindung und Domain tragen automatisch denselben Namen. Genau
   das ist der teuerste Punkt beim Aufbau einer neuen Entität, und hier
   ist er geschenkt.
2. **Der Baustoffhandel ist bereits als Gewerbe eingetragen.** Der Shop
   ist damit keine neue Firma, sondern ein Vertriebsweg einer
   bestehenden — rechtlich, steuerlich und im Merchant Center der
   einfachere Weg (siehe `google-kampagne.md`: fehlende Firmendaten
   sind Ablehnungsgrund Nr. 1).
3. **Domainalter zählt.** Die bestehende Domain hat Historie; eine
   frische `.at` hat keine. Für Suchmaschinen wie für KI-Systeme ist
   das ein Vertrauenssignal, das sich nicht kaufen lässt.
4. **Der Baumeister ist das Verkaufsargument.** „Baustoffe zum
   Baumeisterpreis, von einem Baumeister" ist eine Aussage, die eine
   anonyme Shop-Domain nicht tragen kann — und sie ist der Kern der
   Positionierung aus `auftrag-baumeisterpreise.md`.

**Der Einwand dagegen**, fair benannt: Eine Subdomain sagt der Maschine
nichts über die Ware. Wer „Baustoffe Mühlviertel liefern" fragt, findet
im Namen `shop.freudenthaler-bau.at` keinen Anhaltspunkt. Deshalb die
Ergänzung. — **Genau dieser Einwand hat sich durchgesetzt:** Die am
31. August entschiedene Adresse `bauversand.com` benennt die Ware selbst und
braucht keine Ergänzung.

## Die Weiterleitungsdomain — geprüfte Kandidaten

Geprüft wurde per DNS-Auflösung. **Das ist kein Verfügbarkeitsnachweis:**
Eine Domain kann registriert sein, ohne aufzulösen. Es ist ein
Negativfilter — was auflöst, ist sicher vergeben; was nicht auflöst,
muss beim Registrar geprüft werden.

| Kandidat | DNS | Bewertung |
|---|---|---|
| **`baustoffe-muehlviertel.at`** | löst nicht auf | **erste Wahl** — Ware und Gebiet, beides richtig benannt, aussprechbar |
| `baustoffe-perg.at` | löst nicht auf | enger (Bezirk statt Region), dafür schärfer bei lokalen Suchen |
| `baustoffe-riedmark.at` | löst nicht auf | sehr eng; „Riedmark" kennt außerhalb der Gegend niemand |
| `muehlviertler-baustoffe.at` | löst nicht auf | gleichwertig zur ersten Wahl, etwas länger am Telefon |
| `freudenthaler-baustoffe.at` | löst nicht auf | guter Rückfallplan, falls die Subdomain nicht gewollt ist |
| `baustoffe-machland.at` | löst nicht auf | Kleinregion südlich Perg, zu eng |
| `baumeister-baustoffe.at` | löst nicht auf | trifft die Positionierung, sagt aber nichts zum Gebiet |
| `zum-baumeisterpreis.at` | löst nicht auf | starkes Versprechen — nur nehmen, wenn es dauerhaft gilt |

**Vergeben und damit ausgeschieden:** `baustoffe-direkt.at`,
`baustoffprofi.at`, `profibaustoffe.at`, `baustoffe24.at`,
`riedmark.at`.

Ein Hinweis zu `shop.freudenthaler-bau.at`: Die Subdomain löst bereits
auf, aber auf dieselbe Adresse wie die Hauptdomain — das ist ein
Platzhalter-Eintrag des Webhosters für alle Subdomains, kein
bestehender Shop. Die Adresse ist frei belegbar. **Belegt wird sie nicht:**
Seit dem 31. August ist `bauversand.com` entschieden.

## Der Wettbewerb im selben Kanal

Zwei österreichische Baustoff-Onlineshops liefern bundesweit und
besetzen die generischen Suchbegriffe:

| Anbieter | Zuschnitt |
|---|---|
| [bauwolf.at](https://www.bauwolf.at/) | ganz Österreich, breites Sortiment |
| [baustoff-shop.at](https://www.baustoff-shop.at/) | eigene Lkw, Kran- und Planenfahrzeuge |
| [benz24.at](https://www.benz24.at/) | Baustoffe und Werkzeug, bundesweit |

Gegen diese drei ist die regionale Lieferung **kein Nachteil, sondern
das einzige Unterscheidungsmerkmal** — und der Grund, warum der
Domainname das Gebiet nennen sollte. Ein weiterer Bundesweit-Shop wäre
der vierte in einer Reihe, in der die anderen drei Jahre Vorsprung
haben.

## Kriterien, unverändert gültig

1. `.at` — der Markt ist Österreich; die Endung ist selbst ein
   Regionssignal.
2. Gattungsbegriff + Region, höchstens ein Bindestrich.
3. Aussprechbar am Telefon, ohne Buchstabieren.
4. Keine Zahl-Suffixe wie „24", solange kein 24-Stunden-Versprechen
   dahintersteht.
5. Keine fremde Marke im Namen (weder Hersteller noch Wettbewerber).
6. **Neu:** Das Gebiet im Namen muss zum tatsächlichen Liefergebiet
   passen. Kein „-oesterreich", solange regional geliefert wird.

## Was zu tun ist

1. **Entscheiden:** Subdomain der bestehenden Domain (Empfehlung) oder
   eigenständige Domain.
2. **`baustoffe-muehlviertel.at` beim Registrar auf Verfügbarkeit
   prüfen** — von hier aus nicht möglich, die Umgebung lässt keine
   WHOIS-Abfragen zu.
3. Registrieren und auf den Shop weiterleisten (301, nicht Frame —
   zwei Adressen, ein Shop; zwei Shops wären der Fehler aus dem
   Sichtbarkeitskonzept).

Kosten zur Einordnung: `.at`-Neuregistrierung etwa 5 € im ersten Jahr,
danach rund 19 € jährlich. Die Größenordnung ist kein Hindernis, die
Entscheidung aber trotzdem eine Ausgabe und damit Sache des
Auftraggebers.

## Quellen

- [Freudenthaler Bau GmbH](https://freudenthaler-bau.at/) — bestehende Firmenseite
- [evi.gv.at, FN 347938z](https://www.evi.gv.at/f/347938z) — Firmenbuchauszug
- [WKO Firmen A–Z](https://firmen.wko.at/freudenthaler-bau-gmbh/ober%C3%B6sterreich/?firmaid=521efb94-5394-4493-8c2c-be7abd9543ae)
- [herold.at](https://www.herold.at/gelbe-seiten/ried-in-der-riedmark/6wmGV/freudenthaler-bau-gmbh/)
