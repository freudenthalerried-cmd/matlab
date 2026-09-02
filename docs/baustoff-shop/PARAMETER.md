# Festgelegte Projektparameter

Stand: **2026-08-28**. Diese Werte sind vom Auftraggeber entschieden und nicht
mehr zur Diskussion gestellt. Änderungen nur mit ausdrücklicher Freigabe.

> **Diese Datei rangiert über dem Gate-Register.** Was hier steht, gilt —
> und deshalb ist es teuer, wenn hier etwas Überholtes steht. Am 28. August
> stand hier noch die harte Untergrenze von 32 % Rohmarge aus dem
> Radon-Modell, während der Auftraggeber seit dem 22. August mit eigenen
> Baumeisterpreisen und 25 % Marge kalkuliert. Ein späterer Lauf hätte das
> laufende Modell nach der eigenen obersten Regel verwerfen müssen.

## Weisungen seit dem 9. August — was jetzt gilt

| Datum | Weisung | Folge |
|---|---|---|
| 22.08. | Eigene **Baumeister-Einkaufspreise** aus den Lieferantenrechnungen als Kalkulationsgrundlage, nicht mehr Herstellerkonditionen | Gate 1 und Gate 2 sind gegenstandslos, siehe unten |
| 22.08. | Vertrieb über **Google Shopping**, Lieferung **regional** statt österreichweit | Liefergebiet: Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land (Gate 23) |
| 25.08. | „25 %" heißt **Marge vom Verkauf**, nicht Zuschlag auf den Einkauf | nötiger Monatsumsatz **43.396 €** statt 67.826 € (Zahlweg EPS; **berichtigt 01.09.**, davor standen hier die Kartenzahlen 45.356 / 72.740 €); `marge-25-prozent.md`, `die-leitzahl-war-vom-falschen-zahlweg.md` |
| 26.08. | Die Firma **existiert bereits**: Freudenthaler Bau GmbH, FN 347938z, Baustoffhandel als Gewerbe | keine Gründung nötig; Domain `freudenthaler-bau.at` in Betrieb |
| 28.08. | **Keine Spanne ausgeben** — die Handelsspanne erscheint nicht auf Kundenseiten | genannt wird stattdessen der Abstand zum Listenpreis; `spanne-nicht-mehr-ausgeben.md` |
| 28.08. | **Sortiment auf mindestens 100 Artikel** erweitern | 46 sind das Maximum aus den Rechnungen; es braucht eine Artikelliste, `hundert-artikel-was-fehlt.md` |

### Was davon die Zahlen weiter unten außer Kraft setzt

- **Die Margenuntergrenze von 32 % gilt nicht mehr.** An ihre Stelle tritt
  **Gate 20**: keine Bestellung ohne positiven Deckungsbeitrag, geprüft in
  Euro je Bestellung statt in Prozent. Gate 1 stammt aus dem Streckenhandel
  mit Herstellerkonditionen und würde das laufende Modell mechanisch
  verwerfen, statt es zu prüfen. Siehe `gate-register.md` und
  `rechnung-zum-zuschlag.md`.
- **Gate 2 (mindestens 35 % Händlerrabatt auf UVP)** ist damit ebenfalls
  gegenstandslos: Es gibt keinen Hersteller im Bezugsweg, sondern einen
  Händler, bei dem der Auftraggeber Kunde ist.
- **Die Umsatzkaskade weiter unten** ist mit 30–45 % Rohmarge gerechnet und
  beschreibt das Radon-Modell. Für das laufende Modell gilt die Rechnung in
  `marge-25-prozent.md`.

Unverändert gültig sind: Zielmarkt, Zielgröße, Zeithorizont, Startbudget,
Logistik ohne eigenes Lager, Zielgruppe B2B, die Freigaberegeln — und die
Feststellung, dass fundiertes Fachwissen die Nischenwahl positiv gewichtet.

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

> **Für das laufende Modell überholt.** Die Tabelle rechnet mit 30–45 %
> Rohmarge im Radon-Streckenhandel. Mit 25 % Marge auf Baumeisterpreise
> lautet die Zahl **43.396 € Monatsumsatz** — `marge-25-prozent.md`. Die
> Kaskade bleibt als Rechenweg stehen.
>
> **Die Zahl darunter, an der alles hängt:** Unter einer Kaufquote von
> **0,77 %** trägt das Modell nicht einmal den billigsten Marktklick von
> 0,50 €. Gerechnet wird mit 2 %. Gemessen ist keine der beiden —
> `die-drei-groessten-risiken.md`.
>
> **Und die Zahl, mit der gemessen wird:** Die Messliste führt
> **32 Begriffe** in drei Anzeigengruppen (`npm run messliste`). Sie müssen im
> Liefergebiet zusammen 2.500 bis 6.700 Suchanfragen je Monat tragen, sonst
> bindet der Markt und nicht das Budget. Bis zum 01.09. waren es 33; dann
> fiel „Kaminkopf Regenhaube“ weg, weil der Shop die Kaminkopfverkleidung
> nicht führt und ein Suchwort kein Werbeversprechen ist.
>
> **Berichtigt am 01.09.:** Hier stand 45.356 €. Das ist die Zahl für
> **Kreditkarte**, gerechnet am 25.08. — zwei Tage bevor Gate 21 EPS und
> Vorkasse entschied. Mit dem entschiedenen Zahlweg sind es 43.396 € und
> 67 statt 70 Bestellungen. Gemessen wird die Leitzahl jetzt von
> `npm run pruefe-schaufenster`; wie sie durchrutschen konnte, steht in
> `die-leitzahl-war-vom-falschen-zahlweg.md`.

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
>
> **Überholt seit 22. August.** Diese Schwelle gehört zum Radon-Modell mit
> Herstellerkonditionen. Für die Kalkulation auf eigene Baumeisterpreise
> gilt **Gate 20** — keine Bestellung ohne positiven Deckungsbeitrag,
> geprüft in Euro statt in Prozent. Siehe oben und `gate-register.md`.

Das verschärft zugleich Gate 2: Gesucht sind Hersteller, die Streckengeschäft
anbieten **und** mindestens 35 % Händlerrabatt auf UVP gewähren, damit nach
Frachtanteil und Zahlungsgebühren noch 32 % übrig bleiben. (Auch dieser Satz
gehört zum Radon-Modell; der laufende Bezugsweg führt über einen Händler.)

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
