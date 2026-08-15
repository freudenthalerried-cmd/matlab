# Gate-Register

Stand: 2026-08-14. **Maßgeblich für alle Gate-Fragen.** Dreizehn Entscheidungen
sind über die Phasen verteilt in neun Dateien gefallen. Wer wissen will, was
gilt, musste bisher alles lesen. Hier steht es an einer Stelle.

Bei Widerspruch zwischen diesem Register und einem Phasendokument gilt das
Register, weil es die spätere Fassung ist. Bei Widerspruch zwischen Register und
[`PARAMETER.md`](./PARAMETER.md) gilt PARAMETER.md — dort stehen die Vorgaben
des Auftraggebers, die nicht zur Disposition stehen.

## Zwei Anweisungen im Bestand widersprechen einander

[`master-prompt.md`](./master-prompt.md) schreibt vor: „Bei den Gates in Phase 1
und Phase 3 hältst du an und wartest auf mich." Das ist überholt.
`PARAMETER.md` legt fest, dass der Auftraggeber ausschließlich bei E-Mails an
Dritte, Warenkäufen und Ausgaben kontaktiert wird und **alle übrigen
Entscheidungen einschließlich der Gates selbst getroffen und begründet werden**.

> **Es gilt PARAMETER.md.** Der master-prompt ist die ursprüngliche
> Auftragsfassung und als Beleg wertvoll, aber nicht mehr als Handlungsanweisung.

Ebenso überholt: Der master-prompt nennt in Gate 1 eine Margenschwelle von
**28 %**. Sie stammt aus dem Szenario „3.000 € vor Steuer". Seit der Umstellung
auf 3.000 € netto gilt die harte Untergrenze von **32 %**.

## Die dreizehn Gates

### Lieferantenseite — alle drei hängen an einer einzigen Freigabe

| Nr. | Entscheidung | Stand | Festgelegt in |
|---|---|---|---|
| **1** | **Rohmarge unter 32 % → Nische fällt.** Präzisiert: Die Abdichtungsbahn muss rund 38 % tragen, weil das Drainagerohr als Preisprodukt darunter bleibt. | **ungeprüft** | `PARAMETER.md`, `phase2-lieferantenlandkarte.md` |
| **2** | **Vier Bedingungen an jeden Lieferanten:** Streckengeschäft, ≥ 35 % Händlerrabatt auf UVP, kalkulierbare Frachtregelung, strukturierte Produktdaten. „Fracht nach Aufwand" zählt wie eine Absage. | **ungeprüft** | `PARAMETER.md`, `phase4-…`, `phase6-automatisierung.md` |
| **6** | **Ohne strukturierte Produktdaten mindestens eines Kernlieferanten fällt das Shopmodell.** Grund ist nicht der Zeitaufwand, sondern der Bruchpunkt: Ohne Schnittstelle bricht die Bestellübergabe am ersten Tag Abwesenheit. | **ungeprüft** | `phase6-automatisierung.md` |

> **Eine Freigabe entscheidet drei Gates.** Die zwölf Herstelleranfragen aus
> `anschreiben-entwuerfe.md` beantworten Gate 1, 2 und 6 gemeinsam. Das ist der
> Grund, weshalb sie der mit Abstand wirksamste offene Schritt sind — und sie
> kosten nichts.

### Weg und Reihenfolge

| Nr. | Entscheidung | Stand | Festgelegt in |
|---|---|---|---|
| **3** | **Fortsetzen unter zwei Auflagen:** vor jeder Ausgabe schriftliche Konditionen von mindestens zwei Herstellern; Zeithorizont auf 18–30 Monate korrigiert. | entschieden, Auflage offen | `phase3-unit-economics.md` |
| **4** | **Die Modellwahl fällt am Ende von Stufe 2**, nicht davor. Stufe 0 bis 2 sind für Shop und Leadmodell identisch; entschieden wird am ersten tatsächlichen Geschäft. | entschieden | `phase9-meilensteine-und-abbruch.md` |
| **12** | **Beide Modelle sind gleichrangig.** Der Shop gilt nicht mehr als Standardweg mit dem Leadmodell als Auffangnetz — er hängt zu praktisch hundert Prozent am Neubau, der in zehn Jahren um 40 % geschrumpft ist. Gate 4 bleibt unangetastet, nur die Beweislast kehrt sich um. | entschieden | `marktrisiko-neubau.md` |

### Shopmodell

| Nr. | Entscheidung | Stand | Festgelegt in |
|---|---|---|---|
| **5** | **Sortiment auf den mittleren Warenkorb:** radonspezifisches Kernsortiment plus radondichte Abdichtungsbahnen. Keine Mehrspartenhauseinführungen — die sind seit 2017 ohnehin vorgeschrieben und bereits radondicht geprüft. | entschieden | `phase4-sortiment-und-materialwert.md` |
| **7** | **Warenverkauf ausschließlich an Unternehmer.** Damit entfällt § 11 FAGG samt der Zwölfmonatsfalle. Auflage für Stufe 3: Verbraucherbestellungen wirksam ausschließen — Firmendaten, UID, Nettopreise, Unternehmerbestätigung. | entschieden, Auflage offen | `phase6-automatisierung.md` |
| **8** | **Zwölf Herstelleranfragen statt sechs**, in drei Prioritäten, Rohr- und Bahnenseite getrennt. Hauff-Technik gestrichen. Mit sechs Adressaten wäre Gate 1 nur in 58 % der Fälle entscheidbar, mit zwölf in 92 %. | entschieden | `phase2-lieferantenlandkarte.md` |
| **11** | **Gebietsabfrage auf Gemeindeebene**, Rechtsaussage ausschließlich aus Anlage 1 der Radonschutzverordnung — freier Verordnungstext. Potenzialklasse getrennt und nachrangig. Umsetzung als statische Datei ohne Kartendienst. | entschieden | `phase10-datengrundlage-gebietsabfrage.md` |

### Leadmodell

| Nr. | Entscheidung | Stand | Festgelegt in |
|---|---|---|---|
| **9** | **Zweistufiges Erlösmodell:** Stufe A Erlös je Lead, bis der Anfragefluss über drei Monate belegt ist; Stufe B Grundgebühr plus reduzierter Leadpreis. **Verfeinert:** Gebietsexklusivität gilt ab Tag 1 als Struktur, bezahlt wird sie erst ab Stufe B. | entschieden | `phase3b-leadmodell.md`, `partnerangebot-leadvermittlung.md` |
| **10** | **Erfasst wird beim Anstoß der Messung**, nicht nach dem Ergebnis. Die Messung ist kostenlos, es gibt also keine Transaktion und keinen Datensatz. Das Produkt ist der Erinnerungs- und Einordnungsdienst über die drei Monate Messdauer. | entschieden | `phase7b-messstrecke.md` |
| **13** | **Gebietseinheit ist der politische Bezirk**, nicht die Radonschutzgemeinde. Die 104 Gemeinden bestimmen nur die Ausbaufolge, beginnend in Oberösterreich. | entschieden | `partnerangebot-leadvermittlung.md` |

## Was die Gates auslöst

| Auslöser | Entscheidet | Kosten |
|---|---|---|
| Zwölf Herstelleranfragen | Gate 1, 2, 6 — und damit Gate 3 | 0 € |
| Keyword-Werkzeug, ein Monat | keine Gates, aber Stufe 1 | 100–200 € |
| Drei bis fünf Partneranfragen | Preisniveau und Machbarkeit von Gate 9 und 13 | 0 € |
| Betrieb ab Stufe 2 | Gate 4 | ab 2.500 € |

Bemerkenswert daran: **Zwei der drei wirksamsten Auslöser kosten nichts.** Was
sie brauchen, ist die Freigabe, E-Mails an Dritte zu senden — die einzige
Kategorie neben Käufen und Ausgaben, in der nicht selbst entschieden wird.

## Gates, die sich noch ändern können

Kein Gate ist unumstößlich; drei sind erkennbar anfällig:

| Nr. | Wodurch es kippt |
|---|---|
| **5** | Wenn kein Hersteller radondichte Bahnen im Streckengeschäft liefert, bleibt nur das Drainagepaket — und damit ein Warenkorb, der die Marge nicht trägt |
| **9** | Wenn Betriebe der namentlichen Nennung im Einwilligungstext nicht zustimmen, fällt die Bauform der Gebietsexklusivität |
| **12** | Wenn die Neubauzahlen 2026 drehen, verschiebt sich das Gewicht zurück zum Shop — belastbar erst im Frühjahr 2027 |

## Überholte Fassungen, die im Bestand stehen bleiben

Nicht gelöscht, weil der Verlauf zum Ergebnis gehört — aber nicht mehr gültig:

| Datei | Was dort überholt ist |
|---|---|
| `master-prompt.md` | Gate 1 mit 28 %; die Anweisung, bei Gates anzuhalten; die Phasenfolge, die inzwischen um 3b, 7b und mehrere Nebenstrecken erweitert wurde |
| `README.md` | Margenschwelle 28 %; die Zielgröße 3.000 € vor Steuer statt netto |
| `strategie-modellvergleich.md` | die Empfehlung, die vor der Reichweitenprüfung entstand |
| `content-und-leadgen.md` | Leadpreise 50–70 €; korrigiert auf 100–250 € in `phase7-inhalte-und-funnel.md` |
| `phase3-unit-economics.md` | Warenkorb 450 €, 54 Bestellungen, Materialwert 400–1.500 € |
| `phase7-inhalte-und-funnel.md` | Gewichtung der Inhaltsgruppen; nach Gate 12 zuerst Bestand, dann Neubau |

Jede dieser Dateien trägt inzwischen einen Hinweis am Kopf. Der vollständige
Abgleich steht in der Korrekturtabelle in [`STATUS.md`](./STATUS.md).
