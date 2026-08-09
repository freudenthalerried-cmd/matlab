# Baustoff-Shop — Brainstorming & Entscheidungsgrundlage

Ziel des Projekts: ein eigenständiger, weitgehend automatisierter Online-Shop für
Baustoffe, der **mindestens 3.000 € pro Monat** abwirft und operativ ohne den
Gründer läuft.

Dieses Dokument ist die Denkgrundlage. Der ausführbare Auftrag steht in
[`master-prompt.md`](./master-prompt.md).

---

## 1. Die Rechnung, die alles entscheidet

3.000 € ist kein Umsatzziel, sondern ein Gewinnziel. Rückwärts gerechnet:

```
Fixkosten/Monat (schlank, ohne Werbung)
  Shopsystem + Apps + Feed-Tool      70–120 €
  Buchhaltung / Steuerberater       150–250 €
  Rechtstexte, Domain, Mail, Tools    50–80 €
  Betriebshaftpflicht                 ~30 €
  Puffer                              100 €
  ------------------------------------------
  Σ                                 400–580 €  → Rechnung mit 600 €

Benötigter Deckungsbeitrag nach Werbung = 3.000 + 600 = 3.600 €
```

Mit `m` = Rohmarge **nach** Wareneinsatz, Versandkostendifferenz und
Zahlungsgebühren, und 10 % Werbekostenanteil vom Umsatz:

| Rohmarge `m` | Nötiger Netto-Umsatz/Monat | Bestellungen bei Ø 300 € | Sessions bei CR 1,2 % |
|---|---|---|---|
| 20 % (klassischer Baustoffhandel) | **36.000 €** | 120 | 10.000 |
| 25 % | 24.000 € | 80 | 6.700 |
| 30 % | 18.000 € | 60 | 5.000 |
| 40 % (Spezial-/Nischenware) | **12.000 €** | 40 | 3.300 |

**Kernbefund:** Unterhalb von ~30 % Rohmarge ist das Ziel für einen Ein-Personen-
bzw. Ein-Agenten-Betrieb praktisch unerreichbar — der Traffic-Bedarf explodiert
und frisst die Marge über die Klickkosten wieder auf. Das schließt genau die
Produkte aus, an die man bei „Baustoffe" zuerst denkt: Zement, Ziegel, Estrich,
Schüttgut, Standard-Dämmung. Das ist Volumengeschäft mit 8–15 % Marge und
ruinösen Frachtkosten.

Die Nische ist also keine Stilfrage, sondern eine mathematische Bedingung.

---

## 2. Warum „Baustoffe online" hart ist — und wo die Lücken sind

**Die Killer:**

- **Gewicht und Volumen.** Ab 31,5 kg endet der Paketversand, ab da Spedition,
  Palette, Hebebühne, Avisierung. Eine Palette Zement kostet mehr an Fracht als
  an Ware.
- **Preistransparenz.** Standardartikel sind bei Hornbach, Bauhaus, Obi,
  hagebau, benz24, Baustoffshop.de, Kemmler in Sekunden vergleichbar.
- **Retouren.** Angebrochene Säcke, aushärtende Ware, Gefahrstoffe — faktisch
  nicht retournierbar, rechtlich aber oft schon. Das ist ein Margenrisiko.
- **Compliance.** Baustoffe sind kein T-Shirt: CE-Kennzeichnung und
  Leistungserklärung (DoP) nach EU-Bauprodukteverordnung, CLP-Kennzeichnung und
  Sicherheitsdatenblätter bei Bauchemie, teils Gefahrgutvorschriften.

**Die Lücken, die trotzdem funktionieren:**

1. **Leichte Spezial- und Verbrauchsware** — Abdichtungsbänder, Spezialkleber,
   Injektionsharze, Diamantwerkzeug, Verschleißteile, Messtechnik. Paketfähig,
   Wiederkaufrate hoch, 30–45 % Marge.
2. **Beratungsintensive Nischen** — Lehm- und Kalkbaustoffe, Denkmalpflege und
   Sanierung, Bauwerksabdichtung, Radonschutz, Schallschutz, ökologische
   Dämmstoffe. Hier gewinnt Fachinhalt, nicht Preis.
3. **Streckengeschäft (Dropshipping ab Werk)** für die schweren Artikel, die man
   *ergänzend* braucht — kein eigenes Lager, Lieferant versendet direkt. Marge
   niedriger, aber Sortimentsbreite ohne Kapitalbindung.
4. **Rechner als SEO-Motor** — Mörtelbedarf, Estrichmenge, U-Wert,
   Dämmstoffdicke, Fugenmasse. Das sind Suchanfragen mit Kaufabsicht, die kein
   Baumarkt gut bedient.

Die tragfähige Struktur ist meistens eine **Kombination**: enge, margenstarke
Kernnische als Gewinnbringer plus Streckengeschäft als Sortimentsbreite plus
Rechner/Ratgeber als kostenloser Traffic-Kanal.

---

## 3. „Komplett unabhängig von meiner Person" — was geht und was nicht

Das ist der Punkt, an dem der Auftrag präzisiert werden muss, weil er drei sehr
verschiedene Dinge bedeuten kann:

| Lesart | Machbar? | Anmerkung |
|---|---|---|
| **Operativ unabhängig** — läuft ohne deine tägliche Arbeitszeit | **Ja**, das ist das eigentliche Projekt | Automatisierung von Katalog, Preisen, Bestellweiterleitung, Marketing, Support |
| **Markenmäßig unabhängig** — eigene Marke, eigenes Konto, keine Verbindung zu deinen anderen Aktivitäten | **Ja** | Eigene Rechtsform (FlexKapG/GmbH in AT, UG/GmbH in DE) trennt sauber |
| **Anonym** — dein Name taucht nirgends auf | **Nein** | Impressumspflicht (§ 5 ECG in AT, DDG in DE), Firmenbuch/Handelsregister sind öffentlich, Zahlungsdienstleister verlangen KYC des wirtschaftlich Berechtigten |

Der Prompt geht deshalb von den ersten beiden Lesarten aus: eine eigenständige
Firma mit eigener Marke, die dich operativ nicht braucht. Ein Geschäftsführer
muss benannt sein — das ist nicht verhandelbar und auch kein echtes Hindernis
für das Ziel.

---

## 4. Was sich wirklich automatisieren lässt

| Bereich | Automatisierbar | Bleibt menschlich |
|---|---|---|
| Katalog & Stammdaten | Lieferanten-Feeds (CSV/API) synchronisieren, Produkttexte generieren | Sortimentsentscheidungen |
| Preise | Wettbewerbsmonitoring, Regel-Pricing mit Margenuntergrenze | Preisstrategie, Ausreißer-Freigabe |
| Verfügbarkeit | Bestands-Sync, Lieferzeit-Anzeige, Auto-Deaktivierung | Lieferantenwechsel |
| Bestellung | Weiterleitung an Lieferanten (Mail/EDI/API), Tracking-Rückmeldung | Eskalationen, Speditionsschäden |
| Marketing | Feed-Optimierung, Shopping/PMax-Kampagnen, Content, Newsletter | Budgetfreigabe, Markenführung |
| Support | FAQ-Bot, Statusanfragen, Retourenformular | Fachberatung, Reklamationen |
| Zahlen | Tages-KPI-Dashboard, Alarme, Buchhaltungsexport | Steuer, Jahresabschluss |

Ehrliche Einordnung: realistisch sind **80–90 % der wiederkehrenden Vorgänge**
automatisierbar. Die verbleibenden 10–20 % sind genau die Fälle, die Geld kosten,
wenn sie liegen bleiben. Der Prompt muss deshalb Eskalationspfade und
Alarmschwellen mitliefern, nicht nur Happy-Path-Automatisierung.

---

## 5. Skills und Tools, die zum Einsatz kommen

| Zweck | Werkzeug |
|---|---|
| Markt-, Preis-, Lieferantenrecherche | `WebSearch`, `WebFetch` |
| Unit-Economics-Modell, Sortimentsliste, Preisvergleich | `xlsx` |
| Businessplan, Lieferantenanschreiben | `docx` |
| Sicherheitsdatenblätter, Leistungserklärungen, Angebote | `pdf` |
| KPI-Dashboard als teilbare Seite | `Artifact` + `artifact-design` + `dataviz` |
| Live-Daten aus Shopify, Google Ads, Meta, GA4, Klaviyo, Stripe — inkl. Schreibaktionen auf Kampagnen | Windsor.ai MCP |
| Lieferantenkorrespondenz | Gmail MCP |
| Ablage und Zusammenarbeit | Google Drive MCP |
| Wiederkehrendes Preis- und KPI-Monitoring | `CronCreate` / `loop` |
| Eigener wiederverwendbarer Preismonitor-Skill | `skill-creator` |
| Aufgabenverfolgung über Phasen hinweg | `TaskCreate` / `TaskList` |

---

## 6. Offene Entscheidungen

Diese vier Punkte verändern den Prompt inhaltlich und sollten vor dem ersten
Lauf festgelegt werden:

1. **Zielmarkt** — Österreich, Deutschland oder DACH? Bestimmt Recht,
   Lieferanten, Frachtkosten und Wettbewerb.
2. **3.000 € = Gewinn oder Umsatz?** Der Prompt unterstellt Gewinn vor Steuer.
   Bei Umsatz wäre das Projekt trivial und wirtschaftlich sinnlos.
3. **Startbudget und Zeithorizont** — mit 5.000 € Startkapital sieht der Plan
   anders aus als mit 30.000 €. Break-even in 6 oder in 18 Monaten?
4. **Lagerhaltung** — reines Streckengeschäft (kein Lager, weniger Marge) oder
   kleines Eigenlager für die margenstarken Schnelldreher?
