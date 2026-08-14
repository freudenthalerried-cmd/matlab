# Phase 7b — Die Messstrecke

Stand: 2026-08-14. In [`phase3b-leadmodell.md`](./phase3b-leadmodell.md) wurde
die Messung zum „zentralen Akt des Geschäftsmodells" erklärt, aber nicht
ausgearbeitet. Das wird hier nachgeholt — und das Ergebnis korrigiert eine Zahl
aus derselben Phase nach oben.

## Der rechtliche Rahmen

Radonmessung ist eine ermächtigte Tätigkeit nach dem Strahlenschutzgesetz 2020.
Die Liste der ermächtigten Überwachungsstellen führt das
Bundesministerium (BMLUK). Namentlich belegt:

| Stelle | Status |
|---|---|
| AGES, Abteilung Radon und Radonökologie | ermächtigte Überwachungsstelle nach StrSchG, akkreditiert als Prüfstelle nach EN ISO/IEC 17025 |
| Prüf-, Überwachungs- und Zertifizierungsstelle der Stadt Wien (MA 39) | ermächtigte Dosismessstelle für Radon nach § 131 StrSchG 2020 |

Damit bleibt die Korrektur aus
[`phase8-compliance.md`](./phase8-compliance.md) gültig: Eine eigene Messung
oder ein eigener Dosimeterverkauf ist nicht zulässig. Der Weg führt über die
Vermittlung.

## Der Fund, der die Strecke umbaut

**Radonmessungen für Privathaushalte sind derzeit kostenlos.** Sie werden vom
Bund gefördert und von der Fachstelle für Radon bei der AGES in Linz
unentgeltlich angeboten; die Anforderung läuft online. Für Arbeitsplatzmessungen
kostet ein Messgerät samt Auswertung und Prüfbericht 30,12 € brutto
(25,10 € netto).

Das ist in beide Richtungen bedeutsam.

### Was daran gut ist

Die Einstiegshürde ist **null**. Es gibt keinen Preiseinwand, keine
Zahlungsabwicklung, keine Erklärungsnot. Ein Inhalt, der auf ein kostenloses
staatliches Angebot führt, ist so leicht zu bewerben wie kaum etwas anderes im
Bauumfeld. Der ursprüngliche Funnel-Gedanke — niedrigschwelliger Einstieg
zuerst — trägt sogar besser als geplant.

### Was daran das Modell trifft

Es gibt an dieser Stelle **keinen Erlös und keinen Kundendatensatz**. Niemand
zahlt, also entsteht keine Rechnung, kein Konto, kein Name. Und jeder kann das
Dosimeter direkt bei der AGES anfordern, ohne den Umweg über eine private
Seite — es gibt keinen Grund, sich irgendwo zu registrieren.

Damit fällt die Begründung aus
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md) endgültig weg,
der Einstieg erzeuge „einen Kundendatensatz" und „ein Käufer ist kein anonymer
Besucher mehr". Sie war schon geschwächt, als der Dosimeterverkauf als
unzulässig verworfen wurde. Jetzt ist sie hinfällig.

Dazu kommt die Zeit: Eine normgerechte Langzeitmessung dauert rund drei Monate.
Zwischen Besuch und verwertbarem Ergebnis liegt ein Quartal, in dem der
Besucher die Seite vergisst.

## Gate 10 — der Erfassungspunkt wandert nach vorn

> **Entscheidung: Erfasst wird beim Anstoß der Messung, nicht nach dem
> Ergebnis. Das Angebot ist ein Erinnerungs- und Einordnungsdienst.**
>
> Konkret: Wer über die Seite erfährt, dass die Messung kostenlos ist, bekommt
> zwei Dinge angeboten — die Anleitung, wie die Messung bei der ermächtigten
> Stelle angefordert wird, und, gegen Einwilligung, eine Erinnerung nach drei
> Monaten samt Einordnung des Messwerts. Der Erinnerungsdienst ist das Produkt,
> nicht die Messung.
>
> Begründung: Ohne Transaktion gibt es keinen automatischen Datensatz. Wer erst
> nach dem Ergebnis erfassen will, erfasst gar nicht — der Besucher kommt nach
> drei Monaten nicht von selbst zurück. Der Dienst verwandelt eine tote
> Wartezeit in eine begonnene Beziehung, und er ist ehrlich: Er verspricht
> genau das, was er leistet.

### Die Grenze, die dabei einzuhalten ist

Ein kostenloses staatliches Angebot darf nicht so vermittelt werden, als wäre
es eine eigene Leistung. Drei Dinge müssen auf der Seite unübersehbar stehen:

1. Die Messung ist **kostenlos** und wird von der AGES beziehungsweise einer
   anderen ermächtigten Stelle erbracht.
2. Sie kann **direkt dort** angefordert werden, ohne Umweg.
3. Die eigene Leistung ist die Erinnerung und die Einordnung — mehr nicht.

Wer das verwischt, verkauft de facto den Zugang zu etwas Kostenlosem. Das ist
nicht nur lauterkeitsrechtlich heikel, es zerstört auch das Einzige, was die
Seite in dieser Nische aufbauen kann: Glaubwürdigkeit.

## Was das rechnerisch bedeutet — eine Korrektur an Phase 3b

Phase 3b rechnete mit **3 % Lead-Quote auf Sessions** und kam auf 1.270
Sessions im Monat. Diese Quote unterstellt stillschweigend, dass der Besucher
**bereits gemessen hat**. Für den Teil des Publikums, der noch nicht gemessen
hat, ist der Weg viel länger.

Es gibt deshalb zwei Strecken mit sehr verschiedener Ausbeute:

### Strecke 1 — Besucher hat bereits einen Messwert

Sucht nach „Radonwert 450 zu hoch", „Radon Keller sanieren Kosten". Hohe
Absicht, kurzer Weg, kleines Volumen.

```
Session → Messwert-Einordnung → Sanierungsanfrage
Lead-Quote: 5–8 %
```

### Strecke 2 — Besucher hat noch nicht gemessen

Sucht nach „Radon Österreich", „Radonvorsorgegebiet", „Radon messen lassen".
Großes Volumen, drei Monate Verzögerung, mehrfacher Abfluss.

```
Session
  → Dosimeter angefordert                    5–10 %
  → Erinnerung angenommen (Einwilligung)     40–60 % davon
  → kommt mit Ergebnis zurück                40–60 % davon
  → Wert über 300 Bq/m³                      10–20 % davon
= Ende-zu-Ende rund 0,5–1,5 %
```

Die 10–20 % Überschreitungsquote sind bewusst über dem österreichweiten
Durchschnitt angesetzt: Wer misst, wohnt eher in einem betroffenen Gebiet und
hat eher einen Anlass. Beide Zahlen — Überschreitungsquote und Rückkehrquote —
sind **Schätzungen ohne Beleg**.

### Der gemischte Bedarf

Bei 38 Leads im Monat und angenommen 40 % aus Strecke 1, 60 % aus Strecke 2:

| Strecke | Leads | Quote | Sessions |
|---|---|---|---|
| 1 — bereits gemessen | 15 | 6 % | 250 |
| 2 — noch nicht gemessen | 23 | 1 % | 2.300 |
| **Summe** | **38** | | **~2.550** |

> **Korrektur: Das Leadmodell braucht rund 2.550 Sessions im Monat, nicht
> 1.270.** Die Zahl aus Phase 3b hat den Weg der noch nicht Gemessenen
> übersprungen.

## Was diese Korrektur am Modellvergleich ändert — und was nicht

| Kriterium | Radon-Shop | Leadmodell alt | Leadmodell korrigiert |
|---|---|---|---|
| Sessions für Zielgröße | 1.850 | 1.270 | ~2.550 |
| Break-even | 7 Bestellungen | 2–3 Leads | 2–3 Leads |
| Kapital bis erste Einnahme | 2.700 € | < 1.000 € | < 1.000 € |
| Zeit bis zum ersten Erlös | Wochen | Wochen | **plus ein Quartal Vorlauf** |

Der Reichweitenvorteil des Leadmodells **kehrt sich um**: Es braucht nun mehr
Besucher als der Shop, nicht ein Drittel weniger. Dazu kommt ein struktureller
Nachteil, der bisher nirgends stand — die dreimonatige Messdauer verschiebt den
ersten Erlös aus Strecke 2 um ein ganzes Quartal nach hinten.

Was bleibt: Der Break-even-Vorteil und der Kapitalvorteil sind unberührt. Ein
Modell, das sich ab zwei bis drei Vorgängen im Monat selbst trägt und unter
1.000 € Anlauf braucht, scheitert billiger — auch wenn es langsamer anläuft.
Die Aussage aus Phase 3b, das Leadmodell „scheitert und wartet billiger",
stimmt weiterhin. Die Aussage, es brauche weniger Reichweite, stimmt nicht.

**Für Gate 4 heißt das:** Die Modellwahl am Ende von Stufe 2 wird nicht
leichter, sie wird nur ehrlicher. Beide Modelle liegen im Reichweitenbedarf jetzt
in derselben Größenordnung — 1.850 gegen 2.550 Sessions. Entschieden wird
weiterhin an den Herstellerkonditionen, nicht am Traffic.

## Was daraus für die Inhalte folgt

Die Inhaltslandkarte in
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md) gewichtet
Gruppe A (Neubaupflicht) am stärksten. Nach dieser Phase ist das zu
korrigieren: Für das Leadmodell trägt **Gruppe B** — Betroffenheit im Bestand —
und dort gibt es zwei sehr unterschiedliche Inhaltstypen:

| Typ | Zweck | Beispiele |
|---|---|---|
| **Auslöser** | bringt Menschen zur Messung | „Radonmessung kostenlos anfordern", „Bin ich betroffen?", Gebietsabfrage |
| **Einordner** | fängt die ab, die schon einen Wert haben | „Was bedeutet 450 Bq/m³?", „Reicht Lüften?", Sanierungskosten |

Die Einordner sind wertvoller je Besucher, die Auslöser tragen das Volumen.
Beide werden gebraucht — und die Auslöser zuerst, weil ihre Wirkung erst ein
Quartal später ankommt.

Die vier Rechner aus Phase 7 bleiben richtig. Der **Messwert-Einordner** rückt
aber vom vierten auf den ersten Platz: Er ist zugleich der Einordner-Inhalt mit
der höchsten Absicht und der Rückkehrpunkt für den Erinnerungsdienst.

## Auswirkung auf das Stufenmodell

| Kennzahl | Stufe | Zielwert |
|---|---|---|
| Angeforderte Messungen je Monat (Frühindikator) | 2 | ab Monat 4 messbar |
| Rückkehrquote nach Erinnerung | 3 | ≥ 40 % |
| Beratungsanfragen je Bestellung | 3 | ≤ 0,2 (unverändert) |

Die Abbruchmarke in Stufe 2 — 0 Erstgeschäfte bei ≥ 800 Sessions — ist mit
Vorsicht anzuwenden: Aus Strecke 2 kann in Monat 6 noch nichts angekommen sein,
wenn die ersten Messungen in Monat 4 angestoßen wurden. **Der Frühindikator
„angeforderte Messungen" ersetzt in Stufe 2 das Erstgeschäft**, sonst bricht
das Modell an einer Frist ab, die physikalisch nicht einzuhalten war.

Das ist eine Lockerung eines selbst gesetzten Abbruchkriteriums, und sie ist
begründungsbedürftig. Die Begründung ist die Messdauer, nicht Nachsicht: Drei
Monate Messung plus Auswertung sind keine Verzögerung, sondern eine
Eigenschaft der Sache.

## Nebenstrecke Arbeitsplatzmessung

Der Preis ist jetzt belegt: 30,12 € brutto je Messgerät samt Auswertung und
Prüfbericht. Das bestätigt die Einschätzung in
[`segment-arbeitsplatzmessung.md`](./segment-arbeitsplatzmessung.md) — an der
Messung selbst ist nichts zu verdienen, der Wert liegt allein in der
Folgesanierung. Die Nebenstrecke bleibt Nebenstrecke.

## Risiko: die Förderung kann enden

Die Kostenfreiheit ist als „derzeit" gefördert beschrieben. Endet die Förderung,
verschiebt sich beides:

| | Volumen | Erlöschance |
|---|---|---|
| Förderung bleibt | hoch | keine an der Messung |
| Förderung endet | niedriger | Vermittlungsentgelt denkbar |

Das Modell ist gegen beide Fälle robust, weil der Erlös ohnehin erst in der
Sanierung entsteht. Es ist aber ein Grund, den Hinweis auf die Kostenfreiheit
als **änderbare Angabe** zu behandeln und nicht in Überschriften und
Seitentitel einzubauen.

## Was offen bleibt

| Größe | Stand |
|---|---|
| Überschreitungsquote unter Messenden | Schätzung 10–20 %, unbelegt |
| Rückkehrquote nach drei Monaten | Schätzung 40–60 %, unbelegt |
| Jährliche Zahl der Messungen in Österreich | weiterhin nicht öffentlich beziffert |
| Anteil Strecke 1 zu Strecke 2 | Annahme 40/60, prüfbar erst mit Suchvolumina |

Alle vier hängen an Messungen, die erst der Betrieb liefert — mit Ausnahme des
letzten, den das Keyword-Werkzeug aus Stufe 1 beantwortet.

## Quellen

- [Ermächtigungen gemäß Strahlenschutzgesetz 2020, BMLUK](https://www.bmluk.gv.at/themen/klima-und-umwelt/strahlenschutz/service-und-verwaltung/ermaechtigungen.html)
- [Strahlenschutz Serviceleistungen, AGES](https://www.ages.at/umwelt/radioaktivitaet/strahlenschutz-serviceleistungen)
- [Radonmessung, AGES Fachstelle für Radon](https://radonmessung.ages.at/)
- [Radonmessungen, Strahlenschutzlabor der Stadt Wien](https://www.wien.gv.at/forschung/laboratorien/ptpa/radonmessungen.html)
- [Strahlenschutz bei Radon, Unternehmensserviceportal](https://www.usp.gv.at/themen/betrieb-und-umwelt/laufender-betrieb/weitere-informationen-strahlenschutz/strahlenschutz-bei-radon.html)
- [Radon — Verpflichtungen österreichweit, BMLUK](https://www.bmluk.gv.at/themen/klima-und-umwelt/strahlenschutz/radon/arbeitgeber/verpflichtungen.html)
- [Radonschutz, Land Salzburg](https://www.salzburg.gv.at/themen/gesundheit/gesundheitsrecht-und-gesundheitsplanung/radonschutz)
