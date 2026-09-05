# Skalierbarkeit und passive Einkünfte

Stand: 2026-08-09. Ausgelöst durch die ergänzte Anforderung des Auftraggebers:
Das Modell soll **später skalieren** und **automatisch passive Einkünfte**
erzeugen.

Diese beiden Kriterien sind nicht nachrangig — sie ordnen die Kandidaten neu und
korrigieren eine Empfehlung, die zuvor zu schnell gegeben wurde.

## Korrektur: digitale BauKG-Vorlagen bestehen Gate 2 nicht

In [`strategie-modellvergleich.md`](./strategie-modellvergleich.md) wurden
digitale Fachprodukte aus dem BauKG-Umfeld als einfacherer Weg empfohlen. Diese
Empfehlung erging **ohne die Wettbewerbsprüfung**, die bei den Baustoffnischen
selbstverständlich war. Nachgeholt ergibt sie ein anderes Bild:

| Anbieter | Markt | Angebot |
|---|---|---|
| ABK | Österreich | SiGe-Plan nach ÖNORM B 2107, Dokumentvorlagen für das BauKG |
| wp software (BauKoord) | Österreich | Expertenvorlagen für Koordinationsmaßnahmen Hoch- und Tiefbau |
| WEKA Bausoftware | Deutschland | Jahreslizenz inklusive Aktualisierungsservice |
| Forum Verlag | Deutschland | SiGeKo-Fachinhalte nach BauStellV |
| Arbeitsinspektion | Österreich | **Erstellungshilfe SiGe-Plan kostenlos** |

Zwei Befunde wiegen schwer. Erstens betreiben ABK und WEKA bereits genau das
Abo-Modell mit Aktualisierungsservice, das als Alleinstellung gedacht war.
Zweitens setzt die kostenlose Erstellungshilfe der Arbeitsinspektion einen
Preisanker bei null.

**Reine SiGe-Plan-Vorlagen fallen damit durch Gate 2** — dieselbe Begründung,
mit der zuvor Brandschutz und Betoninstandsetzung verworfen wurden. Die
Konsistenz der Bewertung verlangt diese Konsequenz.

Was offenbleibt: Die etablierten Anbieter sind **Softwarehäuser mit schwerem
Werkzeug** für Planer und Baumeister. Ob darunter ein leichtes, eng
zugeschnittenes Produkt Platz hat, ist nicht geprüft — aber es wäre eine
Software mit Supportpflicht und damit das Gegenteil von passiv.

## Was die beiden neuen Kriterien tatsächlich verlangen

Drei Bedingungen müssen gleichzeitig erfüllt sein. Jede streicht Kandidaten:

| Bedingung | Streicht |
|---|---|
| Grenzkosten nahe null | jede physische Ware |
| Wiederkehrende Abrechnung | jedes Einmalgeschäft |
| Begrenzter Pflegeaufwand | jede Software mit Support |

### Der strukturelle Kernunterschied

Nicht die Marge trennt die Modelle, sondern der Bestandseffekt:

> **Der Shop beginnt jeden Monat bei null.** 54 Bestellungen im Januar bedeuten
> nichts für den Februar. Ein Abonnentenbestand trägt sich vor.

Nach zwei Jahren ist das der Unterschied zwischen einem Betrieb, der gerade Geld
verdient, und einem Vermögenswert, der Geld verdient. Rechnerisch:

```
90.000 € Jahresumsatz
  als Abo:     361 Verträge à 249 € — im Folgejahr großteils bestehend
  als Handel:  650 Bestellungen à 450 € — im Folgejahr vollständig neu zu holen
```

## Rangfolge nach Skalierbarkeit und Passivität

| Modell | Skaliert | Passiv | Umsatzdecke | Urteil |
|---|---|---|---|---|
| Content-/Affiliate-Seite Bau | gut | **am besten** | mittel | langsamster Aufbau, geringste Kontrolle, volatile Einnahmen |
| Digitale Produkte mit Abo | gut | mittel | hoch | Nische kontestiert, Pflege bei Normänderung zwingend |
| Radon-Shop | mäßig | **schlecht** | 4–21 Mio. € (AT) | wächst nur mit mehr Arbeit |
| SaaS | sehr gut | **am schlechtesten** | hoch | Support und Haftung dauerhaft |

Der Radon-Shop erfüllt die neuen Kriterien am schlechtesten. Lieferantenprobleme,
Speditionsschäden, Preisänderungen und Retouren skalieren mit dem Umsatz mit —
mehr Umsatz bedeutet mehr Arbeit, nicht weniger. Die Automatisierung aus Phase 6
senkt den Aufwand je Bestellung, hebt ihn aber nicht auf.

## Was sich am Shop nachrüsten ließe

Falls der Shop weiterverfolgt wird, gibt es drei Hebel in Richtung
wiederkehrender Umsätze — keiner macht ihn passiv, alle verbessern den
Bestandseffekt:

1. **Rahmenverträge mit ausführenden Betrieben.** Ein Abdichter mit acht
   Projekten im Jahr ist acht Bestellungen wert, wenn er gebunden ist, und eine,
   wenn nicht.
2. **Projektbezogene Nachbestellung.** Radonvorsorge ist kein Einzelartikel,
   sondern ein Bauablauf mit mehreren Lieferzeitpunkten.
3. **Verbrauchsmaterial statt Systemkomponenten.** Bänder, Kleber und
   Durchführungen werden nachgekauft; Bahnen nur einmal je Projekt.

## Die unbequeme Feststellung

Vollständig passiv existiert nicht. Normen ändern sich, Lieferanten ändern
Preise, Werbekonten driften ab. Der realistische Bestwert liegt bei **wenigen
Stunden im Quartal** — und diese Stunden kann nur jemand mit der nötigen
Fachkenntnis leisten. Genau darin liegt der Wert des Modells, weshalb sie sich
auch nicht wegautomatisieren lässt.

## Offene Entscheidung

Drei Bedingungen stehen gegeneinander: Passivität, Tempo und Alleinstellung.
Alle drei zugleich sind nicht zu haben. Der Auftraggeber muss festlegen, welche
gelockert wird:

| Verzicht auf | Ergebnis |
|---|---|
| Passivität | Radon-Shop bauen — schnellster Weg zu Umsatz, dauerhafter Aufwand |
| Tempo | Content-Vermögenswert aufbauen — passivste Form, 24–36 Monate |
| Alleinstellung | in ein besetztes Feld eintreten — Wettbewerb über Preis oder Fokus |

Bis diese Festlegung vorliegt, werden keine Herstelleranfragen versendet, keine
Gründungsschritte gesetzt und keine Ausgaben ausgelöst.
