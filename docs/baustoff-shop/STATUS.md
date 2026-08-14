# Status und Einstieg

Stand: 2026-08-14. **Dieses Dokument zuerst lesen.** Sechzehn Arbeitsdateien
sind entstanden, mehrere davon korrigieren einander. Hier steht, was gilt.

Veröffentlichter Bericht:
[claude.ai/code/artifact/3d669d15…](https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c)

## Wo das Projekt steht

**Nichts ist gegründet, verkauft oder eingenommen.** Es gibt keinen Umsatz und
keinen Gewinn. Was existiert, ist eine Machbarkeitsanalyse.

Aus zehn geprüften Baustoffnischen und vier Geschäftsmodellen sind **zwei
Kandidaten** übrig, die beide auf derselben inhaltlichen Grundlage aufbauen —
Radonvorsorge und Bausanierung in Österreich.

| | Radon-Shop | Leadvermittlung Bausanierung |
|---|---|---|
| Nötiger Umsatz | 24.200 €/Monat | ~6.000 €/Monat |
| Startkapital | 8.000–12.000 € | < 2.000 € |
| Laufender Aufwand | mittel bis hoch | 4–8 h/Monat |
| Bestandseffekt | keiner | Retainer laufen weiter |
| Zeit bis Ziel | 18–30 Monate | ähnlich, geringeres Kapitalrisiko |

Beide erreichen 3.000 € netto nur, wenn die Annahmen halten. Die schwächsten
sind unten benannt.

## Die Modellwahl ist vertagt — begründet

Drei Bedingungen stehen gegeneinander und sind nicht gleichzeitig zu haben:

| Verzicht auf | Ergebnis |
|---|---|
| Passivität | Radon-Shop bauen — schnellster Weg zu Umsatz, dauerhafter Aufwand |
| Tempo | Inhalte und Leadvermittlung — geringster Kapitaleinsatz, längerer Anlauf |
| Alleinstellung | in ein besetztes Feld eintreten — Wettbewerb über Preis |

**Empfehlung: Inhalte zuerst.** Sie werden für beide Modelle gebraucht, kosten
wenig und halten die Entscheidung offen, bis die Herstellerkonditionen
vorliegen.

In [`phase9-meilensteine-und-abbruch.md`](./phase9-meilensteine-und-abbruch.md)
ist daraus **Gate 4** geworden: Die Stufen 0 bis 2 sind für beide Modelle
identisch, getrennt wird erst bei der Monetarisierung. Die Wahl fällt am Ende
von Stufe 2 anhand des ersten tatsächlichen Geschäfts — sie ist damit keine
offene Blockade mehr.

## Was als Nächstes gebraucht wird

Zwei Freigaben. Der Arbeitsloop kann keine davon selbst auslösen, zusammen
kosten sie unter 200 €.

| Nächster Schritt | Braucht | Vorbereitet in |
|---|---|---|
| Rohmarge belegen (Stufe 0) | Freigabe für E-Mails an sechs Hersteller | `anschreiben-entwuerfe.md` |
| Suchvolumina prüfen (Stufe 1) | Werkzeug für 100–200 €/Monat | `phase7-inhalte-und-funnel.md` |
| Rechtsform, Shop, Inhalte | erst ab Stufe 2, nach den beiden obigen | `phase5-technik.md`, `phase8-*` |

Das Kapitalrisiko bis zur ersten belegten Einnahme liegt im Stufenmodell bei
**2.700 €**, nicht bei den früher genannten 8.000–12.000 €.

## Die Zahlen, auf denen alles ruht

1. **Rohmarge 35 %** — weiterhin **unbelegt**. Kein Hersteller hat Konditionen
   genannt. Unter 32 % fällt die Nische, so in Gate 3 festgelegt. Nur die
   Herstelleranfrage kann das klären.
2. **Suchvolumen** — weiterhin **nicht gemessen**. Die Inhaltslandkarte beruht
   auf Plausibilität.
3. **Materialwert je Gebäude** — ~~reine Schätzung 400–1.500 €~~ inzwischen
   hergeleitet: 1.260–2.955 € für den beschlossenen Warenkorb, Konfidenz
   mittel. Siehe `phase4-sortiment-und-materialwert.md`.

## Dokumente

### Grundlagen
| Datei | Inhalt |
|---|---|
| `PARAMETER.md` | Festgelegte Vorgaben, Umrechnung netto → vor Steuer, Margenschwelle |
| `README.md` | Ursprüngliche Denkgrundlage. Teilweise überholt, Grundrechnungen gültig |
| `master-prompt.md` | Der ausführbare Auftrag in zehn Phasen |

### Analysen
| Datei | Kernaussage |
|---|---|
| `phase1-nischen.md` | Radonvorsorge gewählt; Brandschutz und Betoninstandsetzung verworfen |
| `phase3-unit-economics.md` | Drei Szenarien, Break-even 4.714 €, Zeithorizont 18–30 Monate |
| `phase4-sortiment-und-materialwert.md` | Stückliste, Warenkorb 650 €, 37 Bestellungen; Fracht als vierte Gate-2-Bedingung |
| `phase5-technik.md` | WordPress mit verwaltetem Hosting, weil ohne Neuaufbau erweiterbar |
| `phase7-inhalte-und-funnel.md` | Inhaltslandkarte, 500 € Landesförderung als Zugmagnet |
| `phase8-rechtsform-steuer.md` | GmbH, sobald anderes Einkommen besteht |
| `phase8-compliance.md` | Messung nur über anerkannte Stelle; FAGG-Fristfalle |
| `phase9-meilensteine-und-abbruch.md` | Fünf Stufen mit Kostendeckel, Kennzahlen und vier harten Abbruchregeln |
| `content-und-leadgen.md` | Displaywerbung und Affiliate scheitern an der Reichweite |
| `skalierung-und-passivitaet.md` | Bestandseffekt; digitale Vorlagen fallen durch |
| `segment-arbeitsplatzmessung.md` | Nebenstrecke, kein eigenes Segment |
| `strategie-modellvergleich.md` | Kapitalweg braucht ~900.000 €; enthält überholte Empfehlung |
| `anschreiben-entwuerfe.md` | Zwei Anschreiben, versandfertig, nicht versendet |

### Korrekturen, die im Verlauf nötig waren

Damit niemand einer überholten Aussage folgt:

| Ursprünglich | Korrigiert zu |
|---|---|
| Pflicht nur in 104 Schutzgemeinden | Vorsorgegebiet ist nahezu ganz Österreich; nur die Drainage hängt an den 104 |
| Kein spezialisierter Wettbewerber | RadonTec/radonshop.com existiert, Schwerpunkt aber Sanierung im Bestand |
| Markt 10–25 Mio. € | 4–21 Mio. €; die erste Zahl zählte Wohnungen statt Gebäude |
| Digitale BauKG-Vorlagen empfohlen | Fällt durch Gate 2, Markt besetzt |
| Content-Seite am passivsten und damit erste Wahl | Scheitert an der Reichweite |
| Dosimeter-Verkauf als Funnel-Einstieg | Unzulässig; Vermittlung an anerkannte Messstelle |
| Arbeitsplatz-Messpflicht österreichweit | Nur für spezielle Arbeitsplätze; Frist lief 2022 ab |
| Anlaufverlust 8.000–12.000 € vorab | Gilt nur für „Shop zuerst"; gestuft sind es 2.700 € bis zur ersten Einnahme |
| Modellwahl als offene Blockade | Vertagt auf Ende Stufe 2, weil Stufe 0–2 für beide Modelle gleich sind |
| Ø Warenkorb 450 €, 54 Bestellungen | 650 € und 37 Bestellungen — die Stückliste liegt deutlich höher |
| Materialwert je Gebäude reine Schätzung | Aus Stückliste hergeleitet, amtlich gegengeprüft |

## Zum Arbeitsloop

Der stündliche Arbeitsloop arbeitet ab, was ohne Entscheidung, Freigabe oder
Geld möglich ist — zuletzt das Stufenmodell in
`phase9-meilensteine-und-abbruch.md` und die Stückliste in
`phase4-sortiment-und-materialwert.md`. Findet ein Durchlauf keine solche
Aufgabe mehr, prüft er nur den Stand und endet ohne neue Datei, statt Dokumente
ohne Adressaten zu erzeugen. Sobald eine der beiden Freigaben vorliegt, nimmt er
die eigentliche Arbeit auf.
