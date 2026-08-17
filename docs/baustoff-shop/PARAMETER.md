# Festgelegte Projektparameter

Stand: 2026-08-09. Diese Werte sind vom Auftraggeber entschieden und nicht mehr
zur Diskussion gestellt. Änderungen nur mit ausdrücklicher Freigabe.

| Parameter | Wert |
|---|---|
| Zielmarkt | Österreich |
| **Zielgröße** | **3.000 € netto beim Gesellschafter pro Monat** |
| Zeithorizont | So schnell wie möglich; höherer Werbekostenanteil akzeptiert |
| Startbudget | 5.000–15.000 € (Planung mit 10.000 €) |
| Logistik | Reines Streckengeschäft, kein eigenes Warenlager |
| Zielgruppe | Vorrangig Handwerksbetriebe (B2B) |
| Fachwissen Auftraggeber | Fundiert — Beruf/Ausbildung im Bau |
| Ausgangslage | Firma bzw. Gewerbeschein vorhanden, sonst alles von null |

## Veröffentlichte Artefakte

| Artefakt | URL |
|---|---|
| Statusbericht, Stand 16.08.2026 | https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c |
| Shop-Funktionsmuster | https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8 |

Quelldatei des Berichts: `bericht-radon.html` im Repo neben dieser Datei.
**Wichtig für spätere Läufe:** Zum Aktualisieren dieses Berichts die obige URL
als `url` an das Artifact-Tool übergeben — sonst entsteht eine neue Adresse und
der Auftraggeber hat zwei widersprüchliche Stände.

## Freigaberegeln

Der Auftraggeber wird ab jetzt **nur** noch kontaktiert bei:

- Versand von E-Mails an Dritte
- Kauf von Waren
- Entstehen von Ausgaben jeglicher Art

Alle übrigen Entscheidungen, einschließlich der Gates in Phase 1 und Phase 3,
trifft der Agent selbst und dokumentiert die Begründung nachvollziehbar.

## Konsequenz für das Zahlenmodell

Das Ziel ist auf **netto** umgestellt. Damit verschiebt sich die gesamte
Rechnung nach oben.

### Weg zum Nettoergebnis

**Kapitalgesellschaft (GmbH / FlexKapG), Gewinn wird ausgeschüttet:**

```
netto = Gewinn vor Steuer × (1 − 0,23) × (1 − 0,275) = Gewinn × 0,558
3.000 € netto  →  5.374 € Gewinn vor Steuer pro Monat  (64.500 €/Jahr)
```

**Einzelunternehmen:** Kein KöSt/KESt, stattdessen SVS-Beiträge und progressive
Einkommensteuer. Überschlägig sind für 36.000 € netto im Jahr rund
57.000–62.000 € Gewinn erforderlich — also dieselbe Größenordnung.

**Planungsgröße: rund 5.400 € Gewinn vor Steuer pro Monat.**

Welcher Weg günstiger ist, hängt von der Höhe des Gewinns, einem etwaigen
Geschäftsführerbezug und der bereits vorhandenen Firmenhülle ab. Das ist in
Phase 8 zu klären und vom Steuerberater freizugeben. Für die Planung wird der
konservativere Kapitalgesellschaftsweg unterstellt.

### Neue Umsatzkaskade

Fixkosten 650 €/Monat, benötigter Deckungsbeitrag nach Werbung 6.050 €.

> **Rechnerisch wären es 6.024 €** (5.374 + 650). Die Kaskade unten ist
> durchgehend aus 6.050 € gerechnet und damit rund 0,4 % zu hoch — in die
> sichere Richtung. Sie bleibt unverändert; Begründung in
> [`zahlenpruefung.md`](./zahlenpruefung.md). Wer die Kaskade neu aufsetzt,
> beginnt bei 6.024 €.
Bei 10 % Werbekostenanteil vom Umsatz:

| Rohmarge | Nötiger Netto-Umsatz/Monat | Bestellungen bei Ø 400 € |
|---|---|---|
| 30 % | 30.250 € | 76 |
| 32 % | 27.500 € | 69 |
| 35 % | 24.200 € | 61 |
| 40 % | 20.170 € | 50 |
| 45 % | 17.290 € | 43 |

### Angehobene Margenschwelle

Die ursprüngliche Untergrenze von 28 % Rohmarge stammt aus dem
3.000-€-vor-Steuer-Szenario. Sie trägt das Nettoziel nicht mehr: bei 28 %
wären 33.600 € Umsatz im Monat nötig, im reinen Streckengeschäft ohne Lager
und ohne Bestandskundenstamm im ersten Jahr unrealistisch.

> **Neue harte Untergrenze: 32 % Rohmarge.** Nischen darunter werden verworfen.

Das verschärft zugleich Gate 2: Gesucht sind Hersteller, die Streckengeschäft
anbieten **und** mindestens 35 % Händlerrabatt auf UVP gewähren, damit nach
Frachtanteil und Zahlungsgebühren noch 32 % übrig bleiben.

### Was das Fachwissen ändert

Fundiertes Bau-Fachwissen öffnet genau die Segmente, die diese Marge tragen:
beratungsintensive Sanierungs- und Spezialanwendungen, in denen der
Wettbewerbsvorteil die fachliche Auskunft ist und nicht der Preis. Die
Nischenauswahl in Phase 1 gewichtet Beratungsintensität deshalb **positiv**,
nicht negativ — entgegen der ursprünglichen Bewertungslogik.

Gleichzeitig entsteht eine Abhängigkeit vom Auftraggeber, die dem
Automatisierungsziel widerspricht. Auflösung: Fachwissen fließt einmalig in
Ratgeberinhalte, Auswahlhilfen und Rechner ein und wird damit skalierbar,
statt in laufende Einzelberatung.
