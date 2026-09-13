# Messwert-Einordnung — Fachgrundlage und Werkzeugvorgabe

Stand: 2026-08-14. In [`phase7b-messstrecke.md`](./phase7b-messstrecke.md) rückte
der Messwert-Einordner vom vierten auf den ersten Platz der geplanten Rechner:
Er ist der Inhalt mit der höchsten Absicht und zugleich der Rückkehrpunkt des
Erinnerungsdienstes. Was er ausgeben soll, stand nirgends.

Die Ausarbeitung fördert **drei Korrekturen an eigenen Annahmen** zutage, davon
zwei mit erheblicher Wirkung auf die Mengenplanung.

## Der fachliche Rahmen

| Größe | Wert | Quelle |
|---|---|---|
| Referenzwert | **300 Bq/m³ im Jahresmittel**, gesetzlich festgelegt | Radonschutzverordnung |
| Vergleichsgrundlage | **Langzeitmessung über mindestens sechs Monate** | Radonschutzverordnung |
| Haushalte über dem Referenzwert | **rund 6 %** | Fachstelle für Radon |
| Empfehlung bei Überschreitung | bauliche Sanierung | AGES, Land Oberösterreich |
| Häufigste, wirksamste und günstigste Sanierungsform | Unterbodenabsaugung nach **ÖNORM S 5280-3** | Land Oberösterreich |

Bemerkenswert: Für die Sanierung im Bestand gilt **ÖNORM S 5280-3**, nicht die
in allen bisherigen Dokumenten zitierte S 5280-2. Die -2 regelt die
bautechnische Vorsorge im Neubau, die -3 die Sanierung. Das ist keine Korrektur
einer falschen Aussage — die bisherigen Verweise betrafen den Neubau —, aber es
ist die Norm, auf die sich die gesamte Leadstrecke stützt, und sie war
nirgends genannt.

## Korrektur 1 — die Messung dauert sechs Monate, nicht drei

`phase7b-messstrecke.md` rechnet durchgehend mit „rund drei Monate" Messdauer
und leitet daraus den Vorlauf des Frühindikators und die Lockerung der
Stufe-2-Abbruchmarke ab. Nach der Radonschutzverordnung ist für den Vergleich
mit dem Referenzwert eine **Langzeitmessung über mindestens sechs Monate**
erforderlich.

Damit verdoppelt sich die tote Zeit zwischen Besuch und verwertbarem Ergebnis.
Wer im Monat 4 die erste Messung anstößt, hat frühestens im **Monat 10** einen
qualifizierten Lead daraus — nicht im Monat 7.

## Korrektur 2 — die Ende-zu-Ende-Quote war zu hoch angesetzt

`phase7b-messstrecke.md` nennt für Strecke 2 eine Ende-zu-Ende-Quote von
„rund 0,5–1,5 %". Multipliziert man die dort selbst angegebenen Teilquoten aus,
kommt man auf 0,08–0,72 % — die genannte Spanne war **rechnerisch nicht aus den
eigenen Zahlen ableitbar**.

Mit den jetzt belegten Werten wird sie noch kleiner. Die Überschreitungsquote
lag dort bei geschätzten 10–20 %; nun ist bekannt, dass **rund 6 % aller
Haushalte** den Referenzwert überschreiten. Unter Messenden liegt der Anteil
höher — wer misst, hat eher einen Anlass —, aber 20 % waren zu optimistisch.
Und die Rückkehrquote nach sechs statt drei Monaten fällt.

```
Session
  → Dosimeter angefordert                 5 – 10 %
  → Erinnerung angenommen                40 – 60 %
  → kommt nach 6 Monaten zurück          30 – 50 %
  → Wert über 300 Bq/m³                   8 – 15 %
= Ende zu Ende                          0,05 – 0,45 %,  Planwert 0,15 %
```

Bei 0,15 % bräuchten 23 Leads aus Strecke 2 rund **15.000 Besuche im Monat**.
Das ist dieselbe Größenordnung, an der in
[`content-und-leadgen.md`](./content-und-leadgen.md) bereits die Displaywerbung
gescheitert ist.

## Gate 14 — Strecke 2 trägt die Mengenplanung nicht

> **Entscheidung: Die Strecke „Messung anstoßen → sechs Monate warten → Lead"
> wird nicht mehr als tragende Leadquelle geführt.** Die Mengenplanung stützt
> sich auf zwei andere Quellen:
>
> 1. **Strecke 1** — Besucher, die bereits einen Messwert haben und ihn
>    einordnen wollen. Hohe Absicht, kurzer Weg, kleines Volumen.
> 2. **Gruppe C** — Kellersanierung, aufsteigende Feuchte, Bauwerksabdichtung.
>    Kein Radonbezug, kein Referenzwert, keine Wartezeit. Diese Anfragen gehen
>    an dieselben Partnerbetriebe.
>
> Begründung: Sechs Monate Messdauer, multipliziert mit rund 90 %, die den
> Referenzwert nicht überschreiten, und den Abbrüchen dazwischen, ergeben eine
> Ausbeute, die kein vertretbares Reichweitenziel trägt.

**Gate 10 bleibt gültig, sein Zweck verschiebt sich.** Der Erinnerungsdienst ist
weiterhin richtig — er ist die einzige Möglichkeit, aus einem anonymen Besucher
eine Beziehung zu machen, und er ist das Alleinstellungsmerkmal gegenüber jedem
Leadportal. Aber er ist **Bindung und Alleinstellung, kein Mengenlieferant**.
Wer ihn als Anfragenquelle plant, plant an der Physik der Messdauer vorbei.

### Neue Mengenrechnung

| Quelle | Leads/Monat | Quote | Sessions |
|---|---|---|---|
| Strecke 1 — Messwert vorhanden | 10 | 6 % | ~170 |
| Gruppe C — Feuchte und Abdichtung | 28 | 2 % | ~1.400 |
| Strecke 2 — angestoßene Messung | Zugabe, nicht geplant | 0,15 % | — |
| **Summe** | **38** | | **~1.570** |

Das ist **weniger** als die 2.550 aus `phase7b-messstrecke.md` und weniger als
die 1.850 des Shopmodells — allerdings um den Preis einer unbequemen Einsicht:

> **Der Motor des Leadmodells sind die Feuchte- und Abdichtungsthemen, nicht
> Radon.** Radon liefert die Alleinstellung, die Glaubwürdigkeit und die
> hochwertigsten Einzelanfragen. Das Volumen liefert der Keller.

Das widerspricht nichts, es schärft: In
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md) steht bereits,
Gruppe C trage die Reichweite und Radon die Alleinstellung. Neu ist nur, wie
deutlich das Verhältnis ausfällt — und dass die Mengenplanung entsprechend
umgestellt gehört.

## Was der Einordner ausgeben soll

Vorgabe für die Umsetzung. Eingabe ist ein Messwert in Bq/m³ plus die Angabe,
über welchen Zeitraum gemessen wurde.

### Fall A — Langzeitmessung ab sechs Monaten

| Messwert | Ausgabe |
|---|---|
| **unter 300 Bq/m³** | Der gesetzliche Referenzwert ist eingehalten. Keine Maßnahme vorgeschrieben. Hinweis: Der Referenzwert ist ein gesetzlicher Bezugswert, keine Grenze zwischen unbedenklich und gefährlich — eine Senkung ist auch darunter möglich und bei einfachen Maßnahmen oft günstig zu erreichen. |
| **über 300 bis 1.000 Bq/m³** | Der Referenzwert ist überschritten. Eine bauliche Sanierung wird empfohlen. Übliche Maßnahme: Unterbodenabsaugung nach ÖNORM S 5280-3, ergänzend Abdichtung erdberührter Bauteile. |
| **über 1.000 Bq/m³** | Deutliche Überschreitung. Bauliche Sanierung empfohlen, Planung durch einen fachkundigen Betrieb, Wirksamkeitskontrolle durch Nachmessung. |

### Fall B — Kurzzeitmessung

Ein Kurzzeitwert darf **nicht** mit dem Referenzwert verglichen werden; der
Vergleich setzt die Langzeitmessung über mindestens sechs Monate voraus. Zum
Zusammenhang zwischen Kurzzeit- und Jahresmittelwert gibt es eine eigene
Untersuchung des zuständigen Ministeriums.

Ausgabe deshalb: Der Wert ist ein **Hinweis, kein Ergebnis**. Empfehlung, eine
Langzeitmessung bei einer ermächtigten Stelle zu veranlassen — womit der
Einordner unmittelbar in die Messstrecke führt, ohne etwas zu behaupten.

### Was der Einordner nicht tut

Drei Grenzen, die in der Ausgabe stehen müssen und nicht im Impressum:

1. **Keine Aussagen zu Gesundheit oder persönlichem Risiko.** Der Rechner ordnet
   einen Messwert rechtlich und bautechnisch ein. Alles Weitere gehört zur
   Fachstelle für Radon und zu den zuständigen Stellen.
2. **Keine Bewertung fremder Messungen als Ergebnis.** Verlässlich ist nur eine
   Messung durch eine ermächtigte Überwachungsstelle — siehe
   [`phase10-datengrundlage-gebietsabfrage.md`](./phase10-datengrundlage-gebietsabfrage.md)
   und `phase8-compliance.md`.
3. **Keine Sanierungszusage.** Welche Maßnahme im Einzelfall taugt, entscheidet
   die Bausubstanz, nicht der Messwert. Der Rechner nennt die übliche Maßnahme
   und übergibt an einen Betrieb.

Diese drei Grenzen sind kein juristischer Ballast, sondern das, was den
Unterschied zu einem Leadportal ausmacht. Wer bei einem radioaktiven Gas
zurückhaltend formuliert, wird eher geglaubt als jemand, der Gewissheit
verkauft.

## Auswirkung auf die übrigen Dokumente

| Dokument | Änderung |
|---|---|
| `phase7b-messstrecke.md` | Messdauer sechs statt drei Monate; Ende-zu-Ende-Quote korrigiert; Strecke 2 nicht mehr tragend |
| `phase9-meilensteine-und-abbruch.md` | Der Frühindikator „angeforderte Messungen" hat sechs Monate Vorlauf, nicht drei — die Lockerung der Stufe-2-Marke greift damit erst recht |
| `phase3b-leadmodell.md` | Der Engpass ist nicht mehr die Zahl der Messungen, sondern die Reichweite in Gruppe C |
| `phase7-inhalte-und-funnel.md` | Gruppe C rückt von der Reichweitenergänzung zur Hauptquelle der Anfragen |
| `gate-register.md` | Gate 14 aufgenommen, Zweck von Gate 10 präzisiert |

## Was offen bleibt

| Größe | Stand |
|---|---|
| Überschreitungsquote unter Messenden | 6 % aller Haushalte belegt; der Anteil unter Messenden bleibt geschätzt mit 8–15 % |
| Rückkehrquote nach sechs Monaten | Schätzung 30–50 %, unbelegt |
| Lead-Quote in Gruppe C | 2 % angenommen, ungeprüft — hängt jetzt die ganze Mengenplanung daran |

Die letzte Zeile ist die neue schwächste Stelle des Leadmodells. Sie ersetzt die
Zahl der Messungen, die bis heute als Engpass galt.

## Quellen

- [Radon in Österreich — Kurzfassung 2022, Fachstelle für Radon (PDF)](https://www.radon.gv.at/fileadmin/daten-radon/6_Downloads/Berichte_und_Leitf%C3%A4den/Radon_in_%C3%96sterreich_Kurzfassung_2022.pdf)
- [Radon — Risiko, Radonmessung und Schutz, AGES](https://www.ages.at/umwelt/radioaktivitaet/radon)
- [Radon — Messung und Bewertung, Fachstelle für Radon](https://www.radon.gv.at/infomaterialien/downloads/radon-messung-und-bewertung)
- [Radon Messung und Bewertung, Land Oberösterreich (PDF)](https://www.land-oberoesterreich.gv.at/files/publikationen/us_Radon_Messung_Bewertung_AGES_A5.pdf)
- [Radon, Land Oberösterreich](https://www.land-oberoesterreich.gv.at/radon.htm)
- [Radon-Kurzzeitmessungen, BMLUK](https://www.bmluk.gv.at/themen/klima-und-umwelt/strahlenschutz/radon/Radon-Kurzzeitmessungen.html)
- [Studie Radon-Kurzzeitmessungen, BMLUK](https://www.bmluk.gv.at/service/veroeffentlichungen/studien-gutachten-umfragen-neu/bmk-studien/studie-radon-kurzzeitmessungen.html)
