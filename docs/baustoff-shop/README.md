# Baustoff-Shop — Brainstorming & Entscheidungsgrundlage

> **Dies ist die Denkgrundlage vom Projektbeginn, kein Stand.** Sie beschreibt
> das Modell, das der Auftraggeber am **22. August 2026 verlassen hat**:
> Streckenhandel mit Herstellerkonditionen und einer Margenuntergrenze. Seither
> gilt die Kalkulation auf **eigene Baumeister-Einkaufspreise mit 25 % Marge**,
> regionale Lieferung in fünf Bezirke, und an die Stelle einer Prozentschwelle
> ist **Gate 20** getreten: keine Bestellung ohne positiven Deckungsbeitrag,
> geprüft in Euro.
>
> Der vorige Vermerk an dieser Stelle nannte „32 % statt 28 %" als gültige
> Margenschwelle. **Auch das ist überholt** — 32 % war Gate 1 und ist seit dem
> 22. August gegenstandslos (`PARAMETER.md`). Berichtigt am 01.09.2026.
>
> **Wo der aktuelle Stand steht:**
>
> | Frage | Datei |
> |---|---|
> | Was gilt? | [`PARAMETER.md`](./PARAMETER.md) — rangiert über allem |
> | Wo steht das Vorhaben? | [`STATUS.md`](./STATUS.md) |
> | Welche Gates? | [`gate-register.md`](./gate-register.md) |
> | Was ist noch offen? | `npm run offenepunkte` |
> | Was kann schiefgehen? | [`die-drei-groessten-risiken.md`](./die-drei-groessten-risiken.md) |
> | Wie geht es weiter? | [`weg-zum-ersten-verkauf-nachgerechnet.md`](./weg-zum-ersten-verkauf-nachgerechnet.md) |
>
> Was in diesem Dokument gültig bleibt, ist die **Denkweise**: die Rechnung
> rückwärts vom Gewinnziel, die Frage nach der Unabhängigkeit von der eigenen
> Person, und die Aufstellung dessen, was sich automatisieren lässt. Die Zahlen
> darin gehören zum abgelösten Modell und werden **nicht nachgezogen** — ein
> Dokument, das man nachträglich glattzieht, ist keine Akte mehr.

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

## 6. Festgelegte Rahmenbedingungen

| Parameter | Festlegung |
|---|---|
| Zielmarkt | **Österreich** |
| Zielgröße | **3.000 € Gewinn vor Steuer pro Monat** |
| Startbudget | **5.000–15.000 €** |
| Logistikmodell | **Reines Streckengeschäft**, kein eigenes Lager |

### 6.1 Die Spannung im Modell — und wie sie aufzulösen ist

Zwei dieser Festlegungen ziehen gegeneinander:

- Das Gewinnziel verlangt **mindestens ~28 % Rohmarge** (Abschnitt 1).
- Reines Streckengeschäft liefert im Baustoffhandel typischerweise **20–30 %** —
  der Lieferant übernimmt Lagerung, Kommissionierung und Versand und behält
  dafür einen Teil der Handelsspanne.

Der Korridor ist also schmal, aber er existiert. Er liegt dort, wo ein
**Hersteller ohne eigene Handelsstruktur** einen guten Händlerrabatt gewährt,
weil er Distribution braucht: kleine und mittlere Spezialhersteller in engen
Segmenten — Lehm- und Kalkbaustoffe, Injektionsharze, Bauwerksabdichtung,
Radonschutz, Sanierungsputze. Genau dort ist auch der Wettbewerb dünn.

Umgekehrt fällt alles weg, was über Großhändler mit etablierter Handelskette
läuft: dort ist die Spanne bereits verteilt.

**Damit wird die zentrale Rechercheaufgabe präzise formulierbar:** Finde
Hersteller im österreichischen Markt, die gleichzeitig (a) Streckengeschäft
anbieten, (b) mindestens 30 % Händlerrabatt auf UVP gewähren und (c) in einem
Segment tätig sind, das Baumärkte nicht abdecken. Erfüllt ein Lieferant nur zwei
der drei Bedingungen, trägt er das Modell nicht.

### 6.2 Zahlen für dieses Szenario

Fixkosten in Österreich, schlank, GmbH bzw. FlexKapG:

```
Shopsystem, Apps, Feed-Tool          100–150 €
Steuerberater inkl. Bilanz           250–350 €
WKO-Grundumlage                        ~15 €
Rechtstexte, Domain, Mail              50–80 €
Betriebshaftpflicht                     ~30 €
Puffer                                  100 €
--------------------------------------------
Σ                                    550–725 €   → Rechnung mit 650 €
```

Benötigter Deckungsbeitrag nach Werbung: 3.650 €. Bei 10 % Werbekostenanteil:

| Rohmarge | Nötiger Netto-Umsatz/Monat | Bestellungen bei Ø 400 € |
|---|---|---|
| 25 % | 24.300 € | 61 |
| 28 % | 20.300 € | 51 |
| 30 % | 18.250 € | 46 |
| 32 % | 16.600 € | 42 |

Der höhere Warenkorbwert von 400 € unterstellt Handwerksbetriebe als
Hauptzielgruppe statt Privatkunden. Das ist im Streckengeschäft die
naheliegende Ausrichtung: größere Bestellmengen, weniger Retouren, höhere
Wiederkaufrate. Der Prompt lässt das prüfen, statt es vorauszusetzen.

### 6.3 Was 3.000 € „vor Steuer" tatsächlich bedeuten

Bei einer Kapitalgesellschaft in Österreich stehen zwischen Unternehmensgewinn
und Privatvermögen zwei Stufen: 23 % Körperschaftsteuer, dann 27,5 %
Kapitalertragsteuer auf die Ausschüttung.

```
3.000 € Gewinn vor Steuer
 −  690 € KöSt (23 %)
 = 2.310 € nach KöSt
 −  635 € KESt (27,5 %) bei Ausschüttung
 = 1.675 € netto beim Gesellschafter
```

Wer 3.000 € **netto** möchte, braucht rund **5.400 € Gewinn vor Steuer** — und
damit je nach Marge 30.000–44.000 € Umsatz im Monat. Das ist eine andere
Größenordnung von Projekt. Der Prompt rechnet mit der getroffenen Festlegung
(3.000 € vor Steuer), weist das Nettoergebnis aber in jedem Szenario mit aus,
damit die Entscheidung jederzeit revidierbar bleibt.

### 6.4 Budgetverwendung ohne Lager

Ohne Warenlager verschiebt sich der Kapitaleinsatz vollständig in Gründung,
Technik und Marketing:

| Position | Ansatz |
|---|---|
| Stammkapital GmbH/FlexKapG (bar einzuzahlen) | 5.000 € — bleibt als Betriebsmittel erhalten |
| Notar, Firmenbuch, Gründungskosten | 1.500–2.500 € |
| Shop-Aufbau, Feed-Anbindung, Rechtstexte | 1.500–3.000 € |
| Werbebudget Anlaufphase (6 Monate) | 3.000–5.000 € |

Das Stammkapital ist kein verbrauchter Aufwand, sondern liegt als Liquidität in
der Firma — bei 15.000 € Budget bleibt der Plan damit finanzierbar, bei 5.000 €
wird es eng und die Gründung als Einzelunternehmen wäre zu prüfen. Das
widerspricht allerdings dem Ziel der persönlichen Trennung, weil dann keine
Haftungstrennung besteht.
