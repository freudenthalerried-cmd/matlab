# Phase 5 — Technik und Plattform

Stand: 2026-08-09. Letzte Phase, die sich ohne Modellentscheidung, ohne
Ausgaben und ohne Kontakt zu Dritten bearbeiten lässt.

## Die Anforderung, die alles bestimmt

Beide verbliebenen Modelle beginnen mit denselben Inhalten und trennen sich
erst bei der Monetarisierung. Die Plattform muss deshalb **beide Endzustände
erreichen können, ohne dass später neu aufgebaut wird**. Ein Wechsel der
Plattform nach 18 Monaten Inhaltsarbeit kostet Rankings und Zeit — das ist das
teuerste vermeidbare Risiko in diesem Projekt.

Daraus die Kriterien:

| Kriterium | Warum |
|---|---|
| Inhaltsstärke und SEO | Der Aufbau ist überwiegend Content-Arbeit |
| Rechner integrierbar | Vier geplante Rechner, teils mit eigener Logik |
| Formulare mit Einwilligung | Leadmodell braucht dokumentierte Zustimmung |
| Nachrüstbarer Warenverkauf | Shopmodell, inklusive Nettopreise, UID-Prüfung, Sperrgutversand |
| Geringer Pflegeaufwand | Zielvorgabe wenige Stunden im Monat |
| Laufende Kosten | passen in die kalkulierten 650 € Fixkosten |

## Vergleich

### Shopify

Stark im Verkauf, schwach im Inhalt. Der Blog ist für eine inhaltsgetriebene
Nischenstrategie zu eingeschränkt, die URL-Struktur ist vorgegeben, und
eigene Rechner lassen sich nur umständlich einbauen. Echte B2B-Funktionen —
Nettopreisdarstellung, UID-Prüfung, Kundengruppen — hängen an teureren Tarifen.
Versandlogik für Palettenware und Speditionszustellung ist ein bekannter
Schwachpunkt.

→ Falsche Reihenfolge: Shopify ist eine Verkaufsplattform, an die man Inhalte
anhängt. Hier wird das Gegenteil gebraucht.

### Shopware 6

Die stärkste B2B-Lösung im deutschsprachigen Raum, mit sauberer Abbildung von
Kundengruppen, Netto-Brutto-Logik und komplexen Versandregeln. Dafür höherer
Hosting- und Pflegeaufwand, deutlich steilere Lernkurve und Kosten, die sich
erst bei laufendem Umsatz rechtfertigen.

→ Richtig für den Endzustand des Shopmodells, falsch für einen Start ohne
Umsatz. Vorzeitig eingesetzt bindet es Geld und Aufmerksamkeit, die in Inhalte
gehören.

### Statischer Generator (Astro, Hugo) mit externen Diensten

Technisch die sauberste Variante: beste Ladezeiten, minimale Angriffsfläche,
Rechner als eigener Code ohne Fremdabhängigkeit, Hostingkosten nahe null.
Nachteil: Jede Funktion muss gebaut werden. Formulare, Einwilligungsverwaltung,
später Warenkorb und Zahlung kommen über Fremddienste hinzu — und jede
Erweiterung braucht jemanden, der Code schreibt.

→ Am günstigsten und am wartungsärmsten, aber nur tragfähig, wenn dauerhaft
Entwicklungszeit verfügbar ist. Das widerspricht der Vorgabe.

### WordPress mit verwaltetem Hosting

Inhaltsstark, für SEO ausgereift, Rechner über Plugins oder eigenen Code,
Formulare mit Einwilligungsprotokoll standardmäßig verfügbar. Der
Warenverkauf lässt sich später über WooCommerce **im selben System**
einschalten — ohne Domainwechsel, ohne Verlust der Inhalte und ihrer Rankings.
Rechtstexte für Österreich gibt es fertig und automatisch aktualisiert.

Der bekannte Einwand ist der Pflegeaufwand: Aktualisierungen, Plugin-Konflikte,
Sicherheitslücken. Er lässt sich **kaufen** — verwaltetes Hosting übernimmt
Aktualisierung, Sicherung und Absicherung. Damit wird aus einer laufenden
Verpflichtung eine Kostenposition, und genau das ist im Sinne der Zielvorgabe.

## Empfehlung

**WordPress mit verwaltetem Hosting.**

Der Ausschlag gibt nicht die technische Eleganz, sondern die
Reihenfolgefähigkeit: Es ist die einzige Option, die heute eine reine
Inhaltsseite sein kann und später ohne Neuaufbau zum Shop oder zum Leadportal
wird — je nachdem, wie die offene Entscheidung ausfällt.

Sollte der Warenverkauf später tatsächlich in die Größenordnung von 24.000 €
Monatsumsatz wachsen und WooCommerce an B2B-Grenzen stoßen, ist ein Wechsel auf
Shopware der richtige Zeitpunkt — dann mit Umsatz im Rücken und mit Inhalten,
die den Wechsel überstehen, weil sie auf derselben Domain bleiben.

## Kostengerüst

| Position | Monatlich |
|---|---|
| Verwaltetes Hosting | 20–40 € |
| Domain und Mail | 5–10 € |
| Rechtstexte mit Aktualisierungsdienst | 10–25 € |
| Analyse und SEO-Grundwerkzeug | 0–20 € |
| Backup und Sicherheit (oft im Hosting enthalten) | 0–10 € |
| **Summe Technik** | **35–105 €** |

Belegt sind die Rechtstexte: die IT-Recht Kanzlei bietet AGB samt
Widerrufsbelehrung, Datenschutz und Impressum für Österreich ab 9,90 € im
Monat, der Händlerbund ab 9,90 €, Trusted Shops ab 24,90 €. Die übrigen
Positionen sind marktübliche Spannen und vor der Beauftragung zu prüfen.

Das passt in die in
[`phase3-unit-economics.md`](./phase3-unit-economics.md) angesetzten 100–150 €
für Shopsystem, Apps und Feed-Werkzeug. **Die Fixkostenannahme von 650 € bleibt
gültig.**

Bei den Rechtstexten gilt allerdings, was in
[`phase8-compliance.md`](./phase8-compliance.md) steht: Ein Fehler in der
Rücktrittsbelehrung verlängert die Frist auf zwölf Monate und vierzehn Tage.
Das billigste Paket ist hier nicht automatisch das richtige.

## Was noch offen bleibt

- **Konkrete Hosting-Auswahl** — erst sinnvoll, wenn die Entscheidung steht und
  klar ist, ob ein Shop dazukommt.
- ~~**Datenbasis für die Gebietsabfrage**~~ — geklärt in
  [`phase10-datengrundlage-gebietsabfrage.md`](./phase10-datengrundlage-gebietsabfrage.md).
  Die Rechtsaussage stützt sich auf Anlage 1 der Radonschutzverordnung, also auf
  freien Verordnungstext; die amtliche Potenzialkarte ist nur nachrangig und
  ihre Lizenz allein für diesen Teil noch zu bestätigen. Umsetzung als statische
  Datei ohne Kartendienst.
- **Rechnerentwicklung** — Aufwand je Rechner überschlägig ein bis drei Tage.
  Ob das eingekauft wird, ist eine Ausgabenentscheidung.

## Quellen

- [Rechtssichere AGB für Online-Shops Österreich, IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/Service/agb-oesterreich-online-shop.php)
- [Rechtstexte für Onlineshop: Anbieter, Tipps und Kosten 2026](https://impressum-generator.de/rechtstexte-onlineshop)
- [Rechtstexte mit Abmahnschutz, Handelsverband Österreich](https://www.handelsverband.at/mitglieder-partner/vorteile/rechtstexte-mit-abmahnschutz/)
- [Legal Rechtstexter, Trusted Shops](https://business.trustedshops.de/produkte/legalservices/rechtstexter)
