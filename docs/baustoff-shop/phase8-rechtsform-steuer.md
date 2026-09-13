# Phase 8 (Teil) — Rechtsform und Steuerbelastung Österreich

Stand: 2026-08-09. Vorgezogen aus Phase 8, weil das Ergebnis **unabhängig von
der offenen Modellentscheidung** gilt: Ein Rechtsträger wird für den
Baustoffhandel wie für digitale Fachprodukte gebraucht.

> Keine Steuerberatung. Recherchierter Stand mit Quellenangabe, dazu eigene
> Rechnungen, die als solche gekennzeichnet sind. Vor jeder Umsetzung ist eine
> Freigabe durch einen Steuerberater erforderlich.

## Die Frage

In [`PARAMETER.md`](./PARAMETER.md) wurde die Planungsgröße konservativ über den
Kapitalgesellschaftsweg angesetzt: 3.000 € netto entsprechen 5.374 € Gewinn vor
Steuer. Offen blieb, ob das Einzelunternehmen günstiger ist — und der
Auftraggeber hat bei der Ausgangslage sowohl „alles von null" als auch „Firma
bzw. Gewerbeschein vorhanden" angegeben. Beides zusammen geht nicht; die
Auflösung entscheidet über die Rechnung.

## Steuerliche Grundlagen 2026

**Kapitalgesellschaft (GmbH und FlexKapG)**

Körperschaftsteuer 23 %, danach 27,5 % Kapitalertragsteuer auf die
Ausschüttung. Gesamtbelastung bei Vollausschüttung rund **44,2 %**.

```
Nettofaktor = (1 − 0,23) × (1 − 0,275) = 0,558
```

Stammkapital seit 2024 einheitlich 10.000 €, davon 5.000 € bar einzuzahlen. Die
FlexKapG unterscheidet sich von der GmbH vor allem in der Mindeststammeinlage
je Gesellschafter (1 € statt 70 €) — für eine Ein-Personen-Gründung ist der
Unterschied praktisch bedeutungslos.

**Einkommensteuertarif 2026** (Tarifstufen um 1,733 % angehoben)

| Von | Bis | Grenzsteuersatz |
|---|---|---|
| 0 € | 13.539 € | 0 % |
| 13.539 € | 21.992 € | 20 % |
| 21.992 € | 36.458 € | 30 % |
| 36.458 € | 70.365 € | 40 % |
| 70.365 € | 104.859 € | 48 % |
| 104.859 € | 1.000.000 € | 50 % |
| über 1.000.000 € | | 55 % |

**Einzelunternehmen** zahlt keine KöSt und keine KESt, dafür SVS-Beiträge
(überschlägig 26,83 % der Beitragsgrundlage, gedeckelt durch die
Höchstbeitragsgrundlage) und progressive Einkommensteuer. Die SVS-Beiträge sind
Betriebsausgabe. Zusätzlich steht der **Gewinnfreibetrag** zu: Grundfreibetrag
15 % bis maximal 4.950 €, bei Investitionen erweiterbar. Er senkt sowohl die
Einkommensteuer als auch die SVS-Bemessungsgrundlage. Kapitalgesellschaften
steht er nicht zu.

## Eigene Vergleichsrechnung

Gesucht: der Gewinn, der 3.000 € monatlich netto (36.000 € im Jahr) beim
Auftraggeber ankommen lässt. Näherungsrechnung, Absetzbeträge und
Sonderausgaben nicht berücksichtigt.

### Fall A — Einzelunternehmen ohne weiteres Einkommen

```
Gewinn vor SVS und ESt                          54.000 €
− SVS (≈ 21,15 % des Rohgewinns)                11.421 €
= steuerlicher Gewinn                           42.579 €
− Gewinnfreibetrag (Grundfreibetrag)             4.950 €
= Bemessungsgrundlage                           37.629 €
− Einkommensteuer                                6.499 €
= netto                                         36.080 €  →  3.007 €/Monat
```

**Nötiger Gewinn: rund 4.500 € pro Monat.**

### Fall B — Kapitalgesellschaft, Gewinn wird voll ausgeschüttet

```
Gewinn vor Steuer                               64.500 €
− Körperschaftsteuer 23 %                       14.835 €
− Kapitalertragsteuer 27,5 %                    13.658 €
= netto                                         36.007 €  →  3.001 €/Monat
```

**Nötiger Gewinn: rund 5.374 € pro Monat.**

### Zwischenergebnis

Ohne weiteres Einkommen ist das Einzelunternehmen deutlich günstiger: **4.500 €
statt 5.374 € Monatsgewinn** für dasselbe Nettoergebnis, ein Vorteil von rund
16 %. Ursache sind der progressive Tarif, der bei diesem Gewinnniveau unter der
44,2-%-Pauschale bleibt, und der Gewinnfreibetrag.

## Der Punkt, der die Sache umdreht

Die Rechnung in Fall A unterstellt, dass **kein weiteres Einkommen** vorliegt.
Nach den vorhandenen Anhaltspunkten trifft das nicht zu — der Auftraggeber ist
als Sicherheits- und Gesundheitsschutzkoordinator nach BauKG tätig und hat eine
bestehende Firma bzw. Gewerbeberechtigung angegeben.

Damit ist der Shopgewinn kein Grundeinkommen, sondern **Grenzeinkommen**. Er
stapelt sich auf das bestehende zu versteuernde Einkommen und wird ab 36.458 €
mit 40 %, ab 70.365 € mit 48 % belastet — zuzüglich SVS, solange die
Höchstbeitragsgrundlage nicht erreicht ist.

| Ausgangslage | Effektive Grenzbelastung | Tendenz |
|---|---|---|
| kein weiteres Einkommen | ca. 33 % im Durchschnitt | Einzelunternehmen klar günstiger |
| bestehendes Einkommen im 40-%-Band | ca. 55 % marginal | Kapitalgesellschaft günstiger |
| bestehendes Einkommen im 48-%-Band | ca. 60 % marginal | Kapitalgesellschaft deutlich günstiger |

Der Grund ist strukturell: Die Kapitalgesellschaft besteuert **flach** mit
44,2 %, unabhängig davon, was der Gesellschafter sonst verdient. Sobald das
übrige Einkommen den Grenzsteuersatz über rund 44 % treibt, gewinnt sie. Hinzu
kommt, dass Gewinne, die in der Gesellschaft **thesauriert** statt ausgeschüttet
werden, nur die 23 % Körperschaftsteuer tragen — für die Wiederanlage in
Warenbestand, Shop oder Werbung ist das der mit Abstand günstigste Weg.

## Empfehlung

**Kapitalgesellschaft**, und zwar aus drei zusammenlaufenden Gründen:

1. **Steuerlich**, sobald bestehendes Einkommen vorliegt — was hier der Fall
   zu sein scheint.
2. **Strukturell**, weil das erklärte Projektziel die Trennung von der Person
   ist. Das Einzelunternehmen bietet keine Haftungstrennung; Warenlieferungen,
   Produkthaftung und Speditionsschäden träfen unmittelbar das Privatvermögen.
3. **Für die Reinvestitionsphase**, weil thesaurierte Gewinne mit 23 % statt
   mit dem Grenzsteuersatz belastet werden.

Der Preis dafür sind höhere laufende Kosten — Bilanzierungspflicht statt
Einnahmen-Ausgaben-Rechnung, dadurch ein höheres Steuerberaterhonorar — sowie
5.000 € gebundenes Stammkapital. Beides ist in den 650 € Fixkosten und im
Kapitalbedarf bereits berücksichtigt.

Zwischen GmbH und FlexKapG besteht für eine Ein-Personen-Gründung kein
praktischer Unterschied. Die GmbH ist die eingeführtere Form und im Zweifel
vorzuziehen.

## Offene Punkte für den Steuerberater

1. **Geschäftsführerbezug statt Vollausschüttung.** Ein angemessener Bezug ist
   auf Gesellschaftsebene Betriebsausgabe, unterliegt beim Gesellschafter aber
   Einkommensteuer und GSVG. Die optimale Mischung aus Bezug und Ausschüttung
   ist eine Einzelfallrechnung und kann das Ergebnis spürbar verschieben.
2. **Bestehende Firmenhülle.** Ob die vorhandene Gewerbeberechtigung den
   Baustoffhandel bzw. den Vertrieb digitaler Produkte abdeckt oder eine
   weitere Berechtigung nötig ist. Bei bestehendem Einzelunternehmen ist zu
   klären, ob eine Einbringung sinnvoller ist als eine Neugründung.
3. **Neugründungsförderung (NeuFöG).** Befreiung von bestimmten Gebühren und
   Abgaben bei der Gründung — Anspruch und Umfang sind zu prüfen.
4. **Höchstbeitragsgrundlage SVS.** Ab welchem Einkommen die SVS-Beiträge
   gedeckelt sind; das verändert die Grenzbelastung im oberen Bereich.
5. **Kleinunternehmerregelung.** Bei den angestrebten Umsätzen nicht
   anwendbar; der Vorsteuerabzug ist im B2B ohnehin erwünscht.

## Auswirkung auf die Planungsgrößen

Die bisherige Planung mit 5.374 € Gewinn vor Steuer bleibt gültig und ist
konservativ — sie unterstellt Vollausschüttung ohne Geschäftsführerbezug. Eine
Optimierung über die Bezugsstruktur kann den nötigen Gewinn senken, wird aber
erst nach Freigabe durch den Steuerberater eingerechnet. **Bis dahin keine
Änderung an den Zielgrößen.**

## Quellen

- [Einkommen- und Körperschaftsteuer 2026, WKO](https://www.wko.at/steuern/einkommen-koerperschaftsteuer-2026)
- [Tarifstufen in der Einkommensteuer ab 2026, KPMG Österreich](https://kpmg.com/at/de/media/newsletter/tax-news/2025/09/tn-kmu-tarifstufen-in-der-est-ab-2026.html)
- [Steuertarif und Steuerabsetzbeträge, BMF](https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/steuertarif-steuerabsetzbetraege.html)
- [Tarifstufen, USP.gv.at](https://www.usp.gv.at/themen/steuern-finanzen/einkommensteuer-ueberblick/weitere-informationen-est/tarifstufen.html)
- [Einzelunternehmen oder GmbH 2026, Brandauer Rechtsanwälte](https://brandauer-rechtsanwaelte.at/2026/03/11/einzelunternehmen-oder-gmbh-oesterreich/)
- [GmbH gründen Österreich 2026, everbill](https://www.everbill.com/gmbh-gruendung-oesterreich/)
- [SVS-Beiträge 2026, Team23Tax](https://www.team23tax.at/svs-beitraege-2026-beitragsgrundlage-berechnung-spartipps/)
