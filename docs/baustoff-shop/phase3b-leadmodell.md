# Phase 3b — Das Leadmodell, durchgerechnet

Stand: 2026-08-14. Nachholbedarf, der durch die letzten beiden Phasen dringend
geworden ist.

## Warum das jetzt fällig ist

Das Leadmodell ist inzwischen der **Auffangweg für drei verschiedene
Gate-Ausgänge**:

| Fällt | Weil | Dann gilt |
|---|---|---|
| Gate 1 / Gate 3 | Rohmarge unter 32 % | Shop scheidet aus |
| Gate 6 | kein Hersteller liefert strukturierte Produktdaten | Shop scheidet an der Automatisierungsvorgabe aus |
| Gate 2 | kein Streckengeschäft oder keine Frachtregelung | Shop scheidet aus |

Drei von acht Gates führen in dasselbe Ausweichmodell — und dieses Modell ist
bislang eine Skizze: „~6.000 €/Monat, Retainer laufen weiter" in
[`STATUS.md`](./STATUS.md), 100–250 € je Lead in
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md). Das ist zu
wenig für einen Weg, der mit erheblicher Wahrscheinlichkeit der tatsächliche
wird.

## Gewerberechtlicher Rahmen

Werbeagentur zählt in Österreich zu den **freien Gewerben**; ebenso Adressverlage
und Direktmarketingunternehmen. Freie Gewerbe verlangen keinen
Befähigungsnachweis, sondern nur die Anmeldung bei der
Bezirksverwaltungsbehörde oder online über GISA beziehungsweise das USP. Die
**Anmeldung ist kostenlos**, und das Gewerbe darf ab dem Tag der Anmeldung
ausgeübt werden.

Zwei Punkte, die dabei leicht schiefgehen:

1. **Der Gewerbeumfang richtet sich nach dem Wortlaut der Anmeldung.** Der
   Wortlaut ist also mit Bedacht zu wählen — „Werbeagentur" und
   „Direktmarketing" decken die Vermittlung von Interessentendaten an
   Partnerbetriebe ab, eine zu eng gefasste Formulierung tut es womöglich nicht.
2. **Nicht zu verwechseln mit Arbeitsvermittlung.** Das ist zwar seit 17.
   Oktober 2017 ebenfalls ein freies Gewerbe, betrifft aber die Vermittlung von
   Arbeitskräften, steht unter gewerbebehördlicher Aufsicht und muss für
   Arbeitsuchende unentgeltlich sein. Mit der Vermittlung von
   Sanierungsanfragen an Betriebe hat das nichts zu tun. Wer den falschen
   Gewerbewortlaut anmeldet, holt sich Auflagen ins Haus, die ihn nicht
   betreffen.

Der Wortlaut ist vor der Anmeldung mit der WKO oder der Gewerbebehörde
abzustimmen. Kostenlos, aber nicht beliebig.

**Befund: Kein gewerberechtliches Hindernis, keine Anlaufkosten.** Gegenüber
dem Shop entfällt damit nichts, weil auch das Handelsgewerbe frei ist — der
Unterschied liegt nicht hier.

## Unit Economics

Zielgröße unverändert aus [`PARAMETER.md`](./PARAMETER.md): **5.374 € Gewinn
vor Steuer im Monat**.

### Fixkosten

| Position | Monatlich |
|---|---|
| Hosting, Domain, Mail | 25–50 € |
| Rechtstexte mit Aktualisierung | 10–25 € |
| Formular-, Einwilligungs- und Kontaktverwaltung | 20–60 € |
| Buchhaltung und Steuerberatung anteilig | 100–200 € |
| Analyse, Rankingüberwachung | 0–20 € |
| **Summe** | **155–355 €, Planwert 350 €** |

Gegenüber den 650 € des Shopmodells fehlen: Shopsystem, Zahlungsanbieter,
Produktdatenpflege, B2B-Rechtstexte, Versandabwicklung. Das ist kein
Rundungsunterschied, sondern fast die Hälfte.

**Benötigter Monatserlös: 5.374 + 350 = 5.724 €.**

### Variante A — Erlös je Lead

Bei 100–250 € je qualifiziertem Sanierungslead, abgeleitet aus Auftragswerten
von 3.000–15.000 € in
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md):

| Erlös je Lead | Leads/Monat | Sessions bei 3 % Lead-Quote |
|---|---|---|
| 100 € | 57 | 1.910 |
| 150 € | 38 | 1.270 |
| 200 € | 29 | 970 |
| 250 € | 23 | 770 |

Der Planwert 150 € ergibt **38 Leads und 1.270 Sessions im Monat** — gegenüber
1.850 Sessions beim Shop nach der Korrektur in
[`phase4-sortiment-und-materialwert.md`](./phase4-sortiment-und-materialwert.md).
Rund ein Drittel weniger Reichweite für dasselbe Ergebnis.

### Der Break-even ist die eigentliche Nachricht

Im Leadmodell gibt es keinen Wareneinsatz. Der Erlös ist fast vollständig
Deckungsbeitrag. Damit sind die Fixkosten gedeckt bei:

```
350 € Fixkosten  ÷  150 € je Lead  =  2,3 Leads pro Monat
```

**Zwei bis drei Leads im Monat, und das Modell trägt sich selbst.** Beim Shop
liegt dieselbe Marke bei 4.714 € Umsatz, also rund sieben Bestellungen. Der
Unterschied ist nicht graduell: Das Leadmodell kann jahrelang klein vor sich
hin laufen, ohne Geld zu verbrennen. Der Shop kann das nicht.

Das ist der stärkste Einzelbefund dieser Phase — stärker als jede Umsatzzahl.
Ein Modell, dessen Break-even bei drei Vorgängen im Monat liegt, hat praktisch
kein Abbruchrisiko. Es hat ein Stagnationsrisiko, und das ist eine andere und
mildere Krankheit.

### Variante B — Retainer

Ein Partnerbetrieb zahlt einen festen Monatsbetrag für Gebietsexklusivität und
erhält alle Anfragen seines Bezirks.

| Retainer je Partner | Partner für 5.724 € |
|---|---|
| 300 € | 19 |
| 400 € | 15 |
| 600 € | 10 |

Österreich hat rund 94 politische Bezirke. Fünfzehn Partner bedeuten je Partner
etwa sechs Bezirke — geografisch plausibel, ohne dass ein Gebiet zu dünn
besetzt wäre.

Der Vorteil ist der Bestandseffekt aus
[`skalierung-und-passivitaet.md`](./skalierung-und-passivitaet.md): Der Erlös
läuft weiter, auch wenn ein Monat schwach ist. Das ist die einzige der beiden
Varianten, die die Vorgabe „automatisch passive Einkünfte" tatsächlich erfüllt.

Der Nachteil ist ebenso klar: Ein Partner, der zahlt und nichts bekommt,
kündigt — und erzählt es in einer überschaubaren Branche weiter.

## Gate 9 — Zwei Stufen, in dieser Reihenfolge

> **Entscheidung: Das Leadmodell wird als zweistufiges Erlösmodell geführt.**
>
> **Stufe A — Erlös je Lead**, bis der Anfragefluss über mindestens drei Monate
> belegt ist. Kein Partner zahlt im Voraus für etwas, das es noch nicht gibt.
>
> **Stufe B — Grundgebühr plus reduzierter Leadpreis**, sobald der Fluss steht.
> Also nicht der reine Retainer, sondern die Mischform: eine Grundgebühr von
> etwa 150–250 € für Gebietsexklusivität und Nennung, dazu 60–100 € je
> vermittelter Anfrage.
>
> Begründung: Die Mischform verteilt das Risiko. Der Partner zahlt weniger
> vorab und trägt den Rest nur bei tatsächlicher Leistung; der Betreiber bekommt
> einen planbaren Sockel, ohne den Anfragefluss garantieren zu müssen. Der reine
> Retainer wird **nicht vorgezogen**, weil er genau dann kündigt, wenn es am
> meisten wehtut — in einem schwachen Quartal am Anfang.

Bei 15 Partnern mit 200 € Sockel und 38 Anfragen zu 80 € ergibt das
3.000 + 3.040 = **6.040 €**, also über der benötigten Marke — mit der Hälfte
des Erlöses in wiederkehrender Form.

## Die Obergrenze des Modells liegt nicht dort, wo man sie vermutet

Nicht die Zahl betroffener Gebäude begrenzt das Modell, sondern die Zahl der
Menschen, die **tatsächlich messen**.

Ein Sanierungslead entsteht erst nach einem Messwert über dem Referenzwert von
300 Bq/m³. Ohne Messung gibt es keine belegte Betroffenheit, also keinen
qualifizierten Lead — nur ein Interessensbekunden, und dafür zahlt kein Betrieb
150 €.

Der Bestand betroffener Gebäude in Österreich ist groß, aber er ist ein
**Bestand**, kein Zufluss. Der Zufluss ist die jährliche Zahl der Messungen,
und die ist nirgends öffentlich beziffert. Sie ist damit die dritte unbelegte
Zahl des Projekts — neben Rohmarge und Suchvolumen.

Daraus folgt etwas Konstruktives: Die Seite darf nicht darauf warten, dass
jemand mit einem Messwert vorbeikommt. **Sie muss die Messung auslösen.** Damit
ist die Vermittlung an eine anerkannte Messstelle — in
[`phase8-compliance.md`](./phase8-compliance.md) noch als Margenverlust
gegenüber dem verworfenen Dosimeter-Verkauf beschrieben — in Wahrheit der
zentrale Akt des Geschäftsmodells und nicht sein Wermutstropfen. Wer die
Messung anstößt, erzeugt den Lead, den er später verkauft.

**Neue Kennzahl für Stufe 2:** Vermittelte Messungen je Monat. Sie ist der
Frühindikator für alles Weitere, mit einem Vorlauf von etwa drei Monaten —
solange dauert eine normgerechte Langzeitmessung.

## Vergleich mit dem Shopmodell nach allen bisherigen Gates

| Kriterium | Radon-Shop | Leadmodell |
|---|---|---|
| Benötigter Monatserlös | 24.200 € | 5.724 € |
| Break-even | ~4.714 € (7 Bestellungen) | ~350 € (2–3 Leads) |
| Sessions für Zielgröße | 1.850 | 1.270 |
| Kapital bis erste Einnahme | 2.700 € | < 1.000 € |
| Abhängig von Lieferanten | ja, Gate 1/2/3/6 | nein |
| Abhängig von Partnern | nein | ja, 15 Partner à ~7 % Erlös |
| Wiederkehrende Erlöse | nein | ja, in Stufe B |
| Restaufwand pro Monat | 6,5–12 h | 4–6 h geschätzt |
| Rechtliche Hürden | B2B-Ausschluss, Produkthaftung | Einwilligung und Datenweitergabe |
| Engpass | Rohmarge | Zahl der Messungen |

### Was der Vergleich nicht sagt

Er sagt nicht, dass das Leadmodell besser ist. Er sagt, dass es **billiger
scheitert und billiger wartet**. Das Shopmodell erreicht bei Erfolg einen
höheren absoluten Umsatz und baut einen Kundenstamm mit Wiederkaufwert auf;
das Leadmodell bleibt ein Vermittlungsgeschäft mit begrenzter Skalierung nach
oben — mehr als 20 bis 25 Partner sind in Österreich nicht unterzubringen,
ohne dass Gebiete zu klein werden.

Die Obergrenze des Leadmodells liegt damit bei überschlägig 8.000–12.000 €
Monatserlös. Das reicht für die Zielgröße mit Reserve, aber es ist keine
Wachstumsgeschichte. Wer 3.000 € netto will, ist bedient. Wer 10.000 € will,
braucht den Shop oder ein zweites Themenfeld.

## Risiken, die dem Shop nicht entsprechen

| Risiko | Wirkung | Gegenmaßnahme, kostenlos |
|---|---|---|
| Partner beschwert sich über Leadqualität | Kündigung, Weitererzählen | Messwert als Qualifizierung; Erstattung bei nachweislich falschen Kontaktdaten |
| Partner reagiert zu langsam | Lead verbrennt, Betreiber wird verantwortlich gemacht | Rückmeldefrist im Partnervertrag, Frage 5 in Anschreiben B fragt das bereits ab |
| Partner übergeht die Vermittlung | Erlösausfall | Erlös je Lead statt Provision am Auftrag — Abrechnung hängt nicht am Zustandekommen |
| Datenweitergabe ohne Rechtsgrundlage | Beschwerde, Strafe | Einwilligung mit benannten Empfängerkategorien, Information nach Art. 13 |
| Zu wenige Messungen | Modell stagniert | Inhalte auf Messauslösung ausrichten, nicht auf Sanierungsberatung |

Der dritte Punkt verdient Hervorhebung: **Abrechnung je Lead, nicht als
Erfolgsprovision.** Eine Provision am zustande gekommenen Auftrag klingt fairer,
setzt aber voraus, dass der Betreiber erfährt, ob ein Auftrag zustande kam — und
das erfährt er nur, wenn der Partner es meldet. Das ist keine Grundlage. Der
Leadpreis wird fällig bei Übergabe der qualifizierten Anfrage, unabhängig vom
weiteren Verlauf.

## Auswirkung auf die übrigen Dokumente

| Dokument | Änderung |
|---|---|
| `STATUS.md` | Zahlen der Leadspalte präzisiert: 5.724 € statt ~6.000 €, Break-even ergänzt |
| `phase9-meilensteine-und-abbruch.md` | Neue Kennzahl „vermittelte Messungen je Monat" in Stufe 2 |
| `phase8-compliance.md` | Die Messvermittlung ist kein Margenverlust, sondern der Kern der Leadstrecke |
| `anschreiben-entwuerfe.md` | Entwurf B bleibt gültig; Frage 4 und 5 sind die Preis- und Qualitätsfragen |

## Was offen bleibt

- **Jährliche Zahl der Radonmessungen in Österreich** — nicht öffentlich
  beziffert, entscheidet die Obergrenze des Modells.
- **Zahlungsbereitschaft der Partnerbetriebe** — 150 € je Lead ist abgeleitet
  aus dem Auftragswert, nicht erfragt. Klärt Anschreiben B, Frage 4.
- **Regionale Abdeckung** — ob sich in allen Bundesländern Partner finden,
  klärt ebenfalls Anschreiben B.

Beide offenen Punkte hängen an Anschreiben B — das damit vom „kann parallel
laufen" zum zweiten Gate-Instrument wird. Wenn das Shopmodell an Gate 1, 2, 3
oder 6 scheitert, ist Anschreiben B nicht die Alternative, sondern der Hauptweg.

## Quellen

- [Freie Gewerbe Österreich: Liste, Anmeldung und Kosten](https://q-fi.at/lexikon/freie-gewerbe-oesterreich/)
- [Gewerbeanmeldung, Bundesministerium für Wirtschaft, Energie und Tourismus](https://www.bmwet.gv.at/Themen/Unternehmen/Gewerbe/Gewerbeanmeldung.html)
- [Gewerbeanmeldung, Unternehmensserviceportal](https://www.usp.gv.at/gruendung/EAP/gewerbeanmeldung.html)
- [Reglementierte und freie Gewerbe in alphabetischer Reihenfolge, Stadt Wien](https://www.wien.gv.at/wirtschaft/gewerbe/gewerbeverfahren/reglementiert.html)
- [Arbeitsvermittlung als freies Gewerbe, WKO Wien](https://www.wko.at/wien/gewerbe-handwerk/gewerbliche-dienstleister/arbeitsvermittler/arbeitsvermittlung-freies-gewerbe)
- [Gewerbeanmeldung Österreich: Gewerbearten und Fehler, Brandauer Rechtsanwälte](https://brandauer-rechtsanwaelte.at/2026/03/23/gewerbeanmeldung-gewerberecht-oesterreich/)
